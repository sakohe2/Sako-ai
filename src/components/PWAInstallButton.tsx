import React, { useState } from 'react';
import { Check, Download, ExternalLink, Package, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { sakoCrownLogo } from '../constants/brand';
import { getTranslation } from '../i18n/translations';
import type { Language } from '../types/chat';

interface PWAInstallButtonProps {
  lang: Language;
  variant?: 'sidebar' | 'primary' | 'hero';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  lang,
  variant = 'sidebar',
}) => {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isInIframe,
    install,
    pwaBuilderUrl,
  } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const t = getTranslation(lang);

  if (isInstalled) {
    if (variant === 'primary') {
      return (
        <span className="inline-flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          <Check className="w-4 h-4 shrink-0" />
          {t.installedLabel}
        </span>
      );
    }
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome === 'accepted') {
        return;
      }
      if (outcome === 'dismissed') {
        return;
      }
    }
    setShowGuide(true);
  };

  const buttonClasses =
    variant === 'primary'
      ? 'inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 active:scale-[0.99] transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500'
      : variant === 'hero'
        ? 'inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] text-zinc-900 dark:text-zinc-100 text-sm font-medium hover:border-indigo-500/60 hover:bg-zinc-50 dark:hover:bg-zinc-900 active:scale-[0.99] transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500'
        : 'w-full flex items-center justify-center gap-2 min-h-[44px] px-3 py-2 rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-[#16161A] text-zinc-900 dark:text-zinc-100 text-xs font-semibold hover:border-indigo-500/60 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500';

  const currentHref =
    typeof window !== 'undefined' ? window.location.href : 'https://sako-ai.ai.studio/';

  return (
    <>
      <button type="button" onClick={() => void handleClick()} className={buttonClasses}>
        {isIOS ? (
          <Smartphone className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
        ) : (
          <Download className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
        )}
        <span>{isIOS ? t.installIos : t.installApp}</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-guide-title"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111114] p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={sakoCrownLogo}
                  alt="SAKO AI"
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 rounded-xl object-cover shrink-0 border border-zinc-200 dark:border-zinc-800"
                />
                <h3
                  id="pwa-guide-title"
                  className="text-base font-semibold text-zinc-900 dark:text-zinc-50 truncate"
                >
                  {t.installGuideTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label={t.close}
                className="min-h-[40px] min-w-[40px] -mt-1 -mr-2 flex items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isInIframe && (
              <div className="rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/70 dark:bg-indigo-950/35 p-3.5 space-y-3">
                <p className="text-xs text-zinc-700 dark:text-zinc-200 leading-relaxed">
                  {t.installIframeHint}
                </p>
                <a
                  href={currentHref}
                  target="_top"
                  rel="noopener noreferrer"
                  className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 shrink-0" />
                  <span>{t.installOpenFullWindow}</span>
                </a>
              </div>
            )}

            <ol className="space-y-2.5 text-sm text-zinc-600 dark:text-zinc-300 list-decimal pl-5">
              {(isIOS ? t.installIosSteps : t.installDesktopSteps).map((step, idx) => (
                <li key={idx} className="leading-relaxed">
                  {step}
                </li>
              ))}
            </ol>

            <div className="pt-2 space-y-2">
              {!isIOS && (
                <a
                  href={pwaBuilderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[44px] px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm font-medium hover:border-indigo-500/50 transition-colors flex items-center justify-center gap-2"
                >
                  <Package className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>{t.installDownloadLauncher}</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="w-full min-h-[44px] rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
