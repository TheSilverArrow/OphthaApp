import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { Volume2 } from 'lucide-react';

interface ShapeItem {
  id: 'square' | 'circle' | 'apple' | 'house' | 'star';
  name: string;
}

interface VoiceOption {
  id: string;
  label: string;
  voiceURI?: string;
  pitch: number;
  rate: number;
}

const PATTI_PICS_SHAPES: ShapeItem[] = [
  { id: 'square', name: 'Square' },
  { id: 'circle', name: 'Circle' },
  { id: 'apple', name: 'Apple' },
  { id: 'house', name: 'House' },
  { id: 'star', name: 'Star' },
];

const NOVELTY_VOICE_PATTERN =
  /albert|bad news|bahh|bells|boing|bubbles|cellos|eddy|flo|good news|grandma|grandpa|jester|junior|kathy|organ|ralph|reed|rocko|sandy|shelley|superstar|trinoids|whisper|wobble|zarvox/i;

const FALLBACK_VOICE_OPTIONS: VoiceOption[] = [
  { id: 'preset-standard', label: 'Standard Voice', pitch: 1.0, rate: 0.88 },
  { id: 'preset-clear-slow', label: 'Slow & Clear', pitch: 1.0, rate: 0.72 },
  { id: 'preset-higher', label: 'Bright / Higher', pitch: 1.25, rate: 0.9 },
  { id: 'preset-deeper', label: 'Deep / Lower', pitch: 0.78, rate: 0.85 },
];

function formatRegionTag(lang: string): string {
  const parts = lang.replace('_', '-').split('-');
  if (parts.length < 2) return '';
  const region = parts[1].toUpperCase();
  const labels: Record<string, string> = {
    US: 'US',
    GB: 'UK',
    AU: 'AU',
    IE: 'IE',
    IN: 'IN',
    ZA: 'ZA',
    CA: 'CA',
    NZ: 'NZ',
    PH: 'PH',
  };
  return labels[region] || region;
}

function ShapeOptotype({ id, className }: { id: ShapeItem['id']; className?: string }) {
  switch (id) {
    case 'square':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="14" y="14" width="72" height="72" rx="8" />
        </svg>
      );
    case 'circle':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="50" cy="50" r="38" />
        </svg>
      );
    case 'apple':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="10.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M 50 26 C 42 14, 23 13, 16 28 C 9 43, 16 69, 28 82 C 36 90, 45 86, 50 81 C 55 86, 64 90, 72 82 C 84 69, 91 43, 84 28 C 77 13, 58 14, 50 26 Z" />
          <path d="M 50 24 C 50 15, 55 10, 60 8" strokeWidth="8.5" />
        </svg>
      );
    case 'house':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="8,44 50,12 92,44" />
          <polyline points="19,38 19,87 81,87 81,38" />
        </svg>
      );
    case 'star':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="10.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="50,11 63.3,33.2 88.4,39.3 71.8,58.8 73.7,84.4 50,74.6 26.3,84.4 28.2,58.8 11.6,39.3 36.7,33.2" />
        </svg>
      );
  }
}

