import React, { useState, useMemo, useEffect } from 'react';
import { Eye, TestMode, Row, SessionData, NonLetterVA, Stage } from './types';
import { getInitialRows, logMARToSnellen, logMARToMetric } from './constants';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Eye as EyeIcon, 
  Glasses, 
  ChevronRight, 
  RefreshCcw, 
  CheckCircle2, 
  ClipboardList,
  History as HistoryIcon,
  Settings,
  Palette,
  ExternalLink,
  ChevronLeft,
  Trash2,
  Share2,
  Sun,
  Moon,
  Info,
  X,
  AlertTriangle
} from 'lucide-react';

interface HistoryEntry {
  id: string;
  timestamp: number;
  session: SessionData;
  patientName?: string;
}

interface PlateDetail {
  plateNum: number;
  normal: string;
  deficiency: string;
  note?: string;
}

const ISHIHARA_PLATE_DETAILS: PlateDetail[] = [
  {
    plateNum: 1,
    normal: "12",
    deficiency: "Everyone should see number 12 (Instruction plate).",
    note: "Used to demonstrate the test to the subject. If 12 is not seen, check for visual acuity loss or simulation."
  },
  {
    plateNum: 2,
    normal: "8",
    deficiency: "3 (Red-green deficiency)",
    note: "Normal view sees 8; individuals with red-green deficiencies read it as 3."
  },
  {
    plateNum: 3,
    normal: "5",
    deficiency: "2 (Red-green deficiency)",
    note: "Normal view sees 5; individuals with red-green deficiencies read it as 2."
  },
  {
    plateNum: 4,
    normal: "29",
    deficiency: "70 (Red-green deficiency)",
    note: "Normal view sees 29; individuals with red-green deficiencies read it as 70."
  },
  {
    plateNum: 5,
    normal: "74",
    deficiency: "21 (Red-green deficiency)",
    note: "Normal view sees 74; individuals with red-green deficiencies read it as 21."
  },
  {
    plateNum: 6,
    normal: "7",
    deficiency: "Most people don't see anything or see something wrong.",
    note: "Normal view clearly sees 7; red-green deficient subjects see nothing or an incorrect figure."
  },
  {
    plateNum: 7,
    normal: "45",
    deficiency: "Most people don't see anything or see something wrong.",
    note: "Normal view sees 45; red-green deficient subjects usually do not see any numeral."
  },
  {
    plateNum: 8,
    normal: "2",
    deficiency: "Most people don't see anything or see something wrong.",
    note: "Normal view sees 2; red-green deficient subjects usually do not read it correctly."
  },
  {
    plateNum: 9,
    normal: "Nothing (Hidden figure)",
    deficiency: "2 (Red-green deficiency)",
    note: "Normal view does not see a numeral; individuals with red-green deficiencies read 2."
  },
  {
    plateNum: 10,
    normal: "Nothing (Hidden line)",
    deficiency: "A line (Red-green deficiency)",
    note: "Normal view cannot follow a line; individuals with red-green deficiencies trace a line."
  },
  {
    plateNum: 11,
    normal: "16",
    deficiency: "Most people don't see anything or see something wrong.",
    note: "Normal view sees 16; red-green deficient subjects see nothing or wrong numeral."
  },
  {
    plateNum: 12,
    normal: "Blue-green line",
    deficiency: "Nothing (Red-green deficiency)",
    note: "Normal view traces continuous winding blue-green line; red-green deficient subjects cannot trace it."
  },
  {
    plateNum: 13,
    normal: "35",
    deficiency: "5 (Protanopia / protanomaly) | 3 (Deuteranopia / deuteranomaly)",
    note: "Diagnostic plate differentiating protan (red-blind/weak) from deutan (green-blind/weak)."
  },
  {
    plateNum: 14,
    normal: "96",
    deficiency: "6 (Protanopia / protanomaly) | 9 (Deuteranopia / deuteranomaly)",
    note: "Diagnostic plate differentiating protan (sees 6) from deutan (sees 9)."
  },
  {
    plateNum: 15,
    normal: "26",
    deficiency: "6 (Protanopia / protanomaly) | 2 (Deuteranopia / deuteranomaly)",
    note: "Diagnostic plate differentiating protan (sees 6) from deutan (sees 2)."
  },
  {
    plateNum: 16,
    normal: "Purple and red spots / lines",
    deficiency: "Only purple line (Protanopia / protanomaly) | Only red line (Deuteranopia / deuteranomaly)",
    note: "Subject is asked what pattern and colors can be seen. Both lines visible indicates normal color vision."
  }
];

const generateReportString = (session: SessionData, patientName?: string): string => {
  const header = patientName ? `Patient: ${patientName}\n` : '';
  const ishiharaStr = session.ishihara ? `Ishihara: ${session.ishihara.score}/16\n` : '';
  const body = ['OD', 'OS'].map(eye => {
    const data = session[eye];
    if (!data) return null;

    const sc = data['SC'];
    const cc = data['CC'];
    const scph = data['SCPH'];
    const ccph = data['CCPH'];

    // Default to '—' if SC not present, or try to format its value
    const scVal = sc ? (sc.nonLetter || (sc.logMAR !== undefined ? logMARToSnellen(sc.logMAR) : '—')) : '—';
    const scNL = sc?.nonLetter?.toUpperCase() || '';
    const isNonLetter = !!sc?.nonLetter;
    const isLowVision = scNL.startsWith('HM') || scNL === 'LP' || scNL === 'NLP';

    let line = `${eye}: ${isNonLetter ? '' : 'sc '}${scVal}`;

    if (isLowVision) return line;

    if (cc) {
      if (cc.statusLabel === 'NICC') {
        line += ` NICC`;
      } else {
        const ccVal = cc.nonLetter || (cc.logMAR !== undefined ? logMARToSnellen(cc.logMAR) : '—');
        line += ` cc ${ccVal}`;
      }
    }

    const phKey = ccph ? 'CCPH' : (scph ? 'SCPH' : null);
    if (phKey) {
      const phData = data[phKey];
      if (phData.statusLabel === 'NIPH') {
        line += ` NIPH`;
      } else {
        const phVal = phData.nonLetter || (phData.logMAR !== undefined ? logMARToSnellen(phData.logMAR) : '—');
        line += ` ${phKey.toLowerCase()} ${phVal}`;
      }
    }
    return line;
  }).filter(Boolean).join('\n');
  return header + ishiharaStr + body;
};

