import type { CSSProperties } from 'react';
import { PALETTE, FONT } from '../../styles/palette.ts';

interface PriceChangeProps {
  current: number;
  previous: number;
  format?: 'currency' | 'percent';
}

export function PriceChange({
  current,
  previous,
  format = 'currency',
}: PriceChangeProps) {
  const diff = current - previous;
  const isUp = diff >= 0;
  const color = diff === 0 ? PALETTE.textDim : isUp ? PALETTE.green : PALETTE.red;
  const arrow = diff === 0 ? '' : isUp ? '\u25B2' : '\u25BC';

  let display: string;
  if (format === 'percent') {
    const pct = previous !== 0 ? (diff / previous) * 100 : 0;
    display = `${isUp ? '+' : ''}${pct.toFixed(2)}%`;
  } else {
    const sign = isUp ? '+' : '';
    const abs = Math.abs(diff);
    if (abs >= 1_000_000) {
      display = `${sign}$${(diff / 1_000_000).toFixed(2)}M`;
    } else if (abs >= 1_000) {
      display = `${sign}$${(diff / 1_000).toFixed(1)}K`;
    } else {
      display = `${sign}$${diff.toFixed(2)}`;
    }
  }

  const style: CSSProperties = {
    color,
    fontFamily: FONT.mono,
    fontSize: '13px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
  };

  return (
    <span style={style}>
      {arrow && <span style={{ fontSize: '9px' }}>{arrow}</span>}
      <span>{display}</span>
    </span>
  );
}
