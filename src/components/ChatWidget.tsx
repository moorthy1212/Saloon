import { useEffect, useRef, type FormEvent } from 'react'
import type { ChatBookingStep, ChatMessage, Copy, Language } from '../types'
import { SERVICE_MENU } from '../data/services'
import { ScissorsIcon } from './SalonIcons'

type ChatWidgetProps = {
  text: Copy
  language: Language
  isOpen: boolean
  setIsOpen: (value: boolean) => void
  chatQuestion: string
  setChatQuestion: (value: string) => void
  chatMessages: ChatMessage[]
  isChatLoading: boolean
  chatBookingStep: ChatBookingStep
  setChatBookingStep: (value: ChatBookingStep) => void
  appointmentMinDate: string
  appointmentMaxDate: string
  appointmentDate: string
  setAppointmentDate: (value: string) => void
  isAppointmentLoading: boolean
  appointmentError: string
  appointmentSlots: string[]
  appointmentService: string
  appointmentTime: string
  isAppointmentSubmitting: boolean
  chooseChatBookingService: (service: string, label: string) => void
  showChatBookingTimes: () => void
  chooseChatBookingTime: (time: string) => void
  formatServicePrice: (value: string, language: Language) => string
  getServiceLabel: (value: string, language: Language) => string
  formatScheduleTime: (time: string) => string
  formatAppointmentDateTime: (slotStart: string, language: Language) => string
  reserveAppointment: (source: 'form' | 'chat') => Promise<void>
  cancelChatBooking: () => void
  askChat: (question: string) => Promise<void>
  handleChatSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function ChatWidget({
  text,
  language,
  isOpen,
  setIsOpen,
  chatQuestion,
  setChatQuestion,
  chatMessages,
  isChatLoading,
  chatBookingStep,
  setChatBookingStep,
  appointmentMinDate,
  appointmentMaxDate,
  appointmentDate,
  setAppointmentDate,
  isAppointmentLoading,
  appointmentError,
  appointmentSlots,
  appointmentService,
  appointmentTime,
  isAppointmentSubmitting,
  chooseChatBookingService,
  showChatBookingTimes,
  chooseChatBookingTime,
  formatServicePrice,
  getServiceLabel,
  formatScheduleTime,
  formatAppointmentDateTime,
  reserveAppointment,
  cancelChatBooking,
  askChat,
  handleChatSubmit,
}: ChatWidgetProps) {
  const chatMessagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (isOpen) chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [chatMessages, isChatLoading, isOpen])

  return (
    <section className={`chat-widget${isOpen ? ' is-open' : ''}`} aria-label={text.chatTitle}>
      {isOpen && (
        <div className="chat-panel">
          <header className="chat-panel-header">
            <span className="chat-avatar"><ScissorsIcon /></span>
            <div>
              <strong>{text.chatTitle}</strong>
              <span className="chat-status">{text.chatStatus}</span>
            </div>
            <button type="button" className="chat-close" aria-label={text.chatClose} onClick={() => setIsOpen(false)}>×</button>
          </header>
          <div className="chat-messages" aria-live="polite" aria-busy={isChatLoading}>
            <div className="chat-bubble-row assistant">
              <span className="chat-message-avatar"><ScissorsIcon /></span>
              <p className="chat-bubble assistant">{text.chatWelcome}</p>
            </div>
            {chatMessages.map((message, index) => (
              message.role === 'assistant'
                ? (
                  <div className="chat-bubble-row assistant" key={`${index}-${message.role}`}>
                    <span className="chat-message-avatar"><ScissorsIcon /></span>
                    <div className="chat-bubble assistant">
                      <p>{message.content}</p>
                    </div>
                  </div>
                )
                : <p className="chat-bubble user" key={`${index}-${message.role}`}>{message.content}</p>
            ))}
            {chatBookingStep && (
              <div className="chat-booking-controls">
                {chatBookingStep === 'service' && (
                  <>
                    <p>{text.chatChooseService}</p>
                    {SERVICE_MENU.map((service) => (
                      <button
                        type="button"
                        key={service.value}
                        onClick={() => chooseChatBookingService(service.value, `${service[language]} · ${formatServicePrice(service.value, language)}`)}
                      >
                        {service[language]} · {formatServicePrice(service.value, language)}
                      </button>
                    ))}
                  </>
                )}
                {chatBookingStep === 'date' && (
                  <>
                    <label>
                      <span>{text.appointmentDate}</span>
                      <input
                        type="date"
                        min={appointmentMinDate}
                        max={appointmentMaxDate}
                        value={appointmentDate}
                        onChange={(event) => setAppointmentDate(event.target.value)}
                      />
                    </label>
                    <button type="button" onClick={showChatBookingTimes}>{text.chatContinue}</button>
                  </>
                )}
                {chatBookingStep === 'time' && (
                  <>
                    {isAppointmentLoading
                      ? <p>{text.chatThinking}</p>
                      : appointmentError
                        ? null
                        : appointmentSlots.length
                          ? appointmentSlots.map((slot) => (
                            <button type="button" key={slot} onClick={() => chooseChatBookingTime(slot)}>
                              {formatScheduleTime(slot)}
                            </button>
                          ))
                          : <p>{text.chatNoSlots}</p>}
                    <button type="button" className="chat-booking-secondary" onClick={() => setChatBookingStep('date')}>
                      {text.chatChangeDate}
                    </button>
                  </>
                )}
                {chatBookingStep === 'confirm' && (
                  <>
                    <p><strong>{text.chatBookingService}:</strong> {getServiceLabel(appointmentService, language)} · {formatServicePrice(appointmentService, language)}</p>
                    <p><strong>{text.chatBookingTime}:</strong> {formatAppointmentDateTime(`${appointmentDate}T${appointmentTime}`, language)}</p>
                    <button type="button" disabled={isAppointmentSubmitting} onClick={() => void reserveAppointment('chat')}>
                      {isAppointmentSubmitting ? text.appointmentSubmitting : text.chatConfirm}
                    </button>
                  </>
                )}
                {appointmentError && <p className="chat-booking-error" role="alert">{appointmentError}</p>}
                <button type="button" className="chat-booking-secondary" onClick={cancelChatBooking}>{text.chatCancel}</button>
              </div>
            )}
            {isChatLoading && (
              <div className="chat-bubble-row assistant">
                <span className="chat-message-avatar"><ScissorsIcon /></span>
                <p className="chat-bubble assistant">{text.chatThinking}</p>
              </div>
            )}
            {chatMessages.length === 0 && (
              <div className="chat-quick-questions">
                <button type="button" onClick={() => void askChat(text.chatQuickServices)}>{text.chatQuickServices}</button>
                <button type="button" onClick={() => void askChat(text.chatQuickHours)}>{text.chatQuickHours}</button>
                <button type="button" onClick={() => void askChat(text.chatQuickExperience)}>{text.chatQuickExperience}</button>
              </div>
            )}
            <div ref={chatMessagesEndRef} />
          </div>
          <form className="chat-form" onSubmit={handleChatSubmit}>
            <input
              value={chatQuestion}
              maxLength={
                chatBookingStep === 'phone' ? 16
                  : chatBookingStep === 'name' ? 80
                    : chatBookingStep === 'email' ? 254
                      : 500
              }
              onChange={(event) => setChatQuestion(event.target.value)}
              type={chatBookingStep === 'phone' ? 'tel' : chatBookingStep === 'email' ? 'email' : 'text'}
              inputMode={chatBookingStep === 'phone' ? 'tel' : chatBookingStep === 'email' ? 'email' : 'text'}
              autoComplete="off"
              placeholder={
                chatBookingStep === 'name' ? text.chatNamePlaceholder
                  : chatBookingStep === 'phone' ? text.chatPhonePlaceholder
                    : chatBookingStep === 'email' ? text.chatEmailPlaceholder
                      : text.chatPlaceholder
              }
              aria-label={
                chatBookingStep === 'name' ? text.chatNamePlaceholder
                  : chatBookingStep === 'phone' ? text.chatPhonePlaceholder
                    : chatBookingStep === 'email' ? text.chatEmailPlaceholder
                      : text.chatPlaceholder
              }
              disabled={isChatLoading || Boolean(
                chatBookingStep
                && chatBookingStep !== 'name'
                && chatBookingStep !== 'phone'
                && chatBookingStep !== 'email',
              )}
            />
            <button
              type="submit"
              disabled={isChatLoading || !chatQuestion.trim() || Boolean(
                chatBookingStep
                && chatBookingStep !== 'name'
                && chatBookingStep !== 'phone'
                && chatBookingStep !== 'email',
              )}
            >
              {text.chatSend}
            </button>
          </form>
          <p className="chat-privacy">{text.chatPrivacy}</p>
        </div>
      )}
      <button
        hidden={isOpen}
        type="button"
        className="chat-toggle"
        aria-expanded={isOpen}
        aria-label={text.chatOpen}
        title={text.chatOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="chat-toggle-icon" aria-hidden="true"><ScissorsIcon /></span>
      </button>
    </section>
  )
}
