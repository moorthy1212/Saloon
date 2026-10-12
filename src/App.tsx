import { useEffect, useRef, useState, type FormEvent } from 'react'
import { DEFAULT_SETTINGS, type OpeningHoursEntry, type ScheduleSettings } from '../shared/schedule'
import './App.css'

const SHOP_TIME_ZONE = 'Asia/Kolkata'
const LANGUAGE_STORAGE_KEY = 'suburaaj-language'

type Language = 'en' | 'ta'

const COPY = {
  en: {
    language: 'தமிழ்',
    languageLabel: 'Change language to Tamil',
    home: 'Suburaaj Salon home',
    navServices: 'Services',
    navHours: 'Opening hours',
    navAbout: 'Our approach',
    directions: 'Get directions',
    localSalon: 'YOUR LOCAL SALON',
    headlineFirst: 'Good hair.',
    headlineSecond: 'Good feeling.',
    heroDescription: 'Your neighbourhood salon in Palayamkottai, Tirunelveli. Visit us for a fresh haircut, styling, and a friendly welcome.',
    location: 'Palayamkottai, Tirunelveli, Tamil Nadu',
    viewServices: 'View our services',
    homeNote: 'Good hair days start with feeling at home.',
    salonImage: 'Warm, welcoming salon interior',
    openNow: 'Open now',
    closedNow: 'Closed now',
    caption: 'A calm space, made for you',
    todayAtSalon: 'Today at Suburaaj',
    localTime: 'LOCAL TIME · IST',
    experience: 'THE SUBURAAJ EXPERIENCE',
    serviceHeadingFirst: 'Made for your',
    serviceHeadingSecond: 'kind of day.',
    serviceIntro: 'Haircuts, styling, and colour in a friendly, relaxed space.',
    freshCut: 'The fresh cut',
    freshCutDescription: 'A considered cut that works with your hair, your routine, and you.',
    washStyle: 'Wash & style',
    washStyleDescription: 'A little reset, finished with a style that feels effortless.',
    colorCare: 'Color & care',
    colorCareDescription: 'Personalized color and care for hair that feels as good as it looks.',
    visit: 'COME ON BY',
    chairFirst: 'Your chair',
    chairSecond: 'is waiting.',
    visitDescription: 'Check whether we’re open before you visit. We look forward to seeing you.',
    liveStatus: 'Opening status updates automatically · India time',
    localArea: 'PALAYAMKOTTAI · TIRUNELVELI',
    openingHours: 'Opening hours',
    today: 'Today',
    closed: 'Closed',
    ist: 'IST · UTC+5:30',
    hoursFootnote: 'All times are local time in Tirunelveli (IST).',
    note: 'A NOTE FROM SUBURAAJ',
    aboutHeadingFirst: 'More than a haircut.',
    aboutHeadingSecond: 'A moment for yourself.',
    aboutDescription: 'Come as you are. Leave feeling a little more like yourself. That’s the Suburaaj way.',
    brandTagline: 'Good hair days, made together.',
    mapTitle: 'Suburaaj salon location map',
    mapSalon: 'Suburaaj Salon · Palayamkottai',
    mapAddress: 'Tirunelveli, Tamil Nadu 627002',
    mapLink: 'Open in Google Maps',
    backToTop: 'Back to top ↑',
    rights: 'All rights reserved.',
    adminAccess: 'ADMIN ACCESS',
    manageTimings: 'Manage shop timings',
    username: 'Username',
    password: 'Password',
    enterPassword: 'Enter password',
    login: 'Log in',
    adminPanel: 'ADMIN PANEL',
    updateTimings: 'Update timings & holidays',
    open: 'Open',
    holidayDates: 'Holiday closure dates',
    addHoliday: 'Add holiday',
    reset: 'Reset',
    saveChanges: 'Save changes',
    invalidLogin: 'Invalid admin username or password.',
    pageViews: 'Page views',
    saveFailed: 'Could not save changes. Please sign in again and retry.',
  },
  ta: {
    language: 'English',
    languageLabel: 'Change language to English',
    home: 'சுபுராஜ் சலூன் முகப்பு',
    navServices: 'சேவைகள்',
    navHours: 'திறந்திருக்கும் நேரம்',
    navAbout: 'எங்களைப் பற்றி',
    directions: 'வழியைப் பார்க்க',
    localSalon: 'உங்கள் அருகிலுள்ள சலூன்',
    headlineFirst: 'அழகான முடி.',
    headlineSecond: 'மகிழ்ச்சியான மனம்.',
    heroDescription: 'திருநெல்வேலி பாளையங்கோட்டையில் உள்ள உங்கள் அருகிலுள்ள சலூன். முடி வெட்டுதல், ஸ்டைலிங் மற்றும் அன்பான வரவேற்புக்கு வாருங்கள்.',
    location: 'பாளையங்கோட்டை, திருநெல்வேலி, தமிழ்நாடு',
    viewServices: 'எங்கள் சேவைகள்',
    homeNote: 'உங்கள் மனதிற்கு நெருக்கமான இடத்தில் அழகான முடி.',
    salonImage: 'அன்பான வரவேற்புடன் கூடிய சலூன்',
    openNow: 'இப்போது திறந்துள்ளது',
    closedNow: 'இப்போது மூடியுள்ளது',
    caption: 'உங்களுக்கான அமைதியான இடம்',
    todayAtSalon: 'இன்று சுபுராஜில்',
    localTime: 'உள்ளூர் நேரம் · IST',
    experience: 'சுபுராஜ் அனுபவம்',
    serviceHeadingFirst: 'உங்கள் நாளுக்கேற்ற',
    serviceHeadingSecond: 'சிறந்த பராமரிப்பு.',
    serviceIntro: 'நட்பான சூழலில் முடி வெட்டுதல், ஸ்டைலிங் மற்றும் கலரிங்.',
    freshCut: 'அழகான முடி வெட்டு',
    freshCutDescription: 'உங்கள் முடி மற்றும் அன்றாட பழக்கத்திற்கு ஏற்ற முடி வெட்டு.',
    washStyle: 'முடி அலசுதல் மற்றும் ஸ்டைலிங்',
    washStyleDescription: 'புத்துணர்ச்சி தரும் முடி அலசல், எளிமையான ஸ்டைலிங்குடன்.',
    colorCare: 'கலரிங் மற்றும் பராமரிப்பு',
    colorCareDescription: 'உங்கள் முடிக்கு ஏற்ற தனிப்பயன் கலரிங் மற்றும் பராமரிப்பு.',
    visit: 'வாருங்கள்',
    chairFirst: 'உங்களுக்கான இருக்கை',
    chairSecond: 'காத்திருக்கிறது.',
    visitDescription: 'வரும் முன் நாங்கள் திறந்துள்ளோமா என்று பாருங்கள். உங்களைச் சந்திக்க ஆவலாக இருக்கிறோம்.',
    liveStatus: 'கடை திறந்திருக்கும் நிலை தானாகவே புதுப்பிக்கப்படும் · இந்திய நேரம்',
    localArea: 'பாளையங்கோட்டை · திருநெல்வேலி',
    openingHours: 'திறந்திருக்கும் நேரம்',
    today: 'இன்று',
    closed: 'மூடியுள்ளது',
    ist: 'IST · UTC+5:30',
    hoursFootnote: 'அனைத்து நேரங்களும் திருநெல்வேலி உள்ளூர் நேரம் (IST).',
    note: 'சுபுராஜிடமிருந்து ஒரு குறிப்பு',
    aboutHeadingFirst: 'முடி வெட்டுதலை விட மேலானது.',
    aboutHeadingSecond: 'உங்களுக்கான ஒரு சிறிய இடைவேளை.',
    aboutDescription: 'நீங்கள் நீங்களாகவே வாருங்கள். இன்னும் நம்பிக்கையுடன் திரும்பிச் செல்லுங்கள். இதுவே சுபுராஜ் வழி.',
    brandTagline: 'அழகான முடி நாட்களை ஒன்றாக உருவாக்குவோம்.',
    mapTitle: 'சுபுராஜ் சலூன் அமைவிட வரைபடம்',
    mapSalon: 'சுபுராஜ் சலூன் · பாளையங்கோட்டை',
    mapAddress: 'திருநெல்வேலி, தமிழ்நாடு 627002',
    mapLink: 'கூகுள் மேப்ஸில் திறக்கவும்',
    backToTop: 'மேலே செல்ல ↑',
    rights: 'அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.',
    adminAccess: 'நிர்வாக அணுகல்',
    manageTimings: 'கடை நேரத்தை நிர்வகிக்கவும்',
    username: 'பயனர் பெயர்',
    password: 'கடவுச்சொல்',
    enterPassword: 'கடவுச்சொல்லை உள்ளிடவும்',
    login: 'உள்நுழைக',
    adminPanel: 'நிர்வாகப் பலகை',
    updateTimings: 'நேரம் மற்றும் விடுமுறைகளை மாற்றவும்',
    open: 'திறக்கும் நேரம்',
    holidayDates: 'விடுமுறை நாட்கள்',
    addHoliday: 'விடுமுறையைச் சேர்க்கவும்',
    reset: 'மீட்டமை',
    saveChanges: 'மாற்றங்களைச் சேமிக்கவும்',
    invalidLogin: 'பயனர் பெயர் அல்லது கடவுச்சொல் தவறு.',
    pageViews: 'பக்கப் பார்வைகள்',
    saveFailed: 'மாற்றங்களைச் சேமிக்க முடியவில்லை. மீண்டும் உள்நுழைந்து முயற்சிக்கவும்.',
  },
} as const

