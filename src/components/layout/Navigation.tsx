import type { CSSProperties } from 'react';
import { useGameStore } from '../../store/gameStore.ts';
import { PALETTE } from '../../styles/palette.ts';

interface NavItem {
  id: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '\uD83D\uDCCA' },
  { id: 'market', label: 'Market', icon: '\uD83D\uDCC8' },
  { id: 'trading', label: 'Trading', icon: '\uD83D\uDCB0' },
  { id: 'employees', label: 'Employees', icon: '\uD83D\uDC65' },
  { id: 'revenue', label: 'Revenue', icon: '\uD83D\uDCB5' },
  { id: 'events', label: 'Events', icon: '\uD83D\uDCF0' },
  { id: 'settings', label: 'Settings', icon: '\u2699\uFE0F' },
];

export function Navigation() {
  const activeScreen = useGameStore((s) => s.ui.activeScreen);
  const setActiveScreen = useGameStore((s) => s.setActiveScreen);

  const navStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: '8px 0',
    width: '100%',
  };

  return (
    <nav style={navStyle}>
      {NAV_ITEMS.map((item) => {
        const isActive = activeScreen === item.id;

        const itemStyle: CSSProperties = {
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 14px',
          cursor: 'pointer',
          backgroundColor: isActive ? PALETTE.blue : 'transparent',
          color: isActive ? PALETTE.white : PALETTE.textDim,
          fontFamily: "'VT323', monospace",
          fontSize: '20px',
          border: 'none',
          textAlign: 'left',
          width: '100%',
          transition: 'background-color 0.15s ease, color 0.15s ease',
        };

        return (
          <button
            type="button"
            key={item.id}
            style={itemStyle}
            onClick={() => setActiveScreen(item.id)}
            onMouseEnter={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLElement).style.backgroundColor = PALETTE.panelLight;
                (e.currentTarget as HTMLElement).style.color = PALETTE.text;
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                (e.currentTarget as HTMLElement).style.color = PALETTE.textDim;
              }
            }}
          >
            <span style={{ fontSize: '22px', lineHeight: 1 }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
