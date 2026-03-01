import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { useGameStore } from '../../store/gameStore.ts';
import {
  selectNetWorth,
  selectPortfolioValue,
  selectTotalEmployees,
  selectActiveStreamCount,
} from '../../store/selectors.ts';
import { calculateUnrealizedPnL } from '../../engine/revenue/portfolioManager.ts';
import { PALETTE, FONT } from '../../styles/palette.ts';
import { ASSET_DEFINITIONS } from '../../data/assets.ts';
import { EVENT_TEMPLATES } from '../../data/events.ts';
import { formatCurrency } from '../../utils/format.ts';
import { PixelPanel } from '../ui/PixelPanel.tsx';
import { StatBar } from '../ui/StatBar.tsx';
import { PriceChange } from '../ui/PriceChange.tsx';
import { SparkLine } from '../charts/SparkLine.tsx';

const SEVERITY_COLORS: Record<string, string> = {
  minor: PALETTE.cyan,
  moderate: PALETTE.gold,
  major: PALETTE.red,
  catastrophic: PALETTE.purple,
};

export function DashboardScreen() {
  const company = useGameStore((s) => s.company);
  const time = useGameStore((s) => s.time);
  const market = useGameStore((s) => s.market);
  const portfolio = useGameStore((s) => s.portfolio);
  const eventHistory = useGameStore((s) => s.events.history);

  const netWorth = useGameStore((s) => selectNetWorth(s));
  const portfolioValue = useGameStore((s) => selectPortfolioValue(s));
  const totalEmployees = useGameStore((s) => selectTotalEmployees(s));
  const activeStreams = useGameStore((s) => selectActiveStreamCount(s));
  const unrealizedPnL = useMemo(() => calculateUnrealizedPnL(portfolio, market.assets), [portfolio, market.assets]);

  const profitHistory = useMemo(() => {
    return company.financialHistory.slice(-6).map((r) => r.profit);
  }, [company.financialHistory]);

  const latestReport = company.financialHistory.length > 0
    ? company.financialHistory[company.financialHistory.length - 1]
    : null;

  const recentEvents = useMemo(() => {
    return eventHistory.slice(-5).reverse();
  }, [eventHistory]);

  const movers = useMemo(() => {
    const items = ASSET_DEFINITIONS.map((def) => {
      const assetState = market.assets[def.id];
      if (!assetState) return null;
      const change = assetState.previousPrice > 0
        ? (assetState.price - assetState.previousPrice) / assetState.previousPrice
        : 0;
      return {
        id: def.id,
        ticker: def.ticker,
        name: def.name,
        price: assetState.price,
        previousPrice: assetState.previousPrice,
        change,
      };
    }).filter(Boolean) as {
      id: string; ticker: string; name: string;
      price: number; previousPrice: number; change: number;
    }[];

    const sorted = [...items].sort((a, b) => b.change - a.change);
    return { gainers: sorted.slice(0, 3), losers: sorted.slice(-3).reverse() };
  }, [market.assets]);

  const gridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' };

  const statsGridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
  };

  const statCardStyle: CSSProperties = {
    backgroundColor: PALETTE.bgLight,
    border: `1px solid ${PALETTE.panelBorder}`,
    borderRadius: '8px',
    padding: '14px',
    textAlign: 'center',
  };

  const statLabelStyle: CSSProperties = {
    fontFamily: FONT.ui,
    fontSize: '10px',
    fontWeight: 600,
    color: PALETTE.textDim,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: '6px',
  };

  const statValueStyle: CSSProperties = {
    fontFamily: FONT.mono,
    fontSize: '18px',
    fontWeight: 600,
    color: PALETTE.text,
  };

  const label: CSSProperties = { fontFamily: FONT.ui, fontSize: '13px', color: PALETTE.textSecondary };
  const value: CSSProperties = { fontFamily: FONT.mono, fontSize: '14px', color: PALETTE.text };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Row 1 */}
      <div style={gridStyle}>
        <PixelPanel title="Company Overview">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <span style={label}>Name: </span>
              <span style={{ ...value, color: PALETTE.accent }}>{company.name}</span>
            </div>
            <div>
              <span style={{ fontFamily: FONT.mono, fontSize: '26px', fontWeight: 700, color: PALETTE.green }}>
                {formatCurrency(company.cash)}
              </span>
              <span style={{ ...label, marginLeft: '8px', fontSize: '11px' }}>CASH</span>
            </div>
            <div>
              <span style={label}>Net Worth: </span>
              <span style={{ ...value, color: PALETTE.cyan }}>{formatCurrency(netWorth)}</span>
            </div>
            <StatBar value={company.reputation} maxValue={100} color={PALETTE.gold} label="Reputation" />
            <div>
              <span style={label}>Office Level: </span>
              <span style={{ ...value, color: PALETTE.accent }}>{company.officeLevel}</span>
            </div>
          </div>
        </PixelPanel>

        <PixelPanel title="Monthly P&L">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {latestReport ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>
                    <span style={label}>Revenue: </span>
                    <span style={{ ...value, color: PALETTE.green }}>{formatCurrency(latestReport.revenue)}</span>
                  </span>
                  <span>
                    <span style={label}>Expenses: </span>
                    <span style={{ ...value, color: PALETTE.red }}>{formatCurrency(latestReport.expenses)}</span>
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={label}>Profit: </span>
                    <span style={{
                      fontFamily: FONT.mono, fontSize: '22px', fontWeight: 700,
                      color: latestReport.profit >= 0 ? PALETTE.green : PALETTE.red,
                    }}>
                      {formatCurrency(latestReport.profit)}
                    </span>
                  </div>
                  {profitHistory.length >= 2 && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ ...label, fontSize: '10px', marginBottom: '4px' }}>6-MO TREND</span>
                      <SparkLine data={profitHistory} width={100} height={30} />
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '4px', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                  {latestReport.revenue > 0 && (
                    <div style={{ flex: latestReport.revenue, backgroundColor: PALETTE.green, borderRadius: '3px' }} />
                  )}
                  {latestReport.expenses > 0 && (
                    <div style={{ flex: latestReport.expenses, backgroundColor: PALETTE.red, borderRadius: '3px' }} />
                  )}
                </div>
                <div style={{ display: 'flex', gap: '16px', ...label, fontSize: '11px' }}>
                  <span><span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: PALETTE.green, borderRadius: '2px', marginRight: '4px' }} />Revenue</span>
                  <span><span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: PALETTE.red, borderRadius: '2px', marginRight: '4px' }} />Expenses</span>
                </div>
              </>
            ) : (
              <div style={{ ...label, color: PALETTE.textDim }}>
                No monthly data yet. Reports generate every 30 days.
              </div>
            )}
          </div>
        </PixelPanel>
      </div>

      {/* Row 2: Quick Stats */}
      <PixelPanel title="Quick Stats">
        <div style={statsGridStyle}>
          {[
            { label: 'EMPLOYEES', value: String(totalEmployees) },
            { label: 'ACTIVE STREAMS', value: String(activeStreams) },
            { label: 'PORTFOLIO VALUE', value: formatCurrency(portfolioValue), color: PALETTE.cyan },
            { label: 'UNREALIZED P&L', value: formatCurrency(unrealizedPnL), color: unrealizedPnL >= 0 ? PALETTE.green : PALETTE.red },
            { label: 'MARKET', value: market.globalRegime === 'bull' ? '\u25B2 Bull' : market.globalRegime === 'bear' ? '\u25BC Bear' : '\u25C6 Sideways', color: market.globalRegime === 'bull' ? PALETTE.green : market.globalRegime === 'bear' ? PALETTE.red : PALETTE.gold },
            { label: 'DAYS PLAYED', value: String(time.day) },
          ].map((stat) => (
            <div key={stat.label} style={statCardStyle}>
              <div style={statLabelStyle}>{stat.label}</div>
              <div style={{ ...statValueStyle, color: stat.color ?? PALETTE.text }}>{stat.value}</div>
            </div>
          ))}
        </div>
      </PixelPanel>

      {/* Row 3: Recent Events + Top Movers */}
      <div style={gridStyle}>
        <PixelPanel title="Recent Events">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {recentEvents.length > 0 ? (
              recentEvents.map((evt) => {
                const tmpl = EVENT_TEMPLATES.find((t) => t.id === evt.templateId);
                const severity = tmpl?.severity ?? 'minor';
                const sevColor = SEVERITY_COLORS[severity] ?? PALETTE.textDim;
                return (
                  <div key={evt.id} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 10px', backgroundColor: PALETTE.bgLight,
                    border: `1px solid ${PALETTE.panelBorder}`, borderRadius: '6px',
                  }}>
                    <span style={{
                      fontFamily: FONT.ui, fontSize: '9px', fontWeight: 600,
                      color: sevColor, border: `1px solid ${sevColor}`,
                      borderRadius: '3px', padding: '2px 6px',
                      textTransform: 'uppercase', flexShrink: 0,
                    }}>
                      {severity}
                    </span>
                    <span style={{ fontFamily: FONT.ui, fontSize: '13px', flex: 1, color: PALETTE.text }}>
                      {tmpl?.name ?? evt.templateId}
                    </span>
                    <span style={{ fontFamily: FONT.mono, fontSize: '11px', color: PALETTE.textDim, flexShrink: 0 }}>
                      Day {evt.triggeredOnDay}
                    </span>
                  </div>
                );
              })
            ) : (
              <div style={{ ...label, color: PALETTE.textDim }}>No events yet.</div>
            )}
          </div>
        </PixelPanel>

        <PixelPanel title="Top Movers">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ fontFamily: FONT.ui, fontSize: '11px', fontWeight: 600, color: PALETTE.green, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Top Gainers
              </div>
              {movers.gainers.map((m) => (
                <div key={m.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '6px 0', borderBottom: `1px solid ${PALETTE.panelBorder}`,
                  fontFamily: FONT.mono, fontSize: '13px',
                }}>
                  <span style={{ color: PALETTE.accent, minWidth: '60px', fontWeight: 500 }}>{m.ticker}</span>
                  <span style={{ color: PALETTE.text }}>{formatCurrency(m.price)}</span>
                  <PriceChange current={m.price} previous={m.previousPrice} format="percent" />
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontFamily: FONT.ui, fontSize: '11px', fontWeight: 600, color: PALETTE.red, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Top Losers
              </div>
              {movers.losers.map((m) => (
                <div key={m.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '6px 0', borderBottom: `1px solid ${PALETTE.panelBorder}`,
                  fontFamily: FONT.mono, fontSize: '13px',
                }}>
                  <span style={{ color: PALETTE.accent, minWidth: '60px', fontWeight: 500 }}>{m.ticker}</span>
                  <span style={{ color: PALETTE.text }}>{formatCurrency(m.price)}</span>
                  <PriceChange current={m.price} previous={m.previousPrice} format="percent" />
                </div>
              ))}
            </div>
          </div>
        </PixelPanel>
      </div>
    </div>
  );
}
