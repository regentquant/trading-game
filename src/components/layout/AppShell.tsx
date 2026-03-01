import type { CSSProperties } from 'react';
import { useGameStore } from '../../store/gameStore.ts';
import { PALETTE, FONT } from '../../styles/palette.ts';
import { formatCurrency } from '../../utils/format.ts';
import { formatGameDate } from '../../utils/format.ts';
import { Ticker } from '../ui/Ticker.tsx';
import { Navigation } from './Navigation.tsx';
import { EVENT_TEMPLATES } from '../../data/events.ts';
import { DashboardScreen } from '../screens/DashboardScreen.tsx';
import { MarketScreen } from '../screens/MarketScreen.tsx';
import { TradingScreen } from '../screens/TradingScreen.tsx';
import { EmployeeScreen } from '../screens/EmployeeScreen.tsx';
import { RevenueScreen } from '../screens/RevenueScreen.tsx';
import { EventsScreen } from '../screens/EventsScreen.tsx';
import { SettingsScreen } from '../screens/SettingsScreen.tsx';

const SCREEN_MAP: Record<string, () => ReturnType<typeof DashboardScreen>> = {
  dashboard: DashboardScreen,
  market: MarketScreen,
  trading: TradingScreen,
  employees: EmployeeScreen,
  revenue: RevenueScreen,
  events: EventsScreen,
  settings: SettingsScreen,
};

export function AppShell() {
  const companyName = useGameStore((s) => s.company.name);
  const cash = useGameStore((s) => s.company.cash);
  const day = useGameStore((s) => s.time.day);
  const speed = useGameStore((s) => s.time.speed);
  const isPaused = useGameStore((s) => s.time.isPaused);
  const setSpeed = useGameStore((s) => s.setSpeed);
  const togglePause = useGameStore((s) => s.togglePause);
  const activeScreen = useGameStore((s) => s.ui.activeScreen);
  const activeEvents = useGameStore((s) => s.events.active);
  const historyEvents = useGameStore((s) => s.events.history);

  const recentEvents = historyEvents.slice(-3).reverse();
  const speeds: (0 | 1 | 2 | 5)[] = [1, 2, 5];

  const shellStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
    backgroundColor: PALETTE.bg,
  };

  const topBarStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 20px',
    backgroundColor: PALETTE.panel,
    borderBottom: `1px solid ${PALETTE.panelBorder}`,
    minHeight: '52px',
    flexShrink: 0,
  };

  const companyNameStyle: CSSProperties = {
    fontFamily: FONT.ui,
    fontSize: '15px',
    fontWeight: 700,
    color: PALETTE.text,
    letterSpacing: '-0.01em',
  };

  const cashStyle: CSSProperties = {
    fontFamily: FONT.mono,
    fontSize: '20px',
    fontWeight: 600,
    color: PALETTE.green,
  };

  const dateAreaStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  };

  const dateStyle: CSSProperties = {
    fontFamily: FONT.mono,
    fontSize: '13px',
    color: PALETTE.textSecondary,
    whiteSpace: 'nowrap',
  };

  const speedBtnContainerStyle: CSSProperties = {
    display: 'flex',
    gap: '2px',
    alignItems: 'center',
    backgroundColor: PALETTE.bgLight,
    borderRadius: '6px',
    padding: '2px',
  };

  const speedBtnStyle = (active: boolean): CSSProperties => ({
    fontFamily: FONT.mono,
    fontSize: '11px',
    fontWeight: 600,
    padding: '4px 10px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: active ? PALETTE.accent : 'transparent',
    color: active ? PALETTE.white : PALETTE.textDim,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  });

  const bodyStyle: CSSProperties = {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  };

  const sidebarStyle: CSSProperties = {
    width: '180px',
    flexShrink: 0,
    backgroundColor: PALETTE.panel,
    borderRight: `1px solid ${PALETTE.panelBorder}`,
    overflowY: 'auto',
  };

  const mainStyle: CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    backgroundColor: PALETTE.bg,
  };

  const bottomBarStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 20px',
    backgroundColor: PALETTE.panel,
    borderTop: `1px solid ${PALETTE.panelBorder}`,
    minHeight: '36px',
    flexShrink: 0,
    fontFamily: FONT.ui,
    fontSize: '12px',
    color: PALETTE.textDim,
    overflowX: 'auto',
  };

  const eventBadgeStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 10px',
    backgroundColor: PALETTE.bgLight,
    border: `1px solid ${PALETTE.panelBorder}`,
    borderRadius: '4px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontSize: '12px',
    transition: 'border-color 0.15s ease',
  };

  const ScreenComponent = SCREEN_MAP[activeScreen] ?? null;

  const unresolvedCount = activeEvents.filter((e) => !e.resolved).length;

  return (
    <div style={shellStyle}>
      {/* Top Bar */}
      <div style={topBarStyle}>
        <span style={companyNameStyle}>{companyName}</span>
        <span style={cashStyle}>{formatCurrency(cash)}</span>
        <div style={dateAreaStyle}>
          <span style={dateStyle}>{formatGameDate(day)}</span>
          <div style={speedBtnContainerStyle}>
            <button
              type="button"
              style={speedBtnStyle(isPaused)}
              onClick={togglePause}
            >
              {isPaused ? '\u25B6' : '\u23F8'}
            </button>
            {speeds.map((s) => (
              <button
                type="button"
                key={s}
                style={speedBtnStyle(!isPaused && speed === s)}
                onClick={() => setSpeed(s)}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ticker */}
      <Ticker />

      {/* Body */}
      <div style={bodyStyle}>
        <div style={sidebarStyle}>
          <Navigation />
        </div>

        <div style={mainStyle}>
          {ScreenComponent ? (
            <ScreenComponent />
          ) : (
            <div style={{
              fontFamily: FONT.ui,
              fontSize: '14px',
              color: PALETTE.textDim,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
            }}>
              {activeScreen.charAt(0).toUpperCase() + activeScreen.slice(1)} Screen
            </div>
          )}
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={bottomBarStyle}>
        {unresolvedCount > 0 && (
          <span style={{ color: PALETTE.red, fontWeight: 500 }}>
            {unresolvedCount} event{unresolvedCount > 1 ? 's' : ''} pending!
          </span>
        )}
        {recentEvents.length > 0 ? (
          recentEvents.map((evt) => {
            const tmpl = EVENT_TEMPLATES.find((t) => t.id === evt.templateId);
            return (
              <span key={evt.id} style={eventBadgeStyle}>
                {tmpl?.name ?? evt.templateId}
              </span>
            );
          })
        ) : (
          <span>No recent events</span>
        )}
      </div>
    </div>
  );
}
