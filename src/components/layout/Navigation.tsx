import type { CSSProperties } from 'react';
import { useGameStore } from '../../store/gameStore.ts';
import { PALETTE, FONT } from '../../styles/palette.ts';

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
    padding: '8px',
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
          padding: '10px 12px',
          cursor: 'pointer',
          backgroundColor: isActive ? `${PALETTE.accent}18` : 'transparent',
          color: isActive ? PALETTE.text : PALETTE.textSecondary,
          fontFamily: FONT.ui,
          fontSize: '13px',
          fontWeight: isActive ? 600 : 400,
          border: 'none',
          borderRadius: '6px',
          textAlign: 'left',
          width: '100%',
          transition: 'all 0.15s ease',
          borderLeft: isActive ? `2px solid ${PALETTE.accent}` : '2px solid transparent',
        };

        return (
          <button
            type="button"
            key={item.id}
            style={itemStyle}
            onClick={() => setActiveScreen(item.id)}
            onMouseEnter={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLElement).style.backgroundColor = `${PALETTE.panelLight}80`;
                (e.currentTarget as HTMLElement).style.color = PALETTE.text;
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                (e.currentTarget as HTMLElement).style.color = PALETTE.textSecondary;
              }
            }}
          >
            <span style={{ fontSize: '16px', lineHeight: 1, opacity: isActive ? 1 : 0.7 }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
