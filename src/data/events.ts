import type { GameEventTemplate } from '../types';

export const EVENT_TEMPLATES: GameEventTemplate[] = [
  // =====================================================================
  // MACROECONOMIC (5)
  // =====================================================================
  {
    id: 'macro_fed_rate_hike',
    name: 'Federal Reserve Rate Hike',
    family: 'macroeconomic',
    severity: 'major',
    description: 'The Federal Reserve announces an unexpected interest rate increase. Bond yields surge and growth stocks tumble as borrowing costs rise across the economy.',
    choices: [
      {
        label: 'Shift to defensive positions',
        description: 'Rotate portfolio into bonds and value stocks to weather the storm.',
        effects: [
          { type: 'reputation', value: 5 },
          { type: 'market_shock', target: 'bond', value: 0.02 },
          { type: 'market_shock', target: 'tech', value: -0.05 },
        ],
      },
      {
        label: 'Buy the dip aggressively',
        description: 'Use the sell-off as a buying opportunity for discounted growth assets.',
        effects: [
          { type: 'cash', value: -50000 },
          { type: 'reputation', value: -3 },
          { type: 'market_shock', target: 'tech', value: -0.08 },
        ],
      },
      {
        label: 'Hold positions and wait',
        description: 'Maintain current positions and wait for the market to stabilize.',
        effects: [
          { type: 'market_shock', target: 'tech', value: -0.04 },
          { type: 'market_shock', target: 'finance', value: 0.02 },
        ],
      },
    ],
    baseWeight: 8,
    cooldownDays: 60,
    affectedSectors: ['tech', 'finance', 'real_estate'],
    affectedAssetClasses: ['large_cap', 'small_cap', 'bond', 'real_estate'],
    priceImpact: { min: -0.08, max: 0.03 },
    chainEvents: ['macro_currency_crisis'],
  },
  {
    id: 'macro_inflation_spike',
    name: 'Inflation Spike',
    family: 'macroeconomic',
    severity: 'moderate',
    description: 'Consumer price indices come in far above expectations. Commodity prices surge as the dollar weakens.',
    choices: [
      {
        label: 'Hedge with commodities',
        description: 'Increase commodity exposure to profit from rising prices.',
        effects: [
          { type: 'cash', value: -20000 },
          { type: 'market_shock', target: 'commodity', value: 0.06 },
        ],
      },
      {
        label: 'Short consumer stocks',
        description: 'Bet against consumer spending as purchasing power declines.',
        effects: [
          { type: 'reputation', value: -2 },
          { type: 'market_shock', target: 'consumer', value: -0.04 },
        ],
      },
    ],
    baseWeight: 10,
    cooldownDays: 45,
    affectedSectors: ['consumer', 'energy', 'commodity'],
    affectedAssetClasses: ['commodity', 'large_cap', 'bond'],
    priceImpact: { min: -0.05, max: 0.06 },
  },
  {
    id: 'macro_gdp_surprise',
    name: 'GDP Growth Surprise',
    family: 'macroeconomic',
    severity: 'moderate',
    description: 'Quarterly GDP numbers massively beat expectations, signaling a stronger economy than analysts predicted.',
    choices: [
      {
        label: 'Increase equity exposure',
        description: 'Ride the wave of economic optimism with more stock holdings.',
        effects: [
          { type: 'market_shock', target: 'tech', value: 0.04 },
          { type: 'market_shock', target: 'consumer', value: 0.03 },
          { type: 'reputation', value: 3 },
        ],
      },
      {
        label: 'Take profits on existing positions',
        description: 'Lock in gains before the rally fades.',
        effects: [
          { type: 'cash', value: 30000 },
          { type: 'reputation', value: 1 },
        ],
      },
    ],
    baseWeight: 8,
    cooldownDays: 90,
    affectedSectors: ['tech', 'consumer', 'finance', 'industrial'],
    affectedAssetClasses: ['large_cap', 'small_cap'],
    priceImpact: { min: 0.02, max: 0.06 },
  },
  {
    id: 'macro_currency_crisis',
    name: 'Currency Crisis',
    family: 'macroeconomic',
    severity: 'catastrophic',
    description: 'A major emerging market currency collapses, triggering contagion fears across global markets.',
    choices: [
      {
        label: 'Flight to safety',
        description: 'Move assets into gold, treasuries, and stable currencies.',
        effects: [
          { type: 'market_shock', target: 'commodity', value: 0.08 },
          { type: 'market_shock', target: 'bond', value: 0.03 },
          { type: 'cash', value: -40000 },
        ],
      },
      {
        label: 'Scavenge distressed assets',
        description: 'Buy deeply discounted emerging market assets at fire-sale prices.',
        effects: [
          { type: 'cash', value: -100000 },
          { type: 'reputation', value: -5 },
          { type: 'market_shock', target: 'finance', value: -0.06 },
        ],
      },
      {
        label: 'Reduce all exposure',
        description: 'Go to cash and minimize risk until the crisis subsides.',
        effects: [
          { type: 'cash', value: 20000 },
          { type: 'reputation', value: 2 },
        ],
      },
    ],
    baseWeight: 3,
    cooldownDays: 120,
    affectedSectors: ['finance', 'energy', 'industrial'],
    affectedAssetClasses: ['large_cap', 'small_cap', 'commodity', 'crypto'],
    priceImpact: { min: -0.15, max: -0.03 },
    requiresProgression: 60,
  },
  {
    id: 'macro_unemployment',
    name: 'Unemployment Report',
    family: 'macroeconomic',
    severity: 'minor',
    description: 'The monthly unemployment report shows unexpected job losses, raising concerns about economic slowdown.',
    choices: [
      {
        label: 'Prepare for recession',
        description: 'Shift to defensive positions anticipating further weakness.',
        effects: [
          { type: 'market_shock', target: 'consumer', value: -0.03 },
          { type: 'reputation', value: 2 },
        ],
      },
      {
        label: 'Dismiss as noise',
        description: 'Treat the report as a one-off and maintain current strategy.',
        effects: [
          { type: 'employee_morale', value: -5 },
        ],
      },
    ],
    baseWeight: 12,
    cooldownDays: 30,
    affectedSectors: ['consumer', 'finance'],
    affectedAssetClasses: ['large_cap', 'small_cap'],
    priceImpact: { min: -0.04, max: 0.01 },
  },

  // =====================================================================
  // REGULATORY (4)
  // =====================================================================
  {
    id: 'reg_new_trading_regulation',
    name: 'New Trading Regulation',
    family: 'regulatory',
    severity: 'moderate',
    description: 'Regulators announce stricter trading rules, including higher capital requirements and transaction reporting obligations.',
    choices: [
      {
        label: 'Invest in compliance',
        description: 'Hire compliance staff and upgrade systems to meet the new requirements.',
        effects: [
          { type: 'cash', value: -30000 },
          { type: 'reputation', value: 8 },
        ],
      },
      {
        label: 'Lobby against the regulation',
        description: 'Join industry groups fighting the regulation through legal channels.',
        effects: [
          { type: 'cash', value: -15000 },
          { type: 'reputation', value: -3 },
        ],
      },
      {
        label: 'Minimally comply',
        description: 'Do the bare minimum to satisfy regulations, saving costs but risking penalties.',
        effects: [
          { type: 'cash', value: -5000 },
          { type: 'reputation', value: -5 },
        ],
      },
    ],
    baseWeight: 7,
    cooldownDays: 90,
    affectedSectors: ['finance'],
    affectedAssetClasses: ['large_cap', 'small_cap'],
    priceImpact: { min: -0.03, max: 0.01 },
  },
  {
    id: 'reg_deregulation',
    name: 'Deregulation Wave',
    family: 'regulatory',
    severity: 'moderate',
    description: 'A new administration rolls back financial regulations, easing capital requirements and trading restrictions.',
    choices: [
      {
        label: 'Expand operations aggressively',
        description: 'Take advantage of relaxed rules to open new revenue streams.',
        effects: [
          { type: 'cash', value: -20000 },
          { type: 'reputation', value: 5 },
          { type: 'market_shock', target: 'finance', value: 0.04 },
        ],
      },
      {
        label: 'Maintain current standards',
        description: 'Keep existing compliance standards as a competitive advantage.',
        effects: [
          { type: 'reputation', value: 3 },
        ],
      },
    ],
    baseWeight: 5,
    cooldownDays: 120,
    affectedSectors: ['finance'],
    affectedAssetClasses: ['large_cap', 'small_cap'],
    priceImpact: { min: 0.02, max: 0.06 },
  },
  {
    id: 'reg_tax_policy',
    name: 'Tax Policy Change',
    family: 'regulatory',
    severity: 'moderate',
    description: 'Congress passes sweeping tax reform affecting capital gains rates and corporate tax structures.',
    choices: [
      {
        label: 'Restructure for tax efficiency',
        description: 'Reorganize holdings and corporate structure to minimize tax burden.',
        effects: [
          { type: 'cash', value: -10000 },
          { type: 'cash', value: 25000, duration: 120 },
          { type: 'reputation', value: 2 },
        ],
      },
      {
        label: 'Harvest tax losses',
        description: 'Sell losing positions to offset gains before new rates kick in.',
        effects: [
          { type: 'cash', value: 15000 },
          { type: 'market_shock', target: 'tech', value: -0.02 },
        ],
      },
    ],
    baseWeight: 6,
    cooldownDays: 180,
    affectedSectors: ['tech', 'finance', 'healthcare'],
    affectedAssetClasses: ['large_cap', 'small_cap', 'real_estate'],
    priceImpact: { min: -0.04, max: 0.04 },
  },
  {
    id: 'reg_antitrust',
    name: 'Antitrust Investigation',
    family: 'regulatory',
    severity: 'major',
    description: 'Federal regulators launch an antitrust investigation into a major tech conglomerate, threatening a potential breakup.',
    choices: [
      {
        label: 'Short the target company',
        description: 'Profit from the expected stock decline of the investigated company.',
        effects: [
          { type: 'cash', value: 20000 },
          { type: 'reputation', value: -4 },
          { type: 'market_shock', target: 'tech', value: -0.06 },
        ],
      },
      {
        label: 'Advise the company',
        description: 'Offer M&A advisory services to help the company navigate the investigation.',
        effects: [
          { type: 'cash', value: 40000 },
          { type: 'reputation', value: 5 },
        ],
      },
    ],
    baseWeight: 4,
    cooldownDays: 150,
    affectedSectors: ['tech'],
    affectedAssetClasses: ['large_cap'],
    priceImpact: { min: -0.10, max: -0.02 },
    requiresProgression: 30,
  },

  // =====================================================================
  // GEOPOLITICAL (4)
  // =====================================================================
  {
    id: 'geo_trade_war',
    name: 'Trade War Escalation',
    family: 'geopolitical',
    severity: 'major',
    description: 'Escalating tariffs between major economies disrupt global supply chains and increase costs for manufacturers.',
    choices: [
      {
        label: 'Rotate to domestic stocks',
        description: 'Shift to companies with minimal international exposure.',
        effects: [
          { type: 'market_shock', target: 'tech', value: -0.05 },
          { type: 'market_shock', target: 'consumer', value: -0.03 },
          { type: 'reputation', value: 3 },
        ],
      },
      {
        label: 'Bet on tariff beneficiaries',
        description: 'Invest in domestic manufacturers who benefit from reduced foreign competition.',
        effects: [
          { type: 'cash', value: -25000 },
          { type: 'market_shock', target: 'industrial', value: 0.03 },
        ],
      },
      {
        label: 'Hedge with gold',
        description: 'Increase gold allocation as a safe-haven hedge against uncertainty.',
        effects: [
          { type: 'cash', value: -15000 },
          { type: 'market_shock', target: 'commodity', value: 0.04 },
        ],
      },
    ],
    baseWeight: 6,
    cooldownDays: 90,
    affectedSectors: ['tech', 'consumer', 'industrial'],
    affectedAssetClasses: ['large_cap', 'small_cap', 'commodity'],
    priceImpact: { min: -0.08, max: 0.03 },
  },
  {
    id: 'geo_sanctions',
    name: 'Sanctions Imposed',
    family: 'geopolitical',
    severity: 'major',
    description: 'International sanctions are imposed on a major oil-producing nation, threatening global energy supply.',
    choices: [
      {
        label: 'Go long on energy',
        description: 'Buy oil futures and energy stocks to profit from supply disruption.',
        effects: [
          { type: 'cash', value: -30000 },
          { type: 'market_shock', target: 'energy', value: 0.08 },
        ],
      },
      {
        label: 'Avoid energy entirely',
        description: 'Reduce energy exposure and wait for the situation to stabilize.',
        effects: [
          { type: 'reputation', value: 2 },
          { type: 'market_shock', target: 'energy', value: 0.05 },
        ],
      },
    ],
    baseWeight: 5,
    cooldownDays: 120,
    affectedSectors: ['energy', 'industrial'],
    affectedAssetClasses: ['commodity', 'large_cap'],
    priceImpact: { min: -0.06, max: 0.10 },
  },
  {
    id: 'geo_election',
    name: 'Election Uncertainty',
    family: 'geopolitical',
    severity: 'moderate',
    description: 'A contentious national election creates policy uncertainty, causing market volatility as investors hedge their bets.',
    choices: [
      {
        label: 'Increase cash reserves',
        description: 'Move to cash and wait for the election outcome.',
        effects: [
          { type: 'reputation', value: 1 },
          { type: 'employee_morale', value: -3 },
        ],
      },
      {
        label: 'Buy volatility',
        description: 'Trade options strategies that profit from increased market swings.',
        effects: [
          { type: 'cash', value: -10000 },
          { type: 'reputation', value: 3 },
        ],
      },
    ],
    baseWeight: 4,
    cooldownDays: 180,
    affectedSectors: ['finance', 'healthcare', 'energy'],
    affectedAssetClasses: ['large_cap', 'small_cap', 'bond'],
    priceImpact: { min: -0.05, max: 0.03 },
  },
  {
    id: 'geo_conflict',
    name: 'Regional Conflict',
    family: 'geopolitical',
    severity: 'catastrophic',
    description: 'Armed conflict erupts in a strategically important region, sending shock waves through global markets.',
    choices: [
      {
        label: 'Flight to safety',
        description: 'Rush into gold, treasuries, and defensive assets.',
        effects: [
          { type: 'market_shock', target: 'commodity', value: 0.10 },
          { type: 'market_shock', target: 'bond', value: 0.03 },
          { type: 'market_shock', target: 'tech', value: -0.07 },
        ],
      },
      {
        label: 'Invest in defense sector',
        description: 'Buy defense and security stocks that benefit from increased spending.',
        effects: [
          { type: 'cash', value: -50000 },
          { type: 'reputation', value: -3 },
          { type: 'market_shock', target: 'industrial', value: 0.05 },
        ],
      },
      {
        label: 'Go to cash',
        description: 'Liquidate risky positions and wait for stability.',
        effects: [
          { type: 'cash', value: 10000 },
          { type: 'employee_morale', value: -10 },
        ],
      },
    ],
    baseWeight: 2,
    cooldownDays: 180,
    affectedSectors: ['energy', 'industrial', 'tech', 'finance'],
    affectedAssetClasses: ['large_cap', 'small_cap', 'commodity', 'crypto'],
    priceImpact: { min: -0.15, max: 0.10 },
    requiresProgression: 90,
  },

  // =====================================================================
  // NATURAL DISASTER (3)
  // =====================================================================
  {
    id: 'nat_hurricane_oil',
    name: 'Hurricane Disrupts Oil Production',
    family: 'natural_disaster',
    severity: 'major',
    description: 'A Category 5 hurricane makes landfall in the Gulf Coast, shutting down major oil refineries and disrupting supply chains.',
    choices: [
      {
        label: 'Trade the energy spike',
        description: 'Buy oil and energy stocks to profit from the supply disruption.',
        effects: [
          { type: 'cash', value: -20000 },
          { type: 'market_shock', target: 'energy', value: 0.10 },
        ],
      },
      {
        label: 'Donate to relief efforts',
        description: 'Make a charitable contribution to boost reputation.',
        effects: [
          { type: 'cash', value: -25000 },
          { type: 'reputation', value: 8 },
          { type: 'employee_morale', value: 10 },
        ],
      },
    ],
    baseWeight: 4,
    cooldownDays: 120,
    affectedSectors: ['energy', 'industrial'],
    affectedAssetClasses: ['commodity'],
    priceImpact: { min: -0.05, max: 0.12 },
  },
  {
    id: 'nat_earthquake',
    name: 'Earthquake Disrupts Supply Chain',
    family: 'natural_disaster',
    severity: 'major',
    description: 'A powerful earthquake in East Asia devastates semiconductor factories and disrupts the global electronics supply chain.',
    choices: [
      {
        label: 'Short affected tech companies',
        description: 'Bet against companies reliant on the disrupted supply chain.',
        effects: [
          { type: 'market_shock', target: 'tech', value: -0.08 },
          { type: 'cash', value: 15000 },
          { type: 'reputation', value: -3 },
        ],
      },
      {
        label: 'Invest in alternative suppliers',
        description: 'Buy stocks of companies that can fill the supply gap.',
        effects: [
          { type: 'cash', value: -20000 },
          { type: 'market_shock', target: 'industrial', value: 0.04 },
        ],
      },
      {
        label: 'Wait and assess',
        description: 'Hold off on action until the extent of damage is clearer.',
        effects: [
          { type: 'market_shock', target: 'tech', value: -0.05 },
        ],
      },
    ],
    baseWeight: 3,
    cooldownDays: 150,
    affectedSectors: ['tech', 'industrial'],
    affectedAssetClasses: ['large_cap', 'small_cap'],
    priceImpact: { min: -0.10, max: 0.04 },
  },
  {
    id: 'nat_pandemic',
    name: 'Pandemic Outbreak',
    family: 'natural_disaster',
    severity: 'catastrophic',
    description: 'A new pathogen spreads globally, triggering lockdowns and massive economic disruption across all sectors.',
    choices: [
      {
        label: 'Pivot to remote operations',
        description: 'Invest in technology to keep the firm running remotely.',
        effects: [
          { type: 'cash', value: -40000 },
          { type: 'employee_morale', value: 5 },
          { type: 'market_shock', target: 'tech', value: 0.05 },
          { type: 'market_shock', target: 'consumer', value: -0.10 },
        ],
      },
      {
        label: 'Aggressively buy the crash',
        description: 'Deploy capital into severely discounted assets for long-term gains.',
        effects: [
          { type: 'cash', value: -100000 },
          { type: 'reputation', value: -5 },
          { type: 'market_shock', target: 'healthcare', value: 0.08 },
        ],
      },
      {
        label: 'Hunker down and preserve capital',
        description: 'Cut expenses, freeze hiring, and protect the balance sheet.',
        effects: [
          { type: 'cash', value: 20000 },
          { type: 'employee_morale', value: -15 },
          { type: 'reputation', value: -2 },
        ],
      },
    ],
    baseWeight: 1,
    cooldownDays: 365,
    affectedSectors: ['consumer', 'energy', 'healthcare', 'tech', 'finance'],
    affectedAssetClasses: ['large_cap', 'small_cap', 'commodity', 'real_estate'],
    priceImpact: { min: -0.20, max: 0.08 },
    requiresProgression: 120,
    chainEvents: ['macro_unemployment'],
  },

  // =====================================================================
  // COMPANY SPECIFIC (6)
  // =====================================================================
  {
    id: 'cs_earnings_beat',
    name: 'Major Earnings Beat',
    family: 'company_specific',
    severity: 'moderate',
    description: 'A major company in your portfolio crushes earnings expectations, sending its stock soaring after hours.',
    choices: [
      {
        label: 'Take profits',
        description: 'Sell into the rally and lock in gains.',
        effects: [
          { type: 'cash', value: 25000 },
          { type: 'reputation', value: 3 },
        ],
      },
      {
        label: 'Hold for more upside',
        description: 'Keep the position, expecting continued momentum.',
        effects: [
          { type: 'market_shock', target: 'tech', value: 0.04 },
          { type: 'reputation', value: 2 },
        ],
      },
    ],
    baseWeight: 10,
    cooldownDays: 30,
    affectedSectors: ['tech', 'finance', 'healthcare', 'consumer'],
    affectedAssetClasses: ['large_cap', 'small_cap'],
    priceImpact: { min: 0.03, max: 0.08 },
  },
  {
    id: 'cs_earnings_miss',
    name: 'Earnings Miss',
    family: 'company_specific',
    severity: 'moderate',
    description: 'A key holding badly misses earnings estimates, dropping sharply in after-hours trading.',
    choices: [
      {
        label: 'Cut losses immediately',
        description: 'Sell the position before further decline.',
        effects: [
          { type: 'cash', value: -15000 },
          { type: 'reputation', value: -2 },
        ],
      },
      {
        label: 'Double down',
        description: 'Buy more at the lower price, believing in long-term recovery.',
        effects: [
          { type: 'cash', value: -20000 },
          { type: 'market_shock', target: 'tech', value: -0.03 },
        ],
      },
      {
        label: 'Hold and reassess',
        description: 'Keep the position while analyzing what went wrong.',
        effects: [
          { type: 'employee_morale', value: -5 },
          { type: 'market_shock', target: 'tech', value: -0.04 },
        ],
      },
    ],
    baseWeight: 10,
    cooldownDays: 30,
    affectedSectors: ['tech', 'finance', 'healthcare', 'consumer'],
    affectedAssetClasses: ['large_cap', 'small_cap'],
    priceImpact: { min: -0.08, max: -0.02 },
  },
  {
    id: 'cs_accounting_scandal',
    name: 'Accounting Scandal',
    family: 'company_specific',
    severity: 'catastrophic',
    description: 'A whistleblower reveals massive accounting fraud at a publicly traded company, wiping billions in market value.',
    choices: [
      {
        label: 'Short the stock',
        description: 'Profit from the expected collapse in share price.',
        effects: [
          { type: 'cash', value: 40000 },
          { type: 'reputation', value: -5 },
          { type: 'market_shock', target: 'finance', value: -0.06 },
        ],
      },
      {
        label: 'Investigate internally',
        description: 'Review your own books to ensure no exposure, and reassure clients.',
        effects: [
          { type: 'cash', value: -10000 },
          { type: 'reputation', value: 8 },
          { type: 'employee_morale', value: -5 },
        ],
      },
    ],
    baseWeight: 2,
    cooldownDays: 180,
    affectedSectors: ['finance'],
    affectedAssetClasses: ['large_cap', 'small_cap'],
    priceImpact: { min: -0.15, max: -0.05 },
    requiresProgression: 60,
  },
  {
    id: 'cs_ceo_resignation',
    name: 'CEO Resignation',
    family: 'company_specific',
    severity: 'major',
    description: 'The CEO of a major corporation abruptly resigns amid rumors of internal conflicts, creating leadership uncertainty.',
    choices: [
      {
        label: 'Sell affected holdings',
        description: 'Exit positions in the company before further instability.',
        effects: [
          { type: 'cash', value: 10000 },
          { type: 'market_shock', target: 'tech', value: -0.05 },
        ],
      },
      {
        label: 'Offer executive search services',
        description: 'Position your firm to assist in finding a replacement.',
        effects: [
          { type: 'cash', value: 20000 },
          { type: 'reputation', value: 5 },
        ],
      },
    ],
    baseWeight: 5,
    cooldownDays: 90,
    affectedSectors: ['tech', 'finance', 'consumer'],
    affectedAssetClasses: ['large_cap'],
    priceImpact: { min: -0.08, max: -0.02 },
  },
  {
    id: 'cs_patent_breakthrough',
    name: 'Patent Breakthrough',
    family: 'company_specific',
    severity: 'moderate',
    description: 'A small-cap biotech company announces a breakthrough patent for a revolutionary treatment, sending its stock surging.',
    choices: [
      {
        label: 'Buy in early',
        description: 'Take a position before the broader market catches on.',
        effects: [
          { type: 'cash', value: -15000 },
          { type: 'market_shock', target: 'healthcare', value: 0.06 },
          { type: 'reputation', value: 4 },
        ],
      },
      {
        label: 'Publish research report',
        description: 'Analyze the patent and publish findings to attract subscribers.',
        effects: [
          { type: 'reputation', value: 6 },
          { type: 'client_change', value: 5 },
        ],
      },
    ],
    baseWeight: 6,
    cooldownDays: 60,
    affectedSectors: ['healthcare', 'tech'],
    affectedAssetClasses: ['small_cap'],
    priceImpact: { min: 0.04, max: 0.12 },
  },
  {
    id: 'cs_major_contract',
    name: 'Major Contract Win',
    family: 'company_specific',
    severity: 'minor',
    description: 'A large corporation wins a massive government contract, boosting revenue projections for years to come.',
    choices: [
      {
        label: 'Buy the winner',
        description: 'Invest in the company before the full impact is priced in.',
        effects: [
          { type: 'cash', value: -10000 },
          { type: 'market_shock', target: 'industrial', value: 0.03 },
        ],
      },
      {
        label: 'Analyze the sector',
        description: 'Research competitors who might benefit from related spending.',
        effects: [
          { type: 'reputation', value: 3 },
          { type: 'market_shock', target: 'tech', value: 0.02 },
        ],
      },
    ],
    baseWeight: 8,
    cooldownDays: 45,
    affectedSectors: ['tech', 'industrial'],
    affectedAssetClasses: ['large_cap'],
    priceImpact: { min: 0.02, max: 0.06 },
  },

  // =====================================================================
  // MARKET STRUCTURE (4)
  // =====================================================================
  {
    id: 'ms_flash_crash',
    name: 'Flash Crash',
    family: 'market_structure',
    severity: 'catastrophic',
    description: 'An algorithmic trading error causes a sudden 10% market drop in minutes before partial recovery. Liquidity evaporates.',
    choices: [
      {
        label: 'Buy the extreme dip',
        description: 'Deploy capital aggressively during the crash for deep discounts.',
        effects: [
          { type: 'cash', value: -80000 },
          { type: 'market_shock', target: 'tech', value: -0.10 },
          { type: 'market_shock', target: 'finance', value: -0.08 },
        ],
      },
      {
        label: 'Halt all trading',
        description: 'Protect client portfolios by stopping execution until order is restored.',
        effects: [
          { type: 'reputation', value: 5 },
          { type: 'employee_morale', value: -10 },
        ],
      },
      {
        label: 'Investigate for opportunities',
        description: 'Look for mispriced assets caused by the algorithmic glitch.',
        effects: [
          { type: 'cash', value: 30000 },
          { type: 'reputation', value: -2 },
        ],
      },
    ],
    baseWeight: 2,
    cooldownDays: 180,
    affectedSectors: ['tech', 'finance', 'consumer'],
    affectedAssetClasses: ['large_cap', 'small_cap', 'crypto'],
    priceImpact: { min: -0.12, max: 0.02 },
    requiresProgression: 45,
  },
  {
    id: 'ms_ipo_wave',
    name: 'IPO Wave',
    family: 'market_structure',
    severity: 'minor',
    description: 'A surge of high-profile companies go public, drawing investor attention and capital away from existing stocks.',
    choices: [
      {
        label: 'Participate in IPO allocations',
        description: 'Use your firm\'s relationships to get IPO shares at offering price.',
        effects: [
          { type: 'cash', value: -30000 },
          { type: 'reputation', value: 5 },
          { type: 'client_change', value: 3 },
        ],
      },
      {
        label: 'Focus on existing holdings',
        description: 'Ignore the hype and stick with your current investment thesis.',
        effects: [
          { type: 'reputation', value: 1 },
          { type: 'market_shock', target: 'tech', value: -0.02 },
        ],
      },
    ],
    baseWeight: 6,
    cooldownDays: 90,
    affectedSectors: ['tech', 'healthcare'],
    affectedAssetClasses: ['small_cap'],
    priceImpact: { min: -0.03, max: 0.05 },
    requiresProgression: 30,
  },
  {
    id: 'ms_merger_frenzy',
    name: 'Merger Frenzy',
    family: 'market_structure',
    severity: 'moderate',
    description: 'A wave of mergers and acquisitions sweeps through the market as companies consolidate in response to competitive pressures.',
    choices: [
      {
        label: 'Offer M&A advisory',
        description: 'Position your firm to advise on deals and earn substantial fees.',
        effects: [
          { type: 'cash', value: 50000 },
          { type: 'reputation', value: 6 },
        ],
      },
      {
        label: 'Trade the rumor mill',
        description: 'Take positions in potential acquisition targets.',
        effects: [
          { type: 'cash', value: -25000 },
          { type: 'market_shock', target: 'tech', value: 0.03 },
          { type: 'market_shock', target: 'healthcare', value: 0.04 },
        ],
      },
    ],
    baseWeight: 5,
    cooldownDays: 120,
    affectedSectors: ['tech', 'healthcare', 'finance'],
    affectedAssetClasses: ['large_cap', 'small_cap'],
    priceImpact: { min: 0.02, max: 0.08 },
    requiresProgression: 60,
  },
  {
    id: 'ms_sector_rotation',
    name: 'Sector Rotation',
    family: 'market_structure',
    severity: 'minor',
    description: 'Institutional investors rotate massively from growth to value stocks, causing dramatic sector-level price swings.',
    choices: [
      {
        label: 'Follow the rotation',
        description: 'Shift your portfolio to align with the institutional flow.',
        effects: [
          { type: 'cash', value: -10000 },
          { type: 'market_shock', target: 'tech', value: -0.04 },
          { type: 'market_shock', target: 'finance', value: 0.03 },
          { type: 'market_shock', target: 'energy', value: 0.03 },
        ],
      },
      {
        label: 'Contrarian bet',
        description: 'Buy the sectors being sold and short the ones being bought.',
        effects: [
          { type: 'cash', value: -15000 },
          { type: 'reputation', value: -2 },
        ],
      },
      {
        label: 'Stay diversified',
        description: 'Maintain balanced positions across all sectors.',
        effects: [
          { type: 'reputation', value: 2 },
        ],
      },
    ],
    baseWeight: 8,
    cooldownDays: 60,
    affectedSectors: ['tech', 'finance', 'energy', 'healthcare'],
    affectedAssetClasses: ['large_cap', 'small_cap'],
    priceImpact: { min: -0.05, max: 0.05 },
  },

  // =====================================================================
  // INDUSTRY DISRUPTION (4)
  // =====================================================================
  {
    id: 'ind_tech_breakthrough',
    name: 'Tech Breakthrough',
    family: 'industry_disruption',
    severity: 'major',
    description: 'A revolutionary AI technology is unveiled that could reshape entire industries, creating massive winners and losers.',
    choices: [
      {
        label: 'Invest heavily in AI leaders',
        description: 'Pour capital into companies at the forefront of the technology.',
        effects: [
          { type: 'cash', value: -40000 },
          { type: 'market_shock', target: 'tech', value: 0.08 },
          { type: 'reputation', value: 5 },
        ],
      },
      {
        label: 'Short legacy companies',
        description: 'Bet against companies likely to be disrupted by the new technology.',
        effects: [
          { type: 'cash', value: 20000 },
          { type: 'reputation', value: -3 },
          { type: 'market_shock', target: 'finance', value: -0.03 },
        ],
      },
      {
        label: 'Publish analysis and wait',
        description: 'Research the impact thoroughly before committing capital.',
        effects: [
          { type: 'reputation', value: 6 },
          { type: 'client_change', value: 4 },
        ],
      },
    ],
    baseWeight: 4,
    cooldownDays: 120,
    affectedSectors: ['tech', 'finance', 'healthcare'],
    affectedAssetClasses: ['large_cap', 'small_cap'],
    priceImpact: { min: -0.05, max: 0.12 },
    requiresProgression: 30,
  },
  {
    id: 'ind_commodity_discovery',
    name: 'Major Commodity Discovery',
    family: 'industry_disruption',
    severity: 'moderate',
    description: 'A massive new mineral deposit is discovered, threatening to flood the market and collapse commodity prices.',
    choices: [
      {
        label: 'Short the commodity',
        description: 'Profit from the expected price decline as supply increases.',
        effects: [
          { type: 'cash', value: 15000 },
          { type: 'market_shock', target: 'commodity', value: -0.06 },
          { type: 'reputation', value: 2 },
        ],
      },
      {
        label: 'Invest in the mining company',
        description: 'Buy shares of the company that made the discovery.',
        effects: [
          { type: 'cash', value: -20000 },
          { type: 'market_shock', target: 'industrial', value: 0.03 },
        ],
      },
    ],
    baseWeight: 5,
    cooldownDays: 150,
    affectedSectors: ['commodity', 'industrial', 'energy'],
    affectedAssetClasses: ['commodity', 'small_cap'],
    priceImpact: { min: -0.08, max: 0.04 },
  },
  {
    id: 'ind_labor_strike',
    name: 'Labor Strike',
    family: 'industry_disruption',
    severity: 'moderate',
    description: 'Workers at major manufacturing plants go on strike, disrupting production and threatening supply chains.',
    choices: [
      {
        label: 'Trade the disruption',
        description: 'Buy competitors who can capture market share during the strike.',
        effects: [
          { type: 'cash', value: -15000 },
          { type: 'market_shock', target: 'industrial', value: -0.04 },
          { type: 'market_shock', target: 'consumer', value: -0.02 },
        ],
      },
      {
        label: 'Support workers publicly',
        description: 'Make a public statement supporting fair labor practices.',
        effects: [
          { type: 'reputation', value: 5 },
          { type: 'employee_morale', value: 10 },
        ],
      },
      {
        label: 'Stay neutral',
        description: 'Avoid taking sides and focus on portfolio management.',
        effects: [
          { type: 'market_shock', target: 'industrial', value: -0.03 },
        ],
      },
    ],
    baseWeight: 6,
    cooldownDays: 90,
    affectedSectors: ['industrial', 'consumer'],
    affectedAssetClasses: ['large_cap', 'small_cap'],
    priceImpact: { min: -0.06, max: 0.02 },
  },
  {
    id: 'ind_supply_shortage',
    name: 'Critical Supply Shortage',
    family: 'industry_disruption',
    severity: 'major',
    description: 'A critical raw material faces severe supply constraints due to mine closures and export restrictions, impacting multiple industries.',
    choices: [
      {
        label: 'Stockpile-related commodities',
        description: 'Buy commodity futures before prices spike further.',
        effects: [
          { type: 'cash', value: -25000 },
          { type: 'market_shock', target: 'commodity', value: 0.07 },
          { type: 'market_shock', target: 'industrial', value: -0.04 },
        ],
      },
      {
        label: 'Short affected manufacturers',
        description: 'Bet against companies that rely heavily on the scarce material.',
        effects: [
          { type: 'cash', value: 20000 },
          { type: 'reputation', value: -2 },
          { type: 'market_shock', target: 'tech', value: -0.05 },
        ],
      },
      {
        label: 'Research alternative materials',
        description: 'Publish research on companies developing substitutes.',
        effects: [
          { type: 'reputation', value: 5 },
          { type: 'client_change', value: 3 },
        ],
      },
    ],
    baseWeight: 5,
    cooldownDays: 120,
    affectedSectors: ['industrial', 'tech', 'commodity'],
    affectedAssetClasses: ['commodity', 'small_cap', 'large_cap'],
    priceImpact: { min: -0.06, max: 0.08 },
    requiresProgression: 45,
  },
];
