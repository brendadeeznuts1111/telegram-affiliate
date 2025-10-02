/**
 * Secure Token Generation using Bun.password.hash
 * Following Cursor rules for security best practices
 */

/**
 * Generate a secure hash for tokens/passwords using Bun's native API
 */
export async function generateSecureHash(input: string): Promise<string> {
  return await Bun.password.hash(input, {
    algorithm: 'argon2id', // Most secure
    memoryCost: 4, // 4 MiB
    timeCost: 3, // 3 iterations
  });
}

/**
 * Verify a hash against the original input
 */
export async function verifySecureHash(
  hash: string,
  input: string
): Promise<boolean> {
  return await Bun.password.verify(input, hash);
}

/**
 * Generate a secure random token (for API keys, session tokens, etc.)
 */
export async function generateSecureToken(length: number = 32): Promise<string> {
  const buffer = new Uint8Array(length);
  crypto.getRandomValues(buffer);
  
  // Convert to base64url (URL-safe)
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Generate a secure API key with hash for storage
 */
export async function generateApiKey(
  prefix: string = 'tgaf'
): Promise<{ key: string; hash: string }> {
  const randomPart = await generateSecureToken(32);
  const key = `${prefix}_${randomPart}`;
  const hash = await generateSecureHash(key);
  
  return { key, hash };
}

/**
 * Generate a checksum for file integrity using Bun.password.hash
 */
export async function generateChecksum(data: string | Buffer): Promise<string> {
  const input = typeof data === 'string' ? data : data.toString('utf-8');
  return await generateSecureHash(input);
}

/**
 * Verify file integrity using checksum
 */
export async function verifyChecksum(
  data: string | Buffer,
  checksum: string
): Promise<boolean> {
  const input = typeof data === 'string' ? data : data.toString('utf-8');
  return await verifySecureHash(checksum, input);
}

/**
 * Generate a time-limited token (expires after specified duration)
 */
export async function generateTimeLimitedToken(
  userId: number,
  expiresInMs: number
): Promise<string> {
  const expiresAt = Date.now() + expiresInMs;
  const payload = `${userId}:${expiresAt}`;
  const token = await generateSecureToken(24);
  
  return `${token}:${payload}`;
}

/**
 * Verify and extract time-limited token
 */
export function verifyTimeLimitedToken(
  token: string
): { userId: number; valid: boolean } | null {
  try {
    const parts = token.split(':');
    if (parts.length !== 3) return null;
    
    const [, userIdStr, expiresAtStr] = parts;
    const userId = parseInt(userIdStr, 10);
    const expiresAt = parseInt(expiresAtStr, 10);
    
    if (isNaN(userId) || isNaN(expiresAt)) return null;
    
    const valid = Date.now() < expiresAt;
    return { userId, valid };
  } catch {
    return null;
  }
}

