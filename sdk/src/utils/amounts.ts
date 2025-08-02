/**
 * Format an amount with the specified number of decimals
 */
export function formatAmount(amount: string | number, decimals: number): string {
  const amountStr = amount.toString();
  const amountNum = parseFloat(amountStr);
  const divisor = Math.pow(10, decimals);
  const result = amountNum / divisor;
  return result.toFixed(decimals).replace(/\.?0+$/, '');
}

/**
 * Parse a formatted amount to the smallest unit
 */
export function parseAmount(amount: string, decimals: number): string {
  const amountNum = parseFloat(amount);
  const multiplier = Math.pow(10, decimals);
  const result = Math.floor(amountNum * multiplier);
  return result.toString();
}

/**
 * Convert NEAR to yoctoNEAR
 */
export function nearToYocto(near: string | number): string {
  return parseAmount(near.toString(), 24);
}

/**
 * Convert yoctoNEAR to NEAR
 */
export function yoctoToNear(yocto: string | number): string {
  return formatAmount(yocto.toString(), 24);
} 