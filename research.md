# Building a web-based trading company tycoon: a comprehensive design brief

**A single-player, pixel-art browser game about building a financial empire can combine the economic depth of Capitalism Lab, the market dynamics of Offworld Trading Company, and the idle progression of AdVenture Capitalist — all running in React with a retro aesthetic.** This brief distills best practices across game design, market simulation algorithms, UI engineering, and web architecture into an actionable plan. The core challenge is making complex financial systems *feel* engaging rather than academic, which means layering real quantitative models under intuitive gameplay loops. What follows is everything needed to plan and build this game.

---

## The three nested gameplay loops that drive engagement

The most successful trading and tycoon games share a common structure: three interlocking loops operating at different timescales. Offworld Trading Company nails the micro-loop — players analyze real-time supply/demand curves and make split-second trading decisions where dumping iron craters its price and hoarding water spikes it. Capitalism Lab dominates the meso-loop — managing supply chains from raw materials through manufacturing to retail, with **over 90 product types** and factory floor layouts that would make an MBA sweat. AdVenture Capitalist perfected the macro-loop through its prestige system, where resetting progress grants permanent Angel Investor multipliers that make each cycle exponentially faster.

For a trading company tycoon, the optimal structure is:

**Micro-loop (seconds to minutes):** Scan market data → identify opportunities → execute trades → see immediate P&L impact. This is the moment-to-moment dopamine hit. Offworld Trading Company proves that watching prices respond to your actions in real-time is inherently satisfying, even without combat or flashy visuals.

**Meso-loop (minutes to hours):** Build portfolio positions → react to breaking news events → manage risk across asset classes → hit quarterly profit targets → unlock new revenue streams. Victoria 3's economic simulation demonstrates that **interconnected systems where one shock cascades across multiple sectors** create the richest emergent gameplay.

**Macro-loop (hours to sessions):** Grow the company → hire specialists → unlock new business lines (asset management, IPO underwriting, proprietary trading) → compete on industry league tables → prestige or expand. The progression from a scrappy brokerage desk to a Goldman Sachs-scale conglomerate provides the long-term motivation.

Key design principles from these reference games: supply and demand should drive all prices naturally, not arbitrary formulas. Resource chains (research → analysis → trades → profits → hiring → better research) create natural depth. Money sinks — employee salaries, office rent, regulatory fines, technology costs — prevent infinite accumulation and maintain challenge. The player should influence but not directly control all market dynamics; agency comes from strategic positioning, not omniscient manipulation.

---

## Simulating realistic market prices with layered algorithms

The price simulation engine is the heart of the game. A single algorithm won't suffice — the best approach layers **seven distinct components** that each contribute a different aspect of market realism, all computationally trivial for a browser.

**Layer 1 — Geometric Brownian Motion (the foundation).** GBM provides the base random walk for stock prices using the formula `S(t+Δt) = S(t) · exp((μ - σ²/2)·Δt + σ·√Δt·Z)` where Z is a standard normal random variable, μ is the drift (expected return), and σ is volatility. A Box-Muller transform generates the normal randoms. For game calibration, use slightly elevated drift (~10-12% annually) so players feel rewarded for long-term investing, but keep volatility moderate enough that short-term trading isn't trivially profitable. GBM alone feels "flat" because it has constant volatility, no jumps, and no mean reversion — which is why the additional layers matter.

**Layer 2 — Regime switching via Markov chains (bull/bear cycles).** The market exists in hidden states — bull, bear, and sideways — each with different drift and volatility parameters. A transition probability matrix governs state changes. Academic estimates suggest **bull markets last 2-5 years with +10-20% returns and 10-15% volatility**, while bear markets run 6 months to 2 years with -15-30% returns and 25-40% volatility. For game pacing, compress these to 30-100 game-days per regime. Critically, don't signal regime changes to the player — they should only notice through price behavior, creating a satisfying pattern-recognition challenge.

