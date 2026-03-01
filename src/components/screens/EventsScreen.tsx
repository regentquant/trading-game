import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { StorytellerMode } from '../../types/index.ts';
import { useGameStore } from '../../store/gameStore.ts';
import { PALETTE, FONT } from '../../styles/palette.ts';
import { EVENT_TEMPLATES } from '../../data/events.ts';
import { formatGameDate } from '../../utils/format.ts';
import { PixelPanel } from '../ui/PixelPanel.tsx';
import { PixelButton } from '../ui/PixelButton.tsx';
import { Modal } from '../ui/Modal.tsx';

const SEVERITY_COLORS: Record<string, string> = {
  minor: PALETTE.cyan,
  moderate: PALETTE.gold,
  major: PALETTE.red,
  catastrophic: PALETTE.purple,
};

const STORYTELLER_LABELS: Record<StorytellerMode, { name: string; desc: string; color: string }> = {
  steady_growth: { name: 'Steady Growth', desc: 'Balanced market conditions with moderate events. Good for learning.', color: PALETTE.green },
  calm_markets: { name: 'Calm Markets', desc: 'Low volatility, fewer negative events. Best for building your company.', color: PALETTE.blue },
  volatile: { name: 'Volatile', desc: 'High volatility, frequent major events. Maximum chaos and opportunity.', color: PALETTE.red },
};

