import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto'

const ALGO = 'aes-256-gcm'

function getKeyFromSecret(secret: string) {
  return createHash('sha256').update(secret).digest()
}

export function encryptText(plain: string, secret: string) {
  const key = getKeyFromSecret(secret)
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGO, key as any, iv as any) as any
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`
}

export function decryptText(payload: string, secret: string) {
  const key = getKeyFromSecret(secret)
  const [ivB64, tagB64, dataB64] = payload.split(':')
  if (!ivB64 || !tagB64 || !dataB64) throw new Error('Invalid payload')
  const iv = Buffer.from(ivB64, 'base64')
  const tag = Buffer.from(tagB64, 'base64')
  const data = Buffer.from(dataB64, 'base64')
  const decipher = createDecipheriv(ALGO, key as any, iv as any) as any
  decipher.setAuthTag(tag as any)
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()])
  return decrypted.toString('utf8')
}
