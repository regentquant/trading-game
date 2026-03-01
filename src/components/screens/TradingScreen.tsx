import { useState, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { useGameStore } from '../../store/gameStore.ts';
import { PALETTE, FONT } from '../../styles/palette.ts';
import { ASSET_DEFINITIONS } from '../../data/assets.ts';
import { formatCurrency, formatPercent, formatGameDate } from '../../utils/format.ts';
import {
  getPositionSummaries,
  calculatePortfolioValue,
  calculateUnrealizedPnL,
} from '../../engine/revenue/portfolioManager.ts';
import { CONFIG } from '../../data/config.ts';
import { PixelPanel } from '../ui/PixelPanel.tsx';
import { PixelButton } from '../ui/PixelButton.tsx';

export function TradingScreen() {
  const portfolio = useGameStore((s) => s.portfolio);
  const assets = useGameStore((s) => s.market.assets);
  const cash = useGameStore((s) => s.company.cash);
  const statistics = useGameStore((s) => s.statistics);
  const executeBuy = useGameStore((s) => s.executeBuy);
  const executeSell = useGameStore((s) => s.executeSell);

  const [tradeAssetId, setTradeAssetId] = useState<string>(ASSET_DEFINITIONS[0]?.id ?? '');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [tradeQty, setTradeQty] = useState<string>('1');

  const summaries = useMemo(() => getPositionSummaries(portfolio, assets), [portfolio, assets]);
  const totalValue = useMemo(() => calculatePortfolioValue(portfolio, assets), [portfolio, assets]);
  const totalUnrealized = useMemo(() => calculateUnrealizedPnL(portfolio, assets), [portfolio, assets]);
  const totalInvested = portfolio.totalInvested;
  const recentTrades = useMemo(() => portfolio.tradeHistory.slice(-50).reverse(), [portfolio.tradeHistory]);

  const selectedAssetState = assets[tradeAssetId];
  const tradePrice = selectedAssetState?.price ?? 0;
  const qty = parseInt(tradeQty, 10) || 0;
  const commission = tradePrice * qty * CONFIG.BROKERAGE_COMMISSION_RATE;
  const totalCost = tradeType === 'buy' ? tradePrice * qty + commission : tradePrice * qty - commission;
  const currentPosition = portfolio.positions[tradeAssetId];
  const canExecute = tradeType === 'buy'
    ? qty > 0 && totalCost <= cash
    : qty > 0 && currentPosition !== undefined && currentPosition.quantity >= qty;

  const bestTrade = statistics.totalProfitEarned;
  const worstTrade = statistics.totalLossIncurred;

  const label: CSSProperties = { fontFamily: FONT.ui, fontSize: '12px', color: PALETTE.textSecondary };
  const val: CSSProperties = { fontFamily: FONT.mono, fontSize: '13px', color: PALETTE.text };

  const thStyle: CSSProperties = {
    padding: '8px 12px', textAlign: 'left',
    borderBottom: `1px solid ${PALETTE.panelBorder}`,
    fontFamily: FONT.ui, fontSize: '11px', fontWeight: 600,
    color: PALETTE.textSecondary, textTransform: 'uppercase',
    letterSpacing: '0.04em', whiteSpace: 'nowrap',
  };

  const tdStyle: CSSProperties = {
    padding: '8px 12px', borderBottom: `1px solid ${PALETTE.panelBorder}`,
    whiteSpace: 'nowrap', fontFamily: FONT.mono, fontSize: '13px', color: PALETTE.text,
  };

  const getAssetTicker = (id: string) => ASSET_DEFINITIONS.find((d) => d.id === id)?.ticker ?? id;

  const inputStyle: CSSProperties = {
    padding: '8px 10px', backgroundColor: PALETTE.bg, color: PALETTE.text,
    border: `1px solid ${PALETTE.panelBorder}`, borderRadius: '6px',
    fontFamily: FONT.mono, fontSize: '13px',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
        <PixelPanel title="Portfolio Positions">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Asset</th>
                  <th style={thStyle}>Qty</th>
                  <th style={thStyle}>Avg Cost</th>
                  <th style={thStyle}>Price</th>
                  <th style={thStyle}>P&L</th>
                  <th style={thStyle}>P&L %</th>
                  <th style={thStyle}>Alloc %</th>
                </tr>
              </thead>
              <tbody>
                {summaries.length > 0 ? (
                  <>
                    {summaries.map((s) => {
                      const allocation = totalValue > 0 ? (s.currentPrice * s.quantity / totalValue) * 100 : 0;
                      return (
                        <tr key={s.assetId} style={{ transition: 'background-color 0.1s ease' }}>
                          <td style={{ ...tdStyle, color: PALETTE.accent, fontWeight: 600 }}>{getAssetTicker(s.assetId)}</td>
                          <td style={tdStyle}>{s.quantity}</td>
                          <td style={tdStyle}>{formatCurrency(s.avgCost)}</td>
                          <td style={tdStyle}>{formatCurrency(s.currentPrice)}</td>
                          <td style={{ ...tdStyle, color: s.pnl >= 0 ? PALETTE.green : PALETTE.red }}>{formatCurrency(s.pnl)}</td>
                          <td style={{ ...tdStyle, color: s.pnlPercent >= 0 ? PALETTE.green : PALETTE.red }}>{formatPercent(s.pnlPercent)}</td>
                          <td style={tdStyle}>{allocation.toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                    <tr style={{ backgroundColor: PALETTE.bgLight }}>
                      <td style={{ ...tdStyle, fontWeight: 600, color: PALETTE.accent }}>TOTAL</td>
                      <td style={tdStyle}>-</td>
                      <td style={tdStyle}>{formatCurrency(totalInvested)}</td>
                      <td style={tdStyle}>{formatCurrency(totalValue)}</td>
                      <td style={{ ...tdStyle, color: totalUnrealized >= 0 ? PALETTE.green : PALETTE.red, fontWeight: 600 }}>{formatCurrency(totalUnrealized)}</td>
                      <td style={tdStyle}>-</td>
                      <td style={tdStyle}>100%</td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td colSpan={7} style={{ ...tdStyle, color: PALETTE.textDim, textAlign: 'center' }}>
                      No positions. Buy assets to start trading!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </PixelPanel>

        {/* Trade Execution */}
        <PixelPanel title="Execute Trade">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={label}>Asset:</label>
              <select
                value={tradeAssetId}
                onChange={(e) => setTradeAssetId(e.target.value)}
                style={{ ...inputStyle, width: '100%', marginTop: '4px' }}
              >
                {ASSET_DEFINITIONS.map((def) => (
                  <option key={def.id} value={def.id}>{def.ticker} - {def.name}</option>
                ))}
              </select>
            </div>

            {/* Buy/Sell Toggle */}
            <div style={{ display: 'flex', gap: '2px', backgroundColor: PALETTE.bgLight, borderRadius: '6px', padding: '2px' }}>
              <button
                type="button"
                onClick={() => setTradeType('buy')}
                style={{
                  flex: 1, padding: '8px', borderRadius: '4px', border: 'none',
                  backgroundColor: tradeType === 'buy' ? PALETTE.green : 'transparent',
                  color: tradeType === 'buy' ? PALETTE.black : PALETTE.textSecondary,
                  fontFamily: FONT.ui, fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                BUY
              </button>
              <button
                type="button"
                onClick={() => setTradeType('sell')}
                style={{
                  flex: 1, padding: '8px', borderRadius: '4px', border: 'none',
                  backgroundColor: tradeType === 'sell' ? PALETTE.red : 'transparent',
                  color: tradeType === 'sell' ? PALETTE.white : PALETTE.textSecondary,
                  fontFamily: FONT.ui, fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                SELL
              </button>
            </div>

            <div>
              <label style={label}>Quantity:</label>
              <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                <input
                  type="number" min="1" value={tradeQty}
                  onChange={(e) => setTradeQty(e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
                {tradeType === 'sell' && currentPosition && (
                  <button
                    type="button"
                    style={{
                      padding: '6px 10px', backgroundColor: 'transparent',
                      color: PALETTE.cyan, border: `1px solid ${PALETTE.cyan}`,
                      borderRadius: '4px', fontFamily: FONT.ui, fontSize: '11px',
                      fontWeight: 500, cursor: 'pointer',
                    }}
                    onClick={() => setTradeQty(String(currentPosition.quantity))}
                  >
                    Max
                  </button>
                )}
              </div>
            </div>

            {/* Preview */}
            <div style={{
              backgroundColor: PALETTE.bg, border: `1px solid ${PALETTE.panelBorder}`,
              borderRadius: '6px', padding: '10px', ...label, fontSize: '12px',
            }}>
              <div>Price: <span style={{ color: PALETTE.text }}>{formatCurrency(tradePrice)}</span></div>
              <div>Commission: <span style={{ color: PALETTE.text }}>{formatCurrency(commission)}</span></div>
              <div style={{ borderTop: `1px solid ${PALETTE.panelBorder}`, paddingTop: '6px', marginTop: '6px' }}>
                {tradeType === 'buy' ? 'Total Cost' : 'Total Revenue'}:{' '}
                <span style={{ color: PALETTE.gold, fontWeight: 600 }}>{formatCurrency(totalCost)}</span>
              </div>
              {currentPosition && <div style={{ marginTop: '4px' }}>Held: <span style={{ color: PALETTE.text }}>{currentPosition.quantity} shares</span></div>}
            </div>

            <PixelButton
              variant={canExecute ? (tradeType === 'buy' ? 'success' : 'error') : 'disabled'}
              onClick={() => {
                if (!canExecute) return;
                if (tradeType === 'buy') executeBuy(tradeAssetId, qty);
                else executeSell(tradeAssetId, qty);
                setTradeQty('1');
              }}
            >
              {tradeType === 'buy' ? 'EXECUTE BUY' : 'EXECUTE SELL'}
            </PixelButton>
          </div>
        </PixelPanel>
      </div>

      {/* Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
        <PixelPanel title="Trade History">
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Asset</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Qty</th>
                  <th style={thStyle}>Price</th>
                  <th style={thStyle}>Total</th>
                </tr>
              </thead>
              <tbody>
                {recentTrades.length > 0 ? (
                  recentTrades.map((trade, idx) => (
                    <tr key={trade.id} style={{ backgroundColor: idx % 2 === 0 ? 'transparent' : `${PALETTE.bgLight}80` }}>
                      <td style={{ ...tdStyle, fontSize: '12px', color: PALETTE.textSecondary }}>{formatGameDate(trade.executedOnDay)}</td>
                      <td style={{ ...tdStyle, color: PALETTE.accent, fontWeight: 500 }}>{getAssetTicker(trade.assetId)}</td>
                      <td style={{ ...tdStyle, color: trade.type === 'buy' ? PALETTE.green : PALETTE.red }}>{trade.type.toUpperCase()}</td>
                      <td style={tdStyle}>{trade.quantity}</td>
                      <td style={tdStyle}>{formatCurrency(trade.price)}</td>
                      <td style={tdStyle}>{formatCurrency(trade.quantity * trade.price)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ ...tdStyle, color: PALETTE.textDim, textAlign: 'center' }}>No trades yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </PixelPanel>

        <PixelPanel title="P&L Summary">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              backgroundColor: PALETTE.bgLight, border: `1px solid ${PALETTE.panelBorder}`,
              borderRadius: '8px', padding: '14px',
            }}>
              {[
                { label: 'Realized P&L', value: formatCurrency(portfolio.totalRealized), color: portfolio.totalRealized >= 0 ? PALETTE.green : PALETTE.red },
                { label: 'Unrealized P&L', value: formatCurrency(totalUnrealized), color: totalUnrealized >= 0 ? PALETTE.green : PALETTE.red },
              ].map((item) => (
                <div key={item.label} style={{ marginBottom: '10px' }}>
                  <span style={label}>{item.label}: </span>
                  <span style={{ fontFamily: FONT.mono, fontSize: '18px', fontWeight: 600, color: item.color }}>{item.value}</span>
                </div>
              ))}
              <div style={{ borderTop: `1px solid ${PALETTE.panelBorder}`, paddingTop: '10px', marginTop: '4px' }}>
                <span style={label}>Total P&L: </span>
                <span style={{
                  fontFamily: FONT.mono, fontSize: '20px', fontWeight: 700,
                  color: (portfolio.totalRealized + totalUnrealized) >= 0 ? PALETTE.green : PALETTE.red,
                }}>
                  {formatCurrency(portfolio.totalRealized + totalUnrealized)}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[
                { l: 'Total Trades', v: String(statistics.totalTradesMade) },
                { l: 'Largest Trade', v: formatCurrency(statistics.largestSingleTrade) },
                { l: 'Total Profit', v: formatCurrency(bestTrade), c: PALETTE.green },
                { l: 'Total Loss', v: formatCurrency(worstTrade), c: PALETTE.red },
              ].map((item) => (
                <div key={item.l} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={label}>{item.l}:</span>
                  <span style={{ ...val, color: item.c ?? PALETTE.text }}>{item.v}</span>
                </div>
              ))}
            </div>
          </div>
        </PixelPanel>
      </div>
    </div>
  );
}
