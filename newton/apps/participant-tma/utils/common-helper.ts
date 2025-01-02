/**
 * Converts a USD amount to USDT token amount by multiplying it by 10^6 (USDT has 6 decimal places)
 *
 * @param {number} usd - The amount in USD (can be decimal)
 * @returns {bigint} The amount in USDT's smallest unit (6 decimal places)
 *
 * @example
 * // Convert 5.5 USD to USDT amount
 * const usdtAmount = calculateUsdtAmount(5.5);
 * console.log(usdtAmount); // 5500000n
 *
 * @example
 * // Convert 1 USD to USDT amount
 * const usdtAmount = calculateUsdtAmount(1);
 * console.log(usdtAmount); // 1000000n
 *
 * @remarks
 * - The function rounds the result to handle floating point precision
 * - Uses BigInt to handle large numbers without precision loss
 * - USDT operates with 6 decimal places, hence multiplication by 10^6
 */
export const calculateUsdtAmount = (usd: number): bigint => BigInt(Math.round(usd * 1_000_000));
