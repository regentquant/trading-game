# Master Build Prompt — Trading Company Tycoon

Send this entire prompt to Claude Code. It will orchestrate sub-agents to build the complete game from scratch, phase by phase, without manual intervention.

---

## Instructions for Claude Code

You are building a **pixel-art, single-player, browser-based trading company tycoon game**. The game combines the economic depth of Capitalism Lab, market dynamics of Offworld Trading Company, and idle progression of AdVenture Capitalist — all running in React with a retro NES aesthetic.

**Execute the following 10 phases sequentially.** For each phase, spawn a sub-agent using the `Agent` tool (subagent_type: `general-purpose`). Each sub-agent receives a complete, self-contained specification — do NOT summarize or truncate the phase specs below. After each agent completes, verify its work compiled/built without errors by running `cd /Users/curryyao/Desktop/game && npx tsc --noEmit` (skip for Phase 1 until TypeScript is configured). If there are errors, spawn a follow-up agent to fix them before proceeding.

**Critical rules:**
- Execute phases 1 through 10 in order. Do not skip phases. Do not ask for confirmation between phases.
- Each sub-agent must receive the FULL phase specification as written below — copy the entire phase text into the agent prompt.
- After each phase, run a quick build check. Fix any errors before moving on.
- Do NOT load research.md into any sub-agent — all necessary specs are embedded in the phase descriptions below.
- At the end, run the dev server and confirm it starts without errors.

---

## PHASE 1 — Project Scaffolding & Dependencies

**Goal:** Initialize a Vite + React + TypeScript project with all dependencies and folder structure.

**Steps:**

1. Run inside `/Users/curryyao/Desktop/game`:
```bash
npm create vite@latest . -- --template react-ts
```
If the directory is not empty, work around it (use a temp dir and move files, or use `--force` if supported).

2. Install production dependencies:
```bash
npm install zustand immer lz-string nes.css uplot react-window @fontsource/press-start-2p @fontsource/vt323
```

3. Install dev dependencies:
```bash
npm install -D @types/lz-string
```

4. Create this folder structure under `src/`:
```
src/
  components/
    ui/           # Reusable pixel-art UI components (buttons, panels, bars)
    screens/      # Full-page screens (Dashboard, Market, Trading, Employees, Revenue, Events, Settings)
    charts/       # Financial chart components
    layout/       # App shell, navigation, ticker tape
  engine/
    market/       # Price simulation (GBM, regime, mean-reversion, jumps, GARCH, correlation)
    events/       # Event system (storytellers, event families, chaining)
    employees/    # Employee system (hiring, traits, departments, burnout)
    revenue/      # Revenue stream calculations
    tick.ts       # Core tick loop and game loop
  store/
    gameStore.ts  # Main Zustand store
    selectors.ts  # Derived value selectors
    migrations.ts # Save schema migrations
  types/
    index.ts      # All TypeScript type definitions
  data/
    assets.ts     # Asset definitions (stocks, commodities, bonds, crypto, real estate)
    events.ts     # Event templates
    employees.ts  # Employee templates, trait definitions
    revenue.ts    # Revenue stream definitions and unlock requirements
    config.ts     # Game balance constants
  utils/
    math.ts       # Box-Muller, Cholesky decomposition, statistical helpers
    random.ts     # Seeded RNG
    format.ts     # Number/currency/date formatting
    save.ts       # Save/load with LZString compression
  styles/
    global.css    # Global pixel-art styles, NES.css overrides, font imports, CRT overlay
    palette.ts    # Color palette constants
  App.tsx
  main.tsx
```

5. Set up `src/styles/global.css` with:
   - Import `nes.css/css/nes.min.css`
   - Import `@fontsource/press-start-2p` and `@fontsource/vt323`
   - Set `image-rendering: pixelated` and `-moz-crisp-edges` on the root
   - Set `-webkit-font-smoothing: none` on all text
   - Set body font to `'VT323', monospace` at 16px, background to dark navy `#0f0f23`
   - Add CRT scanline overlay on `#app::after` using `linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.25) 50%)` at `background-size: 100% 2px`, `pointer-events: none`, full overlay with `position: fixed; inset: 0; z-index: 9999`
   - Heading font: `'Press Start 2P'` at integer multiples of 8px

6. Set up `src/styles/palette.ts` exporting a PALETTE object:
```ts
export const PALETTE = {
  bg: '#0f0f23',
  bgLight: '#1a1a2e',
  panel: '#16213e',
  panelLight: '#1f3460',
  text: '#e0e0e0',
  textDim: '#7a7a8a',
  green: '#00e676',
  greenDark: '#00a152',
  red: '#ff1744',
  redDark: '#d50000',
  gold: '#ffd740',
  goldDark: '#c8a000',
  blue: '#448aff',
  blueDark: '#1565c0',
  cyan: '#18ffff',
  purple: '#b388ff',
  white: '#ffffff',
  black: '#000000',
} as const;
```

7. Update `src/main.tsx` to import `./styles/global.css` and render `<App />`.

8. Create a minimal `src/App.tsx` that renders a `<div>` with text "Trading Tycoon — Loading..." styled with the pixel font, centered on screen.

9. Verify `npm run dev` starts without errors.

---

## PHASE 2 — Type Definitions & Game Constants

**Goal:** Define all TypeScript types/interfaces and game balance constants that every other system depends on.

**Steps:**

1. Write `src/types/index.ts` with ALL of the following types. Be thorough — every field matters:

