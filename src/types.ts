export type Eye = 'OD' | 'OS';
export type TestMode = 'SC' | 'CC' | 'SCPH' | 'CCPH';

export interface Letter {
  char: string;
  correct: boolean;
}

export interface Row {
  lineNum: number;
  logMAR: number;
  letters: Letter[];
}

export type NonLetterVA = 'CF' | 'HM' | 'LP' | 'NLP';

export interface VAData {
  logMAR?: number;
  nonLetter?: string;
  isCorrected: boolean;
  testDistance: number; // in meters (0.5, 1, 2, 4)
  notes?: string;
  statusLabel?: 'NIPH' | 'NICC'; // New labels for no improvement
}

export interface SessionData {
  [eye: string]: {
    [mode: string]: VAData;
  };
}

export type Stage = 
  | 'EYE_INIT'
  | 'TEST_SC'
  | 'SWITCH_EYE'
  | 'CC_CHECK'
  | 'TEST_CC'
  | 'TEST_PH'
  | 'COLOR_CHOICE'
  | 'TEST_COLORS'
  | 'TEST_ISHIHARA'
  | 'RESULTS';
