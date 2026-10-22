export type Env = {
  DB: D1Database
  ADMIN_USERNAME: string
  ADMIN_PASSWORD: string
  ADMIN_SESSION_SECRET: string
  AI: Ai
  DEEPSEEK_API_KEY?: string
  BOOKING_ENCRYPTION_KEY?: string
  BREVO_API_KEY?: string
  APPOINTMENT_EMAIL_FROM?: string
  SALON_NOTIFICATION_EMAIL?: string
}

const COOKIE_NAME = 'suburaaj_admin'
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000

function encodeBase64Url(value: ArrayBufferLike) {
  const bytes = new Uint8Array(value)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

async function getSigningKey(secret: string) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

export function isSameOrigin(request: Request) {
  return request.headers.get('Origin') === new URL(request.url).origin
}

export async function createSession(secret: string) {
  const expiresAt = Date.now() + SESSION_DURATION_MS
  const payload = encodeBase64Url(new TextEncoder().encode(String(expiresAt)).buffer)
  const signature = await crypto.subtle.sign('HMAC', await getSigningKey(secret), new TextEncoder().encode(payload))
  return `${payload}.${encodeBase64Url(signature)}`
}

export async function hasAdminSession(request: Request, secret: string) {
  const cookieHeader = request.headers.get('Cookie') ?? ''
  const session = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE_NAME}=`))
  const token = session?.slice(COOKIE_NAME.length + 1)
  if (!token) return false

  const [payload, encodedSignature, ...rest] = token.split('.')
  if (!payload || !encodedSignature || rest.length > 0) return false

  try {
    const expiresAt = Number(new TextDecoder().decode(decodeBase64Url(payload)))
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return false
    return crypto.subtle.verify(
      'HMAC',
      await getSigningKey(secret),
      decodeBase64Url(encodedSignature),
      new TextEncoder().encode(payload),
    )
  } catch {
    return false
  }
}

export function sessionCookie(request: Request, token: string) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : ''
  return `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_DURATION_MS / 1000}${secure}`
}

export function clearedSessionCookie(request: Request) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : ''
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`
}

export function jsonResponse(body: unknown, status = 200, headers: HeadersInit = {}) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', ...headers },
  })
}

export async function getLoginAttemptKey(request: Request, secret: string) {
  const address = request.headers.get('CF-Connecting-IP') ?? 'local'
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${secret}:${address}`))
  return encodeBase64Url(digest)
}