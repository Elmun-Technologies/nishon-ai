import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as crypto from 'crypto'

@Injectable()
export class EncryptionService {
  private encryptionKey: Buffer
  private algorithm = 'aes-256-gcm'

  constructor(private configService: ConfigService) {
    const keyString = this.configService.get<string>(
      'ENCRYPTION_KEY',
      'default-encryption-key-please-set-env-var'
    )
    // Use SHA-256 hash of the key string to get exactly 32 bytes
    this.encryptionKey = crypto.createHash('sha256').update(keyString).digest()
  }

  /**
   * Encrypt sensitive data (OAuth tokens, secrets)
   * @param plaintext - Text to encrypt
   * @returns Encrypted string in format: iv:authTag:encryptedData (all hex-encoded)
   */
  encrypt(plaintext: string): string {
    try {
      const iv = crypto.randomBytes(16) // 128-bit IV for GCM
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv)

      const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final(),
      ])
      const authTag = cipher.getAuthTag()

      // Format: iv:authTag:encryptedData (all hex)
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`)
    }
  }

  /**
   * Decrypt encrypted data
   * @param encrypted - Encrypted string in format iv:authTag:encryptedData
   * @returns Decrypted plaintext
   */
  decrypt(encrypted: string): string {
    try {
      const parts = encrypted.split(':')
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted format')
      }

      const iv = Buffer.from(parts[0], 'hex')
      const authTag = Buffer.from(parts[1], 'hex')
      const encryptedData = Buffer.from(parts[2], 'hex')

      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv)
      decipher.setAuthTag(authTag)

      const decrypted = Buffer.concat([
        decipher.update(encryptedData),
        decipher.final(),
      ])

      return decrypted.toString('utf8')
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`)
    }
  }

  /**
   * Hash sensitive data for comparison (one-way)
   * @param data - Data to hash
   * @returns Hash string
   */
  hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex')
  }

  /**
   * Verify HMAC signature (for webhooks)
   * @param payload - Payload to verify
   * @param signature - Expected signature (hex)
   * @param secret - Secret key
   * @returns True if signature is valid
   */
  verifySignature(payload: string, signature: string, secret: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex')

      // Constant-time comparison to prevent timing attacks
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      )
    } catch (error) {
      return false
    }
  }

  /**
   * Generate HMAC signature for payloads
   * @param payload - Payload to sign
   * @param secret - Secret key
   * @returns Signature (hex)
   */
  generateSignature(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex')
  }

  /**
   * Generate a random token
   * @param length - Length in bytes
   * @returns Random token (hex)
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex')
  }

  /**
   * Generate state token for OAuth (expires after 5 minutes)
   * @returns State token
   */
  generateOAuthState(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  /**
   * Verify OAuth state token (basic validation)
   * Note: In production, store state in Redis with TTL
   */
  validateOAuthState(state: string): boolean {
    // State should be 64 hex characters (32 bytes)
    return /^[a-f0-9]{64}$/.test(state)
  }
}
