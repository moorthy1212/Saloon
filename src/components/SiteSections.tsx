import type { OpeningHoursEntry } from '../../shared/schedule'
import { ArrowIcon, ClockIcon, ScissorsIcon, ServiceIcon } from './SalonIcons'
import { SERVICE_MENU } from '../data/services'

type Language = 'en' | 'ta'
type Copy = Record<string, string>

type ShopStatus = {
  isOpen: boolean
  todayIndex: number
  message: string
}

type ServiceSectionProps = {
  text: Copy
  language: Language
}

export function ServiceSection({ text, language }: ServiceSectionProps) {
  return (
    <section className="services-section section-wrap" id="services">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{text.experience}</p>
          <h2>{text.priceListHeading}</h2>
        </div>
        <p>{text.serviceIntro}</p>
      </div>
      <div className="service-grid">
        {SERVICE_MENU.map((service, index) => (
          <article className="service-card" key={service.value}>
            <span className="service-number">{String(index + 1).padStart(2, '0')}</span>
            <span className="service-symbol"><ServiceIcon service={service.value} /></span>
            <h3>{service[language]}</h3>
            <p className="service-price">
              {'offerPrice' in service
                ? (
                  <>
                    <del>₹{service.price}</del>
                    <span className="service-offer">
                      <small>{language === 'ta' ? 'சலுகை' : 'Offer'}</small>
                      <span>₹{service.offerPrice}</span>
                    </span>
                  </>
                )
                : `₹${service.price}`}
            </p>
            <a className="service-card-link" href="/appointment" aria-label={`${text.bookAppointment}: ${service[language]}`}>
              <ArrowIcon />
            </a>
          </article>
        ))}
      </div>
    </section>
  )
}

type VisitStripProps = {
  text: Copy
  status: ShopStatus
  currentTime: string
  todayHours: OpeningHoursEntry
  formatHoursRange: (open: string | null, close: string | null, closedLabel?: string) => string
}

export function VisitStrip({ text, status, currentTime, todayHours, formatHoursRange }: VisitStripProps) {
  return (
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
          <small>{formatHoursRange(todayHours.open, todayHours.close, text.closed)}</small>
        </span>
      </div>
      <div className="strip-time">
        <span>{text.localTime}</span>
        <strong>{currentTime}</strong>
      </div>
    </section>
  )
}

type OpeningHoursSectionProps = {
  text: Copy
  status: ShopStatus
  hours: OpeningHoursEntry[]
  dayNames: string[]
  formatHoursRange: (open: string | null, close: string | null, closedLabel?: string) => string
}

export function OpeningHoursSection({
  text,
  status,
  hours,
  dayNames,
  formatHoursRange,
}: OpeningHoursSectionProps) {
  return (
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
          {hours.map((entry, index) => (
            <div className={`hours-row ${index === status.todayIndex ? 'today' : ''}`} key={entry.day}>
              <span>{dayNames[index]}{index === status.todayIndex && <small>{text.today}</small>}</span>
              <strong>{formatHoursRange(entry.open, entry.close, text.closed)}</strong>
            </div>
          ))}
        </div>
        <p className="hours-footnote">{text.hoursFootnote}</p>
      </div>
    </section>
  )
}

type AboutSectionProps = {
  text: Copy
}

export function AboutSection({ text }: AboutSectionProps) {
  return (
    <section className="about-section section-wrap" id="about">
      <span className="about-mark">“</span>
      <div>
        <p className="eyebrow">{text.note}</p>
        <h2>{text.aboutHeadingFirst}<br /><em>{text.aboutHeadingSecond}</em></h2>
      </div>
      <p className="about-copy">{text.aboutDescription}</p>
    </section>
  )
}

type SiteFooterProps = {
  text: Copy
  pageViews: number | null
  year: number
  language: Language
}

export function SiteFooter({ text, pageViews, year, language }: SiteFooterProps) {
  return (
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
          <a href="https://maps.app.goo.gl/iHccRzc98oSVdeUU6" target="_blank" rel="noreferrer">{text.mapLink}</a>
        </div>
      </div>

      <div className="footer-meta">
        <a href="#home" className="back-to-top">{text.backToTop}</a>
        <span className="page-views">{text.pageViews}: <strong>{pageViews?.toLocaleString(language) ?? '—'}</strong></span>
        <span className="copyright">© {year} Suburaaj Salon &amp; Studio. {text.rights}</span>
      </div>
    </footer>
  )
}
