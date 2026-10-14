import { getLoginAttemptKey, isSameOrigin, jsonResponse, type Env } from '../_lib/auth'

const RATE_LIMIT = 5
const RATE_WINDOW_MS = 10 * 60 * 1000
const DAILY_AI_LIMIT = 50
const MAX_QUESTION_LENGTH = 500
const AI_MODEL = '@cf/meta/llama-3.2-3b-instruct'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!isSameOrigin(request)) return jsonResponse({ error: 'Forbidden.' }, 403)

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return jsonResponse({ error: 'Invalid request.' }, 400)
  }

  if (!isRecord(payload) || typeof payload.question !== 'string' || typeof payload.language !== 'string') {
    return jsonResponse({ error: 'Invalid request.' }, 400)
  }

  const question = payload.question.trim()
  if (!question || question.length > MAX_QUESTION_LENGTH) {
    return jsonResponse({ error: `Question must be between 1 and ${MAX_QUESTION_LENGTH} characters.` }, 400)
  }
  if (payload.language !== 'en' && payload.language !== 'ta') {
    return jsonResponse({ error: 'Unsupported language.' }, 400)
  }

  const now = Date.now()
  const windowStart = now - RATE_WINDOW_MS
  const attemptKey = `chat:${await getLoginAttemptKey(request, env.ADMIN_SESSION_SECRET)}`
  await env.DB.prepare('DELETE FROM chatbot_attempts WHERE window_started < ?')
    .bind(now - 24 * 60 * 60 * 1000)
    .run()

  const attempts = await env.DB.prepare(
    `INSERT INTO chatbot_attempts (ip_hash, attempts, window_started) VALUES (?, 1, ?)
     ON CONFLICT(ip_hash) DO UPDATE SET
       attempts = CASE WHEN chatbot_attempts.window_started <= ? THEN 1 ELSE chatbot_attempts.attempts + 1 END,
       window_started = CASE WHEN chatbot_attempts.window_started <= ? THEN excluded.window_started ELSE chatbot_attempts.window_started END
     RETURNING attempts`,
  ).bind(attemptKey, now, windowStart, windowStart).first<{ attempts: number }>()
  if (!attempts) {
    console.error('Chat rate limit could not be recorded.')
    return jsonResponse({ error: 'Chat assistant is temporarily unavailable.' }, 503)
  }
  if (attempts.attempts > RATE_LIMIT) {
    return jsonResponse({ error: 'Chat limit reached. Please try again in a few minutes.' }, 429)
  }

  const utcDate = new Date(now).toISOString().slice(0, 10)
  const dayStart = Date.UTC(
    new Date(now).getUTCFullYear(),
    new Date(now).getUTCMonth(),
    new Date(now).getUTCDate(),
  )
  const dailyAttempts = await env.DB.prepare(
    `INSERT INTO chatbot_attempts (ip_hash, attempts, window_started) VALUES (?, 1, ?)
     ON CONFLICT(ip_hash) DO UPDATE SET
       attempts = CASE WHEN chatbot_attempts.window_started < ? THEN 1 ELSE chatbot_attempts.attempts + 1 END,
       window_started = CASE WHEN chatbot_attempts.window_started < ? THEN excluded.window_started ELSE chatbot_attempts.window_started END
     RETURNING attempts`,
  ).bind(`chat:daily:${utcDate}`, now, dayStart, dayStart).first<{ attempts: number }>()
  if (!dailyAttempts) {
    console.error('Daily chatbot usage could not be recorded.')
    return jsonResponse({ error: 'Chat assistant is temporarily unavailable.' }, 503)
  }
  if (dailyAttempts.attempts > DAILY_AI_LIMIT) {
    return jsonResponse({ error: 'The free daily assistant limit has been reached. Please try again tomorrow.' }, 429)
  }

  let result: unknown
  try {
    result = await env.AI.run(AI_MODEL, {
      messages: [
        {
          role: 'system',
          content: [
            'You are SURA, the friendly website assistant for Suburaaj Salon & Studio in Palayamkottai, Tirunelveli, Tamil Nadu.',
            'The salon has over 20 years of experience. Services listed on the site are haircuts, wash and styling, and hair colour and care.',
            'Answer in one or two complete, concise sentences in the language requested by the user.',
            'Only answer questions relevant to the salon or general hair care. Politely redirect unrelated questions.',
            'Never invent prices, phone numbers, booking availability, exact service details, or opening hours. Ask visitors to check the website or contact/visit the salon for details not listed.',
            'Do not ask for passwords, payment details, or other sensitive personal information.',
          ].join(' '),
        },
        {
          role: 'user',
          content: `${payload.language === 'ta' ? 'Reply in Tamil.' : 'Reply in English.'}\n\n${question}`,
        },
      ],
      max_tokens: 192,
      temperature: 0.3,
    })
  } catch (error) {
    console.error('Cloudflare Workers AI request failed.', error)
    return jsonResponse({ error: 'Chat assistant is temporarily unavailable.' }, 502)
  }

  if (!isRecord(result) || typeof result.response !== 'string' || !result.response.trim()) {
    console.error('Cloudflare Workers AI returned an invalid response.')
    return jsonResponse({ error: 'Chat assistant returned an invalid response.' }, 502)
  }

  return jsonResponse({ answer: result.response.trim() })
}
