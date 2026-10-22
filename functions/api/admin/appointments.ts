import { getBookableSlots, getAppointmentSchedule, isAppointmentDate } from '../../_lib/appointments'
import { hasAdminSession, isSameOrigin, jsonResponse, type Env } from '../../_lib/auth'
import { sendCustomerAppointmentUpdate, sendAppointmentNotification } from '../../_lib/appointment-notifications'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function decodeBase64(value: string) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0))
}

async function decryptCustomerDetails(ciphertext: string, secret: string) {
  const keyBytes = decodeBase64(secret)
  if (keyBytes.byteLength !== 32) throw new Error('Booking encryption key must decode to 32 bytes.')

  const combined = decodeBase64(ciphertext)
  const iv = combined.slice(0, 12)
  const data = combined.slice(12)
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['decrypt'])
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
  const details: unknown = JSON.parse(new TextDecoder().decode(plaintext))
  const email = typeof details === 'object' && details !== null && 'email' in details
    ? details.email
    : undefined
  if (
    typeof details !== 'object'
    || details === null
    || !('name' in details)
    || typeof details.name !== 'string'
    || !('phone' in details)
    || typeof details.phone !== 'string'
    || (email !== undefined && typeof email !== 'string')
    || !('service' in details)
    || typeof details.service !== 'string'
  ) throw new Error('Stored appointment details are invalid.')

  return {
    name: details.name,
    phone: details.phone,
    ...(typeof email === 'string' ? { email } : {}),
    service: details.service,
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!await hasAdminSession(request, env.ADMIN_SESSION_SECRET)) {
    return jsonResponse({ error: 'Unauthorized.' }, 401)
  }
  if (!env.BOOKING_ENCRYPTION_KEY) {
    console.error('Appointment records cannot be decrypted because the encryption key is not configured.')
    return jsonResponse({ error: 'Appointment records are temporarily unavailable.' }, 503)
  }
  const encryptionKey = env.BOOKING_ENCRYPTION_KEY

  const result = await env.DB.prepare(
    `SELECT id, slot_start, customer_ciphertext, created_at,
       customer_email_notified, salon_email_notified
     FROM appointments ORDER BY slot_start DESC LIMIT 500`,
  ).all<{
    id: string
    slot_start: string
    customer_ciphertext: string
    created_at: number
    customer_email_notified: number
    salon_email_notified: number
  }>()

  try {
    const appointments = await Promise.all(result.results.slice().reverse().map(async (row) => ({
      id: row.id,
      slotStart: row.slot_start,
      createdAt: row.created_at,
      emailNotified: row.customer_email_notified === 1 && row.salon_email_notified === 1,
      ...await decryptCustomerDetails(row.customer_ciphertext, encryptionKey),
    })))
    return jsonResponse({ appointments })
  } catch (error) {
    console.error('Appointment records could not be decrypted.', error)
    return jsonResponse({ error: 'Appointment records are temporarily unavailable.' }, 503)
  }
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!isSameOrigin(request)) return jsonResponse({ error: 'Forbidden.' }, 403)
  if (!await hasAdminSession(request, env.ADMIN_SESSION_SECRET)) {
    return jsonResponse({ error: 'Unauthorized.' }, 401)
  }
  if (!env.BOOKING_ENCRYPTION_KEY) {
    return jsonResponse({ error: 'Appointment records are temporarily unavailable.' }, 503)
  }

  const id = new URL(request.url).searchParams.get('id') ?? ''
  if (!id) return jsonResponse({ error: 'Appointment ID is required.' }, 400)

  const row = await env.DB.prepare(
    `SELECT id, slot_start, customer_ciphertext, customer_email_notified, salon_email_notified
     FROM appointments WHERE id = ?`,
  ).bind(id).first<{
    id: string
    slot_start: string
    customer_ciphertext: string
    customer_email_notified: number
    salon_email_notified: number
  }>()
  if (!row) return jsonResponse({ error: 'Appointment not found.' }, 404)
  if (row.customer_email_notified === 1 && row.salon_email_notified === 1) {
    return jsonResponse({ notificationSent: true })
  }

  try {
    const details = await decryptCustomerDetails(row.customer_ciphertext, env.BOOKING_ENCRYPTION_KEY)
    if (!details.email) return jsonResponse({ error: 'This appointment has no customer email address.' }, 409)

    const notification = await sendAppointmentNotification({
      slotStart: row.slot_start,
      ...details,
      email: details.email,
      customerEmailNotified: row.customer_email_notified === 1,
      salonEmailNotified: row.salon_email_notified === 1,
    }, env)
    const notificationSent = notification.customerSent && notification.salonSent
    if (notification.customerSent || notification.salonSent) {
      await env.DB.prepare(
        `UPDATE appointments
         SET customer_email_notified = ?, salon_email_notified = ?, email_notified = ?
         WHERE id = ?`,
      ).bind(
        Number(notification.customerSent),
        Number(notification.salonSent),
        Number(notificationSent),
        row.id,
      ).run()
    }
    if (!notificationSent) {
      return jsonResponse({ error: 'The appointment notification could not be sent.' }, 502)
    }

    return jsonResponse({ notificationSent: true })
  } catch (error) {
    console.error('Appointment notification retry failed.', error)
    return jsonResponse({ error: 'The appointment notification could not be sent.' }, 503)
  }
}

