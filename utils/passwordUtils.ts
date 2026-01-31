/**
 * Password hashing utilities using Web Crypto API (SHA-256 with salt).
 * No external dependencies needed.
 * 
 * Hash format: $sha256$<salt_hex>$<hash_hex>
 * 
 * Supports transparent migration from plaintext passwords:
 * - verifyPassword() auto-detects plaintext vs hashed
 * - isHashed() checks if a stored value is already hashed
 */

const HASH_PREFIX = '$sha256$';

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Hash a plaintext password with a random 16-byte salt.
 * Returns format: $sha256$<salt_hex>$<hash_hex>
 */
export async function hashPassword(plaintext: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = bufferToHex(salt.buffer);

  const encoder = new TextEncoder();
  const data = new Uint8Array([...salt, ...encoder.encode(plaintext)]);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashHex = bufferToHex(hashBuffer);

  return `${HASH_PREFIX}${saltHex}$${hashHex}`;
}

/**
 * Verify a plaintext password against a stored value.
 * - If stored is hashed ($sha256$...), extract salt, re-hash, and compare.
 * - If stored is plaintext (no prefix), do direct string comparison (migration path).
 */
export async function verifyPassword(plaintext: string, stored: string): Promise<boolean> {
  if (!stored) return false;

  if (isHashed(stored)) {
    // Parse the hash format: $sha256$<salt_hex>$<hash_hex>
    const parts = stored.split('$');
    // parts = ['', 'sha256', '<salt_hex>', '<hash_hex>']
    if (parts.length !== 4) return false;

    const saltHex = parts[2];
    const storedHashHex = parts[3];

    const salt = hexToBuffer(saltHex);
    const encoder = new TextEncoder();
    const data = new Uint8Array([...salt, ...encoder.encode(plaintext)]);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const computedHashHex = bufferToHex(hashBuffer);

    return computedHashHex === storedHashHex;
  }

  // Plaintext fallback — direct comparison for migration path
  return stored === plaintext;
}

/**
 * Check if a stored password value is already hashed.
 */
export function isHashed(stored: string): boolean {
  return stored.startsWith(HASH_PREFIX);
}
