// AES-256-GCM encryption for per-tenant DATABASE_URL strings.
// Used in Phase B when storing encrypted DB URLs in the Control Plane.
//
// Required env var:
//   CONTROL_PLANE_ENCRYPTION_KEY — 64 hex chars (32 bytes)
//   Generate with: openssl rand -hex 32

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_HEX = process.env.CONTROL_PLANE_ENCRYPTION_KEY ?? "";

function getKey(): Buffer {
  if (KEY_HEX.length !== 64) {
    throw new Error(
      "CONTROL_PLANE_ENCRYPTION_KEY must be a 64-char hex string (32 bytes)"
    );
  }
  return Buffer.from(KEY_HEX, "hex");
}

/**
 * Encrypts a plaintext string (e.g. a DATABASE_URL) using AES-256-GCM.
 *
 * Output format (all hex-encoded, concatenated):
 *   iv(24 chars) + authTag(32 chars) + ciphertext(variable)
 */
export function encryptUrl(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag(); // 128-bit auth tag
  return iv.toString("hex") + tag.toString("hex") + encrypted.toString("hex");
}

/**
 * Decrypts a ciphertext string produced by {@link encryptUrl}.
 * Throws if the auth tag verification fails (tampered ciphertext).
 */
export function decryptUrl(ciphertext: string): string {
  const key = getKey();
  const iv = Buffer.from(ciphertext.slice(0, 24), "hex");
  const tag = Buffer.from(ciphertext.slice(24, 56), "hex");
  const encrypted = Buffer.from(ciphertext.slice(56), "hex");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final("utf8");
}
