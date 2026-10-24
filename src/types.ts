export type Language = 'en' | 'ta'
export type ChatMessage = { role: 'user' | 'assistant'; content: string }
export type ChatBookingStep = 'service' | 'date' | 'time' | 'name' | 'phone' | 'email' | 'confirm' | null
export type Copy = Record<string, string>
export type AdminAppointment = {
  id: string
  slotStart: string
  name: string
  phone: string
  email?: string
  service: string
  emailNotified: boolean
}
