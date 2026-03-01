import type { ReactNode, CSSProperties } from 'react';
import { PALETTE } from '../../styles/palette.ts';

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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  };

  const containerStyle: CSSProperties = {
    backgroundColor: PALETTE.panel,
    color: PALETTE.text,
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    overflowY: 'auto',
    position: 'relative',
  };

  const closeStyle: CSSProperties = {
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: 'none',
    border: 'none',
    color: PALETTE.red,
    fontFamily: "'Press Start 2P', cursive",
    fontSize: '12px',
    cursor: 'pointer',
    padding: '4px 8px',
    lineHeight: 1,
  };

  const titleStyle: CSSProperties = {
    fontFamily: "'Press Start 2P', cursive",
    fontSize: '10px',
    color: PALETTE.gold,
  };

  return (
    <div
      style={overlayStyle}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="nes-container with-title is-dark" style={containerStyle}>
        <p className="title" style={titleStyle}>
          {title}
        </p>
        <button
          type="button"
          style={closeStyle}
          onClick={onClose}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1.2)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
          }}
        >
          X
        </button>
        {children}
      </div>
    </div>
  );
}
