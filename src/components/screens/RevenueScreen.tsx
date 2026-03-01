import { useState, useMemo } from 'react';
import type { CSSProperties } from 'react';
import type { RevenueStreamId, ActiveRevenueStream } from '../../types/index.ts';
import { useGameStore } from '../../store/gameStore.ts';
import { PALETTE, FONT } from '../../styles/palette.ts';
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
      if (state.unlocked) active.push({ def, state });
      else locked.push({ def, state });
    }
    return { activeStreams: active, lockedStreams: locked };
  }, [revenueStreams]);

  const selectedDef = selectedStreamId ? REVENUE_STREAM_DEFINITIONS.find((d) => d.id === selectedStreamId) : null;
  const selectedState = selectedStreamId ? revenueStreams[selectedStreamId] : null;

  const revenueBreakdown = useMemo(() => {
    const latestReport = company.financialHistory.length > 0
      ? company.financialHistory[company.financialHistory.length - 1] : null;
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
      case 'reputation': return company.reputation >= req.value;
      case 'cash': return company.cash >= req.value;
      case 'employee_count': return Object.keys(employees).length >= req.value;
      case 'day': return useGameStore.getState().time.day >= req.value;
      case 'revenue_stream': return req.target ? revenueStreams[req.target as RevenueStreamId]?.active === true : false;
      case 'employee_skill':
        return Object.values(employees).some((e) => {
          if (!req.target) return false;
          const statKey = req.target as keyof typeof e.stats;
          return statKey in e.stats && e.stats[statKey] >= req.value;
        });
      default: return false;
    }
  };

  const label: CSSProperties = { fontFamily: FONT.ui, fontSize: '12px', color: PALETTE.textSecondary };
  const val: CSSProperties = { fontFamily: FONT.mono, fontSize: '13px', color: PALETTE.text };

  const STREAM_COLORS = [
    PALETTE.green, PALETTE.blue, PALETTE.gold, PALETTE.cyan,
    PALETTE.purple, PALETTE.red, PALETTE.greenDim, PALETTE.blueDim,
    PALETTE.goldDim, PALETTE.redDim,
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Active Streams */}
      <PixelPanel title="Active Revenue Streams">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
          {activeStreams.map(({ def, state }) => (
            <div
              key={def.id}
              onClick={() => setSelectedStreamId(def.id === selectedStreamId ? null : def.id)}
              style={{
                backgroundColor: def.id === selectedStreamId ? `${PALETTE.accent}12` : PALETTE.bgLight,
                border: `1px solid ${state.active ? PALETTE.green + '60' : PALETTE.panelBorder}`,
                borderRadius: '8px', padding: '14px', cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ fontFamily: FONT.ui, fontSize: '13px', fontWeight: 600, color: state.active ? PALETTE.text : PALETTE.textDim, marginBottom: '8px' }}>
                {def.name}
              </div>
              <div>
                <span style={label}>Base Rev: </span>
                <span style={{ ...val, color: PALETTE.green }}>{formatCurrency(def.baseRevenue * state.level)}</span>
              </div>
              <div style={{ marginTop: '6px' }}>
                <StatBar value={state.performance * 100} maxValue={100} color={PALETTE.cyan} label="Perf" showValue={false} />
              </div>
              <div style={{ ...label, fontSize: '11px', marginTop: '6px' }}>
                Employees: {state.assignedEmployeeIds.length} | Lvl: {state.level}
              </div>
              <div style={{
                fontFamily: FONT.ui, fontSize: '10px', fontWeight: 600,
                marginTop: '6px', letterSpacing: '0.04em',
                color: state.active ? PALETTE.green : PALETTE.redDim,
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ ...label, fontSize: '13px', lineHeight: 1.5 }}>{selectedDef.description}</div>
              {[
                { l: 'Phase', v: selectedDef.phase.toUpperCase(), c: selectedDef.phase === 'early' ? PALETTE.green : selectedDef.phase === 'mid' ? PALETTE.gold : PALETTE.purple },
                { l: 'Base Revenue', v: formatCurrency(selectedDef.baseRevenue), c: PALETTE.green },
                { l: 'Level', v: `${selectedState.level} (Revenue: ${formatCurrency(selectedDef.baseRevenue * selectedState.level)})`, c: PALETTE.accent },
                { l: 'Risk Level', v: `${selectedDef.riskLevel}/10`, c: selectedDef.riskLevel > 7 ? PALETTE.red : selectedDef.riskLevel > 4 ? PALETTE.gold : PALETTE.green },
              ].map((item) => (
                <div key={item.l}><span style={label}>{item.l}: </span><span style={{ ...val, color: item.c }}>{item.v}</span></div>
              ))}
              {selectedState.clientCount !== undefined && <div><span style={label}>Clients: </span><span style={val}>{selectedState.clientCount}</span></div>}
              {selectedState.aum !== undefined && <div><span style={label}>AUM: </span><span style={{ ...val, color: PALETTE.cyan }}>{formatCurrency(selectedState.aum)}</span></div>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontFamily: FONT.ui, fontSize: '10px', fontWeight: 600, color: PALETTE.textDim, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Assigned Employees
              </div>
              {selectedState.assignedEmployeeIds.length > 0 ? (
                selectedState.assignedEmployeeIds.map((empId) => {
                  const emp = employees[empId];
                  if (!emp) return null;
                  return (
                    <div key={empId} style={{
                      ...val, fontSize: '13px', padding: '6px 10px',
                      backgroundColor: PALETTE.bg, border: `1px solid ${PALETTE.panelBorder}`,
                      borderRadius: '4px',
                    }}>
                      {emp.name} - {emp.role.replace('_', ' ')}
                    </div>
                  );
                })
              ) : (
                <div style={{ ...label, fontSize: '12px' }}>No employees assigned.</div>
              )}

              <div style={{ fontFamily: FONT.ui, fontSize: '10px', fontWeight: 600, color: PALETTE.textDim, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '8px' }}>
                Required Roles
              </div>
              {selectedDef.requiredRoles.length > 0 ? (
                selectedDef.requiredRoles.map((req, idx) => (
                  <div key={idx} style={{ ...label, fontSize: '12px' }}>
                    {req.minCount}x {req.role.replace('_', ' ')}
                    {req.minSkill > 0 && ` (skill >= ${req.minSkill})`}
                  </div>
                ))
              ) : (
                <div style={{ ...label, fontSize: '12px' }}>None required.</div>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <PixelButton
                  variant={selectedState.active ? 'error' : 'success'}
                  onClick={() => {
                    if (selectedState.active) deactivateStream(selectedDef.id);
                    else activateStream(selectedDef.id);
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {lockedStreams.length > 0 ? (
            lockedStreams.map(({ def }) => (
              <div key={def.id} style={{
                backgroundColor: PALETTE.bg, border: `1px solid ${PALETTE.panelBorder}`,
                borderRadius: '8px', padding: '14px', opacity: 0.7,
              }}>
                <div style={{ fontFamily: FONT.ui, fontSize: '13px', fontWeight: 600, color: PALETTE.textDim, marginBottom: '6px' }}>{def.name}</div>
                <div style={{ ...label, fontSize: '12px', marginBottom: '10px', lineHeight: 1.5 }}>{def.description}</div>
                <div style={{ fontFamily: FONT.ui, fontSize: '10px', fontWeight: 600, color: PALETTE.textDim, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                  Requirements:
                </div>
                {def.unlockRequirements.map((req, idx) => {
                  const met = checkRequirement(req);
                  return (
                    <div key={idx} style={{
                      fontFamily: FONT.ui, fontSize: '12px',
                      color: met ? PALETTE.green : PALETTE.red,
                      display: 'flex', alignItems: 'center', gap: '4px',
                    }}>
                      <span>{met ? '\u2713' : '\u2717'}</span>
                      <span>{req.type.replace('_', ' ')}: {req.target ? `${req.target} ` : ''}{req.value}</span>
                    </div>
                  );
                })}
              </div>
            ))
          ) : (
            <div style={{ ...label, color: PALETTE.textDim }}>All streams unlocked!</div>
          )}
        </div>
      </PixelPanel>

      {/* Revenue Breakdown */}
      <PixelPanel title="Revenue Breakdown">
        {revenueBreakdown.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', height: '24px', borderRadius: '6px', overflow: 'hidden', border: `1px solid ${PALETTE.panelBorder}` }}>
              {revenueBreakdown.map((item, idx) => {
                const pct = totalRevenue > 0 ? (item.value / totalRevenue) * 100 : 0;
                return (
                  <div key={item.id} style={{
                    width: `${pct}%`, backgroundColor: STREAM_COLORS[idx % STREAM_COLORS.length],
                    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                    fontFamily: FONT.ui, fontSize: '10px', fontWeight: 500, color: PALETTE.black,
                    minWidth: pct > 5 ? undefined : '2px',
                  }} title={`${item.name}: ${formatCurrency(item.value)}`}>
                    {pct > 10 ? item.name : ''}
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {revenueBreakdown.map((item, idx) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '10px', height: '10px', borderRadius: '2px',
                    backgroundColor: STREAM_COLORS[idx % STREAM_COLORS.length],
                  }} />
                  <span style={{ ...label, fontSize: '12px' }}>{item.name}: <span style={{ color: PALETTE.text }}>{formatCurrency(item.value)}</span></span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ ...label, color: PALETTE.textDim }}>No revenue data yet. Revenue is calculated monthly.</div>
        )}
      </PixelPanel>
    </div>
  );
}
