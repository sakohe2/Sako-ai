import React, { useMemo, useState } from 'react';
import { Check, Cpu, Globe, Loader2, Mic, Moon, Search, Sun, X } from 'lucide-react';
import { WORLD_LANGUAGES, getWorldLanguage } from '../i18n/languages';
import { getTranslation } from '../i18n/translations';
import type { Language, LiveVoiceName, ModelPresetId } from '../types/chat';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  translatingLang: string | null;
  onSelectLanguage: (code: string) => void;
  theme: 'light' | 'dark';
  onChangeTheme: (next: 'light' | 'dark') => void;
  modelPreset: ModelPresetId;
  onChangeModelPreset: (next: ModelPresetId) => void;
  liveVoice: LiveVoiceName;
  onChangeLiveVoice: (next: LiveVoiceName) => void;
}

const MODEL_PRESET_ORDER: ModelPresetId[] = [
  'flash-lite',
  'hydrogen-fast',
  'hydrogen-balanced',
  'hydrogen-deep',
  'hydrogen-xhigh',
];

const VOICE_ORDER: LiveVoiceName[] = ['Zephyr', 'Puck', 'Kore', 'Fenrir', 'Charon'];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  lang,
  translatingLang,
  onSelectLanguage,
  theme,
  onChangeTheme,
  modelPreset,
  onChangeModelPreset,
  liveVoice,
  onChangeLiveVoice,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const t = getTranslation(lang);
  const currentLangInfo = getWorldLanguage(lang);

  const filteredLanguages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return WORLD_LANGUAGES;
    return WORLD_LANGUAGES.filter(
      (item) =>
        item.nativeName.toLowerCase().includes(q) ||
        item.ruName.toLowerCase().includes(q) ||
        item.enName.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const trimmedQuery = searchQuery.trim();
  const hasExactWorldMatch = useMemo(() => {
    if (!trimmedQuery) return true;
    const q = trimmedQuery.toLowerCase();
    return WORLD_LANGUAGES.some(
      (item) =>
        item.code.toLowerCase() === q ||
        item.nativeName.toLowerCase() === q ||
        item.ruName.toLowerCase() === q ||
        item.enName.toLowerCase() === q
    );
  }, [trimmedQuery]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full h-[92dvh] sm:h-auto sm:max-h-[88dvh] sm:max-w-2xl rounded-t-3xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <h2
              id="settings-modal-title"
              className="font-display text-base sm:text-lg font-bold text-zinc-950 dark:text-white truncate"
            >
              {t.settingsTitle}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
              {t.settingsSubtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-6">
          {/* Language Selection (All World Languages) */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">
                  {t.settingsLanguageLabel}
                </h3>
              </div>
              <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                {currentLangInfo.nativeName}
              </span>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {t.settingsLanguageHint}
            </p>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.settingsLanguageSearch}
                aria-label={t.settingsLanguageSearch}
                className="w-full min-h-[44px] pl-9 pr-9 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-950 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label={t.clearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {translatingLang && (
              <div className="flex items-center gap-2 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/80 dark:bg-indigo-950/40 px-3.5 py-2.5 text-xs text-indigo-900 dark:text-indigo-200">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>
                  {t.settingsTranslating} ({getWorldLanguage(translatingLang).nativeName})
                </span>
              </div>
            )}

            {/* Languages Grid */}
            <div className="max-h-[260px] overflow-y-auto pr-1 space-y-2">
              {filteredLanguages.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredLanguages.map((item) => {
                    const isSelected = lang === item.code;
                    const isTranslatingThis = translatingLang === item.code;
                    return (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => onSelectLanguage(item.code)}
                        className={`min-h-[48px] px-3.5 py-2.5 rounded-xl border text-left transition-colors flex items-center justify-between gap-2.5 ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40'
                            : 'border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-700'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-semibold text-zinc-950 dark:text-white truncate">
                            {item.nativeName}
                          </div>
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                            {item.ruName} · {item.enName}
                          </div>
                        </div>
                        <div className="shrink-0">
                          {isTranslatingThis ? (
                            <Loader2 className="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400" />
                          ) : isSelected ? (
                            <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4 text-xs text-zinc-500 dark:text-zinc-400 text-center">
                  {t.settingsNoLanguageMatch}
                </div>
              )}

              {/* Custom Any-Language Apply Option */}
              {trimmedQuery.length >= 2 && !hasExactWorldMatch && (
                <button
                  type="button"
                  onClick={() => onSelectLanguage(trimmedQuery)}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-dashed border-indigo-400/80 dark:border-indigo-500/40 bg-indigo-50/70 dark:bg-indigo-950/35 text-xs font-semibold text-indigo-900 dark:text-indigo-100 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/50 transition-colors flex items-center justify-between gap-2"
                >
                  <span className="truncate">
                    {t.settingsCustomLanguageApply}: «{trimmedQuery}»
                  </span>
                  <Globe className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                </button>
              )}
            </div>
          </section>

          {/* Theme */}
          <section className="space-y-2.5 pt-3 border-t border-zinc-200/80 dark:border-zinc-800">
            <h3 className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
              {t.settingsThemeLabel}
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onChangeTheme('light')}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                  theme === 'light'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-zinc-950 dark:text-white'
                    : 'border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{t.themeLight}</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeTheme('dark')}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                  theme === 'dark'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-zinc-950 dark:text-white'
                    : 'border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <Moon className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>{t.themeDark}</span>
              </button>
            </div>
          </section>

          {/* Default Free Model */}
          <section className="space-y-2.5 pt-3 border-t border-zinc-200/80 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <h3 className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                {t.settingsModelLabel}
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MODEL_PRESET_ORDER.map((presetId) => {
                const info = t.modelPresets[presetId];
                const selected = modelPreset === presetId;
                return (
                  <button
                    key={presetId}
                    type="button"
                    onClick={() => onChangeModelPreset(presetId)}
                    className={`min-h-[44px] p-3 rounded-xl border text-left transition-colors flex items-center justify-between gap-2 ${
                      selected
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40'
                        : 'border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-zinc-950 dark:text-white truncate">
                        {info.name}
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                        {info.speed}
                      </div>
                    </div>
                    {selected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Default Live Voice */}
          <section className="space-y-2.5 pt-3 border-t border-zinc-200/80 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <h3 className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                {t.settingsVoiceLabel}
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {VOICE_ORDER.map((voiceName) => {
                const info = t.liveVoices[voiceName];
                const selected = liveVoice === voiceName;
                return (
                  <button
                    key={voiceName}
                    type="button"
                    onClick={() => onChangeLiveVoice(voiceName)}
                    className={`min-h-[44px] p-3 rounded-xl border text-left transition-colors flex items-center justify-between gap-2 ${
                      selected
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40'
                        : 'border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-zinc-950 dark:text-white truncate">
                        {info.name} · {info.vibe}
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                        {info.desc}
                      </div>
                    </div>
                    {selected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3.5 pb-safe border-t border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/80 dark:bg-[#0D0D10] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="w-full sm:w-auto">
            <PWAInstallButton lang={lang} variant="hero" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto min-h-[44px] px-6 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-sm font-semibold transition-colors"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
