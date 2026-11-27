import { Row, ChartType, VAData } from './types';

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

// LVRC Distance Visual Acuity Test - Bailey-Lovie Design, LVRC Numbers #1 (per row)
// Line 1: 8 3 6 7 2 (LogMAR 1.0)
// Line 2: 5 9 3 6 4 (LogMAR 0.9)
// Line 3: 9 3 6 4 5 (LogMAR 0.8)
// Line 4: 7 5 3 6 9 (LogMAR 0.7)
// Line 5: 2 6 8 4 5 (LogMAR 0.6)
// Line 6: 3 4 2 6 8 (LogMAR 0.5)
// Line 7: 8 7 6 3 5 (LogMAR 0.4)
// Line 8: 6 5 2 8 7 (LogMAR 0.3)
// Line 9: 4 9 8 2 5 (LogMAR 0.2)
// Line 10: 9 4 8 5 2 (LogMAR 0.1)
// Line 11: 8 6 2 7 5 (LogMAR 0.0)
// Line 12: 3 7 6 9 2 (LogMAR -0.1)
// Line 13: 9 8 4 2 5 (LogMAR -0.2)
// Line 14: 3 2 8 6 7 (LogMAR -0.3)

export const ETDRS_CHART_NUMBERS: string[][] = [
  ['8', '3', '6', '7', '2'],
  ['5', '9', '3', '6', '4'],
  ['9', '3', '6', '4', '5'],
  ['7', '5', '3', '6', '9'],
  ['2', '6', '8', '4', '5'],
  ['3', '4', '2', '6', '8'],
  ['8', '7', '6', '3', '5'],
  ['6', '5', '2', '8', '7'],
  ['4', '9', '8', '2', '5'],
  ['9', '4', '8', '5', '2'],
  ['8', '6', '2', '7', '5'],
  ['3', '7', '6', '9', '2'],
  ['9', '8', '4', '2', '5'],
  ['3', '2', '8', '6', '7'],
];

export const ETDRS_CONVERSION_DATA = [
  { letters: 1, m4: 240, m2: 480, m1: 957, m05: 1910 },
  { letters: 2, m4: 230, m2: 458, m1: 914, m05: 1824 },
  { letters: 3, m4: 219, m2: 438, m1: 873, m05: 1742 },
  { letters: 4, m4: 209, m2: 418, m1: 834, m05: 1664 },
  { letters: 5, m4: 200, m2: 399, m1: 796, m05: 1589 },
  { letters: 6, m4: 191, m2: 381, m1: 760, m05: 1517 },
  { letters: 7, m4: 182, m2: 364, m1: 726, m05: 1449 },
  { letters: 8, m4: 174, m2: 348, m1: 693, m05: 1384 },
  { letters: 9, m4: 166, m2: 332, m1: 662, m05: 1321 },
  { letters: 10, m4: 159, m2: 317, m1: 632, m05: 1262 },
  { letters: 11, m4: 152, m2: 303, m1: 604, m05: 1205 },
  { letters: 12, m4: 145, m2: 290, m1: 577, m05: 1151 },
  { letters: 13, m4: 138, m2: 276, m1: 551, m05: 1099 },
  { letters: 14, m4: 132, m2: 264, m1: 526, m05: 1050 },
  { letters: 15, m4: 126, m2: 252, m1: 502, m05: 1002 },
  { letters: 16, m4: 121, m2: 240, m1: 480, m05: 957 },
  { letters: 17, m4: 115, m2: 230, m1: 458, m05: 914 },
  { letters: 18, m4: 110, m2: 219, m1: 438, m05: 873 },
  { letters: 19, m4: 105, m2: 209, m1: 418, m05: 834 },
  { letters: 20, m4: 100, m2: 200, m1: 399, m05: 796 },
  { letters: 21, m4: 96, m2: 191, m1: 381, m05: 760 },
  { letters: 22, m4: 91, m2: 182, m1: 364, m05: 726 },
  { letters: 23, m4: 87, m2: 174, m1: 348, m05: 693 },
  { letters: 24, m4: 83, m2: 166, m1: 332, m05: 662 },
  { letters: 25, m4: 80, m2: 159, m1: 317, m05: 632 },
  { letters: 26, m4: 76, m2: 152, m1: 303, m05: 604 },
  { letters: 27, m4: 73, m2: 145, m1: 289, m05: 577 },
  { letters: 28, m4: 69, m2: 138, m1: 276, m05: 551 },
  { letters: 29, m4: 66, m2: 132, m1: 264, m05: 526 },
  { letters: 30, m4: 63, m2: 126, m1: 252, m05: 502 },
  { letters: 31, m4: 60, m2: 121, m1: 240, m05: 480 },
  { letters: 32, m4: 58, m2: 115, m1: 230, m05: 458 },
  { letters: 33, m4: 55, m2: 110, m1: 219, m05: 438 },
  { letters: 34, m4: 53, m2: 105, m1: 209, m05: 418 },
  { letters: 35, m4: 50, m2: 100, m1: 200, m05: 399 },
  { letters: 36, m4: 48, m2: 96, m1: 191, m05: 381 },
  { letters: 37, m4: 46, m2: 91, m1: 182, m05: 364 },
  { letters: 38, m4: 44, m2: 87, m1: 174, m05: 348 },
  { letters: 39, m4: 42, m2: 83, m1: 166, m05: 332 },
  { letters: 40, m4: 40, m2: 80, m1: 159, m05: 317 },
  { letters: 41, m4: 38, m2: 76, m1: 152, m05: 303 },
  { letters: 42, m4: 37, m2: 73, m1: 145, m05: 289 },
  { letters: 43, m4: 35, m2: 69, m1: 138, m05: 276 },
  { letters: 44, m4: 33, m2: 66, m1: 132, m05: 264 },
  { letters: 45, m4: 32, m2: 63, m1: 126, m05: 252 },
  { letters: 46, m4: 30, m2: 60, m1: 121, m05: 240 },
  { letters: 47, m4: 29, m2: 58, m1: 115, m05: 230 },
  { letters: 48, m4: 28, m2: 55, m1: 110, m05: 219 },
  { letters: 49, m4: 26, m2: 53, m1: 105, m05: 209 },
  { letters: 50, m4: 25, m2: 50, m1: 100, m05: 200 },
  { letters: 51, m4: 24, m2: 48, m1: 96, m05: 191 },
  { letters: 52, m4: 23, m2: 46, m1: 91, m05: 182 },
  { letters: 53, m4: 22, m2: 44, m1: 87, m05: 174 },
  { letters: 54, m4: 21, m2: 42, m1: 83, m05: 166 },
  { letters: 55, m4: 20, m2: 40, m1: 80, m05: 159 },
  { letters: 56, m4: 19, m2: 38, m1: 76, m05: 152 },
  { letters: 57, m4: 18, m2: 36, m1: 73, m05: 145 },
  { letters: 58, m4: 17, m2: 35, m1: 69, m05: 138 },
  { letters: 59, m4: 17, m2: 33, m1: 66, m05: 132 },
  { letters: 60, m4: 16, m2: 32, m1: 63, m05: 126 },
  { letters: 61, m4: 15, m2: 31, m1: 60, m05: 121 },
  { letters: 62, m4: 14, m2: 29, m1: 58, m05: 115 },
  { letters: 63, m4: 14, m2: 28, m1: 55, m05: 110 },
  { letters: 64, m4: 13, m2: 26, m1: 53, m05: 105 },
  { letters: 65, m4: 13, m2: 25, m1: 50, m05: 100 },
  { letters: 66, m4: 12, m2: 24, m1: 48, m05: 96 },
  { letters: 67, m4: 12, m2: 23, m1: 46, m05: 91 },
  { letters: 68, m4: 11, m2: 22, m1: 44, m05: 87 },
  { letters: 69, m4: 11, m2: 21, m1: 42, m05: 83 },
  { letters: 70, m4: 10, m2: 20, m1: 40, m05: 80 }
];

