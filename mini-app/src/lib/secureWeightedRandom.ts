import { randomInt } from "node:crypto";

/**
 * Secure weighted random selection using Node's crypto module
 */
export function secureWeightedRandom<T extends { weight: number }>(items: T[]): T {
  if (items.length === 0) {
    throw new Error("No items to choose from.");
  }

  // 1) Sum weights
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight === 0) {
    throw new Error("All items have zero weight.");
  }

  // 2) Generate a random integer in [0, totalWeight)
  const rand = randomInt(totalWeight);

  // 3) Walk through items, subtracting each weight from rand
  let rolling = rand;
  for (const item of items) {
    if (rolling < item.weight) {
      return item; // Found the selection
    }
    rolling -= item.weight;
  }

  // Fallback (shouldn't happen if logic is correct)
  return items[items.length - 1];
}
