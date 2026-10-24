import { useEffect, useRef, useState, type FormEvent } from 'react'
import { DEFAULT_SETTINGS, isValidSchedule, type OpeningHoursEntry, type ScheduleSettings } from '../shared/schedule'
import { AdminPage } from './components/AdminPage'
import { AppointmentPage } from './components/AppointmentPage'
import { ChatWidget } from './components/ChatWidget'
import { AboutSection, OpeningHoursSection, ServiceSection, SiteFooter, VisitStrip } from './components/SiteSections'
import { ArrowIcon, ScissorsIcon } from './components/SalonIcons'
import { COPY } from './content/copy'
import { DAY_NAMES, formatAppointmentDateTime, formatHoursRange, formatScheduleTime, getChatFaqAnswer, getLocalDateKey, getServiceLabel, formatServicePrice, getShopStatus, SHOP_TIME_ZONE } from './lib/salon'
import type { AdminAppointment, ChatBookingStep, ChatMessage, Language } from './types'
import './App.css'

const LANGUAGE_STORAGE_KEY = 'suburaaj-language'

function isAdminAppointment(value: unknown): value is AdminAppointment {
  return typeof value === 'object' && value !== null
    && 'id' in value && typeof value.id === 'string'
    && 'slotStart' in value && typeof value.slotStart === 'string'
    && 'name' in value && typeof value.name === 'string'
    && 'phone' in value && typeof value.phone === 'string'
    && (!('email' in value) || typeof value.email === 'string')
    && 'service' in value && typeof value.service === 'string'
    && 'emailNotified' in value && typeof value.emailNotified === 'boolean'
}

