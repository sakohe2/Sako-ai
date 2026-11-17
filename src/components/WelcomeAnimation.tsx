import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { getTranslation } from '../i18n/translations';
import type { Language } from '../types/chat';

interface WelcomeAnimationProps {
  lang: Language;
}

export const WelcomeAnimation: React.FC<WelcomeAnimationProps> = ({ lang }) => {
  const [visible, setVisible] = useState(true);
  const t = getTranslation(lang);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(false);
    }, 10000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      className="fixed inset-x-0 top-16 z-50 flex justify-center px-4 pointer-events-none"
      aria-live="polite"
    >
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: -14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => setVisible(false)}
            role="status"
            className="pointer-events-auto cursor-pointer relative overflow-hidden flex items-center gap-3.5 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white/95 dark:bg-[#111114]/95 backdrop-blur-xl px-4 py-3 shadow-xl shadow-black/10 max-w-md"
          >
            <motion.img
              src="/icon.svg"
              alt="SAKO AI"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35, delay: 0.04, ease: [0.16, 1, 0.3, 1] }}
              className="w-9 h-9 rounded-xl shrink-0 border border-zinc-200 dark:border-zinc-800"
            />
            <div className="min-w-0">
              <div className="font-display text-sm font-semibold text-zinc-950 dark:text-white leading-snug">
                {t.welcomeBannerTitle}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                {t.welcomeBannerSubtitle}
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setVisible(false);
              }}
              aria-label={t.close}
              className="ml-1 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-[2px] bg-indigo-600 dark:bg-indigo-400 animate-sako-sweep"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
