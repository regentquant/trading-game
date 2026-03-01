import type { ReactNode, CSSProperties } from 'react';
import { PALETTE, FONT } from '../../styles/palette.ts';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  const overlayStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    animation: 'popupFadeIn 0.2s ease-out',
  };

  const containerStyle: CSSProperties = {
    backgroundColor: PALETTE.panel,
    border: `1px solid ${PALETTE.panelBorder}`,
    borderRadius: '12px',
    color: PALETTE.text,
    maxWidth: '520px',
    width: '90%',
    maxHeight: '80vh',
    overflowY: 'auto',
    animation: 'popupSlideUp 0.2s ease-out',
    boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
  };

  const headerStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: `1px solid ${PALETTE.panelBorder}`,
  };

  const titleStyle: CSSProperties = {
    fontFamily: FONT.ui,
    fontSize: '15px',
    fontWeight: 600,
    color: PALETTE.text,
    margin: 0,
  };

  const closeStyle: CSSProperties = {
    background: 'none',
    border: 'none',
    color: PALETTE.textDim,
    fontSize: '18px',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    lineHeight: 1,
    transition: 'color 0.15s ease',
  };

  const bodyStyle: CSSProperties = {
    padding: '20px',
  };

  return (
    <div
      style={overlayStyle}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div style={containerStyle}>
        <div style={headerStyle}>
          <h3 style={titleStyle}>{title}</h3>
          <button
            type="button"
            style={closeStyle}
            onClick={onClose}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = PALETTE.text;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = PALETTE.textDim;
            }}
          >
            &#x2715;
          </button>
        </div>
        <div style={bodyStyle}>{children}</div>
      </div>
    </div>
  );
}
