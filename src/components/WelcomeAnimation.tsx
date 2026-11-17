import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { sakoCrownLogo } from '../constants/brand';
import { getTranslation } from '../i18n/translations';
import type { Language } from '../types/chat';

interface WelcomeAnimationProps {
  lang: Language;
}

interface GreetingFrame {
  text: string;
  langName: string;
  dir?: 'rtl' | 'ltr';
}

const IPHONE_GREETINGS: GreetingFrame[] = [
  { text: 'Привет', langName: 'Русский' },
  { text: 'Сәлем', langName: 'Қазақша' },
  { text: 'Hello', langName: 'English' },
  { text: 'Merhaba', langName: 'Türkçe' },
  { text: 'Bonjour', langName: 'Français' },
  { text: 'こんにちは', langName: '日本語' },
  { text: 'مرحبا', langName: 'العربية', dir: 'rtl' },
];

const STEP_DURATION_MS = 560;
const FINALE_AUTO_CLOSE_MS = 3200;

export const WelcomeAnimation: React.FC<WelcomeAnimationProps> = ({ lang }) => {
  const [visible, setVisible] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [showFinale, setShowFinale] = useState(false);
  const t = getTranslation(lang);

  useEffect(() => {
    if (!visible) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      setShowFinale(true);
      const timer = window.setTimeout(() => setVisible(false), 1800);
      return () => window.clearTimeout(timer);
    }

    if (showFinale) {
      const closeTimer = window.setTimeout(() => {
        setVisible(false);
      }, FINALE_AUTO_CLOSE_MS);
      return () => window.clearTimeout(closeTimer);
    }

    const stepTimer = window.setTimeout(() => {
      if (stepIndex < IPHONE_GREETINGS.length - 1) {
        setStepIndex((prev) => prev + 1);
      } else {
        setShowFinale(true);
      }
    }, STEP_DURATION_MS);

    return () => window.clearTimeout(stepTimer);
  }, [visible, stepIndex, showFinale]);

  const currentGreeting = IPHONE_GREETINGS[stepIndex] || IPHONE_GREETINGS[0];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="sako-iphone-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#FAFAFB] dark:bg-[#09090B] text-zinc-950 dark:text-white px-6 overflow-hidden select-none"
          role="dialog"
          aria-modal="true"
          aria-label={t.welcomeSplashHeadline}
        >
          {/* Ambient radial glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <div className="w-[420px] h-[420px] sm:w-[560px] sm:h-[560px] rounded-full bg-indigo-500/12 dark:bg-indigo-500/18 blur-3xl" />
          </div>

          {/* Top Skip Control */}
          <div className="absolute top-5 right-5 sm:top-7 sm:right-8 z-10 pt-safe">
            <button
              type="button"
              onClick={() => setVisible(false)}
              className="min-h-[40px] px-4 py-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white/75 dark:bg-zinc-900/75 backdrop-blur-md text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:border-indigo-500/50 transition-colors"
            >
              {t.welcomeSplashSkip}
            </button>
          </div>

          {/* Center Stage */}
          <div className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center">
            {!showFinale ? (
              <div className="flex flex-col items-center space-y-6">
                {/* Signature Apple-style handwritten stroke flourish */}
                <svg
                  viewBox="0 0 220 44"
                  className="w-40 sm:w-48 h-9 text-indigo-600 dark:text-indigo-400"
                  fill="none"
                  aria-hidden="true"
                >
                  <motion.path
                    d="M12 29 C 34 8, 56 36, 78 21 C 96 9, 114 35, 136 20 C 156 7, 178 32, 208 16"
                    stroke="currentColor"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0, opacity: 0.4 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1] }}
                  />
                </svg>

                {/* Cycling World Greetings */}
                <div className="min-h-[96px] sm:min-h-[116px] flex flex-col items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentGreeting.text}
                      dir={currentGreeting.dir || 'ltr'}
                      initial={{ opacity: 0, y: 16, scale: 0.94 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -14, scale: 1.03 }}
                      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                      className="space-y-2"
                    >
                      <div className="font-display text-5xl sm:text-7xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
                        {currentGreeting.text}
                      </div>
                      <div className="text-xs font-medium tracking-wide text-zinc-400 dark:text-zinc-500">
                        {currentGreeting.langName}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Progress dots */}
                <div className="flex items-center gap-1.5 pt-2" aria-hidden="true">
                  {IPHONE_GREETINGS.map((g, idx) => (
                    <span
                      key={g.text}
                      className={`h-1.5 rounded-full transition-all duration-200 ${
                        idx === stepIndex
                          ? 'w-6 bg-indigo-600 dark:bg-indigo-400'
                          : idx < stepIndex
                            ? 'w-1.5 bg-indigo-400/50 dark:bg-indigo-500/40'
                            : 'w-1.5 bg-zinc-300 dark:bg-zinc-800'
                      }`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <motion.div
                key="sako-welcome-finale"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center space-y-5"
              >
                <motion.img
                  src={sakoCrownLogo}
                  alt="SAKO AI"
                  referrerPolicy="no-referrer"
                  initial={{ scale: 0.78, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-indigo-500/20"
                />

                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.42, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
                  className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-950 dark:text-white leading-tight"
                  style={{ textWrap: 'balance' }}
                >
                  {t.welcomeSplashHeadline}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.22 }}
                  className="text-sm text-zinc-500 dark:text-zinc-400"
                >
                  {t.domain}
                </motion.p>

                <motion.button
                  type="button"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.26 }}
                  onClick={() => setVisible(false)}
                  className="mt-2 min-h-[46px] px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-colors"
                >
                  <span>{t.welcomeSplashStart}</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
