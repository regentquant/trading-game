// Seeded PRNG — Mulberry32

export interface RNG {
  next(): number;
  nextGaussian(): number;
}

export function createRNG(seed: number): RNG {
  let state = seed | 0;

  // Spare for Box-Muller (generates two at a time)
  let hasSpare = false;
  let spare = 0;

  function next(): number {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function nextGaussian(): number {
    if (hasSpare) {
      hasSpare = false;
      return spare;
    }

    // Box-Muller transform
    let u: number;
    let v: number;
    let s: number;
    do {
      u = next() * 2 - 1;
      v = next() * 2 - 1;
      s = u * u + v * v;
    } while (s >= 1 || s === 0);

    const mul = Math.sqrt((-2 * Math.log(s)) / s);
    spare = v * mul;
    hasSpare = true;
    return u * mul;
  }

  return { next, nextGaussian };
}
