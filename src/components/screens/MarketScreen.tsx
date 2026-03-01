import { useState, useMemo, useCallback } from 'react';
import type { CSSProperties } from 'react';
import type { AssetClass } from '../../types/index.ts';
import { useGameStore } from '../../store/gameStore.ts';
import { PALETTE, FONT } from '../../styles/palette.ts';
import { ASSET_DEFINITIONS } from '../../data/assets.ts';
import { formatCurrency, formatPercent } from '../../utils/format.ts';
import { CONFIG } from '../../data/config.ts';
import { PixelPanel } from '../ui/PixelPanel.tsx';
import { PixelButton } from '../ui/PixelButton.tsx';
import { PriceChange } from '../ui/PriceChange.tsx';
import { SparkLine } from '../charts/SparkLine.tsx';
import { PriceChart } from '../charts/PriceChart.tsx';

type SortField = 'price' | 'change' | 'volatility';
type SortDir = 'asc' | 'desc';

const ASSET_CLASS_TABS: { label: string; value: AssetClass | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Large Cap', value: 'large_cap' },
  { label: 'Small Cap', value: 'small_cap' },
  { label: 'Crypto', value: 'crypto' },
  { label: 'Commodity', value: 'commodity' },
  { label: 'Real Estate', value: 'real_estate' },
  { label: 'Bond', value: 'bond' },
];