export const onRequestPatch: PagesFunction<Env> = async ({ request, env }) => {
  if (!isSameOrigin(request)) return jsonResponse({ error: 'Forbidden.' }, 403)
  if (!await hasAdminSession(request, env.ADMIN_SESSION_SECRET)) {
    return jsonResponse({ error: 'Unauthorized.' }, 401)
  }

  const id = new URL(request.url).searchParams.get('id') ?? ''
  if (!id) return jsonResponse({ error: 'Appointment ID is required.' }, 400)

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return jsonResponse({ error: 'Invalid request.' }, 400)
  }
  if (!isRecord(payload) || typeof payload.date !== 'string' || typeof payload.time !== 'string') {
    return jsonResponse({ error: 'Choose a valid appointment date and time.' }, 400)
  }

  const { date, time } = payload
  if (!isAppointmentDate(date) || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    return jsonResponse({ error: 'Choose a date within the next 30 days and a valid time.' }, 400)
  }

  const current = await env.DB.prepare(
    'SELECT id, slot_start, customer_ciphertext FROM appointments WHERE id = ?',
  )
    .bind(id)
    .first<{ id: string; slot_start: string; customer_ciphertext: string }>()
  if (!current) return jsonResponse({ error: 'Appointment not found.' }, 404)

  const [schedule, booked] = await Promise.all([
    getAppointmentSchedule(env.DB),
    env.DB.prepare(
      'SELECT slot_start FROM appointments WHERE id != ? AND slot_start >= ? AND slot_start < ?',
    ).bind(id, `${date}T00:00`, `${date}T24:00`)
      .all<{ slot_start: string }>(),
  ])
  if (!getBookableSlots(date, schedule, new Set(booked.results.map(({ slot_start }) => slot_start))).includes(time)) {
    return jsonResponse({ error: 'That appointment time is unavailable. Choose another time.' }, 409)
  }

  const updated = await env.DB.prepare(
    'UPDATE OR IGNORE appointments SET slot_start = ? WHERE id = ?',
  ).bind(`${date}T${time}`, id).run()
  if (!updated.meta.changes) {
    return jsonResponse({ error: 'That appointment time is unavailable. Choose another time.' }, 409)
  }

  let notificationSent = false
  if (env.BOOKING_ENCRYPTION_KEY) {
    try {
      const details = await decryptCustomerDetails(current.customer_ciphertext, env.BOOKING_ENCRYPTION_KEY)
      if (details.email) {
        notificationSent = await sendCustomerAppointmentUpdate({
          slotStart: `${date}T${time}`,
          ...details,
          email: details.email,
        }, env, 'rescheduled', current.slot_start)
      }
    } catch (error) {
      console.error('Rescheduled appointment notification failed.', error)
    }
  }

  return jsonResponse({ updated: true, notificationSent })
}

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  if (!isSameOrigin(request)) return jsonResponse({ error: 'Forbidden.' }, 403)
  if (!await hasAdminSession(request, env.ADMIN_SESSION_SECRET)) {
    return jsonResponse({ error: 'Unauthorized.' }, 401)
  }

  const id = new URL(request.url).searchParams.get('id') ?? ''
  if (!id) return jsonResponse({ error: 'Appointment ID is required.' }, 400)

  if (!env.BOOKING_ENCRYPTION_KEY) {
    console.error('Appointment cannot be cancelled because the encryption key is not configured.')
    return jsonResponse({ error: 'Appointment records are temporarily unavailable.' }, 503)
  }

  const appointment = await env.DB.prepare(
    'SELECT slot_start, customer_ciphertext FROM appointments WHERE id = ?',
  ).bind(id).first<{ slot_start: string; customer_ciphertext: string }>()
  if (!appointment) return jsonResponse({ error: 'Appointment not found.' }, 404)

  try {
    const details = await decryptCustomerDetails(appointment.customer_ciphertext, env.BOOKING_ENCRYPTION_KEY)
    if (!details.email) {
      return jsonResponse({ error: 'This appointment has no customer email address, so it cannot be cancelled online.' }, 409)
    }

    const notificationSent = await sendCustomerAppointmentUpdate({
      slotStart: appointment.slot_start,
      ...details,
      email: details.email,
    }, env, 'cancelled')
    if (!notificationSent) {
      return jsonResponse({ error: 'The customer could not be notified, so the appointment was not cancelled.' }, 502)
    }
  } catch (error) {
    console.error('Appointment cancellation notification failed.', error)
    return jsonResponse({ error: 'The customer could not be notified, so the appointment was not cancelled.' }, 503)
  }

  const deleted = await env.DB.prepare('DELETE FROM appointments WHERE id = ?').bind(id).run()
  if (!deleted.meta.changes) return jsonResponse({ error: 'Appointment not found.' }, 404)

  return jsonResponse({ deleted: true, notificationSent: true })
}