**Layer 3 — Mean reversion for commodities and bonds.** The Ornstein-Uhlenbeck process (`dX = θ·(μ - X)·dt + σ·dW`) models prices that oscillate around an equilibrium. When oil deviates far above production cost, a pull-back force drags it down. This is essential for commodities, interest rates, and currencies. The mean-reversion speed θ controls gameplay: higher θ means tighter bouncing (harder to profit from deviations), while lower θ creates wider swings and more trading opportunities. For gameplay, θ = 0.3–1.0 daily works well. Apply the OU process to the log of the price to ensure prices stay positive.

**Layer 4 — Jump diffusion for news shocks.** Merton's jump-diffusion model adds sudden price jumps via a Poisson process layered on top of GBM. For game implementation, a simpler event-driven approach works better: when a scandal fires, apply a -20% magnitude shock that decays exponentially over 20 ticks (`currentMagnitude *= (1 - decayRate)`). Multiple active shocks can stack, creating complex price dynamics from simple components.

**Layer 5 — GARCH-like volatility clustering.** Real markets exhibit volatility clustering — calm periods followed by turbulent ones. A simplified GARCH(1,1) model updates variance each tick: `σ²(t) = ω + α·ε²(t-1) + β·σ²(t-1)`. With **α ≈ 0.10 and β ≈ 0.85 for stocks**, a big shock causes elevated volatility for weeks. Use α = 0.15, β = 0.80 for crypto (more reactive) and α = 0.05, β = 0.90 for bonds (slow, persistent).

**Layer 6 — Cross-asset correlation via Cholesky decomposition.** Generate correlated random normals so tech stocks move together (ρ = 0.7), tech and energy show weak correlation (ρ = 0.2), and stocks and bonds move inversely (ρ = -0.3, capturing flight-to-safety dynamics). The Cholesky decomposition of the correlation matrix transforms independent normals into correlated ones. For 50 assets, this is O(n³) ≈ 125,000 operations per tick — negligible in JavaScript.

**Layer 7 — Game event overrides.** Scripted and random news events inject shocks with exponential decay. When a sector event fires, apply the primary shock to the target asset, then proportional shocks to correlated assets (same sector: 50-80% of shock; different sector: 10-30%; bonds: inverse 10-20%).

**Volatility profiles by asset class** should make each investment feel distinct:

| Asset Class | Annual Vol (σ) | Annual Drift (μ) | Model | Character |
|---|---|---|---|---|
| Large-cap stocks | 15–25% | 7–12% | GBM + regime | Moderate swings, long-term growth |
| Small-cap / growth | 25–40% | 10–18% | GBM + jumps | Higher risk/reward |
| Crypto (BTC-like) | 50–80% | Variable | GBM + frequent jumps | Wild swings, regime-dependent |
| Commodities (oil) | 20–35% | 0–5% | Mean-reverting (OU) | Supply/demand spikes |
| Real estate | 12–20% | 5–10% | Slow GBM + OU | Low frequency, illiquid feel |
| Government bonds | 4–8% | 2–4% | Mean-reverting | Very stable, inverse to equities |

The entire engine runs O(n) per tick per asset and can simulate 50+ assets at 60fps in JavaScript without breaking a sweat. The `stochastic` npm package provides native JS implementations of GBM and Markov chains if you want a head start.

---

## An event system inspired by RimWorld's AI storytellers

RimWorld's event architecture is the gold standard for procedural narrative in simulation games, and its principles translate perfectly to financial markets. The game uses "AI Storytellers" — effectively difficulty curve managers — that control event frequency and intensity based on player success. **Cassandra Classic** follows rising tension arcs where colony wealth triggers proportionally harder raids. **Randy Random** is fully stochastic, creating genuine emergent narratives where players accept failure more readily because "it was a tragic accident, not a skill failure."

For a trading tycoon, implement a market personality system with three modes: **Steady Growth** (Cassandra-like, where success gradually increases challenge through competitors and regulation), **Calm Markets** (Phoebe-like, with long peaceful stretches punctuated by severe shocks), and **Volatile** (Randy-like, where anything can happen at any time).

