/**
 * Generate a random secret for cross-chain escrows
 */
export function generateSecret(): string {
  return Math.random().toString(36).substring(2, 34) + Date.now().toString(36);
}

/**
 * Hash a secret to create a secret hash
 */
export function hashSecret(secret: string): string {
  // Simple hash implementation - in production, use a proper crypto library
  let hash = 0;
  for (let i = 0; i < secret.length; i++) {
    const char = secret.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Verify if a secret matches a hash
 */
export function verifySecret(secret: string, hash: string): boolean {
  return hashSecret(secret) === hash;
} 