const DAY_NAMES: Record<Language, string[]> = {
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

function getLocalDateKey(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return `${values.year}-${values.month}-${values.day}`
}

function formatScheduleTime(time: string) {
  const [hourText, minute] = time.split(':')
  const hour = Number(hourText)
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`
}

function formatHoursRange(open: string | null, close: string | null, closedLabel = 'Closed') {
  if (!open || !close) {
    return closedLabel
  }

  return `${formatScheduleTime(open)} – ${formatScheduleTime(close)}`
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

function getShopStatus(now: Date, openingHours: OpeningHoursEntry[], holidayDates: string[], language: Language) {
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

function ScissorsIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="8" cy="8" r="4" />
      <circle cx="8" cy="24" r="4" />
      <path d="m11 11 17 17M11 21 28 4M14 16l8 0" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 10h12M10 4l6 6-6 6" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

function App() {
  const [now, setNow] = useState(() => new Date())
  const [language, setLanguage] = useState<Language>(() => (
    window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === 'ta' ? 'ta' : 'en'
  ))
  const [settings, setSettings] = useState<ScheduleSettings>(DEFAULT_SETTINGS)
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false)
  const [adminUser, setAdminUser] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [pageViews, setPageViews] = useState<number | null>(null)
  const [draftHours, setDraftHours] = useState<OpeningHoursEntry[]>(settings.hours)
  const [draftHoliday, setDraftHoliday] = useState('')
  const [draftHolidays, setDraftHolidays] = useState<string[]>(settings.holidays)
  const recordedVisit = useRef(false)

  const text = COPY[language]
  const isAdminRoute = window.location.pathname.replace(/\/+$/, '') === '/admin'
  const status = getShopStatus(now, settings.hours, settings.holidays, language)

  useEffect(() => {
    fetch('/api/settings')
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then(({ settings: storedSettings }: { settings: ScheduleSettings }) => {
        setSettings(storedSettings)
        setDraftHours(storedSettings.hours)
        setDraftHolidays(storedSettings.holidays)
      })
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    if (isAdminRoute) return
    if (recordedVisit.current) return
    recordedVisit.current = true

    fetch('/api/visit', { method: 'POST' })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then(({ pageViews: count }: { pageViews: number }) => setPageViews(count))
      .catch(() => undefined)
  }, [isAdminRoute])

  useEffect(() => {
    if (!isAdminRoute) return
    fetch('/api/admin/session')
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then(({ authenticated }: { authenticated: boolean }) => setIsAdminLoggedIn(authenticated))
      .catch(() => setIsAdminLoggedIn(false))
  }, [isAdminRoute])

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    document.documentElement.lang = language === 'ta' ? 'ta' : 'en-IN'
  }, [language])

  useEffect(() => {
    document.title = isAdminRoute
      ? 'Admin | Suburaaj Salon'
      : 'Suburaaj (Subu) Salon | Palayamkottai, Tirunelveli'
    document.querySelector<HTMLMetaElement>('meta[name="robots"]')?.setAttribute(
      'content',
      isAdminRoute ? 'noindex, nofollow' : 'index, follow, max-image-preview:large',
    )
  }, [isAdminRoute])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const currentTime = new Intl.DateTimeFormat('en-IN', {
    timeZone: SHOP_TIME_ZONE,
    hour: 'numeric',
    minute: '2-digit',
  }).format(now)

  const todayHours = settings.hours[status.todayIndex]

  const handleAdminLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: adminUser, password: adminPassword }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(text.invalidLogin)
        setIsAdminLoggedIn(true)
        setAdminUser('')
        setAdminPassword('')
      })
      .catch(() => window.alert(text.invalidLogin))
  }

  const handleHoursChange = (index: number, field: 'open' | 'close', value: string) => {
    const nextHours = [...draftHours]
    nextHours[index] = {
      ...nextHours[index],
      [field]: value || null,
    }

    if (field === 'open' && !value) {
      nextHours[index].close = null
    }

    setDraftHours(nextHours)
  }

  const handleClosedToggle = (index: number, isClosed: boolean) => {
    const nextHours = [...draftHours]
    nextHours[index] = {
      ...nextHours[index],
      open: isClosed ? null : nextHours[index].open ?? '10:00',
      close: isClosed ? null : nextHours[index].close ?? '20:30',
    }
    setDraftHours(nextHours)
  }

  const handleAddHoliday = () => {
    const cleanValue = draftHoliday.trim()
    if (!cleanValue) {
      return
    }

    if (draftHolidays.includes(cleanValue)) {
      setDraftHoliday('')
      return
    }

    setDraftHolidays([...draftHolidays, cleanValue])
    setDraftHoliday('')
  }

  const saveSchedule = async (nextSettings: ScheduleSettings) => {
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: nextSettings }),
      })
      if (!response.ok) throw new Error('Schedule update failed')
      setSettings(nextSettings)
      setDraftHours(nextSettings.hours)
      setDraftHolidays(nextSettings.holidays)
    } catch {
      window.alert(text.saveFailed)
    }
  }

  const handleSaveSchedule = () => {
    void saveSchedule({
      hours: draftHours,
      holidays: draftHolidays,
    })
  }

  const resetSchedule = () => {
    void saveSchedule(DEFAULT_SETTINGS)
  }

  if (isAdminRoute) {
    return (
      <main className="admin-page">
        <header className="admin-page-header">
          <a className="brand" href="/" aria-label={text.home}>
            <span className="brand-mark"><ScissorsIcon /></span>
            <span className="brand-name">
              <strong>SUBURAAJ</strong>
              <span>SALON &amp; STUDIO</span>
            </span>
          </a>
          <div className="admin-page-tools">
            <button
              type="button"
              className="language-toggle"
              aria-label={text.languageLabel}
              onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
            >
              {text.language}
            </button>
            {isAdminLoggedIn && (
              <button type="button" className="secondary-button" onClick={() => {
                fetch('/api/admin/logout', { method: 'POST' }).finally(() => setIsAdminLoggedIn(false))
              }}>
                {language === 'ta' ? 'வெளியேறு' : 'Log out'}
              </button>
            )}
            <a className="admin-back-link" href="/">{language === 'ta' ? 'தளத்திற்குத் திரும்பு' : 'Back to website'}</a>
          </div>
        </header>

        <section className="admin-page-content">
          {!isAdminLoggedIn ? (
            <form className="admin-login" onSubmit={handleAdminLogin}>
              <div className="admin-heading-row">
                <div>
                  <p className="eyebrow">{text.adminAccess}</p>
                  <h1>{text.manageTimings}</h1>
                </div>
              </div>
              <p className="admin-page-description">
                {language === 'ta' ? 'கடை திறந்திருக்கும் நேரத்தையும் விடுமுறை நாட்களையும் நிர்வகிக்க உள்நுழையவும்.' : 'Sign in to manage the salon opening hours and holiday dates.'}
              </p>
              <label>
                <span>{text.username}</span>
                <input type="text" autoComplete="off" value={adminUser} onChange={(event) => setAdminUser(event.target.value)} required />
              </label>
              <label>
                <span>{text.password}</span>
                <input type="password" autoComplete="current-password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} placeholder={text.enterPassword} required />
              </label>
              <button type="submit" className="primary-button">{text.login}</button>
            </form>
          ) : (
            <div className="admin-panel">
              <div className="admin-heading-row">
                <div>
                  <p className="eyebrow">{text.adminPanel}</p>
                  <h1>{text.updateTimings}</h1>
                </div>
              </div>

              <div className="admin-section">
                <h2>{text.openingHours}</h2>
                <div className="admin-hours-list">
                  {draftHours.map((hours, index) => {
                    const isClosed = !hours.open || !hours.close

                    return (
                      <div className="admin-hours-row" key={hours.day}>
                        <span>{DAY_NAMES[language][index]}</span>
                        <label>
                          <span>{text.open}</span>
                          <input
                            type="time"
                            value={hours.open ?? ''}
                            disabled={isClosed}
                            onChange={(event) => handleHoursChange(index, 'open', event.target.value)}
                          />
                        </label>
                        <label>
                          <span>{language === 'ta' ? 'மூடும் நேரம்' : 'Close'}</span>
                          <input
                            type="time"
                            value={hours.close ?? ''}
                            disabled={isClosed}
                            onChange={(event) => handleHoursChange(index, 'close', event.target.value)}
                          />
                        </label>
                        <label className="closed-toggle">
                          <input
                            type="checkbox"
                            checked={isClosed}
                            onChange={(event) => handleClosedToggle(index, event.target.checked)}
                          />
                          <span>{text.closed}</span>
                        </label>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="admin-section">
                <h2>{text.holidayDates}</h2>
                <div className="holiday-input-row">
                  <input
                    type="date"
                    value={draftHoliday}
                    onChange={(event) => setDraftHoliday(event.target.value)}
                  />
                  <button type="button" className="secondary-button" onClick={handleAddHoliday}>{text.addHoliday}</button>
                </div>
                <div className="holiday-list">
                  {draftHolidays.map((holiday) => (
                    <span key={holiday} className="holiday-chip">
                      {holiday}
                      <button type="button" aria-label={`Remove ${holiday}`} onClick={() => setDraftHolidays(draftHolidays.filter((item) => item !== holiday))}>×</button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="admin-actions">
                <button type="button" className="secondary-button" onClick={resetSchedule}>{text.reset}</button>
                <button type="button" className="primary-button" onClick={handleSaveSchedule}>{text.saveChanges}</button>
              </div>
            </div>
          )}
        </section>
      </main>
    )
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#home" aria-label={text.home}>
          <span className="brand-mark"><ScissorsIcon /></span>
          <span className="brand-name">
            <strong>SUBURAAJ</strong>
            <span>SALON &amp; STUDIO</span>
          </span>
        </a>
        <nav className="main-nav" aria-label="Main navigation">
          <a href="#services">{text.navServices}</a>
          <a href="#hours">{text.navHours}</a>
          <a href="#about">{text.navAbout}</a>
        </nav>
        <button
          type="button"
          className="language-toggle"
          aria-label={text.languageLabel}
          onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
        >
          {text.language}
        </button>
        <a className="header-link" href="https://maps.app.goo.gl/iHccRzc98oSVdeUU6" target="_blank" rel="noreferrer">
          {text.directions} <span><ArrowIcon /></span>
        </a>
      </header>

      <section className="hero" id="home">
        <div className="hero-copy">
          <p className="eyebrow"><span /> {text.localSalon}</p>
          <h1>{text.headlineFirst}<br /><em>{text.headlineSecond}</em></h1>
          <p className="hero-description">{text.heroDescription}</p>
          <p className="hero-location">{text.location}</p>
          <div className="hero-actions">
            <a className="button button-dark" href="#services">
              {text.viewServices} <ArrowIcon />
            </a>
            <a className="text-link" href="https://maps.app.goo.gl/iHccRzc98oSVdeUU6" target="_blank" rel="noreferrer">{text.directions}</a>
          </div>
          <div className="hero-note">
            <span className="note-star">✳</span>
            <span>{text.homeNote}</span>
          </div>
        </div>

        <div className="hero-visual" role="img" aria-label={text.salonImage}>
          <div className="image-wash" />
          <div className={`availability-card ${status.isOpen ? 'is-open' : 'is-closed'}`} aria-live="polite">
            <span className="availability-dot" />
            <span>
              <strong>{status.isOpen ? text.openNow : text.closedNow}</strong>
              <small>{status.message}</small>
            </span>
          </div>
          <div className="visual-caption">
            <span className="caption-rule" />
            <span>{text.caption}</span>
          </div>
          <span className="visual-index">01 / 03</span>
        </div>
      </section>

      <section className="visit-strip" aria-label={text.todayAtSalon}>
        <div className={`live-status ${status.isOpen ? 'is-open' : 'is-closed'}`}>
          <span className="availability-dot" />
          <span><strong>{status.isOpen ? text.openNow : text.closedNow}</strong><small>{status.message}</small></span>
        </div>
        <div className="strip-divider" />
        <div className="strip-detail">
          <ClockIcon />
          <span>
            <strong>{text.todayAtSalon}</strong>
            <small>
              {formatHoursRange(todayHours.open, todayHours.close, text.closed)}
            </small>
          </span>
        </div>
        <div className="strip-time">
          <span>{text.localTime}</span>
          <strong>{currentTime}</strong>
        </div>
      </section>

      <section className="services-section section-wrap" id="services">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{text.experience}</p>
            <h2>{text.serviceHeadingFirst} <em>{text.serviceHeadingSecond}</em></h2>
          </div>
          <p>{text.serviceIntro}</p>
        </div>
        <div className="service-grid">
          <article className="service-card service-card-featured">
            <span className="service-number">01</span>
            <span className="service-symbol">✳</span>
            <h3>{text.freshCut}</h3>
            <p>{text.freshCutDescription}</p>
            <a href="#hours" aria-label={`${text.navHours}: ${text.freshCut}`}><ArrowIcon /></a>
          </article>
          <article className="service-card">
            <span className="service-number">02</span>
            <span className="service-symbol">◌</span>
            <h3>{text.washStyle}</h3>
            <p>{text.washStyleDescription}</p>
            <a href="#hours" aria-label={`${text.navHours}: ${text.washStyle}`}><ArrowIcon /></a>
          </article>
          <article className="service-card">
            <span className="service-number">03</span>
            <span className="service-symbol">✧</span>
            <h3>{text.colorCare}</h3>
            <p>{text.colorCareDescription}</p>
            <a href="#hours" aria-label={`${text.navHours}: ${text.colorCare}`}><ArrowIcon /></a>
          </article>
        </div>
      </section>

      <section className="hours-section" id="hours">
        <div className="hours-intro">
          <p className="eyebrow">{text.visit}</p>
          <h2>{text.chairFirst}<br /><em>{text.chairSecond}</em></h2>
          <p>{text.visitDescription}</p>
          <div className="hours-status-note">
            <ClockIcon />
            <span>{text.liveStatus}</span>
          </div>
        </div>
        <div className="hours-card">
          <div className="hours-card-heading">
            <div><span className="small-label">{text.localArea}</span><h3>{text.openingHours}</h3></div>
            <span className="timezone-pill">{text.ist}</span>
          </div>
          <div className="hours-list">
            {settings.hours.map((hours, index) => (
              <div className={`hours-row ${index === status.todayIndex ? 'today' : ''}`} key={hours.day}>
                <span>{DAY_NAMES[language][index]}{index === status.todayIndex && <small>{text.today}</small>}</span>
                <strong>{formatHoursRange(hours.open, hours.close, text.closed)}</strong>
              </div>
            ))}
          </div>
          <p className="hours-footnote">{text.hoursFootnote}</p>
        </div>
      </section>

      <section className="about-section section-wrap" id="about">
        <span className="about-mark">“</span>
        <div>
          <p className="eyebrow">{text.note}</p>
          <h2>{text.aboutHeadingFirst}<br /><em>{text.aboutHeadingSecond}</em></h2>
        </div>
        <p className="about-copy">{text.aboutDescription}</p>
      </section>

      <footer className="site-footer">
        <div className="footer-branding">
          <a className="brand footer-brand" href="#home">
            <span className="brand-mark"><ScissorsIcon /></span>
            <span className="brand-name"><strong>SUBURAAJ</strong><span>SALON &amp; STUDIO</span></span>
          </a>
          <p>{text.brandTagline}</p>
        </div>

        <div className="footer-map" aria-label="Suburaaj salon location map">
          <iframe
            className="map-frame"
            title={text.mapTitle}
            src="https://www.google.com/maps?q=8.727102,77.738194&z=17&output=embed"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div className="map-address">
            <strong>{text.mapSalon}</strong>
            <span>{text.mapAddress}</span>
            <a
              href="https://maps.app.goo.gl/iHccRzc98oSVdeUU6"
              target="_blank"
              rel="noreferrer"
            >
              {text.mapLink}
            </a>
          </div>
        </div>

        <div className="footer-meta">
          <a href="#home" className="back-to-top">{text.backToTop}</a>
          <span className="page-views">{text.pageViews}: <strong>{pageViews?.toLocaleString(language) ?? '—'}</strong></span>
          <span className="copyright">© {now.getFullYear()} Suburaaj Salon &amp; Studio. {text.rights}</span>
        </div>
      </footer>

    </main>
  )
}

export default App
