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

type CustomerAppointmentUpdate = Pick<AppointmentNotification, 'slotStart' | 'name' | 'email' | 'service'>

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

function formatAppointmentTime(slotStart: string) {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(`${slotStart}:00+05:30`))
}

function customerEmailHtml(
  name: string,
  service: string,
  slotStart: string,
  kind: 'confirmed' | 'rescheduled' | 'cancelled',
  previousSlotStart?: string,
) {
  const content = {
    confirmed: {
      title: 'Your appointment is confirmed',
      message: 'We’re delighted you chose us. Your salon visit is all set.',
      closing: 'We look forward to welcoming you. Please arrive a few minutes early.',
    },
    rescheduled: {
      title: 'Your appointment time has changed',
      message: 'The salon has updated your appointment. Please check your new visit details below.',
      closing: 'We look forward to seeing you at the updated time.',
    },
    cancelled: {
      title: 'Your appointment has been cancelled',
      message: 'Your appointment at Suburaaj Salon &amp; Studio has been cancelled.',
      closing: 'If you would like to book another time, please visit our website or contact the salon.',
    },
  }[kind]
  const safeName = escapeHtml(name)
  const safeService = escapeHtml(service)
  const safeSlotStart = escapeHtml(formatAppointmentTime(slotStart))
  const scheduleRows = kind === 'rescheduled' && previousSlotStart
    ? `<tr><td style="padding:8px 0;color:#64748b;font-size:14px;">Previous time</td><td style="padding:8px 0;color:#64748b;font-size:14px;text-align:right;text-decoration:line-through;">${escapeHtml(formatAppointmentTime(previousSlotStart))}</td></tr>
       <tr><td style="padding:8px 0;color:#334155;font-size:14px;font-weight:700;">New time</td><td style="padding:8px 0;color:#334155;font-size:14px;font-weight:700;text-align:right;">${safeSlotStart}</td></tr>`
    : `<tr><td style="padding:8px 0;color:#64748b;font-size:14px;">Date &amp; time</td><td style="padding:8px 0;color:#334155;font-size:14px;font-weight:700;text-align:right;">${safeSlotStart}</td></tr>`

  return `<div style="margin:0;background:#f4f6f3;padding:32px 12px;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;">
    <tr><td style="background:#173f35;padding:28px 32px;text-align:center;">
      <div style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#c8e3d2;">Suburaaj Salon &amp; Studio</div>
      <div style="margin-top:10px;font-size:25px;line-height:1.3;font-weight:700;color:#ffffff;">${content.title}</div>
    </td></tr>
    <tr><td style="padding:30px 32px 12px;font-size:16px;line-height:1.7;">
      <p style="margin:0 0 12px;">Hello ${safeName},</p>
      <p style="margin:0;color:#52615b;">${content.message}</p>
    </td></tr>
    <tr><td style="padding:12px 32px 20px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f4f8f5;border:1px solid #e1ebe4;border-radius:12px;">
        <tr><td style="padding:18px 20px;">
          <div style="margin-bottom:8px;color:#64748b;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Your visit</div>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">Service</td><td style="padding:8px 0;color:#334155;font-size:14px;font-weight:700;text-align:right;">${safeService}</td></tr>
            ${scheduleRows}
          </table>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:0 32px 28px;color:#52615b;font-size:14px;line-height:1.7;">
      <p style="margin:0;">${content.closing}</p>
      <p style="margin:18px 0 0;color:#173f35;font-weight:700;">Warm regards,<br>Suburaaj Salon &amp; Studio</p>
    </td></tr>
    <tr><td style="padding:15px 24px;background:#f8faf8;text-align:center;color:#87928b;font-size:12px;">Palayamkottai, Tirunelveli</td></tr>
  </table>
</div>`
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

  const safeName = escapeHtml(appointment.name)
  const safeEmail = escapeHtml(appointment.email)
  const safePhone = escapeHtml(appointment.phone)
  const safeService = escapeHtml(appointment.service)
  const customerHtml = customerEmailHtml(
    appointment.name,
    appointment.service,
    appointment.slotStart,
    'confirmed',
  )
  const safeTime = escapeHtml(formatAppointmentTime(appointment.slotStart))
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

export async function sendCustomerAppointmentUpdate(
  appointment: CustomerAppointmentUpdate,
  env: Env,
  kind: 'rescheduled' | 'cancelled',
  previousSlotStart?: string,
) {
  const { BREVO_API_KEY, APPOINTMENT_EMAIL_FROM } = env
  if (
    !BREVO_API_KEY
    || !APPOINTMENT_EMAIL_FROM
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(APPOINTMENT_EMAIL_FROM)
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(appointment.email)
  ) {
    console.error('Customer appointment update email is unavailable because Brevo is not configured correctly.')
    return false
  }

  const subject = kind === 'rescheduled'
    ? 'Your Suburaaj Salon appointment has a new time'
    : 'Your Suburaaj Salon appointment has been cancelled'
  return sendEmail(
    BREVO_API_KEY,
    APPOINTMENT_EMAIL_FROM,
    appointment.email,
    appointment.name,
    subject,
    customerEmailHtml(appointment.name, appointment.service, appointment.slotStart, kind, previousSlotStart),
    'customer-update',
  )
}
