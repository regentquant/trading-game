import { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from './store/gameStore.ts';
import { getAchievementName } from './store/gameStore.ts';
import { startGameLoop } from './engine/tick.ts';
import { AppShell } from './components/layout/AppShell.tsx';
import { NewsTicker } from './components/ui/NewsTicker.tsx';
import { Modal } from './components/ui/Modal.tsx';
import { PixelButton } from './components/ui/PixelButton.tsx';
import { EVENT_TEMPLATES } from './data/events.ts';
import { PALETTE } from './styles/palette.ts';
import { formatCurrency } from './utils/format.ts';
import type { CSSProperties } from 'react';

// ─── Tutorial content for each screen ────────────────────
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

  // Track achievement changes for toast notifications
  useEffect(() => {
    const prev = prevAchievementsRef.current;
    const newOnes = achievements.filter((a) => !prev.includes(a));
    if (newOnes.length > 0) {
      const newToasts = newOnes.map((id) => ({
        id: `toast_${id}_${Date.now()}`,
        text: `Achievement Unlocked: ${getAchievementName(id)}`,
      }));
      setToasts((t) => [...t, ...newToasts]);
      // Auto-remove toasts after 4 seconds
      for (const toast of newToasts) {
        setTimeout(() => {
          setToasts((t) => t.filter((tt) => tt.id !== toast.id));
        }, 4000);
      }
    }
    prevAchievementsRef.current = [...achievements];
  }, [achievements]);

  // CRT effect class management
  useEffect(() => {
    const root = document.getElementById('app');
    if (root) {
      if (crtEnabled) {
        root.classList.add('crt-active');
      } else {
        root.classList.remove('crt-active');
      }
    }
  }, [crtEnabled]);

  // Tutorial check when screen changes
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

    // Attempt to load a saved game
    const loaded = useGameStore.getState().loadGame();
    if (!loaded) {
      // No save found -- show new game modal
      console.log('No save found. Starting new game.');
      setShowNewGameModal(true);
    } else {
      console.log('Save loaded successfully.');
      // Mark as shown so tutorial system works
      if (!useGameStore.getState().ui.newGameModalShown) {
        useGameStore.getState().setNewGameModalShown();
      }
    }

    // Start the game loop
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

  const vtFont: CSSProperties = {
    fontFamily: "'VT323', monospace",
    fontSize: '20px',
    color: PALETTE.text,
  };

  return (
    <>
      <AppShell />

      {/* News Ticker — non-blocking news display */}
      {!gameOver && !showNewGameModal && (
        <NewsTicker
          events={eventHistory}
          templates={EVENT_TEMPLATES}
          currentDay={currentDay}
        />
      )}

      {/* New Game Modal */}
      {showNewGameModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000,
          }}
        >
          <div
            className="nes-container is-dark with-title"
            style={{
              backgroundColor: PALETTE.panel,
              color: PALETTE.text,
              maxWidth: '500px',
              width: '90%',
            }}
          >
            <p
              className="title"
              style={{
                fontFamily: "'Press Start 2P', cursive",
                fontSize: '12px',
                color: PALETTE.gold,
              }}
            >
              New Game
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  fontFamily: "'Press Start 2P', cursive",
                  fontSize: '14px',
                  color: PALETTE.gold,
                  textAlign: 'center',
                }}
              >
                TRADING TYCOON
              </div>
              <p style={{ ...vtFont, textAlign: 'center', color: PALETTE.textDim }}>
                Build your financial empire from a small startup to a global trading powerhouse.
              </p>
              <div>
                <label
                  style={{ ...vtFont, fontSize: '16px', color: PALETTE.textDim }}
                >
                  Company Name:
                </label>
                <input
                  type="text"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  placeholder="Trading Tycoon Inc."
                  maxLength={30}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleNewGame();
                  }}
                  style={{
                    width: '100%',
                    padding: '8px',
                    backgroundColor: PALETTE.bg,
                    color: PALETTE.text,
                    border: `2px solid ${PALETTE.panelLight}`,
                    fontFamily: "'VT323', monospace",
                    fontSize: '22px',
                    marginTop: '6px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div
                style={{
                  ...vtFont,
                  fontSize: '14px',
                  color: PALETTE.textDim,
                  backgroundColor: PALETTE.bgLight,
                  padding: '8px',
                  border: `1px solid ${PALETTE.panelLight}`,
                }}
              >
                You start with:
                <br />
                - $500,000 cash
                <br />
                - 1 Analyst + 1 Broker
                <br />- Brokerage revenue stream active
              </div>
              <PixelButton variant="success" onClick={handleNewGame}>
                START GAME
              </PixelButton>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameOver && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.92)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 3000,
          }}
        >
          <div
            className="nes-container is-dark with-title"
            style={{
              backgroundColor: PALETTE.panel,
              color: PALETTE.text,
              maxWidth: '500px',
              width: '90%',
              border: `4px solid ${PALETTE.red}`,
              boxShadow: `0 0 30px ${PALETTE.red}60`,
            }}
          >
            <p
              className="title"
              style={{
                fontFamily: "'Press Start 2P', cursive",
                fontSize: '12px',
                color: PALETTE.red,
              }}
            >
              BANKRUPTCY
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: "'Press Start 2P', cursive",
                  fontSize: '16px',
                  color: PALETTE.red,
                }}
              >
                GAME OVER
              </div>
              <p style={vtFont}>
                <span style={{ color: PALETTE.gold }}>{companyName}</span> has been insolvent for 3 consecutive months and is forced to close.
              </p>
              <div style={{ ...vtFont, color: PALETTE.textDim }}>
                Final Cash: <span style={{ color: PALETTE.red }}>{formatCurrency(cash)}</span>
              </div>
              <PixelButton variant="warning" onClick={handleRestart}>
                START NEW GAME
              </PixelButton>
            </div>
          </div>
        </div>
      )}

      {/* Tutorial Popup */}
      <Modal
        isOpen={showTutorial}
        onClose={handleTutorialDismiss}
        title={`${activeScreen.charAt(0).toUpperCase() + activeScreen.slice(1)} Guide`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={vtFont}>{tutorialText}</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <PixelButton variant="primary" onClick={handleTutorialDismiss}>
              GOT IT
            </PixelButton>
          </div>
        </div>
      </Modal>

      {/* Achievement Toast Notifications */}
      {toasts.map((toast, idx) => (
        <div
          key={toast.id}
          style={{
            position: 'fixed',
            top: `${80 + idx * 50}px`,
            right: '20px',
            backgroundColor: PALETTE.gold,
            color: PALETTE.black,
            padding: '10px 20px',
            fontFamily: "'Press Start 2P', cursive",
            fontSize: '8px',
            zIndex: 5000,
            border: `3px solid ${PALETTE.goldDark}`,
            boxShadow: `4px 4px 0 ${PALETTE.black}`,
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
