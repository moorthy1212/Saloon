import {
  createSession,
  getLoginAttemptKey,
  isSameOrigin,
  jsonResponse,
  sessionCookie,
  type Env,
} from '../../_lib/auth'

async function matchesSecret(candidate: string, expected: string) {
  const encoder = new TextEncoder()
  const [candidateHash, expectedHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(candidate)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ])
  const candidateBytes = new Uint8Array(candidateHash)
  const expectedBytes = new Uint8Array(expectedHash)
  let difference = 0
  for (let index = 0; index < candidateBytes.length; index += 1) {
    difference |= candidateBytes[index] ^ expectedBytes[index]
  }
  return difference === 0
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!isSameOrigin(request)) return jsonResponse({ error: 'Forbidden.' }, 403)

  const attemptKey = await getLoginAttemptKey(request, env.ADMIN_SESSION_SECRET)
  const now = Date.now()
  const windowStart = now - 15 * 60 * 1000
  await env.DB.prepare('DELETE FROM login_attempts WHERE window_started < ?').bind(now - 24 * 60 * 60 * 1000).run()
  const attempts = await env.DB.prepare(
    'SELECT attempts, window_started FROM login_attempts WHERE ip_hash = ?',
  ).bind(attemptKey).first<{ attempts: number; window_started: number }>()
  if (attempts && attempts.window_started > windowStart && attempts.attempts >= 5) {
    return jsonResponse({ error: 'Too many login attempts. Try again later.' }, 429)
  }

  let credentials: { username?: unknown; password?: unknown }
  try {
    credentials = await request.json()
  } catch {
    return jsonResponse({ error: 'Invalid request.' }, 400)
  }

  const username = typeof credentials.username === 'string' ? credentials.username : ''
  const password = typeof credentials.password === 'string' ? credentials.password : ''
  if (username.length > 200 || password.length > 200) return jsonResponse({ error: 'Invalid credentials.' }, 401)

  const [usernameMatches, passwordMatches] = await Promise.all([
    matchesSecret(username, env.ADMIN_USERNAME),
    matchesSecret(password, env.ADMIN_PASSWORD),
  ])
  if (!usernameMatches || !passwordMatches) {
    await env.DB.prepare(
      `INSERT INTO login_attempts (ip_hash, attempts, window_started) VALUES (?, 1, ?)
       ON CONFLICT(ip_hash) DO UPDATE SET
         attempts = CASE WHEN login_attempts.window_started <= ? THEN 1 ELSE login_attempts.attempts + 1 END,
         window_started = CASE WHEN login_attempts.window_started <= ? THEN excluded.window_started ELSE login_attempts.window_started END`,
    ).bind(attemptKey, now, windowStart, windowStart).run()
    return jsonResponse({ error: 'Invalid credentials.' }, 401)
  }

  await env.DB.prepare('DELETE FROM login_attempts WHERE ip_hash = ?').bind(attemptKey).run()
  const token = await createSession(env.ADMIN_SESSION_SECRET)
  return jsonResponse({ authenticated: true }, 200, { 'Set-Cookie': sessionCookie(request, token) })
}