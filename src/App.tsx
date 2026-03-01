import { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from './store/gameStore.ts';
import { getAchievementName } from './store/gameStore.ts';
import { startGameLoop } from './engine/tick.ts';
import { AppShell } from './components/layout/AppShell.tsx';
import { NewsTicker } from './components/ui/NewsTicker.tsx';
import { Modal } from './components/ui/Modal.tsx';
import { PixelButton } from './components/ui/PixelButton.tsx';
import { EVENT_TEMPLATES } from './data/events.ts';
import { PALETTE, FONT } from './styles/palette.ts';
import { formatCurrency } from './utils/format.ts';

const TUTORIAL_CONTENT: Record<string, string> = {
  dashboard:
    'Welcome to the Dashboard! This is your command center. Monitor your cash, net worth, market conditions, and recent events at a glance.',
  market:
    'The Market screen shows all tradeable assets. Click any asset to see details and execute trades. Watch the price charts and volatility to find opportunities.',
  trading:
    'The Trading screen is your portfolio headquarters. View your positions, execute buy/sell orders, and track your trading P&L.',
  employees:
    'Manage your team here. Hire from campus, job market, or headhunters. Assign employees to departments and manage their workload.',
  revenue:
    'Revenue Streams are how your company earns money. Activate streams, assign employees, and watch your monthly revenue grow.',
  events:
    'Events happen randomly and can affect your company. Choose wisely! You can also change the Storyteller mode to control market difficulty.',
  settings:
    'Save and load your game here. View lifetime statistics and achievements. Customize display settings.',
};

function App() {
  const loopStarted = useRef(false);

  const eventHistory = useGameStore((s) => s.events.history);
  const currentDay = useGameStore((s) => s.time.day);
  const gameOver = useGameStore((s) => s.company.gameOver);
  const cash = useGameStore((s) => s.company.cash);
  const companyName = useGameStore((s) => s.company.name);
  const newGameModalShown = useGameStore((s) => s.ui.newGameModalShown);
  const tutorialSeen = useGameStore((s) => s.ui.tutorialSeen);
  const activeScreen = useGameStore((s) => s.ui.activeScreen);
  const crtEnabled = useGameStore((s) => s.ui.crtEnabled);
  const achievements = useGameStore((s) => s.statistics.achievements);
  const initializeNewGame = useGameStore((s) => s.initializeNewGame);
  const setTutorialSeen = useGameStore((s) => s.setTutorialSeen);
  const resetGame = useGameStore((s) => s.resetGame);

  const [showNewGameModal, setShowNewGameModal] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialText, setTutorialText] = useState('');
  const [toasts, setToasts] = useState<{ id: string; text: string }[]>([]);
  const prevAchievementsRef = useRef<string[]>([]);

  useEffect(() => {
    const prev = prevAchievementsRef.current;
    const newOnes = achievements.filter((a) => !prev.includes(a));
    if (newOnes.length > 0) {
      const newToasts = newOnes.map((id) => ({
        id: `toast_${id}_${Date.now()}`,
        text: `Achievement Unlocked: ${getAchievementName(id)}`,
      }));
      setToasts((t) => [...t, ...newToasts]);
      for (const toast of newToasts) {
        setTimeout(() => {
          setToasts((t) => t.filter((tt) => tt.id !== toast.id));
        }, 4000);
      }
    }
    prevAchievementsRef.current = [...achievements];
  }, [achievements]);

  useEffect(() => {
    const root = document.getElementById('app');
    if (root) {
      if (crtEnabled) root.classList.add('crt-active');
      else root.classList.remove('crt-active');
    }
  }, [crtEnabled]);

  useEffect(() => {
    if (!newGameModalShown) return;
    if (tutorialSeen[activeScreen]) return;
    const content = TUTORIAL_CONTENT[activeScreen];
    if (content) {
      setTutorialText(content);
      setShowTutorial(true);
    }
  }, [activeScreen, tutorialSeen, newGameModalShown]);

  const handleTutorialDismiss = useCallback(() => {
    setShowTutorial(false);
    setTutorialSeen(activeScreen);
  }, [activeScreen, setTutorialSeen]);

  useEffect(() => {
    if (loopStarted.current) return;
    loopStarted.current = true;
    const loaded = useGameStore.getState().loadGame();
    if (!loaded) {
      setShowNewGameModal(true);
    } else {
      if (!useGameStore.getState().ui.newGameModalShown) {
        useGameStore.getState().setNewGameModalShown();
      }
    }
    startGameLoop(useGameStore);
  }, []);

  const handleNewGame = () => {
    initializeNewGame(newCompanyName);
    setShowNewGameModal(false);
    setNewCompanyName('');
  };

  const handleRestart = () => {
    resetGame();
    setShowNewGameModal(true);
  };

  return (
    <>
      <AppShell />

      {!gameOver && !showNewGameModal && (
        <NewsTicker events={eventHistory} templates={EVENT_TEMPLATES} currentDay={currentDay} />
      )}

      {/* New Game Modal */}
      {showNewGameModal && (
        <div style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 2000,
        }}>
          <div style={{
            backgroundColor: PALETTE.panel,
            border: `1px solid ${PALETTE.panelBorder}`,
            borderRadius: '16px',
            color: PALETTE.text,
            maxWidth: '460px', width: '90%',
            padding: '32px',
            boxShadow: '0 32px 64px rgba(0,0,0,0.5)',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{
                fontFamily: FONT.ui, fontSize: '24px', fontWeight: 700,
                color: PALETTE.text, textAlign: 'center', letterSpacing: '-0.02em',
              }}>
                Trading Tycoon
              </div>
              <p style={{
                fontFamily: FONT.ui, fontSize: '14px', color: PALETTE.textSecondary,
                textAlign: 'center', lineHeight: 1.5,
              }}>
                Build your financial empire from a small startup to a global trading powerhouse.
              </p>
              <div>
                <label style={{ fontFamily: FONT.ui, fontSize: '12px', color: PALETTE.textSecondary }}>
                  Company Name:
                </label>
                <input
                  type="text"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  placeholder="Trading Tycoon Inc."
                  maxLength={30}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleNewGame(); }}
                  style={{
                    width: '100%', padding: '10px 12px',
                    backgroundColor: PALETTE.bg, color: PALETTE.text,
                    border: `1px solid ${PALETTE.panelBorder}`,
                    borderRadius: '8px', fontFamily: FONT.mono,
                    fontSize: '15px', marginTop: '6px', boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{
                fontFamily: FONT.ui, fontSize: '13px', color: PALETTE.textDim,
                backgroundColor: PALETTE.bgLight, padding: '12px',
                borderRadius: '8px', border: `1px solid ${PALETTE.panelBorder}`,
                lineHeight: 1.6,
              }}>
                You start with:<br />
                - $500,000 cash<br />
                - 1 Analyst + 1 Broker<br />
                - Brokerage revenue stream active
              </div>
              <PixelButton variant="success" onClick={handleNewGame} style={{ width: '100%', padding: '12px' }}>
                START GAME
              </PixelButton>
            </div>
          </div>
        </div>
      )}

      {/* Game Over */}
      {gameOver && (
        <div style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 3000,
        }}>
          <div style={{
            backgroundColor: PALETTE.panel,
            border: `1px solid ${PALETTE.red}40`,
            borderRadius: '16px',
            color: PALETTE.text,
            maxWidth: '460px', width: '90%',
            padding: '32px',
            boxShadow: `0 0 60px ${PALETTE.red}15, 0 32px 64px rgba(0,0,0,0.5)`,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
              <div style={{ fontFamily: FONT.ui, fontSize: '12px', fontWeight: 600, color: PALETTE.red, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Bankruptcy
              </div>
              <div style={{ fontFamily: FONT.ui, fontSize: '22px', fontWeight: 700, color: PALETTE.red }}>
                GAME OVER
              </div>
              <p style={{ fontFamily: FONT.ui, fontSize: '14px', color: PALETTE.textSecondary, lineHeight: 1.5 }}>
                <span style={{ color: PALETTE.accent, fontWeight: 500 }}>{companyName}</span> has been insolvent for 3 consecutive months and is forced to close.
              </p>
              <div style={{ fontFamily: FONT.ui, fontSize: '13px', color: PALETTE.textDim }}>
                Final Cash: <span style={{ color: PALETTE.red, fontFamily: FONT.mono }}>{formatCurrency(cash)}</span>
              </div>
              <PixelButton variant="warning" onClick={handleRestart} style={{ width: '100%' }}>
                START NEW GAME
              </PixelButton>
            </div>
          </div>
        </div>
      )}

      {/* Tutorial */}
      <Modal isOpen={showTutorial} onClose={handleTutorialDismiss}
        title={`${activeScreen.charAt(0).toUpperCase() + activeScreen.slice(1)} Guide`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontFamily: FONT.ui, fontSize: '14px', color: PALETTE.text, lineHeight: 1.6 }}>{tutorialText}</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <PixelButton variant="primary" onClick={handleTutorialDismiss}>GOT IT</PixelButton>
          </div>
        </div>
      </Modal>

      {/* Achievement Toasts */}
      {toasts.map((toast, idx) => (
        <div
          key={toast.id}
          style={{
            position: 'fixed',
            top: `${80 + idx * 56}px`,
            right: '20px',
            backgroundColor: PALETTE.gold,
            color: PALETTE.black,
            padding: '12px 20px',
            borderRadius: '8px',
            fontFamily: FONT.ui,
            fontSize: '12px',
            fontWeight: 600,
            zIndex: 5000,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            animation: 'popupSlideUp 0.3s ease-out',
            maxWidth: '320px',
          }}
        >
          {toast.text}
        </div>
      ))}
    </>
  );
}

export default App;
