// Main Zustand store — the single source of truth for all game state + actions

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';

import type {
  GameState,
  RevenueStreamId,
  StorytellerMode,
  ActiveRevenueStream,
  MonthlyReport,
} from '../types/index.ts';

import { CONFIG } from '../data/config.ts';
import { ASSET_DEFINITIONS } from '../data/assets.ts';
import { REVENUE_STREAM_DEFINITIONS } from '../data/revenue.ts';
import { EVENT_TEMPLATES } from '../data/events.ts';

import { createRNG } from '../utils/random.ts';
import {
  saveToLocalStorage,
  loadFromLocalStorage,
  exportSave as exportSaveFn,
  importSave as importSaveFn,
} from '../utils/save.ts';
import { migrateState } from './migrations.ts';

import { tickMarket, initializeMarketState } from '../engine/market/priceEngine.ts';
import {
  tickEvents,
  applyEventTickResult,
  resolvePlayerChoice,
} from '../engine/events/eventEngine.ts';
import { tickEmployees } from '../engine/employees/departmentManager.ts';
import {
  refreshHiringPool,
  shouldRefreshHiringPool,
} from '../engine/employees/employeeGenerator.ts';
import {
  calculateHiringCost,
  calculateFiringCost,
} from '../engine/employees/hiringCosts.ts';
import type { HiringChannel } from '../engine/employees/hiringCosts.ts';
import { tickRevenue } from '../engine/revenue/revenueEngine.ts';
import { executeTrade } from '../engine/revenue/portfolioManager.ts';
import { selectNetWorth, selectActiveStreamCount } from './selectors.ts';
import { generateEmployee } from '../engine/employees/employeeGenerator.ts';

// ────────────────────────────────────────────────────────────
// Store interface
// ────────────────────────────────────────────────────────────

export interface GameStore extends GameState {
  // Time
  setSpeed(speed: 0 | 1 | 2 | 5): void;
  togglePause(): void;
  tick(): void;

  // Trading
  executeBuy(assetId: string, quantity: number): void;
  executeSell(assetId: string, quantity: number): void;

  // Employees
  hireEmployee(employeeId: string, source: 'campus' | 'jobMarket' | 'headhunter'): void;
  fireEmployee(employeeId: string): void;
  assignToDepartment(employeeId: string, departmentId: string): void;
  setWorkIntensity(departmentId: string, intensity: number): void;
  setDepartmentHead(departmentId: string, employeeId: string): void;

  // Revenue
  activateRevenueStream(streamId: RevenueStreamId): void;
  deactivateRevenueStream(streamId: RevenueStreamId): void;

  // Events
  resolveEvent(eventId: string, choiceIndex: number): void;

  // Company
  takeLoan(amount: number): void;
  repayLoan(amount: number): void;
  upgradeOffice(): void;

  // Upgrades
  purchaseUpgrade(upgradeId: string): void;

  // Save/Load
  saveGame(): void;
  loadGame(): boolean;
  resetGame(): void;
  exportSave(): string;
  importSave(data: string): boolean;

  // Settings
  setStorytellerMode(mode: StorytellerMode): void;

  // Company
  setCompanyName(name: string): void;

  // UI
  setActiveScreen(screen: string): void;
  setSelectedAsset(assetId: string | null): void;
  setSelectedEmployee(employeeId: string | null): void;
  setShowEventPopup(show: boolean): void;
  setTutorialSeen(screen: string): void;
  setCrtEnabled(enabled: boolean): void;
  setNewGameModalShown(): void;
  initializeNewGame(companyName: string): void;

  // Achievements
  checkAchievements(): string[];
}

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

/** Map the store's hiring source names to the engine's HiringChannel type. */
function toHiringChannel(source: 'campus' | 'jobMarket' | 'headhunter'): HiringChannel {
  switch (source) {
    case 'campus':
      return 'campus';
    case 'jobMarket':
      return 'job_market';
    case 'headhunter':
      return 'headhunter';
  }
}

/** Module-level RNG for the game. Re-created on reset/load. */
let rng = createRNG(Date.now());

