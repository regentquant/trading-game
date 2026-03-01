import { useState, useMemo } from 'react';
import type { CSSProperties } from 'react';
import type { Employee, PersonalityTrait } from '../../types/index.ts';
import { useGameStore } from '../../store/gameStore.ts';
import { PALETTE, FONT } from '../../styles/palette.ts';
import { CONFIG } from '../../data/config.ts';
import { formatCurrency, formatGameDate } from '../../utils/format.ts';
import { PixelPanel } from '../ui/PixelPanel.tsx';
import { PixelButton } from '../ui/PixelButton.tsx';
import { StatBar } from '../ui/StatBar.tsx';
import { Modal } from '../ui/Modal.tsx';

const TRAIT_COLORS: Record<PersonalityTrait, string> = {
  risk_taker: PALETTE.red,
  conservative: PALETTE.blue,
  networker: PALETTE.gold,
  workaholic: PALETTE.purple,
  quant_mind: PALETTE.cyan,
  silver_tongue: PALETTE.green,
  burnout_prone: PALETTE.redDim,
  mentor: PALETTE.greenDim,
};

const TRAIT_DESCRIPTIONS: Record<PersonalityTrait, string> = {
  risk_taker: 'Takes aggressive positions, higher returns but more volatility.',
  conservative: 'Prefers safe strategies, steady but lower returns.',
  networker: 'Brings in more clients through personal connections.',
  workaholic: 'Works harder but more susceptible to burnout.',
  quant_mind: 'Exceptional analytical and quantitative abilities.',
  silver_tongue: 'Excellent at client relations and closing deals.',
  burnout_prone: 'Burns out faster under work pressure.',
  mentor: 'Helps junior employees gain experience faster.',
};

const LEVEL_LABELS: Record<string, string> = {
  analyst_level: 'Analyst',
  associate: 'Associate',
  vp: 'VP',
  director: 'Director',
  managing_director: 'Managing Director',
};

type MainTab = 'departments' | 'hiring';
type HiringSubTab = 'campus' | 'jobMarket' | 'headhunter';

