import type { CSSProperties } from 'react';
import { PALETTE, FONT } from '../../styles/palette.ts';

interface StatBarProps {
  value: number;
  maxValue?: number;
  color: string;
  label: string;
  showValue?: boolean;
}

export function StatBar({
  value,
  maxValue = 100,
  color,
  label,
  showValue = true,
}: StatBarProps) {
  const pct = Math.max(0, Math.min(100, (value / maxValue) * 100));

  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    width: '100%',
  };

  const labelRowStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontFamily: FONT.ui,
    fontSize: '12px',
    color: PALETTE.textSecondary,
  };

  const barOuterStyle: CSSProperties = {
    width: '100%',
    height: '6px',
    backgroundColor: PALETTE.bgLight,
    borderRadius: '3px',
    overflow: 'hidden',
  };

  const barInnerStyle: CSSProperties = {
    width: `${pct}%`,
    height: '100%',
    backgroundColor: color,
    borderRadius: '3px',
    transition: 'width 0.3s ease',
  };

  return (
    <div style={containerStyle}>
      <div style={labelRowStyle}>
        <span>{label}</span>
        {showValue && (
          <span style={{ fontFamily: FONT.mono, fontSize: '12px', color }}>
            {Math.round(value)}/{maxValue}
          </span>
        )}
      </div>
      <div style={barOuterStyle}>
        <div style={barInnerStyle} />
      </div>
    </div>
  );
}