```ts
// ===== TIME & META =====
export interface GameMeta {
  saveVersion: number;    // Current: 1
  totalPlayTime: number;  // seconds
  saveTimestamp: number;  // Date.now()
}

export interface GameTime {
  day: number;            // Current game day (starts at 1)
  speed: 0 | 1 | 2 | 5;  // 0=paused, 1=normal, 2=fast, 5=ultra
  tickCount: number;      // Total ticks elapsed
  isPaused: boolean;
}

// ===== MARKET =====
export type AssetClass = 'large_cap' | 'small_cap' | 'crypto' | 'commodity' | 'real_estate' | 'bond';
export type MarketRegime = 'bull' | 'bear' | 'sideways';
export type StorytellerMode = 'steady_growth' | 'calm_markets' | 'volatile';

export interface AssetDefinition {
  id: string;
  name: string;
  ticker: string;
  class: AssetClass;
  sector: string;           // e.g., 'tech', 'energy', 'finance', 'healthcare', 'consumer'
  basePrice: number;
  annualDrift: number;       // mu
  annualVolatility: number;  // sigma
  meanReversionSpeed: number; // theta (0 for non-mean-reverting)
  meanReversionLevel: number; // long-term mean (log price for OU)
  jumpFrequency: number;     // lambda — average jumps per year
  jumpMeanSize: number;      // average jump magnitude
  description: string;
}

export interface AssetState {
  id: string;
  price: number;
  previousPrice: number;
  priceHistory: number[];       // Last 365 daily prices
  monthlyHistory: number[];     // Downsampled monthly averages (max 60)
  volatility: number;           // Current GARCH volatility
  regime: MarketRegime;
  activeShocks: PriceShock[];
}

export interface PriceShock {
  id: string;
  magnitude: number;         // Current remaining magnitude
  initialMagnitude: number;
  decayRate: number;         // Per-tick decay (e.g., 0.05 = 5% decay/tick)
  sourceEventId: string;
}

export interface MarketState {
  assets: Record<string, AssetState>;
  globalRegime: MarketRegime;
  regimeDaysRemaining: number;
  correlationMatrix: number[][];  // Pre-computed, updated on regime change
  storytellerMode: StorytellerMode;
}

// ===== EVENTS =====
export type EventFamily = 'macroeconomic' | 'regulatory' | 'geopolitical' | 'natural_disaster' | 'company_specific' | 'market_structure' | 'industry_disruption';
export type EventSeverity = 'minor' | 'moderate' | 'major' | 'catastrophic';

export interface GameEventTemplate {
  id: string;
  name: string;
  family: EventFamily;
  severity: EventSeverity;
  description: string;
  choices: EventChoice[];
  baseWeight: number;
  cooldownDays: number;
  affectedSectors: string[];
  affectedAssetClasses: AssetClass[];
  priceImpact: { min: number; max: number };   // Percentage shock range
  chainEvents?: string[];                        // IDs of events this can trigger
  requiresProgression?: number;                  // Minimum game day to appear
}

export interface EventChoice {
  label: string;
  description: string;
  effects: EventEffect[];
}

export interface EventEffect {
  type: 'cash' | 'reputation' | 'employee_morale' | 'market_shock' | 'unlock' | 'client_change';
  target?: string;        // Asset ID, sector, or employee ID
  value: number;
  duration?: number;      // Ticks for temporary effects
}

export interface ActiveEvent {
  id: string;
  templateId: string;
  triggeredOnDay: number;
  choiceMade?: number;    // Index of chosen option
  resolved: boolean;
  chainedFrom?: string;   // Parent event ID
}

// ===== EMPLOYEES =====
export type EmployeeRole = 'trader' | 'analyst' | 'broker' | 'investment_banker' | 'fund_manager' | 'quant' | 'compliance' | 'support';
export type EmployeeLevel = 'analyst_level' | 'associate' | 'vp' | 'director' | 'managing_director';
export type PersonalityTrait = 'risk_taker' | 'conservative' | 'networker' | 'workaholic' | 'quant_mind' | 'silver_tongue' | 'burnout_prone' | 'mentor';

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  level: EmployeeLevel;
  stats: EmployeeStats;
  traits: PersonalityTrait[];
  salary: number;            // Per game-month
  morale: number;            // 0-100
  burnout: number;           // 0-100 (100 = quits)
  experience: number;        // XP toward next level
  hiredOnDay: number;
  departmentId: string;
}

export interface EmployeeStats {
  analytics: number;       // 1-10
  salesmanship: number;
  riskManagement: number;
  quantSkill: number;
  leadership: number;
}

export interface Department {
  id: string;
  name: string;
  employeeIds: string[];
  headId?: string;           // Managing employee
  workIntensity: number;     // 0-100 slider (affects output & burnout)
}

export interface HiringPool {
  campus: Employee[];        // Cheap, low skill, high growth
  jobMarket: Employee[];     // Mid-range, visible stats
  headhunter: Employee[];    // Expensive, high skill
}

// ===== COMPANY =====
export interface Company {
  name: string;
  cash: number;
  reputation: number;        // 0-100
  monthlyRevenue: number;
  monthlyExpenses: number;
  totalLoans: number;
  loanInterestRate: number;
  officeLevel: number;       // 1-5, affects max employees and prestige
  financialHistory: MonthlyReport[];  // Last 24 months
}

export interface MonthlyReport {
  month: number;             // Game day of month start
  revenue: number;
  expenses: number;
  profit: number;
  revenueByStream: Record<string, number>;
}

// ===== REVENUE STREAMS =====
export type RevenueStreamId =
  | 'brokerage' | 'consulting' | 'research'               // Early
  | 'asset_management' | 'market_making' | 'ma_advisory'   // Mid
  | 'lending' | 'wealth_management' | 'real_estate_invest'  // Mid
  | 'ipo_underwriting' | 'prop_trading' | 'insurance';      // Late

export interface RevenueStreamDefinition {
  id: RevenueStreamId;
  name: string;
  description: string;
  phase: 'early' | 'mid' | 'late';
  unlockRequirements: UnlockRequirement[];
  baseRevenue: number;
  riskLevel: number;         // 1-10
  requiredRoles: { role: EmployeeRole; minCount: number; minSkill: number }[];
}

export interface UnlockRequirement {
  type: 'reputation' | 'cash' | 'employee_count' | 'employee_skill' | 'revenue_stream' | 'day';
  target?: string;
  value: number;
}

export interface ActiveRevenueStream {
  id: RevenueStreamId;
  unlocked: boolean;
  active: boolean;
  level: number;             // 1-5, upgradeable
  assignedEmployeeIds: string[];
  performance: number;       // 0-100 current efficiency
  clientCount?: number;      // For client-facing streams
  aum?: number;              // For asset management
}

// ===== PORTFOLIO & TRADING =====
export interface Position {
  assetId: string;
  quantity: number;
  averageCost: number;
  openedOnDay: number;
}

export interface TradeOrder {
  id: string;
  assetId: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  executedOnDay: number;
}

export interface Portfolio {
  positions: Record<string, Position>;
  tradeHistory: TradeOrder[];   // Last 200 trades
  totalInvested: number;
  totalRealized: number;        // Realized P&L
}

// ===== UPGRADES =====
export interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  purchased: boolean;
  effects: Record<string, number>;  // e.g., { tradingSpeedBonus: 0.1 }
  requires?: string[];              // Other upgrade IDs
}

// ===== STATISTICS =====
export interface GameStatistics {
  totalTradesMade: number;
  totalProfitEarned: number;
  totalLossIncurred: number;
  largestSingleTrade: number;
  employeesHired: number;
  employeesFired: number;
  eventsEncountered: number;
  bestMonthProfit: number;
  worstMonthLoss: number;
  achievements: string[];
}

// ===== ROOT STATE =====
export interface GameState {
  meta: GameMeta;
  time: GameTime;
  company: Company;
  market: MarketState;
  employees: Record<string, Employee>;
  departments: Record<string, Department>;
  hiringPool: HiringPool;
  revenueStreams: Record<RevenueStreamId, ActiveRevenueStream>;
  portfolio: Portfolio;
  events: {
    active: ActiveEvent[];
    history: ActiveEvent[];
    cooldowns: Record<string, number>;  // templateId -> day when cooldown expires
  };
  upgrades: Record<string, Upgrade>;
  statistics: GameStatistics;
}
```

