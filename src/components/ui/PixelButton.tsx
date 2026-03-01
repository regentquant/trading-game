import type { ReactNode, CSSProperties } from 'react';
import { PALETTE, FONT } from '../../styles/palette.ts';

interface PixelButtonProps {
  onClick?: () => void;
  children: ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'disabled';
  style?: CSSProperties;
  className?: string;
}

const variantStyles: Record<string, { bg: string; border: string; color: string; hoverBg: string }> = {
  primary: { bg: PALETTE.accent, border: PALETTE.accent, color: PALETTE.white, hoverBg: PALETTE.accentDim },
  success: { bg: PALETTE.green, border: PALETTE.green, color: PALETTE.black, hoverBg: PALETTE.greenDim },
  warning: { bg: PALETTE.gold, border: PALETTE.gold, color: PALETTE.black, hoverBg: PALETTE.goldDim },
  error: { bg: PALETTE.red, border: PALETTE.red, color: PALETTE.white, hoverBg: PALETTE.redDim },
  disabled: { bg: PALETTE.panelLight, border: PALETTE.panelBorder, color: PALETTE.textDim, hoverBg: PALETTE.panelLight },
};

export function PixelButton({
  onClick,
  children,
  variant = 'primary',
  style,
  className = '',
}: PixelButtonProps) {
  const vs = variantStyles[variant] ?? variantStyles.primary;

  const buttonStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '8px 16px',
    backgroundColor: vs.bg,
    border: `1px solid ${vs.border}`,
    borderRadius: '6px',
    color: vs.color,
    fontFamily: FONT.ui,
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.02em',
    cursor: variant === 'disabled' ? 'not-allowed' : 'pointer',
    opacity: variant === 'disabled' ? 0.5 : 1,
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
    ...style,
  };

  return (
    <button
      type="button"
      className={className}
      style={buttonStyle}
      onClick={variant === 'disabled' ? undefined : onClick}
      disabled={variant === 'disabled'}
      onMouseEnter={(e) => {
        if (variant !== 'disabled') {
          (e.currentTarget as HTMLElement).style.backgroundColor = vs.hoverBg;
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = vs.bg;
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      }}
    >
      {children}
    </button>
  );
}
