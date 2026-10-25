import { useEffect, useState, type FormEvent } from 'react'
import type { Copy, Language } from '../types'
import { formatAppointmentDateTime, formatScheduleTime } from '../lib/salon'

type ManagedAppointment = {
  slotStart: string
  service: string
}

type ManageAppointmentPageProps = {
  text: Copy
  language: Language
  appointmentMinDate: string
  appointmentMaxDate: string
}

function isManagedAppointment(value: unknown): value is ManagedAppointment {
  return typeof value === 'object' && value !== null
    && 'slotStart' in value && typeof value.slotStart === 'string'
    && 'service' in value && typeof value.service === 'string'
}

export function ManageAppointmentPage({
  text,
  language,
  appointmentMinDate,
  appointmentMaxDate,
}: ManageAppointmentPageProps) {
  const [token] = useState(() => window.location.hash.slice(1))
  const [appointment, setAppointment] = useState<ManagedAppointment | null>(null)
  const [appointmentDate, setAppointmentDate] = useState('')
  const [appointmentTime, setAppointmentTime] = useState('')
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [slotsForDate, setSlotsForDate] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(() => Boolean(window.location.hash.slice(1)))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isInvalidLink, setIsInvalidLink] = useState(() => !window.location.hash.slice(1))
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isDone, setIsDone] = useState(false)
  const isSlotsLoading = Boolean(appointment && appointmentDate && slotsForDate !== appointmentDate)

  useEffect(() => {
    if (!token) return

    let cancelled = false
    fetch('/api/appointment-manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'details', token }),
    })
      .then(async (response) => {
        const result: unknown = await response.json()
        if (response.status === 404) {
          if (!cancelled) setIsInvalidLink(true)
          return null
        }
        if (!response.ok || !result || typeof result !== 'object' || !('appointment' in result)
          || !isManagedAppointment(result.appointment)) {
          throw new Error('Appointment details could not be loaded.')
        }
        return result.appointment
      })
      .then((result) => {
        if (!cancelled && result) {
          setAppointment(result)
          setAppointmentDate(result.slotStart.slice(0, 10))
          setIsInvalidLink(false)
        }
      })
      .catch((loadError: unknown) => {
        if (cancelled) return
        console.error('Customer appointment details could not be loaded.', loadError)
        setError(text.manageAppointmentUnavailable)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [text.manageAppointmentUnavailable, token])

  useEffect(() => {
    if (!appointment || !appointmentDate || isDone) return
    let cancelled = false
    fetch(`/api/appointments?date=${encodeURIComponent(appointmentDate)}`)
      .then(async (response) => {
        const result: unknown = await response.json()
        if (!response.ok || !result || typeof result !== 'object' || !('slots' in result) || !Array.isArray(result.slots)) {
          throw new Error('Appointment times could not be loaded.')
        }
        return result.slots.filter((slot): slot is string => typeof slot === 'string')
      })
      .then((slots) => {
        if (!cancelled) {
          setAvailableSlots(slots.filter((slot) => (
            appointmentDate !== appointment.slotStart.slice(0, 10)
            || slot !== appointment.slotStart.slice(11, 16)
          )))
          setSlotsForDate(appointmentDate)
        }
      })
      .catch((loadError: unknown) => {
        if (cancelled) return
        console.error('Customer appointment slots could not be loaded.', loadError)
        setAvailableSlots([])
        setSlotsForDate(appointmentDate)
        setError(text.manageAppointmentUnavailable)
      })
    return () => { cancelled = true }
  }, [appointment, appointmentDate, isDone, text.manageAppointmentUnavailable])

  const submitAction = async (action: 'reschedule' | 'cancel', event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    if (!token || isSubmitting) return
    if (action === 'cancel' && !window.confirm(text.manageAppointmentCancelConfirm)) return

    setIsSubmitting(true)
    setError('')
    setMessage('')
    try {
      const response = await fetch('/api/appointment-manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          token,
          ...(action === 'reschedule' ? { date: appointmentDate, time: appointmentTime } : {}),
        }),
      })
      const result: unknown = await response.json()
      if (response.status === 404) {
        setIsInvalidLink(true)
        return
      }
      if (response.status === 409) {
        setError(text.appointmentTimeUnavailable)
        return
      }
      if (!response.ok) throw new Error('Appointment update failed.')

      if (action === 'cancel') {
        setIsDone(true)
        setMessage(text.manageAppointmentCancelSuccess)
        return
      }

      if (!result || typeof result !== 'object' || !('slotStart' in result) || typeof result.slotStart !== 'string') {
        throw new Error('Appointment update response was invalid.')
      }
      const slotStart = result.slotStart
      setAppointment((current) => current ? { ...current, slotStart } : current)
      setIsDone(true)
      setMessage('notificationSent' in result && result.notificationSent === true
        ? text.manageAppointmentSaveSuccess
        : text.manageAppointmentSavePending)
    } catch (actionError: unknown) {
      console.error('Customer appointment update failed.', actionError)
      setError(text.manageAppointmentUnavailable)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="appointment-page">
      <a className="text-link appointment-back-link" href="/">{language === 'ta' ? '← முகப்புக்குத் திரும்பு' : '← Back to the salon'}</a>
      <div className="appointment-card">
        <p className="eyebrow">{text.localSalon}</p>
        <h1>{text.manageAppointment}</h1>
        <p className="appointment-intro">{text.manageAppointmentIntro}</p>
        {isLoading && <p className="appointment-success" role="status">{text.manageAppointmentLoading}</p>}
        {!isLoading && isInvalidLink && <p className="appointment-error" role="alert">{text.manageAppointmentInvalid}</p>}
        {error && <p className="appointment-error" role="alert">{error}</p>}
        {message && <p className="appointment-success" role="status">{message}</p>}

        {appointment && !isLoading && !isInvalidLink && !isDone && (
          <>
            <div className="managed-appointment-summary">
              <p><strong>{text.appointmentService}:</strong> {appointment.service}</p>
              <p><strong>{text.appointmentTime}:</strong> {formatAppointmentDateTime(appointment.slotStart, language)}</p>
            </div>
            <form className="appointment-form" onSubmit={(event) => void submitAction('reschedule', event)}>
              <p className="managed-appointment-instruction">{text.manageAppointmentChooseTime}</p>
              <label>
                <span>{text.appointmentDate}</span>
                <input
                  type="date"
                  min={appointmentMinDate}
                  max={appointmentMaxDate}
                  value={appointmentDate}
                  onChange={(event) => {
                    setAppointmentDate(event.target.value)
                    setAppointmentTime('')
                    setError('')
                  }}
                  required
                />
              </label>
              <label>
                <span>{text.appointmentTime}</span>
                <select
                  value={appointmentTime}
                  onChange={(event) => setAppointmentTime(event.target.value)}
                  disabled={isSlotsLoading || availableSlots.length === 0}
                  required
                >
                  <option value="" disabled>
                    {isSlotsLoading ? text.chatThinking : availableSlots.length ? text.appointmentSelectTime : text.appointmentNoSlots}
                  </option>
                  {availableSlots.map((slot) => (
                    <option value={slot} key={slot}>{formatScheduleTime(slot)}</option>
                  ))}
                </select>
              </label>
              <button type="submit" className="primary-button" disabled={isSubmitting || isSlotsLoading || !appointmentTime}>
                {isSubmitting ? text.appointmentSubmitting : text.manageAppointmentReschedule}
              </button>
              <button
                type="button"
                className="secondary-button"
                disabled={isSubmitting}
                onClick={() => void submitAction('cancel')}
              >
                {isSubmitting ? text.appointmentSubmitting : text.manageAppointmentCancel}
              </button>
            </form>
          </>
        )}
      </div>
    </section>
  )
}
