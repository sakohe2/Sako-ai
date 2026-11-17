import React from 'react';
import { getTranslation } from '../i18n/translations';
import type { Language } from '../types/chat';
import { PWAInstallButton } from './PWAInstallButton';

interface AboutSakoViewProps {
  lang: Language;
  onStartChat: () => void;
  onOpenStudio: () => void;
}

export const AboutSakoView: React.FC<AboutSakoViewProps> = ({
  lang,
  onStartChat,
  onOpenStudio,
}) => {
  const t = getTranslation(lang);

  return (
    <div className="flex-1 overflow-y-auto bg-transparent">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10 sm:py-14 space-y-10">
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <span>{t.brand}</span>
            <span aria-hidden="true">·</span>
            <span>{t.domain}</span>
            <span aria-hidden="true">·</span>
            <span>PWA</span>
            <span aria-hidden="true">·</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{t.creatorLabel}</span>
          </div>
          <h1
            className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950 dark:text-white max-w-2xl"
            style={{ textWrap: 'balance' }}
          >
            {t.aboutTitle}
          </h1>
          <p className="text-base text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-2xl">
            {t.aboutLead}
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onStartChat}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              {t.chatTab}
            </button>
            <button
              type="button"
              onClick={onOpenStudio}
              className="min-h-[44px] px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-zinc-900 dark:text-zinc-100 text-sm font-medium hover:border-indigo-500/60 transition-colors whitespace-nowrap shrink-0"
            >
              {t.studioTab}
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {t.principles.map((item, idx) => (
            <article
              key={idx}
              className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] p-6 space-y-2"
            >
              <h2 className="font-display text-base font-semibold text-zinc-950 dark:text-white">
                <span className="tabular-nums text-indigo-600 dark:text-indigo-400 mr-2">
                  0{idx + 1}.
                </span>
                {item.title}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                {item.desc}
              </p>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <h2 className="font-display text-lg font-semibold text-zinc-950 dark:text-white">
              {t.aboutInstallHeading}
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
              {t.aboutInstallDesc}
            </p>
          </div>
          <div className="shrink-0">
            <PWAInstallButton lang={lang} variant="primary" />
          </div>
        </section>
      </div>
    </div>
  );
};
