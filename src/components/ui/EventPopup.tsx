import type { CSSProperties } from 'react';
import type { ActiveEvent, GameEventTemplate } from '../../types/index.ts';
import { PALETTE, FONT } from '../../styles/palette.ts';
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    animation: 'popupFadeIn 0.2s ease-out',
  };

  const boxStyle: CSSProperties = {
    backgroundColor: PALETTE.panel,
    color: PALETTE.text,
    maxWidth: '560px',
    width: '90%',
    borderRadius: '12px',
    border: `1px solid ${severityColor}40`,
    boxShadow: `0 0 40px ${severityColor}15, 0 24px 48px rgba(0,0,0,0.4)`,
    animation: 'popupSlideUp 0.25s ease-out',
    overflow: 'hidden',
  };

  const headerStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: `1px solid ${PALETTE.panelBorder}`,
    backgroundColor: PALETTE.bgLight,
  };

  const titleStyle: CSSProperties = {
    fontFamily: FONT.ui,
    fontSize: '16px',
    fontWeight: 600,
    color: PALETTE.text,
    margin: 0,
  };

  const badgeStyle: CSSProperties = {
    fontFamily: FONT.ui,
    fontSize: '10px',
    fontWeight: 600,
    color: severityColor,
    border: `1px solid ${severityColor}`,
    borderRadius: '4px',
    padding: '3px 8px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  };

  const descStyle: CSSProperties = {
    fontFamily: FONT.ui,
    fontSize: '14px',
    color: PALETTE.textSecondary,
    lineHeight: 1.6,
    padding: '16px 20px',
  };

  const choicesStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '0 20px 20px',
  };

  const choiceBoxStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    padding: '12px',
    backgroundColor: PALETTE.bgLight,
    border: `1px solid ${PALETTE.panelBorder}`,
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'border-color 0.15s ease, background-color 0.15s ease',
  };

  const choiceDescStyle: CSSProperties = {
    fontFamily: FONT.ui,
    fontSize: '12px',
    color: PALETTE.textDim,
    marginTop: '2px',
  };

  return (
    <div style={overlayStyle}>
      <div style={boxStyle}>
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
              onClick={() => onChoice(idx)}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = PALETTE.accent;
                (e.currentTarget as HTMLElement).style.backgroundColor = PALETTE.panelLight;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = PALETTE.panelBorder;
                (e.currentTarget as HTMLElement).style.backgroundColor = PALETTE.bgLight;
              }}
            >
              <PixelButton
                variant="primary"
                onClick={() => onChoice(idx)}
                style={{ width: '100%', justifyContent: 'flex-start' }}
              >
                {choice.label}
              </PixelButton>
              <p style={choiceDescStyle}>{choice.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
