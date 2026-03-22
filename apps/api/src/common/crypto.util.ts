import * as crypto from "crypto";

/**
 * AES-256-CBC encrypt / decrypt helpers for storing OAuth tokens at rest.
 *
 * Format: "<iv_hex>:<ciphertext_hex>"
 * The IV is random per encryption call, stored alongside ciphertext.
 *
 * Usage:
 *   const encrypted = encrypt(token, key);
 *   const token     = decrypt(encrypted, key);
 *
 * key must be exactly 32 bytes (use ENCRYPTION_KEY env var).
 */

export function encrypt(plaintext: string, key: string): string {
  const ivBuf = crypto.randomBytes(16);
  const iv = new Uint8Array(ivBuf);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${ivBuf.toString("hex")}:${encrypted}`;
}

export function decrypt(ciphertext: string, key: string): string {
  const [ivHex, encrypted] = ciphertext.split(":");
  if (!ivHex || !encrypted) {
    throw new Error("Invalid encrypted token format — expected iv:ciphertext");
  }
  const iv = new Uint8Array(Buffer.from(ivHex, "hex"));
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

/**
 * Derive a 32-char key from the ENCRYPTION_KEY env var.
 * Throws at startup if the key is missing or wrong length so misconfiguration
 * is caught immediately rather than at runtime when a token is first accessed.
 */
export function resolveEncryptionKey(rawKey: string | undefined): string {
  if (!rawKey || rawKey.length !== 32) {
    throw new Error(
      "ENCRYPTION_KEY must be exactly 32 ASCII characters. " +
        "Generate one with: openssl rand -hex 16",
    );
  }
  return rawKey;
}