2. Write `src/data/config.ts` with game balance constants:

```ts
export const CONFIG = {
  TICKS_PER_SECOND: { 1: 1, 2: 2, 5: 5 } as Record<number, number>,
  MAX_TICKS_PER_FRAME: 10,
  DAYS_PER_MONTH: 30,
  AUTOSAVE_INTERVAL_SECONDS: 60,
  MAX_PRICE_HISTORY: 365,
  MAX_MONTHLY_HISTORY: 60,
  MAX_TRADE_HISTORY: 200,
  MAX_FINANCIAL_HISTORY: 24,

  // Market
  REGIME_DURATION: { bull: { min: 40, max: 100 }, bear: { min: 20, max: 60 }, sideways: { min: 30, max: 80 } },
  REGIME_TRANSITION: {
    bull:     { bull: 0.6, bear: 0.15, sideways: 0.25 },
    bear:     { bull: 0.2, bear: 0.5,  sideways: 0.3  },
    sideways: { bull: 0.35, bear: 0.25, sideways: 0.4  },
  },
  GARCH: {
    large_cap:   { omega: 0.000002, alpha: 0.10, beta: 0.85 },
    small_cap:   { omega: 0.000005, alpha: 0.12, beta: 0.83 },
    crypto:      { omega: 0.00001,  alpha: 0.15, beta: 0.80 },
    commodity:   { omega: 0.000003, alpha: 0.08, beta: 0.87 },
    real_estate: { omega: 0.000001, alpha: 0.05, beta: 0.90 },
    bond:        { omega: 0.0000005, alpha: 0.05, beta: 0.90 },
  },

  // Employees
  SALARY_BY_LEVEL: { analyst_level: 5000, associate: 8000, vp: 12000, director: 18000, managing_director: 30000 },
  XP_TO_LEVEL: { analyst_level: 100, associate: 250, vp: 500, director: 1000, managing_director: Infinity },
  MAX_BURNOUT: 100,
  BURNOUT_QUIT_THRESHOLD: 90,
  BASE_BURNOUT_RATE: 0.5,    // Per day at 50% work intensity
  MORALE_DECAY_RATE: 0.1,

  // Company
  STARTING_CASH: 500000,
  OFFICE_COSTS: [5000, 12000, 25000, 50000, 100000],  // Monthly rent by level
  OFFICE_MAX_EMPLOYEES: [10, 25, 50, 100, 250],
  LOAN_INTEREST_RATE: 0.08,  // Annual

  // Revenue
  BROKERAGE_COMMISSION_RATE: 0.005,
  ASSET_MGMT_FEE: 0.02,
  ASSET_MGMT_PERFORMANCE_FEE: 0.20,
  MARKET_MAKING_SPREAD: 0.002,
} as const;
```

3. Write `src/data/assets.ts` with **20 tradeable assets** across all 6 classes:

Define an array `ASSET_DEFINITIONS: AssetDefinition[]` with:
- **Large Cap (4):** MegaTech Corp (tech, $150), Global Finance Inc (finance, $85), HealthCorp (healthcare, $120), ConsumerKing (consumer, $95)
- **Small Cap (3):** NanoChip Labs (tech, $25), GreenEnergy Co (energy, $18), BioGenix (healthcare, $30)
- **Crypto (3):** BitCoin (crypto, $40000), EtherChain (crypto, $2500), MemeCoin (crypto, $0.50)
- **Commodity (4):** Crude Oil (energy, $75), Gold (commodity, $1900), Wheat (agriculture, $7.50), Copper (industrial, $4.20)
- **Real Estate (3):** Downtown REIT (real_estate, $180), Suburban Fund (real_estate, $95), Industrial Park (real_estate, $65)
- **Bond (3):** US Treasury 10Y (bond, $100), CorpBond AAA (bond, $99), HighYield Bond (bond, $95)

Set appropriate drift, volatility, mean-reversion, and jump parameters per asset class matching these ranges:
| Asset Class | Annual Vol | Annual Drift | Mean Rev Speed | Jump Freq |
|---|---|---|---|---|
| Large Cap | 0.18-0.25 | 0.08-0.12 | 0 | 0.5-1 |
| Small Cap | 0.30-0.40 | 0.12-0.18 | 0 | 1-2 |
| Crypto | 0.55-0.80 | 0.05-0.15 | 0 | 3-5 |
| Commodity | 0.22-0.35 | 0.01-0.05 | 0.5-0.8 | 0.5-1.5 |
| Real Estate | 0.12-0.18 | 0.06-0.10 | 0.2-0.4 | 0.2-0.5 |
| Bond | 0.04-0.08 | 0.02-0.04 | 0.8-1.0 | 0.1-0.3 |

4. Write `src/data/revenue.ts` defining all 12 `RevenueStreamDefinition` objects:

