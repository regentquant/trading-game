import type { ReactNode, CSSProperties } from 'react';
import { PALETTE, FONT } from '../../styles/palette.ts';

interface PixelPanelProps {
  title?: string;
  children: ReactNode;
  variant?: 'default' | 'dark' | 'rounded';
  className?: string;
  style?: CSSProperties;
}

export function PixelPanel({
  title,
  children,
  variant = 'default',
  className = '',
  style,
}: PixelPanelProps) {
  const containerStyle: CSSProperties = {
    backgroundColor: variant === 'dark' ? PALETTE.bgLight : PALETTE.panel,
    border: `1px solid ${PALETTE.panelBorder}`,
    borderRadius: '8px',
    padding: title ? '0' : '16px',
    overflow: 'hidden',
    ...style,
  };

  const titleStyle: CSSProperties = {
    fontFamily: FONT.ui,
    fontSize: '11px',
    fontWeight: 600,
    color: PALETTE.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    padding: '10px 16px',
    borderBottom: `1px solid ${PALETTE.panelBorder}`,
    backgroundColor: PALETTE.bgLight,
  };

  const bodyStyle: CSSProperties = {
    padding: '16px',
  };

  return (
    <div className={className} style={containerStyle}>
      {title && <div style={titleStyle}>{title}</div>}
      <div style={bodyStyle}>{children}</div>
    </div>
  );
}