export function MarketScreen() {
  const assets = useGameStore((s) => s.market.assets);
  const selectedAssetId = useGameStore((s) => s.ui.selectedAssetId);
  const setSelectedAsset = useGameStore((s) => s.setSelectedAsset);
  const executeBuy = useGameStore((s) => s.executeBuy);
  const executeSell = useGameStore((s) => s.executeSell);
  const cash = useGameStore((s) => s.company.cash);
  const positions = useGameStore((s) => s.portfolio.positions);

  const [classFilter, setClassFilter] = useState<AssetClass | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('price');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [tradeQty, setTradeQty] = useState<string>('1');

  const handleSort = useCallback((field: SortField) => {
    if (field === sortField) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  }, [sortField]);

  const filteredAssets = useMemo(() => {
    let list = ASSET_DEFINITIONS.map((def) => {
      const state = assets[def.id];
      if (!state) return null;
      const change = state.previousPrice > 0
        ? (state.price - state.previousPrice) / state.previousPrice
        : 0;
      return { def, state, change };
    }).filter(Boolean) as {
      def: (typeof ASSET_DEFINITIONS)[0];
      state: (typeof assets)[string];
      change: number;
    }[];

    if (classFilter !== 'all') {
      list = list.filter((a) => a.def.class === classFilter);
    }

    list.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'price': cmp = a.state.price - b.state.price; break;
        case 'change': cmp = a.change - b.change; break;
        case 'volatility': cmp = a.state.volatility - b.state.volatility; break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [assets, classFilter, sortField, sortDir]);

  const selectedDef = selectedAssetId ? ASSET_DEFINITIONS.find((d) => d.id === selectedAssetId) : null;
  const selectedState = selectedAssetId ? assets[selectedAssetId] : null;

  const tabStyle = (active: boolean): CSSProperties => ({
    fontFamily: FONT.ui,
    fontSize: '12px',
    fontWeight: active ? 600 : 400,
    padding: '6px 14px',
    border: `1px solid ${active ? PALETTE.accent : PALETTE.panelBorder}`,
    borderRadius: '6px',
    backgroundColor: active ? `${PALETTE.accent}18` : 'transparent',
    color: active ? PALETTE.accent : PALETTE.textSecondary,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  });

  const thStyle: CSSProperties = {
    padding: '8px 12px',
    textAlign: 'left',
    borderBottom: `1px solid ${PALETTE.panelBorder}`,
    fontFamily: FONT.ui,
    fontSize: '11px',
    fontWeight: 600,
    color: PALETTE.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
  };

  const tdStyle: CSSProperties = {
    padding: '8px 12px',
    borderBottom: `1px solid ${PALETTE.panelBorder}`,
    whiteSpace: 'nowrap',
    fontFamily: FONT.mono,
    fontSize: '13px',
    color: PALETTE.text,
  };

  const sortArrow = (field: SortField) => {
    if (sortField !== field) return '';
    return sortDir === 'asc' ? ' \u25B2' : ' \u25BC';
  };

  const qty = parseInt(tradeQty, 10) || 0;
  const selectedPrice = selectedState?.price ?? 0;
  const commission = selectedPrice * qty * CONFIG.BROKERAGE_COMMISSION_RATE;
  const totalBuyCost = selectedPrice * qty + commission;
  const canBuy = qty > 0 && totalBuyCost <= cash;
  const currentPosition = selectedAssetId ? positions[selectedAssetId] : undefined;
  const canSell = qty > 0 && currentPosition !== undefined && currentPosition.quantity >= qty;

  const label: CSSProperties = { fontFamily: FONT.ui, fontSize: '12px', color: PALETTE.textSecondary };
  const val: CSSProperties = { fontFamily: FONT.mono, fontSize: '13px', color: PALETTE.text };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {ASSET_CLASS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            style={tabStyle(classFilter === tab.value)}
            onClick={() => setClassFilter(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content: Table (left) + Detail Panel (right) */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        {/* Asset Table */}
        <PixelPanel title="Assets" style={{ flex: 1, minWidth: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Ticker</th>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Class</th>
                  <th style={{ ...thStyle, cursor: 'pointer' }} onClick={() => handleSort('price')}>
                    Price{sortArrow('price')}
                  </th>
                  <th style={{ ...thStyle, cursor: 'pointer' }} onClick={() => handleSort('change')}>
                    Change{sortArrow('change')}
                  </th>
                  <th style={thStyle}>30D Chart</th>
                  <th style={{ ...thStyle, cursor: 'pointer' }} onClick={() => handleSort('volatility')}>
                    Volatility{sortArrow('volatility')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map((asset, idx) => {
                  const isSelected = selectedAssetId === asset.def.id;
                  const last30 = asset.state.priceHistory.slice(-30);
                  return (
                    <tr
                      key={asset.def.id}
                      style={{
                        backgroundColor: isSelected
                          ? `${PALETTE.accent}12`
                          : idx % 2 === 0 ? 'transparent' : `${PALETTE.bgLight}80`,
                        cursor: 'pointer',
                        transition: 'background-color 0.1s ease',
                      }}
                      onClick={() => setSelectedAsset(isSelected ? null : asset.def.id)}
                    >
                      <td style={{ ...tdStyle, color: PALETTE.accent, fontWeight: 600 }}>{asset.def.ticker}</td>
                      <td style={tdStyle}>{asset.def.name}</td>
                      <td style={{ ...tdStyle, color: PALETTE.textSecondary, fontSize: '12px' }}>
                        {asset.def.class.replace('_', ' ')}
                      </td>
                      <td style={tdStyle}>{formatCurrency(asset.state.price)}</td>
                      <td style={tdStyle}>
                        <PriceChange current={asset.state.price} previous={asset.state.previousPrice} format="percent" />
                      </td>
                      <td style={tdStyle}>
                        {last30.length >= 2 && <SparkLine data={last30} width={80} height={20} />}
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          color: asset.state.volatility > 0.5 ? PALETTE.red
                            : asset.state.volatility > 0.25 ? PALETTE.gold : PALETTE.green,
                        }}>
                          {formatPercent(asset.state.volatility)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </PixelPanel>

        {/* Selected Asset Detail - Right Side Panel */}
        {selectedDef && selectedState && (
          <PixelPanel title={`${selectedDef.ticker} - ${selectedDef.name}`} style={{ width: '380px', flexShrink: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Price + Change */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                <span style={{ fontFamily: FONT.mono, fontSize: '24px', fontWeight: 700, color: PALETTE.text }}>
                  {formatCurrency(selectedState.price)}
                </span>
                <PriceChange current={selectedState.price} previous={selectedState.previousPrice} format="percent" />
              </div>

              {/* Chart */}
              <PriceChart data={selectedState.priceHistory.slice(-90)} width={340} height={160} />

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <div><span style={label}>Return: </span><span style={val}>{formatPercent(selectedDef.annualDrift)}</span></div>
                <div><span style={label}>Vol: </span><span style={val}>{formatPercent(selectedState.volatility)}</span></div>
                <div>
                  <span style={label}>Regime: </span>
                  <span style={{
                    ...val,
                    color: selectedState.regime === 'bull' ? PALETTE.green
                      : selectedState.regime === 'bear' ? PALETTE.red : PALETTE.gold,
                  }}>
                    {selectedState.regime.toUpperCase()}
                  </span>
                </div>
                <div><span style={label}>Class: </span><span style={val}>{selectedDef.class.replace('_', ' ')}</span></div>
              </div>

              <div style={{ ...label, fontSize: '12px', lineHeight: 1.4 }}>{selectedDef.description}</div>

              {/* Trade Panel */}
              <div style={{
                display: 'flex', flexDirection: 'column', gap: '10px',
                backgroundColor: PALETTE.bgLight, border: `1px solid ${PALETTE.panelBorder}`,
                borderRadius: '8px', padding: '14px',
              }}>
                <div style={{ fontFamily: FONT.ui, fontSize: '11px', fontWeight: 600, color: PALETTE.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Quick Trade
                </div>
                <div style={{ ...label, fontSize: '13px' }}>
                  <span>Position: </span>
                  <span style={{ color: PALETTE.text }}>
                    {currentPosition ? `${currentPosition.quantity} @ ${formatCurrency(currentPosition.averageCost)}` : 'None'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={label}>Qty:</span>
                  <input
                    type="number"
                    min="1"
                    value={tradeQty}
                    onChange={(e) => setTradeQty(e.target.value)}
                    style={{
                      width: '80px', padding: '6px 8px',
                      backgroundColor: PALETTE.bg, color: PALETTE.text,
                      border: `1px solid ${PALETTE.panelBorder}`, borderRadius: '4px',
                      fontFamily: FONT.mono, fontSize: '13px',
                    }}
                  />
                  {currentPosition && (
                    <button
                      type="button"
                      style={{
                        fontFamily: FONT.ui, fontSize: '11px', fontWeight: 500,
                        color: PALETTE.cyan, background: 'none',
                        border: `1px solid ${PALETTE.cyan}`, borderRadius: '4px',
                        padding: '4px 8px', cursor: 'pointer',
                      }}
                      onClick={() => setTradeQty(String(currentPosition.quantity))}
                    >
                      Max
                    </button>
                  )}
                </div>
                <div style={{
                  ...label, fontSize: '12px',
                  backgroundColor: PALETTE.bg, borderRadius: '6px',
                  padding: '10px', border: `1px solid ${PALETTE.panelBorder}`,
                }}>
                  <div>Price: <span style={{ color: PALETTE.text }}>{formatCurrency(selectedPrice)}</span></div>
                  <div>Commission: <span style={{ color: PALETTE.text }}>{formatCurrency(commission)}</span></div>
                  <div style={{ borderTop: `1px solid ${PALETTE.panelBorder}`, paddingTop: '6px', marginTop: '6px' }}>
                    Total: <span style={{ color: PALETTE.gold, fontWeight: 600 }}>{formatCurrency(totalBuyCost)}</span>
                  </div>
                  <div style={{ marginTop: '4px' }}>Cash: <span style={{ color: PALETTE.text }}>{formatCurrency(cash)}</span></div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <PixelButton
                    variant={canBuy ? 'success' : 'disabled'}
                    onClick={() => { if (canBuy) { executeBuy(selectedAssetId!, qty); setTradeQty('1'); } }}
                    style={{ flex: 1 }}
                  >
                    BUY
                  </PixelButton>
                  <PixelButton
                    variant={canSell ? 'error' : 'disabled'}
                    onClick={() => { if (canSell) { executeSell(selectedAssetId!, qty); setTradeQty('1'); } }}
                    style={{ flex: 1 }}
                  >
                    SELL
                  </PixelButton>
                </div>
              </div>
            </div>
          </PixelPanel>
        )}
      </div>
    </div>
  );
}