**Early game (unlocked from start or low requirements):**
- `brokerage`: Commission per client trade. Requires: nothing (starts active). Base revenue: 500/month.
- `consulting`: Project-based advisory fees. Requires: 1 analyst. Base: 800/month.
- `research`: Subscription analytics. Requires: 2 analysts with analytics >= 4. Base: 600/month.

**Mid game:**
- `asset_management`: 2% AUM + 20% performance. Requires: reputation >= 30, 1 fund_manager, cash >= 100k. Base: 2000/month.
- `market_making`: Bid-ask spread profit. Requires: reputation >= 35, 1 trader quant >= 5, 1 quant. Base: 3000/month.
- `ma_advisory`: M&A deal fees. Requires: reputation >= 40, 2 investment_bankers. Base: 5000/month.
- `lending`: Interest on loans to NPCs. Requires: cash >= 500k, reputation >= 25, 1 compliance. Base: 1500/month.
- `wealth_management`: HNW client fees. Requires: reputation >= 45, 2 brokers salesmanship >= 6. Base: 2500/month.
- `real_estate_invest`: Rental income + appreciation. Requires: cash >= 300k, 1 analyst. Base: 1800/month.

**Late game:**
- `ipo_underwriting`: IPO deal fees. Requires: reputation >= 60, 2 investment_bankers skill >= 7, 1 compliance, day >= 180. Base: 10000/month.
- `prop_trading`: Firm capital trading. Requires: reputation >= 50, 2 traders, 1 quant skill >= 8, cash >= 1M. Base: 8000/month.
- `insurance`: Risk product premiums. Requires: reputation >= 55, 1 quant, 1 compliance, 1 analyst. Base: 4000/month.

5. Write `src/data/employees.ts` with:
- `TRAIT_EFFECTS: Record<PersonalityTrait, Partial<EmployeeStats>>` — stat modifiers per trait
- `TRAIT_COMPATIBILITY: Record<string, number>` — pair key (sorted) → synergy multiplier (0.8 to 1.3)
- `NAME_POOL: string[]` — 50 realistic first+last name combos for procedural generation
- A helper function `generateRandomEmployee(role, level, rng): Employee`

6. Write `src/data/events.ts` with **30 event templates** across all 7 families:

At minimum include:
- Macroeconomic (5): Fed rate hike, inflation spike, GDP growth surprise, currency crisis, unemployment report
- Regulatory (4): New trading regulation, deregulation wave, tax policy change, antitrust investigation
- Geopolitical (4): Trade war escalation, sanctions imposed, election uncertainty, regional conflict
- Natural disaster (3): Hurricane disrupts oil, earthquake supply chain, pandemic outbreak
- Company specific (6): Earnings beat, earnings miss, accounting scandal, CEO resignation, patent breakthrough, major contract win
- Market structure (4): Flash crash, IPO wave, merger frenzy, sector rotation
- Industry disruption (4): Tech breakthrough, commodity discovery, labor strike, supply shortage

Each event must have 2-3 meaningful choices with different risk/reward tradeoffs. Set appropriate severity, cooldowns, affected sectors, and price impacts.

---

## PHASE 3 — Math Utilities & Market Simulation Engine

**Goal:** Build the complete 7-layer price simulation engine and all math utilities.

**Steps:**

1. Write `src/utils/random.ts` — a seeded PRNG:
```ts
// Implement a Mulberry32 seeded RNG
// Export: createRNG(seed) returning { next(): number (0-1), nextGaussian(): number (Box-Muller) }
```

2. Write `src/utils/math.ts` with:
- `boxMuller(rng): number` — generate standard normal from uniform
- `choleskyDecompose(matrix: number[][]): number[][]` — Cholesky decomposition
- `correlatedNormals(L: number[][], rng): number[]` — generate correlated normal vector
- `clamp(value, min, max): number`
- `lerp(a, b, t): number`
- `poissonSample(lambda, rng): number` — sample from Poisson distribution

3. Write `src/utils/format.ts`:
- `formatCurrency(n): string` — "$1.23M", "$456.7K", "$123.45"
- `formatPercent(n): string` — "+12.34%", "-5.67%"
- `formatNumber(n): string` — "1,234,567"
- `formatGameDate(day): string` — "Year 1, Month 3, Day 15"

4. Write `src/engine/market/priceEngine.ts` — the core simulation. This is the most critical file in the game. Implement all 7 layers:

**Layer 1 — GBM base step:**
```
dailyDrift = (mu - sigma^2/2) / 252
dailySigma = sigma / sqrt(252)
logReturn = dailyDrift + dailySigma * Z
```
Where Z is a normal random. Apply to log(price) to get next price.

**Layer 2 — Regime switching:**
- Track current `MarketRegime` per-asset and globally
- Each regime has drift/vol multipliers: bull (drift*1.5, vol*0.8), bear (drift*-1.0, vol*1.5), sideways (drift*0.3, vol*0.6)
- On each tick, check if `regimeDaysRemaining` hits 0. If so, sample next regime from transition matrix (CONFIG.REGIME_TRANSITION). Set new duration randomly within CONFIG.REGIME_DURATION range.

**Layer 3 — Mean reversion (OU process):**
- For assets with `meanReversionSpeed > 0` (commodities, bonds, real estate):
```
logPrice = log(currentPrice)
pullback = theta * (meanLevel - logPrice) / 252
```
- Add `pullback` to the drift term before computing the step.

**Layer 4 — Jump diffusion:**
- Each tick, sample from Poisson(jumpFrequency/252) to get number of jumps
- Each jump: `jumpSize = jumpMeanSize + jumpStdDev * normalRandom`
- Add to log return

**Layer 5 — GARCH volatility:**
- Per asset, track `currentVariance`
- Each tick: `newVariance = omega + alpha * lastReturn^2 + beta * currentVariance`
- Use `sqrt(newVariance)` as the effective sigma for this tick
- Clamp variance to [0.5x, 3x] the base annual variance to prevent extremes

**Layer 6 — Cross-asset correlation:**
- Build a correlation matrix for all 20 assets based on sector/class relationships:
  - Same sector: 0.6-0.8
  - Same asset class, different sector: 0.3-0.5
  - Stocks vs bonds: -0.2 to -0.4
  - Crypto vs everything: 0.0-0.2
