import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { StorytellerMode } from '../../types/index.ts';
import { useGameStore } from '../../store/gameStore.ts';
import { PALETTE } from '../../styles/palette.ts';
import { EVENT_TEMPLATES } from '../../data/events.ts';
import { formatGameDate } from '../../utils/format.ts';
import { PixelPanel } from '../ui/PixelPanel.tsx';
import { PixelButton } from '../ui/PixelButton.tsx';
import { Modal } from '../ui/Modal.tsx';
// PixelButton & Modal still used for storyteller mode change

const SEVERITY_COLORS: Record<string, string> = {
  minor: PALETTE.cyan,
  moderate: PALETTE.gold,
  major: PALETTE.red,
  catastrophic: PALETTE.purple,
};

const STORYTELLER_LABELS: Record<StorytellerMode, { name: string; desc: string; color: string }> = {
  steady_growth: {
    name: 'Steady Growth',
    desc: 'Balanced market conditions with moderate events. Good for learning.',
    color: PALETTE.green,
  },
  calm_markets: {
    name: 'Calm Markets',
    desc: 'Low volatility, fewer negative events. Best for building your company.',
    color: PALETTE.blue,
  },
  volatile: {
    name: 'Volatile',
    desc: 'High volatility, frequent major events. Maximum chaos and opportunity.',
    color: PALETTE.red,
  },
};

