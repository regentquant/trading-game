// Number/currency/date formatting

import { CONFIG } from '../data/config.ts';

/**
 * Format a number as currency with appropriate suffix.
 * "$1.23M", "$456.7K", "$123.45"
 */
export function formatCurrency(n: number): string {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);

  if (abs >= 1_000_000_000) {
    return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`;
  }
  if (abs >= 1_000_000) {
    return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  }
  return `${sign}$${abs.toFixed(2)}`;
}

/**
 * Format a decimal as a percentage string.
 * e.g. 0.1234 -> "+12.34%", -0.0567 -> "-5.67%"
 */
export function formatPercent(n: number): string {
  const pct = n * 100;
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

/**
 * Format a number with comma separators.
 * e.g. 1234567 -> "1,234,567"
 */
export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

/**
 * Convert a day count into a readable game date.
 * e.g. day 45 -> "Year 1, Month 2, Day 15"
 */
export function formatGameDate(day: number): string {
  const daysPerMonth = CONFIG.DAYS_PER_MONTH;
  const monthsPerYear = 12;
  const daysPerYear = daysPerMonth * monthsPerYear;

  const year = Math.floor(day / daysPerYear) + 1;
  const dayInYear = day % daysPerYear;
  const month = Math.floor(dayInYear / daysPerMonth) + 1;
  const dayInMonth = (dayInYear % daysPerMonth) + 1;

  return `Year ${year}, Month ${month}, Day ${dayInMonth}`;
}