export default function ShapesAnnouncer() {
  const [activeShapeId, setActiveShapeId] = useState<ShapeItem['id'] | null>(null);
  const [voiceOptions, setVoiceOptions] = useState<VoiceOption[]>(FALLBACK_VOICE_OPTIONS);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ophtha_shapes_voice') || FALLBACK_VOICE_OPTIONS[0].id;
    }
    return FALLBACK_VOICE_OPTIONS[0].id;
  });

  const systemVoicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const clearTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      if (!allVoices.length) return;
      systemVoicesRef.current = allVoices;

      const englishVoices = allVoices.filter(v => v.lang.toLowerCase().startsWith('en'));
      const pool = englishVoices.length > 0 ? englishVoices : allVoices;
      const cleanPool = pool.filter(v => !NOVELTY_VOICE_PATTERN.test(v.name));
      const usableVoices = cleanPool.length > 0 ? cleanPool : pool;

      // Deduplicate by display label and prioritize natural US/UK/AU voices first
      const seen = new Set<string>();
      const deduped: SpeechSynthesisVoice[] = [];
      for (const v of usableVoices) {
        const key = `${v.name.toLowerCase()}-${v.lang.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          deduped.push(v);
        }
      }

      deduped.sort((a, b) => {
        const score = (v: SpeechSynthesisVoice) => {
          let s = 0;
          if (/samantha|google us english|aria|jenny|daniel|karen|aaron|nicky/i.test(v.name)) s += 4;
          if (v.lang.toLowerCase() === 'en-us') s += 3;
          else if (v.lang.toLowerCase() === 'en-gb') s += 2;
          if (v.localService) s += 1;
          return s;
        };
        return score(b) - score(a) || a.name.localeCompare(b.name);
      });

      const mapped: VoiceOption[] =
        deduped.length > 1
          ? deduped.map(v => {
              const region = formatRegionTag(v.lang);
              const cleanName = v.name.replace(/\s*\([^)]*\)\s*/g, '').trim();
              return {
                id: v.voiceURI,
                label: region ? `${cleanName} (${region})` : cleanName,
                voiceURI: v.voiceURI,
                pitch: 1.0,
                rate: 0.88,
              };
            })
          : FALLBACK_VOICE_OPTIONS.map(opt => ({
              ...opt,
              voiceURI: deduped[0]?.voiceURI,
            }));

      setVoiceOptions(mapped);
      setSelectedVoiceId(prev => {
        if (mapped.some(o => o.id === prev)) return prev;
        const firstId = mapped[0].id;
        localStorage.setItem('ophtha_shapes_voice', firstId);
        return firstId;
      });
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      window.speechSynthesis.cancel();
      if (clearTimerRef.current) {
        window.clearTimeout(clearTimerRef.current);
      }
    };
  }, []);

  const speakText = useCallback(
    (text: string, optionId?: string, onDone?: () => void) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        onDone?.();
        return;
      }

      try {
        window.speechSynthesis.cancel();
        const chosen =
          voiceOptions.find(o => o.id === (optionId ?? selectedVoiceId)) || voiceOptions[0];

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.volume = 1.0;
        utterance.rate = chosen?.rate ?? 0.88;
        utterance.pitch = chosen?.pitch ?? 1.0;

        if (chosen?.voiceURI) {
          const match = systemVoicesRef.current.find(v => v.voiceURI === chosen.voiceURI);
          if (match) {
            utterance.voice = match;
            utterance.lang = match.lang || 'en-US';
          }
        }

        if (onDone) {
          utterance.onend = onDone;
          utterance.onerror = onDone;
        }

        window.speechSynthesis.speak(utterance);
      } catch {
        onDone?.();
      }
    },
    [selectedVoiceId, voiceOptions]
  );

  const handleVoiceChange = (newId: string) => {
    setSelectedVoiceId(newId);
    localStorage.setItem('ophtha_shapes_voice', newId);
    speakText('Ready', newId);
  };

  const announceShape = useCallback(
    (shape: ShapeItem) => {
      setActiveShapeId(shape.id);

      if (clearTimerRef.current) {
        window.clearTimeout(clearTimerRef.current);
      }

      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(25);
        } catch {
          // Ignore vibration errors on unsupported platforms
        }
      }

      speakText(shape.name, undefined, () => setActiveShapeId(null));

      clearTimerRef.current = window.setTimeout(() => {
        setActiveShapeId(null);
      }, 1200);
    },
    [speakText]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full max-w-xl mx-auto px-2.5 pt-2 pb-2 w-full select-none"
    >
      {/* Only setting: compact voice picker */}
      <div className="flex items-center gap-2 mb-2 shrink-0">
        <div className="flex items-center gap-2 flex-1 bg-theme-surface border border-theme-border rounded-xl px-3 py-1.5 shadow-sm">
          <Volume2 size={15} className="text-theme-primary shrink-0" />
          <label htmlFor="shapes-voice-select" className="text-[10px] font-black uppercase tracking-wider text-theme-dim shrink-0">
            Voice
          </label>
          <select
            id="shapes-voice-select"
            value={selectedVoiceId}
            onChange={(e) => handleVoiceChange(e.target.value)}
            className="flex-1 min-w-0 bg-transparent text-theme-text text-xs font-bold focus:outline-none truncate cursor-pointer"
          >
            {voiceOptions.map((option) => (
              <option key={option.id} value={option.id} className="bg-zinc-900 text-white">
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Maximized 5 Patti Pics Shape Buttons (labels hidden, identical box sizes) */}
      <div className="grid grid-cols-4 grid-rows-3 gap-2.5 flex-1 min-h-0">
        {PATTI_PICS_SHAPES.map((shape, idx) => {
          const isSpeaking = activeShapeId === shape.id;
          const isFifth = idx === 4;

          return (
            <motion.button
              key={shape.id}
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => announceShape(shape)}
              aria-label={shape.name}
              className={`relative col-span-2 rounded-[24px] sm:rounded-[28px] border-2 flex items-center justify-center p-2 sm:p-3 transition-all shadow-lg overflow-hidden bg-white text-zinc-950 ${
                isFifth ? 'col-start-2' : ''
              } ${
                isSpeaking
                  ? 'border-blue-500 ring-4 ring-blue-500/35 shadow-blue-500/25'
                  : 'border-zinc-200 hover:border-blue-400/70'
              }`}
            >
              <ShapeOptotype
                id={shape.id}
                className="h-full max-h-[88%] max-w-[88%] aspect-square text-zinc-950"
              />
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
