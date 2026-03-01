import type { ReactNode, CSSProperties } from 'react';
import { PALETTE } from '../../styles/palette.ts';

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
  const variantClass =
    variant === 'dark'
      ? 'is-dark'
      : variant === 'rounded'
        ? 'is-rounded'
        : '';

  const containerStyle: CSSProperties = {
    backgroundColor: variant === 'dark' ? PALETTE.bgLight : PALETTE.panel,
    color: PALETTE.text,
    ...style,
  };

  const titleStyle: CSSProperties = {
    fontFamily: "'Press Start 2P', cursive",
    fontSize: '10px',
    color: PALETTE.gold,
  };

  return (
    <div
      className={`nes-container ${variantClass} ${title ? 'with-title' : ''} ${className}`.trim()}
      style={containerStyle}
    >
      {title && (
        <p className="title" style={titleStyle}>
          {title}
        </p>
      )}
      {children}
    </div>
  );
}
