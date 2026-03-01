import { useState, useMemo, useCallback } from 'react';
import type { CSSProperties } from 'react';
import type { AssetClass } from '../../types/index.ts';
import { useGameStore } from '../../store/gameStore.ts';
import { PALETTE } from '../../styles/palette.ts';
import { ASSET_DEFINITIONS } from '../../data/assets.ts';
import { formatCurrency, formatPercent } from '../../utils/format.ts';
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
        case 'price':
          cmp = a.state.price - b.state.price;
          break;
        case 'change':
          cmp = a.change - b.change;
          break;
        case 'volatility':
          cmp = a.state.volatility - b.state.volatility;
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [assets, classFilter, sortField, sortDir]);

  const selectedDef = selectedAssetId
    ? ASSET_DEFINITIONS.find((d) => d.id === selectedAssetId)
    : null;
  const selectedState = selectedAssetId ? assets[selectedAssetId] : null;

  const vtFont: CSSProperties = {
    fontFamily: "'VT323', monospace",
    fontSize: '20px',
    color: PALETTE.text,
  };

  const tabStyle = (active: boolean): CSSProperties => ({
    fontFamily: "'Press Start 2P', cursive",
    fontSize: '7px',
    padding: '6px 10px',
    border: `2px solid ${active ? PALETTE.gold : PALETTE.panelLight}`,
    backgroundColor: active ? PALETTE.gold : 'transparent',
    color: active ? PALETTE.black : PALETTE.textDim,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  });

  const thStyle: CSSProperties = {
    padding: '8px 12px',
    textAlign: 'left',
    borderBottom: `3px solid ${PALETTE.gold}`,
    fontFamily: "'Press Start 2P', cursive",
    fontSize: '7px',
    color: PALETTE.gold,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
  };

  const tdStyle: CSSProperties = {
    padding: '6px 12px',
    borderBottom: `1px solid ${PALETTE.panelLight}`,
    whiteSpace: 'nowrap',
    ...vtFont,
    fontSize: '18px',
  };

  const sortArrow = (field: SortField) => {
    if (sortField !== field) return '';
    return sortDir === 'asc' ? ' \u25B2' : ' \u25BC';
  };

  const qty = parseInt(tradeQty, 10) || 0;
  const selectedPrice = selectedState?.price ?? 0;
  const commission = selectedPrice * qty * 0.005;
  const totalBuyCost = selectedPrice * qty + commission;
  const canBuy = qty > 0 && totalBuyCost <= cash;
  const currentPosition = selectedAssetId ? positions[selectedAssetId] : undefined;
  const canSell = qty > 0 && currentPosition !== undefined && currentPosition.quantity >= qty;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
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

      {/* Asset Table */}
      <PixelPanel title="Assets">
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            ...vtFont,
          }}>
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
                        ? PALETTE.panelLight
                        : idx % 2 === 0 ? PALETTE.panel : PALETTE.bgLight,
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                    }}
                    onClick={() => setSelectedAsset(isSelected ? null : asset.def.id)}
                  >
                    <td style={{ ...tdStyle, color: PALETTE.gold }}>{asset.def.ticker}</td>
                    <td style={tdStyle}>{asset.def.name}</td>
                    <td style={{ ...tdStyle, color: PALETTE.textDim, fontSize: '14px' }}>
                      {asset.def.class.replace('_', ' ')}
                    </td>
                    <td style={tdStyle}>{formatCurrency(asset.state.price)}</td>
                    <td style={tdStyle}>
                      <PriceChange
                        current={asset.state.price}
                        previous={asset.state.previousPrice}
                        format="percent"
                      />
                    </td>
                    <td style={tdStyle}>
                      {last30.length >= 2 && <SparkLine data={last30} width={80} height={20} />}
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        color: asset.state.volatility > 0.5
                          ? PALETTE.red
                          : asset.state.volatility > 0.25
                            ? PALETTE.gold
                            : PALETTE.green,
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

      {/* Selected Asset Detail */}
      {selectedDef && selectedState && (
        <PixelPanel title={`${selectedDef.ticker} - ${selectedDef.name}`}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Left: Chart + Price */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                <span style={{ ...vtFont, fontSize: '32px' }}>
                  {formatCurrency(selectedState.price)}
                </span>
                <PriceChange
                  current={selectedState.price}
                  previous={selectedState.previousPrice}
                  format="percent"
                />
              </div>
              <PriceChart
                data={selectedState.priceHistory.slice(-90)}
                width={380}
                height={200}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', ...vtFont, fontSize: '16px' }}>
                <div>
                  <span style={{ color: PALETTE.textDim }}>Annual Return: </span>
                  <span>{formatPercent(selectedDef.annualDrift)}</span>
                </div>
                <div>
                  <span style={{ color: PALETTE.textDim }}>Volatility: </span>
                  <span>{formatPercent(selectedState.volatility)}</span>
                </div>
                <div>
                  <span style={{ color: PALETTE.textDim }}>Regime: </span>
                  <span style={{
                    color: selectedState.regime === 'bull'
                      ? PALETTE.green
                      : selectedState.regime === 'bear'
                        ? PALETTE.red
                        : PALETTE.gold,
                  }}>
                    {selectedState.regime.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span style={{ color: PALETTE.textDim }}>Class: </span>
                  <span>{selectedDef.class.replace('_', ' ')}</span>
                </div>
              </div>
              <div style={{ ...vtFont, fontSize: '16px', color: PALETTE.textDim }}>
                {selectedDef.description}
              </div>
            </div>

            {/* Right: Trade Panel */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              backgroundColor: PALETTE.bgLight,
              border: `2px solid ${PALETTE.panelLight}`,
              padding: '16px',
            }}>
              <div style={{
                fontFamily: "'Press Start 2P', cursive",
                fontSize: '9px',
                color: PALETTE.gold,
                marginBottom: '4px',
              }}>
                QUICK TRADE
              </div>
              <div style={{ ...vtFont, fontSize: '16px' }}>
                <span style={{ color: PALETTE.textDim }}>Your Position: </span>
                <span>{currentPosition ? `${currentPosition.quantity} shares @ ${formatCurrency(currentPosition.averageCost)}` : 'None'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ ...vtFont, fontSize: '16px', color: PALETTE.textDim }}>Qty:</label>
                <input
                  type="number"
                  min="1"
                  value={tradeQty}
                  onChange={(e) => setTradeQty(e.target.value)}
                  style={{
                    width: '80px',
                    padding: '4px 8px',
                    backgroundColor: PALETTE.bg,
                    color: PALETTE.text,
                    border: `2px solid ${PALETTE.panelLight}`,
                    fontFamily: "'VT323', monospace",
                    fontSize: '18px',
                  }}
                />
                {currentPosition && (
                  <button
                    type="button"
                    style={{
                      ...vtFont,
                      fontSize: '14px',
                      color: PALETTE.cyan,
                      background: 'none',
                      border: `1px solid ${PALETTE.cyan}`,
                      padding: '2px 6px',
                      cursor: 'pointer',
                    }}
                    onClick={() => setTradeQty(String(currentPosition.quantity))}
                  >
                    Max
                  </button>
                )}
              </div>
              <div style={{ ...vtFont, fontSize: '14px', color: PALETTE.textDim }}>
                <div>Price: {formatCurrency(selectedPrice)}</div>
                <div>Commission: {formatCurrency(commission)}</div>
                <div>Total Cost (Buy): {formatCurrency(totalBuyCost)}</div>
                <div>Cash Available: {formatCurrency(cash)}</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <PixelButton
                  variant={canBuy ? 'success' : 'disabled'}
                  onClick={() => {
                    if (canBuy) {
                      executeBuy(selectedAssetId!, qty);
                      setTradeQty('1');
                    }
                  }}
                  style={{ flex: 1 }}
                >
                  BUY
                </PixelButton>
                <PixelButton
                  variant={canSell ? 'error' : 'disabled'}
                  onClick={() => {
                    if (canSell) {
                      executeSell(selectedAssetId!, qty);
                      setTradeQty('1');
                    }
                  }}
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
  );
}
