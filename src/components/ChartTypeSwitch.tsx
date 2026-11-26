import React from 'react';
import { motion } from 'motion/react';
import { ChartType } from '../types';

interface ChartTypeSwitchProps {
  value: ChartType;
  onChange: (type: ChartType) => void;
  size?: 'md' | 'sm';
  compactLabels?: boolean;
}

export default function ChartTypeSwitch({
  value,
  onChange,
  size = 'md',
  compactLabels = false,
}: ChartTypeSwitchProps) {
  const isNumbers = value === 'numbers';

  const handleToggle = () => {
    onChange(isNumbers ? 'letters' : 'numbers');
  };

  if (size === 'sm') {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={isNumbers}
        aria-label={`Switch chart to ${isNumbers ? 'letters' : 'numbers'}`}
        onClick={handleToggle}
        title={isNumbers ? 'Switch to ETDRS Letters' : 'Switch to LVRC Numbers'}
        className={`relative flex items-center w-[60px] h-[26px] rounded-full p-[2px] transition-colors duration-300 shadow-[inset_0_1.5px_4px_rgba(0,0,0,0.2)] cursor-pointer select-none border ${
          isNumbers
            ? 'bg-theme-primary border-theme-primary'
            : 'bg-theme-surface border-theme-primary/40'
        }`}
      >
        {/* Recessed opposite label inside track */}
        <span
          className={`absolute left-[6px] text-[8.5px] font-black tracking-tight text-white/90 transition-opacity duration-200 pointer-events-none ${
            isNumbers ? 'opacity-100' : 'opacity-0'
          }`}
        >
          ABC
        </span>
        <span
          className={`absolute right-[6px] text-[8.5px] font-black tracking-tight text-theme-dim transition-opacity duration-200 pointer-events-none ${
            isNumbers ? 'opacity-0' : 'opacity-100'
          }`}
        >
          123
        </span>

        {/* Theme-matched sliding knob */}
        <motion.span
          animate={{ x: isNumbers ? 28 : 0 }}
          transition={{ type: 'spring', stiffness: 560, damping: 34, mass: 0.75 }}
          className={`relative z-10 w-[26px] h-[20px] rounded-full shadow-[0_2px_5px_rgba(0,0,0,0.28),0_0.5px_1px_rgba(0,0,0,0.16)] flex items-center justify-center transition-colors duration-300 ${
            isNumbers ? 'bg-white' : 'bg-theme-primary'
          }`}
        >
          <span
            className={`text-[8.5px] font-black tracking-tighter leading-none ${
              isNumbers ? 'text-theme-primary' : 'text-white'
            }`}
          >
            {isNumbers ? '123' : 'ABC'}
          </span>
        </motion.span>
      </button>
    );
  }

  return (
    <div className="inline-flex items-center justify-center gap-3 select-none">
      <button
        type="button"
        onClick={() => onChange('letters')}
        className={`text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
          !isNumbers
            ? 'text-theme-primary scale-105'
            : 'text-theme-dim/60 hover:text-theme-dim'
        }`}
      >
        {compactLabels ? 'ABC' : 'Letters'}
      </button>

      <motion.button
        type="button"
        role="switch"
        aria-checked={isNumbers}
        aria-label={`Switch chart to ${isNumbers ? 'letters' : 'numbers'}`}
        whileTap={{ scale: 0.95 }}
        onClick={handleToggle}
        className={`relative flex items-center w-[64px] h-[34px] rounded-full p-[3px] transition-colors duration-300 shadow-[inset_0_2px_5px_rgba(0,0,0,0.2)] cursor-pointer border ${
          isNumbers
            ? 'bg-theme-primary border-theme-primary'
            : 'bg-theme-surface border-theme-primary/40'
        }`}
      >
        {/* Subtle track glyph cues */}
        <span
          className={`absolute left-[8px] text-[9px] font-black tracking-tight text-white/90 transition-opacity duration-200 pointer-events-none ${
            isNumbers ? 'opacity-100' : 'opacity-0'
          }`}
        >
          ABC
        </span>
        <span
          className={`absolute right-[8px] text-[9px] font-black tracking-tight text-theme-dim transition-opacity duration-200 pointer-events-none ${
            isNumbers ? 'opacity-0' : 'opacity-100'
          }`}
        >
          123
        </span>

        {/* Theme-matched sliding thumb */}
        <motion.span
          animate={{ x: isNumbers ? 28 : 0 }}
          transition={{ type: 'spring', stiffness: 520, damping: 32, mass: 0.8 }}
          className={`relative z-10 w-[28px] h-[28px] rounded-full shadow-[0_3px_8px_rgba(0,0,0,0.25),0_1px_2px_rgba(0,0,0,0.14)] flex items-center justify-center transition-colors duration-300 ${
            isNumbers ? 'bg-white' : 'bg-theme-primary'
          }`}
        >
          <span
            className={`text-[9px] font-black tracking-tighter leading-none ${
              isNumbers ? 'text-theme-primary' : 'text-white'
            }`}
          >
            {isNumbers ? '123' : 'ABC'}
          </span>
        </motion.span>
      </motion.button>

      <button
        type="button"
        onClick={() => onChange('numbers')}
        className={`text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
          isNumbers
            ? 'text-theme-primary scale-105'
            : 'text-theme-dim/60 hover:text-theme-dim'
        }`}
      >
        {compactLabels ? '123' : 'Numbers'}
      </button>
    </div>
  );
}