const AnimatedLogo = () => (
  <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center shrink-0">
    <motion.div
      animate={{ 
        scale: [1, 1.02, 1],
        rotate: [0, 2, -2, 0]
      }}
      transition={{ 
        duration: 8, 
        repeat: Infinity, 
        ease: "easeInOut" 
      }}
      className="relative z-10 bg-theme-surface border border-theme-border rounded-[32px] sm:rounded-[40px] p-5 sm:p-6 shadow-2xl"
    >
      <svg width="68" height="68" className="sm:w-20 sm:h-20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Outer Pulsing Glow */}
        <motion.circle 
          cx="50" cy="50" r="48" 
          stroke="currentColor" 
          strokeWidth="1" 
          className="text-theme-primary opacity-10"
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        {/* Scanning Ray */}
        <motion.rect
          x="10" y="48" width="80" height="4"
          rx="2"
          fill="url(#scanningGradient)"
          animate={{ 
            y: [15, 85, 15],
            opacity: [0, 0.4, 0]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
        {/* Eye Contour */}
        <motion.path 
          d="M10 50C10 50 25 20 50 20C75 20 90 50 90 50C90 50 75 80 50 80C25 80 10 50 10 50Z" 
          stroke="currentColor" 
          strokeWidth="3" 
          strokeLinecap="round"
          className="text-theme-text"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
        {/* Iris */}
        <motion.circle 
          cx="50" cy="50" r="18" 
          stroke="currentColor" 
          strokeWidth="2"
          className="text-theme-primary/30"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        {/* Pupil */}
        <motion.circle 
          cx="50" cy="50" r="10" 
          fill="currentColor"
          className="text-theme-primary"
          animate={{ 
            r: [9, 11, 9],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Eye Glint */}
        <motion.circle 
          cx="56" cy="44" r="3" 
          fill="white"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        <defs>
          <linearGradient id="scanningGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="50%" stopColor="var(--theme-accent)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
    
    {/* Background dynamic arcs */}
    <div className="absolute inset-0 flex items-center justify-center -z-10">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute border border-theme-primary/10 rounded-full"
          style={{ width: 140 + i * 40, height: 140 + i * 40 }}
          animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
          transition={{ duration: 30 + i * 10, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  </div>
);

const TutorialTooltip = ({ children, className, arrowClassName }: { children: React.ReactNode, className: string, arrowClassName: string }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 0.7 }}
    className={`absolute bg-blue-600/90 text-white p-3 text-xs rounded-xl shadow-2xl pointer-events-none font-sans tracking-normal text-left w-max z-[100] border border-blue-400 ${className}`}
  >
    {children}
    <div className={`absolute border-[6px] border-transparent ${arrowClassName}`}></div>
  </motion.div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('etdrs');
  const [currentStage, setCurrentStage] = useState<Stage>('EYE_INIT');
  const [currentEye, setCurrentEye] = useState<Eye>('OD');
  const [currentMode, setCurrentMode] = useState<TestMode>('SC');
  const [rows, setRows] = useState<Row[]>(getInitialRows());
  const [session, setSession] = useState<SessionData>({});
  const [hasCorrection, setHasCorrection] = useState<boolean | null>(null);
  const [showCFSelector, setShowCFSelector] = useState(false);
  const [showHMSelector, setShowHMSelector] = useState(false);
  const [testDistance, setTestDistance] = useState(4); // Default 4m
  const [colorTestIndex, setColorTestIndex] = useState(0);
  const [notationMode, setNotationMode] = useState<'snellen' | 'logmar'>('snellen');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [lastSavedSession, setLastSavedSession] = useState<string>('');
  const [startingEye, setStartingEye] = useState<Eye>('OD');
  const [isTutorial, setIsTutorial] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [ishiharaAnswers, setIshiharaAnswers] = useState<('correct' | 'incorrect' | null)[]>(Array(16).fill(null));
  const [plate16Choice, setPlate16Choice] = useState<string>('');
  const [swipeDirection, setSwipeDirection] = useState<'up' | 'down' | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState<number>(0);
  const [hasVibratedThreshold, setHasVibratedThreshold] = useState<boolean>(false);
  const [showIshiharaModal, setShowIshiharaModal] = useState(false);
  const [selectedPlateForInterpretation, setSelectedPlateForInterpretation] = useState<number>(1);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Load history and theme on mount
  useEffect(() => {
    const saved = localStorage.getItem('ophtha_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load history', e);
      }
    }
    
    const savedTheme = localStorage.getItem('ophtha_theme');
    if (savedTheme === 'light') {
      setTheme('light');
    }
  }, []);

  // Save history when it changes
  useEffect(() => {
    localStorage.setItem('ophtha_history', JSON.stringify(history));
  }, [history]);

  // Handle theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light-theme');
      root.classList.remove('dark'); // Just in case Tailwind dark mode is active
    } else {
      root.classList.remove('light-theme');
      root.classList.add('dark');
    }
    localStorage.setItem('ophtha_theme', theme);
  }, [theme]);

  // Preload Ishihara plates on mount
  useEffect(() => {
    for (let i = 1; i <= 16; i++) {
      const img = new Image();
      img.src = `./ishihara/plate${i}.webp`;
    }
  }, []);

  // Auto-save session when results are reached
  useEffect(() => {
    if (currentStage === 'RESULTS' && Object.keys(session).length > 0) {
      const sessionStr = JSON.stringify(session);
      if (sessionStr !== lastSavedSession) {
        saveCurrentSession();
        setLastSavedSession(sessionStr);
      }
    }
  }, [currentStage, session, lastSavedSession]);

  const saveCurrentSession = () => {
    if (Object.keys(session).length === 0) return;
    
    const entry: HistoryEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      session: { ...session },
      patientName: patientName.trim() || undefined
    };
    
    setHistory(prev => [entry, ...prev]);
  };

  // Derived VA - Every mistake is counted, sum of all correct letters
  const totalCorrect = useMemo(() => {
    return rows.reduce((total, row) => {
      return total + row.letters.filter(l => l.correct).length;
    }, 0);
  }, [rows]);

  const currentLogMAR = useMemo(() => {
    // Standard ETDRS scoring: LogMAR = 1.1 - (0.02 * total_correct)
    const baseLogMAR = Number((1.1 - (totalCorrect * 0.02)).toFixed(2));
    // Apply distance correction: log10(4 / testDistance)
    const distanceCorrection = Math.log10(4 / testDistance);
    return Number((baseLogMAR + distanceCorrection).toFixed(2));
  }, [totalCorrect, testDistance]);

  // Check if VA is impossible: any line has highlighted letter(s) while an earlier line has < 3 highlighted letters
  const isVAImpossible = useMemo(() => {
    let hadLineWithLessThan3 = false;
    for (let i = 0; i < rows.length; i++) {
      const correctCount = rows[i].letters.filter(l => l.correct).length;
      if (hadLineWithLessThan3 && correctCount > 0) {
        return true;
      }
      if (correctCount < 3) {
        hadLineWithLessThan3 = true;
      }
    }
    return false;
  }, [rows]);

  const toggleLetter = (lineIndex: number, letterIndex: number) => {
    const newRows = [...rows];
    newRows[lineIndex].letters[letterIndex].correct = !newRows[lineIndex].letters[letterIndex].correct;
    setRows(newRows);
  };

  // Helper to determine if an eye should skip further testing (CC/PH)
  const isEyeDone = (eye: Eye) => {
    const scData = session[eye]?.['SC'];
    if (!scData) return false;
    // Done if 20/20
    if (scData.logMAR !== undefined && scData.logMAR <= 0.0) return true;
    // Done if HM, LP, NLP
    if (scData.nonLetter) {
      const nl = scData.nonLetter.toUpperCase();
      if (nl.startsWith('HM') || nl === 'LP' || nl === 'NLP') return true;
    }
    return false;
  };

  const selectRowAndAbove = (lineIndex: number) => {
    const newRows = [...rows];
    
    // Check if there are any highlighted letters on any row
    const anyHighlighted = newRows.some(r => r.letters.some(l => l.correct));

    // Find the deepest (maximum) line index that currently has any highlighted letters
    let maxLineWithHighlight = -1;
    for (let i = 0; i < newRows.length; i++) {
      if (newRows[i].letters.some(l => l.correct)) {
        maxLineWithHighlight = i;
      }
    }

    if (!anyHighlighted) {
      // 1. Initial state (nothing highlighted yet): highlight all from line 0 up to lineIndex
      for (let i = 0; i <= lineIndex; i++) {
        newRows[i].letters = newRows[i].letters.map(l => ({ ...l, correct: true }));
      }
    } else if (lineIndex === maxLineWithHighlight) {
      // 2. Clicking the currently highest highlighted line:
      // unhighlight this line completely, leaving all previous lines (0 to lineIndex - 1) intact
      newRows[lineIndex].letters = newRows[lineIndex].letters.map(l => ({ ...l, correct: false }));
    } else if (lineIndex < maxLineWithHighlight) {
      // 3. Clicking a line below the deepest highlight (e.g. at line 6 or 7 when line 8 is highlighted):
      // unhighlight all lines strictly below this line (i.e. lineIndex + 1 up to maxLineWithHighlight),
      // and ensure lines up to lineIndex have this line fully highlighted.
      for (let i = lineIndex + 1; i <= maxLineWithHighlight; i++) {
        newRows[i].letters = newRows[i].letters.map(l => ({ ...l, correct: false }));
      }
      // Ensure the clicked line itself is highlighted
      newRows[lineIndex].letters = newRows[lineIndex].letters.map(l => ({ ...l, correct: true }));
    } else {
      // 4. lineIndex > maxLineWithHighlight: There is already a highlight, and user clicks a deeper line.
      // Should NOT highlight everything above it, only highlight this specific line to preserve previous mistakes.
      newRows[lineIndex].letters = newRows[lineIndex].letters.map(l => ({ ...l, correct: true }));
    }

    setRows(newRows);
  };

  const setNonLetterVA = (va: NonLetterVA) => {
    if (va === 'CF') {
      setShowCFSelector(true);
    } else if (va === 'HM') {
      setShowHMSelector(true);
    } else {
      handleNext(undefined, va);
    }
  };

  const handleCFDistanceSelect = (feet: number) => {
    setShowCFSelector(false);
    handleNext(undefined, `CF at ${feet}ft`);
  };

  const handleHMProjectionSelect = (projection: string) => {
    setShowHMSelector(false);
    const code = projection === 'good' ? 'G' : (projection === 'fair' ? 'F' : 'P');
    handleNext(undefined, `HM w/ ${code}LPj`);
  };

  const getNextStageContext = (currentSess: SessionData, corrState: boolean | null, bypassPHIntro: boolean = false): {eye?: Eye, mode?: TestMode, stage: Stage} => {
    const e1 = startingEye;
    const e2 = startingEye === 'OD' ? 'OS' : 'OD';

    const isTerminal = (eye: Eye, sess: SessionData) => {
      const sc = sess[eye]?.['SC'];
      if (sc) {
        if (sc.logMAR !== undefined && sc.logMAR <= 0.0) return true;
        if (sc.nonLetter && ['HM', 'LP', 'NLP'].some(prefix => sc.nonLetter!.toUpperCase().startsWith(prefix))) return true;
      }
      const cc = sess[eye]?.['CC'];
      if (cc && cc.statusLabel !== 'NICC') {
        if (cc.logMAR !== undefined && cc.logMAR <= 0.0) return true;
        if (cc.nonLetter && ['HM', 'LP', 'NLP'].some(prefix => cc.nonLetter!.toUpperCase().startsWith(prefix))) return true;
      }
      return false;
    };

    // 1. SC Phase
    if (!currentSess[e1]?.['SC']) return { eye: e1, mode: 'SC', stage: 'TEST_SC' };
    if (!currentSess[e2]?.['SC']) return { eye: e2, mode: 'SC', stage: 'TEST_SC' };

    const e1NeedsMore = !isTerminal(e1, currentSess);
    const e2NeedsMore = !isTerminal(e2, currentSess);

    if (!e1NeedsMore && !e2NeedsMore) return { stage: 'COLOR_CHOICE' };

    // 2. Correction Check Phase
    if (corrState === null) return { stage: 'CC_CHECK' };

    // 3. CC Phase
    if (corrState === true) {
      if (e1NeedsMore && !currentSess[e1]?.['CC']) return { eye: e1, mode: 'CC', stage: 'TEST_CC' };
      if (e2NeedsMore && !currentSess[e2]?.['CC']) return { eye: e2, mode: 'CC', stage: 'TEST_CC' };
    }

    // 4. PH Phase
    const phMode = corrState ? 'CCPH' : 'SCPH';
    const anyPHData = Boolean(currentSess[e1]?.[phMode] || currentSess[e2]?.[phMode]);

    if (!anyPHData && !bypassPHIntro && (e1NeedsMore || e2NeedsMore)) {
      return { stage: 'TEST_PH_INTRO' };
    }

    if (e1NeedsMore && !currentSess[e1]?.[phMode]) return { eye: e1, mode: phMode, stage: 'TEST_PH' };
    if (e2NeedsMore && !currentSess[e2]?.[phMode]) return { eye: e2, mode: phMode, stage: 'TEST_PH' };

    return { stage: 'COLOR_CHOICE' };
  };

  const advanceToNext = (nextContext: {eye?: Eye, mode?: TestMode, stage: Stage}) => {
    if (nextContext.eye) setCurrentEye(nextContext.eye);
    if (nextContext.mode) setCurrentMode(nextContext.mode);
    if (nextContext.stage.startsWith('TEST_')) setRows(getInitialRows());
    setCurrentStage(nextContext.stage);
  };

  const handleCorrectionChoice = (withCorrection: boolean) => {
    setHasCorrection(withCorrection);
    const nextContext = getNextStageContext(session, withCorrection);
    advanceToNext(nextContext);
  };

  const handleNext = (overrideLogMAR?: number, overrideNonLetter?: string) => {
    const scrollContainer = document.getElementById('chart-container');
    if (scrollContainer) scrollContainer.scrollTop = 0;

    if (currentStage === 'EYE_INIT') {
      setCurrentStage('TEST_SC');
      return;
    }

    if (currentStage === 'TEST_PH_INTRO') {
      const nextContext = getNextStageContext(session, hasCorrection, true);
      advanceToNext(nextContext);
      return;
    }

    if (currentStage === 'COLOR_CHOICE' || currentStage === 'TEST_COLORS' || currentStage === 'TEST_ISHIHARA') {
      if (activeTab === 'exam') {
        setCurrentStage('EYE_INIT');
      } else {
        setCurrentStage('RESULTS');
      }
      return;
    }

    const finalLogMAR = overrideLogMAR !== undefined ? overrideLogMAR : currentLogMAR;
    const finalNonLetter = overrideNonLetter !== undefined ? overrideNonLetter : undefined;
    
    let statusLabel: 'NIPH' | 'NICC' | undefined = undefined;
    if (finalLogMAR !== undefined) {
      if (currentMode === 'CC') {
        const scData = session[currentEye]?.['SC'];
        if (scData && scData.logMAR !== undefined && finalLogMAR >= scData.logMAR) statusLabel = 'NICC';
      } else if (currentMode === 'SCPH') {
        const scData = session[currentEye]?.['SC'];
        if (scData && scData.logMAR !== undefined && finalLogMAR >= scData.logMAR) statusLabel = 'NIPH';
      } else if (currentMode === 'CCPH') {
        const ccData = session[currentEye]?.['CC'];
        if (ccData && ccData.logMAR !== undefined && finalLogMAR >= ccData.logMAR) statusLabel = 'NIPH';
      }
    }

    const updatedSession = {
      ...session,
      [currentEye]: {
        ...(session[currentEye] || {}),
        [currentMode]: {
          logMAR: finalLogMAR,
          nonLetter: finalNonLetter,
          isCorrected: currentMode.startsWith('CC'),
          testDistance,
          statusLabel,
          gridState: JSON.parse(JSON.stringify(rows)),
        }
      }
    };

    setSession(updatedSession);
    const nextContext = getNextStageContext(updatedSession, hasCorrection);
    advanceToNext(nextContext);
  };

  const getBacktrackSteps = () => {
    if (isTutorial) {
      return [
        {eye: 'OD', mode: 'SC'},
        {eye: 'OS', mode: 'SC'}
      ] as {eye: Eye, mode: TestMode}[];
    }

    const steps: {eye: Eye, mode: TestMode}[] = [];
    const e1 = startingEye;
    const e2 = startingEye === 'OD' ? 'OS' : 'OD';

    const testModes: TestMode[] = ['SC'];
    if (hasCorrection === true) testModes.push('CC');
    const phMode = hasCorrection ? 'CCPH' : 'SCPH';
    // We only push PH onto the sequence if not bypassed... but since anyone COULD be tested for PH, we just add it to sequence.
    testModes.push(phMode);

    const sequence: {eye: Eye, mode: TestMode}[] = [];
    for (const mode of testModes) {
      sequence.push({eye: e1, mode});
      sequence.push({eye: e2, mode});
    }

    for (const step of sequence) {
      const hasData = session[step.eye]?.[step.mode] !== undefined;
      const isActive = currentEye === step.eye && currentMode === step.mode && currentStage.startsWith('TEST_');
      
      if (hasData || isActive) {
        steps.push(step);
      } else {
        break;
      }
    }
    return steps;
  };

  const restart = () => {
    setIsTutorial(false);
    setCurrentStage('EYE_INIT');
    setCurrentEye('OD');
    setCurrentMode('SC');
    setRows(getInitialRows());
    setSession({});
    setHasCorrection(null);
    setTestDistance(4);
    setColorTestIndex(0);
    setIshiharaAnswers(Array(16).fill(null));
    setPlate16Choice('');
    setDragOffsetY(0);
    setSwipeDirection(null);
    setPatientName('');
  };

  const copyReport = () => {
    navigator.clipboard.writeText(generateReportString(session, patientName));
  };

  return (
    <div className={`flex flex-col h-dvh font-sans overflow-hidden transition-colors duration-300 pb-[env(safe-area-inset-bottom,0px)] ${theme === 'light' ? 'bg-white text-slate-900' : 'bg-zinc-950 text-white'}`} style={{ backgroundColor: 'var(--theme-bg)', color: 'var(--theme-text)' }}>
      {/* Main Content */}
      <main className="flex-1 min-h-0 relative overflow-y-auto" style={{ backgroundColor: 'var(--theme-bg)' }} id="chart-container">
        {/* Color Tests (Standalone or Exam) */}
        <AnimatePresence>
          {currentStage === 'TEST_COLORS' && (
            <motion.div 
              key="colors"
              className="fixed inset-0 z-[100] flex flex-col items-center justify-center cursor-pointer transition-colors duration-200"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ backgroundColor: ['#FF0000', '#FFFF00', '#0000FF', '#008000'][colorTestIndex] }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                if (x > rect.width / 2) {
                  if (colorTestIndex < 3) {
                    setColorTestIndex(prev => prev + 1);
                  } else {
                    if (activeTab === 'exam') {
                      setCurrentStage('EYE_INIT');
                    } else {
                      setCurrentStage('RESULTS');
                    }
                  }
                } else {
                  if (colorTestIndex > 0) setColorTestIndex(prev => prev - 1);
                }
              }}
            />
          )}

          {currentStage === 'TEST_ISHIHARA' && (() => {
            // Calculate dynamic light opacity and gradient extent based on dragOffsetY
            const isSwipingUp = dragOffsetY < 0;
            const isSwipingDown = dragOffsetY > 0;
            const absOffset = Math.abs(dragOffsetY);
            // Threshold is 60px where it reaches maximum opacity 0.95 / fully opaque appearance
            const progress = Math.min(absOffset / 60, 1);
            const lightOpacity = progress;
            const gradientSpread = 20 + progress * 60; // 20% to 80% coverage
            const reachedThreshold = absOffset >= 60;

            return (
              <motion.div 
                key="ishihara"
                className="fixed inset-0 z-[100] bg-theme-bg flex flex-col items-center justify-center overflow-hidden select-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Dynamic Green Light from Top when dragging UP */}
                {isSwipingUp && absOffset > 3 && (
                  <div 
                    className="absolute inset-0 pointer-events-none z-50 transition-opacity duration-75"
                    style={{
                      background: `linear-gradient(to bottom, rgba(34, 197, 94, ${lightOpacity * 0.95}) 0%, rgba(34, 197, 94, ${lightOpacity * 0.4}) ${gradientSpread * 0.6}%, transparent ${gradientSpread}%)`,
                      opacity: lightOpacity
                    }}
                  />
                )}

                {/* Dynamic Red Light from Bottom when dragging DOWN */}
                {isSwipingDown && absOffset > 3 && (
                  <div 
                    className="absolute inset-0 pointer-events-none z-50 transition-opacity duration-75"
                    style={{
                      background: `linear-gradient(to top, rgba(239, 68, 68, ${lightOpacity * 0.95}) 0%, rgba(239, 68, 68, ${lightOpacity * 0.4}) ${gradientSpread * 0.6}%, transparent ${gradientSpread}%)`,
                      opacity: lightOpacity
                    }}
                  />
                )}

                {/* Top Bar: Cancel (top-left) & Review Interpretation (top-right) */}
                <div className="absolute top-4 inset-x-0 px-4 flex items-center justify-between z-40 pointer-events-auto">
                  <button 
                    onClick={() => {
                      setCurrentStage('EYE_INIT');
                    }}
                    className="px-4 py-2 bg-theme-surface/90 backdrop-blur-sm border border-theme-border rounded-xl text-theme-dim font-black uppercase tracking-wider text-[11px] hover:text-red-500 hover:border-red-500/40 transition-all active:scale-95 shadow-md"
                  >
                    Cancel
                  </button>

                  <button 
                    onClick={() => {
                      setSelectedPlateForInterpretation(colorTestIndex + 1);
                      setShowIshiharaModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-theme-primary/10 hover:bg-theme-primary/20 text-theme-primary border border-theme-primary/30 rounded-xl font-black uppercase tracking-wider text-[11px] transition-all active:scale-95 shadow-md"
                  >
                    <Info size={14} /> Review Interpretation
                  </button>
                </div>

                {/* Plate Counter & Dots: centered in the space between upper buttons and the plate circle without affecting anything else */}
                <div className="mt-14 mb-2 flex flex-col items-center z-20 -translate-y-7 sm:-translate-y-9 pointer-events-auto">
                  <div className="font-mono font-black text-xs uppercase tracking-[0.2em] text-theme-dim text-center mb-1.5">
                    Plate {colorTestIndex + 1} / 16
                  </div>

                  {/* Tracking Dots */}
                  <div className="flex gap-1.5">
                    {ishiharaAnswers.map((ans, idx) => (
                      <div 
                        key={`dot-${idx}`}
                        onClick={() => setColorTestIndex(idx)}
                        className={`w-3 h-3 rounded-full cursor-pointer transition-all ${
                          ans === 'correct' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' :
                          ans === 'incorrect' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' :
                          idx === colorTestIndex ? 'bg-theme-primary w-6' : 'bg-theme-border/60'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="relative w-full max-w-sm aspect-square p-4 flex items-center justify-center">
                  {/* First plate tap & swipe hints: closer to circle, vertical side labels outside circle */}
                  {colorTestIndex === 0 && (
                    <div className="absolute inset-0 pointer-events-none z-30">
                      {/* Swipe Up: close above circle */}
                      <div className="absolute -top-3 inset-x-0 flex justify-center">
                        <span className="bg-theme-surface/90 backdrop-blur-sm px-3 py-0.5 rounded-full border border-theme-border shadow-md text-theme-primary text-[10px] font-black uppercase tracking-wider">
                          Swipe Up = Correct
                        </span>
                      </div>

                      {/* Left: vertical outside circle */}
                      <div className="absolute -left-3 top-1/2 -translate-y-1/2 flex items-center">
                        <span className="bg-theme-surface/90 backdrop-blur-sm px-1.5 py-2.5 rounded-full border border-theme-border shadow-md text-[9px] font-black uppercase tracking-widest text-theme-dim [writing-mode:vertical-lr] rotate-180">
                          Tap: Prev
                        </span>
                      </div>

                      {/* Right: vertical outside circle */}
                      <div className="absolute -right-3 top-1/2 -translate-y-1/2 flex items-center">
                        <span className="bg-theme-surface/90 backdrop-blur-sm px-1.5 py-2.5 rounded-full border border-theme-border shadow-md text-[9px] font-black uppercase tracking-widest text-theme-dim [writing-mode:vertical-lr]">
                          Tap: Next
                        </span>
                      </div>

                      {/* Swipe Down: close below circle */}
                      <div className="absolute -bottom-3 inset-x-0 flex justify-center">
                        <span className="bg-theme-surface/90 backdrop-blur-sm px-3 py-0.5 rounded-full border border-theme-border shadow-md text-red-500 text-[10px] font-black uppercase tracking-wider">
                          Swipe Down = Wrong
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Far-left and Far-right instant switch hitzones */}
                  <div 
                    onClick={() => {
                      if (colorTestIndex > 0) setColorTestIndex(prev => prev - 1);
                    }}
                    title="Previous plate"
                    className="absolute left-0 inset-y-0 w-16 z-30 cursor-pointer active:bg-theme-primary/5 transition-colors"
                  />
                  <div 
                    onClick={() => {
                      if (colorTestIndex < 15) setColorTestIndex(prev => prev + 1);
                    }}
                    title="Next plate"
                    className="absolute right-0 inset-y-0 w-16 z-30 cursor-pointer active:bg-theme-primary/5 transition-colors"
                  />

                  {/* Preload images */}
                  <div className="absolute w-0 h-0 opacity-0 overflow-hidden pointer-events-none">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <img key={`preload-plate-${i}`} src={`./ishihara/plate${i + 1}.webp`} alt={`Preload ${i + 1}`} />
                    ))}
                  </div>
                  
                  {/* The whole circle moves together when dragging */}
                  <motion.div 
                    key={colorTestIndex}
                    initial={false}
                    animate={{ 
                      scale: 1, 
                      opacity: 1, 
                      y: 0 
                    }}
                    exit={{ 
                      opacity: 0, 
                      y: swipeDirection === 'up' ? -350 : swipeDirection === 'down' ? 350 : 0 
                    }}
                    transition={{ duration: 0.15 }}
                    drag="y"
                    dragConstraints={{ top: 0, bottom: 0 }}
                    dragElastic={0.65}
                    onDrag={(_, info) => {
                      const curOffsetY = info.offset.y;
                      setDragOffsetY(curOffsetY);
                      if (Math.abs(curOffsetY) >= 60) {
                        if (!hasVibratedThreshold) {
                          setHasVibratedThreshold(true);
                          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                            try { navigator.vibrate(35); } catch (e) {}
                          }
                        }
                      } else {
                        if (hasVibratedThreshold) {
                          setHasVibratedThreshold(false);
                        }
                      }
                    }}
                    onDragEnd={(_, info) => {
                      const offsetY = info.offset.y;
                      setDragOffsetY(0);
                      setHasVibratedThreshold(false);

                      if (offsetY < -55) {
                        // Swipe Up = Correct
                        setSwipeDirection('up');
                        const newAnswers = [...ishiharaAnswers];
                        newAnswers[colorTestIndex] = 'correct';
                        setIshiharaAnswers(newAnswers);
                        setTimeout(() => {
                          setSwipeDirection(null);
                          if (colorTestIndex < 15) {
                            setColorTestIndex(prev => prev + 1);
                          } else {
                            const score = newAnswers.filter(a => a === 'correct').length;
                            setSession(prev => ({
                              ...prev,
                              ishihara: { answers: newAnswers, score, plate16Choice }
                            }));
                            setActiveTab('etdrs');
                            setCurrentStage('RESULTS');
                          }
                        }, 150);
                      } else if (offsetY > 55) {
                        // Swipe Down = Wrong
                        setSwipeDirection('down');
                        const newAnswers = [...ishiharaAnswers];
                        newAnswers[colorTestIndex] = 'incorrect';
                        setIshiharaAnswers(newAnswers);
                        setTimeout(() => {
                          setSwipeDirection(null);
                          if (colorTestIndex < 15) {
                            setColorTestIndex(prev => prev + 1);
                          } else {
                            const score = newAnswers.filter(a => a === 'correct').length;
                            setSession(prev => ({
                              ...prev,
                              ishihara: { answers: newAnswers, score, plate16Choice }
                            }));
                            setActiveTab('etdrs');
                            setCurrentStage('RESULTS');
                          }
                        }, 150);
                      }
                    }}
                    className={`w-full h-full rounded-full border-8 overflow-hidden flex items-center justify-center bg-white shadow-2xl cursor-grab active:cursor-grabbing transition-colors duration-150 relative z-20 ${
                      reachedThreshold 
                        ? (isSwipingUp ? 'border-green-500 shadow-[0_0_25px_rgba(34,197,94,0.6)]' : 'border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.6)]') 
                        : 'border-theme-border'
                    }`}
                  >
                     <img 
                      src={`./ishihara/plate${colorTestIndex + 1}.webp`}
                      alt={`Ishihara Plate ${colorTestIndex + 1}`}
                      className="w-full h-full object-contain pointer-events-none select-none"
                      referrerPolicy="no-referrer"
                    />
                  </motion.div>
                </div>

                {/* Plate 16 Prompt - Exact text requested */}
                {colorTestIndex === 15 && (
                  <div className="mt-2 bg-theme-surface border border-theme-border px-6 py-2 rounded-2xl max-w-sm text-center z-20 shadow-xl">
                    <p className="text-xs font-black uppercase tracking-wider text-theme-text">
                      Ask what pattern and colors seen
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {activeTab === 'etdrs' ? (
          <div className="max-w-xl mx-auto px-2 py-2 w-full h-full flex flex-col justify-center">
            <AnimatePresence mode="wait">
              {currentStage === 'EYE_INIT' && (
                <motion.div 
                  key="init"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="flex flex-col items-center justify-center text-center max-w-sm mx-auto h-full max-h-[580px] py-1 gap-2"
                >
                  {/* Logo and Title grouped tightly together */}
                  <div className="flex flex-col items-center gap-0">
                    <AnimatedLogo />

                    <div className="space-y-0.5 -mt-1">
                      <h2 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase leading-tight text-theme-text text-balance">
                        ETDRS CHART <br/><span className="text-theme-primary">CALCULATOR</span>
                      </h2>
                    </div>
                  </div>

                  <div className="flex flex-col w-full gap-2.5 my-1">
                    <input 
                      type="text" 
                      placeholder="Patient Name (Optional)" 
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full bg-theme-surface border border-theme-border rounded-xl px-4 py-2.5 text-theme-text text-sm font-bold text-center placeholder:text-theme-dim/50 focus:outline-none focus:border-theme-primary transition-all shadow-inner"
                    />

                    <button 
                      onClick={() => {
                        setStartingEye('OD');
                        setCurrentEye('OD');
                        setCurrentStage('TEST_SC');
                      }}
                      className="group relative bg-theme-primary text-white font-black py-4 sm:py-5 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 text-base overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                      <span className="relative z-10 flex items-center gap-2">START WITH OD <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" /></span>
                    </button>

                    <button 
                      onClick={() => {
                        setStartingEye('OS');
                        setCurrentEye('OS');
                        setCurrentStage('TEST_SC');
                      }}
                      className="group relative bg-theme-surface border-2 border-theme-primary/20 text-theme-primary font-black py-4 sm:py-5 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 text-base overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-theme-primary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                      <span className="relative z-10 flex items-center gap-2 uppercase">Start with OS <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" /></span>
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => {
                      setIsTutorial(true);
                      setStartingEye('OD');
                      setCurrentEye('OD');
                      setCurrentMode('SC');
                      setRows(getInitialRows());
                      setCurrentStage('TEST_SC');
                      setTestDistance(4);
                    }}
                    className="px-5 py-1.5 rounded-full border border-theme-border text-theme-dim text-[11px] font-black uppercase tracking-widest hover:text-white transition-colors"
                  >
                    Tutorial Mode
                  </button>
                </motion.div>
              )}

              {(currentStage === 'TEST_SC' || currentStage === 'TEST_CC' || currentStage === 'TEST_PH') && (
                <motion.div 
                  key="chart"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col h-full justify-between pb-0 relative"
                >
                  <AnimatePresence>
                    {showCFSelector && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute inset-0 z-50 bg-theme-bg/95 backdrop-blur-md flex flex-col items-center justify-center p-6 space-y-6"
                      >
                        <h3 className="text-xl font-black text-theme-text uppercase tracking-widest italic">Distance for CF?</h3>
                        <div className="grid grid-cols-1 gap-4 w-full max-w-xs">
                          {[1, 2, 3].map(ft => (
                            <button
                              key={ft}
                              onClick={() => handleCFDistanceSelect(ft)}
                              className="bg-theme-primary text-white font-black py-4 rounded-xl shadow-xl active:scale-95 text-lg"
                            >
                              {ft === 1 ? '1 foot' : `${ft} feet`}
                            </button>
                          ))}
                          <button
                            onClick={() => setShowCFSelector(false)}
                            className="text-theme-dim font-black py-2 uppercase tracking-widest text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </motion.div>
                    )}
                    {showHMSelector && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute inset-0 z-50 bg-theme-bg/95 backdrop-blur-md flex flex-col items-center justify-center p-6 space-y-6"
                      >
                        <h3 className="text-xl font-black text-theme-text uppercase tracking-widest italic text-center">Light Projection for HM?</h3>
                        <div className="grid grid-cols-1 gap-4 w-full max-w-xs">
                          {['poor', 'fair', 'good'].map(level => (
                            <button
                              key={level}
                              onClick={() => handleHMProjectionSelect(level)}
                              className="bg-theme-primary text-white font-black py-4 rounded-xl shadow-xl active:scale-95 text-lg uppercase tracking-widest"
                            >
                              {level}
                            </button>
                          ))}
                          <button
                            onClick={() => setShowHMSelector(false)}
                            className="text-theme-dim font-black py-2 uppercase tracking-widest text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Header row during ETDRS testing: Backtrack Breadcrumbs + Cancel button */}
                  <div className="flex items-center justify-between gap-2 mb-2 relative z-10 w-full mt-2">
                    <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                      {isTutorial && (
                        <TutorialTooltip
                           className="left-0 top-full mt-3"
                           arrowClassName="bottom-full left-6 border-b-blue-600/90"
                        >
                          <span className="font-black">Tabs:</span> Review tabs to backtrack<br/>or edit previous stages.
                        </TutorialTooltip>
                      )}
                      {getBacktrackSteps().map(step => {
                        const isActive = currentEye === step.eye && currentMode === step.mode;
                        return (
                          <button
                            key={`${step.eye}-${step.mode}`}
                            onClick={() => {
                              if (!isActive) {
                                setSession(prev => ({
                                  ...prev,
                                  [currentEye]: {
                                    ...(prev[currentEye] || {}),
                                    [currentMode]: {
                                      ...(prev[currentEye]?.[currentMode] || {}),
                                      logMAR: currentLogMAR,
                                      isCorrected: currentMode.startsWith('CC'),
                                      testDistance,
                                      gridState: JSON.parse(JSON.stringify(rows))
                                    }
                                  }
                                }));
                                setCurrentEye(step.eye);
                                setCurrentMode(step.mode);
                                const stepData = session[step.eye]?.[step.mode];
                                if (stepData?.gridState) {
                                  setRows(JSON.parse(JSON.stringify(stepData.gridState)));
                                } else {
                                  setRows(getInitialRows());
                                }
                                if (stepData?.testDistance) {
                                  setTestDistance(stepData.testDistance);
                                }
                                const stage = step.mode === 'SC' ? 'TEST_SC' : step.mode === 'CC' ? 'TEST_CC' : 'TEST_PH';
                                setCurrentStage(stage);
                              }
                            }}
                            className={`px-2.5 sm:px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${
                              isActive 
                              ? 'bg-theme-primary text-white border-theme-primary shadow-lg shadow-theme-primary/30' 
                              : 'bg-theme-surface text-theme-dim border-theme-border hover:border-theme-primary/50'
                            }`}
                          >
                            {step.eye} {step.mode}
                          </button>
                        );
                      })}
                    </div>

                    {/* Cancel ETDRS Button */}
                    <button
                      onClick={() => setShowCancelConfirm(true)}
                      className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-theme-dim hover:text-red-500 bg-theme-surface border border-theme-border hover:border-red-500/40 transition-all active:scale-95 shadow-sm shrink-0"
                      title="Cancel test and reset"
                    >
                      <X size={12} /> Cancel
                    </button>
                  </div>

                  <div className="flex gap-1 w-full items-stretch flex-1 min-h-0 my-0.5">
                    {/* Left: Chart */}
                    <div className="flex-1 bg-theme-surface rounded-[20px] sm:rounded-[24px] p-1 sm:p-2 shadow-2xl border border-theme-border flex flex-col justify-between overflow-hidden">
                      <table className="w-full h-full border-separate border-spacing-y-0.5 sm:border-spacing-y-1">
                        <tbody>
                          {rows.map((row, rIdx) => (
                            <tr key={rIdx} className={`transition-colors rounded group ${row.letters.every(l => l.correct) ? 'bg-theme-primary/5' : ''}`}>
                              <td className="w-5 sm:w-6 align-middle py-0">
                                <button 
                                  onClick={() => selectRowAndAbove(rIdx)}
                                  className={`relative w-5 sm:w-6 h-5 sm:h-6 rounded flex items-center justify-center transition-all border ${
                                    row.letters.every(l => l.correct) 
                                    ? 'bg-theme-primary text-white border-theme-primary shadow-[0_0_15px_-5px_rgba(59,130,246,0.6)]' 
                                    : 'bg-theme-bg text-theme-dim border-theme-border hover:border-theme-dim'
                                  }`}
                                >
                                  <span className="text-[9px] sm:text-[10px] font-black">{row.lineNum}</span>
                                  {isTutorial && rIdx === 4 && (
                                    <TutorialTooltip
                                      className="top-1/2 left-full ml-3 -translate-y-1/2"
                                      arrowClassName="top-1/2 right-full border-r-blue-600/90 -translate-y-1/2"
                                    >
                                      <span className="font-black text-xs">Line Number</span><br/>Click to highlight this line<br/>and all above it.
                                    </TutorialTooltip>
                                  )}
                                </button>
                              </td>
                              <td className="px-1 sm:px-2 py-0">
                                <div className="flex justify-between items-center gap-0.5 sm:gap-1 leading-none">
                                  {row.letters.map((letter, lIdx) => (
                                    <button
                                      key={lIdx}
                                      onClick={() => toggleLetter(rIdx, lIdx)}
                                      style={{ 
                                        fontSize: rIdx < 11 ? 'clamp(16px, 3.2vh, 28px)' : 'clamp(11px, 2vh, 16px)',
                                        lineHeight: 1 
                                      }}
                                      className={`flex-1 font-bold transition-all rounded py-0.5 text-center leading-none relative ${
                                        letter.correct 
                                        ? 'text-theme-accent opacity-100 letter-shadow scale-110' 
                                        : 'text-theme-text opacity-25 hover:opacity-50'
                                      }`}
                                    >
                                      {letter.char}
                                      {isTutorial && rIdx === 4 && lIdx === 2 && (
                                        <TutorialTooltip
                                          className="bottom-full left-1/2 mb-3 -translate-x-1/2"
                                          arrowClassName="top-full left-1/2 border-t-blue-600/90 -translate-x-1/2"
                                        >
                                          <span className="font-black text-xs">Individual Letter</span><br/>Click to toggle it singly.
                                        </TutorialTooltip>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Right: Testing Distance Selector Slider (w-14 sm:w-16) */}
                    <div className="w-[54px] sm:w-[64px] shrink-0 bg-theme-surface rounded-[20px] sm:rounded-[24px] border border-theme-border p-1.5 flex flex-col relative shadow-inner">
                      {isTutorial && (
                        <TutorialTooltip
                          className="right-full top-1/2 mr-3 -translate-y-1/2"
                          arrowClassName="top-1/2 left-full border-l-blue-600/90 -translate-y-1/2"
                        >
                          <span className="font-black">Distance Slider</span><br/>Select test distance
                        </TutorialTooltip>
                      )}
                      <div className="absolute inset-0 flex flex-col p-1.5">
                        {[4, 2, 1, 0.5].map((d) => (
                          <div key={`track-[${d}]`} className="flex-1 relative">
                            {testDistance === d && (
                              <motion.div 
                                layoutId="vertical-slider-thumb"
                                className="absolute inset-0 bg-theme-primary rounded-xl shadow-[0_0_20px_-5px_var(--primary)]"
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {[4, 2, 1, 0.5].map((d) => (
                        <button
                          key={`btn-${d}`}
                          onClick={() => setTestDistance(d)}
                          className={`relative z-10 flex-1 flex flex-col items-center justify-center font-black transition-colors ${
                            testDistance === d ? 'text-white' : 'text-theme-dim hover:text-white/50'
                          }`}
                        >
                          <span className="text-[11px] uppercase tracking-widest">{d === 0.5 ? '1/2m' : `${d}m`}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStage === 'TEST_PH_INTRO' && (
                <motion.div 
                   key="ph-intro"
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="flex flex-col items-center justify-center py-20 text-center space-y-8 h-full"
                >
                  <div className="relative flex items-center justify-center mt-6">
                    <div className="w-1 h-20 bg-theme-text/80 rounded-t-lg absolute bottom-[80%]" />
                    <div className="w-24 h-24 bg-theme-text rounded-full flex items-center justify-center shadow-2xl z-10 border-4 border-theme-surface">
                      <div className="w-2 h-2 bg-theme-bg rounded-full shadow-[0_0_10px_white]" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-black tracking-tighter uppercase italic text-theme-text mt-4">Pinhole Testing</h2>
                    <p className="text-theme-dim mt-3 max-w-xs mx-auto text-lg leading-relaxed">Please place the pinhole occluder over the patient's eye.</p>
                  </div>
                  <button 
                    onClick={() => handleNext()}
                    className="w-full max-w-xs bg-theme-primary text-white font-black py-6 rounded-3xl shadow-xl transition-all active:scale-95 text-lg uppercase tracking-widest mt-4"
                  >
                    Start Pinhole
                  </button>
                </motion.div>
              )}

              {currentStage === 'CC_CHECK' && (
                <motion.div 
                   key="cc"
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="flex flex-col items-center justify-center py-20 text-center space-y-10 h-full"
                >
                   <div className="w-24 h-24 bg-theme-surface border border-theme-border text-theme-primary rounded-full flex items-center justify-center shadow-inner">
                    <Glasses size={48} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black tracking-tighter uppercase italic text-theme-text">Correction?</h2>
                    <p className="text-theme-dim mt-3 max-w-xs mx-auto text-lg">Testing with glasses or contact lenses?</p>
                  </div>
                  <div className="flex gap-4 w-full max-w-sm">
                    <button 
                      onClick={() => handleCorrectionChoice(true)}
                      className="flex-1 bg-theme-primary text-white font-black py-6 rounded-[28px] shadow-2xl transition-all active:scale-95 text-xl"
                    >
                      WITH CC
                    </button>
                    <button 
                      onClick={() => handleCorrectionChoice(false)}
                      className="flex-1 bg-theme-surface border border-theme-border text-theme-text font-black py-6 rounded-[28px] shadow-sm transition-all active:scale-95 text-xl"
                    >
                      NO CC
                    </button>
                  </div>
                </motion.div>
              )}

              {currentStage === 'COLOR_CHOICE' && (
                <motion.div 
                   key="color-choice"
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -20 }}
                   transition={{ duration: 0.2 }}
                   className="flex flex-col items-center justify-center py-20 text-center space-y-10 h-full"
                >
                   <div className="w-24 h-24 bg-theme-surface border border-theme-border text-theme-primary rounded-full flex items-center justify-center overflow-hidden">
                    <div className="grid grid-cols-2 w-full h-full">
                      <div className="bg-red-500"/><div className="bg-yellow-500"/>
                      <div className="bg-blue-500"/><div className="bg-green-500"/>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-black tracking-tighter uppercase italic text-theme-text">Next Steps</h2>
                    <p className="text-theme-dim mt-3 max-w-sm mx-auto text-lg leading-relaxed">Proceed to clinical summary or perform specialized color vision assessments.</p>
                  </div>
                  <div className="flex flex-col gap-3 w-full max-w-sm">
                    <button 
                      onClick={() => {
                        setCurrentStage('RESULTS');
                      }}
                      className="w-full bg-theme-primary text-white font-black py-5 rounded-[24px] shadow-2xl transition-all active:scale-95 text-xl uppercase tracking-widest"
                    >
                      Continue to Report
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => {
                        setColorTestIndex(0);
                        setCurrentStage('TEST_COLORS');
                    }}
                    className="bg-theme-surface border border-theme-border text-theme-text font-black py-4 rounded-[20px] shadow-sm transition-all active:scale-95 text-xs tracking-widest uppercase"
                  >
                    4/4 Colors
                  </button>
                  <button 
                    onClick={() => {
                        setColorTestIndex(0);
                        setCurrentStage('TEST_ISHIHARA');
                    }}
                    className="bg-theme-surface border border-theme-border text-theme-text font-black py-4 rounded-[20px] shadow-sm transition-all active:scale-95 text-xs tracking-widest uppercase"
                  >
                    Ishihara
                  </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStage === 'RESULTS' && (
                <motion.div 
                   key="results"
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   className="space-y-8 pb-32 mt-6"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-4xl font-black tracking-tighter uppercase italic text-theme-primary">VA REPORT</h2>
                    <div className="flex gap-2">
                      <button onClick={restart} className="bg-theme-surface border border-theme-border p-3 rounded-2xl text-theme-dim shadow-xl active:scale-95 hover:text-theme-primary transition-colors">
                        <RefreshCcw size={24} />
                      </button>
                    </div>
                  </div>

                  <div className="bg-theme-surface p-8 rounded-[40px] border border-theme-border shadow-2xl font-mono text-lg leading-relaxed flex flex-col gap-2">
                    {['OD', 'OS'].filter(eye => session[eye]?.['SC'] !== undefined).map(eye => {
                       const sc = session[eye]?.['SC'];
                       const cc = session[eye]?.['CC'];
                       const scph = session[eye]?.['SCPH'];
                       const ccph = session[eye]?.['CCPH'];
                       
                       const scVal = sc ? (sc.nonLetter || (sc.logMAR !== undefined ? logMARToSnellen(sc.logMAR) : '—')) : '—';
                       
                       const scNL = sc?.nonLetter?.toUpperCase() || '';
                       const isNonLetter = !!sc?.nonLetter;
                       const isLowVision = scNL.startsWith('HM') || scNL === 'LP' || scNL === 'NLP';

                       if (isLowVision) {
                         return (
                           <div key={eye} className="flex gap-4">
                             <span className="font-black text-theme-primary w-12">{eye}:</span>
                             <div className="flex flex-wrap gap-x-4 gap-y-1">
                               <span className="text-theme-dim font-medium">{scVal}</span>
                             </div>
                           </div>
                         );
                       }

                       const ccVal = cc ? (cc.statusLabel === 'NICC' ? 'NICC' : (cc.nonLetter || (cc.logMAR !== undefined ? logMARToSnellen(cc.logMAR) : '—'))) : '—';
                       const phVal = (scph || ccph) ? 
                        ((scph?.statusLabel === 'NIPH' || ccph?.statusLabel === 'NIPH') ? 'NIPH' : 
                         (scph?.nonLetter || ccph?.nonLetter || (scph && scph.logMAR !== undefined ? logMARToSnellen(scph.logMAR) : (ccph && ccph.logMAR !== undefined ? logMARToSnellen(ccph.logMAR) : '—')))) 
                        : '—';

                       return (
                         <div key={eye} className="flex gap-4">
                           <span className="font-black text-theme-primary w-12">{eye}:</span>
                           <div className="flex flex-wrap gap-x-4 gap-y-1">
                             <span className="text-theme-dim font-medium">
                               {isNonLetter ? '' : <span className="text-theme-dim/50 uppercase text-[10px] mr-1 font-sans">sc</span>}
                               {scVal}
                             </span>
                             {cc && <span className="text-theme-dim font-medium"><span className="text-theme-dim/50 uppercase text-[10px] mr-1 font-sans">cc</span>{ccVal}</span>}
                             {(scph || ccph) && <span className="text-theme-dim font-medium"><span className="text-theme-dim/50 uppercase text-[10px] mr-1 font-sans">ph</span>{phVal}</span>}
                           </div>
                         </div>
                       );
                    })}
                    {/* Ishihara Result Row if assessed */}
                    {session.ishihara && (
                      <div className="flex flex-col gap-2 pt-2 border-t border-theme-border/40">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-theme-primary">Ishihara:</span>
                            <span className="text-theme-text font-bold">{session.ishihara.score}/16</span>
                          </div>
                          <button
                            onClick={() => {
                              const firstMissed = session.ishihara?.answers.findIndex(a => a === 'incorrect');
                              setSelectedPlateForInterpretation(firstMissed !== undefined && firstMissed !== -1 ? firstMissed + 1 : 1);
                              setShowIshiharaModal(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-theme-primary/10 hover:bg-theme-primary/20 text-theme-primary rounded-xl text-xs font-black uppercase tracking-wider transition-all border border-theme-primary/30 active:scale-95"
                          >
                            <Info size={14} /> Interpretation
                          </button>
                        </div>
                      </div>
                    )}

                    <button 
                      onClick={copyReport} 
                      className="mt-6 flex items-center justify-center gap-2 bg-theme-primary/10 hover:bg-theme-primary/20 text-theme-primary border border-theme-primary/20 p-4 rounded-2xl active:scale-95 transition-all text-sm font-black uppercase tracking-widest font-sans"
                    >
                      <ClipboardList size={20} /> Copy Results
                    </button>
                  </div>
                  
                  <button 
                    onClick={restart}
                    className="w-full bg-theme-primary text-white font-black py-6 rounded-[32px] shadow-xl transition-all flex items-center justify-center gap-3 text-lg uppercase tracking-widest"
                  >
                    <RefreshCcw size={20} /> START NEW LOG
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : activeTab === 'exam' ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 py-10 px-4"
          >
            <div className="space-y-2 text-center">
              <h2 className="text-4xl font-black tracking-tighter uppercase italic text-theme-primary">COLOR VISION</h2>
              <p className="text-theme-dim text-sm font-medium tracking-widest uppercase italic">Standalone Assessments</p>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={() => {
                  setColorTestIndex(0);
                  setCurrentStage('TEST_COLORS');
                }}
                className="group relative h-48 bg-theme-surface border border-theme-border rounded-[40px] overflow-hidden shadow-2xl transition-all active:scale-95"
              >
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 opacity-20 group-hover:opacity-30 transition-opacity">
                  <div className="bg-red-500"/><div className="bg-yellow-500"/>
                  <div className="bg-blue-500"/><div className="bg-green-500"/>
                </div>
                <div className="relative z-10 flex flex-col items-center justify-center h-full space-y-3">
                  <div className="w-16 h-16 bg-theme-bg/5 rounded-full flex items-center justify-center border border-theme-border group-hover:border-theme-primary/50 transition-colors">
                    <Palette className="text-theme-primary" size={32} />
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter">4/4 Basic Colors</h3>
                    <p className="text-theme-dim font-mono text-[10px] tracking-widest">RED • YELLOW • BLUE • GREEN</p>
                  </div>
                </div>
              </button>

              <button 
                onClick={() => {
                  setColorTestIndex(0);
                  setCurrentStage('TEST_ISHIHARA');
                }}
                className="group relative h-48 bg-theme-surface border border-theme-border rounded-[40px] overflow-hidden shadow-2xl transition-all active:scale-95"
              >
                <div className="absolute inset-0 opacity-15 group-hover:opacity-25 transition-opacity">
                  <img src="./ishihara/plate1.webp" alt="Ishihara preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="relative z-10 flex flex-col items-center justify-center h-full space-y-3">
                  <div className="w-16 h-16 bg-theme-bg/5 rounded-full flex items-center justify-center border border-theme-border group-hover:border-theme-primary/50 transition-colors">
                    <EyeIcon className="text-theme-primary" size={32} />
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter">Ishihara Plates</h3>
                    <p className="text-theme-dim font-mono text-[10px] tracking-widest">16 PLATE COLOR TEST</p>
                  </div>
                </div>
              </button>
            </div>
          </motion.div>
        ) : activeTab === 'history' ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6 py-10 px-4"
          >
            <div className="flex items-center justify-between pb-4 border-b border-theme-border/50">
              <h2 className="text-4xl font-black tracking-tighter uppercase italic text-theme-primary">HISTORY</h2>
              <button 
                onClick={() => {
                   if (confirm("Clear all history?")) setHistory([]);
                }}
                className="text-theme-dim hover:text-red-500 transition-colors p-2"
              >
                <Trash2 size={20} />
              </button>
            </div>

            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-theme-dim opacity-20">
                <HistoryIcon size={64} className="mb-4" />
                <p className="font-black uppercase tracking-widest text-xs italic">No logs recorded</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((entry) => (
                  <div key={entry.id} className="bg-theme-surface border border-theme-border rounded-[32px] overflow-hidden shadow-xl group">
                    <div className="px-6 py-3 bg-theme-bg/5 flex justify-between items-center border-b border-theme-border">
                      <span className="text-[10px] font-black text-theme-dim uppercase tracking-[0.15em] font-mono">
                        {new Date(entry.timestamp).toLocaleString(undefined, { 
                          month: 'short', 
                          day: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(generateReportString(entry.session, entry.patientName));
                          }}
                          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-theme-primary bg-theme-primary/10 px-2 py-1.5 rounded-lg active:scale-95 transition-all outline outline-1 outline-theme-primary/20 hover:bg-theme-primary/20"
                        >
                          <ClipboardList size={12} /> COPY
                        </button>
                        <button 
                          onClick={() => {
                            setHistory(prev => prev.filter(h => h.id !== entry.id));
                          }}
                          className="text-theme-dim bg-theme-bg/5 px-2 py-1.5 rounded-lg active:scale-95 transition-all outline outline-1 outline-theme-border hover:text-red-500 hover:outline-red-500/20"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="font-mono text-xs text-theme-text font-medium whitespace-pre-wrap leading-relaxed tracking-tight">
                        {generateReportString(entry.session, entry.patientName)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ) : activeTab === 'setup' ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 py-10 px-6 max-w-sm mx-auto w-full"
          >
            <div className="space-y-2 text-center">
              <h2 className="text-4xl font-black tracking-tighter uppercase italic text-theme-primary">SETUP</h2>
              <p className="text-theme-dim text-sm font-medium tracking-widest uppercase italic">Preferences & Tools</p>
            </div>

            <div className="space-y-6">
              <div className="bg-theme-surface p-6 rounded-[32px] border border-theme-border shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-theme-text font-black uppercase text-sm italic">Interface Theme</span>
                    <span className="text-theme-dim text-[10px] uppercase font-mono tracking-wider">Visual Preference</span>
                  </div>
                  <div className="flex bg-theme-bg p-1 rounded-2xl border border-theme-border shadow-inner">
                    <button 
                      onClick={() => setTheme('light')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${theme === 'light' ? 'bg-white text-orange-500 shadow-md font-black border border-orange-100' : 'text-theme-dim hover:text-theme-text'}`}
                    >
                      <Sun size={16} className={theme === 'light' ? 'fill-orange-500' : ''} />
                      <span className="text-[10px] uppercase tracking-tighter">Light</span>
                    </button>
                    <button 
                      onClick={() => setTheme('dark')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${theme === 'dark' ? 'bg-zinc-800 text-blue-400 shadow-md font-black' : 'text-theme-dim hover:text-theme-text'}`}
                    >
                      <Moon size={16} className={theme === 'dark' ? 'fill-blue-400' : ''} />
                      <span className="text-[10px] uppercase tracking-tighter">Dark</span>
                    </button>
                  </div>
                </div>
              </div>

               <div className="bg-theme-surface p-6 rounded-[32px] border border-theme-border shadow-xl flex items-center justify-between group cursor-pointer active:scale-95 transition-all">
                  <div className="flex flex-col">
                    <span className="text-theme-text font-black uppercase text-sm italic">Clear All History</span>
                    <span className="text-theme-dim text-[10px] uppercase font-mono tracking-wider">Permanently delete logs</span>
                  </div>
                  <button onClick={() => confirm("Clear history?") && setHistory([])} className="text-theme-dim group-hover:text-red-500 transition-colors">
                    <Trash2 size={24} />
                  </button>
               </div>
            </div>

            <div className="text-center pt-10">
              <p className="text-[9px] text-theme-dim font-black uppercase tracking-[0.4em] opacity-30">MADE BY GIO F.</p>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 py-40 text-theme-dim">
            <ClipboardList size={80} className="mb-6 opacity-10" />
            <p className="font-black text-xs uppercase tracking-[0.3em] opacity-40">System Idle • Development Tier</p>
          </div>
        )}
      </main>

       {/* Footer / Floating Action */}
      {(activeTab === 'etdrs' && currentStage.startsWith('TEST_')) && (
        <div className="shrink-0 px-1.5 py-1 bg-theme-bg/95 backdrop-blur-sm z-30">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="max-w-xl mx-auto flex items-center gap-1 relative"
          >
            {isTutorial && (
              <TutorialTooltip
                className="bottom-full left-4 mb-3"
                arrowClassName="top-full left-6 border-t-blue-600/90"
              >
                <span className="font-black">Notation</span><br/>Click to switch between<br/>Snellen & LogMAR
              </TutorialTooltip>
            )}
            {isTutorial && (
              <TutorialTooltip
                className="bottom-full right-4 mb-3"
                arrowClassName="top-full right-8 border-t-blue-600/90"
              >
                <span className="font-black text-xs block mb-1">Low Vision</span>
                CF (Count Fingers)<br/>HM (Hand Motion)<br/>LP (Light Perception)<br/>NLP (No Light Perception)
              </TutorialTooltip>
            )}
            <div className="flex-1 bg-theme-surface rounded-xl p-1 shadow-xl border border-theme-border flex justify-between items-center overflow-hidden relative min-h-[54px] sm:min-h-[60px]">
               <div className="absolute top-0 left-0 w-1 h-full bg-theme-primary" />
               <div className="flex items-center gap-2 pl-1 w-full">
                  <button 
                    onClick={() => setNotationMode(prev => prev === 'snellen' ? 'logmar' : 'snellen')}
                    className="flex flex-col min-w-[68px] sm:min-w-[75px] text-left hover:opacity-80 transition-opacity active:scale-95 pr-1 relative"
                  >
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="text-[10px] sm:text-xs font-black text-theme-primary uppercase tracking-[0.2em] leading-none">
                        {currentEye} {currentMode}
                      </span>
                    </div>
                    <span className="text-2xl sm:text-3xl font-black text-theme-text tracking-tighter font-mono leading-none mt-0.5">
                      {notationMode === 'snellen' ? logMARToSnellen(currentLogMAR) : currentLogMAR}
                    </span>
                  </button>

                  {/* Expanded Non-letter VA Buttons */}
                  <div className="grid grid-cols-4 gap-1 flex-1 relative">
                    {(['CF', 'HM', 'LP', 'NLP'] as NonLetterVA[]).map(va => (
                      <button
                        key={va}
                        onClick={() => setNonLetterVA(va)}
                        className="h-10 sm:h-11 bg-theme-bg border border-theme-border rounded-lg font-black text-[11px] sm:text-xs text-theme-dim uppercase tracking-tighter hover:text-theme-primary hover:border-theme-primary transition-all active:scale-95"
                      >
                        {va}
                      </button>
                    ))}
                  </div>
               </div>
            </div>
            <button 
              onClick={() => {
                if (!isVAImpossible) {
                  handleNext();
                }
              }}
              disabled={isVAImpossible}
              className={`rounded-xl flex flex-col items-center justify-center shadow-xl transition-all shrink-0 font-black ${
                isVAImpossible 
                  ? 'bg-red-500 text-white px-2 py-1 min-w-[70px] sm:min-w-[80px] h-14 sm:h-16 cursor-not-allowed opacity-95 animate-pulse border-2 border-red-600' 
                  : 'bg-theme-primary text-white w-14 h-14 sm:w-16 sm:h-16 active:scale-95'
              }`}
            >
              {isVAImpossible ? (
                <div className="flex flex-col items-center text-center leading-tight">
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-tight">VA Not</span>
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-tight">Possible</span>
                </div>
              ) : (
                <ChevronRight size={26} />
              )}
            </button>
          </motion.div>
        </div>
      )}

      {/* Tutorial Close Overlay */}
      {isTutorial && (
        <div className="fixed top-4 right-4 z-[200]">
          <button 
            onClick={() => { setIsTutorial(false); restart(); }}
            className={`px-6 py-3 rounded-full font-black shadow-2xl active:scale-95 text-xs uppercase tracking-widest transition-all flex items-center gap-2 border-2 ${theme === 'light' ? 'bg-red-500 text-white border-red-600 hover:bg-red-600' : 'bg-white text-zinc-900 border-white/20 hover:bg-zinc-200'}`}
          >
            End Tutorial
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <nav className="bg-theme-surface border-t border-theme-border px-2 py-1.5 flex justify-around items-center shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] relative z-40 rounded-t-[18px]">
        <TabItem 
          active={activeTab === 'etdrs'} 
          onClick={() => setActiveTab('etdrs')} 
          icon={<CheckCircle2 size={20} />} 
          label="ETDRS" 
        />
        <TabItem 
          active={activeTab === 'exam'} 
          onClick={() => setActiveTab('exam')} 
          icon={<Palette size={20} />} 
          label="Colors" 
        />
        <TabItem 
          active={activeTab === 'history'} 
          onClick={() => setActiveTab('history')} 
          icon={<HistoryIcon size={20} />} 
          label="History" 
        />
        <TabItem 
          active={activeTab === 'setup'} 
          onClick={() => setActiveTab('setup')} 
          icon={<Settings size={20} />} 
          label="Setup" 
        />
      </nav>

      {/* Global Ishihara Interpretation Modal (accessible during test and in report) */}
      <AnimatePresence>
        {showIshiharaModal && (
          <div className="fixed inset-0 z-[200] bg-black/65 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-theme-surface border-2 border-theme-border/80 rounded-[32px] max-w-lg sm:max-w-xl w-full p-4 sm:p-6 shadow-2xl flex flex-col max-h-[88vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-theme-border/50">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base sm:text-lg font-black uppercase italic text-theme-text leading-none">
                    Ishihara Guide
                  </h3>
                  <span className="text-[10px] font-mono font-bold text-theme-dim bg-theme-bg px-2.5 py-0.5 rounded-lg border border-theme-border">
                    {session.ishihara ? `${session.ishihara.score}/16 Correct` : 'All 16 Plates'}
                  </span>
                </div>
                <button 
                  onClick={() => setShowIshiharaModal(false)}
                  className="p-1.5 rounded-full bg-theme-bg border border-theme-border text-theme-dim hover:text-theme-text transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* 16 Plate Selector Buttons (1-16) */}
              <div className="py-2.5 border-b border-theme-border/40">
                <div className="grid grid-cols-8 gap-1.5">
                  {ISHIHARA_PLATE_DETAILS.map(detail => {
                    const ans = session.ishihara?.answers ? session.ishihara.answers[detail.plateNum - 1] : ishiharaAnswers[detail.plateNum - 1];
                    const isSelected = selectedPlateForInterpretation === detail.plateNum;

                    return (
                      <button
                        key={detail.plateNum}
                        onClick={() => setSelectedPlateForInterpretation(detail.plateNum)}
                        className={`h-8 sm:h-9 rounded-xl font-mono font-black text-xs transition-all active:scale-95 flex items-center justify-center relative ${
                          ans === 'correct' 
                            ? 'bg-green-600/25 border-2 border-green-500 text-green-400 font-bold' 
                            : ans === 'incorrect' 
                            ? 'bg-red-600/25 border-2 border-red-500 text-red-400 font-bold' 
                            : 'bg-theme-bg border border-theme-border text-theme-dim'
                        } ${isSelected ? (theme === 'light' ? 'ring-2 ring-slate-900 ring-offset-2 ring-offset-theme-surface scale-105 z-10 shadow-md' : 'ring-2 ring-white ring-offset-2 ring-offset-theme-surface scale-105 z-10 shadow-md') : 'opacity-85 hover:opacity-100'}`}
                      >
                        <span>{detail.plateNum}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Plate Interpretation Display */}
              {(() => {
                const curDetail = ISHIHARA_PLATE_DETAILS.find(p => p.plateNum === selectedPlateForInterpretation) || ISHIHARA_PLATE_DETAILS[0];
                const curAns = session.ishihara?.answers ? session.ishihara.answers[curDetail.plateNum - 1] : ishiharaAnswers[curDetail.plateNum - 1];

                return (
                  <div className="flex-1 overflow-y-auto py-3 space-y-3 font-sans text-theme-text pr-0.5">
                    {/* Plate Display with larger photo and details */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-3.5 bg-theme-bg p-3 sm:p-3.5 rounded-2xl border border-theme-border shadow-inner">
                      {/* Enriched, larger Ishihara plate image */}
                      <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl overflow-hidden border-2 border-theme-border shrink-0 bg-white shadow-md">
                        <img 
                          src={`./ishihara/plate${curDetail.plateNum}.webp`} 
                          alt={`Plate ${curDetail.plateNum}`} 
                          className="w-full h-full object-cover" 
                        />
                      </div>

                      {/* Plate Details */}
                      <div className="flex-1 flex flex-col justify-between w-full min-w-0 gap-2">
                        <div>
                          <div className="flex items-center justify-between">
                            <h4 className="text-base sm:text-lg font-black tracking-tight uppercase leading-tight">
                              Plate {curDetail.plateNum}
                            </h4>
                            <span className="text-[11px] font-bold">
                              {curAns === 'correct' ? (
                                <span className="text-green-500 uppercase font-black">● Correct</span>
                              ) : curAns === 'incorrect' ? (
                                <span className="text-red-500 uppercase font-black">● Missed / Error</span>
                              ) : (
                                <span className="text-theme-dim uppercase">● Not Answered</span>
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="p-2 sm:p-2.5 rounded-xl bg-green-500/10 border border-green-500/20">
                            <span className="text-[9px] font-black uppercase tracking-wider text-green-500 block">Normal View</span>
                            <span className="text-xs sm:text-sm font-bold text-theme-text leading-tight block mt-0.5">{curDetail.normal}</span>
                          </div>

                          <div className="p-2 sm:p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                            <span className="text-[9px] font-black uppercase tracking-wider text-red-500 block">Red-Green Deficiency</span>
                            <span className="text-xs sm:text-sm font-bold text-theme-text leading-tight block mt-0.5">{curDetail.deficiency}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {curDetail.note && (
                      <div className="p-2.5 sm:p-3 rounded-xl bg-theme-bg border border-theme-border">
                        <span className="text-[9px] font-black uppercase tracking-wider text-theme-dim block">Clinical Note</span>
                        <p className="text-xs text-theme-dim leading-snug mt-0.5">{curDetail.note}</p>
                      </div>
                    )}
                  </div>
                );
              })()}

              <button 
                onClick={() => setShowIshiharaModal(false)}
                className="mt-2 w-full py-3 bg-theme-primary text-white font-black rounded-xl text-xs uppercase tracking-widest active:scale-95 transition-all shadow-md"
              >
                Close Interpretation
              </button>
            </motion.div>
          </div>
        )}

        {/* ETDRS Cancel Confirmation Warning Modal */}
        {showCancelConfirm && (
          <div className="fixed inset-0 z-[250] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-theme-surface border-2 border-theme-border rounded-[28px] max-w-sm w-full p-5 sm:p-6 shadow-2xl flex flex-col items-center text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-500 shadow-inner">
                <AlertTriangle size={24} />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black uppercase italic text-theme-text tracking-tight">
                  Cancel Current Test?
                </h3>
                <p className="text-xs text-theme-dim leading-relaxed">
                  This will reset all current test scores and remove the patient name.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full pt-1">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="py-3 px-3 rounded-xl border border-theme-border bg-theme-bg text-theme-text font-black text-xs uppercase tracking-wider hover:bg-theme-border/30 transition-all active:scale-95"
                >
                  Keep Testing
                </button>
                <button
                  onClick={() => {
                    setShowCancelConfirm(false);
                    restart();
                  }}
                  className="py-3 px-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-xs uppercase tracking-wider transition-all active:scale-95 shadow-lg shadow-red-500/30"
                >
                  Reset & Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all w-16 relative ${active ? 'text-theme-primary' : 'text-theme-dim'}`}
    >
      <div className={`p-1.5 rounded-xl transition-all duration-300 ${active ? 'bg-theme-primary text-white shadow-lg shadow-theme-primary/20 -translate-y-0.5' : 'hover:bg-theme-dim/10'}`}>
        {icon}
      </div>
      <span className={`text-[8px] font-black uppercase tracking-wider transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-100'}`}>{label}</span>
      {active && (
        <motion.div 
          layoutId="tab-underline"
          className="absolute -top-4 w-1 h-1 bg-theme-primary rounded-full shadow-[0_0_10px_var(--primary)]"
        />
      )}
    </button>
  );
}
