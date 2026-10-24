import type { FormEvent } from 'react'
import { SERVICE_MENU } from '../data/services'

type Language = 'en' | 'ta'
type Copy = Record<string, string>

type AppointmentPageProps = {
  text: Copy
  language: Language
  appointmentMinDate: string
  appointmentMaxDate: string
  appointmentBooked: boolean
  appointmentError: string
  appointmentName: string
  setAppointmentName: (value: string) => void
  appointmentPhone: string
  setAppointmentPhone: (value: string) => void
  appointmentEmail: string
  setAppointmentEmail: (value: string) => void
  appointmentService: string
  setAppointmentService: (value: string) => void
  formatServicePrice: (value: string, language: Language) => string
  appointmentDate: string
  setAppointmentDate: (value: string) => void
  setIsAppointmentLoading: (value: boolean) => void
  setAppointmentTime: (value: string) => void
  setAppointmentBooked: (value: boolean) => void
  setAppointmentError: (value: string) => void
  appointmentTime: string
  isAppointmentLoading: boolean
  appointmentSlots: string[]
  formatScheduleTime: (time: string) => string
  isAppointmentSubmitting: boolean
  handleAppointmentSubmit: (event: FormEvent<HTMLFormElement>) => void
  formatAppointmentLoadingLabel: string
  formatAppointmentNoSlotsLabel: string
  formatAppointmentSelectTimeLabel: string
}

export function AppointmentPage({
  text,
  language,
  appointmentMinDate,
  appointmentMaxDate,
  appointmentBooked,
  appointmentError,
  appointmentName,
  setAppointmentName,
  appointmentPhone,
  setAppointmentPhone,
  appointmentEmail,
  setAppointmentEmail,
  appointmentService,
  setAppointmentService,
  formatServicePrice,
  appointmentDate,
  setAppointmentDate,
  setIsAppointmentLoading,
  setAppointmentTime,
  setAppointmentBooked,
  setAppointmentError,
  appointmentTime,
  isAppointmentLoading,
  appointmentSlots,
  formatScheduleTime,
  isAppointmentSubmitting,
  handleAppointmentSubmit,
  formatAppointmentLoadingLabel,
  formatAppointmentNoSlotsLabel,
  formatAppointmentSelectTimeLabel,
}: AppointmentPageProps) {
  return (
    <section className="appointment-page">
      <a className="text-link appointment-back-link" href="/">{language === 'ta' ? '← முகப்புக்குத் திரும்பு' : '← Back to the salon'}</a>
      <div className="appointment-card">
        <p className="eyebrow">{text.localSalon}</p>
        <h1>{text.appointmentHeading}</h1>
        <p className="appointment-intro">{text.appointmentIntro}</p>
        {appointmentBooked && <p className="appointment-success" role="status">{text.appointmentSuccess}</p>}
        {appointmentError && <p className="appointment-error" role="alert">{appointmentError}</p>}
        <form className="appointment-form" onSubmit={handleAppointmentSubmit}>
          <label>
            <span>{text.appointmentName}</span>
            <input
              type="text"
              autoComplete="name"
              maxLength={80}
              value={appointmentName}
              onChange={(event) => setAppointmentName(event.target.value)}
              required
            />
          </label>
          <label>
            <span>{text.appointmentPhone}</span>
            <input
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              pattern="(?:\+?91(?:\s|-)?)?[6-9]\d{9}"
              title="Enter a valid Indian mobile number."
              maxLength={16}
              value={appointmentPhone}
              onChange={(event) => setAppointmentPhone(event.target.value)}
              required
            />
          </label>
          <label>
            <span>{text.appointmentEmail}</span>
            <input
              type="email"
              autoComplete="email"
              maxLength={254}
              value={appointmentEmail}
              onChange={(event) => setAppointmentEmail(event.target.value)}
              required
            />
          </label>
          <label>
            <span>{text.appointmentService}</span>
            <select value={appointmentService} onChange={(event) => setAppointmentService(event.target.value)} required>
              <option value="" disabled>{language === 'ta' ? 'சேவையைத் தேர்வு செய்யுங்கள்' : 'Choose a service'}</option>
              {SERVICE_MENU.map((service) => (
                <option value={service.value} key={service.value}>
                  {service[language]} · {formatServicePrice(service.value, language)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{text.appointmentDate}</span>
            <input
              type="date"
              min={appointmentMinDate}
              max={appointmentMaxDate}
              value={appointmentDate}
              onChange={(event) => {
                setAppointmentDate(event.target.value)
                setIsAppointmentLoading(true)
                setAppointmentTime('')
                setAppointmentBooked(false)
                setAppointmentError('')
              }}
              required
            />
          </label>
          <label>
            <span>{text.appointmentTime}</span>
            <select
              value={appointmentTime}
              onChange={(event) => {
                setAppointmentTime(event.target.value)
                setAppointmentBooked(false)
              }}
              disabled={isAppointmentLoading || appointmentSlots.length === 0}
              required
            >
              <option value="" disabled>
                {isAppointmentLoading
                  ? formatAppointmentLoadingLabel
                  : appointmentSlots.length
                    ? formatAppointmentSelectTimeLabel
                    : formatAppointmentNoSlotsLabel}
              </option>
              {appointmentSlots.map((slot) => <option value={slot} key={slot}>{formatScheduleTime(slot)}</option>)}
            </select>
          </label>
          <button type="submit" className="primary-button" disabled={isAppointmentSubmitting || isAppointmentLoading || !appointmentSlots.length}>
            {isAppointmentSubmitting ? text.appointmentSubmitting : text.appointmentSubmit}
          </button>
        </form>
        <p className="appointment-privacy">{text.appointmentPrivacy}</p>
      </div>
    </section>
  )
}