export function EventsScreen() {
  const eventHistory = useGameStore((s) => s.events.history);
  const market = useGameStore((s) => s.market);
  const isPaused = useGameStore((s) => s.time.isPaused);
  const currentDay = useGameStore((s) => s.time.day);
  const setStorytellerMode = useGameStore((s) => s.setStorytellerMode);

  const [showModeConfirm, setShowModeConfirm] = useState(false);
  const [pendingMode, setPendingMode] = useState<StorytellerMode | null>(null);

  // Recent news: events from the last 30 days
  const recentNews = eventHistory.filter((e) => currentDay - e.triggeredOnDay <= 30);

  const vtFont: CSSProperties = {
    fontFamily: "'VT323', monospace",
    fontSize: '20px',
    color: PALETTE.text,
  };

  const handleModeClick = (mode: StorytellerMode) => {
    if (!isPaused) return;
    if (mode === market.storytellerMode) return;
    setPendingMode(mode);
    setShowModeConfirm(true);
  };

  const confirmModeChange = () => {
    if (pendingMode) {
      setStorytellerMode(pendingMode);
    }
    setShowModeConfirm(false);
    setPendingMode(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Row 1: Active Events + Market Conditions */}
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
                  <div
                    key={evt.id}
                    style={{
                      backgroundColor: PALETTE.bgLight,
                      borderLeft: `3px solid ${sevColor}`,
                      padding: '10px 12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{
                        fontFamily: "'Press Start 2P', cursive",
                        fontSize: '8px',
                        color: PALETTE.gold,
                      }}>
                        {tmpl.name}
                      </span>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{
                          fontFamily: "'Press Start 2P', cursive",
                          fontSize: '6px',
                          color: sevColor,
                          border: `1px solid ${sevColor}`,
                          padding: '2px 4px',
                          textTransform: 'uppercase',
                        }}>
                          {tmpl.severity}
                        </span>
                        <span style={{ ...vtFont, fontSize: '13px', color: PALETTE.textDim }}>
                          {formatGameDate(evt.triggeredOnDay)}
                        </span>
                      </div>
                    </div>
                    <p style={{ ...vtFont, fontSize: '16px', color: PALETTE.text, margin: 0 }}>
                      {tmpl.description}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ ...vtFont, color: PALETTE.textDim }}>
              No recent news. Events appear randomly as the game progresses.
            </div>
          )}
        </PixelPanel>

        {/* Market Conditions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <PixelPanel title="Market Conditions">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '28px',
                  lineHeight: 1,
                }}>
                  {market.globalRegime === 'bull' ? '\u25B2' : market.globalRegime === 'bear' ? '\u25BC' : '\u25C6'}
                </span>
                <span style={{
                  fontFamily: "'Press Start 2P', cursive",
                  fontSize: '12px',
                  color: market.globalRegime === 'bull'
                    ? PALETTE.green
                    : market.globalRegime === 'bear'
                      ? PALETTE.red
                      : PALETTE.gold,
                }}>
                  {market.globalRegime.toUpperCase()}
                </span>
              </div>
              <div style={vtFont}>
                <span style={{ color: PALETTE.textDim }}>Duration Remaining: </span>
                <span>{market.regimeDaysRemaining} days</span>
              </div>
              <div style={vtFont}>
                <span style={{ color: PALETTE.textDim }}>Storyteller: </span>
                <span style={{ color: STORYTELLER_LABELS[market.storytellerMode].color }}>
                  {STORYTELLER_LABELS[market.storytellerMode].name}
                </span>
              </div>
            </div>
          </PixelPanel>

          {/* Storyteller Selection */}
          <PixelPanel title="Storyteller Mode">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {!isPaused && (
                <div style={{
                  ...vtFont,
                  fontSize: '14px',
                  color: PALETTE.red,
                  marginBottom: '4px',
                }}>
                  Pause the game to change storyteller mode.
                </div>
              )}
              {(Object.entries(STORYTELLER_LABELS) as [StorytellerMode, typeof STORYTELLER_LABELS[StorytellerMode]][]).map(
                ([mode, info]) => {
                  const isActive = market.storytellerMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => handleModeClick(mode)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        padding: '10px',
                        backgroundColor: isActive ? `${info.color}22` : PALETTE.bgLight,
                        border: `2px solid ${isActive ? info.color : PALETTE.panelLight}`,
                        cursor: isPaused && !isActive ? 'pointer' : 'default',
                        opacity: !isPaused && !isActive ? 0.5 : 1,
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{
                        fontFamily: "'Press Start 2P', cursive",
                        fontSize: '8px',
                        color: info.color,
                      }}>
                        {info.name} {isActive ? '(Active)' : ''}
                      </span>
                      <span style={{ ...vtFont, fontSize: '14px', color: PALETTE.textDim }}>
                        {info.desc}
                      </span>
                    </button>
                  );
                },
              )}
            </div>
          </PixelPanel>
        </div>
      </div>

      {/* Event Log / History */}
      <PixelPanel title="Event History">
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {eventHistory.length > 0 ? (
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              ...vtFont,
            }}>
              <thead>
                <tr>
                  <th style={{
                    padding: '8px 12px',
                    textAlign: 'left',
                    borderBottom: `3px solid ${PALETTE.gold}`,
                    fontFamily: "'Press Start 2P', cursive",
                    fontSize: '7px',
                    color: PALETTE.gold,
                    whiteSpace: 'nowrap',
                  }}>
                    Date
                  </th>
                  <th style={{
                    padding: '8px 12px',
                    textAlign: 'left',
                    borderBottom: `3px solid ${PALETTE.gold}`,
                    fontFamily: "'Press Start 2P', cursive",
                    fontSize: '7px',
                    color: PALETTE.gold,
                    whiteSpace: 'nowrap',
                  }}>
                    Event
                  </th>
                  <th style={{
                    padding: '8px 12px',
                    textAlign: 'center',
                    borderBottom: `3px solid ${PALETTE.gold}`,
                    fontFamily: "'Press Start 2P', cursive",
                    fontSize: '7px',
                    color: PALETTE.gold,
                    whiteSpace: 'nowrap',
                  }}>
                    Severity
                  </th>
                  <th style={{
                    padding: '8px 12px',
                    textAlign: 'left',
                    borderBottom: `3px solid ${PALETTE.gold}`,
                    fontFamily: "'Press Start 2P', cursive",
                    fontSize: '7px',
                    color: PALETTE.gold,
                    whiteSpace: 'nowrap',
                  }}>
                    Choice Made
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...eventHistory].reverse().map((evt, idx) => {
                  const tmpl = EVENT_TEMPLATES.find((t) => t.id === evt.templateId);
                  const severity = tmpl?.severity ?? 'minor';
                  const sevColor = SEVERITY_COLORS[severity] ?? PALETTE.textDim;
                  const choiceLabel =
                    evt.choiceMade !== undefined && tmpl
                      ? tmpl.choices[evt.choiceMade]?.label ?? `Choice ${evt.choiceMade}`
                      : 'Auto-resolved';

                  return (
                    <tr
                      key={evt.id}
                      style={{
                        backgroundColor: idx % 2 === 0 ? PALETTE.panel : PALETTE.bgLight,
                      }}
                    >
                      <td style={{
                        padding: '6px 12px',
                        borderBottom: `1px solid ${PALETTE.panelLight}`,
                        whiteSpace: 'nowrap',
                        fontSize: '14px',
                        color: PALETTE.textDim,
                      }}>
                        {formatGameDate(evt.triggeredOnDay)}
                      </td>
                      <td style={{
                        padding: '6px 12px',
                        borderBottom: `1px solid ${PALETTE.panelLight}`,
                        whiteSpace: 'nowrap',
                        fontSize: '18px',
                      }}>
                        {tmpl?.name ?? evt.templateId}
                      </td>
                      <td style={{
                        padding: '6px 12px',
                        borderBottom: `1px solid ${PALETTE.panelLight}`,
                        textAlign: 'center',
                      }}>
                        <span style={{
                          fontFamily: "'Press Start 2P', cursive",
                          fontSize: '6px',
                          color: sevColor,
                          border: `1px solid ${sevColor}`,
                          padding: '2px 4px',
                          textTransform: 'uppercase',
                        }}>
                          {severity}
                        </span>
                      </td>
                      <td style={{
                        padding: '6px 12px',
                        borderBottom: `1px solid ${PALETTE.panelLight}`,
                        fontSize: '16px',
                        color: PALETTE.textDim,
                      }}>
                        {choiceLabel}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{ ...vtFont, color: PALETTE.textDim }}>
              No events in history yet.
            </div>
          )}
        </div>
      </PixelPanel>

      {/* Storyteller Mode Change Confirmation */}
      <Modal
        isOpen={showModeConfirm}
        onClose={() => setShowModeConfirm(false)}
        title="Change Storyteller Mode"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={vtFont}>
            Switch storyteller mode to{' '}
            <span style={{ color: pendingMode ? STORYTELLER_LABELS[pendingMode].color : PALETTE.text }}>
              {pendingMode ? STORYTELLER_LABELS[pendingMode].name : ''}
            </span>
            ?
          </p>
          <p style={{ ...vtFont, fontSize: '16px', color: PALETTE.textDim }}>
            {pendingMode ? STORYTELLER_LABELS[pendingMode].desc : ''}
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <PixelButton variant="primary" onClick={() => setShowModeConfirm(false)}>
              Cancel
            </PixelButton>
            <PixelButton variant="success" onClick={confirmModeChange}>
              Confirm
            </PixelButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
