/**
 * Generate a random secret for cross-chain escrows
 */
export declare function generateSecret(): string;
/**
 * Hash a secret to create a secret hash
 */
export declare function hashSecret(secret: string): string;
/**
 * Verify if a secret matches a hash
 */
export declare function verifySecret(secret: string, hash: string): boolean;
//# sourceMappingURL=crypto.d.ts.map