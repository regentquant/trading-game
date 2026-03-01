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
import { PALETTE } from '../../styles/palette.ts';
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

  const state = useGameStore.getState();
  const netWorth = selectNetWorth(state);
  const portfolioValue = selectPortfolioValue(state);
  const totalEmployees = selectTotalEmployees(state);
  const activeStreams = selectActiveStreamCount(state);
  const unrealizedPnL = calculateUnrealizedPnL(portfolio, market.assets);

  // Monthly P&L sparkline (last 6 months)
  const profitHistory = useMemo(() => {
    return company.financialHistory.slice(-6).map((r) => r.profit);
  }, [company.financialHistory]);

  const latestReport = company.financialHistory.length > 0
    ? company.financialHistory[company.financialHistory.length - 1]
    : null;

  // Recent events (last 5)
  const recentEvents = useMemo(() => {
    return eventHistory.slice(-5).reverse();
  }, [eventHistory]);

  // Top movers
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
      id: string;
      ticker: string;
      name: string;
      price: number;
      previousPrice: number;
      change: number;
    }[];

    const sorted = [...items].sort((a, b) => b.change - a.change);
    return {
      gainers: sorted.slice(0, 3),
      losers: sorted.slice(-3).reverse(),
    };
  }, [market.assets]);

  // Styles
  const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  };

  const statsGridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '12px',
  };

  const statCardStyle: CSSProperties = {
    backgroundColor: PALETTE.bgLight,
    border: `2px solid ${PALETTE.panelLight}`,
    padding: '12px',
    textAlign: 'center',
  };

  const statLabelStyle: CSSProperties = {
    fontFamily: "'Press Start 2P', cursive",
    fontSize: '7px',
    color: PALETTE.textDim,
    marginBottom: '8px',
  };

  const statValueStyle: CSSProperties = {
    fontFamily: "'VT323', monospace",
    fontSize: '24px',
    color: PALETTE.text,
  };

  const vtFont: CSSProperties = {
    fontFamily: "'VT323', monospace",
    fontSize: '20px',
    color: PALETTE.text,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Row 1: Company Overview + Monthly P&L */}
      <div style={gridStyle}>
        <PixelPanel title="Company Overview">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={vtFont}>
              <span style={{ color: PALETTE.textDim }}>Name: </span>
              <span style={{ color: PALETTE.gold }}>{company.name}</span>
            </div>
            <div>
              <span style={{ ...vtFont, fontSize: '32px', color: PALETTE.green }}>
                {formatCurrency(company.cash)}
              </span>
              <span style={{ ...vtFont, fontSize: '14px', color: PALETTE.textDim, marginLeft: '8px' }}>
                CASH
              </span>
            </div>
            <div style={vtFont}>
              <span style={{ color: PALETTE.textDim }}>Net Worth: </span>
              <span style={{ color: PALETTE.cyan }}>{formatCurrency(netWorth)}</span>
            </div>
            <StatBar
              value={company.reputation}
              maxValue={100}
              color={PALETTE.gold}
              label="Reputation"
            />
            <div style={vtFont}>
              <span style={{ color: PALETTE.textDim }}>Office Level: </span>
              <span style={{ color: PALETTE.blue }}>{company.officeLevel}</span>
            </div>
          </div>
        </PixelPanel>

        <PixelPanel title="Monthly P&L">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {latestReport ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', ...vtFont }}>
                  <span>
                    <span style={{ color: PALETTE.textDim }}>Revenue: </span>
                    <span style={{ color: PALETTE.green }}>{formatCurrency(latestReport.revenue)}</span>
                  </span>
                  <span>
                    <span style={{ color: PALETTE.textDim }}>Expenses: </span>
                    <span style={{ color: PALETTE.red }}>{formatCurrency(latestReport.expenses)}</span>
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ ...vtFont, color: PALETTE.textDim }}>Profit: </span>
                    <span style={{
                      ...vtFont,
                      fontSize: '28px',
                      color: latestReport.profit >= 0 ? PALETTE.green : PALETTE.red,
                    }}>
                      {formatCurrency(latestReport.profit)}
                    </span>
                  </div>
                  {profitHistory.length >= 2 && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '6px', color: PALETTE.textDim, marginBottom: '4px' }}>
                        6-MO TREND
                      </span>
                      <SparkLine data={profitHistory} width={100} height={30} />
                    </div>
                  )}
                </div>
                {/* Revenue vs Expenses bar */}
                <div style={{ display: 'flex', gap: '4px', height: '20px' }}>
                  {latestReport.revenue > 0 && (
                    <div style={{
                      flex: latestReport.revenue,
                      backgroundColor: PALETTE.green,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: "'VT323', monospace",
                      fontSize: '12px',
                      color: PALETTE.black,
                    }}>
                      Rev
                    </div>
                  )}
                  {latestReport.expenses > 0 && (
                    <div style={{
                      flex: latestReport.expenses,
                      backgroundColor: PALETTE.red,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: "'VT323', monospace",
                      fontSize: '12px',
                      color: PALETTE.white,
                    }}>
                      Exp
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ ...vtFont, color: PALETTE.textDim }}>
                No monthly data yet. Reports generate every 30 days.
              </div>
            )}
          </div>
        </PixelPanel>
      </div>

      {/* Row 2: Quick Stats Grid */}
      <PixelPanel title="Quick Stats">
        <div style={statsGridStyle}>
          <div style={statCardStyle}>
            <div style={statLabelStyle}>EMPLOYEES</div>
            <div style={statValueStyle}>{totalEmployees}</div>
          </div>
          <div style={statCardStyle}>
            <div style={statLabelStyle}>ACTIVE STREAMS</div>
            <div style={statValueStyle}>{activeStreams}</div>
          </div>
          <div style={statCardStyle}>
            <div style={statLabelStyle}>PORTFOLIO VALUE</div>
            <div style={{ ...statValueStyle, color: PALETTE.cyan }}>
              {formatCurrency(portfolioValue)}
            </div>
          </div>
          <div style={statCardStyle}>
            <div style={statLabelStyle}>UNREALIZED P&L</div>
            <div style={{
              ...statValueStyle,
              color: unrealizedPnL >= 0 ? PALETTE.green : PALETTE.red,
            }}>
              {formatCurrency(unrealizedPnL)}
            </div>
          </div>
          <div style={statCardStyle}>
            <div style={statLabelStyle}>MARKET</div>
            <div style={{
              ...statValueStyle,
              color: market.globalRegime === 'bull'
                ? PALETTE.green
                : market.globalRegime === 'bear'
                  ? PALETTE.red
                  : PALETTE.gold,
            }}>
              {market.globalRegime === 'bull' ? '\u25B2 Bull' : market.globalRegime === 'bear' ? '\u25BC Bear' : '\u25C6 Sideways'}
            </div>
          </div>
          <div style={statCardStyle}>
            <div style={statLabelStyle}>DAYS PLAYED</div>
            <div style={statValueStyle}>{time.day}</div>
          </div>
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
                  <div
                    key={evt.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '4px 8px',
                      backgroundColor: PALETTE.bgLight,
                      border: `1px solid ${PALETTE.panelLight}`,
                    }}
                  >
                    <span style={{
                      fontFamily: "'Press Start 2P', cursive",
                      fontSize: '6px',
                      color: sevColor,
                      border: `1px solid ${sevColor}`,
                      padding: '2px 4px',
                      textTransform: 'uppercase',
                      flexShrink: 0,
                    }}>
                      {severity}
                    </span>
                    <span style={{ ...vtFont, fontSize: '16px', flex: 1 }}>
                      {tmpl?.name ?? evt.templateId}
                    </span>
                    <span style={{ ...vtFont, fontSize: '14px', color: PALETTE.textDim, flexShrink: 0 }}>
                      Day {evt.triggeredOnDay}
                    </span>
                  </div>
                );
              })
            ) : (
              <div style={{ ...vtFont, color: PALETTE.textDim }}>No events yet.</div>
            )}
          </div>
        </PixelPanel>

        <PixelPanel title="Top Movers">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{
                fontFamily: "'Press Start 2P', cursive",
                fontSize: '7px',
                color: PALETTE.green,
                marginBottom: '6px',
              }}>
                TOP GAINERS
              </div>
              {movers.gainers.map((m) => (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '4px 0',
                    borderBottom: `1px solid ${PALETTE.panelLight}`,
                    ...vtFont,
                    fontSize: '18px',
                  }}
                >
                  <span style={{ color: PALETTE.gold, minWidth: '60px' }}>{m.ticker}</span>
                  <span>{formatCurrency(m.price)}</span>
                  <PriceChange current={m.price} previous={m.previousPrice} format="percent" />
                </div>
              ))}
            </div>
            <div>
              <div style={{
                fontFamily: "'Press Start 2P', cursive",
                fontSize: '7px',
                color: PALETTE.red,
                marginBottom: '6px',
              }}>
                TOP LOSERS
              </div>
              {movers.losers.map((m) => (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '4px 0',
                    borderBottom: `1px solid ${PALETTE.panelLight}`,
                    ...vtFont,
                    fontSize: '18px',
                  }}
                >
                  <span style={{ color: PALETTE.gold, minWidth: '60px' }}>{m.ticker}</span>
                  <span>{formatCurrency(m.price)}</span>
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
