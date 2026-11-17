import React, { useState } from 'react';
import { Check, Copy, Download, Monitor, Tablet, Smartphone, RotateCcw, Wand2 } from 'lucide-react';
import { DEFAULT_SAKO_HTML, getTranslation } from '../i18n/translations';
import type { Language } from '../types/chat';

interface HtmlStudioProps {
  lang: Language;
  htmlCode: string;
  onChangeHtml: (next: string) => void;
  onAskSakoImprove: (html: string) => void;
}

type ViewportSize = 'desktop' | 'tablet' | 'mobile';

export const HtmlStudio: React.FC<HtmlStudioProps> = ({
  lang,
  htmlCode,
  onChangeHtml,
  onAskSakoImprove,
}) => {
  const [viewport, setViewport] = useState<ViewportSize>('desktop');
  const [copied, setCopied] = useState(false);
  const [mobilePane, setMobilePane] = useState<'code' | 'preview'>('preview');
  const t = getTranslation(lang);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(htmlCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleDownload = () => {
    const blob = new Blob([htmlCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const lineCount = htmlCode.split('\n').length;

  const previewWidthClass =
    viewport === 'mobile'
      ? 'w-[375px] max-w-full'
      : viewport === 'tablet'
        ? 'w-[768px] max-w-full'
        : 'w-full';

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-transparent">
      {/* Studio Toolbar */}
      <div className="px-4 sm:px-6 py-3 border-b border-zinc-200/80 dark:border-zinc-800/90 bg-white/90 dark:bg-[#111114]/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-sm sm:text-base font-semibold text-zinc-950 dark:text-white truncate">
            {t.studioTitle}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
            {t.studioSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Mobile Code/Preview Switch */}
          <div className="flex lg:hidden items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setMobilePane('code')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                mobilePane === 'code'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              HTML
            </button>
            <button
              type="button"
              onClick={() => setMobilePane('preview')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                mobilePane === 'preview'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              {t.previewHtml}
            </button>
          </div>

          {/* Viewport Segmented Control */}
          <div className="hidden sm:flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setViewport('desktop')}
              title={t.viewportDesktop}
              className={`p-1.5 rounded-lg transition-colors ${
                viewport === 'desktop'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-200'
              }`}
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewport('tablet')}
              title={t.viewportTablet}
              className={`p-1.5 rounded-lg transition-colors ${
                viewport === 'tablet'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-200'
              }`}
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewport('mobile')}
              title={t.viewportMobile}
              className={`p-1.5 rounded-lg transition-colors ${
                viewport === 'mobile'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-200'
              }`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onChangeHtml(DEFAULT_SAKO_HTML)}
            className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.studioReset}</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? t.copiedCode : t.studioCopy}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.studioDownload}</span>
          </button>

          <button
            type="button"
            onClick={() => onAskSakoImprove(htmlCode)}
            className="inline-flex items-center gap-1.5 min-h-[38px] px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>{t.studioImprove}</span>
          </button>
        </div>
      </div>

      {/* Split Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0 overflow-hidden">
        {/* Code Editor Pane */}
        <div
          className={`${
            mobilePane === 'code' ? 'flex' : 'hidden lg:flex'
          } flex-col min-h-0 border-r border-zinc-200/80 dark:border-zinc-800 bg-[#0D0E12] text-zinc-100`}
        >
          <div className="px-4 py-2 border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <span className="font-mono">index.html</span>
            <span className="font-mono tabular-nums">{lineCount} lines</span>
          </div>
          <textarea
            value={htmlCode}
            onChange={(e) => onChangeHtml(e.target.value)}
            spellCheck={false}
            aria-label="HTML Code Editor"
            className="flex-1 w-full resize-none bg-transparent p-4 font-mono text-[13px] leading-relaxed text-zinc-100 focus:outline-none"
          />
        </div>

        {/* Live Preview Pane */}
        <div
          className={`${
            mobilePane === 'preview' ? 'flex' : 'hidden lg:flex'
          } flex-col min-h-0 bg-zinc-100/70 dark:bg-[#09090B] p-3 sm:p-5 overflow-auto items-center`}
        >
          <div
            className={`${previewWidthClass} h-full min-h-[420px] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white overflow-hidden shadow-md transition-all duration-200`}
          >
            <iframe
              title="sako-ai.ai.studio Live HTML Preview"
              srcDoc={htmlCode}
              sandbox="allow-scripts"
              className="w-full h-full border-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
