import type { FormEvent } from 'react'
import type { OpeningHoursEntry } from '../../shared/schedule'
import { DAY_NAMES, formatAppointmentDateTime, formatScheduleTime } from '../lib/salon'
import type { AdminAppointment, Copy, Language } from '../types'
import { ScissorsIcon } from './SalonIcons'

type AdminPageProps = {
  text: Copy
  language: Language
  setLanguage: (language: Language) => void
  isAdminLoggedIn: boolean
  isAdminLoggingOut: boolean
  handleAdminLogout: () => Promise<void>
  isAdminSessionLoading: boolean
  adminSessionUnavailable: boolean
  retryAdminSession: () => void
  handleAdminLogin: (event: FormEvent<HTMLFormElement>) => void
  adminUser: string
  setAdminUser: (value: string) => void
  adminPassword: string
  setAdminPassword: (value: string) => void
  draftHours: OpeningHoursEntry[]
  handleHoursChange: (index: number, field: 'open' | 'close', value: string) => void
  handleClosedToggle: (index: number, isClosed: boolean) => void
  appointmentMinDate: string
  appointmentMaxDate: string
  draftHoliday: string
  setDraftHoliday: (value: string) => void
  draftHolidays: string[]
  setDraftHolidays: (value: string[]) => void
  setScheduleError: (value: string) => void
  setScheduleMessage: (value: string) => void
  isScheduleSaving: boolean
  handleAddHoliday: () => void
  isAdminAppointmentsLoading: boolean
  appointmentsError: boolean
  appointments: AdminAppointment[]
  appointmentActionId: string | null
  retryAppointmentNotification: (appointmentId: string) => Promise<void>
  editingAppointmentId: string | null
  setEditingAppointmentId: (value: string | null) => void
  setAppointmentActionError: (value: string) => void
  startEditingAppointment: (appointment: AdminAppointment) => void
  cancelAppointment: (appointmentId: string) => Promise<void>
  adminEditDate: string
  setAdminEditDate: (value: string) => void
  adminEditTime: string
  setAdminEditTime: (value: string) => void
  setAdminEditSlots: (value: string[]) => void
  isAdminEditSlotsLoading: boolean
  setIsAdminEditSlotsLoading: (value: boolean) => void
  adminEditSlots: string[]
  saveAppointmentChange: (appointmentId: string, time: string) => Promise<void>
  appointmentActionError: string
  appointmentActionMessage: string
  resetSchedule: () => void
  isDraftScheduleValid: boolean
  handleSaveSchedule: () => void
  scheduleError: string
  scheduleMessage: string
}