- Compute Cholesky decomposition once (and on regime change)
- Each tick: generate 20 independent normals, multiply by Cholesky lower triangle to get correlated normals, use these as the Z values in layer 1

**Layer 7 — Event shock overlay:**
- Maintain `activeShocks[]` per asset
- Each tick: for each shock, add `shock.magnitude` to the log return, then decay: `shock.magnitude *= (1 - shock.decayRate)`
- Remove shocks where `|magnitude| < 0.0001`

**Main export:** `tickMarket(marketState, assetDefs, rng): MarketState` — runs one full tick across all assets, returns updated state.

Also export: `initializeMarketState(assetDefs, rng): MarketState` — creates initial state with starting prices and warm-up (run 30 ticks silently to build initial history).

5. Write `src/engine/market/correlationMatrix.ts`:
- `buildCorrelationMatrix(assetDefs: AssetDefinition[]): number[][]`
- Uses sector and asset class to determine pairwise correlations per the rules above

---

## PHASE 4 — Event System & Storyteller AI

**Goal:** Build the event generation, storyteller difficulty system, and event resolution with cascading effects.

**Steps:**

1. Write `src/engine/events/storyteller.ts`:

Three storyteller modes controlling event frequency and severity:

- **Steady Growth (Cassandra):** Events scale with player success. Base event chance: 5% per day. Multiplied by `1 + (company.reputation / 100)`. Severity skews toward moderate as player grows. Never fires catastrophic events before day 60.
- **Calm Markets (Phoebe):** Low base chance (2% per day) but catastrophic events are 2x more likely when they do fire. Long peaceful stretches punctuated by severe shocks.
- **Volatile (Randy):** 10% base chance per day. All severities equally weighted. Can fire anything at any time. Cooldowns halved.

Export: `shouldFireEvent(state: GameState, rng): boolean`
Export: `selectEvent(state: GameState, templates: GameEventTemplate[], rng): GameEventTemplate | null`

Selection algorithm:
- Filter templates by: cooldown expired, progression requirement met, base weight > 0
- Modify weights by: storyteller mode multiplier, market regime (bull markets boost bubble/crash events), player portfolio exposure (events in sectors where player is concentrated get +50% weight), severity curve based on storyteller
- Weighted random selection from filtered pool

2. Write `src/engine/events/eventProcessor.ts`:

- `processEventChoice(state: GameState, event: ActiveEvent, choiceIndex: number): Partial<GameState>` — applies all effects from the chosen option:
  - `cash`: directly modify company.cash
  - `reputation`: modify company.reputation (clamp 0-100)
  - `employee_morale`: modify all employee morale by value
  - `market_shock`: create a PriceShock on targeted assets AND correlated assets (same sector: 60% magnitude, different sector: 20%, bonds: inverse 15%)
  - `client_change`: modify client counts on relevant revenue streams
  - `unlock`: unlock a revenue stream or upgrade

- `processEventChains(state: GameState, event: ActiveEvent, rng): ActiveEvent[]` — roll for chain events with 30% base probability, modified by severity (catastrophic: 60%, major: 40%, moderate: 25%, minor: 10%)

3. Write `src/engine/events/eventEngine.ts`:

- `tickEvents(state: GameState, templates: GameEventTemplate[], rng): { newEvents: ActiveEvent[], resolvedEvents: ActiveEvent[] }`
  - Check if storyteller fires an event this tick
  - If yes, select event template, create ActiveEvent, return it as pending (unresolved)
  - Check for chain events from recently resolved events
  - Events without a player choice after 5 days auto-resolve with the first (default) option

---

## PHASE 5 — Employee System

**Goal:** Build the complete employee management system — hiring, stats, traits, departments, burnout, and career progression.

**Steps:**

1. Write `src/engine/employees/employeeGenerator.ts`:
- `generateEmployee(role: EmployeeRole, level: EmployeeLevel, rng): Employee`
  - Stats: base by level (analyst=2-4, associate=3-6, vp=5-7, director=6-8, md=7-10), plus role bonus (+2 to primary stat), plus random variation (+-1)
  - Traits: 2 random traits (3 for director+), no duplicates, with weighted probabilities (workaholic and burnout_prone should be rarer)
  - Salary: CONFIG.SALARY_BY_LEVEL[level] * (0.9 + rng.next() * 0.2) — slight randomness
  - Name: random from NAME_POOL
  - Morale: 70 + rng.next() * 30
  - Burnout: 0

- `refreshHiringPool(state: GameState, rng): HiringPool`
  - Campus: 5 analyst_level employees across random roles
  - Job Market: 8 employees, mix of analyst_level to vp
  - Headhunter: 3 employees, vp to managing_director (only available if company has headhunter upgrade or reputation >= 40)
  - Refresh every 30 game days

2. Write `src/engine/employees/departmentManager.ts`:
- `calculateDepartmentOutput(dept: Department, employees: Record<string, Employee>): number`
  - Sum effective stats of all employees in department
  - Apply trait compatibility bonuses/penalties between pairs
  - Multiply by work intensity factor: `0.5 + (dept.workIntensity / 100) * 0.8` (range: 0.5x at 0% to 1.3x at 100%)
  - Apply head bonus: if department has a head with leadership >= 7, +15% output

- `tickEmployees(state: GameState): Partial<GameState>`
  - For each employee:
    - Gain XP: `1 + (workIntensity / 50)` per day
    - Check level up: if XP >= threshold, promote (reset XP, increase stats by 1 in two random stats, increase salary to new level)
    - Update burnout: `+= BASE_BURNOUT_RATE * (workIntensity / 50) * burnoutTraitMultiplier - morale/200`
    - If burnout >= BURNOUT_QUIT_THRESHOLD, employee quits (remove from department, add to event log)
    - Update morale: slowly decays, boosted by high company cash and low burnout, reduced by overwork
  - Return updated employee records

3. Write `src/engine/employees/hiringCosts.ts`:
- Campus hire: 1x salary signing bonus
- Job market: 2x salary signing bonus
- Headhunter: 5x salary signing bonus + 20% of first year salary as headhunter fee
- Poach from rival: 8x salary + reputation hit of 2 points
- Firing cost: 3x monthly salary severance

---

## PHASE 6 — Revenue Stream Engine & Portfolio System

