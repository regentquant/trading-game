import { useMemo, type CSSProperties } from 'react';
import { useGameStore } from '../../store/gameStore.ts';
import { ASSET_DEFINITIONS } from '../../data/assets.ts';
import { PALETTE, FONT } from '../../styles/palette.ts';

export function Ticker() {
  const assets = useGameStore((s) => s.market.assets);

  const tickerItems = useMemo(() => {
    return ASSET_DEFINITIONS.map((def) => {
      const state = assets[def.id];
      if (!state) return null;
      const change = state.previousPrice > 0
        ? (state.price - state.previousPrice) / state.previousPrice
        : 0;
      return {
        ticker: def.ticker,
        price: state.price,
        change,
      };
    }).filter(Boolean) as { ticker: string; price: number; change: number }[];
  }, [assets]);

  const allItems = [...tickerItems, ...tickerItems];

  const wrapperStyle: CSSProperties = {
    overflow: 'hidden',
    width: '100%',
    backgroundColor: PALETTE.bg,
    borderBottom: `1px solid ${PALETTE.panelBorder}`,
    height: '32px',
    display: 'flex',
    alignItems: 'center',
  };

  const trackStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    whiteSpace: 'nowrap',
    animation: `tickerScroll ${tickerItems.length * 3}s linear infinite`,
    fontFamily: FONT.mono,
    fontSize: '12px',
  };

  const formatPrice = (price: number): string => {
    if (price >= 1000) return `$${price.toFixed(0)}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(4)}`;
  };

  return (
    <>
      <style>{`
        @keyframes tickerScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      <div style={wrapperStyle}>
        <div style={trackStyle}>
          {allItems.map((item, idx) => {
            const isUp = item.change >= 0;
            const color = isUp ? PALETTE.green : PALETTE.red;
            const arrow = isUp ? '\u25B2' : '\u25BC';
            const pct = (item.change * 100).toFixed(2);
            return (
              <span key={idx} style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ color: PALETTE.textSecondary, fontWeight: 500 }}>{item.ticker}</span>
                <span style={{ color: PALETTE.text }}>{formatPrice(item.price)}</span>
                <span style={{ color, fontSize: '11px' }}>
                  {arrow} {isUp ? '+' : ''}{pct}%
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </>
  );
}
