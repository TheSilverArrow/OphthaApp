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
  Moon
} from 'lucide-react';

interface HistoryEntry {
  id: string;
  timestamp: number;
  session: SessionData;
}

const generateReportString = (session: SessionData): string => {
  return ['OD', 'OS'].map(eye => {
    const data = session[eye];
    if (!data) return `${eye}: —`;

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
  }).join('\n');
};

const AnimatedLogo = () => (
  <div className="relative w-40 h-40 flex items-center justify-center">
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
      className="relative z-10 bg-theme-surface border border-theme-border rounded-[40px] p-6 shadow-2xl"
    >
      <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
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

  // Auto-save session when results are reached
  useEffect(() => {
    if (activeTab === 'etdrs' && currentStage === 'RESULTS' && Object.keys(session).length > 0) {
      const sessionStr = JSON.stringify(session);
      if (sessionStr !== lastSavedSession) {
        saveCurrentSession();
        setLastSavedSession(sessionStr);
      }
    }
  }, [currentStage, session, activeTab, lastSavedSession]);

  const saveCurrentSession = () => {
    if (Object.keys(session).length === 0) return;
    
    const entry: HistoryEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      session: { ...session }
    };
    
    setHistory(prev => [entry, ...prev]);
  };

  // Derived VA
  const totalCorrect = useMemo(() => {
    return rows.reduce((acc, row) => acc + row.letters.filter(l => l.correct).length, 0);
  }, [rows]);

  const currentLogMAR = useMemo(() => {
    // Standard ETDRS scoring: LogMAR = 1.1 - (0.02 * total_correct)
    const baseLogMAR = Number((1.1 - (totalCorrect * 0.02)).toFixed(2));
    // Apply distance correction: log10(4 / testDistance)
    const distanceCorrection = Math.log10(4 / testDistance);
    return Number((baseLogMAR + distanceCorrection).toFixed(2));
  }, [totalCorrect, testDistance]);

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
    // Check if current row is already fully selected
    const isRowCorrect = newRows[lineIndex].letters.every(l => l.correct);
    
    // Toggle logic: if the row was already correct, unselect the row. 
    // Otherwise, select this row and all rows above it correctly.
    for (let i = 0; i <= lineIndex; i++) {
      newRows[i].letters = newRows[i].letters.map(l => ({ ...l, correct: !isRowCorrect }));
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
  };

  const copyReport = () => {
    navigator.clipboard.writeText(generateReportString(session));
  };

  return (
    <div className={`flex flex-col h-screen font-sans overflow-hidden transition-colors duration-300 ${theme === 'light' ? 'bg-white text-slate-900' : 'bg-zinc-950 text-white'}`} style={{ backgroundColor: 'var(--theme-bg)', color: 'var(--theme-text)' }}>
      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto" style={{ backgroundColor: 'var(--theme-bg)' }} id="chart-container">
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

          {currentStage === 'TEST_ISHIHARA' && (
            <motion.div 
              key="ishihara"
              className="fixed inset-0 z-[100] bg-theme-bg flex flex-col items-center justify-center cursor-pointer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => {
                // Ignore clicks on buttons to prevent accidental navigation when finishing
                if ((e.target as HTMLElement).closest('button')) return;

                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                if (x > rect.width / 2) {
                  if (colorTestIndex < 15) {
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
            >
              <div className="relative w-full max-w-sm aspect-square p-6">
                {/* Preload images to prevent slow loading on switch */}
                <div className="absolute w-0 h-0 opacity-0 overflow-hidden pointer-events-none">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <img key={`preload-plate-${i}`} src={`./ishihara/plate${i + 1}.png`} alt={`Preload ${i + 1}`} />
                  ))}
                </div>
                
                <AnimatePresence>
                    <motion.div 
                    key={colorTestIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={(_, info) => {
                      if (info.offset.x < -50 && colorTestIndex < 15) setColorTestIndex(prev => prev + 1);
                      if (info.offset.x > 50 && colorTestIndex > 0) setColorTestIndex(prev => prev - 1);
                    }}
                    className="absolute inset-6 rounded-full border-8 border-theme-border overflow-hidden flex items-center justify-center bg-white"
                  >
                     <img 
                      src={`./ishihara/plate${colorTestIndex + 1}.png`}
                      alt={`Ishihara Plate ${colorTestIndex + 1}`}
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
              
              <div className="fixed bottom-24 flex gap-1.5">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === colorTestIndex ? 'bg-theme-primary w-4' : 'bg-theme-border/50'}`} />
                ))}
              </div>

              <button 
                onClick={() => {
                  if (activeTab === 'exam') {
                    setCurrentStage('EYE_INIT');
                  } else {
                    setCurrentStage('RESULTS');
                  }
                }}
                className="fixed bottom-10 px-8 py-3 bg-theme-surface border border-theme-border rounded-full text-theme-text font-black uppercase tracking-[0.2em] text-[10px] hover:bg-theme-primary transition-all active:scale-95 shadow-xl"
              >
                Finish Assessment
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {activeTab === 'etdrs' ? (
          <div className="max-w-xl mx-auto px-1.5 pt-4 pb-0 w-full min-h-full flex flex-col">
            <AnimatePresence mode="wait">
              {currentStage === 'EYE_INIT' && (
                <motion.div 
                  key="init"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="flex flex-col items-center justify-center py-6 text-center space-y-8 min-h-full"
                >
                  <AnimatedLogo />

                  <div className="space-y-4">
                    <h2 className="text-4xl font-black tracking-tighter uppercase leading-[0.9] text-theme-text text-balance">
                      ETDRS CHART <br/><span className="text-theme-primary">CALCULATOR</span>
                    </h2>
                  </div>

                  <div className="flex flex-col w-full max-w-xs gap-4">
                    <button 
                      onClick={() => {
                        setStartingEye('OD');
                        setCurrentEye('OD');
                        setCurrentStage('TEST_SC');
                      }}
                      className="group relative bg-theme-primary text-white font-black py-6 rounded-[32px] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 text-lg overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                      <span className="relative z-10 flex items-center gap-2">START WITH OD <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" /></span>
                    </button>

                    <button 
                      onClick={() => {
                        setStartingEye('OS');
                        setCurrentEye('OS');
                        setCurrentStage('TEST_SC');
                      }}
                      className="group relative bg-theme-surface border-2 border-theme-primary/20 text-theme-primary font-black py-6 rounded-[32px] shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3 text-lg overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-theme-primary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                      <span className="relative z-10 flex items-center gap-2 uppercase">Start with OS <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" /></span>
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
                    className="px-6 py-2 rounded-full border border-theme-border text-theme-dim text-xs font-black uppercase tracking-widest hover:text-white transition-colors"
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
                  className="space-y-2 pb-32 relative"
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

                  {/* Backtrack Breadcrumbs */}
                  <div className="flex flex-wrap gap-2 mb-4 relative z-10 w-full mt-4">
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
                          className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
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

                  <div className="flex gap-1 w-full items-stretch">
                    {/* Left: Chart */}
                    <div className="flex-1 bg-theme-surface rounded-[24px] p-2 shadow-2xl border border-theme-border">
                      <table className="w-full border-separate border-spacing-y-2">
                        <tbody>
                          {rows.map((row, rIdx) => (
                            <tr key={rIdx} className={`transition-colors rounded-lg group ${row.letters.every(l => l.correct) ? 'bg-theme-primary/5' : ''}`}>
                              <td className="w-6 align-middle">
                                <button 
                                  onClick={() => selectRowAndAbove(rIdx)}
                                  style={{ height: rIdx < 11 ? '30px' : '15px' }}
                                  className={`relative w-6 rounded-md flex items-center justify-center transition-all border ${
                                    row.letters.every(l => l.correct) 
                                    ? 'bg-theme-primary text-white border-theme-primary shadow-[0_0_15px_-5px_rgba(59,130,246,0.6)]' 
                                    : 'bg-theme-bg text-theme-dim border-theme-border hover:border-theme-dim'
                                  }`}
                                >
                                  <span className="text-[10px] font-black">{row.lineNum}</span>
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
                              <td className="px-2 py-0">
                                <div className="flex justify-between items-center gap-1 leading-none">
                                  {row.letters.map((letter, lIdx) => (
                                    <button
                                      key={lIdx}
                                      onClick={() => toggleLetter(rIdx, lIdx)}
                                      style={{ 
                                        fontSize: rIdx < 11 ? '30px' : '15px',
                                        lineHeight: 1 
                                      }}
                                      className={`flex-1 font-bold transition-all rounded-md relative ${
                                        letter.correct 
                                        ? 'text-theme-accent opacity-100 letter-shadow scale-110' 
                                        : 'text-theme-text opacity-20 hover:opacity-40'
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

                    {/* Right: Testing Distance Selector Slider (w-16 to match Proceed button width) */}
                    <div className="w-[64px] shrink-0 bg-theme-surface rounded-[24px] border border-theme-border p-1.5 flex flex-col relative shadow-inner">
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
                    {['OD', 'OS'].map(eye => {
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
                <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity grayscale group-hover:grayscale-0">
                  <img src="https://picsum.photos/seed/ishihara7/600/600" alt="bg" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="relative z-10 flex flex-col items-center justify-center h-full space-y-3">
                  <div className="w-16 h-16 bg-theme-bg/5 rounded-full flex items-center justify-center border border-theme-border group-hover:border-theme-primary/50 transition-colors">
                    <EyeIcon className="text-indigo-400" size={32} />
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
                            navigator.clipboard.writeText(generateReportString(entry.session));
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
                        {generateReportString(entry.session)}
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
        <div className="sticky bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-theme-bg via-theme-bg/90 to-transparent pointer-events-none pb-1 z-50">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="max-w-xl mx-auto flex items-center gap-1 pointer-events-auto relative"
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
            <div className="flex-1 bg-theme-surface rounded-xl p-1.5 shadow-2xl border border-theme-border flex justify-between items-center overflow-hidden relative min-h-[64px]">
               <div className="absolute top-0 left-0 w-1 h-full bg-theme-primary" />
               <div className="flex items-center gap-3 pl-1 w-full">
                  <button 
                    onClick={() => setNotationMode(prev => prev === 'snellen' ? 'logmar' : 'snellen')}
                    className="flex flex-col min-w-[75px] text-left hover:opacity-80 transition-opacity active:scale-95 pr-2 relative"
                  >
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="text-xs font-black text-theme-primary uppercase tracking-[0.2em] leading-none">
                        {currentEye} {currentMode}
                      </span>
                    </div>
                    <span className="text-3xl font-black text-theme-text tracking-tighter font-mono leading-none mt-1">
                      {notationMode === 'snellen' ? logMARToSnellen(currentLogMAR) : currentLogMAR}
                    </span>
                  </button>

                  {/* Expanded Non-letter VA Buttons */}
                  <div className="grid grid-cols-4 gap-1 flex-1 relative">
                    {(['CF', 'HM', 'LP', 'NLP'] as NonLetterVA[]).map(va => (
                      <button
                        key={va}
                        onClick={() => setNonLetterVA(va)}
                        className="h-12 bg-theme-bg border border-theme-border rounded-lg font-black text-xs text-theme-dim uppercase tracking-tighter hover:text-theme-primary hover:border-theme-primary transition-all active:scale-95"
                      >
                        {va}
                      </button>
                    ))}
                  </div>
               </div>
            </div>
            <button 
              onClick={() => handleNext()}
              className="bg-theme-primary text-white w-16 h-16 rounded-xl flex flex-col items-center justify-center shadow-xl active:scale-95 transition-all shrink-0"
            >
              <ChevronRight size={28} />
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
      <nav className="bg-theme-surface border-t border-theme-border px-2 py-2 flex justify-around items-center shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] relative z-40 rounded-t-[20px]">
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
