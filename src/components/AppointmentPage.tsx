import type { FormEvent } from 'react'

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
}: AppointmentPageProps) {
  return (
    <section className="appointment-page">
      <a className="text-link appointment-back-link" href="/">{language === 'ta' ? '← முகப்புக்குத் திரும்பு' : '← Back to the salon'}</a>
      <div className="appointment-card">
        <p className="eyebrow">{text.localSalon}</p>
        <h1>{text.appointmentComingSoonHeading}</h1>
        <p className="appointment-intro">{text.appointmentComingSoon}</p>
      </div>
    </section>
  )
}