Events should be categorized into seven families, each with weighted probability tables modified by game state:

- **Macroeconomic events**: Interest rate changes, inflation reports, GDP revisions, currency crises
- **Regulatory events**: New regulations, deregulation, tax policy changes, antitrust actions
- **Geopolitical events**: Trade wars, sanctions, elections, military conflicts
- **Natural disasters**: Hurricanes affecting oil/agriculture, earthquakes disrupting supply chains, pandemics
- **Company-specific events**: Earnings surprises, accounting scandals, CEO changes, patent disputes
- **Market structure events**: Flash crashes, IPO waves, merger activity, sector rotations
- **Industry disruptions**: Technology breakthroughs, commodity discoveries, labor strikes

The critical lesson from Game Dev Tycoon's community is that events with obvious correct answers feel like noise. **Every event should present a genuine trade-off** — "Regulatory investigation announced: sell positions now at a loss, hold and hope, or double down?" From Tropico 6, events must ripple through the economic simulation rather than just displaying text. From Cities: Skylines, preparation mechanics (diversified portfolios, hedging positions, cash reserves) should reduce negative event impact, rewarding strategic foresight.

Event chaining is what separates good systems from great ones. A minor earnings miss → sector sell-off → market correction → recession → regulatory response → recovery opportunity creates a narrative arc from a single trigger. Weight modifications should include: current market regime (bull markets reduce crash probability but increase bubble-pop probability), player portfolio exposure (events hit harder when you're concentrated in the affected sector), game progression stage, and cooldown timers preventing the same event type from repeating too quickly.

---

## Twelve revenue streams that mirror real investment banking

Real investment banks like Goldman Sachs derive revenue from **five to six major business lines**, creating natural diversification incentives. Translating these into game mechanics creates a rich progression system where unlocking new revenue streams depends on building the right team and infrastructure.

**Early game (startup phase)** begins with three accessible streams. Brokerage commissions — charging clients per trade — provide core cash flow from day one. Revenue scales with client count, trade volume, and commission rate, with a strategic tension between higher rates (more per trade, fewer clients) and lower rates (more volume, tighter margins). Basic consulting and advisory services generate project-based fees from NPC companies needing financial guidance. Research and analytics subscriptions monetize your analysts' work, with quality depending on employee skill levels.

**Mid game (growth phase)** unlocks the most mechanically diverse streams. Asset management introduces the iconic "2-and-20" model — **2% annually on assets under management plus 20% of profits above a hurdle rate** — where good performance attracts more investors, growing AUM, compounding fees. Market making profits from bid-ask spreads, requiring technology infrastructure and risk tolerance since holding inventory during volatile markets can cause losses. M&A advisory generates success fees of 1-2% on deal value for helping NPC companies merge or acquire. Lending and margin interest earn steady returns but carry default risk during downturns. Wealth management serves high-net-worth NPC clients with relationship-driven mechanics where client satisfaction drives referrals. Real estate investments provide passive rental income and appreciation.

**Late game (dominance phase)** introduces high-stakes mechanics. IPO underwriting helps private companies go public — price the IPO too high and shares don't sell (you hold the risk); too low and you miss fees. Proprietary trading allocates firm capital to quantitative strategies with potential for huge profits or devastating losses. Insurance and risk management creates hedging products for NPC clients, adding a prediction market element.

Goldman Sachs' actual revenue mix provides a natural balance target: **Global Markets ~35-40%, Asset & Wealth Management ~25%, Investment Banking ~20%, Other ~15-20%.** Over-reliance on any single stream should create vulnerability to specific event types, encouraging diversification.

---

## Employee systems that create stories, not spreadsheets

The most engaging HR systems across tycoon games share a pattern: **employees should feel like characters, not resources.** Software Inc's personality compatibility system — where trait combinations like Extrovert-Flirt yield 187.5% base effectiveness but wrong pairings tank productivity — creates genuine team-building puzzles. Two Point Hospital's visible personality traits at hiring time and training trees with 5 slots per employee create meaningful build-path decisions. Game Dev Tycoon keeps it simple but impactful with small teams where each hire matters enormously.

For a trading company tycoon, employees need **five core stats**: Analytics (research quality), Salesmanship (client relationships), Risk Management (loss prevention), Quantitative Skill (trading algorithms), and Leadership (team management). Layer on **2-3 personality traits** per employee drawn from a finance-themed pool: "Risk Taker," "Conservative," "Networker," "Workaholic," "Quant Mind," "Silver Tongue," "Burnout Prone," "Mentor." Trait compatibility between team members should affect department output — a team of all Risk Takers might generate huge returns or catastrophic losses, while balanced teams produce steadier results.

Eight employee types map to the revenue streams: Traders (prop trading, market making), Analysts/Researchers (reports, due diligence), Brokers/Salespeople (client relationships), Investment Bankers (M&A, IPOs), Fund Managers (asset management), Quant Developers (algorithmic systems), Compliance/Legal (regulatory), and Support Staff (operations). Each revenue stream requires specific employee types and skill thresholds — IPO Underwriting requires 2+ Investment Bankers at skill ≥7, 1+ Legal staff, and Reputation ≥ 60 — creating natural progression gates.

The hiring pipeline should have four tiers: **Campus Recruiting** (cheap juniors, low skill, high potential), **Job Market** (browsable candidates with visible stats), **Headhunters** (expensive access to premium talent), and **Poaching from Rivals** (very expensive, guaranteed quality, damages rival firms). A **career ladder** from Analyst → Associate → VP → Director → Managing Director provides long-term retention hooks, with annual bonus season decisions affecting morale across the entire company.

The critical mechanic that makes finance-industry HR fun rather than tedious is **burnout**. Finance is notorious for it, and a work-life balance slider creates meaningful tension: push employees harder for short-term output, risking turnover and morale collapse, or maintain sustainable pace for long-term stability. As the company grows, players should manage department heads rather than individuals, delegating HR decisions to leaders with the "HR Management" skill.

---

## Pixel art aesthetics through CSS, not canvas

For a primarily UI-driven tycoon game, **DOM rendering with React beats canvas** because management screens are essentially complex, interactive dashboards — exactly what React excels at. Canvas should only be introduced if you add an animated world map or visual simulation layer.

The foundation is `image-rendering: pixelated` (with `-moz-crisp-edges` for Firefox), which prevents anti-aliasing when scaling up low-resolution assets. For clean scaling, render at a base resolution (480×270 is a good 16:9 starting point) and use CSS `transform: scale()` with integer scale factors calculated from viewport size. Accept letterboxing rather than fractional scaling — partial pixels destroy the aesthetic.

**NES.css** (20k+ GitHub stars) provides battle-tested 8-bit UI components — buttons, containers, progress bars, select dropdowns — as pure CSS with no JavaScript dependency. Its React wrapper **nes-ui-react** adds PixelBorder, PixelIcon, Toasts, and Toolbars as React components. **RPGUI** offers RPG-style frames with 9-slice scaling and draggable elements at just 25kb. For a trading tycoon's specific needs, combine NES.css's base components with custom financial widgets.

For fonts, use **Press Start 2P** for headers (the iconic 8-bit arcade look), **VT323** for body text and data tables (taller, more readable at small sizes), and **Pixelify Sans** for UI labels (modern, supports variable weight). The critical rendering rule: use only integer multiples of the base size (Press Start 2P is 8px base → use 8, 16, 24, 32px) and disable font smoothing with `-webkit-font-smoothing: none`.

For the color palette, a **custom 16-24 color palette** with business-appropriate hues works best: deep navy blues (trust, corporate), greens (profit indicators), reds (loss alerts), golds (wealth/premium), and cool grays (neutral backgrounds). Start from PICO-8's palette or Endesga 32 and customize using Lospec's palette editor.

9-slice scaling via CSS `border-image` enables pixel art panels that scale to any content size without distortion — corners stay fixed while edges repeat. Financial charts should render on small canvases (120×60px) then scale up with `image-rendering: pixelated`, using stepped/staircase lines instead of smooth curves. Scrolling ticker tapes for market prices, pixel art up/down arrows for price changes, and HP-bar-style meters for metrics like profit margin all reinforce the retro aesthetic while communicating dense financial data.

An optional CRT scanline overlay using `linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.25) 50%)` at `background-size: 100% 2px` adds authentic retro atmosphere with zero performance cost.

---

## Architecture: React, Zustand, and a fixed-timestep tick engine

**The recommended stack is React 18+ with TypeScript, Zustand for state management, Vite for builds, and a custom fixed-timestep game loop** — no game framework needed. Bitburner proves this architecture works at scale: it's built with React + TypeScript for all interfaces, uses complex state management, and ships via Electron for desktop.

**Zustand with Immer middleware** beats Redux (too much boilerplate), Jotai (awkward for deeply interconnected simulation state), and Context API (poor performance for high-frequency updates). Zustand stores are vanilla JS objects accessible outside React components — critical because the game loop runs in `setInterval`/`requestAnimationFrame`, not inside React's render cycle. Selective subscriptions (`useStore(s => s.company.cash)`) prevent unnecessary re-renders, and the built-in `persist` middleware handles localStorage saves automatically.

The game state structure should track: meta (save version, play time), time (current game date, tick speed, tick count), company (cash, reputation, loans, financial history), employees (roster, departments, hiring pool), market (asset prices, price history, news events, correlation matrix), revenue streams (active business lines, client portfolios), upgrades (unlocked technologies, buildings), and statistics (achievements, lifetime stats). **Normalize data by referencing entities via ID** rather than nesting, cap history arrays to prevent unbounded growth (365 daily prices, 60 monthly summaries), and compute derived values (net worth, monthly P&L) via selectors rather than storing them.

The tick system should use **fixed-interval discrete ticks** — 1 tick = 1 game day, with speed controls at 1x (1 tick/second), 2x, and 5x. Fixed timestep ensures determinism: the same inputs always produce the same outputs, which makes save/load trivial and offline progress calculable by simply running N ticks. Use `requestAnimationFrame` for the outer loop but only process simulation ticks at the configured interval, separating simulation updates (fixed rate) from render updates (every frame). Set a safety cap of ~10 ticks per frame to prevent "spiral of death" if the browser falls behind.

For saves, **localStorage with LZString compression** is the de facto standard across successful browser games (Cookie Clicker, Trimps, Kittens Game all use this pattern). Game state serialized to JSON is typically 100KB-2MB; LZString compression reduces this by 60-80%. Auto-save every 60 seconds plus on significant events, with export/import via base64 strings for backup. Schema migration uses chained version checks — each version bump adds a migration block that provides default values for new fields.

For performance at scale: use `react-window` or `@tanstack/virtual` for long lists, offload heavy calculations (offline progress, bulk price generation) to Web Workers via the Comlink library, cap price history arrays and downsample old data (daily for 30 days, weekly averages beyond that), and use canvas-based charting (uPlot handles **150K data points** efficiently) rather than SVG for financial graphs.

---

## Conclusion: where the pieces connect

The magic of this game lives in the connections between systems, not the systems themselves. A geopolitical event triggers a commodity price shock via the jump-diffusion layer, which cascades across correlated assets through the Cholesky matrix, which creates a GARCH volatility spike that persists for weeks, which causes client portfolios to underperform, which triggers redemptions from the asset management business, which strains cash flow, which forces difficult decisions about employee retention during bonus season. **One event, six systems responding, each creating player decisions.** Build the price engine first — it's the foundation everything else depends on. Layer the event system on top. Then add revenue streams as progression unlocks that give the player new ways to interact with (and be exposed to) market dynamics. The pixel art aesthetic and React architecture are the delivery mechanism; the interconnected simulation is the product.