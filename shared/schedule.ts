export type OpeningHoursEntry = {
  day: string
  open: string | null
  close: string | null
}

export type ScheduleSettings = {
  hours: OpeningHoursEntry[]
  holidays: string[]
}

export const DEFAULT_SETTINGS: ScheduleSettings = {
  hours: [
    { day: 'Sunday', open: null, close: null },
    { day: 'Monday', open: '10:00', close: '20:30' },
    { day: 'Tuesday', open: '10:00', close: '20:30' },
    { day: 'Wednesday', open: '10:00', close: '20:30' },
    { day: 'Thursday', open: '10:00', close: '20:30' },
    { day: 'Friday', open: '10:00', close: '20:30' },
    { day: 'Saturday', open: '10:00', close: '20:30' },
  ],
  holidays: ['2026-01-26', '2026-08-15'],
}

const DAYS = DEFAULT_SETTINGS.hours.map(({ day }) => day)

export function isValidSchedule(value: unknown): value is ScheduleSettings {
  if (!value || typeof value !== 'object') return false

  const settings = value as Partial<ScheduleSettings>
  if (!Array.isArray(settings.hours) || settings.hours.length !== DAYS.length) return false
  if (!Array.isArray(settings.holidays) || settings.holidays.length > 500) return false

  const validHours = settings.hours.every((entry, index) => (
    entry && entry.day === DAYS[index]
    && (entry.open === null || (typeof entry.open === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(entry.open)))
    && (entry.close === null || (typeof entry.close === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(entry.close)))
    && ((entry.open === null) === (entry.close === null))
    && (entry.open === null || entry.close === null || entry.open < entry.close)
  ))

  if (!validHours) return false
  const validHolidays = settings.holidays.every((date) => {
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
    const parsed = new Date(`${date}T12:00:00.000Z`)
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date
  })

  return validHolidays && new Set(settings.holidays).size === settings.holidays.length
}