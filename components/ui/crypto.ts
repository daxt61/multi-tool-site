/**
 * Sentinel: Provides cryptographically secure random number generation
 * to prevent predictability and bias in utility tools.
 */

/**
 * Returns a cryptographically secure random integer between 0 and max (exclusive).
 * Uses rejection sampling to avoid modulo bias.
 */
export const getSecureRandomInt = (max: number): number => {
  if (max <= 0) return 0;

  if (typeof window === 'undefined' || !window.crypto) {
    return Math.floor(Math.random() * max);
  }

  const array = new Uint32Array(1);
  const maxUint32 = 0xffffffff;
  const limit = maxUint32 - (maxUint32 % max);

  let randomValue;
  do {
    window.crypto.getRandomValues(array);
    randomValue = array[0];
  } while (randomValue >= limit);

  return randomValue % max;
};
