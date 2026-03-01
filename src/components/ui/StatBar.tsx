import type { CSSProperties } from 'react';
import { PALETTE } from '../../styles/palette.ts';

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
    fontFamily: "'VT323', monospace",
    fontSize: '18px',
    color: PALETTE.text,
  };

  const barOuterStyle: CSSProperties = {
    width: '100%',
    height: '16px',
    backgroundColor: PALETTE.bgLight,
    border: `2px solid ${PALETTE.textDim}`,
    imageRendering: 'pixelated',
    position: 'relative',
    overflow: 'hidden',
  };

  const barInnerStyle: CSSProperties = {
    width: `${pct}%`,
    height: '100%',
    backgroundColor: color,
    transition: 'width 0.3s ease',
    imageRendering: 'pixelated',
  };

  return (
    <div style={containerStyle}>
      <div style={labelRowStyle}>
        <span>{label}</span>
        {showValue && (
          <span style={{ color }}>
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
