import { DEFAULT_SETTINGS, isValidSchedule, type ScheduleSettings } from '../../shared/schedule'

const SHOP_TIME_ZONE = 'Asia/Kolkata'
const APPOINTMENT_WINDOW_DAYS = 30
const APPOINTMENT_DURATION_MINUTES = 60

export async function getAppointmentSchedule(db: D1Database): Promise<ScheduleSettings> {
  const result = await db.prepare('SELECT settings_json FROM site_settings WHERE id = 1')
    .first<{ settings_json: string }>()
  if (!result) return DEFAULT_SETTINGS

  try {
    const settings: unknown = JSON.parse(result.settings_json)
    if (isValidSchedule(settings)) return settings
  } catch (error) {
    console.error('Appointment schedule could not be read.', error)
  }

  console.error('Appointment schedule is invalid.')
  return DEFAULT_SETTINGS
}

export function getShopLocalDateTime(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SHOP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`
}

export function isAppointmentDate(date: string, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false

  const parsed = new Date(`${date}T12:00:00.000Z`)
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) return false

  const today = getShopLocalDateTime(now).slice(0, 10)
  const lastBookableDate = new Date(`${today}T12:00:00.000Z`)
  lastBookableDate.setUTCDate(lastBookableDate.getUTCDate() + APPOINTMENT_WINDOW_DAYS)
  return date >= today && date <= lastBookableDate.toISOString().slice(0, 10)
}

export function getBookableSlots(
  date: string,
  settings: ScheduleSettings,
  bookedSlots: Set<string>,
  now = new Date(),
) {
  if (!isAppointmentDate(date, now) || settings.holidays.includes(date)) return []

  const weekday = new Date(`${date}T12:00:00.000Z`).getUTCDay()
  const hours = settings.hours[weekday]
  if (!hours?.open || !hours.close) return []

  const [openHour, openMinute] = hours.open.split(':').map(Number)
  const [closeHour, closeMinute] = hours.close.split(':').map(Number)
  const openingMinutes = openHour * 60 + openMinute
  const closingMinutes = closeHour * 60 + closeMinute
  const currentSlot = getShopLocalDateTime(now)
  const slots: string[] = []

  for (
    let startMinutes = openingMinutes;
    startMinutes + APPOINTMENT_DURATION_MINUTES <= closingMinutes;
    startMinutes += APPOINTMENT_DURATION_MINUTES
  ) {
    const time = `${String(Math.floor(startMinutes / 60)).padStart(2, '0')}:${String(startMinutes % 60).padStart(2, '0')}`
    const slotStart = `${date}T${time}`
    if (slotStart > currentSlot && !bookedSlots.has(slotStart)) slots.push(time)
  }

  return slots
}
