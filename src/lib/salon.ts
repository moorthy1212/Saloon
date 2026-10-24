import type { OpeningHoursEntry, ScheduleSettings } from '../../shared/schedule'
import { SERVICE_MENU } from '../data/services'
import type { Language } from '../types'

export const SHOP_TIME_ZONE = 'Asia/Kolkata'
export function getServiceLabel(value: string, language: Language) {
  const service = SERVICE_MENU.find((item) => item.value === value)
  return service ? service[language] : value
}

export function formatServicePrice(value: string, language: Language = 'en') {
  const service = SERVICE_MENU.find((item) => item.value === value)
  if (!service) return ''
  if (!('offerPrice' in service)) return `₹${service.price}`
  return language === 'ta'
    ? `₹${service.offerPrice} (சலுகை; முன்பு ₹${service.price})`
    : `₹${service.offerPrice} (offer; was ₹${service.price})`
}

export const DAY_NAMES: Record<Language, string[]> = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  ta: ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி'],
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

export function getLocalDateKey(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return `${values.year}-${values.month}-${values.day}`
}

export function formatScheduleTime(time: string) {
  const [hourText, minute] = time.split(':')
  const hour = Number(hourText)
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`
}

export function formatHoursRange(open: string | null, close: string | null, closedLabel = 'Closed') {
  if (!open || !close) {
    return closedLabel
  }
  return `${formatScheduleTime(open)} – ${formatScheduleTime(close)}`
}

export function formatAppointmentDateTime(slotStart: string, language: Language) {
  const appointmentDate = new Date(`${slotStart}:00+05:30`)
  return new Intl.DateTimeFormat(language === 'ta' ? 'ta-IN' : 'en-IN', {
    timeZone: SHOP_TIME_ZONE,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(appointmentDate)
}

export function getChatFaqAnswer(question: string, settings: ScheduleSettings, now: Date, language: Language) {
  const normalizedQuestion = question.toLowerCase()

  if (/hello|hi\b|hey\b|வணக்கம்|ஹலோ/.test(normalizedQuestion)) {
    return language === 'ta'
      ? 'வணக்கம்! எங்கள் சலூன் பற்றி என்ன தெரிந்துகொள்ள விரும்புகிறீர்கள்?'
      : 'Hello! What would you like to know about our salon?'
  }

  if (/experience|years|long have|அனுபவம்|வருடம்/.test(normalizedQuestion)) {
    return language === 'ta'
      ? 'சுபுராஜ் சலூனுக்கு 20 ஆண்டுகளுக்கும் மேலான அனுபவம் உள்ளது.'
      : 'Suburaaj Salon has over 20 years of experience.'
  }

  if (/where|location|address|direction|எங்கே|முகவரி|இடம்/.test(normalizedQuestion)) {
    return language === 'ta'
      ? 'நாங்கள் பாளையங்கோட்டை, திருநெல்வேலி, தமிழ்நாடு 627002-ல் உள்ளோம். வழியைப் பார்க்க இணையதளத்தின் கூகுள் மேப்ஸ் இணைப்பைப் பயன்படுத்துங்கள்.'
      : 'We are in Palayamkottai, Tirunelveli, Tamil Nadu 627002. Use the Google Maps link on the website for directions.'
  }

  if (/service|what do you|offer|price|cost|rate|how much|hair\s?cut|shav|facial|dye|color|colour|massage|சேவை|விலை|எவ்வளவு|வெட்ட|ஷேவிங்|ஃபேஷியல்|மசாஜ்/.test(normalizedQuestion)) {
    const priceList = SERVICE_MENU.map((service) => (
      `${service[language]} — ${formatServicePrice(service.value, language)}`
    )).join('\n')
    return language === 'ta'
      ? `எங்கள் சேவைகள் மற்றும் விலைகள்:\n${priceList}`
      : `Our services and prices:\n${priceList}`
  }

  if (/hour|open|close|timing|today|நேரம்|திறந்திரு|மூடிய|திறப்ப|மூட/.test(normalizedQuestion)) {
    const shopStatus = getShopStatus(now, settings.hours, settings.holidays, language)
    const todayLabel = language === 'ta' ? 'இன்றைய நிலை' : 'Today'
    const openLabel = shopStatus.isOpen
      ? language === 'ta' ? 'திறந்துள்ளது' : 'Open'
      : language === 'ta' ? 'மூடியுள்ளது' : 'Closed'
    const dailyHours = settings.hours.map((entry, index) => (
      `${DAY_NAMES[language][index]}: ${formatHoursRange(entry.open, entry.close, language === 'ta' ? 'மூடியுள்ளது' : 'Closed')}`
    )).join('\n')

    return `${todayLabel}: ${openLabel} · ${shopStatus.message}\n${dailyHours}`
  }

  return null
}

function findNextOpenDay(openingHours: OpeningHoursEntry[], startIndex: number) {
  for (let offset = 1; offset <= openingHours.length; offset += 1) {
    const nextIndex = (startIndex + offset) % openingHours.length
    const nextHours = openingHours[nextIndex]
    if (nextHours.open && nextHours.close) {
      return {
        nextIndex,
        nextHours,
        offset,
      }
    }
  }

  return {
    nextIndex: startIndex,
    nextHours: openingHours[startIndex],
    offset: 0,
  }
}

export function getShopStatus(now: Date, openingHours: OpeningHoursEntry[], holidayDates: string[], language: Language) {
  const timeParts = new Intl.DateTimeFormat('en-IN', {
    timeZone: SHOP_TIME_ZONE,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const parts = Object.fromEntries(timeParts.map(({ type, value }) => [type, value]))
  const todayIndex = WEEKDAY_INDEX[parts.weekday]
  const currentMinutes = Number(parts.hour) * 60 + Number(parts.minute)
  const todayHours = openingHours[todayIndex]
  const holidayKey = getLocalDateKey(now, SHOP_TIME_ZONE)

  if (holidayDates.includes(holidayKey)) {
    const { nextIndex, nextHours, offset } = findNextOpenDay(openingHours, todayIndex)
    const nextOpenTime = nextHours.open
    const reopenLabel = offset === 1
      ? language === 'ta' ? 'நாளை' : 'tomorrow'
      : DAY_NAMES[language][nextIndex]

    return {
      isOpen: false,
      todayIndex,
      message: nextOpenTime
        ? language === 'ta'
          ? `விடுமுறைக்காக மூடியுள்ளது · ${reopenLabel} ${formatScheduleTime(nextOpenTime)} மணிக்கு திறக்கும்`
          : `Closed for holiday · Opens ${reopenLabel} at ${formatScheduleTime(nextOpenTime)}`
        : language === 'ta'
          ? `விடுமுறைக்காக மூடியுள்ளது · மீண்டும் ${reopenLabel} திறக்கும்`
          : `Closed for holiday · Reopens ${reopenLabel}`,
    }
  }

  let nextOpenDayOffset = 0
  let nextOpenHours = todayHours

  if (todayHours.open && todayHours.close) {
    const [openHour, openMinute] = todayHours.open.split(':').map(Number)
    const [closeHour, closeMinute] = todayHours.close.split(':').map(Number)
    const opensAt = openHour * 60 + openMinute
    const closesAt = closeHour * 60 + closeMinute

    if (currentMinutes >= opensAt && currentMinutes < closesAt) {
      return {
        isOpen: true,
        todayIndex,
        message: language === 'ta'
          ? `இன்று திறந்துள்ளது · ${formatScheduleTime(todayHours.close)} மணிக்கு மூடும்`
          : `Open today · Closes at ${formatScheduleTime(todayHours.close)}`,
      }
    }

    if (currentMinutes < opensAt) {
      return {
        isOpen: false,
        todayIndex,
        message: language === 'ta'
          ? `இப்போது மூடியுள்ளது · இன்று ${formatScheduleTime(todayHours.open)} மணிக்கு திறக்கும்`
          : `Closed now · Opens today at ${formatScheduleTime(todayHours.open)}`,
      }
    }
  }

  const nextOpen = findNextOpenDay(openingHours, todayIndex)
  nextOpenDayOffset = nextOpen.offset
  nextOpenHours = nextOpen.nextHours

  const nextOpenDayIndex = (todayIndex + nextOpenDayOffset) % openingHours.length
  const reopensWhen = nextOpenDayOffset === 1
    ? language === 'ta' ? 'நாளை' : 'tomorrow'
    : DAY_NAMES[language][nextOpenDayIndex]

  return {
    isOpen: false,
    todayIndex,
    message: nextOpenHours.open
      ? language === 'ta'
        ? `இப்போது மூடியுள்ளது · ${reopensWhen} ${formatScheduleTime(nextOpenHours.open)} மணிக்கு திறக்கும்`
        : `Closed now · Opens ${reopensWhen} at ${formatScheduleTime(nextOpenHours.open)}`
      : language === 'ta'
        ? `இப்போது மூடியுள்ளது · ${reopensWhen} திறக்கும்`
        : `Closed now · Opens ${reopensWhen}`,
  }
}