**Goal:** Build the revenue calculation system for all 12 streams and the player's trading portfolio.

**Steps:**

1. Write `src/engine/revenue/revenueEngine.ts`:

- `checkUnlockRequirements(def: RevenueStreamDefinition, state: GameState): boolean` — check all requirements against current state

- `calculateStreamRevenue(streamId: RevenueStreamId, state: GameState, rng): number` — calculate monthly revenue for each stream:

  - **Brokerage:** `clientCount * avgTradesPerClient * tradeValue * commissionRate * employeeEfficiency`
    - Client count grows with reputation and broker count
    - Employee efficiency from broker salesmanship stats

  - **Consulting:** `projectCount * projectFee * qualityMultiplier`
    - Projects available = analyst count, fee scales with their analytics stat

  - **Research:** `subscriberCount * subscriptionFee`
    - Subscribers grow when research quality (analyst analytics average) is high

  - **Asset Management:** `aum * managementFee/12 + max(0, aumReturn - hurdleRate) * performanceFee`
    - AUM grows when fund performance is good (fund_manager skill + market returns)
    - AUM shrinks during drawdowns (clients redeem)

  - **Market Making:** `tradingVolume * spread * efficiency - inventoryRisk`
    - Efficiency from trader/quant skills; inventoryRisk proportional to volatility

  - **M&A Advisory:** Roll for deals each month (probability based on investment_banker count and skill). Deal value = random $1M-$50M. Fee = 1.5% of deal value.

  - **Lending:** `totalLoansOut * interestRate / 12 - defaultRate * totalLoansOut`
    - Default rate increases in bear markets

  - **Wealth Management:** `hnwClientCount * avgAUM * feeRate`
    - Client count based on broker relationships and reputation

  - **Real Estate:** `propertiesOwned * rentalYield + appreciation`

  - **IPO Underwriting:** Roll for IPO opportunities (rare). Revenue = `dealSize * underwritingFee`. Risk: if IPO priced wrong (random based on analyst skill), take a loss.

  - **Prop Trading:** `firmCapitalAllocated * returnRate`
    - returnRate from quant/trader skill + market conditions. Can be negative!

  - **Insurance:** `premiumsCollected - claimsPaid`
    - Claims spike during negative events. Premiums scale with client count.

- `tickRevenue(state: GameState, rng): { revenueByStream: Record<string, number>, totalRevenue: number }` — runs monthly (every 30 ticks)

2. Write `src/engine/revenue/portfolioManager.ts`:

- `executeTrade(state: GameState, assetId: string, type: 'buy' | 'sell', quantity: number): GameState`
  - Buy: deduct `quantity * currentPrice * (1 + commissionRate)` from cash, add/update position
  - Sell: add `quantity * currentPrice * (1 - commissionRate)` to cash, reduce position, calculate realized P&L
  - Record trade in history (cap at MAX_TRADE_HISTORY)

- `calculatePortfolioValue(portfolio: Portfolio, assets: Record<string, AssetState>): number`
- `calculateUnrealizedPnL(portfolio: Portfolio, assets: Record<string, AssetState>): number`
- `getPositionSummaries(portfolio, assets): Array<{ assetId, quantity, avgCost, currentPrice, pnl, pnlPercent }>`

---

## PHASE 7 — Zustand Store, Tick Loop & Save System

**Goal:** Wire everything together into the Zustand store, implement the game loop, and add save/load.

**Steps:**

1. Write `src/utils/save.ts`:
- `compressSave(state: GameState): string` — JSON.stringify → LZString.compressToUTF16
- `decompressSave(compressed: string): GameState` — reverse
- `saveToLocalStorage(state: GameState): void` — save under key `'trading-tycoon-save'`
- `loadFromLocalStorage(): GameState | null`
- `exportSave(state: GameState): string` — LZString.compressToBase64
- `importSave(base64: string): GameState`

2. Write `src/store/migrations.ts`:
- `migrateState(state: any): GameState` — check `state.meta.saveVersion`, apply migrations in sequence. Version 1 is current, so just return state for now. This is scaffolding for future migrations.

3. Write `src/store/gameStore.ts` — THE central store:

```ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
```

The store interface extends GameState with actions:
```ts
interface GameStore extends GameState {
  // Time
  setSpeed(speed: 0 | 1 | 2 | 5): void;
  togglePause(): void;
  tick(): void;  // Main game tick — calls ALL engine systems

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
}
```

**The `tick()` function is the heartbeat.** Each call:
1. Increment `time.day` and `time.tickCount`
2. Call `tickMarket()` — update all asset prices
3. Call `tickEvents()` — check for new events, process chains
4. Call `tickEmployees()` — XP, burnout, morale, level ups
5. Every 30 ticks (monthly): call `tickRevenue()`, deduct expenses (salaries, office rent, loan interest), record MonthlyReport
6. Auto-resolve unresolved events older than 5 days
7. Every 30 ticks: refresh hiring pool if stale
8. Check autosave timer

Implement `createInitialState(): GameState` that sets up:
- Starting cash: $500,000
- Day 1, speed 1
- All market assets initialized
- Brokerage revenue stream unlocked and active
- One default department "General"
- Empty portfolio
- Empty employees
- Storyteller: steady_growth

4. Write `src/store/selectors.ts` — derived value selectors:
- `selectNetWorth(state)`: cash + portfolio value + AUM portion
- `selectMonthlyPnL(state)`: revenue - expenses from latest report
- `selectPortfolioValue(state)`
- `selectTotalEmployees(state)`
- `selectActiveStreamCount(state)`
- `selectDepartmentEfficiency(deptId)(state)`

5. Write `src/engine/tick.ts` — the game loop:

```ts
let lastTimestamp = 0;
let tickAccumulator = 0;

export function startGameLoop(store: GameStore) {
  const loop = (timestamp: number) => {
    if (lastTimestamp === 0) lastTimestamp = timestamp;
    const delta = (timestamp - lastTimestamp) / 1000; // seconds
    lastTimestamp = timestamp;

    const state = store.getState();
    if (!state.time.isPaused && state.time.speed > 0) {
      const tickInterval = 1 / CONFIG.TICKS_PER_SECOND[state.time.speed];
      tickAccumulator += delta;

      let ticksThisFrame = 0;
      while (tickAccumulator >= tickInterval && ticksThisFrame < CONFIG.MAX_TICKS_PER_FRAME) {
        store.getState().tick();
        tickAccumulator -= tickInterval;
        ticksThisFrame++;
      }
      // Prevent spiral of death
      if (tickAccumulator > tickInterval * 3) tickAccumulator = 0;
    }

    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
```

