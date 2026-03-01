// Box-Muller, Cholesky decomposition, statistical helpers

import type { RNG } from './random.ts';

/**
 * Box-Muller transform: generate a standard normal random variable
 * from a uniform RNG.
 */
export function boxMuller(rng: RNG): number {
  return rng.nextGaussian();
}

/**
 * Cholesky decomposition of a symmetric positive-definite matrix.
 * Returns lower triangular matrix L such that A = L * L^T.
 */
export function choleskyDecompose(matrix: number[][]): number[][] {
  const n = matrix.length;
  const L: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0;
      for (let k = 0; k < j; k++) {
        sum += L[i][k] * L[j][k];
      }

      if (i === j) {
        const diag = matrix[i][i] - sum;
        // Clamp to small positive to handle numerical issues
        L[i][j] = Math.sqrt(Math.max(diag, 1e-10));
      } else {
        L[i][j] = (matrix[i][j] - sum) / L[j][j];
      }
    }
  }

  return L;
}

/**
 * Generate a vector of correlated normal random variables given
 * a Cholesky lower triangular matrix L and an RNG.
 */
export function correlatedNormals(L: number[][], rng: RNG): number[] {
  const n = L.length;
  const independent: number[] = [];
  for (let i = 0; i < n; i++) {
    independent.push(rng.nextGaussian());
  }

  const correlated: number[] = new Array<number>(n).fill(0);
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j <= i; j++) {
      sum += L[i][j] * independent[j];
    }
    correlated[i] = sum;
  }

  return correlated;
}

/**
 * Clamp a value between min and max (inclusive).
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation between a and b by factor t (0..1).
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Sample from a Poisson distribution with parameter lambda using
 * Knuth's algorithm.
 */
export function poissonSample(lambda: number, rng: RNG): number {
  if (lambda <= 0) return 0;

  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;

  do {
    k++;
    p *= rng.next();
  } while (p > L);

  return k - 1;
}
