import React from 'react';
import { motion } from 'motion/react';

interface ThemeToggleSwitchProps {
  theme: 'dark' | 'light';
  onToggle: (nextTheme: 'dark' | 'light') => void;
}

export default function ThemeToggleSwitch({ theme, onToggle }: ThemeToggleSwitchProps) {
  const isDark = theme === 'dark';

  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      whileTap={{ scale: 0.95 }}
      onClick={() => onToggle(isDark ? 'light' : 'dark')}
      className="relative w-[76px] h-[36px] rounded-full p-[3px] overflow-hidden cursor-pointer select-none shadow-[inset_0_2px_6px_rgba(0,0,0,0.35),0_1px_2px_rgba(255,255,255,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary"
      style={{
        background: isDark
          ? 'linear-gradient(180deg, #0b1120 0%, #172554 100%)'
          : 'linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)',
        transition: 'background 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      {/* Animated Sky Scene SVG Backdrop (Stars + Clouds) */}
      <svg
        viewBox="0 0 76 36"
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden="true"
      >
        {/* Night Twinkling Stars (slide in from top on dark mode) */}
        <motion.g
          initial={false}
          animate={{
            y: isDark ? 0 : -24,
            opacity: isDark ? 1 : 0,
          }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* 4-point sparkle stars */}
          <path
            d="M14 7 L15 10 L18 11 L15 12 L14 15 L13 12 L10 11 L13 10 Z"
            fill="#f8fafc"
            opacity="0.95"
          />
          <path
            d="M29 19 L29.8 21.2 L32 22 L29.8 22.8 L29 25 L28.2 22.8 L26 22 L28.2 21.2 Z"
            fill="#e2e8f0"
            opacity="0.85"
          />
          <path
            d="M36 6 L36.6 7.8 L38.4 8.4 L36.6 9 L36 10.8 L35.4 9 L33.6 8.4 L35.4 7.8 Z"
            fill="#f8fafc"
            opacity="0.8"
          />
          {/* Subtle pinpoint stars */}
          <circle cx="9" cy="23" r="1.1" fill="#cbd5e1" opacity="0.85" />
          <circle cx="22" cy="13" r="0.9" fill="#f8fafc" opacity="0.7" />
          <circle cx="20" cy="28" r="1.2" fill="#e2e8f0" opacity="0.9" />
          <circle cx="38" cy="27" r="0.8" fill="#cbd5e1" opacity="0.65" />
        </motion.g>

        {/* Day Fluffy Clouds (slide in from bottom on light mode) */}
        <motion.g
          initial={false}
          animate={{
            y: isDark ? 24 : 0,
            opacity: isDark ? 0 : 1,
          }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Back translucent cloud layer */}
          <g fill="#e0f2fe" opacity="0.55">
            <circle cx="42" cy="33" r="8" />
            <circle cx="52" cy="29" r="9" />
            <circle cx="62" cy="31" r="8" />
            <circle cx="71" cy="33" r="7" />
          </g>
          {/* Front bright cloud layer */}
          <g fill="#ffffff" opacity="0.96">
            <circle cx="39" cy="36" r="7" />
            <circle cx="49" cy="33" r="8.5" />
            <circle cx="59" cy="34" r="7.5" />
            <circle cx="68" cy="31" r="8" />
            <circle cx="75" cy="35" r="6" />
          </g>
        </motion.g>
      </svg>

      {/* Soft Ambient Concentric Glow Rings behind Thumb */}
      <motion.span
        initial={false}
        animate={{ x: isDark ? 40 : 0 }}
        transition={{ type: 'spring', stiffness: 420, damping: 28, mass: 0.85 }}
        className="relative z-10 block w-[30px] h-[30px]"
      >
        <span
          className="absolute -inset-3 rounded-full pointer-events-none transition-colors duration-500"
          style={{
            background: isDark
              ? 'radial-gradient(circle, rgba(226,232,240,0.22) 0%, rgba(226,232,240,0.08) 55%, transparent 75%)'
              : 'radial-gradient(circle, rgba(254,240,138,0.45) 0%, rgba(254,240,138,0.18) 55%, transparent 75%)',
          }}
        />

        {/* Sun / Moon SVG Orb */}
        <svg viewBox="0 0 30 30" className="relative w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]" aria-hidden="true">
          <defs>
            <linearGradient id="sun-orb-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="55%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#eab308" />
            </linearGradient>
            <linearGradient id="moon-orb-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="65%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
          </defs>

          {/* Sun base */}
          <motion.circle
            cx="15"
            cy="15"
            r="14"
            fill="url(#sun-orb-grad)"
            initial={false}
            animate={{ opacity: isDark ? 0 : 1, rotate: isDark ? 90 : 0 }}
            transition={{ duration: 0.35 }}
          />

          {/* Moon base + craters */}
          <motion.g
            initial={false}
            animate={{
              opacity: isDark ? 1 : 0,
              rotate: isDark ? 0 : -45,
              scale: isDark ? 1 : 0.75,
            }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: '15px 15px' }}
          >
            <circle cx="15" cy="15" r="14" fill="url(#moon-orb-grad)" />
            <circle cx="11" cy="17.5" r="3.2" fill="#94a3b8" opacity="0.55" />
            <circle cx="17.5" cy="10" r="2.1" fill="#94a3b8" opacity="0.5" />
            <circle cx="20" cy="19.5" r="1.6" fill="#94a3b8" opacity="0.45" />
          </motion.g>
        </svg>
      </motion.span>
    </motion.button>
  );
}
