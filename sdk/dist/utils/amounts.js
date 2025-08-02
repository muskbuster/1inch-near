"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatAmount = formatAmount;
exports.parseAmount = parseAmount;
exports.nearToYocto = nearToYocto;
exports.yoctoToNear = yoctoToNear;
/**
 * Format an amount with the specified number of decimals
 */
function formatAmount(amount, decimals) {
    const amountStr = amount.toString();
    const amountNum = parseFloat(amountStr);
    const divisor = Math.pow(10, decimals);
    const result = amountNum / divisor;
    return result.toFixed(decimals).replace(/\.?0+$/, '');
}
/**
 * Parse a formatted amount to the smallest unit
 */
function parseAmount(amount, decimals) {
    const amountNum = parseFloat(amount);
    const multiplier = Math.pow(10, decimals);
    const result = Math.floor(amountNum * multiplier);
    return result.toString();
}
/**
 * Convert NEAR to yoctoNEAR
 */
function nearToYocto(near) {
    return parseAmount(near.toString(), 24);
}
/**
 * Convert yoctoNEAR to NEAR
 */
function yoctoToNear(yocto) {
    return formatAmount(yocto.toString(), 24);
}
//# sourceMappingURL=amounts.js.map