/** Timestamp of last autosave (in real seconds since game started). */
let lastAutosaveTime = 0;

// ────────────────────────────────────────────────────────────
// Initial state factory
// ────────────────────────────────────────────────────────────

export function createInitialState(): GameState {
  rng = createRNG(Date.now());

  const marketState = initializeMarketState(ASSET_DEFINITIONS, rng);

  // Build revenue streams record with brokerage unlocked and active
  const revenueStreams = {} as Record<RevenueStreamId, ActiveRevenueStream>;
  for (const def of REVENUE_STREAM_DEFINITIONS) {
    revenueStreams[def.id] = {
      id: def.id,
      unlocked: def.id === 'brokerage',
      active: def.id === 'brokerage',
      level: 1,
      assignedEmployeeIds: [],
      performance: 0,
    };
  }

  return {
    meta: {
      saveVersion: 1,
      totalPlayTime: 0,
      saveTimestamp: Date.now(),
    },
    time: {
      day: 1,
      speed: 1,
      tickCount: 0,
      isPaused: false,
    },
    company: {
      name: 'Trading Tycoon Inc.',
      cash: CONFIG.STARTING_CASH,
      reputation: 10,
      monthlyRevenue: 0,
      monthlyExpenses: 0,
      totalLoans: 0,
      loanInterestRate: CONFIG.LOAN_INTEREST_RATE,
      officeLevel: 0,
      financialHistory: [],
      consecutiveNegativeCashMonths: 0,
      gameOver: false,
    },
    market: marketState,
    employees: {},
    departments: {
      general: {
        id: 'general',
        name: 'General',
        employeeIds: [],
        workIntensity: 50,
      },
    },
    hiringPool: {
      campus: [],
      jobMarket: [],
      headhunter: [],
    },
    revenueStreams,
    portfolio: {
      positions: {},
      tradeHistory: [],
      totalInvested: 0,
      totalRealized: 0,
    },
    events: {
      active: [],
      history: [],
      cooldowns: {},
    },
    upgrades: {},
    statistics: {
      totalTradesMade: 0,
      totalProfitEarned: 0,
      totalLossIncurred: 0,
      largestSingleTrade: 0,
      employeesHired: 0,
      employeesFired: 0,
      eventsEncountered: 0,
      bestMonthProfit: 0,
      worstMonthLoss: 0,
      achievements: [],
    },
    ui: {
      activeScreen: 'dashboard',
      showEventPopup: false,
      selectedAssetId: null,
      selectedEmployeeId: null,
      tutorialSeen: {},
      crtEnabled: false,
      newGameModalShown: false,
    },
  };
}

// ────────────────────────────────────────────────────────────
// Store creation
// ────────────────────────────────────────────────────────────

