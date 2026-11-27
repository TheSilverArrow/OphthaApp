import React, { useState, useMemo, useEffect, useRef, Suspense, lazy } from 'react';
import { Eye, TestMode, ChartType, Row, SessionData, NonLetterVA, Stage, IshiharaResult } from './types';
import { getInitialRows, applyChartTypeToRows, logMARToSnellen, ETDRS_CONVERSION_DATA, lettersAndDistanceToSnellen, vaDataToSnellen } from './constants';
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
  Info,
  X,
  AlertTriangle,
  Grid3x3,
  Shapes,
  Pencil
} from 'lucide-react';
import ChartTypeSwitch from './components/ChartTypeSwitch';
import ThemeToggleSwitch from './components/ThemeToggleSwitch';

const ShapesAnnouncer = lazy(() => import('./components/ShapesAnnouncer'));
const SetupFeedbackSection = lazy(() => import('./components/SetupFeedbackSection'));

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


const formatIshiharaLine = (label: string, res?: IshiharaResult) => {
  if (!res) return '';
  let line = `${label}: ${res.score}/16`;
  const missedIndices = (res.answers || [])
    .map((ans, idx) => (ans === 'incorrect' ? idx + 1 : null))
    .filter((n): n is number => n !== null);

  if (missedIndices.length > 0) {
    const platesStr = missedIndices.map(n => `#${n}`).join(', ');
    const plural = missedIndices.length > 1 ? 's' : '';
    line += ` (missed plate${plural} ${platesStr})`;
  }
  return line;
};

const generateReportString = (session: SessionData): string => {
  const body = ['OD', 'OS'].map(eye => {
    const data = session[eye];
    if (!data) return null;

    const sc = data['SC'];
    const cc = data['CC'];
    const scph = data['SCPH'];
    const ccph = data['CCPH'];

    // Default to '—' if SC not present, or try to format its value
    const scVal = vaDataToSnellen(sc);
    const scNL = sc?.nonLetter?.toUpperCase() || '';
    const isNonLetter = !!sc?.nonLetter;
    const isLowVision = scNL.startsWith('CF') || scNL.startsWith('HM') || scNL === 'LP' || scNL === 'NLP';

    let line = `${eye}: ${isNonLetter ? '' : 'sc '}${scVal}`;

    if (isLowVision) return line;

    if (cc) {
      if (cc.statusLabel === 'NICC') {
        line += ` > NICC`;
      } else {
        const ccVal = vaDataToSnellen(cc);
        line += ` > cc ${ccVal}`;
      }
    }

    const phKey = ccph ? 'CCPH' : (scph ? 'SCPH' : null);
    if (phKey) {
      const phData = data[phKey];
      if (phData.statusLabel === 'NIPH') {
        line += ` > NIPH`;
      } else {
        const phVal = vaDataToSnellen(phData);
        line += ` > ${phKey.toLowerCase()} ${phVal}`;
      }
    }
    return line;
  }).filter(Boolean).join('\n');

  let ishiharaStr = '';
  if (session.ishiharaOU) {
    ishiharaStr = formatIshiharaLine('Ishihara OU', session.ishiharaOU);
  } else if (session.ishiharaOD && session.ishiharaOS) {
    if (
      session.ishiharaOD.score === session.ishiharaOS.score &&
      JSON.stringify(session.ishiharaOD.answers) === JSON.stringify(session.ishiharaOS.answers)
    ) {
      ishiharaStr = formatIshiharaLine('Ishihara OU', session.ishiharaOD);
    } else {
      const odLine = formatIshiharaLine('Ishihara OD', session.ishiharaOD);
      const osLine = formatIshiharaLine('Ishihara OS', session.ishiharaOS);
      ishiharaStr = [odLine, osLine].filter(Boolean).join('\n');
    }
  } else if (session.ishiharaOD) {
    ishiharaStr = formatIshiharaLine('Ishihara OD', session.ishiharaOD);
  } else if (session.ishiharaOS) {
    ishiharaStr = formatIshiharaLine('Ishihara OS', session.ishiharaOS);
  } else if (session.ishihara) {
    const eyeLabel = session.ishihara.eye ? ` ${session.ishihara.eye}` : '';
    ishiharaStr = formatIshiharaLine(`Ishihara${eyeLabel}`, session.ishihara);
  }

  return body + (ishiharaStr ? (body ? '\n' : '') + ishiharaStr : '');
};

