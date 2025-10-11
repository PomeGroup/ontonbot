/// <reference lib="esnext.bigint" />

export function amountToUnits(amount: number, decimals: number): bigint {
  if (!Number.isFinite(amount) || amount < 0) throw new Error("Amount must be a positive finite number");
  const factor = BigInt(10) ** BigInt(decimals);
  const fixed = amount.toFixed(decimals);
  const [whole, fraction = ""] = fixed.split(".");
  const wholePart = BigInt(whole);
  const fractionPart = fraction ? BigInt(fraction) : BigInt(0);
  return wholePart * factor + fractionPart;
}

export function unitsToAmount(units: bigint, decimals: number): number {
  if (decimals === 0) return Number(units);
  const factor = 10 ** decimals;
  return Number(units) / factor;
}
