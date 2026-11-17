import React, { useState } from 'react';
import { Check, Copy, Download, Eye, EyeOff, Code2 } from 'lucide-react';
import { getTranslation } from '../i18n/translations';
import type { Language } from '../types/chat';

interface MarkdownRendererProps {
  content: string;
  lang: Language;
  onOpenHtmlInStudio?: (html: string) => void;
}

type Segment =
  | { type: 'text'; value: string }
  | { type: 'code'; language: string; value: string };

function splitCodeFences(markdown: string): Segment[] {
  const segments: Segment[] = [];
  const fenceRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = fenceRegex.exec(markdown)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        value: markdown.slice(lastIndex, match.index),
      });
    }
    segments.push({
      type: 'code',
      language: (match[1] || 'text').toLowerCase(),
      value: match[2].replace(/\n$/, ''),
    });
    lastIndex = fenceRegex.lastIndex;
  }

  if (lastIndex < markdown.length) {
    segments.push({
      type: 'text',
      value: markdown.slice(lastIndex),
    });
  }

  return segments;
}

function renderInlineFormatting(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\(https?:\/\/[^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('`') && token.endsWith('`')) {
      nodes.push(
        <code
          key={key++}
          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-[0.875em] font-mono"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      nodes.push(
        <strong key={key++} className="font-semibold text-slate-900 dark:text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      nodes.push(
        <em key={key++} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith('[')) {
      const linkMatch = /^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/.exec(token);
      if (linkMatch) {
        nodes.push(
          <a
            key={key++}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 dark:text-indigo-400 underline underline-offset-2 hover:text-indigo-700 dark:hover:text-indigo-300"
          >
            {linkMatch[1]}
          </a>
        );
      } else {
        nodes.push(token);
      }
    }
    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function renderProseBlock(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: { ordered: boolean; items: string[] } | null = null;
  let key = 0;

  const flushList = () => {
    if (!listItems) return;
    if (listItems.ordered) {
      elements.push(
        <ol key={key++} className="list-decimal pl-5 my-2.5 space-y-1.5">
          {listItems.items.map((item, i) => (
            <li key={i} className="leading-relaxed">
              {renderInlineFormatting(item)}
            </li>
          ))}
        </ol>
      );
    } else {
      elements.push(
        <ul key={key++} className="list-disc pl-5 my-2.5 space-y-1.5">
          {listItems.items.map((item, i) => (
            <li key={i} className="leading-relaxed">
              {renderInlineFormatting(item)}
            </li>
          ))}
        </ul>
      );
    }
    listItems = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    const headingMatch = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const content = renderInlineFormatting(headingMatch[2]);
      if (level === 1) {
        elements.push(
          <h2 key={key++} className="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2">
            {content}
          </h2>
        );
      } else if (level === 2) {
        elements.push(
          <h3 key={key++} className="text-base font-semibold text-slate-900 dark:text-white mt-3.5 mb-1.5">
            {content}
          </h3>
        );
      } else {
        elements.push(
          <h4 key={key++} className="text-sm font-semibold text-slate-900 dark:text-white mt-3 mb-1">
            {content}
          </h4>
        );
      }
      continue;
    }

    const ulMatch = /^[-*•]\s+(.+)$/.exec(trimmed);
    if (ulMatch) {
      if (!listItems || listItems.ordered) {
        flushList();
        listItems = { ordered: false, items: [] };
      }
      listItems.items.push(ulMatch[1]);
      continue;
    }

    const olMatch = /^\d+\.\s+(.+)$/.exec(trimmed);
    if (olMatch) {
      if (!listItems || !listItems.ordered) {
        flushList();
        listItems = { ordered: true, items: [] };
      }
      listItems.items.push(olMatch[1]);
      continue;
    }

    if (trimmed.startsWith('>')) {
      flushList();
      elements.push(
        <blockquote
          key={key++}
          className="my-2.5 px-4 py-2 rounded-xl bg-zinc-100/80 dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 italic"
        >
          {renderInlineFormatting(trimmed.replace(/^>\s?/, ''))}
        </blockquote>
      );
      continue;
    }

    flushList();
    elements.push(
      <p key={key++} className="my-2 leading-[1.65] text-slate-800 dark:text-slate-200">
        {renderInlineFormatting(trimmed)}
      </p>
    );
  }

  flushList();
  return <>{elements}</>;
}

const CodeBlockCard: React.FC<{
  language: string;
  code: string;
  lang: Language;
  onOpenHtmlInStudio?: (html: string) => void;
}> = ({ language, code, lang, onOpenHtmlInStudio }) => {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const t = getTranslation(lang);

  const isHtml =
    language === 'html' ||
    language === 'htm' ||
    code.trimStart().toLowerCase().startsWith('<!doctype html') ||
    code.trimStart().toLowerCase().startsWith('<html');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore clipboard restrictions
    }
  };

  const handleDownload = () => {
    const extMap: Record<string, string> = {
      html: 'html',
      htm: 'html',
      javascript: 'js',
      js: 'js',
      typescript: 'ts',
      ts: 'ts',
      tsx: 'tsx',
      jsx: 'jsx',
      css: 'css',
      python: 'py',
      py: 'py',
      json: 'json',
      sql: 'sql',
      bash: 'sh',
      sh: 'sh',
    };
    const ext = extMap[language] || 'txt';
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = isHtml ? 'sakoai-page.html' : `sakoai-snippet.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="my-3.5 rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-[#0D0E12] text-zinc-100 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 border-b border-zinc-800 bg-[#14151B] text-xs">
        <span className="font-mono text-zinc-400">{language || 'code'}</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {isHtml && (
            <>
              <button
                type="button"
                onClick={() => setShowPreview((v) => !v)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors whitespace-nowrap shrink-0"
              >
                {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPreview ? t.hidePreview : t.previewHtml}</span>
              </button>
              {onOpenHtmlInStudio && (
                <button
                  type="button"
                  onClick={() => onOpenHtmlInStudio(code)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-slate-300 hover:bg-slate-800 hover:text-white transition-colors whitespace-nowrap shrink-0"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>{t.openInStudio}</span>
                </button>
              )}
            </>
          )}
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-slate-300 hover:bg-slate-800 hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.downloadFile}</span>
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-slate-300 hover:bg-slate-800 hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? t.copiedCode : t.copyCode}</span>
          </button>
        </div>
      </div>

      {showPreview && isHtml ? (
        <div className="bg-white">
          <iframe
            title="HTML Live Preview"
            srcDoc={code}
            sandbox="allow-scripts"
            className="w-full h-[380px] border-0"
          />
        </div>
      ) : (
        <pre className="p-3.5 overflow-x-auto text-[13px] leading-relaxed font-mono text-slate-100">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  lang,
  onOpenHtmlInStudio,
}) => {
  const segments = splitCodeFences(content);

  return (
    <div className="text-[15px] break-words">
      {segments.map((seg, index) =>
        seg.type === 'code' ? (
          <CodeBlockCard
            key={index}
            language={seg.language}
            code={seg.value}
            lang={lang}
            onOpenHtmlInStudio={onOpenHtmlInStudio}
          />
        ) : (
          <React.Fragment key={index}>{renderProseBlock(seg.value)}</React.Fragment>
        )
      )}
    </div>
  );
};