6. Update `src/App.tsx` to call `startGameLoop` on mount via useEffect (once), and attempt `loadGame()` on startup.

---

## PHASE 8 — UI Components & Layout Shell

**Goal:** Build all reusable pixel-art UI components and the main app layout with navigation.

**Steps:**

1. Write `src/components/ui/PixelPanel.tsx` — a NES.css-styled container:
- Props: `title?: string`, `children`, `variant?: 'default' | 'dark' | 'rounded'`, `className?`
- Uses `nes-container` class with `is-dark` or `is-rounded` variants
- Title rendered in Press Start 2P font
- Background from PALETTE.panel

2. Write `src/components/ui/PixelButton.tsx`:
- Props: `onClick`, `children`, `variant?: 'primary' | 'success' | 'warning' | 'error' | 'disabled'`
- Maps to NES.css `nes-btn`, `is-primary`, `is-success`, `is-warning`, `is-error`, `is-disabled`
- Add pixel-art hover effect (slight scale transform)

3. Write `src/components/ui/StatBar.tsx`:
- Props: `value: number` (0-100), `maxValue?: number`, `color: string`, `label: string`, `showValue?: boolean`
- Renders an HP-bar style horizontal meter using NES.css `nes-progress` with custom color

4. Write `src/components/ui/PixelTable.tsx`:
- Props: `columns: {key, label, width?, align?}[]`, `data: Record<string, any>[]`, `onRowClick?`
- Styled with pixel borders, VT323 font, alternating row colors from PALETTE

5. Write `src/components/ui/Ticker.tsx`:
- A scrolling horizontal ticker tape showing asset prices with green/red up/down arrows
- Uses CSS animation (`translateX`) for smooth scrolling
- Shows: ticker symbol, current price, daily change percent (colored green/red)
- Reads from market state

6. Write `src/components/ui/PriceChange.tsx`:
- Props: `current: number`, `previous: number`, `format?: 'currency' | 'percent'`
- Shows value with pixel arrow (▲/▼) and green/red coloring

7. Write `src/components/ui/Modal.tsx`:
- Props: `isOpen`, `onClose`, `title`, `children`
- Dark overlay, centered NES.css container, pixel close button

8. Write `src/components/ui/EventPopup.tsx`:
- Props: `event: ActiveEvent`, `template: GameEventTemplate`, `onChoice: (index: number) => void`
- Shows event name, description, severity badge, and choice buttons
- Styled like an RPG dialog box — dark panel with pixel border, slight animation on appear

9. Write `src/components/layout/AppShell.tsx`:
- Top bar: company name (left), cash display (center), date + speed controls (right)
- Speed controls: pause button (⏸) + 1x/2x/5x buttons, active one highlighted
- Below top bar: `<Ticker />` component
- Left sidebar: navigation icons/labels for each screen
- Main content area: renders active screen
- Bottom bar: notification area for recent events (last 3, clickable)

10. Write `src/components/layout/Navigation.tsx`:
- Vertical nav items: Dashboard, Market, Trading, Employees, Revenue, Events, Settings
- Each item: pixel icon (use NES.css icon classes or simple emoji), label in VT323
- Active screen highlighted with PALETTE.blue background
- Store active screen in Zustand (add `ui: { activeScreen: string }` to store)

11. Update `src/App.tsx`:
- Render `<AppShell />` as the main layout
- Show event popups as modals when unresolved events exist
- Add the UI state (`activeScreen`, `showEventPopup`) to the store

---

## PHASE 9 — Game Screens

**Goal:** Build all 7 game screens with full functionality.

**Steps:**

1. Write `src/components/screens/DashboardScreen.tsx`:
- **Company Overview Panel:** Name, cash (large, green), net worth, reputation bar, office level
- **Monthly P&L Summary:** Revenue vs expenses bar, profit number, sparkline trend (last 6 months)
- **Quick Stats Grid (2x3):** Total employees, active revenue streams, portfolio value, unrealized P&L, today's market direction (bull/bear icon), days played
- **Recent Events Feed:** Last 5 events with severity color-coding
- **Top Movers Panel:** Top 3 gainers and top 3 losers today with PriceChange component
- All values pulled from selectors, re-render efficiently

2. Write `src/components/screens/MarketScreen.tsx`:
- **Asset List Table:** Ticker, name, class, price, daily change (%), 30-day chart sparkline, volatility indicator
- **Sort/Filter:** Filter by asset class (tabs), sort by price/change/volatility
- **Selected Asset Detail Panel** (shown when clicking a row):
  - Large price display with PriceChange
  - Price chart using uPlot (last 90 days of history), pixel-scaled
  - Asset stats: annual return, volatility, regime indicator
  - Quick trade buttons: Buy/Sell with quantity input
- Use `react-window` FixedSizeList if needed for performance (though 20 assets is fine without)

3. Write `src/components/screens/TradingScreen.tsx`:
- **Portfolio Positions Table:** Asset, quantity, avg cost, current price, P&L, P&L%, allocation %
- **Totals Row:** Total invested, total value, total unrealized P&L
- **Trade History:** Last 50 trades in a scrollable list (date, asset, buy/sell, quantity, price, total)
- **Trade Execution Panel:**
  - Asset dropdown selector
  - Buy/Sell toggle
  - Quantity input with "Max" button
  - Price preview, commission preview, total cost preview
  - Execute button (disabled if insufficient funds/shares)
- **P&L Summary:** Realized + unrealized, best trade, worst trade

4. Write `src/components/screens/EmployeeScreen.tsx`:
- **Department Tabs:** Show each department, employee count, head name, work intensity slider
- **Employee Roster (per department):** Name, role, level, key stats (bar charts), morale bar, burnout bar, traits as colored badges
- **Selected Employee Detail:** Full stat breakdown, XP progress bar, salary, hire date, all traits with tooltip descriptions
- **Hiring Panel (separate tab):**
  - Three sub-tabs: Campus / Job Market / Headhunter
  - Candidate cards: name, role, level, stats preview, salary, hire cost
  - Hire button per candidate
  - Refresh timer showing days until pool refreshes
