import { useState, useMemo } from 'react';
import type { CSSProperties } from 'react';
import type { RevenueStreamId, ActiveRevenueStream } from '../../types/index.ts';
import { useGameStore } from '../../store/gameStore.ts';
import { PALETTE } from '../../styles/palette.ts';
import { REVENUE_STREAM_DEFINITIONS } from '../../data/revenue.ts';
import { formatCurrency } from '../../utils/format.ts';
import { PixelPanel } from '../ui/PixelPanel.tsx';
import { PixelButton } from '../ui/PixelButton.tsx';
import { StatBar } from '../ui/StatBar.tsx';

export function RevenueScreen() {
  const revenueStreams = useGameStore((s) => s.revenueStreams);
  const company = useGameStore((s) => s.company);
  const employees = useGameStore((s) => s.employees);
  const activateStream = useGameStore((s) => s.activateRevenueStream);
  const deactivateStream = useGameStore((s) => s.deactivateRevenueStream);

  const [selectedStreamId, setSelectedStreamId] = useState<RevenueStreamId | null>(null);

  const { activeStreams, lockedStreams } = useMemo(() => {
    const active: { def: (typeof REVENUE_STREAM_DEFINITIONS)[0]; state: ActiveRevenueStream }[] = [];
    const locked: { def: (typeof REVENUE_STREAM_DEFINITIONS)[0]; state: ActiveRevenueStream }[] = [];

    for (const def of REVENUE_STREAM_DEFINITIONS) {
      const state = revenueStreams[def.id];
      if (!state) continue;
      if (state.unlocked) {
        active.push({ def, state });
      } else {
        locked.push({ def, state });
      }
    }
    return { activeStreams: active, lockedStreams: locked };
  }, [revenueStreams]);

  const selectedDef = selectedStreamId
    ? REVENUE_STREAM_DEFINITIONS.find((d) => d.id === selectedStreamId)
    : null;
  const selectedState = selectedStreamId ? revenueStreams[selectedStreamId] : null;

  // Revenue breakdown for stacked bar
  const revenueBreakdown = useMemo(() => {
    const latestReport = company.financialHistory.length > 0
      ? company.financialHistory[company.financialHistory.length - 1]
      : null;
    if (!latestReport) return [];

    return Object.entries(latestReport.revenueByStream)
      .filter(([, v]) => v > 0)
      .map(([id, value]) => {
        const def = REVENUE_STREAM_DEFINITIONS.find((d) => d.id === id);
        return { id, name: def?.name ?? id, value };
      })
      .sort((a, b) => b.value - a.value);
  }, [company.financialHistory]);

  const totalRevenue = revenueBreakdown.reduce((sum, r) => sum + r.value, 0);

  const checkRequirement = (req: { type: string; target?: string; value: number }) => {
    switch (req.type) {
      case 'reputation':
        return company.reputation >= req.value;
      case 'cash':
        return company.cash >= req.value;
      case 'employee_count':
        return Object.keys(employees).length >= req.value;
      case 'day':
        return useGameStore.getState().time.day >= req.value;
      case 'revenue_stream':
        return req.target ? revenueStreams[req.target as RevenueStreamId]?.active === true : false;
      case 'employee_skill':
        return Object.values(employees).some((e) => {
          if (!req.target) return false;
          const statKey = req.target as keyof typeof e.stats;
          return statKey in e.stats && e.stats[statKey] >= req.value;
        });
      default:
        return false;
    }
  };

  const vtFont: CSSProperties = {
    fontFamily: "'VT323', monospace",
    fontSize: '20px',
    color: PALETTE.text,
  };

  const STREAM_COLORS = [
    PALETTE.green, PALETTE.blue, PALETTE.gold, PALETTE.cyan,
    PALETTE.purple, PALETTE.red, PALETTE.greenDark, PALETTE.blueDark,
    PALETTE.goldDark, PALETTE.redDark,
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Active Streams Grid */}
      <PixelPanel title="Active Revenue Streams">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '12px',
        }}>
          {activeStreams.map(({ def, state }) => (
            <div
              key={def.id}
              onClick={() => setSelectedStreamId(def.id === selectedStreamId ? null : def.id)}
              style={{
                backgroundColor: def.id === selectedStreamId ? PALETTE.panelLight : PALETTE.bgLight,
                border: `2px solid ${state.active ? PALETTE.green : PALETTE.panelLight}`,
                padding: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{
                fontFamily: "'Press Start 2P', cursive",
                fontSize: '8px',
                color: state.active ? PALETTE.gold : PALETTE.textDim,
                marginBottom: '8px',
              }}>
                {def.name}
              </div>
              <div style={vtFont}>
                <span style={{ color: PALETTE.textDim }}>Base Rev: </span>
                <span style={{ color: PALETTE.green }}>{formatCurrency(def.baseRevenue * state.level)}</span>
              </div>
              <div style={{ marginTop: '4px' }}>
                <StatBar
                  value={state.performance * 100}
                  maxValue={100}
                  color={PALETTE.cyan}
                  label="Perf"
                  showValue={false}
                />
              </div>
              <div style={{ ...vtFont, fontSize: '14px', color: PALETTE.textDim, marginTop: '4px' }}>
                Employees: {state.assignedEmployeeIds.length} | Lvl: {state.level}
              </div>
              <div style={{
                fontFamily: "'Press Start 2P', cursive",
                fontSize: '6px',
                marginTop: '6px',
                color: state.active ? PALETTE.green : PALETTE.red,
              }}>
                {state.active ? 'ACTIVE' : 'INACTIVE'}
              </div>
            </div>
          ))}
        </div>
      </PixelPanel>

      {/* Selected Stream Detail */}
      {selectedDef && selectedState && (
        <PixelPanel title={`${selectedDef.name} - Details`}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ ...vtFont, fontSize: '16px', color: PALETTE.textDim }}>
                {selectedDef.description}
              </div>
              <div style={vtFont}>
                <span style={{ color: PALETTE.textDim }}>Phase: </span>
                <span style={{
                  color: selectedDef.phase === 'early' ? PALETTE.green
                    : selectedDef.phase === 'mid' ? PALETTE.gold
                      : PALETTE.purple,
                }}>
                  {selectedDef.phase.toUpperCase()}
                </span>
              </div>
              <div style={vtFont}>
                <span style={{ color: PALETTE.textDim }}>Base Revenue: </span>
                <span style={{ color: PALETTE.green }}>{formatCurrency(selectedDef.baseRevenue)}</span>
              </div>
              <div style={vtFont}>
                <span style={{ color: PALETTE.textDim }}>Level: </span>
                <span style={{ color: PALETTE.gold }}>{selectedState.level}</span>
                <span style={{ color: PALETTE.textDim }}> (Revenue: {formatCurrency(selectedDef.baseRevenue * selectedState.level)})</span>
              </div>
              <div style={vtFont}>
                <span style={{ color: PALETTE.textDim }}>Risk Level: </span>
                <span style={{
                  color: selectedDef.riskLevel > 7 ? PALETTE.red
                    : selectedDef.riskLevel > 4 ? PALETTE.gold
                      : PALETTE.green,
                }}>
                  {selectedDef.riskLevel}/10
                </span>
              </div>
              {selectedState.clientCount !== undefined && (
                <div style={vtFont}>
                  <span style={{ color: PALETTE.textDim }}>Clients: </span>
                  <span>{selectedState.clientCount}</span>
                </div>
              )}
              {selectedState.aum !== undefined && (
                <div style={vtFont}>
                  <span style={{ color: PALETTE.textDim }}>AUM: </span>
                  <span style={{ color: PALETTE.cyan }}>{formatCurrency(selectedState.aum)}</span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Assigned Employees */}
              <div style={{
                fontFamily: "'Press Start 2P', cursive",
                fontSize: '7px',
                color: PALETTE.gold,
              }}>
                ASSIGNED EMPLOYEES
              </div>
              {selectedState.assignedEmployeeIds.length > 0 ? (
                selectedState.assignedEmployeeIds.map((empId) => {
                  const emp = employees[empId];
                  if (!emp) return null;
                  return (
                    <div key={empId} style={{
                      ...vtFont,
                      fontSize: '16px',
                      padding: '4px 8px',
                      backgroundColor: PALETTE.bg,
                      border: `1px solid ${PALETTE.panelLight}`,
                    }}>
                      {emp.name} - {emp.role.replace('_', ' ')}
                    </div>
                  );
                })
              ) : (
                <div style={{ ...vtFont, fontSize: '14px', color: PALETTE.textDim }}>
                  No employees assigned.
                </div>
              )}

              {/* Required Roles */}
              <div style={{
                fontFamily: "'Press Start 2P', cursive",
                fontSize: '7px',
                color: PALETTE.gold,
                marginTop: '8px',
              }}>
                REQUIRED ROLES
              </div>
              {selectedDef.requiredRoles.length > 0 ? (
                selectedDef.requiredRoles.map((req, idx) => (
                  <div key={idx} style={{ ...vtFont, fontSize: '14px', color: PALETTE.textDim }}>
                    {req.minCount}x {req.role.replace('_', ' ')}
                    {req.minSkill > 0 && ` (skill >= ${req.minSkill})`}
                  </div>
                ))
              ) : (
                <div style={{ ...vtFont, fontSize: '14px', color: PALETTE.textDim }}>None required.</div>
              )}

              {/* Toggle */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <PixelButton
                  variant={selectedState.active ? 'error' : 'success'}
                  onClick={() => {
                    if (selectedState.active) {
                      deactivateStream(selectedDef.id);
                    } else {
                      activateStream(selectedDef.id);
                    }
                  }}
                >
                  {selectedState.active ? 'DEACTIVATE' : 'ACTIVATE'}
                </PixelButton>
              </div>
            </div>
          </div>
        </PixelPanel>
      )}

      {/* Locked Streams */}
      <PixelPanel title="Locked Streams">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '12px',
        }}>
          {lockedStreams.length > 0 ? (
            lockedStreams.map(({ def }) => (
              <div
                key={def.id}
                style={{
                  backgroundColor: PALETTE.bg,
                  border: `2px solid ${PALETTE.panelLight}`,
                  padding: '12px',
                  opacity: 0.7,
                }}
              >
                <div style={{
                  fontFamily: "'Press Start 2P', cursive",
                  fontSize: '8px',
                  color: PALETTE.textDim,
                  marginBottom: '6px',
                }}>
                  {def.name}
                </div>
                <div style={{ ...vtFont, fontSize: '14px', color: PALETTE.textDim, marginBottom: '8px' }}>
                  {def.description}
                </div>
                <div style={{
                  fontFamily: "'Press Start 2P', cursive",
                  fontSize: '6px',
                  color: PALETTE.gold,
                  marginBottom: '4px',
                }}>
                  REQUIREMENTS:
                </div>
                {def.unlockRequirements.map((req, idx) => {
                  const met = checkRequirement(req);
                  return (
                    <div key={idx} style={{
                      ...vtFont,
                      fontSize: '14px',
                      color: met ? PALETTE.green : PALETTE.red,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}>
                      <span>{met ? '\u2713' : '\u2717'}</span>
                      <span>
                        {req.type.replace('_', ' ')}: {req.target ? `${req.target} ` : ''}{req.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))
          ) : (
            <div style={{ ...vtFont, color: PALETTE.textDim }}>All streams unlocked!</div>
          )}
        </div>
      </PixelPanel>

      {/* Revenue Breakdown Bar */}
      <PixelPanel title="Revenue Breakdown">
        {revenueBreakdown.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Stacked horizontal bar */}
            <div style={{ display: 'flex', height: '32px', border: `2px solid ${PALETTE.panelLight}` }}>
              {revenueBreakdown.map((item, idx) => {
                const pct = totalRevenue > 0 ? (item.value / totalRevenue) * 100 : 0;
                return (
                  <div
                    key={item.id}
                    style={{
                      width: `${pct}%`,
                      backgroundColor: STREAM_COLORS[idx % STREAM_COLORS.length],
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      fontFamily: "'VT323', monospace",
                      fontSize: '12px',
                      color: PALETTE.black,
                      minWidth: pct > 5 ? undefined : '2px',
                    }}
                    title={`${item.name}: ${formatCurrency(item.value)}`}
                  >
                    {pct > 10 ? item.name : ''}
                  </div>
                );
              })}
            </div>
            {/* Legend */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {revenueBreakdown.map((item, idx) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: STREAM_COLORS[idx % STREAM_COLORS.length],
                    border: `1px solid ${PALETTE.panelLight}`,
                  }} />
                  <span style={{ ...vtFont, fontSize: '14px' }}>
                    {item.name}: {formatCurrency(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ ...vtFont, color: PALETTE.textDim }}>
            No revenue data yet. Revenue is calculated monthly.
          </div>
        )}
      </PixelPanel>
    </div>
  );
}
