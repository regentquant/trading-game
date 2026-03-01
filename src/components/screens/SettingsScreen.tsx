import { useState, useCallback } from 'react';
import type { CSSProperties } from 'react';
import { useGameStore } from '../../store/gameStore.ts';
import { getAchievementName } from '../../store/gameStore.ts';
import { selectNetWorth } from '../../store/selectors.ts';
import { PALETTE } from '../../styles/palette.ts';
import { CONFIG } from '../../data/config.ts';
import { formatCurrency } from '../../utils/format.ts';
import { PixelPanel } from '../ui/PixelPanel.tsx';
import { PixelButton } from '../ui/PixelButton.tsx';
import { Modal } from '../ui/Modal.tsx';

export function SettingsScreen() {
  const company = useGameStore((s) => s.company);
  const statistics = useGameStore((s) => s.statistics);
  const meta = useGameStore((s) => s.meta);
  const crtEnabled = useGameStore((s) => s.ui.crtEnabled);
  const saveGame = useGameStore((s) => s.saveGame);
  const loadGame = useGameStore((s) => s.loadGame);
  const resetGame = useGameStore((s) => s.resetGame);
  const exportSave = useGameStore((s) => s.exportSave);
  const importSave = useGameStore((s) => s.importSave);
  const setCrtEnabled = useGameStore((s) => s.setCrtEnabled);
  const setCompanyName = useGameStore((s) => s.setCompanyName);
  const takeLoan = useGameStore((s) => s.takeLoan);
  const repayLoan = useGameStore((s) => s.repayLoan);
  const upgradeOffice = useGameStore((s) => s.upgradeOffice);

  const [companyNameInput, setCompanyNameInput] = useState(company.name);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [showLoadConfirm, setShowLoadConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showResetDoubleConfirm, setShowResetDoubleConfirm] = useState(false);
  const [importData, setImportData] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [loanAmount, setLoanAmount] = useState('50000');
  const [repayAmount, setRepayAmount] = useState('50000');

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  }, []);

  const handleSave = () => {
    saveGame();
    showToast('Game saved successfully!');
  };

  const handleLoad = () => {
    const success = loadGame();
    setShowLoadConfirm(false);
    showToast(success ? 'Game loaded!' : 'No save found.');
  };

  const handleExport = () => {
    const data = exportSave();
    navigator.clipboard
      .writeText(data)
      .then(() => {
        showToast('Save data copied to clipboard!');
      })
      .catch(() => {
        showToast('Export generated. Check console.');
      });
  };

  const handleImport = () => {
    if (!importData.trim()) {
      showToast('No data to import.');
      return;
    }
    const success = importSave(importData.trim());
    setShowImportModal(false);
    setImportData('');
    showToast(success ? 'Save imported successfully!' : 'Invalid save data.');
  };

  const handleReset = () => {
    resetGame();
    setShowResetConfirm(false);
    setShowResetDoubleConfirm(false);
    showToast('Game reset to initial state.');
  };

  const handleCompanyNameSave = () => {
    setCompanyName(companyNameInput);
    showToast('Company name updated!');
  };

  const handleCrtToggle = () => {
    setCrtEnabled(!crtEnabled);
  };

  // Net worth for max loan calculation
  const state = useGameStore.getState();
  const netWorth = selectNetWorth(state);
  const maxLoan = Math.max(0, netWorth * 2 - company.totalLoans);

  // Office upgrade info
  const nextOfficeLevel = company.officeLevel + 1;
  const canUpgradeOffice = nextOfficeLevel < CONFIG.OFFICE_MAX_EMPLOYEES.length;
  const upgradeIndex = nextOfficeLevel - 1;
  const officeCost =
    canUpgradeOffice && upgradeIndex >= 0 && upgradeIndex < CONFIG.OFFICE_UPGRADE_COSTS.length
      ? CONFIG.OFFICE_UPGRADE_COSTS[upgradeIndex]
      : 0;
  const canAffordUpgrade = canUpgradeOffice && company.cash >= officeCost;
  const currentMaxEmployees = CONFIG.OFFICE_MAX_EMPLOYEES[company.officeLevel] ?? 10;
  const nextMaxEmployees = canUpgradeOffice
    ? CONFIG.OFFICE_MAX_EMPLOYEES[nextOfficeLevel] ?? currentMaxEmployees
    : currentMaxEmployees;

  const lastSaveDate = meta.saveTimestamp
    ? new Date(meta.saveTimestamp).toLocaleString()
    : 'Never';

  const totalPlayMinutes = Math.floor(meta.totalPlayTime / 60);

  const vtFont: CSSProperties = {
    fontFamily: "'VT323', monospace",
    fontSize: '20px',
    color: PALETTE.text,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Toast */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '80px',
            right: '20px',
            backgroundColor: PALETTE.green,
            color: PALETTE.black,
            padding: '10px 20px',
            fontFamily: "'Press Start 2P', cursive",
            fontSize: '9px',
            zIndex: 2000,
            border: `3px solid ${PALETTE.greenDark}`,
            boxShadow: `4px 4px 0 ${PALETTE.black}`,
            animation: 'popupSlideUp 0.3s ease-out',
          }}
        >
          {toastMessage}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Save/Load Section */}
        <PixelPanel title="Save / Load">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ ...vtFont, fontSize: '14px', color: PALETTE.textDim }}>
              Last saved: {lastSaveDate}
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <PixelButton variant="success" onClick={handleSave}>
                Save Game
              </PixelButton>
              <PixelButton variant="primary" onClick={() => setShowLoadConfirm(true)}>
                Load Game
              </PixelButton>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <PixelButton variant="warning" onClick={handleExport}>
                Export Save
              </PixelButton>
              <PixelButton variant="warning" onClick={() => setShowImportModal(true)}>
                Import Save
              </PixelButton>
            </div>

            <PixelButton variant="error" onClick={() => setShowResetConfirm(true)}>
              Reset Game
            </PixelButton>
          </div>
        </PixelPanel>

        {/* Game Settings */}
        <PixelPanel title="Game Settings">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Company Name */}
            <div>
              <label style={{ ...vtFont, fontSize: '14px', color: PALETTE.textDim }}>
                Company Name:
              </label>
              <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                <input
                  type="text"
                  value={companyNameInput}
                  onChange={(e) => setCompanyNameInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '6px',
                    backgroundColor: PALETTE.bg,
                    color: PALETTE.text,
                    border: `2px solid ${PALETTE.panelLight}`,
                    fontFamily: "'VT323', monospace",
                    fontSize: '18px',
                  }}
                />
                <PixelButton variant="primary" onClick={handleCompanyNameSave}>
                  Set
                </PixelButton>
              </div>
            </div>

            {/* CRT Toggle */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={vtFont}>CRT Scanlines</span>
              <button
                type="button"
                onClick={handleCrtToggle}
                style={{
                  padding: '4px 12px',
                  backgroundColor: crtEnabled ? PALETTE.green : PALETTE.bgLight,
                  color: crtEnabled ? PALETTE.black : PALETTE.textDim,
                  border: `2px solid ${crtEnabled ? PALETTE.green : PALETTE.panelLight}`,
                  fontFamily: "'Press Start 2P', cursive",
                  fontSize: '8px',
                  cursor: 'pointer',
                }}
              >
                {crtEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Sound Toggle */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={vtFont}>Sound (Coming Soon)</span>
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                style={{
                  padding: '4px 12px',
                  backgroundColor: soundEnabled ? PALETTE.green : PALETTE.bgLight,
                  color: soundEnabled ? PALETTE.black : PALETTE.textDim,
                  border: `2px solid ${soundEnabled ? PALETTE.green : PALETTE.panelLight}`,
                  fontFamily: "'Press Start 2P', cursive",
                  fontSize: '8px',
                  cursor: 'pointer',
                  opacity: 0.5,
                }}
              >
                {soundEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Auto-save Toggle */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={vtFont}>Auto-Save</span>
              <button
                type="button"
                onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                style={{
                  padding: '4px 12px',
                  backgroundColor: autoSaveEnabled ? PALETTE.green : PALETTE.bgLight,
                  color: autoSaveEnabled ? PALETTE.black : PALETTE.textDim,
                  border: `2px solid ${autoSaveEnabled ? PALETTE.green : PALETTE.panelLight}`,
                  fontFamily: "'Press Start 2P', cursive",
                  fontSize: '8px',
                  cursor: 'pointer',
                }}
              >
                {autoSaveEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </PixelPanel>
      </div>

      {/* Row 2: Office Upgrade + Loan Management */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Office Upgrade */}
        <PixelPanel title="Office Upgrade">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={vtFont}>
              <span style={{ color: PALETTE.textDim }}>Current Level: </span>
              <span style={{ color: PALETTE.gold }}>{company.officeLevel}</span>
            </div>
            <div style={vtFont}>
              <span style={{ color: PALETTE.textDim }}>Max Employees: </span>
              <span style={{ color: PALETTE.cyan }}>{currentMaxEmployees}</span>
            </div>
            <div style={vtFont}>
              <span style={{ color: PALETTE.textDim }}>Monthly Rent: </span>
              <span style={{ color: PALETTE.red }}>
                {formatCurrency(CONFIG.OFFICE_COSTS[company.officeLevel] ?? 0)}
              </span>
            </div>
            {canUpgradeOffice ? (
              <>
                <div
                  style={{
                    ...vtFont,
                    fontSize: '14px',
                    backgroundColor: PALETTE.bgLight,
                    padding: '8px',
                    border: `1px solid ${PALETTE.panelLight}`,
                  }}
                >
                  <div>
                    Next Level: {nextOfficeLevel} (Max Employees: {nextMaxEmployees})
                  </div>
                  <div>
                    Upgrade Cost:{' '}
                    <span style={{ color: PALETTE.gold }}>{formatCurrency(officeCost)}</span>
                  </div>
                </div>
                <PixelButton
                  variant={canAffordUpgrade ? 'success' : 'disabled'}
                  onClick={() => {
                    if (canAffordUpgrade) {
                      upgradeOffice();
                      showToast('Office upgraded!');
                    }
                  }}
                >
                  {canAffordUpgrade ? 'UPGRADE OFFICE' : 'CANNOT AFFORD'}
                </PixelButton>
              </>
            ) : (
              <div style={{ ...vtFont, color: PALETTE.gold }}>Max office level reached!</div>
            )}
          </div>
        </PixelPanel>

        {/* Loan Management */}
        <PixelPanel title="Loan Management">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={vtFont}>
              <span style={{ color: PALETTE.textDim }}>Outstanding Loans: </span>
              <span style={{ color: company.totalLoans > 0 ? PALETTE.red : PALETTE.green }}>
                {formatCurrency(company.totalLoans)}
              </span>
            </div>
            <div style={vtFont}>
              <span style={{ color: PALETTE.textDim }}>Interest Rate: </span>
              <span>{(company.loanInterestRate * 100).toFixed(1)}% annually</span>
            </div>
            <div style={vtFont}>
              <span style={{ color: PALETTE.textDim }}>Max Additional Loan: </span>
              <span style={{ color: PALETTE.cyan }}>{formatCurrency(maxLoan)}</span>
            </div>
            <div style={{ ...vtFont, fontSize: '14px', color: PALETTE.textDim }}>
              Max loan = 2x net worth ({formatCurrency(netWorth)})
            </div>

            {/* Take Loan */}
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <input
                type="number"
                min="0"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                style={{
                  flex: 1,
                  padding: '4px',
                  backgroundColor: PALETTE.bg,
                  color: PALETTE.text,
                  border: `2px solid ${PALETTE.panelLight}`,
                  fontFamily: "'VT323', monospace",
                  fontSize: '16px',
                }}
              />
              <PixelButton
                variant={
                  parseInt(loanAmount, 10) > 0 && parseInt(loanAmount, 10) <= maxLoan
                    ? 'success'
                    : 'disabled'
                }
                onClick={() => {
                  const amt = parseInt(loanAmount, 10);
                  if (amt > 0 && amt <= maxLoan) {
                    takeLoan(amt);
                    showToast(`Loan of ${formatCurrency(amt)} taken!`);
                  }
                }}
              >
                BORROW
              </PixelButton>
            </div>

            {/* Repay Loan */}
            {company.totalLoans > 0 && (
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <input
                  type="number"
                  min="0"
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '4px',
                    backgroundColor: PALETTE.bg,
                    color: PALETTE.text,
                    border: `2px solid ${PALETTE.panelLight}`,
                    fontFamily: "'VT323', monospace",
                    fontSize: '16px',
                  }}
                />
                <PixelButton
                  variant={
                    parseInt(repayAmount, 10) > 0 &&
                    parseInt(repayAmount, 10) <= Math.min(company.totalLoans, company.cash)
                      ? 'warning'
                      : 'disabled'
                  }
                  onClick={() => {
                    const amt = parseInt(repayAmount, 10);
                    if (amt > 0) {
                      repayLoan(amt);
                      showToast('Loan repaid!');
                    }
                  }}
                >
                  REPAY
                </PixelButton>
              </div>
            )}
          </div>
        </PixelPanel>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Statistics */}
        <PixelPanel title="Lifetime Statistics">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { label: 'Total Trades Made', value: String(statistics.totalTradesMade) },
              {
                label: 'Total Profit Earned',
                value: formatCurrency(statistics.totalProfitEarned),
                color: PALETTE.green,
              },
              {
                label: 'Total Loss Incurred',
                value: formatCurrency(statistics.totalLossIncurred),
                color: PALETTE.red,
              },
              {
                label: 'Largest Single Trade',
                value: formatCurrency(statistics.largestSingleTrade),
              },
              { label: 'Employees Hired', value: String(statistics.employeesHired) },
              { label: 'Employees Fired', value: String(statistics.employeesFired) },
              { label: 'Events Encountered', value: String(statistics.eventsEncountered) },
              {
                label: 'Best Month Profit',
                value: formatCurrency(statistics.bestMonthProfit),
                color: PALETTE.green,
              },
              {
                label: 'Worst Month Loss',
                value: formatCurrency(statistics.worstMonthLoss),
                color: PALETTE.red,
              },
              { label: 'Play Time', value: `${totalPlayMinutes} minutes` },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  ...vtFont,
                  fontSize: '18px',
                }}
              >
                <span style={{ color: PALETTE.textDim }}>{stat.label}:</span>
                <span style={{ color: stat.color ?? PALETTE.text }}>{stat.value}</span>
              </div>
            ))}
          </div>
        </PixelPanel>

        {/* About + Achievements */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <PixelPanel title="Achievements">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {statistics.achievements.length > 0 ? (
                statistics.achievements.map((ach) => (
                  <div
                    key={ach}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '4px 8px',
                      backgroundColor: PALETTE.bgLight,
                      border: `1px solid ${PALETTE.gold}`,
                    }}
                  >
                    <span style={{ fontSize: '18px', color: PALETTE.gold }}>*</span>
                    <span style={{ ...vtFont, fontSize: '16px', color: PALETTE.gold }}>
                      {getAchievementName(ach)}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ ...vtFont, fontSize: '16px', color: PALETTE.textDim }}>
                  No achievements unlocked yet. Keep playing!
                </div>
              )}
            </div>
          </PixelPanel>

          <PixelPanel title="About">
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: "'Press Start 2P', cursive",
                  fontSize: '14px',
                  color: PALETTE.gold,
                }}
              >
                Trading Tycoon
              </div>
              <div style={{ ...vtFont, color: PALETTE.textDim }}>Version 1.0.0</div>
              <div style={{ ...vtFont, fontSize: '16px', color: PALETTE.textDim }}>
                A pixel-art trading company tycoon game. Build your financial empire from the ground
                up.
              </div>
              <div
                style={{ ...vtFont, fontSize: '14px', color: PALETTE.textDim, marginTop: '8px' }}
              >
                Built with React + Zustand + uPlot
              </div>
            </div>
          </PixelPanel>
        </div>
      </div>

      {/* Load Confirmation Modal */}
      <Modal
        isOpen={showLoadConfirm}
        onClose={() => setShowLoadConfirm(false)}
        title="Load Game"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={vtFont}>This will overwrite your current game. Are you sure?</p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <PixelButton variant="primary" onClick={() => setShowLoadConfirm(false)}>
              Cancel
            </PixelButton>
            <PixelButton variant="warning" onClick={handleLoad}>
              Load
            </PixelButton>
          </div>
        </div>
      </Modal>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        title="Reset Game"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={vtFont}>
            This will delete ALL progress and start a new game. Are you sure?
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <PixelButton variant="primary" onClick={() => setShowResetConfirm(false)}>
              Cancel
            </PixelButton>
            <PixelButton
              variant="error"
              onClick={() => {
                setShowResetConfirm(false);
                setShowResetDoubleConfirm(true);
              }}
            >
              Yes, Reset
            </PixelButton>
          </div>
        </div>
      </Modal>

      {/* Double Confirmation */}
      <Modal
        isOpen={showResetDoubleConfirm}
        onClose={() => setShowResetDoubleConfirm(false)}
        title="Are You SURE?"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ ...vtFont, color: PALETTE.red }}>
            This action is IRREVERSIBLE. All save data will be permanently deleted.
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <PixelButton variant="primary" onClick={() => setShowResetDoubleConfirm(false)}>
              Cancel
            </PixelButton>
            <PixelButton variant="error" onClick={handleReset}>
              DELETE EVERYTHING
            </PixelButton>
          </div>
        </div>
      </Modal>

      {/* Import Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Save"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={vtFont}>Paste your exported save data below:</p>
          <textarea
            value={importData}
            onChange={(e) => setImportData(e.target.value)}
            rows={5}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: PALETTE.bg,
              color: PALETTE.text,
              border: `2px solid ${PALETTE.panelLight}`,
              fontFamily: "'VT323', monospace",
              fontSize: '14px',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
            placeholder="Paste base64 save data here..."
          />
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <PixelButton variant="primary" onClick={() => setShowImportModal(false)}>
              Cancel
            </PixelButton>
            <PixelButton variant="success" onClick={handleImport}>
              Import
            </PixelButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
