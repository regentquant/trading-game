import type { CSSProperties } from 'react';
import type { ActiveEvent, GameEventTemplate } from '../../types/index.ts';
import { PALETTE } from '../../styles/palette.ts';
import { PixelButton } from './PixelButton.tsx';

interface EventPopupProps {
  event: ActiveEvent;
  template: GameEventTemplate;
  onChoice: (index: number) => void;
}

const SEVERITY_COLORS: Record<string, string> = {
  minor: PALETTE.cyan,
  moderate: PALETTE.gold,
  major: PALETTE.red,
  catastrophic: PALETTE.purple,
};

export function EventPopup({ event: _event, template, onChoice }: EventPopupProps) {
  const severityColor = SEVERITY_COLORS[template.severity] ?? PALETTE.text;

  const overlayStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    animation: 'popupFadeIn 0.3s ease-out',
  };

  const boxStyle: CSSProperties = {
    backgroundColor: PALETTE.bg,
    color: PALETTE.text,
    maxWidth: '640px',
    width: '90%',
    border: `4px solid ${severityColor}`,
    boxShadow: `0 0 20px ${severityColor}40, inset 0 0 20px ${PALETTE.black}80`,
    animation: 'popupSlideUp 0.3s ease-out',
  };

  const headerStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  };

  const titleStyle: CSSProperties = {
    fontFamily: "'Press Start 2P', cursive",
    fontSize: '12px',
    color: PALETTE.gold,
    margin: 0,
  };

  const badgeStyle: CSSProperties = {
    fontFamily: "'Press Start 2P', cursive",
    fontSize: '8px',
    color: severityColor,
    border: `2px solid ${severityColor}`,
    padding: '4px 8px',
    textTransform: 'uppercase',
  };

  const descStyle: CSSProperties = {
    fontFamily: "'VT323', monospace",
    fontSize: '20px',
    color: PALETTE.text,
    lineHeight: 1.4,
    marginBottom: '16px',
    padding: '8px',
    backgroundColor: PALETTE.bgLight,
    border: `2px solid ${PALETTE.panelLight}`,
  };

  const choicesStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  };

  const choiceBoxStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '8px',
    backgroundColor: PALETTE.panel,
    border: `2px solid ${PALETTE.panelLight}`,
    cursor: 'pointer',
    transition: 'border-color 0.15s ease',
  };

  const choiceDescStyle: CSSProperties = {
    fontFamily: "'VT323', monospace",
    fontSize: '16px',
    color: PALETTE.textDim,
    marginTop: '4px',
  };

  return (
    <>
      <style>{`
        @keyframes popupFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes popupSlideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <div style={overlayStyle}>
        <div className="nes-container is-dark" style={boxStyle}>
          <div style={headerStyle}>
            <h3 style={titleStyle}>{template.name}</h3>
            <span style={badgeStyle}>{template.severity}</span>
          </div>
          <div style={descStyle}>{template.description}</div>
          <div style={choicesStyle}>
            {template.choices.map((choice, idx) => (
              <div
                key={idx}
                style={choiceBoxStyle}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = PALETTE.gold;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = PALETTE.panelLight;
                }}
              >
                <PixelButton
                  variant="primary"
                  onClick={() => onChoice(idx)}
                  style={{ width: '100%', textAlign: 'left', fontSize: '8px' }}
                >
                  {choice.label}
                </PixelButton>
                <p style={choiceDescStyle}>{choice.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