function App() {
  const [now, setNow] = useState(() => new Date())
  const [language, setLanguage] = useState<Language>(() => (
    window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === 'ta' ? 'ta' : 'en'
  ))
  const [settings, setSettings] = useState<ScheduleSettings>(DEFAULT_SETTINGS)
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false)
  const [isAdminSessionLoading, setIsAdminSessionLoading] = useState(true)
  const [adminSessionUnavailable, setAdminSessionUnavailable] = useState(false)
  const [adminSessionCheck, setAdminSessionCheck] = useState(0)
  const [adminUser, setAdminUser] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [pageViews, setPageViews] = useState<number | null>(null)
  const [draftHours, setDraftHours] = useState<OpeningHoursEntry[]>(settings.hours)
  const [draftHoliday, setDraftHoliday] = useState('')
  const [draftHolidays, setDraftHolidays] = useState<string[]>(settings.holidays)
  const [isScheduleSaving, setIsScheduleSaving] = useState(false)
  const [scheduleError, setScheduleError] = useState('')
  const [scheduleMessage, setScheduleMessage] = useState('')
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatQuestion, setChatQuestion] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [chatBookingStep, setChatBookingStep] = useState<ChatBookingStep>(null)
  const [appointmentDate, setAppointmentDate] = useState(() => getLocalDateKey(new Date(), SHOP_TIME_ZONE))
  const [appointmentTime, setAppointmentTime] = useState('')
  const [appointmentSlots, setAppointmentSlots] = useState<string[]>([])
  const [appointmentRefresh, setAppointmentRefresh] = useState(0)
  const [appointmentName, setAppointmentName] = useState('')
  const [appointmentPhone, setAppointmentPhone] = useState('')
  const [appointmentEmail, setAppointmentEmail] = useState('')
  const [appointmentService, setAppointmentService] = useState('')
  const [isAppointmentLoading, setIsAppointmentLoading] = useState(true)
  const [isAppointmentSubmitting, setIsAppointmentSubmitting] = useState(false)
  const [appointmentError, setAppointmentError] = useState('')
  const [appointmentBooked, setAppointmentBooked] = useState(false)
  const [appointments, setAppointments] = useState<AdminAppointment[]>([])
  const [appointmentsError, setAppointmentsError] = useState(false)
  const [isAdminAppointmentsLoading, setIsAdminAppointmentsLoading] = useState(true)
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null)
  const [adminEditDate, setAdminEditDate] = useState('')
  const [adminEditTime, setAdminEditTime] = useState('')
  const [adminEditSlots, setAdminEditSlots] = useState<string[]>([])
  const [isAdminEditSlotsLoading, setIsAdminEditSlotsLoading] = useState(false)
  const [appointmentActionError, setAppointmentActionError] = useState('')
  const [appointmentActionMessage, setAppointmentActionMessage] = useState('')
  const [appointmentActionId, setAppointmentActionId] = useState<string | null>(null)
  const [isAdminLoggingOut, setIsAdminLoggingOut] = useState(false)
  const recordedVisit = useRef(false)

  const text = COPY[language]
  const isAdminRoute = window.location.pathname.replace(/\/+$/, '') === '/admin'
  const isAppointmentRoute = window.location.pathname.replace(/\/+$/, '') === '/appointment'
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
    let cancelled = false
    fetch('/api/admin/session', { credentials: 'same-origin', cache: 'no-store' })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Admin session check failed.')))
      .then(({ authenticated }: { authenticated: boolean }) => {
        if (cancelled) return
        setIsAdminLoggedIn(authenticated)
        setAdminSessionUnavailable(false)
        setIsAdminSessionLoading(false)
        if (authenticated) setIsAdminAppointmentsLoading(true)
      })
      .catch(() => {
        if (cancelled) return
        setAdminSessionUnavailable(true)
        setIsAdminSessionLoading(false)
      })
    return () => { cancelled = true }
  }, [adminSessionCheck, isAdminRoute])

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    document.documentElement.lang = language === 'ta' ? 'ta' : 'en-IN'
  }, [language])

  useEffect(() => {
    document.title = isAdminRoute
      ? 'Admin | Suburaaj Salon'
      : isAppointmentRoute
        ? 'Book an appointment | Suburaaj Salon'
        : 'Suburaaj Saloon | Subu Salon in Palayamkottai, Tirunelveli'
    document.querySelector<HTMLMetaElement>('meta[name="robots"]')?.setAttribute(
      'content',
      isAdminRoute || isAppointmentRoute ? 'noindex, nofollow' : 'index, follow, max-image-preview:large',
    )
  }, [isAdminRoute, isAppointmentRoute])

  useEffect(() => {
    if (!isAppointmentRoute && chatBookingStep !== 'time') return
    let cancelled = false
    fetch(`/api/appointments?date=${encodeURIComponent(appointmentDate)}`)
      .then(async (response) => {
        if (!response.headers.get('content-type')?.includes('application/json')) {
          throw new Error('vite-preview')
        }
        const result: unknown = await response.json()
        if (response.status === 503) throw new Error('booking-not-configured')
        if (!response.ok || !result || typeof result !== 'object' || !('slots' in result) || !Array.isArray(result.slots)) {
          throw new Error('Appointment slots could not be loaded.')
        }
        return result.slots.filter((slot): slot is string => typeof slot === 'string')
      })
      .then((slots) => {
        if (!cancelled) setAppointmentSlots(slots)
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          console.error('Appointment slots could not be loaded.', error)
          setAppointmentSlots([])
          setAppointmentError(
            error instanceof Error && error.message === 'vite-preview'
              ? text.appointmentPreviewUnavailable
              : error instanceof Error && error.message === 'booking-not-configured'
                ? text.appointmentNotConfigured
                : text.appointmentUnavailable,
          )
        }
      })
      .finally(() => {
        if (!cancelled) setIsAppointmentLoading(false)
      })
    return () => { cancelled = true }
  }, [
    appointmentDate,
    appointmentRefresh,
    chatBookingStep,
    isAppointmentRoute,
    text.appointmentNotConfigured,
    text.appointmentPreviewUnavailable,
    text.appointmentUnavailable,
  ])

  useEffect(() => {
    if (!isAdminRoute || !isAdminLoggedIn) return
    let cancelled = false
    fetch('/api/admin/appointments')
      .then(async (response) => {
        const result: unknown = await response.json()
        if (!response.ok || !result || typeof result !== 'object' || !('appointments' in result) || !Array.isArray(result.appointments)) {
          throw new Error('Appointments could not be loaded.')
        }
        if (!result.appointments.every(isAdminAppointment)) throw new Error('Appointment records were invalid.')
        return result.appointments
      })
      .then((items) => {
        if (!cancelled) {
          setAppointments(items)
          setAppointmentsError(false)
        }
      })
      .catch(() => {
        if (!cancelled) setAppointmentsError(true)
      })
      .finally(() => {
        if (!cancelled) setIsAdminAppointmentsLoading(false)
      })
    return () => { cancelled = true }
  }, [isAdminRoute, isAdminLoggedIn])

  useEffect(() => {
    if (!isAdminRoute || !isAdminLoggedIn || !editingAppointmentId || !adminEditDate) return
    let cancelled = false
    const editingAppointment = appointments.find(({ id }) => id === editingAppointmentId)
    fetch(`/api/appointments?date=${encodeURIComponent(adminEditDate)}`)
      .then(async (response) => {
        const result: unknown = await response.json()
        if (!response.ok || !result || typeof result !== 'object' || !('slots' in result) || !Array.isArray(result.slots)) {
          throw new Error('Appointment slots could not be loaded.')
        }
        const slots = result.slots.filter((slot): slot is string => typeof slot === 'string')
        if (editingAppointment?.slotStart.startsWith(`${adminEditDate}T`)) {
          slots.push(editingAppointment.slotStart.slice(11, 16))
          slots.sort()
        }
        return slots
      })
      .then((slots) => {
        if (!cancelled) setAdminEditSlots(slots)
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          console.error('Appointment reschedule slots could not be loaded.', error)
          setAppointmentActionError(text.appointmentsUnavailable)
          setAdminEditSlots([])
        }
      })
      .finally(() => {
        if (!cancelled) setIsAdminEditSlotsLoading(false)
      })
    return () => { cancelled = true }
  }, [
    adminEditDate,
    appointments,
    editingAppointmentId,
    isAdminLoggedIn,
    isAdminRoute,
    text.appointmentsUnavailable,
  ])

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
  const appointmentMinDate = getLocalDateKey(now, SHOP_TIME_ZONE)
  const appointmentMaxDate = (() => {
    const lastDay = new Date(`${appointmentMinDate}T12:00:00.000Z`)
    lastDay.setUTCDate(lastDay.getUTCDate() + 30)
    return lastDay.toISOString().slice(0, 10)
  })()
  const isDraftScheduleValid = isValidSchedule({ hours: draftHours, holidays: draftHolidays })

  const startChatBooking = () => {
    setAppointmentDate(appointmentMinDate)
    setAppointmentTime('')
    setAppointmentName('')
    setAppointmentPhone('')
    setAppointmentEmail('')
    setAppointmentService('')
    setAppointmentError('')
    setChatBookingStep('service')
    setChatMessages((messages) => [...messages, { role: 'assistant', content: text.chatBookPrompt }])
  }

  const chooseChatBookingService = (service: string, label: string) => {
    setAppointmentService(service)
    setChatBookingStep('date')
    setChatMessages((messages) => [
      ...messages,
      { role: 'user', content: `${text.chatBookingService}: ${label}` },
      { role: 'assistant', content: text.chatChooseDate },
    ])
  }

  const showChatBookingTimes = () => {
    setAppointmentTime('')
    setAppointmentError('')
    setIsAppointmentLoading(true)
    setChatBookingStep('time')
    setAppointmentRefresh((value) => value + 1)
    setChatMessages((messages) => [...messages, { role: 'assistant', content: text.chatChooseTime }])
  }

  const chooseChatBookingTime = (time: string) => {
    setAppointmentTime(time)
    setChatBookingStep('name')
    setChatQuestion('')
    setChatMessages((messages) => [
      ...messages,
      { role: 'user', content: formatScheduleTime(time) },
      { role: 'assistant', content: text.chatAskName },
    ])
  }

  const cancelChatBooking = () => {
    setChatBookingStep(null)
    setAppointmentName('')
    setAppointmentPhone('')
    setAppointmentEmail('')
    setAppointmentService('')
    setAppointmentTime('')
    setAppointmentError('')
    setChatQuestion('')
    setChatMessages((messages) => [...messages, { role: 'assistant', content: text.chatBookingCancelled }])
  }

  const handleAdminLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUser, password: adminPassword }),
      })

      if (response.status === 401) {
        window.alert(text.invalidLogin)
        return
      }

      if (response.status === 429) {
        window.alert(text.loginRateLimited)
        return
      }

      if (!response.ok) {
        window.alert(text.loginUnavailable)
        return
      }

      setIsAdminLoggedIn(true)
      setAdminSessionUnavailable(false)
      setIsAdminSessionLoading(false)
      setIsAdminAppointmentsLoading(true)
      setAdminUser('')
      setAdminPassword('')
    } catch {
      window.alert(text.loginUnavailable)
    }
  }

  const handleAdminLogout = async () => {
    if (isAdminLoggingOut) return
    setIsAdminLoggingOut(true)
    try {
      const response = await fetch('/api/admin/logout', { method: 'POST' })
      if (!response.ok) throw new Error('Admin logout request failed.')
      setIsAdminLoggedIn(false)
      setAppointments([])
      setIsAdminAppointmentsLoading(false)
    } catch (error) {
      console.error('Admin session could not be ended.', error)
      window.alert(text.logoutUnavailable)
    } finally {
      setIsAdminLoggingOut(false)
    }
  }

  const askChat = async (question: string) => {
    const cleanQuestion = question.trim()
    if (!cleanQuestion || isChatLoading) return

    setChatQuestion('')

    if (/appointment|book(?:ing)?|reserve|slot|முன்பதிவு|நேரம் பதிவு/.test(cleanQuestion.toLowerCase())) {
      setChatMessages((messages) => [...messages, { role: 'user', content: text.bookAppointment }])
      startChatBooking()
      return
    }

    setChatMessages((messages) => [...messages, { role: 'user', content: cleanQuestion }])

    const faqAnswer = getChatFaqAnswer(cleanQuestion, settings, now, language)
    if (faqAnswer) {
      setChatMessages((messages) => [...messages, { role: 'assistant', content: faqAnswer }])
      return
    }

    setIsChatLoading(true)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: cleanQuestion, language }),
      })
      if (response.status === 429) {
        setChatMessages((messages) => [...messages, { role: 'assistant', content: text.chatRateLimited }])
        return
      }
      const result: unknown = await response.json()
      if (!response.ok || !result || typeof result !== 'object' || !('answer' in result)) {
        throw new Error('Chat service request failed.')
      }
      const answer = result.answer
      if (typeof answer !== 'string') throw new Error('Chat service returned an invalid answer.')
      setChatMessages((messages) => [...messages, { role: 'assistant', content: answer }])
    } catch {
      setChatMessages((messages) => [...messages, { role: 'assistant', content: text.chatUnavailable }])
    } finally {
      setIsChatLoading(false)
    }
  }

  const reserveAppointment = async (source: 'form' | 'chat') => {
    if (isAppointmentSubmitting) return
    setIsAppointmentSubmitting(true)
    setAppointmentError('')

    try {
      const response = await fetch('/api/appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: appointmentName,
          phone: appointmentPhone,
          email: appointmentEmail,
          service: appointmentService,
          date: appointmentDate,
          time: appointmentTime,
        }),
      })
      const result: unknown = await response.json()
      if (!response.ok) {
        if (response.status === 409) {
          if (source === 'chat') {
            setChatBookingStep('time')
            setChatMessages((messages) => [...messages, { role: 'assistant', content: text.chatBookingConflict }])
          } else {
            setAppointmentError(language === 'ta'
              ? 'இந்த நேரம் இப்போது கிடைக்கவில்லை. வேறு நேரத்தைத் தேர்வு செய்யுங்கள்.'
              : 'That time is no longer available. Please choose another time.')
          }
          setAppointmentRefresh((value) => value + 1)
          setIsAppointmentLoading(true)
          setAppointmentTime('')
          return
        }
        if (response.status === 429) {
          if (source === 'chat') {
            setChatMessages((messages) => [...messages, { role: 'assistant', content: text.chatBookingRateLimit }])
          } else {
            setAppointmentError(language === 'ta'
              ? 'பலமுறை முயற்சித்துள்ளீர்கள். சில நிமிடங்கள் கழித்து முயற்சிக்கவும்.'
              : 'Too many attempts. Please try again in a few minutes.')
          }
          return
        }
        if (response.status === 503) {
          if (source === 'chat') {
            setChatMessages((messages) => [...messages, { role: 'assistant', content: text.chatBookingUnavailable }])
          } else {
            setAppointmentError(text.appointmentUnavailable)
          }
          return
        }
        throw new Error('Appointment request failed.')
      }
      if (!result || typeof result !== 'object' || !('appointment' in result)) {
        throw new Error('Appointment response was invalid.')
      }
      const notificationSent = 'notificationSent' in result && result.notificationSent === true
      setAppointmentBooked(notificationSent)
      const bookedSlot = formatAppointmentDateTime(`${appointmentDate}T${appointmentTime}`, language)
      setAppointmentName('')
      setAppointmentPhone('')
      setAppointmentEmail('')
      setAppointmentService('')
      setAppointmentTime('')
      setIsAppointmentLoading(true)
      setAppointmentRefresh((value) => value + 1)
      if (source === 'chat') {
        setChatBookingStep(null)
        setChatMessages((messages) => [
          ...messages,
          {
            role: 'assistant',
            content: `${text.chatBookingSuccess} ${bookedSlot}.${notificationSent ? '' : ` ${text.appointmentSuccessNotificationPending}`}`,
          },
        ])
      } else if (!notificationSent) {
        setAppointmentError(text.appointmentSuccessNotificationPending)
      }
    } catch (error) {
      console.error('Appointment booking failed.', error)
      if (source === 'chat') {
        setChatMessages((messages) => [...messages, { role: 'assistant', content: text.appointmentFailure }])
      } else {
        setAppointmentError(text.appointmentFailure)
      }
    } finally {
      setIsAppointmentSubmitting(false)
    }
  }

  const handleAppointmentSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void reserveAppointment('form')
  }

  const handleChatSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const answer = chatQuestion.trim()
    if (chatBookingStep && /^(?:cancel|stop|never mind|ரத்து|வேண்டாம்)$/i.test(answer)) {
      setChatMessages((messages) => [...messages, { role: 'user', content: answer }])
      cancelChatBooking()
      return
    }
    if (chatBookingStep === 'name') {
      if (
        answer.length < 2
        || answer.length > 80
        || answer.split('').some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)
      ) {
        setChatMessages((messages) => [...messages, { role: 'assistant', content: text.chatInvalidName }])
        return
      }
      setAppointmentName(answer)
      setChatQuestion('')
      setChatBookingStep('phone')
      setChatMessages((messages) => [...messages, { role: 'assistant', content: text.chatAskPhone }])
      return
    }
    if (chatBookingStep === 'phone') {
      const phone = answer.replace(/[\s()-]/g, '')
      if (!/^(?:\+?91)?[6-9]\d{9}$/.test(phone)) {
        setChatMessages((messages) => [...messages, { role: 'assistant', content: text.chatInvalidPhone }])
        return
      }
      setAppointmentPhone(answer)
      setChatQuestion('')
      setChatBookingStep('email')
      setChatMessages((messages) => [...messages, { role: 'assistant', content: text.chatAskEmail }])
      return
    }
    if (chatBookingStep === 'email') {
      const email = answer.trim().toLowerCase()
      if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setChatMessages((messages) => [...messages, { role: 'assistant', content: text.chatInvalidEmail }])
        return
      }
      setAppointmentEmail(email)
      setChatQuestion('')
      setChatBookingStep('confirm')
      setChatMessages((messages) => [...messages, { role: 'assistant', content: text.chatConfirmPrompt }])
      return
    }
    if (chatBookingStep) return
    void askChat(chatQuestion)
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
    setScheduleError('')
    setScheduleMessage('')
  }

  const handleClosedToggle = (index: number, isClosed: boolean) => {
    const nextHours = [...draftHours]
    nextHours[index] = {
      ...nextHours[index],
      open: isClosed ? null : nextHours[index].open ?? '10:00',
      close: isClosed ? null : nextHours[index].close ?? '20:30',
    }
    setDraftHours(nextHours)
    setScheduleError('')
    setScheduleMessage('')
  }

  const handleAddHoliday = () => {
    const cleanValue = draftHoliday.trim()
    if (!cleanValue) {
      return
    }

    if (cleanValue < appointmentMinDate) {
      setScheduleError(text.holidayDatePast)
      return
    }

    if (draftHolidays.includes(cleanValue)) return

    setDraftHolidays([...draftHolidays, cleanValue].sort())
    setDraftHoliday('')
    setScheduleError('')
    setScheduleMessage('')
  }

  const saveSchedule = async (nextSettings: ScheduleSettings) => {
    if (!isValidSchedule(nextSettings)) {
      setScheduleError(text.scheduleInvalidHours)
      setScheduleMessage('')
      return
    }

    setIsScheduleSaving(true)
    setScheduleError('')
    setScheduleMessage('')
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
      setScheduleMessage(text.scheduleSaved)
    } catch (error) {
      console.error('Schedule update failed.', error)
      setScheduleError(text.scheduleSaveError)
    } finally {
      setIsScheduleSaving(false)
    }
  }

  const handleSaveSchedule = () => {
    void saveSchedule({
      hours: draftHours,
      holidays: draftHolidays,
    })
  }

  const resetSchedule = () => {
    if (!window.confirm(text.resetScheduleConfirm)) return
    void saveSchedule(DEFAULT_SETTINGS)
  }

  const startEditingAppointment = (appointment: AdminAppointment) => {
    setEditingAppointmentId(appointment.id)
    setAdminEditDate(appointment.slotStart.slice(0, 10))
    setAdminEditTime(appointment.slotStart.slice(11, 16))
    setAdminEditSlots([])
    setIsAdminEditSlotsLoading(true)
    setAppointmentActionError('')
    setAppointmentActionMessage('')
  }

  const saveAppointmentChange = async (appointmentId: string, time: string) => {
    setAppointmentActionId(appointmentId)
    setAppointmentActionError('')
    setAppointmentActionMessage('')
    try {
      const response = await fetch(`/api/admin/appointments?id=${encodeURIComponent(appointmentId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: adminEditDate, time }),
      })
      if (response.status === 409) {
        setAppointmentActionError(text.appointmentTimeUnavailable)
        return
      }
      if (!response.ok) throw new Error('Appointment could not be rescheduled.')
      const result: unknown = await response.json()
      const notificationSent = Boolean(
        result && typeof result === 'object'
        && 'notificationSent' in result
        && result.notificationSent === true,
      )

      const slotStart = `${adminEditDate}T${time}`
      setAppointments((items) => items
        .map((item) => item.id === appointmentId ? { ...item, slotStart } : item)
        .sort((left, right) => left.slotStart.localeCompare(right.slotStart)))
      setEditingAppointmentId(null)
      setAdminEditTime('')
      setAppointmentActionMessage(notificationSent
        ? text.appointmentChangeSaved
        : text.appointmentChangeNotificationPending)
    } catch (error) {
      console.error('Appointment could not be rescheduled.', error)
      setAppointmentActionError(text.appointmentActionFailed)
    } finally {
      setAppointmentActionId(null)
    }
  }

  const cancelAppointment = async (appointmentId: string) => {
    if (!window.confirm(text.appointmentCancelConfirm)) return
    setAppointmentActionId(appointmentId)
    setAppointmentActionError('')
    setAppointmentActionMessage('')
    try {
      const response = await fetch(`/api/admin/appointments?id=${encodeURIComponent(appointmentId)}`, {
        method: 'DELETE',
      })
      if ([409, 502, 503].includes(response.status)) {
        setAppointmentActionError(text.appointmentCancelNotificationFailed)
        return
      }
      if (!response.ok) throw new Error('Appointment could not be cancelled.')
      setAppointments((items) => items.filter(({ id }) => id !== appointmentId))
      if (editingAppointmentId === appointmentId) setEditingAppointmentId(null)
      setAppointmentActionMessage(text.appointmentCancelSaved)
    } catch (error) {
      console.error('Appointment could not be cancelled.', error)
      setAppointmentActionError(text.appointmentActionFailed)
    } finally {
      setAppointmentActionId(null)
    }
  }

  const retryAppointmentNotification = async (appointmentId: string) => {
    setAppointmentActionId(appointmentId)
    setAppointmentActionError('')
    setAppointmentActionMessage('')
    try {
      const response = await fetch(`/api/admin/appointments?id=${encodeURIComponent(appointmentId)}`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Appointment notification could not be sent.')
      setAppointments((items) => items.map((item) => (
        item.id === appointmentId ? { ...item, emailNotified: true } : item
      )))
      setAppointmentActionMessage(text.appointmentEmailRetried)
    } catch (error) {
      console.error('Appointment notification retry failed.', error)
      setAppointmentActionError(text.appointmentActionFailed)
    } finally {
      setAppointmentActionId(null)
    }
  }

  if (isAdminRoute) {
    return (
      <AdminPage
        text={text}
        language={language}
        setLanguage={setLanguage}
        isAdminLoggedIn={isAdminLoggedIn}
        isAdminLoggingOut={isAdminLoggingOut}
        handleAdminLogout={handleAdminLogout}
        isAdminSessionLoading={isAdminSessionLoading}
        adminSessionUnavailable={adminSessionUnavailable}
        retryAdminSession={() => {
          setAdminSessionUnavailable(false)
          setIsAdminSessionLoading(true)
          setAdminSessionCheck((attempt) => attempt + 1)
        }}
        handleAdminLogin={handleAdminLogin}
        adminUser={adminUser}
        setAdminUser={setAdminUser}
        adminPassword={adminPassword}
        setAdminPassword={setAdminPassword}
        draftHours={draftHours}
        handleHoursChange={handleHoursChange}
        handleClosedToggle={handleClosedToggle}
        appointmentMinDate={appointmentMinDate}
        appointmentMaxDate={appointmentMaxDate}
        draftHoliday={draftHoliday}
        setDraftHoliday={setDraftHoliday}
        draftHolidays={draftHolidays}
        setDraftHolidays={setDraftHolidays}
        setScheduleError={setScheduleError}
        setScheduleMessage={setScheduleMessage}
        isScheduleSaving={isScheduleSaving}
        handleAddHoliday={handleAddHoliday}
        isAdminAppointmentsLoading={isAdminAppointmentsLoading}
        appointmentsError={appointmentsError}
        appointments={appointments}
        appointmentActionId={appointmentActionId}
        retryAppointmentNotification={retryAppointmentNotification}
        editingAppointmentId={editingAppointmentId}
        setEditingAppointmentId={setEditingAppointmentId}
        setAppointmentActionError={setAppointmentActionError}
        startEditingAppointment={startEditingAppointment}
        cancelAppointment={cancelAppointment}
        adminEditDate={adminEditDate}
        setAdminEditDate={setAdminEditDate}
        adminEditTime={adminEditTime}
        setAdminEditTime={setAdminEditTime}
        setAdminEditSlots={setAdminEditSlots}
        isAdminEditSlotsLoading={isAdminEditSlotsLoading}
        setIsAdminEditSlotsLoading={setIsAdminEditSlotsLoading}
        adminEditSlots={adminEditSlots}
        saveAppointmentChange={saveAppointmentChange}
        appointmentActionError={appointmentActionError}
        appointmentActionMessage={appointmentActionMessage}
        resetSchedule={resetSchedule}
        isDraftScheduleValid={isDraftScheduleValid}
        handleSaveSchedule={handleSaveSchedule}
        scheduleError={scheduleError}
        scheduleMessage={scheduleMessage}
      />
    )
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href={isAppointmentRoute ? '/#home' : '#home'} aria-label={text.home}>
          <span className="brand-mark"><ScissorsIcon /></span>
          <span className="brand-name">
            <strong>SUBURAAJ</strong>
            <span>SALON &amp; STUDIO</span>
          </span>
        </a>
        <nav className="main-nav" aria-label="Main navigation">
          <a href={isAppointmentRoute ? '/#services' : '#services'}>{text.navServices}</a>
          <a href={isAppointmentRoute ? '/#hours' : '#hours'}>{text.navHours}</a>
          <a href={isAppointmentRoute ? '/#about' : '#about'}>{text.navAbout}</a>
        </nav>
        <button
          type="button"
          className="language-toggle"
          aria-label={text.languageLabel}
          onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
        >
          {text.language}
        </button>
        <a className="header-link appointment-header-link" href="/appointment">
          {text.bookAppointment} <span><ArrowIcon /></span>
        </a>
      </header>

      {isAppointmentRoute ? (
        <AppointmentPage
          text={text}
          language={language}
          appointmentMinDate={appointmentMinDate}
          appointmentMaxDate={appointmentMaxDate}
          appointmentBooked={appointmentBooked}
          appointmentError={appointmentError}
          appointmentName={appointmentName}
          setAppointmentName={setAppointmentName}
          appointmentPhone={appointmentPhone}
          setAppointmentPhone={setAppointmentPhone}
          appointmentEmail={appointmentEmail}
          setAppointmentEmail={setAppointmentEmail}
          appointmentService={appointmentService}
          setAppointmentService={setAppointmentService}
          formatServicePrice={formatServicePrice}
          appointmentDate={appointmentDate}
          setAppointmentDate={setAppointmentDate}
          setIsAppointmentLoading={setIsAppointmentLoading}
          appointmentTime={appointmentTime}
          setAppointmentTime={setAppointmentTime}
          setAppointmentBooked={setAppointmentBooked}
          setAppointmentError={setAppointmentError}
          isAppointmentLoading={isAppointmentLoading}
          appointmentSlots={appointmentSlots}
          formatScheduleTime={formatScheduleTime}
          isAppointmentSubmitting={isAppointmentSubmitting}
          handleAppointmentSubmit={handleAppointmentSubmit}
          formatAppointmentLoadingLabel={text.chatThinking}
          formatAppointmentNoSlotsLabel={text.appointmentNoSlots}
          formatAppointmentSelectTimeLabel={text.appointmentSelectTime}
        />
      ) : (
      <>
      <section className="hero" id="home">
        <div className="hero-copy">
          <p className="eyebrow"><span /> {text.localSalon}</p>
          <h1>{text.headlineFirst}<br /><em>{text.headlineSecond}</em></h1>
          <p className="hero-description">{text.heroDescription}</p>
          <p className="hero-location">{text.location}</p>
          <div className="hero-actions">
            <a className="button button-outline" href="/appointment">
              {text.bookAppointment} <ArrowIcon />
            </a>
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

      <VisitStrip
        text={text}
        status={status}
        currentTime={currentTime}
        todayHours={todayHours}
        formatHoursRange={formatHoursRange}
      />

      <ServiceSection text={text} language={language} />

      <OpeningHoursSection
        text={text}
        status={status}
        hours={settings.hours}
        dayNames={DAY_NAMES[language]}
        formatHoursRange={formatHoursRange}
      />

      <AboutSection text={text} />
      <SiteFooter text={text} pageViews={pageViews} year={now.getFullYear()} language={language} />

      <ChatWidget
        text={text}
        language={language}
        isOpen={isChatOpen}
        setIsOpen={setIsChatOpen}
        chatQuestion={chatQuestion}
        setChatQuestion={setChatQuestion}
        chatMessages={chatMessages}
        isChatLoading={isChatLoading}
        chatBookingStep={chatBookingStep}
        setChatBookingStep={setChatBookingStep}
        appointmentMinDate={appointmentMinDate}
        appointmentMaxDate={appointmentMaxDate}
        appointmentDate={appointmentDate}
        setAppointmentDate={setAppointmentDate}
        isAppointmentLoading={isAppointmentLoading}
        appointmentError={appointmentError}
        appointmentSlots={appointmentSlots}
        appointmentService={appointmentService}
        appointmentTime={appointmentTime}
        isAppointmentSubmitting={isAppointmentSubmitting}
        chooseChatBookingService={chooseChatBookingService}
        showChatBookingTimes={showChatBookingTimes}
        chooseChatBookingTime={chooseChatBookingTime}
        formatServicePrice={formatServicePrice}
        getServiceLabel={getServiceLabel}
        formatScheduleTime={formatScheduleTime}
        formatAppointmentDateTime={formatAppointmentDateTime}
        reserveAppointment={reserveAppointment}
        cancelChatBooking={cancelChatBooking}
        askChat={askChat}
        handleChatSubmit={handleChatSubmit}
      />
      </>
      )}

    </main>
  )
}

export default App