export function EventsScreen() {
  const eventHistory = useGameStore((s) => s.events.history);
  const market = useGameStore((s) => s.market);
  const isPaused = useGameStore((s) => s.time.isPaused);
  const currentDay = useGameStore((s) => s.time.day);
  const setStorytellerMode = useGameStore((s) => s.setStorytellerMode);

  const [showModeConfirm, setShowModeConfirm] = useState(false);
  const [pendingMode, setPendingMode] = useState<StorytellerMode | null>(null);

  const recentNews = eventHistory.filter((e) => currentDay - e.triggeredOnDay <= 30);

  const label: CSSProperties = { fontFamily: FONT.ui, fontSize: '13px', color: PALETTE.textSecondary };

  const handleModeClick = (mode: StorytellerMode) => {
    if (!isPaused) return;
    if (mode === market.storytellerMode) return;
    setPendingMode(mode);
    setShowModeConfirm(true);
  };

  const confirmModeChange = () => {
    if (pendingMode) setStorytellerMode(pendingMode);
    setShowModeConfirm(false);
    setPendingMode(null);
  };

  const thStyle: CSSProperties = {
    padding: '8px 12px', textAlign: 'left',
    borderBottom: `1px solid ${PALETTE.panelBorder}`,
    fontFamily: FONT.ui, fontSize: '11px', fontWeight: 600,
    color: PALETTE.textSecondary, textTransform: 'uppercase',
    letterSpacing: '0.04em', whiteSpace: 'nowrap',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
        {/* Recent News */}
        <PixelPanel title={`Recent News (${recentNews.length})`}>
          {recentNews.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
              {[...recentNews].reverse().map((evt) => {
                const tmpl = EVENT_TEMPLATES.find((t) => t.id === evt.templateId);
                if (!tmpl) return null;
                const sevColor = SEVERITY_COLORS[tmpl.severity] ?? PALETTE.textDim;
                return (
                  <div key={evt.id} style={{
                    backgroundColor: PALETTE.bgLight, borderLeft: `3px solid ${sevColor}`,
                    borderRadius: '0 6px 6px 0', padding: '10px 14px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontFamily: FONT.ui, fontSize: '13px', fontWeight: 600, color: PALETTE.text }}>{tmpl.name}</span>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{
                          fontFamily: FONT.ui, fontSize: '9px', fontWeight: 600,
                          color: sevColor, border: `1px solid ${sevColor}`,
                          borderRadius: '3px', padding: '2px 6px', textTransform: 'uppercase',
                        }}>
                          {tmpl.severity}
                        </span>
                        <span style={{ fontFamily: FONT.mono, fontSize: '11px', color: PALETTE.textDim }}>
                          {formatGameDate(evt.triggeredOnDay)}
                        </span>
                      </div>
                    </div>
                    <p style={{ fontFamily: FONT.ui, fontSize: '12px', color: PALETTE.textSecondary, margin: 0, lineHeight: 1.5 }}>
                      {tmpl.description}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ ...label, color: PALETTE.textDim }}>No recent news. Events appear randomly as the game progresses.</div>
          )}
        </PixelPanel>

        {/* Market Conditions + Storyteller */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <PixelPanel title="Market Conditions">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '22px', lineHeight: 1 }}>
                  {market.globalRegime === 'bull' ? '\u25B2' : market.globalRegime === 'bear' ? '\u25BC' : '\u25C6'}
                </span>
                <span style={{
                  fontFamily: FONT.ui, fontSize: '16px', fontWeight: 700,
                  color: market.globalRegime === 'bull' ? PALETTE.green
                    : market.globalRegime === 'bear' ? PALETTE.red : PALETTE.gold,
                }}>
                  {market.globalRegime.toUpperCase()}
                </span>
              </div>
              <div><span style={label}>Duration Remaining: </span><span style={{ fontFamily: FONT.mono, fontSize: '14px', color: PALETTE.text }}>{market.regimeDaysRemaining} days</span></div>
              <div>
                <span style={label}>Storyteller: </span>
                <span style={{ fontFamily: FONT.ui, fontSize: '14px', fontWeight: 500, color: STORYTELLER_LABELS[market.storytellerMode].color }}>
                  {STORYTELLER_LABELS[market.storytellerMode].name}
                </span>
              </div>
            </div>
          </PixelPanel>

          <PixelPanel title="Storyteller Mode">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {!isPaused && (
                <div style={{ fontFamily: FONT.ui, fontSize: '12px', color: PALETTE.red, marginBottom: '4px' }}>
                  Pause the game to change storyteller mode.
                </div>
              )}
              {(Object.entries(STORYTELLER_LABELS) as [StorytellerMode, typeof STORYTELLER_LABELS[StorytellerMode]][]).map(
                ([mode, info]) => {
                  const isActive = market.storytellerMode === mode;
                  return (
                    <button
                      key={mode} type="button"
                      onClick={() => handleModeClick(mode)}
                      style={{
                        display: 'flex', flexDirection: 'column', gap: '4px',
                        padding: '10px 12px', borderRadius: '6px',
                        backgroundColor: isActive ? `${info.color}15` : PALETTE.bgLight,
                        border: `1px solid ${isActive ? info.color : PALETTE.panelBorder}`,
                        cursor: isPaused && !isActive ? 'pointer' : 'default',
                        opacity: !isPaused && !isActive ? 0.4 : 1,
                        textAlign: 'left', transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ fontFamily: FONT.ui, fontSize: '12px', fontWeight: 600, color: info.color }}>
                        {info.name} {isActive ? '(Active)' : ''}
                      </span>
                      <span style={{ fontFamily: FONT.ui, fontSize: '11px', color: PALETTE.textDim }}>{info.desc}</span>
                    </button>
                  );
                },
              )}
            </div>
          </PixelPanel>
        </div>
      </div>

      {/* Event History */}
      <PixelPanel title="Event History">
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {eventHistory.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Event</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Severity</th>
                  <th style={thStyle}>Choice Made</th>
                </tr>
              </thead>
              <tbody>
                {[...eventHistory].reverse().map((evt, idx) => {
                  const tmpl = EVENT_TEMPLATES.find((t) => t.id === evt.templateId);
                  const severity = tmpl?.severity ?? 'minor';
                  const sevColor = SEVERITY_COLORS[severity] ?? PALETTE.textDim;
                  const choiceLabel = evt.choiceMade !== undefined && tmpl
                    ? tmpl.choices[evt.choiceMade]?.label ?? `Choice ${evt.choiceMade}`
                    : 'Auto-resolved';
                  return (
                    <tr key={evt.id} style={{ backgroundColor: idx % 2 === 0 ? 'transparent' : `${PALETTE.bgLight}80` }}>
                      <td style={{ padding: '8px 12px', borderBottom: `1px solid ${PALETTE.panelBorder}`, fontFamily: FONT.mono, fontSize: '12px', color: PALETTE.textSecondary, whiteSpace: 'nowrap' }}>
                        {formatGameDate(evt.triggeredOnDay)}
                      </td>
                      <td style={{ padding: '8px 12px', borderBottom: `1px solid ${PALETTE.panelBorder}`, fontFamily: FONT.ui, fontSize: '13px', color: PALETTE.text, whiteSpace: 'nowrap' }}>
                        {tmpl?.name ?? evt.templateId}
                      </td>
                      <td style={{ padding: '8px 12px', borderBottom: `1px solid ${PALETTE.panelBorder}`, textAlign: 'center' }}>
                        <span style={{
                          fontFamily: FONT.ui, fontSize: '9px', fontWeight: 600,
                          color: sevColor, border: `1px solid ${sevColor}`,
                          borderRadius: '3px', padding: '2px 6px', textTransform: 'uppercase',
                        }}>
                          {severity}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px', borderBottom: `1px solid ${PALETTE.panelBorder}`, fontFamily: FONT.ui, fontSize: '12px', color: PALETTE.textSecondary }}>
                        {choiceLabel}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{ ...label, color: PALETTE.textDim }}>No events in history yet.</div>
          )}
        </div>
      </PixelPanel>

      <Modal isOpen={showModeConfirm} onClose={() => setShowModeConfirm(false)} title="Change Storyteller Mode">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontFamily: FONT.ui, fontSize: '14px', color: PALETTE.text }}>
            Switch storyteller mode to{' '}
            <span style={{ color: pendingMode ? STORYTELLER_LABELS[pendingMode].color : PALETTE.text, fontWeight: 500 }}>
              {pendingMode ? STORYTELLER_LABELS[pendingMode].name : ''}
            </span>?
          </p>
          <p style={{ fontFamily: FONT.ui, fontSize: '12px', color: PALETTE.textSecondary }}>
            {pendingMode ? STORYTELLER_LABELS[pendingMode].desc : ''}
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <PixelButton variant="primary" onClick={() => setShowModeConfirm(false)}>Cancel</PixelButton>
            <PixelButton variant="success" onClick={confirmModeChange}>Confirm</PixelButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
