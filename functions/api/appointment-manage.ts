import { getBookableSlots, getAppointmentSchedule, isAppointmentDate, getShopLocalDateTime } from '../_lib/appointments'
import { decryptAppointmentCustomerDetails } from '../_lib/appointment-customer'
import { hashAppointmentManagementToken } from '../_lib/appointment-management'
import { isSameOrigin, jsonResponse, type Env } from '../_lib/auth'
import { sendCustomerAppointmentUpdate } from '../_lib/appointment-notifications'

type ManagedAppointment = {
  id: string
  slot_start: string
  customer_ciphertext: string
  management_token_hash: string | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

async function getManagedAppointment(token: string, env: Env) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null
  const tokenHash = await hashAppointmentManagementToken(token)
  const appointment = await env.DB.prepare(
    `SELECT id, slot_start, customer_ciphertext, management_token_hash
     FROM appointments WHERE management_token_hash = ?`,
  ).bind(tokenHash).first<ManagedAppointment>()

  if (!appointment || appointment.slot_start <= getShopLocalDateTime()) return null
  return appointment
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!isSameOrigin(request)) return jsonResponse({ error: 'Forbidden.' }, 403)
  if (!env.BOOKING_ENCRYPTION_KEY) {
    return jsonResponse({ error: 'Appointment management is temporarily unavailable.' }, 503)
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return jsonResponse({ error: 'Invalid request.' }, 400)
  }
  if (!isRecord(payload) || typeof payload.token !== 'string' || typeof payload.action !== 'string') {
    return jsonResponse({ error: 'Invalid request.' }, 400)
  }

  let appointment: ManagedAppointment | null
  try {
    appointment = await getManagedAppointment(payload.token, env)
  } catch (error) {
    console.error('Appointment management link could not be checked.', error)
    return jsonResponse({ error: 'Appointment management is temporarily unavailable.' }, 503)
  }
  if (!appointment) return jsonResponse({ error: 'This appointment link is invalid or has expired.' }, 404)

  if (payload.action === 'details') {
    try {
      const customer = await decryptAppointmentCustomerDetails(
        appointment.customer_ciphertext,
        env.BOOKING_ENCRYPTION_KEY,
      )
      return jsonResponse({
        appointment: {
          slotStart: appointment.slot_start,
          service: customer.service,
        },
      })
    } catch (error) {
      console.error('Appointment details could not be decrypted for customer self-service.', error)
      return jsonResponse({ error: 'Appointment details are temporarily unavailable.' }, 503)
    }
  }

  if (payload.action === 'reschedule') {
    if (typeof payload.date !== 'string' || typeof payload.time !== 'string') {
      return jsonResponse({ error: 'Choose a valid appointment date and time.' }, 400)
    }
    const { date, time } = payload
    if (!isAppointmentDate(date) || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      return jsonResponse({ error: 'Choose a date within the next 30 days and a valid time.' }, 400)
    }

    const [schedule, booked] = await Promise.all([
      getAppointmentSchedule(env.DB),
      env.DB.prepare(
        'SELECT slot_start FROM appointments WHERE id != ? AND slot_start >= ? AND slot_start < ?',
      ).bind(appointment.id, `${date}T00:00`, `${date}T24:00`)
        .all<{ slot_start: string }>(),
    ])
    if (!getBookableSlots(date, schedule, new Set(booked.results.map(({ slot_start }) => slot_start))).includes(time)) {
      return jsonResponse({ error: 'That appointment time is unavailable. Choose another time.' }, 409)
    }

    const slotStart = `${date}T${time}`
    if (slotStart === appointment.slot_start) {
      return jsonResponse({ error: 'Choose a different appointment time.' }, 400)
    }
    const updated = await env.DB.prepare(
      `UPDATE OR IGNORE appointments SET slot_start = ?
       WHERE id = ? AND management_token_hash = ?`,
    ).bind(slotStart, appointment.id, appointment.management_token_hash).run()
    if (!updated.meta.changes) {
      return jsonResponse({ error: 'That appointment time is unavailable. Choose another time.' }, 409)
    }

    let notificationSent = false
    try {
      const customer = await decryptAppointmentCustomerDetails(
        appointment.customer_ciphertext,
        env.BOOKING_ENCRYPTION_KEY,
      )
      if (customer.email) {
        notificationSent = await sendCustomerAppointmentUpdate({
          slotStart,
          ...customer,
          email: customer.email,
        }, env, 'rescheduled', appointment.slot_start)
      }
    } catch (error) {
      console.error('Customer self-service reschedule notification failed.', error)
    }
    return jsonResponse({ updated: true, slotStart, notificationSent })
  }

  if (payload.action === 'cancel') {
    try {
      const customer = await decryptAppointmentCustomerDetails(
        appointment.customer_ciphertext,
        env.BOOKING_ENCRYPTION_KEY,
      )
      if (!customer.email) {
        return jsonResponse({ error: 'This appointment cannot be cancelled online. Please contact the salon.' }, 409)
      }
      const notificationSent = await sendCustomerAppointmentUpdate({
        slotStart: appointment.slot_start,
        ...customer,
        email: customer.email,
      }, env, 'cancelled')
      if (!notificationSent) {
        return jsonResponse({ error: 'The cancellation email could not be sent, so the appointment was not cancelled.' }, 502)
      }
    } catch (error) {
      console.error('Customer self-service cancellation notification failed.', error)
      return jsonResponse({ error: 'The cancellation email could not be sent, so the appointment was not cancelled.' }, 503)
    }

    const deleted = await env.DB.prepare(
      `DELETE FROM appointments WHERE id = ? AND management_token_hash = ?`,
    ).bind(appointment.id, appointment.management_token_hash).run()
    if (!deleted.meta.changes) return jsonResponse({ error: 'This appointment has already been updated.' }, 409)
    return jsonResponse({ cancelled: true })
  }

  return jsonResponse({ error: 'Choose a valid appointment action.' }, 400)
}