- **Actions:** Fire button (with confirmation modal), promote button, reassign department dropdown

5. Write `src/components/screens/RevenueScreen.tsx`:
- **Active Streams Grid:** Cards for each active stream showing name, monthly revenue, performance bar, assigned employees count, level
- **Locked Streams Section:** Grayed-out cards showing name, description, and requirements (with met/unmet indicators: green check / red X)
- **Stream Detail Panel (click to expand):**
  - Revenue breakdown and formula explanation
  - Assigned employees with their efficiency contribution
  - Client/AUM metrics where applicable
  - Activate/deactivate toggle
  - Upgrade button (costs cash, increases level and base revenue)
- **Revenue Pie Chart:** Simple pixel-art breakdown of revenue by stream (can be a horizontal stacked bar)

6. Write `src/components/screens/EventsScreen.tsx`:
- **Active Events Panel:** Unresolved events with full description and choice buttons (same as EventPopup but inline)
- **Event Log / History:** Scrollable list of past events with: date, name, severity badge, choice made, outcome summary
- **Market Conditions Panel:** Current global regime (bull/bear/sideways) with icon, current storyteller mode, regime duration indicator
- **Storyteller Selection:** Three mode buttons (Steady Growth, Calm Markets, Volatile) — only changeable when game is paused, with confirmation dialog

7. Write `src/components/screens/SettingsScreen.tsx`:
- **Save/Load Section:**
  - Save button (with "Last saved: X ago" display)
  - Load button (with confirmation: "This will overwrite current game")
  - Export button (copies base64 to clipboard, shows toast)
  - Import button (paste base64 input, validate, load with confirmation)
  - Reset button (delete save, with double confirmation: "Are you SURE?")
- **Game Settings:**
  - Company name edit (text input)
  - CRT scanline toggle (on/off, modifies a CSS class on the root)
  - Sound toggle (placeholder for future)
  - Auto-save toggle
- **Statistics Panel:**
  - Lifetime stats from GameStatistics
  - Achievements list (placeholder badges)
- **About:** Game title, version "0.1.0", credits text

8. Write `src/components/charts/PriceChart.tsx`:
- Props: `data: number[]`, `width?: number`, `height?: number`, `color?: string`, `showAxes?: boolean`
- Uses uPlot for rendering
- Apply `image-rendering: pixelated` on the canvas container
- Default size 400x200, scales with container
- Y-axis: price, X-axis: days
- Color-coded line: green if last > first, red if last < first
- Minimal styling — dark background, grid lines from PALETTE.textDim

9. Write `src/components/charts/SparkLine.tsx`:
- Props: `data: number[]`, `width?: number`, `height?: number`, `color?: string`
- Tiny inline chart (default 80x24px) using a small canvas
- No axes, just the line
- Used in tables and dashboard widgets

---

## PHASE 10 — Integration, Polish & Final Wiring

**Goal:** Connect all systems, ensure the game runs end-to-end, add missing pieces, and polish.

**Steps:**

1. **Integration check:** Read through `App.tsx`, `gameStore.ts`, `tick.ts`, and every screen component. Ensure:
   - `startGameLoop` is called exactly once on App mount
   - All screens read from store correctly via selectors
   - All action buttons call store actions
   - Event popup appears when there are unresolved events
   - Speed controls work (pause/1x/2x/5x)
   - Ticker shows live data

2. **Fix any broken imports or wiring.** Run `npx tsc --noEmit` and fix all errors. Run `npm run dev` and fix any runtime errors.

3. **Add missing game logic:**
   - Company monthly expenses: total salaries + office rent + loan interest. Deducted on monthly tick.
   - Bankruptcy check: if cash < 0 for 3 consecutive months, game over screen
   - Loan system: max loan = 2x company net worth, interest deducted monthly
   - Office upgrade: each level costs `[50000, 150000, 400000, 1000000]` and increases employee cap

4. **Add initial game flow:**
   - On first load (no save), show a "New Game" modal asking for company name
   - Tutorial tooltips on first visit to each screen (simple text popups, store a `tutorialSeen: Record<string, boolean>` in state)
   - Starting state includes: 2 campus-tier employees (1 analyst, 1 broker), brokerage active, $500K cash

5. **Add achievements** (track in GameStatistics):
   - "First Trade" — execute any trade
   - "Profitable Month" — monthly profit > 0
   - "Growing Team" — hire 5 employees
   - "Diversified" — have 3+ active revenue streams
   - "Market Crash Survivor" — maintain positive cash through a bear regime
   - "Millionaire" — net worth exceeds $1,000,000
   - "Tycoon" — net worth exceeds $10,000,000
   - "Full House" — all 12 revenue streams active
   - Toast notification on achievement unlock

6. **Performance check:**
   - Ensure price history arrays are capped at MAX_PRICE_HISTORY
   - Ensure trade history is capped at MAX_TRADE_HISTORY
   - Ensure monthly reports are capped at MAX_FINANCIAL_HISTORY
   - No unnecessary re-renders (check that selectors are used, not raw `useStore()`)

7. **Final visual polish:**
   - Ensure all text uses the correct fonts (Press Start 2P for headers, VT323 for body)
   - Ensure color consistency — green for profit, red for loss, gold for premium/achievements
   - All panels have consistent pixel borders
   - Responsive layout: app works at 1280x720 and above
   - The CRT scanline effect toggle works

8. **Final build verification:**
   ```bash
   npm run build
   ```
   Fix any build errors. Ensure the production build works by previewing it.

---

## End State

When all 10 phases are complete, the game should:
- Start a Vite dev server without errors
- Show a pixel-art UI with a scrolling market ticker
- Simulate 20 assets with realistic correlated price movements
- Fire random events that affect market prices and require player choices
- Allow hiring/firing employees who generate revenue through 12 business lines
- Support trading (buy/sell assets) with a portfolio tracker
- Auto-save to localStorage every 60 seconds
- Run at adjustable game speeds (pause/1x/2x/5x)

Run `npm run dev` at the very end to confirm everything works. If the dev server starts and the page loads, the build is complete.
