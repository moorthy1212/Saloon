import { getBookableSlots, getAppointmentSchedule, isAppointmentDate } from '../_lib/appointments'
import { getLoginAttemptKey, isSameOrigin, jsonResponse, type Env } from '../_lib/auth'
import { sendAppointmentNotification } from '../_lib/appointment-notifications'

const RATE_LIMIT = 3
const RATE_WINDOW_MS = 10 * 60 * 1000
const SERVICES = [
  'Haircut & shaving',
  'Hair dye / hair color',
  'Shaving',
  'Baby haircut',
  'Haircut',
  'Wash & styling',
  'Hair colour & care',
] as const

type CustomerDetails = {
  name: string
  phone: string
  email: string
  service: typeof SERVICES[number]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function encodeBase64(value: Uint8Array) {
  let binary = ''
  for (const byte of value) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function decodeBase64(value: string) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0))
}

async function getEncryptionKey(secret: string) {
  let keyBytes: Uint8Array
  try {
    keyBytes = decodeBase64(secret)
  } catch (error) {
    throw new Error('Booking encryption key must be valid base64.', { cause: error })
  }
  if (keyBytes.byteLength !== 32) throw new Error('Booking encryption key must decode to 32 bytes.')

  return crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt'])
}

async function encryptCustomerDetails(details: CustomerDetails, secret: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    await getEncryptionKey(secret),
    new TextEncoder().encode(JSON.stringify(details)),
  )
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(ciphertext), iv.byteLength)
  return encodeBase64(combined)
}

function normalizeCustomerDetails(payload: Record<string, unknown>): CustomerDetails | null {
  if (
    typeof payload.name !== 'string'
    || typeof payload.phone !== 'string'
    || typeof payload.email !== 'string'
    || typeof payload.service !== 'string'
  ) return null

  const name = payload.name.trim()
  const phone = payload.phone.trim().replace(/[\s()-]/g, '')
  const email = payload.email.trim().toLowerCase()
  const digits = phone.replace(/^\+/, '')
  const normalizedPhone = digits.startsWith('91') ? digits : `91${digits}`
  const service = SERVICES.find((item) => item === payload.service)
  if (
    name.length < 2
    || name.length > 80
    || name.split('').some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)
    || !/^91[6-9]\d{9}$/.test(normalizedPhone)
    || email.length > 254
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    || !service
  ) return null

  return {
    name,
    phone: `+${normalizedPhone}`,
    email,
    service,
  }
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!isSameOrigin(request)) return jsonResponse({ error: 'Forbidden.' }, 403)
  if (!env.BOOKING_ENCRYPTION_KEY) {
    console.error('Appointment booking is unavailable because the encryption key is not configured.')
    return jsonResponse({ error: 'Online booking is temporarily unavailable.' }, 503)
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return jsonResponse({ error: 'Invalid request.' }, 400)
  }
  if (!isRecord(payload)) return jsonResponse({ error: 'Invalid request.' }, 400)

  const details = normalizeCustomerDetails(payload)
  const date = typeof payload.date === 'string' ? payload.date : ''
  const time = typeof payload.time === 'string' ? payload.time : ''
  if (!details || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time) || !isAppointmentDate(date)) {
    return jsonResponse({ error: 'Enter valid appointment details and choose a date within the next 30 days.' }, 400)
  }

  const attemptKey = `appointment:${await getLoginAttemptKey(request, env.ADMIN_SESSION_SECRET)}`
  const now = Date.now()
  const attempts = await env.DB.prepare(
    `INSERT INTO chatbot_attempts (ip_hash, attempts, window_started) VALUES (?, 1, ?)
     ON CONFLICT(ip_hash) DO UPDATE SET
       attempts = CASE WHEN chatbot_attempts.window_started <= ? THEN 1 ELSE chatbot_attempts.attempts + 1 END,
       window_started = CASE WHEN chatbot_attempts.window_started <= ? THEN excluded.window_started ELSE chatbot_attempts.window_started END
     RETURNING attempts`,
  ).bind(attemptKey, now, now - RATE_WINDOW_MS, now - RATE_WINDOW_MS)
    .first<{ attempts: number }>()
  if (!attempts) {
    console.error('Appointment rate limit could not be recorded.')
    return jsonResponse({ error: 'Appointment booking is temporarily unavailable.' }, 503)
  }
  if (attempts.attempts > RATE_LIMIT) {
    return jsonResponse({ error: 'Too many booking attempts. Please try again in a few minutes.' }, 429)
  }

  const slotStart = `${date}T${time}`
  const schedule = await getAppointmentSchedule(env.DB)
  const booked = await env.DB.prepare('SELECT slot_start FROM appointments WHERE slot_start >= ? AND slot_start < ?')
    .bind(`${date}T00:00`, `${date}T24:00`)
    .all<{ slot_start: string }>()
  if (!getBookableSlots(date, schedule, new Set(booked.results.map(({ slot_start }) => slot_start))).includes(time)) {
    return jsonResponse({ error: 'That appointment time is no longer available. Please choose another time.' }, 409)
  }

  let customerCiphertext: string
  try {
    customerCiphertext = await encryptCustomerDetails(details, env.BOOKING_ENCRYPTION_KEY)
  } catch (error) {
    console.error('Appointment details could not be encrypted.', error)
    return jsonResponse({ error: 'Online booking is temporarily unavailable.' }, 503)
  }

  const bookingId = crypto.randomUUID()
  const inserted = await env.DB.prepare(
    `INSERT OR IGNORE INTO appointments (id, slot_start, customer_ciphertext, created_at)
     VALUES (?, ?, ?, ?)`,
  ).bind(bookingId, slotStart, customerCiphertext, now).run()
  if (!inserted.meta.changes) {
    return jsonResponse({ error: 'That appointment time is no longer available. Please choose another time.' }, 409)
  }

  const notification = await sendAppointmentNotification({
    slotStart,
    ...details,
    customerEmailNotified: false,
    salonEmailNotified: false,
  }, env)
  if (notification.customerSent || notification.salonSent) {
    try {
      await env.DB.prepare(
        `UPDATE appointments
         SET customer_email_notified = ?, salon_email_notified = ?, email_notified = ?
         WHERE id = ?`,
      ).bind(
        Number(notification.customerSent),
        Number(notification.salonSent),
        Number(notification.customerSent && notification.salonSent),
        bookingId,
      )
        .run()
    } catch (error) {
      console.error('Appointment email status could not be saved.', error)
    }
  }

  return jsonResponse({
    appointment: { id: bookingId, slotStart },
    notificationSent: notification.customerSent && notification.salonSent,
  }, 201)
}