export const useGameStore = create<GameStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      ...createInitialState(),

      // ─── Time ────────────────────────────────────────────
      setSpeed(speed: 0 | 1 | 2 | 5) {
        set((s) => {
          s.time.speed = speed;
          if (speed === 0) {
            s.time.isPaused = true;
          } else {
            s.time.isPaused = false;
          }
        });
      },

      togglePause() {
        set((s) => {
          s.time.isPaused = !s.time.isPaused;
        });
      },

      // ─── THE TICK — heartbeat of the game ────────────────
      tick() {
        set((s) => {
          // Don't tick if game is over
          if (s.company.gameOver) return;

          // 1. Increment day and tick count
          s.time.day += 1;
          s.time.tickCount += 1;

          // Snapshot the state as a plain object for engine functions
          // that expect an immutable GameState.
          // Note: within immer `s` is a draft; we use get() for
          // read-only engine calls that must not mutate.
          const readState = get() as GameState;

          // 2. Market tick — update all asset prices
          const newMarket = tickMarket(readState.market, ASSET_DEFINITIONS, rng);
          s.market.assets = newMarket.assets;
          s.market.globalRegime = newMarket.globalRegime;
          s.market.regimeDaysRemaining = newMarket.regimeDaysRemaining;
          s.market.correlationMatrix = newMarket.correlationMatrix;

          // 3. Events tick — new events, auto-resolve, chains
          // Build a fresh snapshot with updated market for event processing
          const stateForEvents: GameState = {
            ...readState,
            time: { ...readState.time, day: s.time.day, tickCount: s.time.tickCount },
            market: newMarket,
          };
          const eventResult = tickEvents(stateForEvents, EVENT_TEMPLATES, rng);
          const stateAfterEvents = applyEventTickResult(
            stateForEvents,
            eventResult,
            EVENT_TEMPLATES,
          );

          // Merge event changes back into draft
          s.events.active = stateAfterEvents.events.active;
          s.events.history = stateAfterEvents.events.history;
          s.events.cooldowns = stateAfterEvents.events.cooldowns;
          s.statistics.eventsEncountered = stateAfterEvents.statistics.eventsEncountered;

          // Apply company/employee/market patches from event resolution
          if (stateAfterEvents.company.cash !== readState.company.cash) {
            s.company.cash = stateAfterEvents.company.cash;
          }
          if (stateAfterEvents.company.reputation !== readState.company.reputation) {
            s.company.reputation = stateAfterEvents.company.reputation;
          }
          // Merge employee morale changes from events
          for (const empId of Object.keys(stateAfterEvents.employees)) {
            if (s.employees[empId]) {
              s.employees[empId].morale = stateAfterEvents.employees[empId].morale;
            }
          }

          // 4. Employee tick — XP, burnout, morale, level ups, quits
          const empReadState: GameState = {
            ...readState,
            time: { ...readState.time, day: s.time.day, tickCount: s.time.tickCount },
            company: { ...s.company },
            employees: { ...s.employees },
            departments: { ...s.departments },
            statistics: { ...s.statistics },
          };
          const empResult = tickEmployees(empReadState, rng);
          if (empResult.employees) {
            s.employees = empResult.employees;
          }
          if (empResult.departments) {
            s.departments = empResult.departments;
          }
          if (empResult.statistics) {
            s.statistics = {
              ...s.statistics,
              ...empResult.statistics,
            };
          }

          // 5. Monthly processing (every 30 ticks)
          if (s.time.tickCount % CONFIG.DAYS_PER_MONTH === 0) {
            // Revenue tick
            const revenueReadState: GameState = {
              ...readState,
              time: { ...readState.time, day: s.time.day, tickCount: s.time.tickCount },
              company: { ...s.company },
              employees: { ...s.employees },
              departments: { ...s.departments },
              market: newMarket,
              revenueStreams: { ...s.revenueStreams },
              portfolio: { ...s.portfolio },
              events: { ...s.events },
              upgrades: { ...s.upgrades },
              statistics: { ...s.statistics },
              meta: { ...s.meta },
              hiringPool: { ...s.hiringPool },
            };
            const revenueResult = tickRevenue(revenueReadState, rng);

            // Add revenue to cash
            s.company.cash += revenueResult.totalRevenue;
            s.company.monthlyRevenue = revenueResult.totalRevenue;

            // Deduct monthly expenses
            let totalExpenses = 0;

            // Salaries
            for (const empId of Object.keys(s.employees)) {
              totalExpenses += s.employees[empId].salary;
            }

            // Office rent
            const officeLevel = s.company.officeLevel;
            if (officeLevel >= 0 && officeLevel < CONFIG.OFFICE_COSTS.length) {
              totalExpenses += CONFIG.OFFICE_COSTS[officeLevel];
            }

            // Loan interest (monthly)
            if (s.company.totalLoans > 0) {
              const monthlyInterest =
                s.company.totalLoans * (s.company.loanInterestRate / 12);
              totalExpenses += monthlyInterest;
            }

            s.company.cash -= totalExpenses;
            s.company.monthlyExpenses = totalExpenses;

            // Record monthly report
            const monthNumber = Math.floor(s.time.tickCount / CONFIG.DAYS_PER_MONTH);
            const profit = revenueResult.totalRevenue - totalExpenses;

            const report: MonthlyReport = {
              month: monthNumber,
              revenue: revenueResult.totalRevenue,
              expenses: totalExpenses,
              profit,
              revenueByStream: revenueResult.revenueByStream,
            };
            s.company.financialHistory.push(report);

            // Trim financial history
            if (s.company.financialHistory.length > CONFIG.MAX_FINANCIAL_HISTORY) {
              s.company.financialHistory = s.company.financialHistory.slice(
                s.company.financialHistory.length - CONFIG.MAX_FINANCIAL_HISTORY,
              );
            }

            // Update statistics
            if (profit > s.statistics.bestMonthProfit) {
              s.statistics.bestMonthProfit = profit;
            }
            if (profit < 0 && Math.abs(profit) > s.statistics.worstMonthLoss) {
              s.statistics.worstMonthLoss = Math.abs(profit);
            }

            // Bankruptcy check: if cash < 0 for 3 consecutive months, game over
            if (s.company.cash < 0) {
              s.company.consecutiveNegativeCashMonths += 1;
              if (s.company.consecutiveNegativeCashMonths > CONFIG.BANKRUPTCY_MONTHS) {
                s.company.gameOver = true;
                s.time.isPaused = true;
              }
            } else {
              s.company.consecutiveNegativeCashMonths = 0;
            }

            // Check achievements after monthly processing
            const achievementState = get() as GameState;
            const newAchievements = checkAchievementsHelper(achievementState, s.statistics.achievements);
            for (const ach of newAchievements) {
              if (!s.statistics.achievements.includes(ach)) {
                s.statistics.achievements.push(ach);
              }
            }
          }

          // 7. Refresh hiring pool if stale (every 30 ticks)
          if (s.time.tickCount % CONFIG.DAYS_PER_MONTH === 0) {
            const poolCheckState: GameState = {
              ...readState,
              time: { ...readState.time, day: s.time.day, tickCount: s.time.tickCount },
              company: { ...s.company },
              hiringPool: { ...s.hiringPool },
              upgrades: { ...s.upgrades },
            };
            if (shouldRefreshHiringPool(poolCheckState)) {
              s.hiringPool = refreshHiringPool(poolCheckState, rng);
            }
          }

          // 8. Autosave check
          const now = performance.now() / 1000;
          if (now - lastAutosaveTime >= CONFIG.AUTOSAVE_INTERVAL_SECONDS) {
            lastAutosaveTime = now;
            // Update meta before saving
            s.meta.saveTimestamp = Date.now();
            s.meta.totalPlayTime += CONFIG.AUTOSAVE_INTERVAL_SECONDS;
            // Save outside immer to avoid draft issues
            try {
              const snapshot = get();
              setTimeout(() => saveToLocalStorage(snapshot as GameState), 0);
            } catch (error) {
              console.warn('Autosave failed:', error);
            }
          }
        });
      },

      // ─── Trading ─────────────────────────────────────────
      executeBuy(assetId: string, quantity: number) {
        set((s) => {
          const state = get() as GameState;
          const result = executeTrade(state, assetId, 'buy', quantity);
          s.company.cash = result.company.cash;
          s.portfolio = result.portfolio;
          s.statistics = result.statistics;

          // Check achievements after trade
          const newAchievements = checkAchievementsHelper(result, s.statistics.achievements);
          for (const ach of newAchievements) {
            if (!s.statistics.achievements.includes(ach)) {
              s.statistics.achievements.push(ach);
            }
          }
        });
      },

      executeSell(assetId: string, quantity: number) {
        set((s) => {
          const state = get() as GameState;
          const result = executeTrade(state, assetId, 'sell', quantity);
          s.company.cash = result.company.cash;
          s.portfolio = result.portfolio;
          s.statistics = result.statistics;

          // Check achievements after trade
          const newAchievements = checkAchievementsHelper(result, s.statistics.achievements);
          for (const ach of newAchievements) {
            if (!s.statistics.achievements.includes(ach)) {
              s.statistics.achievements.push(ach);
            }
          }
        });
      },

      // ─── Employees ───────────────────────────────────────
      hireEmployee(employeeId: string, source: 'campus' | 'jobMarket' | 'headhunter') {
        set((s) => {
          // Find employee in hiring pool
          const poolKey = source === 'jobMarket' ? 'jobMarket' : source;
          const pool = s.hiringPool[poolKey];
          const empIndex = pool.findIndex((e) => e.id === employeeId);
          if (empIndex === -1) return;

          const employee = pool[empIndex];

          // Check office capacity
          const currentEmployeeCount = Object.keys(s.employees).length;
          const maxEmployees = CONFIG.OFFICE_MAX_EMPLOYEES[s.company.officeLevel] ?? 10;
          if (currentEmployeeCount >= maxEmployees) return;

          // Calculate hiring cost
          const channel = toHiringChannel(source);
          const cost = calculateHiringCost(employee, channel);

          // Check if can afford
          if (s.company.cash < cost.total) return;

          // Deduct cost
          s.company.cash -= cost.total;

          // Deduct reputation cost if any
          if (cost.reputationCost > 0) {
            s.company.reputation = Math.max(0, s.company.reputation - cost.reputationCost);
          }

          // Add employee to company
          const hiredEmployee = { ...employee };
          hiredEmployee.hiredOnDay = s.time.day;
          hiredEmployee.departmentId = 'general';
          s.employees[hiredEmployee.id] = hiredEmployee;

          // Add to general department
          if (s.departments.general) {
            s.departments.general.employeeIds.push(hiredEmployee.id);
          }

          // Remove from hiring pool
          pool.splice(empIndex, 1);

          // Update statistics
          s.statistics.employeesHired += 1;
        });
      },

      fireEmployee(employeeId: string) {
        set((s) => {
          const employee = s.employees[employeeId];
          if (!employee) return;

          // Calculate firing cost
          const cost = calculateFiringCost(employee);

          // Check if player can afford the firing cost
          if (s.company.cash < cost.total) return;

          s.company.cash -= cost.total;

          // Remove from department
          const deptId = employee.departmentId;
          if (deptId && s.departments[deptId]) {
            s.departments[deptId].employeeIds = s.departments[deptId].employeeIds.filter(
              (id) => id !== employeeId,
            );
            if (s.departments[deptId].headId === employeeId) {
              s.departments[deptId].headId = undefined;
            }
          }

          // Remove from revenue stream assignments
          for (const streamId of Object.keys(s.revenueStreams) as RevenueStreamId[]) {
            const stream = s.revenueStreams[streamId];
            stream.assignedEmployeeIds = stream.assignedEmployeeIds.filter(
              (id) => id !== employeeId,
            );
          }

          // Remove employee
          delete s.employees[employeeId];

          // Update statistics
          s.statistics.employeesFired += 1;
        });
      },

      assignToDepartment(employeeId: string, departmentId: string) {
        set((s) => {
          const employee = s.employees[employeeId];
          if (!employee) return;
          if (!s.departments[departmentId]) return;

          // Remove from current department
          const currentDeptId = employee.departmentId;
          if (currentDeptId && s.departments[currentDeptId]) {
            s.departments[currentDeptId].employeeIds = s.departments[
              currentDeptId
            ].employeeIds.filter((id) => id !== employeeId);
            if (s.departments[currentDeptId].headId === employeeId) {
              s.departments[currentDeptId].headId = undefined;
            }
          }

          // Add to new department
          s.employees[employeeId].departmentId = departmentId;
          s.departments[departmentId].employeeIds.push(employeeId);
        });
      },

      setWorkIntensity(departmentId: string, intensity: number) {
        set((s) => {
          if (!s.departments[departmentId]) return;
          s.departments[departmentId].workIntensity = Math.max(0, Math.min(100, intensity));
        });
      },

      setDepartmentHead(departmentId: string, employeeId: string) {
        set((s) => {
          if (!s.departments[departmentId]) return;
          if (!s.employees[employeeId]) return;
          s.departments[departmentId].headId = employeeId;
        });
      },

      // ─── Revenue ─────────────────────────────────────────
      activateRevenueStream(streamId: RevenueStreamId) {
        set((s) => {
          const stream = s.revenueStreams[streamId];
          if (!stream || !stream.unlocked) return;
          stream.active = true;
        });
      },

      deactivateRevenueStream(streamId: RevenueStreamId) {
        set((s) => {
          const stream = s.revenueStreams[streamId];
          if (!stream) return;
          stream.active = false;
        });
      },

      // ─── Events ──────────────────────────────────────────
      resolveEvent(eventId: string, choiceIndex: number) {
        set((s) => {
          // Validate choiceIndex before proceeding
          const activeEvt = s.events.active.find((e) => e.id === eventId && !e.resolved);
          if (!activeEvt) return;
          const tmpl = EVENT_TEMPLATES.find((t) => t.id === activeEvt.templateId);
          if (!tmpl || choiceIndex < 0 || choiceIndex >= tmpl.choices.length) return;

          // Build a read-only snapshot from the immer draft instead of get()
          // to avoid stale state issues
          const state: GameState = {
            meta: { ...s.meta },
            time: { ...s.time },
            company: { ...s.company },
            market: { assets: { ...s.market.assets }, globalRegime: s.market.globalRegime, regimeDaysRemaining: s.market.regimeDaysRemaining, correlationMatrix: s.market.correlationMatrix, storytellerMode: s.market.storytellerMode },
            employees: { ...s.employees },
            departments: { ...s.departments },
            hiringPool: { ...s.hiringPool },
            revenueStreams: { ...s.revenueStreams },
            portfolio: { ...s.portfolio },
            events: { active: [...s.events.active], history: [...s.events.history], cooldowns: { ...s.events.cooldowns } },
            upgrades: { ...s.upgrades },
            statistics: { ...s.statistics },
            ui: { ...s.ui },
          };
          const result = resolvePlayerChoice(
            state,
            eventId,
            choiceIndex,
            EVENT_TEMPLATES,
            rng,
          );
          if (!result) return;

          // Update the active event to resolved
          const activeIdx = s.events.active.findIndex((e) => e.id === eventId);
          if (activeIdx !== -1) {
            s.events.active.splice(activeIdx, 1);
          }

          // Add resolved event to history
          s.events.history.push(result.resolvedEvent);

          // Add chain events to active
          for (const chainEvent of result.chainEvents) {
            s.events.active.push(chainEvent);
            s.events.cooldowns[chainEvent.templateId] = s.time.day;
          }

          // Apply the state patch
          const patch = result.statePatch;
          if (patch.company) {
            if (patch.company.cash !== undefined) s.company.cash = patch.company.cash;
            if (patch.company.reputation !== undefined)
              s.company.reputation = patch.company.reputation;
          }
          if (patch.employees) {
            for (const empId of Object.keys(patch.employees)) {
              if (s.employees[empId] && patch.employees[empId]) {
                s.employees[empId] = patch.employees[empId];
              }
            }
          }
          if (patch.market?.assets) {
            for (const assetId of Object.keys(patch.market.assets)) {
              if (s.market.assets[assetId]) {
                s.market.assets[assetId] = patch.market.assets[assetId];
              }
            }
          }
          if (patch.revenueStreams) {
            for (const streamId of Object.keys(patch.revenueStreams) as RevenueStreamId[]) {
              if (s.revenueStreams[streamId] && patch.revenueStreams[streamId]) {
                s.revenueStreams[streamId] = patch.revenueStreams[streamId];
              }
            }
          }
        });
      },

      // ─── Company ─────────────────────────────────────────
      takeLoan(amount: number) {
        set((s) => {
          if (amount <= 0) return;
          // Max loan = 2x net worth
          const state = get() as GameState;
          const netWorth = selectNetWorth(state);
          const maxLoan = Math.max(0, netWorth * 2 - s.company.totalLoans);
          const actualAmount = Math.min(amount, maxLoan);
          if (actualAmount <= 0) return;
          s.company.totalLoans += actualAmount;
          s.company.cash += actualAmount;
        });
      },

      repayLoan(amount: number) {
        set((s) => {
          if (amount <= 0) return;
          const repayAmount = Math.min(amount, s.company.totalLoans, s.company.cash);
          s.company.totalLoans -= repayAmount;
          s.company.cash -= repayAmount;
        });
      },

      upgradeOffice() {
        set((s) => {
          const nextLevel = s.company.officeLevel + 1;
          if (nextLevel >= CONFIG.OFFICE_MAX_EMPLOYEES.length) return;

          // Office upgrade cost from dedicated upgrade costs array
          const costIndex = nextLevel - 1;
          if (costIndex < 0 || costIndex >= CONFIG.OFFICE_UPGRADE_COSTS.length) return;
          const upgradeCost = CONFIG.OFFICE_UPGRADE_COSTS[costIndex];
          if (s.company.cash < upgradeCost) return;

          s.company.cash -= upgradeCost;
          s.company.officeLevel = nextLevel;
        });
      },

      // ─── Upgrades ────────────────────────────────────────
      purchaseUpgrade(upgradeId: string) {
        set((s) => {
          const upgrade = s.upgrades[upgradeId];
          if (!upgrade) return;
          if (upgrade.purchased) return;

          // Check prerequisites
          if (upgrade.requires) {
            for (const reqId of upgrade.requires) {
              const req = s.upgrades[reqId];
              if (!req || !req.purchased) return;
            }
          }

          if (s.company.cash < upgrade.cost) return;

          s.company.cash -= upgrade.cost;
          s.upgrades[upgradeId].purchased = true;
        });
      },

      // ─── Save / Load ────────────────────────────────────
      saveGame() {
        const state = get();
        const gameState: GameState = {
          meta: { ...state.meta, saveTimestamp: Date.now() },
          time: state.time,
          company: state.company,
          market: state.market,
          employees: state.employees,
          departments: state.departments,
          hiringPool: state.hiringPool,
          revenueStreams: state.revenueStreams,
          portfolio: state.portfolio,
          events: state.events,
          upgrades: state.upgrades,
          statistics: state.statistics,
          ui: state.ui,
        };
        saveToLocalStorage(gameState);
      },

      loadGame(): boolean {
        const loaded = loadFromLocalStorage();
        if (!loaded) return false;

        try {
          const migrated = migrateState(loaded);
          rng = createRNG(Date.now());
          set(migrated);
          return true;
        } catch {
          return false;
        }
      },

      resetGame() {
        const initial = createInitialState();
        lastAutosaveTime = performance.now() / 1000;
        set(initial);
      },

      exportSave(): string {
        const state = get();
        const gameState: GameState = {
          meta: { ...state.meta, saveTimestamp: Date.now() },
          time: state.time,
          company: state.company,
          market: state.market,
          employees: state.employees,
          departments: state.departments,
          hiringPool: state.hiringPool,
          revenueStreams: state.revenueStreams,
          portfolio: state.portfolio,
          events: state.events,
          upgrades: state.upgrades,
          statistics: state.statistics,
          ui: state.ui,
        };
        return exportSaveFn(gameState);
      },

      importSave(data: string): boolean {
        try {
          const imported = importSaveFn(data);
          const migrated = migrateState(imported);
          rng = createRNG(Date.now());
          set(migrated);
          return true;
        } catch {
          return false;
        }
      },

      // ─── Settings ────────────────────────────────────────
      setStorytellerMode(mode: StorytellerMode) {
        set((s) => {
          s.market.storytellerMode = mode;
        });
      },

      // ─── Company ─────────────────────────────────────────
      setCompanyName(name: string) {
        set((s) => {
          s.company.name = name.trim() || 'Trading Tycoon Inc.';
        });
      },

      // ─── UI ────────────────────────────────────────────────
      setActiveScreen(screen: string) {
        set((s) => {
          s.ui.activeScreen = screen;
        });
      },

      setSelectedAsset(assetId: string | null) {
        set((s) => {
          s.ui.selectedAssetId = assetId;
        });
      },

      setSelectedEmployee(employeeId: string | null) {
        set((s) => {
          s.ui.selectedEmployeeId = employeeId;
        });
      },

      setShowEventPopup(show: boolean) {
        set((s) => {
          s.ui.showEventPopup = show;
        });
      },

      setTutorialSeen(screen: string) {
        set((s) => {
          s.ui.tutorialSeen[screen] = true;
        });
      },

      setCrtEnabled(enabled: boolean) {
        set((s) => {
          s.ui.crtEnabled = enabled;
        });
      },

      setNewGameModalShown() {
        set((s) => {
          s.ui.newGameModalShown = true;
        });
      },

      initializeNewGame(companyName: string) {
        set((s) => {
          s.company.name = companyName.trim() || 'Trading Tycoon Inc.';
          s.ui.newGameModalShown = true;

          // Generate 2 starting employees: 1 analyst, 1 broker
          const analystEmp = generateEmployee('analyst', 'analyst_level', rng);
          analystEmp.hiredOnDay = 1;
          analystEmp.departmentId = 'general';
          s.employees[analystEmp.id] = analystEmp;

          const brokerEmp = generateEmployee('broker', 'analyst_level', rng);
          brokerEmp.hiredOnDay = 1;
          brokerEmp.departmentId = 'general';
          s.employees[brokerEmp.id] = brokerEmp;

          // Add to general department
          if (s.departments.general) {
            s.departments.general.employeeIds.push(analystEmp.id);
            s.departments.general.employeeIds.push(brokerEmp.id);
          }

          s.statistics.employeesHired = 2;

          // Initialize hiring pool
          const poolState = get() as GameState;
          const poolReadState: GameState = {
            ...poolState,
            company: { ...s.company },
            hiringPool: { ...s.hiringPool },
            upgrades: { ...s.upgrades },
            time: { ...s.time },
          };
          s.hiringPool = refreshHiringPool(poolReadState, rng);
        });
      },

      // ─── Achievements ──────────────────────────────────────
      checkAchievements(): string[] {
        const state = get() as GameState;
        return checkAchievementsHelper(state, state.statistics.achievements);
      },
    })),
  ),
);

