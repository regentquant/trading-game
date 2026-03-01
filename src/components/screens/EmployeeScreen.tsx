import { useState, useMemo } from 'react';
import type { CSSProperties } from 'react';
import type { Employee, PersonalityTrait } from '../../types/index.ts';
import { useGameStore } from '../../store/gameStore.ts';
import { PALETTE } from '../../styles/palette.ts';
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
  burnout_prone: PALETTE.redDark,
  mentor: PALETTE.greenDark,
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
    return currentDept.employeeIds
      .map((id) => employees[id])
      .filter(Boolean) as Employee[];
  }, [currentDept, employees]);

  const selectedEmployee = selectedEmployeeId ? employees[selectedEmployeeId] : null;

  const hiringPoolByTab: Record<HiringSubTab, Employee[]> = {
    campus: hiringPool.campus as Employee[],
    jobMarket: hiringPool.jobMarket as Employee[],
    headhunter: hiringPool.headhunter as Employee[],
  };

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

  const xpNeeded = selectedEmployee
    ? CONFIG.XP_TO_LEVEL[selectedEmployee.level] ?? Infinity
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Main Tabs */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <button type="button" style={tabStyle(mainTab === 'departments')} onClick={() => setMainTab('departments')}>
          Departments
        </button>
        <button type="button" style={tabStyle(mainTab === 'hiring')} onClick={() => setMainTab('hiring')}>
          Hiring ({currentEmployeeCount}/{maxEmployees})
        </button>
      </div>

      {mainTab === 'departments' && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedEmployee ? '1fr 1fr' : '1fr', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Department Tabs */}
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {deptList.map((dept) => (
                <button
                  key={dept.id}
                  type="button"
                  style={tabStyle(selectedDeptId === dept.id)}
                  onClick={() => setSelectedDeptId(dept.id)}
                >
                  {dept.name} ({dept.employeeIds.length})
                </button>
              ))}
            </div>

            {/* Department Info */}
            {currentDept && (
              <PixelPanel title={`${currentDept.name} Department`}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={vtFont}>
                    <span style={{ color: PALETTE.textDim }}>Head: </span>
                    <span style={{ color: PALETTE.gold }}>
                      {currentDept.headId && employees[currentDept.headId]
                        ? employees[currentDept.headId].name
                        : 'None'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ ...vtFont, fontSize: '14px', color: PALETTE.textDim }}>Work Intensity:</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={currentDept.workIntensity}
                      onChange={(e) => setWorkIntensity(currentDept.id, Number(e.target.value))}
                      style={{ flex: 1 }}
                    />
                    <span style={{ ...vtFont, fontSize: '16px' }}>{currentDept.workIntensity}%</span>
                  </div>
                </div>
              </PixelPanel>
            )}

            {/* Employee Roster */}
            <PixelPanel title="Employee Roster">
              <div style={{ overflowY: 'auto', maxHeight: '400px' }}>
                {deptEmployees.length > 0 ? (
                  deptEmployees.map((emp) => (
                    <div
                      key={emp.id}
                      onClick={() => setSelectedEmployee(emp.id === selectedEmployeeId ? null : emp.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px',
                        backgroundColor: emp.id === selectedEmployeeId ? PALETTE.panelLight : PALETTE.bgLight,
                        border: `1px solid ${PALETTE.panelLight}`,
                        marginBottom: '4px',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ ...vtFont, fontSize: '18px' }}>
                          <span style={{ color: PALETTE.gold }}>{emp.name}</span>
                          <span style={{ color: PALETTE.textDim, marginLeft: '8px', fontSize: '14px' }}>
                            {emp.role.replace('_', ' ')} - {LEVEL_LABELS[emp.level] ?? emp.level}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                          {emp.traits.map((t) => (
                            <span
                              key={t}
                              style={{
                                fontFamily: "'Press Start 2P', cursive",
                                fontSize: '5px',
                                padding: '2px 4px',
                                backgroundColor: `${TRAIT_COLORS[t]}33`,
                                color: TRAIT_COLORS[t],
                                border: `1px solid ${TRAIT_COLORS[t]}`,
                              }}
                              title={TRAIT_DESCRIPTIONS[t]}
                            >
                              {t.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '120px' }}>
                        <StatBar value={emp.morale} maxValue={100} color={PALETTE.green} label="Morale" showValue={false} />
                        <StatBar value={emp.burnout} maxValue={100} color={PALETTE.red} label="Burnout" showValue={false} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ ...vtFont, color: PALETTE.textDim }}>
                    No employees in this department.
                  </div>
                )}
              </div>
            </PixelPanel>
          </div>

          {/* Selected Employee Detail */}
          {selectedEmployee && (
            <PixelPanel title={selectedEmployee.name}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={vtFont}>
                  <span style={{ color: PALETTE.textDim }}>Role: </span>
                  <span>{selectedEmployee.role.replace('_', ' ')}</span>
                </div>
                <div style={vtFont}>
                  <span style={{ color: PALETTE.textDim }}>Level: </span>
                  <span style={{ color: PALETTE.gold }}>{LEVEL_LABELS[selectedEmployee.level] ?? selectedEmployee.level}</span>
                </div>
                <div style={vtFont}>
                  <span style={{ color: PALETTE.textDim }}>Salary: </span>
                  <span style={{ color: PALETTE.green }}>{formatCurrency(selectedEmployee.salary)}/mo</span>
                </div>
                <div style={vtFont}>
                  <span style={{ color: PALETTE.textDim }}>Hired: </span>
                  <span>{formatGameDate(selectedEmployee.hiredOnDay)}</span>
                </div>

                {/* XP Progress */}
                <StatBar
                  value={selectedEmployee.experience}
                  maxValue={xpNeeded === Infinity ? selectedEmployee.experience : xpNeeded}
                  color={PALETTE.cyan}
                  label={`XP${xpNeeded === Infinity ? ' (Max Level)' : ''}`}
                />

                {/* Stats */}
                <div style={{
                  fontFamily: "'Press Start 2P', cursive",
                  fontSize: '7px',
                  color: PALETTE.gold,
                  marginTop: '4px',
                }}>
                  STATS
                </div>
                <StatBar value={selectedEmployee.stats.analytics} maxValue={10} color={PALETTE.blue} label="Analytics" />
                <StatBar value={selectedEmployee.stats.salesmanship} maxValue={10} color={PALETTE.gold} label="Salesmanship" />
                <StatBar value={selectedEmployee.stats.riskManagement} maxValue={10} color={PALETTE.green} label="Risk Mgmt" />
                <StatBar value={selectedEmployee.stats.quantSkill} maxValue={10} color={PALETTE.cyan} label="Quant Skill" />
                <StatBar value={selectedEmployee.stats.leadership} maxValue={10} color={PALETTE.purple} label="Leadership" />

                {/* Morale / Burnout */}
                <StatBar value={selectedEmployee.morale} maxValue={100} color={PALETTE.green} label="Morale" />
                <StatBar value={selectedEmployee.burnout} maxValue={100} color={PALETTE.red} label="Burnout" />

                {/* Traits */}
                <div style={{
                  fontFamily: "'Press Start 2P', cursive",
                  fontSize: '7px',
                  color: PALETTE.gold,
                  marginTop: '4px',
                }}>
                  TRAITS
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {selectedEmployee.traits.map((t) => (
                    <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontFamily: "'Press Start 2P', cursive",
                        fontSize: '6px',
                        padding: '2px 4px',
                        backgroundColor: `${TRAIT_COLORS[t]}33`,
                        color: TRAIT_COLORS[t],
                        border: `1px solid ${TRAIT_COLORS[t]}`,
                      }}>
                        {t.replace('_', ' ')}
                      </span>
                      <span style={{ ...vtFont, fontSize: '14px', color: PALETTE.textDim }}>
                        {TRAIT_DESCRIPTIONS[t]}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ ...vtFont, fontSize: '14px', color: PALETTE.textDim }}>Reassign:</label>
                    <select
                      value={selectedEmployee.departmentId}
                      onChange={(e) => assignToDepartment(selectedEmployee.id, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '4px',
                        backgroundColor: PALETTE.bg,
                        color: PALETTE.text,
                        border: `2px solid ${PALETTE.panelLight}`,
                        fontFamily: "'VT323', monospace",
                        fontSize: '14px',
                        marginTop: '4px',
                      }}
                    >
                      {deptList.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    <PixelButton
                      variant="error"
                      onClick={() => setShowFireConfirm(true)}
                      style={{ fontSize: '8px' }}
                    >
                      FIRE
                    </PixelButton>
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
          {/* Sub-tabs */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button type="button" style={tabStyle(hiringSubTab === 'campus')} onClick={() => setHiringSubTab('campus')}>
              Campus ({hiringPool.campus.length})
            </button>
            <button type="button" style={tabStyle(hiringSubTab === 'jobMarket')} onClick={() => setHiringSubTab('jobMarket')}>
              Job Market ({hiringPool.jobMarket.length})
            </button>
            <button type="button" style={tabStyle(hiringSubTab === 'headhunter')} onClick={() => setHiringSubTab('headhunter')}>
              Headhunter ({hiringPool.headhunter.length})
            </button>
          </div>

          <div style={{ ...vtFont, fontSize: '14px', color: PALETTE.textDim }}>
            Pool refreshes every 30 days. Slots: {currentEmployeeCount}/{maxEmployees}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {hiringPoolByTab[hiringSubTab].length > 0 ? (
              hiringPoolByTab[hiringSubTab].map((candidate) => {
                const canAfford = cash >= candidate.salary * 3; // rough hiring cost
                const hasCap = currentEmployeeCount < maxEmployees;
                return (
                  <div
                    key={candidate.id}
                    style={{
                      backgroundColor: PALETTE.bgLight,
                      border: `2px solid ${PALETTE.panelLight}`,
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ ...vtFont, fontSize: '18px' }}>
                      <span style={{ color: PALETTE.gold }}>{candidate.name}</span>
                    </div>
                    <div style={{ ...vtFont, fontSize: '14px', color: PALETTE.textDim }}>
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
                        <span
                          key={t}
                          style={{
                            fontFamily: "'Press Start 2P', cursive",
                            fontSize: '5px',
                            padding: '2px 4px',
                            backgroundColor: `${TRAIT_COLORS[t]}33`,
                            color: TRAIT_COLORS[t],
                            border: `1px solid ${TRAIT_COLORS[t]}`,
                          }}
                          title={TRAIT_DESCRIPTIONS[t]}
                        >
                          {t.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                    <div style={{ ...vtFont, fontSize: '14px' }}>
                      <span style={{ color: PALETTE.textDim }}>Salary: </span>
                      <span style={{ color: PALETTE.green }}>{formatCurrency(candidate.salary)}/mo</span>
                    </div>
                    <PixelButton
                      variant={canAfford && hasCap ? 'success' : 'disabled'}
                      onClick={() => {
                        if (canAfford && hasCap) {
                          hireEmployee(candidate.id, hiringSubTab);
                        }
                      }}
                      style={{ fontSize: '8px' }}
                    >
                      {!hasCap ? 'OFFICE FULL' : !canAfford ? 'CANNOT AFFORD' : 'HIRE'}
                    </PixelButton>
                  </div>
                );
              })
            ) : (
              <div style={{ ...vtFont, color: PALETTE.textDim }}>
                No candidates available. Pool refreshes each month.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fire Confirmation Modal */}
      <Modal
        isOpen={showFireConfirm}
        onClose={() => setShowFireConfirm(false)}
        title="Confirm Termination"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={vtFont}>
            Are you sure you want to fire <span style={{ color: PALETTE.gold }}>{selectedEmployee?.name}</span>?
            This cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <PixelButton variant="primary" onClick={() => setShowFireConfirm(false)}>
              Cancel
            </PixelButton>
            <PixelButton
              variant="error"
              onClick={() => {
                if (selectedEmployeeId) {
                  fireEmployee(selectedEmployeeId);
                  setSelectedEmployee(null);
                  setShowFireConfirm(false);
                }
              }}
            >
              FIRE
            </PixelButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
