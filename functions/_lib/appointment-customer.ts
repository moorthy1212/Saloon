export type AppointmentCustomerDetails = {
  name: string
  phone: string
  email?: string
  service: string
}

function decodeBase64(value: string) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0))
}

export async function decryptAppointmentCustomerDetails(ciphertext: string, secret: string): Promise<AppointmentCustomerDetails> {
  const keyBytes = decodeBase64(secret)
  if (keyBytes.byteLength !== 32) throw new Error('Booking encryption key must decode to 32 bytes.')

  const combined = decodeBase64(ciphertext)
  const iv = combined.slice(0, 12)
  const data = combined.slice(12)
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['decrypt'])
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
  const details: unknown = JSON.parse(new TextDecoder().decode(plaintext))
  const email = typeof details === 'object' && details !== null && 'email' in details
    ? details.email
    : undefined
  if (
    typeof details !== 'object'
    || details === null
    || !('name' in details)
    || typeof details.name !== 'string'
    || !('phone' in details)
    || typeof details.phone !== 'string'
    || (email !== undefined && typeof email !== 'string')
    || !('service' in details)
    || typeof details.service !== 'string'
  ) throw new Error('Stored appointment details are invalid.')

  return {
    name: details.name,
    phone: details.phone,
    ...(typeof email === 'string' ? { email } : {}),
    service: details.service,
  }
}