// ────────────────────────────────────────────────────────────
// Achievement Definitions & Checker
// ────────────────────────────────────────────────────────────

interface AchievementDef {
  id: string;
  name: string;
  check: (state: GameState) => boolean;
}

const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    id: 'first_trade',
    name: 'First Trade',
    check: (s) => s.statistics.totalTradesMade >= 1,
  },
  {
    id: 'profitable_month',
    name: 'Profitable Month',
    check: (s) => {
      if (s.company.financialHistory.length === 0) return false;
      return s.company.financialHistory.some((r) => r.profit > 0);
    },
  },
  {
    id: 'growing_team',
    name: 'Growing Team',
    check: (s) => s.statistics.employeesHired >= 5,
  },
  {
    id: 'diversified',
    name: 'Diversified',
    check: (s) => selectActiveStreamCount(s) >= 3,
  },
  {
    id: 'market_crash_survivor',
    name: 'Market Crash Survivor',
    check: (s) =>
      s.market.globalRegime === 'bear' && s.company.cash > 0,
  },
  {
    id: 'millionaire',
    name: 'Millionaire',
    check: (s) => selectNetWorth(s) >= 1_000_000,
  },
  {
    id: 'tycoon',
    name: 'Tycoon',
    check: (s) => selectNetWorth(s) >= 10_000_000,
  },
  {
    id: 'full_house',
    name: 'Full House',
    check: (s) => selectActiveStreamCount(s) >= 12,
  },
];

function checkAchievementsHelper(
  state: GameState,
  existingAchievements: string[],
): string[] {
  const newlyUnlocked: string[] = [];
  for (const def of ACHIEVEMENT_DEFS) {
    if (!existingAchievements.includes(def.id) && def.check(state)) {
      newlyUnlocked.push(def.id);
    }
  }
  return newlyUnlocked;
}

/** Public access to achievement names for UI display. */
export function getAchievementName(id: string): string {
  const def = ACHIEVEMENT_DEFS.find((d) => d.id === id);
  return def?.name ?? id;
}