export function EmployeeScreen() {
  const employees = useGameStore((s) => s.employees);
  const departments = useGameStore((s) => s.departments);
  const hiringPool = useGameStore((s) => s.hiringPool);
  const cash = useGameStore((s) => s.company.cash);
  const officeLevel = useGameStore((s) => s.company.officeLevel);
  const selectedEmployeeId = useGameStore((s) => s.ui.selectedEmployeeId);
  const setSelectedEmployee = useGameStore((s) => s.setSelectedEmployee);
  const hireEmployee = useGameStore((s) => s.hireEmployee);
  const fireEmployee = useGameStore((s) => s.fireEmployee);
  const assignToDepartment = useGameStore((s) => s.assignToDepartment);
  const setWorkIntensity = useGameStore((s) => s.setWorkIntensity);

  const [mainTab, setMainTab] = useState<MainTab>('departments');
  const [hiringSubTab, setHiringSubTab] = useState<HiringSubTab>('campus');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('general');
  const [showFireConfirm, setShowFireConfirm] = useState(false);

  const deptList = useMemo(() => Object.values(departments), [departments]);
  const currentDept = departments[selectedDeptId];
  const maxEmployees = CONFIG.OFFICE_MAX_EMPLOYEES[officeLevel] ?? 10;
  const currentEmployeeCount = Object.keys(employees).length;

  const deptEmployees = useMemo(() => {
    if (!currentDept) return [];
    return currentDept.employeeIds.map((id) => employees[id]).filter(Boolean) as Employee[];
  }, [currentDept, employees]);

  const selectedEmployee = selectedEmployeeId ? employees[selectedEmployeeId] : null;

  const hiringPoolByTab: Record<HiringSubTab, Employee[]> = {
    campus: hiringPool.campus as Employee[],
    jobMarket: hiringPool.jobMarket as Employee[],
    headhunter: hiringPool.headhunter as Employee[],
  };

  const label: CSSProperties = { fontFamily: FONT.ui, fontSize: '13px', color: PALETTE.textSecondary };
  const val: CSSProperties = { fontFamily: FONT.mono, fontSize: '13px', color: PALETTE.text };

  const tabStyle = (active: boolean): CSSProperties => ({
    fontFamily: FONT.ui, fontSize: '12px', fontWeight: active ? 600 : 400,
    padding: '6px 14px', borderRadius: '6px',
    border: `1px solid ${active ? PALETTE.accent : PALETTE.panelBorder}`,
    backgroundColor: active ? `${PALETTE.accent}18` : 'transparent',
    color: active ? PALETTE.accent : PALETTE.textSecondary,
    cursor: 'pointer', transition: 'all 0.15s ease',
  });

  const traitBadge = (t: PersonalityTrait): CSSProperties => ({
    fontFamily: FONT.ui, fontSize: '10px', fontWeight: 500,
    padding: '2px 6px', borderRadius: '3px',
    backgroundColor: `${TRAIT_COLORS[t]}18`,
    color: TRAIT_COLORS[t],
    border: `1px solid ${TRAIT_COLORS[t]}40`,
  });

  const xpNeeded = selectedEmployee ? CONFIG.XP_TO_LEVEL[selectedEmployee.level] ?? Infinity : 0;

  const inputStyle: CSSProperties = {
    padding: '6px 8px', backgroundColor: PALETTE.bg, color: PALETTE.text,
    border: `1px solid ${PALETTE.panelBorder}`, borderRadius: '4px',
    fontFamily: FONT.mono, fontSize: '13px',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Main Tabs */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <button type="button" style={tabStyle(mainTab === 'departments')} onClick={() => setMainTab('departments')}>Departments</button>
        <button type="button" style={tabStyle(mainTab === 'hiring')} onClick={() => setMainTab('hiring')}>
          Hiring ({currentEmployeeCount}/{maxEmployees})
        </button>
      </div>

      {mainTab === 'departments' && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedEmployee ? '1fr 1fr' : '1fr', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {deptList.map((dept) => (
                <button key={dept.id} type="button" style={tabStyle(selectedDeptId === dept.id)} onClick={() => setSelectedDeptId(dept.id)}>
                  {dept.name} ({dept.employeeIds.length})
                </button>
              ))}
            </div>

            {currentDept && (
              <PixelPanel title={`${currentDept.name} Department`}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <span style={label}>Head: </span>
                    <span style={{ ...val, color: PALETTE.accent }}>
                      {currentDept.headId && employees[currentDept.headId] ? employees[currentDept.headId].name : 'None'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ ...label, fontSize: '12px' }}>Work Intensity:</span>
                    <input
                      type="range" min={0} max={100}
                      value={currentDept.workIntensity}
                      onChange={(e) => setWorkIntensity(currentDept.id, Number(e.target.value))}
                      style={{ flex: 1, accentColor: PALETTE.accent }}
                    />
                    <span style={{ ...val, fontSize: '13px', minWidth: '36px', textAlign: 'right' }}>{currentDept.workIntensity}%</span>
                  </div>
                </div>
              </PixelPanel>
            )}

            <PixelPanel title="Employee Roster">
              <div style={{ overflowY: 'auto', maxHeight: '400px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {deptEmployees.length > 0 ? (
                  deptEmployees.map((emp) => (
                    <div
                      key={emp.id}
                      onClick={() => setSelectedEmployee(emp.id === selectedEmployeeId ? null : emp.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 12px', borderRadius: '6px',
                        backgroundColor: emp.id === selectedEmployeeId ? `${PALETTE.accent}12` : PALETTE.bgLight,
                        border: `1px solid ${emp.id === selectedEmployeeId ? PALETTE.accent + '40' : PALETTE.panelBorder}`,
                        cursor: 'pointer', transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                          <span style={{ fontFamily: FONT.ui, fontSize: '14px', fontWeight: 500, color: PALETTE.text }}>{emp.name}</span>
                          <span style={{ fontFamily: FONT.ui, fontSize: '11px', color: PALETTE.textDim }}>
                            {emp.role.replace('_', ' ')} - {LEVEL_LABELS[emp.level] ?? emp.level}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                          {emp.traits.map((t) => (
                            <span key={t} style={traitBadge(t)} title={TRAIT_DESCRIPTIONS[t]}>{t.replace('_', ' ')}</span>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '120px' }}>
                        <StatBar value={emp.morale} maxValue={100} color={PALETTE.green} label="Morale" showValue={false} />
                        <StatBar value={emp.burnout} maxValue={100} color={PALETTE.red} label="Burnout" showValue={false} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ ...label, color: PALETTE.textDim }}>No employees in this department.</div>
                )}
              </div>
            </PixelPanel>
          </div>

          {/* Selected Employee Detail */}
          {selectedEmployee && (
            <PixelPanel title={selectedEmployee.name}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { l: 'Role', v: selectedEmployee.role.replace('_', ' ') },
                  { l: 'Level', v: LEVEL_LABELS[selectedEmployee.level] ?? selectedEmployee.level, c: PALETTE.accent },
                  { l: 'Salary', v: `${formatCurrency(selectedEmployee.salary)}/mo`, c: PALETTE.green },
                  { l: 'Hired', v: formatGameDate(selectedEmployee.hiredOnDay) },
                ].map((item) => (
                  <div key={item.l}>
                    <span style={label}>{item.l}: </span>
                    <span style={{ ...val, color: item.c ?? PALETTE.text }}>{item.v}</span>
                  </div>
                ))}

                <StatBar
                  value={selectedEmployee.experience}
                  maxValue={xpNeeded === Infinity ? selectedEmployee.experience : xpNeeded}
                  color={PALETTE.cyan}
                  label={`XP${xpNeeded === Infinity ? ' (Max Level)' : ''}`}
                />

                <div style={{ fontFamily: FONT.ui, fontSize: '10px', fontWeight: 600, color: PALETTE.textDim, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '4px' }}>
                  Stats
                </div>
                <StatBar value={selectedEmployee.stats.analytics} maxValue={10} color={PALETTE.blue} label="Analytics" />
                <StatBar value={selectedEmployee.stats.salesmanship} maxValue={10} color={PALETTE.gold} label="Salesmanship" />
                <StatBar value={selectedEmployee.stats.riskManagement} maxValue={10} color={PALETTE.green} label="Risk Mgmt" />
                <StatBar value={selectedEmployee.stats.quantSkill} maxValue={10} color={PALETTE.cyan} label="Quant Skill" />
                <StatBar value={selectedEmployee.stats.leadership} maxValue={10} color={PALETTE.purple} label="Leadership" />
                <StatBar value={selectedEmployee.morale} maxValue={100} color={PALETTE.green} label="Morale" />
                <StatBar value={selectedEmployee.burnout} maxValue={100} color={PALETTE.red} label="Burnout" />

                <div style={{ fontFamily: FONT.ui, fontSize: '10px', fontWeight: 600, color: PALETTE.textDim, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '4px' }}>
                  Traits
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedEmployee.traits.map((t) => (
                    <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={traitBadge(t)}>{t.replace('_', ' ')}</span>
                      <span style={{ fontFamily: FONT.ui, fontSize: '11px', color: PALETTE.textDim }}>{TRAIT_DESCRIPTIONS[t]}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ ...label, fontSize: '11px' }}>Reassign:</label>
                    <select
                      value={selectedEmployee.departmentId}
                      onChange={(e) => assignToDepartment(selectedEmployee.id, e.target.value)}
                      style={{ ...inputStyle, width: '100%', marginTop: '4px' }}
                    >
                      {deptList.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    <PixelButton variant="error" onClick={() => setShowFireConfirm(true)} style={{ fontSize: '11px' }}>FIRE</PixelButton>
                  </div>
                </div>
              </div>
            </PixelPanel>
          )}
        </div>
      )}

      {/* Hiring Tab */}
      {mainTab === 'hiring' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button type="button" style={tabStyle(hiringSubTab === 'campus')} onClick={() => setHiringSubTab('campus')}>Campus ({hiringPool.campus.length})</button>
            <button type="button" style={tabStyle(hiringSubTab === 'jobMarket')} onClick={() => setHiringSubTab('jobMarket')}>Job Market ({hiringPool.jobMarket.length})</button>
            <button type="button" style={tabStyle(hiringSubTab === 'headhunter')} onClick={() => setHiringSubTab('headhunter')}>Headhunter ({hiringPool.headhunter.length})</button>
          </div>

          <div style={{ ...label, fontSize: '12px', color: PALETTE.textDim }}>
            Pool refreshes every 30 days. Slots: {currentEmployeeCount}/{maxEmployees}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {hiringPoolByTab[hiringSubTab].length > 0 ? (
              hiringPoolByTab[hiringSubTab].map((candidate) => {
                const canAfford = cash >= candidate.salary * 3;
                const hasCap = currentEmployeeCount < maxEmployees;
                return (
                  <div key={candidate.id} style={{
                    backgroundColor: PALETTE.bgLight, border: `1px solid ${PALETTE.panelBorder}`,
                    borderRadius: '8px', padding: '14px',
                    display: 'flex', flexDirection: 'column', gap: '8px',
                  }}>
                    <div style={{ fontFamily: FONT.ui, fontSize: '14px', fontWeight: 500, color: PALETTE.text }}>{candidate.name}</div>
                    <div style={{ ...label, fontSize: '12px' }}>
                      {candidate.role.replace('_', ' ')} - {LEVEL_LABELS[candidate.level] ?? candidate.level}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                      <StatBar value={candidate.stats.analytics} maxValue={10} color={PALETTE.blue} label="Anl" showValue={false} />
                      <StatBar value={candidate.stats.salesmanship} maxValue={10} color={PALETTE.gold} label="Sal" showValue={false} />
                      <StatBar value={candidate.stats.riskManagement} maxValue={10} color={PALETTE.green} label="Rsk" showValue={false} />
                      <StatBar value={candidate.stats.quantSkill} maxValue={10} color={PALETTE.cyan} label="Qnt" showValue={false} />
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {candidate.traits.map((t) => (
                        <span key={t} style={traitBadge(t)} title={TRAIT_DESCRIPTIONS[t]}>{t.replace('_', ' ')}</span>
                      ))}
                    </div>
                    <div>
                      <span style={label}>Salary: </span>
                      <span style={{ ...val, color: PALETTE.green }}>{formatCurrency(candidate.salary)}/mo</span>
                    </div>
                    <PixelButton
                      variant={canAfford && hasCap ? 'success' : 'disabled'}
                      onClick={() => { if (canAfford && hasCap) hireEmployee(candidate.id, hiringSubTab); }}
                      style={{ fontSize: '11px' }}
                    >
                      {!hasCap ? 'OFFICE FULL' : !canAfford ? 'CANNOT AFFORD' : 'HIRE'}
                    </PixelButton>
                  </div>
                );
              })
            ) : (
              <div style={{ ...label, color: PALETTE.textDim }}>No candidates available. Pool refreshes each month.</div>
            )}
          </div>
        </div>
      )}

      <Modal isOpen={showFireConfirm} onClose={() => setShowFireConfirm(false)} title="Confirm Termination">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontFamily: FONT.ui, fontSize: '14px', color: PALETTE.text }}>
            Are you sure you want to fire <span style={{ color: PALETTE.accent, fontWeight: 500 }}>{selectedEmployee?.name}</span>? This cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <PixelButton variant="primary" onClick={() => setShowFireConfirm(false)}>Cancel</PixelButton>
            <PixelButton variant="error" onClick={() => {
              if (selectedEmployeeId) { fireEmployee(selectedEmployeeId); setSelectedEmployee(null); setShowFireConfirm(false); }
            }}>FIRE</PixelButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
