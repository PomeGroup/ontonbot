import { randomBytes } from 'crypto';

export const filePrefix = (): string => {
  const randomPart = randomBytes(5).toString('hex'); // Replicates `randomChars(5)`
  return `${randomPart}_${Date.now()}_`;
};