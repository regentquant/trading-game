// Build cross-asset correlation matrix from asset definitions

import type { AssetDefinition, AssetClass } from '../../types/index.ts';

/**
 * Determine the pairwise correlation between two assets based on
 * their asset class and sector.
 *
 * Rules:
 *  - Same sector:                          0.6 - 0.8
 *  - Same asset class, different sector:   0.3 - 0.5
 *  - Stocks vs bonds:                     -0.2 to -0.4
 *  - Crypto vs everything else:            0.0 - 0.2
 *  - Default (cross-class):                0.1 - 0.3
 */
function pairwiseCorrelation(a: AssetDefinition, b: AssetDefinition): number {
  if (a.id === b.id) return 1.0;

  const stockClasses: AssetClass[] = ['large_cap', 'small_cap'];
  const bondClasses: AssetClass[] = ['bond'];

  const aIsStock = stockClasses.includes(a.class);
  const bIsStock = stockClasses.includes(b.class);
  const aIsBond = bondClasses.includes(a.class);
  const bIsBond = bondClasses.includes(b.class);
  const aIsCrypto = a.class === 'crypto';
  const bIsCrypto = b.class === 'crypto';

  // Crypto vs anything non-crypto
  if ((aIsCrypto && !bIsCrypto) || (!aIsCrypto && bIsCrypto)) {
    return 0.1;
  }

  // Both crypto — same sector
  if (aIsCrypto && bIsCrypto) {
    return 0.7;
  }

  // Stock vs bond — negative correlation
  if ((aIsStock && bIsBond) || (aIsBond && bIsStock)) {
    return -0.3;
  }

  // Same sector
  if (a.sector === b.sector) {
    // Same class too => higher
    if (a.class === b.class) return 0.8;
    return 0.6;
  }

  // Same asset class, different sector
  if (a.class === b.class) {
    return 0.4;
  }

  // Cross-class defaults
  // Commodities vs stocks
  if (
    (a.class === 'commodity' && bIsStock) ||
    (aIsStock && b.class === 'commodity')
  ) {
    return 0.2;
  }

  // Real estate vs stocks
  if (
    (a.class === 'real_estate' && bIsStock) ||
    (aIsStock && b.class === 'real_estate')
  ) {
    return 0.3;
  }

  // Real estate vs bonds
  if (
    (a.class === 'real_estate' && bIsBond) ||
    (aIsBond && b.class === 'real_estate')
  ) {
    return -0.1;
  }

  // Commodities vs bonds
  if (
    (a.class === 'commodity' && bIsBond) ||
    (aIsBond && b.class === 'commodity')
  ) {
    return -0.15;
  }

  // Commodities vs real estate
  if (
    (a.class === 'commodity' && b.class === 'real_estate') ||
    (a.class === 'real_estate' && b.class === 'commodity')
  ) {
    return 0.15;
  }

  // Fallback
  return 0.2;
}

/**
 * Build an N x N correlation matrix for all assets.
 * The matrix is symmetric and positive semi-definite.
 */
export function buildCorrelationMatrix(assetDefs: AssetDefinition[]): number[][] {
  const n = assetDefs.length;
  const matrix: number[][] = Array.from({ length: n }, () =>
    new Array<number>(n).fill(0)
  );

  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      const corr = pairwiseCorrelation(assetDefs[i], assetDefs[j]);
      matrix[i][j] = corr;
      matrix[j][i] = corr;
    }
  }

  // Ensure the diagonal is exactly 1
  for (let i = 0; i < n; i++) {
    matrix[i][i] = 1.0;
  }

  return matrix;
}
