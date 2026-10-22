import type { Env } from './auth'

export type AppointmentNotification = {
  slotStart: string
  name: string
  email: string
  phone: string
  service: string
  customerEmailNotified: boolean
  salonEmailNotified: boolean
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] ?? character)
}

async function sendEmail(
  apiKey: string,
  from: string,
  to: string,
  recipientName: string | undefined,
  subject: string,
  htmlContent: string,
  recipientType: string,
) {
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Suburaaj Salon & Studio', email: from },
        to: [{ email: to, ...(recipientName ? { name: recipientName } : {}) }],
        subject,
        htmlContent,
        tags: ['appointment', recipientType],
      }),
      signal: AbortSignal.timeout(8_000),
    })
    if (response.ok) return true

    console.error(`Brevo could not send the ${recipientType} appointment email (status ${response.status}).`)
    return false
  } catch (error) {
    console.error(`Brevo request failed for the ${recipientType} appointment email.`, error)
    return false
  }
}

export async function sendAppointmentNotification(
  appointment: AppointmentNotification,
  env: Env,
) {
  const { BREVO_API_KEY, APPOINTMENT_EMAIL_FROM, SALON_NOTIFICATION_EMAIL } = env
  if (
    !BREVO_API_KEY
    || !APPOINTMENT_EMAIL_FROM
    || !SALON_NOTIFICATION_EMAIL
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(APPOINTMENT_EMAIL_FROM)
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(SALON_NOTIFICATION_EMAIL)
  ) {
    console.error('Appointment email notifications are unavailable because Brevo is not configured correctly.')
    return { customerSent: false, salonSent: false }
  }

  const appointmentTime = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(`${appointment.slotStart}:00+05:30`))
  const safeName = escapeHtml(appointment.name)
  const safeEmail = escapeHtml(appointment.email)
  const safePhone = escapeHtml(appointment.phone)
  const safeService = escapeHtml(appointment.service)
  const safeTime = escapeHtml(appointmentTime)
  const customerHtml = [
    `<p>Hello ${safeName},</p>`,
    '<p>Your appointment at Suburaaj Salon &amp; Studio is confirmed.</p>',
    `<p><strong>Service:</strong> ${safeService}<br><strong>Date and time:</strong> ${safeTime}</p>`,
    '<p>We look forward to seeing you.</p>',
  ].join('')
  const salonHtml = [
    '<p>A new appointment has been booked.</p>',
    `<p><strong>Customer:</strong> ${safeName}<br>`,
    `<strong>Phone:</strong> ${safePhone}<br>`,
    `<strong>Email:</strong> ${safeEmail}<br>`,
    `<strong>Service:</strong> ${safeService}<br>`,
    `<strong>Date and time:</strong> ${safeTime}</p>`,
  ].join('')

  const [customerSent, salonSent] = await Promise.all([
    appointment.customerEmailNotified
      ? Promise.resolve(true)
      : sendEmail(
        BREVO_API_KEY,
        APPOINTMENT_EMAIL_FROM,
        appointment.email,
        appointment.name,
        'Your Suburaaj Salon appointment is confirmed',
        customerHtml,
        'customer',
      ),
    appointment.salonEmailNotified
      ? Promise.resolve(true)
      : sendEmail(
        BREVO_API_KEY,
        APPOINTMENT_EMAIL_FROM,
        SALON_NOTIFICATION_EMAIL,
        undefined,
        'New Suburaaj Salon appointment',
        salonHtml,
        'salon',
      ),
  ])
  return { customerSent, salonSent }
}
