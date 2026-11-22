type Language = 'en' | 'ta'
type Copy = Record<string, string>

type AppointmentPageProps = {
  text: Copy
  language: Language
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