const AnimatedLogo = () => (
  <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center shrink-0">
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
      className="relative z-10 bg-theme-surface border border-theme-border rounded-2xl p-2.5 shadow-lg"
    >
      <svg width="36" height="36" className="sm:w-10 sm:h-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
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
  const [chartType, setChartType] = useState<ChartType>(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('ophtha_chart_type') === 'numbers') {
      return 'numbers';
    }
    return 'letters';
  });
  const [rows, setRows] = useState<Row[]>(() => getInitialRows(
    typeof window !== 'undefined' && localStorage.getItem('ophtha_chart_type') === 'numbers' ? 'numbers' : 'letters'
  ));
  const [session, setSession] = useState<SessionData>({});
  const [hasCorrection, setHasCorrection] = useState<boolean | null>(null);
  const [showCFSelector, setShowCFSelector] = useState(false);
  const [showHMSelector, setShowHMSelector] = useState(false);
  const [testDistance, setTestDistance] = useState(4); // Default 4m
  const [colorTestIndex, setColorTestIndex] = useState(0);
  const [notationMode, setNotationMode] = useState<'snellen' | 'logmar'>('snellen');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [accentHue, setAccentHue] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      const savedHue = localStorage.getItem('ophtha_accent_hue');
      if (savedHue !== null) {
        const parsed = Number(savedHue);
        if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 360) {
          return parsed;
        }
      }
    }
    return null;
  });
  const [lastSavedSession, setLastSavedSession] = useState<string>('');
  const [startingEye, setStartingEye] = useState<Eye>('OD');
  const [isTutorial, setIsTutorial] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [copied, setCopied] = useState(false);
  const [ishiharaAnswers, setIshiharaAnswers] = useState<('correct' | 'incorrect' | null)[]>(Array(16).fill(null));
  const [plate16Choice, setPlate16Choice] = useState<string>('');
  const [swipeDirection, setSwipeDirection] = useState<'up' | 'down' | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState<number>(0);
  const [hasVibratedThreshold, setHasVibratedThreshold] = useState<boolean>(false);
  const [showIshiharaModal, setShowIshiharaModal] = useState(false);
  const [showAmslerModal, setShowAmslerModal] = useState(false);
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [pendingLowVisionConfirm, setPendingLowVisionConfirm] = useState<NonLetterVA | null>(null);
  const [selectedPlateForInterpretation, setSelectedPlateForInterpretation] = useState<number>(1);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [ishiharaEye, setIshiharaEye] = useState<'OD' | 'OS' | 'OU'>('OU');
  const [interpretationTarget, setInterpretationTarget] = useState<IshiharaResult | null>(null);
  const [showDisclaimerModal, setShowDisclaimerModal] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('ophtha_hide_disclaimer') !== 'true';
  });
  const [dontShowDisclaimerAgain, setDontShowDisclaimerAgain] = useState(false);
  const [autoQuickVA, setAutoQuickVA] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('ophtha_auto_quick_va') === 'true';
  });
  const plateBitmapCacheRef = useRef<Record<number, HTMLImageElement>>({});

  const applyAutoQuickVA = (targetRows: Row[], maxLineToCredit: number = targetRows.length - 2): Row[] => {
    const updated = targetRows.map((r) => ({
      ...r,
      letters: r.letters.map((l) => ({ ...l })),
    }));
    const limit = Math.min(maxLineToCredit, updated.length - 2);
    for (let i = limit; i >= 0; i--) {
      const curCorrect = updated[i].letters.filter((l) => l.correct).length;
      const nextCorrect = updated[i + 1].letters.filter((l) => l.correct).length;
      if (curCorrect >= 3 && nextCorrect >= 1) {
        updated[i].letters = updated[i].letters.map((l) => ({ ...l, correct: true }));
      }
    }
    return updated;
  };

  const handleToggleAutoQuickVA = () => {
    setAutoQuickVA((prev) => {
      const next = !prev;
      localStorage.setItem('ophtha_auto_quick_va', String(next));
      if (next) {
        setRows((curRows) => applyAutoQuickVA(curRows));
      }
      return next;
    });
  };

  const closeDisclaimerModal = () => {
    if (dontShowDisclaimerAgain) {
      localStorage.setItem('ophtha_hide_disclaimer', 'true');
    }
    setShowDisclaimerModal(false);
  };

  const handleChartTypeChange = (type: ChartType) => {
    setChartType(type);
    localStorage.setItem('ophtha_chart_type', type);
    setRows(prev => applyChartTypeToRows(prev, type));
  };

  const startIshihara = (eye: 'OD' | 'OS' | 'OU') => {
    setIshiharaEye(eye);
    setColorTestIndex(0);
    setIshiharaAnswers(Array(16).fill(null));
    setPlate16Choice('');
    setDragOffsetY(0);
    setSwipeDirection(null);
    setCurrentStage('TEST_ISHIHARA');
  };

  // Load history and theme on mount
  useEffect(() => {
    const saved = localStorage.getItem('ophtha_history');
    if (saved) {
      try {
        const parsed: HistoryEntry[] = JSON.parse(saved);
        const seenIds = new Set<string>();
        const normalized = parsed.map((item, idx) => {
          let id = item.id;
          if (!id || seenIds.has(id)) {
            id = `${item.timestamp || Date.now()}-${idx}-${Math.random().toString(36).slice(2, 8)}`;
          }
          seenIds.add(id);
          return { ...item, id };
        });
        setHistory(normalized);
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

  // Handle theme and accent color changes
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

    if (accentHue === null) {
      root.style.removeProperty('--theme-primary');
      localStorage.removeItem('ophtha_accent_hue');
    } else {
      // Keep white text readable across yellow/green/cyan hues while keeping hue vibrant
      const needsDarkerL = accentHue >= 42 && accentHue <= 195;
      const lightness = theme === 'light' ? (needsDarkerL ? 36 : 44) : (needsDarkerL ? 42 : 55);
      root.style.setProperty('--theme-primary', `hsl(${accentHue}, 88%, ${lightness}%)`);
      localStorage.setItem('ophtha_accent_hue', String(accentHue));
    }
  }, [theme, accentHue]);

  // Ordered sequential warmup after initial paint + GPU decode (zero startup contention)
  useEffect(() => {
    let cancelled = false;
    const ensurePlateDecoded = (idx: number) => {
      if (plateBitmapCacheRef.current[idx]) {
        return Promise.resolve();
      }
      return new Promise<void>((resolve) => {
        const img = new Image();
        plateBitmapCacheRef.current[idx] = img;
        img.onload = () => {
          if ('decode' in img) {
            img.decode().catch(() => {}).finally(resolve);
          } else {
            resolve();
          }
        };
        img.onerror = () => resolve();
        img.src = `./ishihara/plate${idx + 1}.webp`;
      });
    };

    const warmQueue = async (indices: number[]) => {
      for (const idx of indices) {
        if (cancelled) return;
        await ensurePlateDecoded(idx);
      }
    };

    const conn = (navigator as unknown as {
      connection?: { saveData?: boolean; effectiveType?: string };
    }).connection;
    const isConstrained =
      Boolean(conn?.saveData) ||
      conn?.effectiveType === '2g' ||
      conn?.effectiveType === 'slow-2g';

    const timer = window.setTimeout(() => {
      const platesToWarm = isConstrained
        ? [0, 1]
        : Array.from({ length: 16 }, (_, i) => i);
      warmQueue(platesToWarm);
    }, 650);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  // Pre-warm first 3 plates when entering Colors tab or Color Choice
  useEffect(() => {
    if (activeTab !== 'exam' && currentStage !== 'COLOR_CHOICE') return;
    [0, 1, 2].forEach((idx) => {
      if (plateBitmapCacheRef.current[idx]) return;
      const img = new Image();
      plateBitmapCacheRef.current[idx] = img;
      img.src = `./ishihara/plate${idx + 1}.webp`;
      if ('decode' in img) {
        img.decode().catch(() => {});
      }
    });
  }, [activeTab, currentStage]);

  // Fast 3-plate lookahead + GPU decode while testing Ishihara
  useEffect(() => {
    if (currentStage !== 'TEST_ISHIHARA') return;
    const indicesToPreload = [
      colorTestIndex,
      colorTestIndex + 1,
      colorTestIndex + 2,
      colorTestIndex + 3,
      colorTestIndex - 1,
    ].filter((idx) => idx >= 0 && idx <= 15);
    indicesToPreload.forEach((idx) => {
      if (plateBitmapCacheRef.current[idx]) return;
      const img = new Image();
      plateBitmapCacheRef.current[idx] = img;
      img.src = `./ishihara/plate${idx + 1}.webp`;
      if ('decode' in img) {
        img.decode().catch(() => {});
      }
    });
  }, [currentStage, colorTestIndex]);

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
    
    const uniqueId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    const entry: HistoryEntry = {
      id: uniqueId,
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
    setRows((prevRows) => {
      const newRows = prevRows.map((row, idx) =>
        idx === lineIndex
          ? {
              ...row,
              letters: row.letters.map((letter, lIdx) =>
                lIdx === letterIndex ? { ...letter, correct: !letter.correct } : letter
              ),
            }
          : row
      );
      const turnedOn = newRows[lineIndex].letters[letterIndex].correct;
      if (autoQuickVA && turnedOn && lineIndex > 0) {
        return applyAutoQuickVA(newRows, lineIndex - 1);
      }
      return newRows;
    });
  };

  // Helper to determine if an eye should skip further testing (CC/PH)
  // An eye is done if it reached 20/20 or better (logMAR <= 0.0), or non-letter low vision (CF, HM, LP, NLP).
  const isEyeDone = (eye: Eye, sess: SessionData = session) => {
    // If CC was already tested, evaluate the CC outcome for this eye
    const ccData = sess[eye]?.['CC'];
    if (ccData) {
      if (ccData.logMAR !== undefined && ccData.logMAR <= 0.0) return true;
      if (ccData.nonLetter) {
        const nl = ccData.nonLetter.toUpperCase();
        if (nl.startsWith('CF') || nl.startsWith('HM') || nl === 'LP' || nl === 'NLP') return true;
        return false;
      }
      return false; // Sub-20/20 in CC still proceeds to pinhole
    }

    // Otherwise, evaluate the SC outcome for this eye
    const scData = sess[eye]?.['SC'];
    if (scData) {
      if (scData.logMAR !== undefined && scData.logMAR <= 0.0) return true;
      if (scData.nonLetter) {
        const nl = scData.nonLetter.toUpperCase();
        if (nl.startsWith('CF') || nl.startsWith('HM') || nl === 'LP' || nl === 'NLP') return true;
        return false;
      }
    }
    return false;
  };

  const getEyeTerminalReason = (eye: Eye, sess: SessionData = session) => {
    const cc = sess[eye]?.['CC'];
    if (cc) {
      if (cc.logMAR !== undefined && cc.logMAR <= 0.0) return 'already 20/20';
      if (cc.nonLetter) {
        const nl = cc.nonLetter.toUpperCase();
        if (nl.startsWith('CF')) return cc.nonLetter;
        if (nl.startsWith('HM')) return cc.nonLetter;
        if (nl === 'LP') return 'LP';
        if (nl === 'NLP') return 'NLP';
      }
    }
    const sc = sess[eye]?.['SC'];
    if (sc) {
      if (sc.logMAR !== undefined && sc.logMAR <= 0.0) return 'already 20/20';
      if (sc.nonLetter) {
        const nl = sc.nonLetter.toUpperCase();
        if (nl.startsWith('CF')) return sc.nonLetter;
        if (nl.startsWith('HM')) return sc.nonLetter;
        if (nl === 'LP') return 'LP';
        if (nl === 'NLP') return 'NLP';
      }
    }
    return 'terminal visual acuity';
  };

  const getSingleEyeTestingNotice = (phase: 'CC' | 'PH') => {
    const odDone = isEyeDone('OD');
    const osDone = isEyeDone('OS');

    if (odDone && !osDone) {
      return {
        testedEye: 'OS' as Eye,
        doneEye: 'OD' as Eye,
        reason: getEyeTerminalReason('OD')
      };
    } else if (osDone && !odDone) {
      return {
        testedEye: 'OD' as Eye,
        doneEye: 'OS' as Eye,
        reason: getEyeTerminalReason('OS')
      };
    }
    return null;
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

    if (autoQuickVA && lineIndex > 0 && lineIndex > maxLineWithHighlight) {
      setRows(applyAutoQuickVA(newRows, lineIndex - 1));
    } else {
      setRows(newRows);
    }
  };

  const setNonLetterVA = (va: NonLetterVA) => {
    if (va === 'CF') {
      setShowCFSelector(true);
    } else if (va === 'HM') {
      setShowHMSelector(true);
    } else if (va === 'LP' || va === 'NLP') {
      setPendingLowVisionConfirm(va);
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
      return isEyeDone(eye, sess);
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
    if (nextContext.stage.startsWith('TEST_')) setRows(getInitialRows(chartType));
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

    const finalNonLetter = overrideNonLetter !== undefined ? overrideNonLetter : undefined;
    const finalLogMAR = finalNonLetter ? undefined : (overrideLogMAR !== undefined ? overrideLogMAR : currentLogMAR);
    
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
      }
    }
    return steps;
  };

  const handleEditReport = () => {
    const steps = getBacktrackSteps();
    const targetStep = steps[steps.length - 1] || { eye: startingEye, mode: 'SC' as TestMode };
    const stepData = session[targetStep.eye]?.[targetStep.mode];

    setCurrentEye(targetStep.eye);
    setCurrentMode(targetStep.mode);
    if (stepData?.gridState) {
      setRows(applyChartTypeToRows(JSON.parse(JSON.stringify(stepData.gridState)), chartType));
    } else {
      setRows(getInitialRows(chartType));
    }
    setTestDistance(stepData?.testDistance ?? 4);
    const stage: Stage =
      targetStep.mode === 'SC'
        ? 'TEST_SC'
        : targetStep.mode === 'CC'
        ? 'TEST_CC'
        : 'TEST_PH';
    setCurrentStage(stage);
  };

  const restart = () => {
    setIsTutorial(false);
    setCurrentStage('EYE_INIT');
    setCurrentEye('OD');
    setCurrentMode('SC');
    setRows(getInitialRows(chartType));
    setSession({});
    setHasCorrection(null);
    setTestDistance(4);
    setColorTestIndex(0);
    setIshiharaAnswers(Array(16).fill(null));
    setPlate16Choice('');
    setDragOffsetY(0);
    setSwipeDirection(null);
    setPatientName('');
    setCopied(false);
    setIshiharaEye('OU');
    setInterpretationTarget(null);
  };

  const copyReport = () => {
    navigator.clipboard.writeText(generateReportString(session));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex flex-col h-dvh font-sans overflow-hidden transition-colors duration-300 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] ${theme === 'light' ? 'bg-white text-slate-900' : 'bg-zinc-950 text-white'}`} style={{ backgroundColor: 'var(--theme-bg)', color: 'var(--theme-text)' }}>
      {/* Main Content */}
      <main
        className={`flex-1 min-h-0 relative ${
          activeTab === 'shapes' || activeTab === 'amsler'
            ? 'overflow-hidden'
            : 'overflow-x-hidden overflow-y-auto'
        }`}
        style={{ backgroundColor: 'var(--theme-bg)' }}
        id="chart-container"
      >
        {/* Color Tests (Standalone or Exam) */}
        <AnimatePresence>
          {currentStage === 'TEST_COLORS' && (
            <motion.div 
              key="colors"
              className="fixed inset-0 z-[100] flex flex-col items-center justify-center cursor-pointer transition-colors duration-200"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ backgroundColor: ['#FF0000', '#fafb07', '#0000FF', '#03cb08'][colorTestIndex] }}
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
                      setCurrentStage('COLOR_CHOICE');
                    }
                  }
                } else {
                  if (colorTestIndex > 0) setColorTestIndex(prev => prev - 1);
                }
              }}
            >
              {/* Top Bar for 4/4 Colors */}
              <div 
                className="absolute top-4 inset-x-0 px-4 flex items-center justify-between z-40 pointer-events-auto" 
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  onClick={() => {
                    if (activeTab === 'exam') {
                      setCurrentStage('EYE_INIT');
                    } else {
                      setCurrentStage('COLOR_CHOICE');
                    }
                  }}
                  className="px-4 py-2 bg-black/40 text-white backdrop-blur-md rounded-xl font-black uppercase tracking-wider text-[11px] hover:bg-black/60 transition-all active:scale-95 shadow-lg border border-white/20"
                >
                  Done
                </button>
                <span className="px-3 py-1 bg-black/40 text-white backdrop-blur-md rounded-xl font-mono text-xs font-bold border border-white/20">
                  {colorTestIndex + 1} / 4
                </span>
              </div>
            </motion.div>
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
                      if (activeTab === 'exam') {
                        setCurrentStage('EYE_INIT');
                      } else {
                        setCurrentStage('COLOR_CHOICE');
                      }
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
                  <div className="flex items-center gap-2 mb-1.5">
                    {ishiharaEye && (
                      <span className="px-2 py-0.5 rounded-md bg-theme-primary text-white font-mono font-black text-[10px] uppercase tracking-wider">
                        {ishiharaEye}
                      </span>
                    )}
                    <span className="font-mono font-black text-xs uppercase tracking-[0.2em] text-theme-dim text-center">
                      Plate {colorTestIndex + 1} / 16
                    </span>
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

                  {/* Active + adjacent plates preload via sliding-window effect */}
                  
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
                            const eyeToSave = ishiharaEye || 'OU';
                            const result: IshiharaResult = { answers: newAnswers, score, plate16Choice, eye: eyeToSave };
                            setSession(prev => ({
                              ...prev,
                              ishihara: result,
                              ...(eyeToSave === 'OD' ? { ishiharaOD: result } : {}),
                              ...(eyeToSave === 'OS' ? { ishiharaOS: result } : {}),
                              ...(eyeToSave === 'OU' ? { ishiharaOU: result } : {})
                            }));
                            if (activeTab === 'exam') {
                              setCurrentStage('EYE_INIT');
                            } else {
                              setCurrentStage('COLOR_CHOICE');
                            }
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
                            const eyeToSave = ishiharaEye || 'OU';
                            const result: IshiharaResult = { answers: newAnswers, score, plate16Choice, eye: eyeToSave };
                            setSession(prev => ({
                              ...prev,
                              ishihara: result,
                              ...(eyeToSave === 'OD' ? { ishiharaOD: result } : {}),
                              ...(eyeToSave === 'OS' ? { ishiharaOS: result } : {}),
                              ...(eyeToSave === 'OU' ? { ishiharaOU: result } : {})
                            }));
                            if (activeTab === 'exam') {
                              setCurrentStage('EYE_INIT');
                            } else {
                              setCurrentStage('COLOR_CHOICE');
                            }
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
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 pointer-events-none">
                      <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400">
                        Plate {colorTestIndex + 1}
                      </span>
                    </div>
                    <img 
                      src={`./ishihara/plate${colorTestIndex + 1}.webp`}
                      alt={`Ishihara Plate ${colorTestIndex + 1}`}
                      loading="eager"
                      decoding="sync"
                      className="relative z-10 w-full h-full object-contain pointer-events-none select-none"
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
                  className="flex flex-col items-center justify-between text-center max-w-md mx-auto w-full h-full py-1.5 px-1 gap-2"
                >
                  {/* Compact Header: Logo, Title & History Button */}
                  <div className="flex items-center justify-between gap-2 w-full shrink-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <AnimatedLogo />
                      <div className="text-left min-w-0">
                        <h2 className="text-lg sm:text-xl font-black tracking-tighter uppercase leading-tight text-theme-text">
                          ETDRS CHART <span className="text-theme-primary block sm:inline">CALCULATOR</span>
                        </h2>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('history')}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-theme-surface border border-theme-border text-theme-text hover:border-theme-primary/50 text-[11px] font-black uppercase tracking-wider shadow-sm transition-all active:scale-95"
                      title="View saved VA history"
                    >
                      <HistoryIcon size={15} className="text-theme-primary shrink-0" />
                      <span>History</span>
                      {history.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded-md bg-theme-primary/15 text-theme-primary text-[9px] font-mono leading-none">
                          {history.length}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Optotype Switch & Optional Patient Name */}
                  <div className="flex flex-col w-full gap-2 shrink-0">
                    <div className="flex items-center justify-center">
                      <ChartTypeSwitch
                        value={chartType}
                        onChange={handleChartTypeChange}
                      />
                    </div>

                    <input 
                      type="text" 
                      placeholder="Patient Name (Optional)" 
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full bg-theme-surface border border-theme-border rounded-xl px-4 py-2 text-theme-text text-xs sm:text-sm font-bold text-center placeholder:text-theme-dim/50 focus:outline-none focus:border-theme-primary transition-all shadow-inner"
                    />
                  </div>

                  {/* Maximized OD / OS Start Buttons (2x height, fills remaining vertical space) */}
                  <div className="grid grid-cols-2 gap-2.5 w-full flex-1 min-h-[210px] sm:min-h-[240px]">
                    <button 
                      onClick={() => {
                        setSession({});
                        setHasCorrection(null);
                        setRows(getInitialRows(chartType));
                        setTestDistance(4);
                        setStartingEye('OD');
                        setCurrentEye('OD');
                        setCurrentStage('TEST_SC');
                      }}
                      className="group relative bg-theme-primary text-white font-black h-full min-h-[210px] sm:min-h-[240px] px-3 rounded-3xl shadow-xl transition-all active:scale-95 flex flex-col items-center justify-center gap-1.5 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                      <span className="relative z-10 text-xs sm:text-sm font-bold uppercase tracking-widest opacity-85">START WITH</span>
                      <span className="relative z-10 flex items-center gap-1 text-4xl sm:text-5xl font-black tracking-tight">OD <ChevronRight size={28} className="group-hover:translate-x-0.5 transition-transform shrink-0" /></span>
                    </button>

                    <button 
                      onClick={() => {
                        setSession({});
                        setHasCorrection(null);
                        setRows(getInitialRows(chartType));
                        setTestDistance(4);
                        setStartingEye('OS');
                        setCurrentEye('OS');
                        setCurrentStage('TEST_SC');
                      }}
                      className="group relative bg-theme-surface border-2 border-theme-primary/25 text-theme-primary font-black h-full min-h-[210px] sm:min-h-[240px] px-3 rounded-3xl shadow-lg transition-all active:scale-95 flex flex-col items-center justify-center gap-1.5 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-theme-primary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                      <span className="relative z-10 text-xs sm:text-sm font-bold uppercase tracking-widest opacity-80">START WITH</span>
                      <span className="relative z-10 flex items-center gap-1 text-4xl sm:text-5xl font-black tracking-tight">OS <ChevronRight size={28} className="group-hover:translate-x-0.5 transition-transform shrink-0" /></span>
                    </button>
                  </div>
                  
                  {/* Bottom Utility Row & Note */}
                  <div className="flex flex-col w-full gap-1.5 shrink-0">
                    <div className="flex flex-row items-stretch gap-2 w-full">
                      <button 
                        onClick={() => setShowConversionModal(true)}
                        className="flex-1 bg-theme-surface border border-theme-border text-theme-text font-black py-2.5 px-2.5 sm:px-3 rounded-2xl shadow-sm transition-all active:scale-95 text-[11px] sm:text-xs uppercase tracking-wide hover:border-theme-primary/50 flex items-center justify-center gap-1.5 leading-tight"
                      >
                        <ClipboardList size={15} className="text-theme-primary shrink-0" /> <span>ETDRS Conversion Table</span>
                      </button>
                      <button 
                        onClick={() => {
                          setIsTutorial(true);
                          setStartingEye('OD');
                          setCurrentEye('OD');
                          setCurrentMode('SC');
                          setRows(getInitialRows(chartType));
                          setCurrentStage('TEST_SC');
                          setTestDistance(4);
                        }}
                        className="shrink-0 px-3 sm:px-4 py-2.5 rounded-2xl border border-theme-border text-theme-dim text-[11px] sm:text-xs font-black uppercase tracking-wide hover:text-theme-text transition-all active:scale-95 flex items-center justify-center whitespace-nowrap"
                      >
                        Tutorial Mode
                      </button>
                    </div>

                    <div className="w-full rounded-2xl border border-theme-primary/30 bg-theme-primary/10 px-3 py-2 flex items-center gap-2 text-left shadow-sm">
                      <Info
                        size={15}
                        className="shrink-0 text-theme-primary"
                      />
                      <p className="text-[11px] leading-snug font-semibold text-theme-text/90">
                        For reference only—it is still best practice to document VA immediately after each step.
                      </p>
                    </div>
                  </div>
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
                                  setRows(applyChartTypeToRows(JSON.parse(JSON.stringify(stepData.gridState)), chartType));
                                } else {
                                  setRows(getInitialRows(chartType));
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

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Quick iOS Letters / Numbers Toggle */}
                      <ChartTypeSwitch
                        value={chartType}
                        onChange={handleChartTypeChange}
                        size="sm"
                      />

                      {/* Cancel ETDRS Button */}
                      <button
                        onClick={() => setShowCancelConfirm(true)}
                        className="flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-theme-dim hover:text-red-500 bg-theme-surface border border-theme-border hover:border-red-500/40 transition-all active:scale-95 shadow-sm shrink-0"
                        title="Cancel test and reset"
                      >
                        <X size={12} /> Cancel
                      </button>
                    </div>
                  </div>

                  {autoQuickVA && (
                    <div className="mb-1 px-2.5 py-1 rounded-xl border border-theme-primary/30 bg-theme-primary/10 flex items-center gap-1.5 shrink-0">
                      <Info size={12} className="text-theme-primary shrink-0" />
                      <span className="text-[10px] sm:text-[11px] font-bold text-theme-text">
                        Quick VA is ON
                      </span>
                    </div>
                  )}

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
                                          <span className="font-black text-xs">Individual {chartType === 'numbers' ? 'Number' : 'Letter'}</span><br/>Click to toggle it singly.
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

              {currentStage === 'TEST_PH_INTRO' && (() => {
                const singleNotice = getSingleEyeTestingNotice('PH');
                return (
                  <motion.div 
                     key="ph-intro"
                     initial={{ opacity: 0, scale: 0.95 }}
                     animate={{ opacity: 1, scale: 1 }}
                     className="flex flex-col items-center justify-center py-10 sm:py-14 text-center space-y-6 h-full max-w-sm mx-auto"
                  >
                    <div className="relative flex items-center justify-center mt-2">
                      <div className="w-1 h-16 bg-theme-text/80 rounded-t-lg absolute bottom-[80%]" />
                      <div className="w-20 h-20 bg-theme-text rounded-full flex items-center justify-center shadow-2xl z-10 border-4 border-theme-surface">
                        <div className="w-2 h-2 bg-theme-bg rounded-full shadow-[0_0_10px_white]" />
                      </div>
                    </div>

                    <div>
                      <h2 className="text-3xl font-black tracking-tighter uppercase italic text-theme-text mt-2">Pinhole Testing</h2>
                      
                      {singleNotice ? (
                        <div className="mt-4 space-y-3">
                          <div className="bg-theme-primary/10 border-2 border-theme-primary/30 rounded-2xl p-4 text-center space-y-1 shadow-sm">
                            <span className="text-xs font-black uppercase tracking-wider text-theme-primary block">
                              Testing {singleNotice.testedEye} Only
                            </span>
                            <p className="text-xs text-theme-text font-medium leading-relaxed">
                              <span className="font-bold text-theme-primary">{singleNotice.doneEye}</span> is {singleNotice.reason} and will not be tested with pinhole.
                            </p>
                          </div>
                          <p className="text-theme-dim text-sm sm:text-base leading-relaxed">
                            Please place the pinhole occluder over <span className="text-theme-primary font-black uppercase">{singleNotice.testedEye}</span>.
                          </p>
                        </div>
                      ) : (
                        <div className="mt-4 space-y-3">
                          <div className="bg-theme-primary/10 border-2 border-theme-primary/30 rounded-2xl p-4 text-center space-y-1 shadow-sm">
                            <span className="text-xs font-black uppercase tracking-wider text-theme-primary block">
                              Testing Both Eyes • Start with {startingEye}
                            </span>
                            <p className="text-xs text-theme-text font-medium leading-relaxed">
                              Test <span className="font-black text-theme-primary uppercase">{startingEye}</span> first, then <span className="font-bold uppercase">{startingEye === 'OD' ? 'OS' : 'OD'}</span>.
                            </p>
                          </div>
                          <p className="text-theme-dim text-sm sm:text-base leading-relaxed">
                            Please place the pinhole occluder over <span className="text-theme-primary font-black uppercase">{startingEye}</span>.
                          </p>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => handleNext()}
                      className="w-full max-w-xs bg-theme-primary text-white font-black py-5 sm:py-6 rounded-3xl shadow-xl transition-all active:scale-95 text-base sm:text-lg uppercase tracking-widest mt-2"
                    >
                      Start Pinhole ({singleNotice ? singleNotice.testedEye : startingEye})
                    </button>
                  </motion.div>
                );
              })()}

              {currentStage === 'CC_CHECK' && (() => {
                const singleNotice = getSingleEyeTestingNotice('CC');
                return (
                  <motion.div 
                     key="cc"
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     className="flex flex-col items-center justify-center py-10 sm:py-16 text-center space-y-6 sm:space-y-7 h-full max-w-sm mx-auto"
                  >
                     <div className="w-20 h-20 sm:w-24 sm:h-24 bg-theme-surface border border-theme-border text-theme-primary rounded-full flex items-center justify-center shadow-inner">
                      <Glasses size={44} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black tracking-tighter uppercase italic text-theme-text">Correction?</h2>
                      <p className="text-theme-dim mt-1.5 max-w-xs mx-auto text-sm sm:text-base">Testing with glasses or contact lenses?</p>
                    </div>

                    {/* Explanatory Notice when one eye is done */}
                    {singleNotice && (
                      <div className="bg-theme-primary/10 border-2 border-theme-primary/30 rounded-2xl p-4 w-full text-center space-y-1 shadow-sm">
                        <span className="text-xs font-black uppercase tracking-wider text-theme-primary block">
                          Testing {singleNotice.testedEye} Only
                        </span>
                        <p className="text-xs text-theme-text font-medium leading-relaxed">
                          <span className="font-bold text-theme-primary">{singleNotice.doneEye}</span> is {singleNotice.reason} and will not need correction testing.
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3 sm:gap-4 w-full">
                      <button 
                        onClick={() => handleCorrectionChoice(true)}
                        className="flex-1 bg-theme-primary text-white font-black py-5 sm:py-6 rounded-[24px] sm:rounded-[28px] shadow-2xl transition-all active:scale-95 text-base sm:text-lg uppercase"
                      >
                        WITH CC {singleNotice ? `(${singleNotice.testedEye})` : ''}
                      </button>
                      <button 
                        onClick={() => handleCorrectionChoice(false)}
                        className="flex-1 bg-theme-surface border border-theme-border text-theme-text font-black py-5 sm:py-6 rounded-[24px] sm:rounded-[28px] shadow-sm transition-all active:scale-95 text-base sm:text-lg uppercase"
                      >
                        NO CC
                      </button>
                    </div>
                  </motion.div>
                );
              })()}

              {currentStage === 'COLOR_CHOICE' && (
                <motion.div 
                   key="color-choice"
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -20 }}
                   transition={{ duration: 0.2 }}
                   className="flex flex-col items-center justify-center py-8 sm:py-14 text-center space-y-6 sm:space-y-8 h-full max-w-sm mx-auto px-2"
                >
                   <div className="w-20 h-20 bg-theme-surface border border-theme-border text-theme-primary rounded-full flex items-center justify-center overflow-hidden shadow-lg">
                    <div className="grid grid-cols-2 w-full h-full">
                      <div className="bg-red-500"/><div className="bg-yellow-500"/>
                      <div className="bg-blue-500"/><div className="bg-green-500"/>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-black tracking-tighter uppercase italic text-theme-text">Next Steps</h2>
                    <p className="text-theme-dim mt-2 text-sm sm:text-base leading-relaxed">Perform specialized color vision tests or proceed to the clinical summary.</p>
                  </div>

                  <div className="flex flex-col gap-3.5 w-full">
                    {/* Primary Action: Continue to Report */}
                    <button 
                      onClick={() => {
                        setCurrentStage('RESULTS');
                      }}
                      className="w-full bg-theme-primary text-white font-black py-4 sm:py-5 rounded-[24px] shadow-2xl transition-all active:scale-95 text-lg sm:text-xl uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      <span>Continue to Report</span>
                      <ChevronRight size={22} />
                    </button>

                    {/* Ishihara Testing for OD, OS, or OU */}
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-black uppercase tracking-wider text-theme-dim font-sans">Ishihara Plates</span>
                        <span className="text-[10px] font-mono text-theme-dim/70 font-bold">16 PLATES</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 w-full">
                        {/* Test Ishihara OD */}
                        <button 
                          onClick={() => startIshihara('OD')}
                          className={`p-3 rounded-[20px] border transition-all active:scale-95 flex flex-col items-center justify-center gap-1 shadow-sm ${
                            session.ishiharaOD 
                              ? 'bg-emerald-500/10 border-emerald-500/40' 
                              : 'bg-theme-surface border-theme-border hover:border-theme-primary/50'
                          }`}
                        >
                          <span className="text-[9px] font-mono uppercase font-bold text-theme-dim">Right Eye</span>
                          <span className="text-xs font-black uppercase tracking-wider text-theme-text">Ishihara OD</span>
                          {session.ishiharaOD ? (
                            <span className="text-[10px] font-mono font-black text-emerald-500 bg-emerald-500/15 px-2 py-0.5 rounded-md mt-0.5">
                              {session.ishiharaOD.score}/16
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono text-theme-dim/60 uppercase mt-0.5">Test</span>
                          )}
                        </button>

                        {/* Test Ishihara OS */}
                        <button 
                          onClick={() => startIshihara('OS')}
                          className={`p-3 rounded-[20px] border transition-all active:scale-95 flex flex-col items-center justify-center gap-1 shadow-sm ${
                            session.ishiharaOS 
                              ? 'bg-emerald-500/10 border-emerald-500/40' 
                              : 'bg-theme-surface border-theme-border hover:border-theme-primary/50'
                          }`}
                        >
                          <span className="text-[9px] font-mono uppercase font-bold text-theme-dim">Left Eye</span>
                          <span className="text-xs font-black uppercase tracking-wider text-theme-text">Ishihara OS</span>
                          {session.ishiharaOS ? (
                            <span className="text-[10px] font-mono font-black text-emerald-500 bg-emerald-500/15 px-2 py-0.5 rounded-md mt-0.5">
                              {session.ishiharaOS.score}/16
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono text-theme-dim/60 uppercase mt-0.5">Test</span>
                          )}
                        </button>

                        {/* Test Ishihara OU */}
                        <button 
                          onClick={() => startIshihara('OU')}
                          className={`p-3 rounded-[20px] border transition-all active:scale-95 flex flex-col items-center justify-center gap-1 shadow-sm ${
                            session.ishiharaOU 
                              ? 'bg-emerald-500/10 border-emerald-500/40' 
                              : 'bg-theme-surface border-theme-border hover:border-theme-primary/50'
                          }`}
                        >
                          <span className="text-[9px] font-mono uppercase font-bold text-theme-dim">Both Eyes</span>
                          <span className="text-xs font-black uppercase tracking-wider text-theme-text">Ishihara OU</span>
                          {session.ishiharaOU ? (
                            <span className="text-[10px] font-mono font-black text-emerald-500 bg-emerald-500/15 px-2 py-0.5 rounded-md mt-0.5">
                              {session.ishiharaOU.score}/16
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono text-theme-dim/60 uppercase mt-0.5">Test</span>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* 4/4 Colors */}
                    <button 
                      onClick={() => {
                        setColorTestIndex(0);
                        setCurrentStage('TEST_COLORS');
                      }}
                      className="w-full bg-theme-surface border border-theme-border text-theme-text font-black py-3.5 rounded-[20px] shadow-sm transition-all active:scale-95 text-xs tracking-widest uppercase hover:border-theme-primary/50 flex items-center justify-center gap-2.5"
                    >
                      <div className="flex gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#fafb07]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#03cb08]" />
                      </div>
                      <span>Test 4/4 Colors</span>
                    </button>
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
                    <div>
                      <h2 className="text-4xl font-black tracking-tighter uppercase italic text-theme-primary">VA REPORT</h2>
                      {patientName.trim() && (
                        <p className="text-theme-dim text-xs font-black uppercase tracking-widest mt-0.5 truncate max-w-xs">
                          {patientName.trim()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getBacktrackSteps().length > 0 && (
                        <button
                          type="button"
                          onClick={handleEditReport}
                          className="bg-theme-surface border border-theme-border px-3.5 py-3 rounded-2xl text-theme-text shadow-xl active:scale-95 hover:text-theme-primary hover:border-theme-primary/50 transition-colors flex items-center gap-1.5 text-xs font-black uppercase tracking-wider"
                          title="Edit and recheck VA"
                        >
                          <Pencil size={16} />
                          <span>Edit</span>
                        </button>
                      )}
                      <button onClick={restart} className="bg-theme-surface border border-theme-border p-3 rounded-2xl text-theme-dim shadow-xl active:scale-95 hover:text-theme-primary transition-colors" title="Start new log">
                        <RefreshCcw size={24} />
                      </button>
                    </div>
                  </div>

                  <div className="bg-theme-surface p-8 rounded-[40px] border border-theme-border shadow-2xl font-mono text-lg leading-relaxed flex flex-col gap-3.5">
                    {patientName.trim() && (
                      <div className="pb-4 mb-1 border-b border-theme-border/60 flex items-baseline gap-2.5">
                        <span className="text-xs font-black uppercase tracking-widest text-theme-primary font-sans shrink-0">PATIENT:</span>
                        <span className="text-xl font-black text-theme-text font-sans truncate">{patientName.trim()}</span>
                      </div>
                    )}
                    {['OD', 'OS'].filter(eye => session[eye]?.['SC'] !== undefined).map(eye => {
                       const sc = session[eye]?.['SC'];
                       const cc = session[eye]?.['CC'];
                       const scph = session[eye]?.['SCPH'];
                       const ccph = session[eye]?.['CCPH'];
                       
                       const scVal = vaDataToSnellen(sc);
                       
                       const scNL = sc?.nonLetter?.toUpperCase() || '';
                       const isNonLetter = !!sc?.nonLetter;
                       const isLowVision = scNL.startsWith('CF') || scNL.startsWith('HM') || scNL === 'LP' || scNL === 'NLP';

                       if (isLowVision) {
                         return (
                           <div key={eye} className="flex gap-4">
                             <span className="font-black text-theme-primary w-12 shrink-0">{eye}:</span>
                             <div className="flex flex-wrap gap-x-5 gap-y-2">
                               <span className="text-theme-dim font-medium">{scVal}</span>
                             </div>
                           </div>
                         );
                       }

                       const phData = scph || ccph;
                       const ccVal = cc ? (cc.statusLabel === 'NICC' ? 'NICC' : vaDataToSnellen(cc)) : '—';
                       const phVal = phData ? 
                        ((scph?.statusLabel === 'NIPH' || ccph?.statusLabel === 'NIPH') ? 'NIPH' : 
                         vaDataToSnellen(phData)) 
                        : '—';
                       const formatTestDistance = (dist?: number) => {
                         if (dist === undefined) return '';
                         return dist === 0.5 ? '½m' : `${dist}m`;
                       };

                       return (
                         <div key={eye} className="flex gap-4 items-start">
                           <span className="font-black text-theme-primary w-12 shrink-0">{eye}:</span>
                           <div className="flex flex-wrap gap-x-6 gap-y-2.5">
                             <div className="flex flex-col leading-tight">
                               <span className="text-theme-dim font-medium">
                                 {isNonLetter ? '' : <span className="text-theme-dim/50 uppercase text-[10px] mr-1 font-sans">sc</span>}
                                 {scVal}
                               </span>
                               {!isNonLetter && sc?.testDistance !== undefined && (
                                 <span className="text-theme-primary text-sm sm:text-base font-sans font-extrabold mt-0.5">
                                   @{formatTestDistance(sc.testDistance)}
                                 </span>
                               )}
                             </div>
                             {cc && (
                               <div className="flex flex-col leading-tight">
                                 <span className="text-theme-dim font-medium">
                                   <span className="text-theme-dim/50 uppercase text-[10px] mr-1 font-sans">cc</span>
                                   {ccVal}
                                 </span>
                                 {!cc.nonLetter && cc.testDistance !== undefined && (
                                   <span className="text-theme-primary text-sm sm:text-base font-sans font-extrabold mt-0.5">
                                     @{formatTestDistance(cc.testDistance)}
                                   </span>
                                 )}
                               </div>
                             )}
                             {phData && (
                               <div className="flex flex-col leading-tight">
                                 <span className="text-theme-dim font-medium">
                                   <span className="text-theme-dim/50 uppercase text-[10px] mr-1 font-sans">ph</span>
                                   {phVal}
                                 </span>
                                 {!phData.nonLetter && phData.testDistance !== undefined && (
                                   <span className="text-theme-primary text-sm sm:text-base font-sans font-extrabold mt-0.5">
                                     @{formatTestDistance(phData.testDistance)}
                                   </span>
                                 )}
                               </div>
                             )}
                           </div>
                         </div>
                       );
                    })}
                    {/* Ishihara Result Rows if assessed */}
                    {(['OD', 'OS', 'OU'] as const).map(eyeKey => {
                      const res = eyeKey === 'OD' ? session.ishiharaOD : eyeKey === 'OS' ? session.ishiharaOS : session.ishiharaOU;
                      if (!res) return null;
                      return (
                        <div key={`ishihara-${eyeKey}`} className="flex flex-col gap-2 pt-2 border-t border-theme-border/40">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-theme-primary">Ishihara {eyeKey}:</span>
                              <span className="text-theme-text font-bold">{res.score}/16</span>
                            </div>
                            <button
                              onClick={() => {
                                const firstMissed = res.answers.findIndex(a => a === 'incorrect');
                                setSelectedPlateForInterpretation(firstMissed !== -1 ? firstMissed + 1 : 1);
                                setInterpretationTarget(res);
                                setShowIshiharaModal(true);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-theme-primary/10 hover:bg-theme-primary/20 text-theme-primary rounded-xl text-xs font-black uppercase tracking-wider transition-all border border-theme-primary/30 active:scale-95"
                            >
                              <Info size={14} /> Interpretation
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Fallback for legacy single session.ishihara without OD/OS/OU */}
                    {(!session.ishiharaOD && !session.ishiharaOS && !session.ishiharaOU && session.ishihara) && (
                      <div className="flex flex-col gap-2 pt-2 border-t border-theme-border/40">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-theme-primary">Ishihara{session.ishihara.eye ? ` ${session.ishihara.eye}` : ''}:</span>
                            <span className="text-theme-text font-bold">{session.ishihara.score}/16</span>
                          </div>
                          <button
                            onClick={() => {
                              const firstMissed = session.ishihara?.answers.findIndex(a => a === 'incorrect');
                              setSelectedPlateForInterpretation(firstMissed !== undefined && firstMissed !== -1 ? firstMissed + 1 : 1);
                              setInterpretationTarget(session.ishihara || null);
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
                      className={`mt-6 flex items-center justify-center gap-2 border p-4 rounded-2xl active:scale-95 transition-all text-sm font-black uppercase tracking-widest font-sans ${
                        copied 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' 
                          : 'bg-theme-primary/10 hover:bg-theme-primary/20 text-theme-primary border-theme-primary/20'
                      }`}
                    >
                      {copied ? (
                        <>
                          <CheckCircle2 size={20} className="text-emerald-500" /> Copied Results!
                        </>
                      ) : (
                        <>
                          <ClipboardList size={20} /> Copy Results
                        </>
                      )}
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
        ) : activeTab === 'amsler' ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full flex items-center justify-center p-2 sm:p-4 bg-white relative overflow-hidden"
          >
            <div className="w-full h-full max-w-3xl max-h-3xl aspect-square flex items-center justify-center p-1 sm:p-2">
              <img 
                src="./assets/aistudio/AmslerGrid_d49a773f.svg" 
                alt="Amsler Grid" 
                className="w-full h-full object-contain select-none"
                loading="eager"
                decoding="sync"
                referrerPolicy="no-referrer"
              />
            </div>
            {/* Review Interpretation Button on bottom right */}
            <div className="absolute bottom-4 right-4 z-30">
              <button
                onClick={() => setShowAmslerModal(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-theme-surface/90 hover:bg-theme-surface text-theme-primary border border-theme-border rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-xl active:scale-95 backdrop-blur-md"
              >
                <Info size={16} /> Review Interpretation
              </button>
            </div>
          </motion.div>
        ) : activeTab === 'shapes' ? (
          <Suspense
            fallback={
              <div className="h-full max-w-xl mx-auto px-2.5 py-2 flex flex-col gap-2">
                <div className="h-9 rounded-xl bg-theme-surface border border-theme-border animate-pulse" />
                <div className="flex-1 rounded-[24px] bg-theme-surface/50 border border-theme-border/60 animate-pulse" />
              </div>
            }
          >
            <ShapesAnnouncer />
          </Suspense>
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
                  <div className="bg-red-500"/><div className="bg-[#fafb07]"/>
                  <div className="bg-blue-500"/><div className="bg-[#03cb08]"/>
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
                  startIshihara('OU');
                }}
                className="group relative h-48 bg-theme-surface border border-theme-border rounded-[40px] overflow-hidden shadow-2xl transition-all active:scale-95"
              >
                <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity flex items-center justify-center overflow-hidden pointer-events-none">
                  <img 
                    src="./assets/aistudio/Ishihara_1_a207bf18.svg" 
                    alt="Ishihara preview" 
                    className="w-full h-full object-cover object-center scale-[2.1]" 
                    loading="eager"
                    decoding="sync"
                    referrerPolicy="no-referrer" 
                  />
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
            <div className="flex items-center justify-between pb-4 border-b border-theme-border/50 gap-3">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('etdrs')}
                  className="p-2 rounded-xl bg-theme-surface border border-theme-border text-theme-dim hover:text-theme-text active:scale-95 transition-all"
                  title="Back to ETDRS"
                >
                  <ChevronLeft size={20} />
                </button>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase italic text-theme-primary">HISTORY</h2>
              </div>
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
                {history.map((entry, idx) => (
                  <div key={`${entry.id}-${idx}`} className="bg-theme-surface border border-theme-border rounded-[32px] overflow-hidden shadow-xl group">
                    <div className="px-6 py-3 bg-theme-bg/5 flex justify-between items-center border-b border-theme-border gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-[10px] font-black text-theme-dim uppercase tracking-[0.15em] font-mono shrink-0">
                          {new Date(entry.timestamp).toLocaleString(undefined, { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                        {entry.patientName && (
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-theme-border font-bold select-none shrink-0">•</span>
                            <span className="text-xs font-bold text-theme-text truncate" title={entry.patientName}>
                              {entry.patientName}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
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
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="min-h-full flex flex-col justify-between py-3 px-4 max-w-sm mx-auto w-full gap-2.5"
          >
            <div className="space-y-0.5 text-center shrink-0">
              <h2 className="text-2xl font-black tracking-tighter uppercase italic text-theme-primary leading-none">SETUP</h2>
              <p className="text-theme-dim text-[10px] font-medium tracking-widest uppercase italic">Preferences & Tools</p>
            </div>

            <div className="flex flex-col gap-2.5 flex-1 min-h-0">
              <div className="bg-theme-surface p-4 rounded-[24px] border border-theme-border shadow-xl space-y-3 shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-theme-text font-black uppercase text-xs sm:text-sm italic leading-tight">Interface Theme</span>
                    <span className="text-theme-dim text-[9px] uppercase font-mono tracking-wider">
                      {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
                    </span>
                  </div>
                  <ThemeToggleSwitch theme={theme} onToggle={setTheme} />
                </div>

                {/* Accent Color Hue Slider */}
                <div className="pt-3 border-t border-theme-border/60 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-theme-text font-black uppercase text-xs sm:text-sm italic leading-tight">Accent Color</span>
                      <span className="text-theme-dim text-[9px] uppercase font-mono tracking-wider">
                        {accentHue === null ? 'Default Cyan' : 'Custom Color'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {accentHue !== null && (
                        <button
                          type="button"
                          onClick={() => setAccentHue(null)}
                          className="px-2 py-0.5 rounded-lg bg-theme-bg border border-theme-border text-[9px] font-black uppercase tracking-wider text-theme-dim hover:text-theme-text active:scale-95 transition-all"
                        >
                          Reset
                        </button>
                      )}
                      <span
                        className="w-5 h-5 rounded-full border-2 border-white/80 shadow-md shrink-0 bg-theme-primary"
                        aria-hidden="true"
                      />
                    </div>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={360}
                    value={accentHue ?? 191}
                    onChange={(e) => setAccentHue(Number(e.target.value))}
                    aria-label="Accent color hue slider"
                    className="w-full accent-hue-slider cursor-pointer"
                  />
                </div>

                {/* Automatic Quick VA Toggle */}
                <div className="pt-3 border-t border-theme-border/60 flex items-center justify-between gap-3">
                  <div className="flex flex-col min-w-0">
                    <span className="text-theme-text font-black uppercase text-xs sm:text-sm italic leading-tight">
                      Auto Quick VA
                    </span>
                    <span className="text-theme-dim text-[9px] uppercase font-mono tracking-wider leading-snug">
                      {autoQuickVA ? 'PGH Rule Active (≥3/5 → 5/5)' : 'Standard ETDRS Scoring'}
                    </span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={autoQuickVA}
                    aria-label="Toggle automatic Quick VA rule"
                    onClick={handleToggleAutoQuickVA}
                    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors duration-200 cursor-pointer active:scale-95 ${
                      autoQuickVA
                        ? 'bg-theme-primary border-theme-primary'
                        : 'bg-theme-bg border-theme-border'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 rounded-full shadow-md transition-transform duration-200 ${
                        autoQuickVA
                          ? 'translate-x-6 bg-white'
                          : 'translate-x-1 bg-theme-dim'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <Suspense
                fallback={
                  <div className="bg-theme-surface p-4 rounded-[24px] border border-theme-border shadow-xl flex-1 min-h-[160px] animate-pulse" />
                }
              >
                <SetupFeedbackSection />
              </Suspense>
            </div>

            <div className="text-center pt-0.5 shrink-0">
              <p className="text-[9px] text-theme-dim font-black uppercase tracking-[0.35em] opacity-30">MADE BY GIO FERNANDEZ</p>
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
                      {notationMode === 'snellen' ? (lettersAndDistanceToSnellen(totalCorrect, testDistance) ?? logMARToSnellen(currentLogMAR)) : currentLogMAR}
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
          active={activeTab === 'amsler'} 
          onClick={() => setActiveTab('amsler')} 
          icon={<Grid3x3 size={20} />} 
          label="Amsler" 
        />
        <TabItem 
          active={activeTab === 'shapes'} 
          onClick={() => setActiveTab('shapes')} 
          icon={<Shapes size={20} />} 
          label="Shapes" 
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
              {(() => {
                const activeIshihara = interpretationTarget || session.ishihara;
                return (
                  <>
                    <div className="flex items-center justify-between pb-3 border-b border-theme-border/50">
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-base sm:text-lg font-black uppercase italic text-theme-text leading-none">
                          Ishihara Guide{activeIshihara?.eye ? ` (${activeIshihara.eye})` : ''}
                        </h3>
                        <span className="text-[10px] font-mono font-bold text-theme-dim bg-theme-bg px-2.5 py-0.5 rounded-lg border border-theme-border">
                          {activeIshihara ? `${activeIshihara.score}/16 Correct` : 'All 16 Plates'}
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
                          const ans = activeIshihara?.answers ? activeIshihara.answers[detail.plateNum - 1] : ishiharaAnswers[detail.plateNum - 1];
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
                      const curAns = activeIshihara?.answers ? activeIshihara.answers[curDetail.plateNum - 1] : ishiharaAnswers[curDetail.plateNum - 1];

                return (
                  <div className="flex-1 overflow-y-auto py-3 space-y-3 font-sans text-theme-text pr-0.5">
                    {/* Plate Display with larger photo and details */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-3.5 bg-theme-bg p-3 sm:p-3.5 rounded-2xl border border-theme-border shadow-inner">
                      {/* Enriched, larger Ishihara plate image */}
                      <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl overflow-hidden border-2 border-theme-border shrink-0 bg-white shadow-md">
                        <img 
                          src={`./ishihara/plate${curDetail.plateNum}.webp`} 
                          alt={`Plate ${curDetail.plateNum}`} 
                          loading="lazy"
                          decoding="async"
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
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}

      {/* Amsler Grid Interpretation Modal */}
      <AnimatePresence>
        {showAmslerModal && (
          <div className="fixed inset-0 z-[200] bg-black/65 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-theme-surface border-2 border-theme-border/80 rounded-[32px] max-w-lg sm:max-w-xl w-full p-4 sm:p-6 shadow-2xl flex flex-col max-h-[88vh] overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3 border-b border-theme-border/50">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base sm:text-lg font-black uppercase italic text-theme-text leading-none">
                    Amsler Grid Interpretation
                  </h3>
                  <span className="text-[10px] font-mono font-bold text-theme-dim bg-theme-bg px-2.5 py-0.5 rounded-lg border border-theme-border">
                    MACULAR FUNCTION
                  </span>
                </div>
                <button 
                  onClick={() => setShowAmslerModal(false)}
                  className="p-1.5 rounded-full bg-theme-bg border border-theme-border text-theme-dim hover:text-theme-text transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-3.5 font-sans text-theme-text pr-0.5">
                <div className="p-3.5 rounded-2xl bg-green-500/10 border border-green-500/20 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-green-500 block">Normal Findings</span>
                  <p className="text-xs sm:text-sm font-bold text-theme-text leading-relaxed">
                    All grid lines appear straight, parallel, and unbroken. Squares are uniform in size, and the central fixation dot is clearly visible without any distortion, blurring, or missing areas.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 block">Metamorphopsia (Distortion / Wavy Lines)</span>
                  <div className="w-full h-40 sm:h-48 rounded-xl overflow-hidden bg-white border border-amber-500/30 flex items-center justify-center">
                    <img 
                      src="./assets/aistudio/image_c95e2aa5.png" 
                      alt="Metamorphopsia Grid" 
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-theme-text leading-relaxed">
                    Lines appear wavy, curved, crooked, or irregular. This indicates disruption of the normal retinal architecture at the macula, commonly seen in wet age-related macular degeneration (AMD) or epiretinal membranes.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-2.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-red-500 block">Scotoma (Blind Spot / Missing Area)</span>
                  <div className="w-full h-40 sm:h-48 rounded-xl overflow-hidden bg-white border border-red-500/30 flex items-center justify-center">
                    <img 
                      src="./assets/aistudio/image_a1df31e3.png" 
                      alt="Scotoma Grid" 
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-theme-text leading-relaxed">
                    Specific areas where lines are missing, faded, or completely blank. Associated with central scotomas, macular edema, central serous chorioretinopathy, or advanced macular degeneration.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-theme-bg border border-theme-border space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-theme-dim block">Blurring / Faded Vision</span>
                  <p className="text-xs sm:text-sm font-bold text-theme-text leading-relaxed">
                    Central or paracentral areas appearing blurry or less distinct than the surrounding grid. Suggests early macular dysfunction or fluid accumulation.
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setShowAmslerModal(false)}
                className="mt-2 w-full py-3 bg-theme-primary text-white font-black rounded-xl text-xs uppercase tracking-widest active:scale-95 transition-all shadow-md"
              >
                Close Interpretation
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ETDRS Conversion Table Modal */}
      <AnimatePresence>
        {showConversionModal && (
          <div className="fixed inset-0 z-[200] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-theme-surface border-2 border-theme-border/80 rounded-[32px] max-w-2xl w-full p-4 sm:p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3 border-b border-theme-border/50">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base sm:text-lg font-black uppercase italic text-theme-text leading-none">
                    ETDRS Conversion Table
                  </h3>
                  <span className="text-[10px] font-mono font-bold text-theme-dim bg-theme-bg px-2.5 py-0.5 rounded-lg border border-theme-border">
                    REFERENCE
                  </span>
                </div>
                <button 
                  onClick={() => setShowConversionModal(false)}
                  className="p-1.5 rounded-full bg-theme-bg border border-theme-border text-theme-dim hover:text-theme-text transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-3 pr-1">
                <div className="rounded-2xl overflow-hidden border border-theme-border bg-theme-surface shadow-inner">
                  <table className="w-full text-center border-collapse font-mono text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-theme-primary text-white font-black uppercase text-[11px] sm:text-xs tracking-wider sticky top-0 z-10 shadow-sm">
                        <th className="py-3 px-2 border-r border-white/20">Letters</th>
                        <th className="py-3 px-2 border-r border-white/20">4 Meters</th>
                        <th className="py-3 px-2 border-r border-white/20">2 Meters</th>
                        <th className="py-3 px-2 border-r border-white/20">1 Meter</th>
                        <th className="py-3 px-2">½ Meter</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-border/60">
                      {ETDRS_CONVERSION_DATA.map((row) => (
                        <tr key={row.letters} className="hover:bg-theme-primary/5 transition-colors">
                          <td className="py-2.5 px-2 font-black text-theme-primary border-r border-theme-border/60">{row.letters}</td>
                          <td className="py-2.5 px-2 text-theme-text font-bold border-r border-theme-border/60">{row.m4}</td>
                          <td className="py-2.5 px-2 text-theme-text border-r border-theme-border/60">{row.m2}</td>
                          <td className="py-2.5 px-2 text-theme-text border-r border-theme-border/60">{row.m1}</td>
                          <td className="py-2.5 px-2 text-theme-text">{row.m05}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <button 
                onClick={() => setShowConversionModal(false)}
                className="mt-2 w-full py-3 bg-theme-primary text-white font-black rounded-xl text-xs uppercase tracking-widest active:scale-95 transition-all shadow-md"
              >
                Close Table
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Low Vision (LP / NLP) Confirmation Modal */}
      <AnimatePresence>
        {pendingLowVisionConfirm && (
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
                  Confirm {pendingLowVisionConfirm}?
                </h3>
                <p className="text-xs text-theme-dim leading-relaxed">
                  You selected <span className="font-bold text-theme-primary">{pendingLowVisionConfirm}</span> ({pendingLowVisionConfirm === 'LP' ? 'Light Perception' : 'No Light Perception'}). This is a terminal low-vision test result. Are you sure?
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full pt-1">
                <button
                  onClick={() => setPendingLowVisionConfirm(null)}
                  className="py-3 px-3 rounded-xl border border-theme-border bg-theme-bg text-theme-text font-black text-xs uppercase tracking-wider hover:bg-theme-border/30 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const va = pendingLowVisionConfirm;
                    setPendingLowVisionConfirm(null);
                    handleNext(undefined, va);
                  }}
                  className="py-3 px-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-xs uppercase tracking-wider transition-all active:scale-95 shadow-lg shadow-red-500/30"
                >
                  Confirm {pendingLowVisionConfirm}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

      {/* Startup ETDRS Scoring Disclaimer Modal */}
      <AnimatePresence>
        {showDisclaimerModal && (
          <div className="fixed inset-0 z-[260] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="etdrs-disclaimer-title"
              className="bg-theme-surface border border-theme-border rounded-[28px] max-w-sm w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-theme-primary block">
                    Before You Start
                  </span>
                  <h3 id="etdrs-disclaimer-title" className="text-lg font-black uppercase italic text-theme-text tracking-tight leading-tight">
                    ETDRS Scoring Guide
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={closeDisclaimerModal}
                  aria-label="Close scoring notice"
                  className="p-1.5 rounded-full bg-theme-bg border border-theme-border text-theme-dim hover:text-theme-text transition-colors shrink-0"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2.5 text-xs sm:text-[13px] text-theme-text leading-snug">
                <div className="p-3 rounded-2xl bg-theme-bg border border-theme-border space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-theme-primary block">
                    ETDRS Guidelines
                  </span>
                  <p className="text-theme-dim">
                    This calculator <strong className="text-theme-text font-bold">counts every missed letter</strong> across all lines tested (based on ETDRS guidelines)
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-theme-primary/10 border border-theme-primary/25 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-theme-primary block">
                    For Quick VA (followed by PGH)
                  </span>
                  <p className="text-theme-dim">
                    If a patient moves on to the next line (from answering ≥3/5 correct) <strong className="text-theme-text font-bold"> AND </strong> is able to answer a correct letter from that next line, <strong className="text-theme-text font-bold"> MANUALLY credit the previous line as perfect 5/5 </strong>
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-theme-bg border border-theme-border space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-theme-primary block">
                    Automatic Quick VA Switch
                  </span>
                  <p className="text-theme-dim">
                    There is a switch in the <strong className="text-theme-text font-bold">Setup</strong> menu (<strong className="text-theme-text font-bold">Auto Quick VA</strong>) to make this Quick VA rule automatic.
                  </p>
                </div>
              </div>

              <label className="flex items-center gap-2.5 min-h-[44px] px-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={dontShowDisclaimerAgain}
                  onChange={(e) => setDontShowDisclaimerAgain(e.target.checked)}
                  className="w-4 h-4 rounded border-theme-border accent-theme-primary cursor-pointer shrink-0"
                />
                <span className="text-xs font-bold text-theme-dim">
                  Don&apos;t show this again
                </span>
              </label>

              <button
                type="button"
                onClick={closeDisclaimerModal}
                className="w-full py-3.5 rounded-2xl bg-theme-primary text-white font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all"
              >
                Got It
              </button>
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
      className={`flex flex-col items-center gap-1 transition-all flex-1 min-w-0 relative ${active ? 'text-theme-primary' : 'text-theme-dim'}`}
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