export const LOGMAR_BASE = 1.0;
export const LOGMAR_STEP = 0.1;

export function getChartOptotypes(chartType: ChartType = 'letters'): string[][] {
  return chartType === 'numbers' ? ETDRS_CHART_NUMBERS : ETDRS_CHART_R;
}

export function getInitialRows(chartType: ChartType = 'letters'): Row[] {
  return getChartOptotypes(chartType).map((chars, index) => ({
    lineNum: index + 1,
    logMAR: Number((LOGMAR_BASE - index * LOGMAR_STEP).toFixed(1)),
    letters: chars.map((char) => ({ char, correct: false })),
  }));
}

export function applyChartTypeToRows(rows: Row[], chartType: ChartType): Row[] {
  const optotypes = getChartOptotypes(chartType);
  return rows.map((row, rIdx) => {
    const lineChars = optotypes[rIdx];
    if (!lineChars) return row;
    return {
      ...row,
      letters: row.letters.map((letter, lIdx) => ({
        ...letter,
        char: lineChars[lIdx] ?? letter.char,
      })),
    };
  });
}

export function countCorrectFromGrid(gridState?: Row[]): number | undefined {
  if (!gridState) return undefined;
  return gridState.reduce((total, row) => {
    return total + row.letters.filter((l) => l.correct).length;
  }, 0);
}

export function lettersAndDistanceToSnellen(letters: number, distance: number): string | null {
  const entry = ETDRS_CONVERSION_DATA.find((row) => row.letters === letters);
  if (!entry) return null;
  if (distance === 4) return `20/${entry.m4}`;
  if (distance === 2) return `20/${entry.m2}`;
  if (distance === 1) return `20/${entry.m1}`;
  if (distance === 0.5) return `20/${entry.m05}`;
  return null;
}

export function logMARToSnellen(logMAR: number): string {
  const denominator = Math.round(20 * Math.pow(10, logMAR));
  return `20/${denominator}`;
}

export function vaDataToSnellen(data?: VAData): string {
  if (!data) return '—';
  if (data.nonLetter) return data.nonLetter;

  const correctCount = countCorrectFromGrid(data.gridState);
  if (correctCount !== undefined && correctCount > 0) {
    const tableSnellen = lettersAndDistanceToSnellen(correctCount, data.testDistance ?? 4);
    if (tableSnellen) return tableSnellen;
  }

  if (data.logMAR !== undefined) {
    if ((data.testDistance ?? 4) === 4 && data.logMAR === 0.26) return '20/37';
    return logMARToSnellen(data.logMAR);
  }

  return '—';
}

export function logMARToMetric(logMAR: number): string {
  const denominator = Math.round(6 * Math.pow(10, logMAR) * 10) / 10;
  return `6/${denominator}`;
}

