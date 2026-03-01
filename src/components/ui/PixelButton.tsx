import type { ReactNode, CSSProperties } from 'react';

interface PixelButtonProps {
  onClick?: () => void;
  children: ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'disabled';
  style?: CSSProperties;
  className?: string;
}

const variantClassMap: Record<string, string> = {
  primary: 'is-primary',
  success: 'is-success',
  warning: 'is-warning',
  error: 'is-error',
  disabled: 'is-disabled',
};

export function PixelButton({
  onClick,
  children,
  variant = 'primary',
  style,
  className = '',
}: PixelButtonProps) {
  const variantClass = variantClassMap[variant] ?? '';

  const buttonStyle: CSSProperties = {
    transition: 'transform 0.1s ease',
    cursor: variant === 'disabled' ? 'not-allowed' : 'pointer',
    fontSize: '10px',
    ...style,
  };

  return (
    <button
      type="button"
      className={`nes-btn ${variantClass} ${className}`.trim()}
      style={buttonStyle}
      onClick={variant === 'disabled' ? undefined : onClick}
      disabled={variant === 'disabled'}
      onMouseEnter={(e) => {
        if (variant !== 'disabled') {
          (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)';
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
      }}
    >
      {children}
    </button>
  );
}
