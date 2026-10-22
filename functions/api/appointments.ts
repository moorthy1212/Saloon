import { getBookableSlots, getAppointmentSchedule, isAppointmentDate } from '../_lib/appointments'
import { jsonResponse, type Env } from '../_lib/auth'

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.BOOKING_ENCRYPTION_KEY) {
    return jsonResponse({ error: 'Online booking is temporarily unavailable.' }, 503)
  }

  const date = new URL(request.url).searchParams.get('date') ?? ''
  if (!isAppointmentDate(date)) return jsonResponse({ error: 'Choose a date within the next 30 days.' }, 400)

  const [settings, booked] = await Promise.all([
    getAppointmentSchedule(env.DB),
    env.DB.prepare('SELECT slot_start FROM appointments WHERE slot_start >= ? AND slot_start < ?')
      .bind(`${date}T00:00`, `${date}T24:00`)
      .all<{ slot_start: string }>(),
  ])

  return jsonResponse({
    slots: getBookableSlots(date, settings, new Set(booked.results.map(({ slot_start }) => slot_start))),
  })
}
