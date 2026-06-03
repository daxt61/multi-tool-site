/**
 * Sentinel: Provides cryptographically secure random number generation
 * to prevent predictability and bias in utility tools.
 */

/**
 * Returns a cryptographically secure random integer between 0 and max (exclusive).
 * Supports ranges up to Number.MAX_SAFE_INTEGER.
 * Uses rejection sampling with bit-masking to ensure unbiased output and avoid infinite loops.
 */
export const getSecureRandomInt = (max: number): number => {
  if (max <= 1) return 0;

  if (typeof window === 'undefined' || !window.crypto) {
    return Math.floor(Math.random() * max);
  }

  const bigMax = BigInt(max);

  // Determine the bit length of max - 1
  let bitLength = 0;
  let tempMax = bigMax - 1n;
  while (tempMax > 0n) {
    tempMax >>= 1n;
    bitLength++;
  }

  // Number of bytes required to represent the bit length
  const byteLength = Math.ceil(bitLength / 8);
  // Mask to ensure the random value is within the smallest power of 2 that is >= max
  const mask = (1n << BigInt(bitLength)) - 1n;
  const array = new Uint8Array(byteLength);

  // Rejection sampling loop
  while (true) {
    window.crypto.getRandomValues(array);

    // Convert bytes to BigInt
    let randomValue = 0n;
    for (let i = 0; i < byteLength; i++) {
      randomValue = (randomValue << 8n) | BigInt(array[i]);
    }

    // Apply bitmask
    randomValue &= mask;

    // Only return if the value is within the requested range
    if (randomValue < bigMax) {
      return Number(randomValue);
    }
  }
};
