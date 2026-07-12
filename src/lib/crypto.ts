import 'server-only'
import crypto from 'node:crypto'
import { env } from './env'

/**
 * Shared AES-256-GCM primitive used for everything encrypted-at-rest:
 * uploaded documents (lib/crypto-storage.ts) AND OAuth client secrets
 * (lib/provider-credentials.ts). Key comes from DOC_ENCRYPTION_KEY in .env.
 * Rotating that key invalidates all previously-encrypted values.
 */

export function encryptionKey(): Buffer {
  const buf = Buffer.from(env.docKey, 'hex')
  if (buf.length !== 32) {
    throw new Error('DOC_ENCRYPTION_KEY must be 32 bytes (64 hex chars)')
  }
  return buf
}

export interface EncryptedBytes {
  data: Buffer
  iv: string // hex
  authTag: string // hex
}

export function encryptBytes(plain: Buffer): EncryptedBytes {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv)
  const data = Buffer.concat([cipher.update(plain), cipher.final()])
  return { data, iv: iv.toString('hex'), authTag: cipher.getAuthTag().toString('hex') }
}

export function decryptBytes(data: Buffer, ivHex: string, authTagHex: string): Buffer {
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivHex, 'hex'))
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'))
  return Buffer.concat([decipher.update(data), decipher.final()])
}

export interface EncryptedSecret {
  ciphertext: string // hex
  iv: string // hex
  authTag: string // hex
}

/** Encrypt a short secret string (e.g. an OAuth client secret) for DB storage. */
export function encryptSecret(plaintext: string): EncryptedSecret {
  const { data, iv, authTag } = encryptBytes(Buffer.from(plaintext, 'utf8'))
  return { ciphertext: data.toString('hex'), iv, authTag }
}

export function decryptSecret(ciphertextHex: string, ivHex: string, authTagHex: string): string {
  return decryptBytes(Buffer.from(ciphertextHex, 'hex'), ivHex, authTagHex).toString('utf8')
}
