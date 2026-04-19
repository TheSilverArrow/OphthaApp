import { Row } from './types';

// ETDRS Chart R Letters (per row)
// Line 1: H V Z D S (LogMAR 1.0)
// Line 2: N C V K D (LogMAR 0.9)
// Line 3: C Z S H N (LogMAR 0.8)
// Line 4: O N V S R (LogMAR 0.7)
// Line 5: K D N R O (LogMAR 0.6)
// Line 6: Z K C S V (LogMAR 0.5)
// Line 7: D V O H C (LogMAR 0.4)
// Line 8: O H V C K (LogMAR 0.3)
// Line 9: H Z C K O (LogMAR 0.2)
// Line 10: N C K H D (LogMAR 0.1)
// Line 11: Z H C S R (LogMAR 0.0)
// Line 12: S Z R D N (LogMAR -0.1)
// Line 13: H C D R O (LogMAR -0.2)
// Line 14: R D O S N (LogMAR -0.3)

export const ETDRS_CHART_R: string[][] = [
  ['H', 'V', 'Z', 'D', 'S'],
  ['N', 'C', 'V', 'K', 'D'],
  ['C', 'Z', 'S', 'H', 'N'],
  ['O', 'N', 'V', 'S', 'R'],
  ['K', 'D', 'N', 'R', 'O'],
  ['Z', 'K', 'C', 'S', 'V'],
  ['D', 'V', 'O', 'H', 'C'],
  ['O', 'H', 'V', 'C', 'K'],
  ['H', 'Z', 'C', 'K', 'O'],
  ['N', 'C', 'K', 'H', 'D'],
  ['Z', 'H', 'C', 'S', 'R'],
  ['S', 'Z', 'R', 'D', 'N'],
  ['H', 'C', 'D', 'R', 'O'],
  ['R', 'D', 'O', 'S', 'N'],
];

export const LOGMAR_BASE = 1.0;
export const LOGMAR_STEP = 0.1;

export function getInitialRows(): Row[] {
  return ETDRS_CHART_R.map((chars, index) => ({
    lineNum: index + 1,
    logMAR: Number((LOGMAR_BASE - index * LOGMAR_STEP).toFixed(1)),
    letters: chars.map((char) => ({ char, correct: false })),
  }));
}

export function logMARToSnellen(logMAR: number): string {
  const denominator = Math.round(20 * Math.pow(10, logMAR));
  // Round to standard Snellen values for display if possible, 
  // but ETDRS usually uses the exact calculated Snellen for specific letter counts.
  // We'll just show 20/X.
  return `20/${denominator}`;
}

export function logMARToMetric(logMAR: number): string {
  const denominator = Math.round(6 * Math.pow(10, logMAR) * 10) / 10;
  return `6/${denominator}`;
}
