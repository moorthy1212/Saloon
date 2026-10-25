function encodeBase64Url(value: Uint8Array) {
  let binary = ''
  for (const byte of value) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function encodeBase64(value: Uint8Array) {
  let binary = ''
  for (const byte of value) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function decodeBase64(value: string) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0))
}

async function getEncryptionKey(secret: string, usage: Array<'encrypt' | 'decrypt'>) {
  const keyBytes = decodeBase64(secret)
  if (keyBytes.byteLength !== 32) throw new Error('Booking encryption key must decode to 32 bytes.')
  return crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, usage)
}

export async function createAppointmentManagementToken() {
  const token = encodeBase64Url(crypto.getRandomValues(new Uint8Array(32)))
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  const tokenHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
  return { token, tokenHash }
}

export async function encryptAppointmentManagementToken(token: string, secret: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    await getEncryptionKey(secret, ['encrypt']),
    new TextEncoder().encode(token),
  )
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(ciphertext), iv.byteLength)
  return encodeBase64(combined)
}

export async function decryptAppointmentManagementToken(ciphertext: string, secret: string) {
  const combined = decodeBase64(ciphertext)
  const iv = combined.slice(0, 12)
  const data = combined.slice(12)
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    await getEncryptionKey(secret, ['decrypt']),
    data,
  )
  const token = new TextDecoder().decode(plaintext)
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new Error('Stored appointment management token is invalid.')
  return token
}

export async function hashAppointmentManagementToken(token: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}