export function AdminPage({
  text,
  language,
  setLanguage,
  isAdminLoggedIn,
  isAdminLoggingOut,
  handleAdminLogout,
  isAdminSessionLoading,
  adminSessionUnavailable,
  retryAdminSession,
  handleAdminLogin,
  adminUser,
  setAdminUser,
  adminPassword,
  setAdminPassword,
  draftHours,
  handleHoursChange,
  handleClosedToggle,
  appointmentMinDate,
  appointmentMaxDate,
  draftHoliday,
  setDraftHoliday,
  draftHolidays,
  setDraftHolidays,
  setScheduleError,
  setScheduleMessage,
  isScheduleSaving,
  handleAddHoliday,
  isAdminAppointmentsLoading,
  appointmentsError,
  appointments,
  appointmentActionId,
  retryAppointmentNotification,
  editingAppointmentId,
  setEditingAppointmentId,
  setAppointmentActionError,
  startEditingAppointment,
  cancelAppointment,
  adminEditDate,
  setAdminEditDate,
  adminEditTime,
  setAdminEditTime,
  setAdminEditSlots,
  isAdminEditSlotsLoading,
  setIsAdminEditSlotsLoading,
  adminEditSlots,
  saveAppointmentChange,
  appointmentActionError,
  appointmentActionMessage,
  resetSchedule,
  isDraftScheduleValid,
  handleSaveSchedule,
  scheduleError,
  scheduleMessage,
}: AdminPageProps) {
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
            <button
              type="button"
              className="secondary-button"
              disabled={isAdminLoggingOut}
              onClick={() => void handleAdminLogout()}
            >
              {language === 'ta' ? 'வெளியேறு' : 'Log out'}
            </button>
          )}
          <a className="admin-back-link" href="/">{text.backToWebsite}</a>
        </div>
      </header>

      <section className="admin-page-content">
        {isAdminSessionLoading ? (
          <div className="admin-login" role="status">{text.adminSessionChecking}</div>
        ) : adminSessionUnavailable ? (
          <div className="admin-login" role="alert">
            <p className="admin-page-description">{text.adminSessionUnavailable}</p>
            <button type="button" className="primary-button" onClick={retryAdminSession}>
              {text.retryAdminSession}
            </button>
          </div>
        ) : !isAdminLoggedIn ? (
          <form className="admin-login" onSubmit={handleAdminLogin}>
            <div className="admin-heading-row">
              <div>
                <p className="eyebrow">{text.adminAccess}</p>
                <h1>{text.manageTimings}</h1>
              </div>
            </div>
            <p className="admin-page-description">
              {language === 'ta' ? 'கடை நேரம், விடுமுறைகள் மற்றும் முன்பதிவுகளை நிர்வகிக்க உள்நுழையவும்.' : 'Sign in to manage salon hours, holidays, and appointments.'}
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
              <p className="admin-page-description">{text.scheduleInstructions}</p>
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
                  min={appointmentMinDate}
                  value={draftHoliday}
                  onChange={(event) => {
                    setDraftHoliday(event.target.value)
                    setScheduleError('')
                    setScheduleMessage('')
                  }}
                />
                <button
                  type="button"
                  className="secondary-button"
                  disabled={!draftHoliday || draftHolidays.includes(draftHoliday) || isScheduleSaving}
                  onClick={handleAddHoliday}
                >
                  {text.addHoliday}
                </button>
              </div>
              <div className="holiday-list">
                {draftHolidays.map((holiday) => (
                  <span key={holiday} className="holiday-chip">
                    {holiday}
                    <button
                      type="button"
                      aria-label={`Remove ${holiday}`}
                      disabled={isScheduleSaving}
                      onClick={() => {
                        setDraftHolidays(draftHolidays.filter((item) => item !== holiday))
                        setScheduleError('')
                        setScheduleMessage('')
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="admin-section">
              <h2>{text.appointments}</h2>
              {isAdminAppointmentsLoading ? (
                <p className="admin-page-description">{text.appointmentsLoading}</p>
              ) : appointmentsError ? (
                <p className="admin-page-description">{text.appointmentsUnavailable}</p>
              ) : appointments.length === 0 ? (
                <p className="admin-page-description">{text.noAppointments}</p>
              ) : (
                <ol className="appointment-list">
                  {appointments.map((appointment) => (
                    <li className="appointment-admin-card" key={appointment.id}>
                      <div>
                        <strong>{formatAppointmentDateTime(appointment.slotStart, language)}</strong>
                        <span>{appointment.name} · {appointment.service}</span>
                        <a href={`tel:${appointment.phone}`}>{appointment.phone}</a>
                        {appointment.email
                          ? <a href={`mailto:${appointment.email}`}>{appointment.email}</a>
                          : <span>{text.appointmentEmailMissing}</span>}
                        <span>{appointment.emailNotified ? text.appointmentEmailSent : text.appointmentEmailPending}</span>
                      </div>
                      <div className="appointment-admin-actions">
                        {!appointment.emailNotified && appointment.email && (
                          <button
                            type="button"
                            className="secondary-button"
                            disabled={appointmentActionId !== null}
                            onClick={() => void retryAppointmentNotification(appointment.id)}
                          >
                            {appointmentActionId === appointment.id ? text.appointmentActionLoading : text.retryAppointmentEmail}
                          </button>
                        )}
                        <button
                          type="button"
                          className="secondary-button"
                          disabled={appointmentActionId !== null}
                          onClick={() => {
                            if (editingAppointmentId === appointment.id) {
                              setEditingAppointmentId(null)
                              setAppointmentActionError('')
                            } else {
                              startEditingAppointment(appointment)
                            }
                          }}
                        >
                          {editingAppointmentId === appointment.id ? text.closeAppointmentEdit : text.editAppointment}
                        </button>
                        <button
                          type="button"
                          className="secondary-button appointment-cancel-button"
                          disabled={appointmentActionId !== null}
                          onClick={() => void cancelAppointment(appointment.id)}
                        >
                          {text.cancelAppointment}
                        </button>
                      </div>
                      {editingAppointmentId === appointment.id && (
                        <div className="appointment-admin-edit">
                          <label>
                            <span>{text.appointmentDate}</span>
                            <input
                              type="date"
                              min={appointmentMinDate}
                              max={appointmentMaxDate}
                              required
                              value={adminEditDate}
                              onChange={(event) => {
                                setAdminEditDate(event.target.value)
                                setAdminEditTime('')
                                setAdminEditSlots([])
                                setIsAdminEditSlotsLoading(true)
                                setAppointmentActionError('')
                              }}
                            />
                          </label>
                          <label>
                            <span>{text.appointmentTime}</span>
                            <select
                              value={adminEditTime}
                              onChange={(event) => setAdminEditTime(event.target.value)}
                              disabled={isAdminEditSlotsLoading || adminEditSlots.length === 0}
                              required
                            >
                              <option value="" disabled>
                                {isAdminEditSlotsLoading ? text.appointmentsLoading : text.appointmentSelectTime}
                              </option>
                              {adminEditSlots.map((slot) => (
                                <option value={slot} key={slot}>{formatScheduleTime(slot)}</option>
                              ))}
                            </select>
                          </label>
                          <button
                            type="button"
                            className="primary-button"
                            disabled={
                              appointmentActionId !== null
                              || isAdminEditSlotsLoading
                              || !adminEditTime
                              || !adminEditSlots.includes(adminEditTime)
                            }
                            onClick={() => void saveAppointmentChange(appointment.id, adminEditTime)}
                          >
                            {appointmentActionId === appointment.id ? text.appointmentActionLoading : text.saveAppointmentChange}
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              )}
              {appointmentActionError && <p className="appointment-error" role="alert">{appointmentActionError}</p>}
              {appointmentActionMessage && <p className="appointment-success" role="status">{appointmentActionMessage}</p>}
              <p className="admin-page-description">{text.appointmentNotificationsOnHold}</p>
            </div>

            <div className="admin-actions">
              <button type="button" className="secondary-button" disabled={isScheduleSaving} onClick={resetSchedule}>{text.reset}</button>
              <button type="button" className="primary-button" disabled={isScheduleSaving || !isDraftScheduleValid} onClick={handleSaveSchedule}>
                {isScheduleSaving ? text.scheduleSaving : text.saveChanges}
              </button>
            </div>
            {!isDraftScheduleValid && <p className="appointment-error" role="alert">{text.scheduleInvalidHours}</p>}
            {scheduleError && <p className="appointment-error" role="alert">{scheduleError}</p>}
            {scheduleMessage && <p className="appointment-success" role="status">{scheduleMessage}</p>}
          </div>
        )}
      </section>
    </main>
  )
}
