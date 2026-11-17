import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUp,
  Check,
  Code2,
  Cpu,
  Download,
  Flame,
  Gamepad2,
  Globe,
  GraduationCap,
  Menu,
  MessageSquare,
  Mic,
  Moon,
  Paperclip,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Square,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import { AboutSakoView } from './components/AboutSakoView';
import { HtmlStudio } from './components/HtmlStudio';
import { LiveVoiceModal } from './components/LiveVoiceModal';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';
import { SettingsModal } from './components/SettingsModal';
import { WelcomeAnimation } from './components/WelcomeAnimation';
import { sakoCrownLogo } from './constants/brand';
import { getWorldLanguage } from './i18n/languages';
import {
  DEFAULT_SAKO_HTML,
  getTranslation,
  hasTranslationBundle,
  saveTranslatedBundle,
  TRANSLATIONS,
  type TranslationBundle,
} from './i18n/translations';
import type {
  AppView,
  AssistantMode,
  Attachment,
  ChatMessage,
  ChatSession,
  Language,
  LiveVoiceName,
  ModelPresetId,
  PersonaTone,
} from './types/chat';

const STORAGE_SESSIONS_KEY = 'sakoai_sessions_v1';
const STORAGE_LANG_KEY = 'sakoai_lang_v1';
const STORAGE_THEME_KEY = 'sakoai_theme_v1';
const STORAGE_STUDIO_HTML_KEY = 'sakoai_studio_html_v1';
const STORAGE_MODEL_KEY = 'sakoai_model_preset_v1';
const STORAGE_VOICE_KEY = 'sakoai_live_voice_v1';

const LIVE_VOICE_ORDER: LiveVoiceName[] = ['Zephyr', 'Puck', 'Kore', 'Fenrir', 'Charon'];

const MODEL_PRESET_ORDER: ModelPresetId[] = [
  'flash-lite',
  'hydrogen-fast',
  'hydrogen-balanced',
  'hydrogen-deep',
  'hydrogen-xhigh',
];

function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createEmptySession(mode: AssistantMode = 'general', lang: Language = 'ru'): ChatSession {
  return {
    id: createId(),
    title: getTranslation(lang).newChat,
    mode,
    updatedAt: Date.now(),
    messages: [],
  };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildExportedChatHtml(session: ChatSession): string {
  const rows = session.messages
    .map((m) => {
      const author = m.role === 'user' ? 'Вы' : 'SAKO AI';
      const cls = m.role === 'user' ? 'user' : 'assistant';
      return `<article class="msg ${cls}"><header>${author}</header><pre>${escapeHtml(m.text)}</pre></article>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(session.title)} — SAKO AI (sako-ai.ai.studio)</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 820px; margin: 40px auto; padding: 0 20px; background: #f8fafc; color: #0f172a; line-height: 1.6; }
    h1 { font-size: 1.5rem; margin-bottom: 6px; }
    .meta { color: #64748b; font-size: 0.875rem; margin-bottom: 28px; }
    .msg { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; margin-bottom: 16px; background: #fff; }
    .msg.user { background: #eff6ff; border-color: #bfdbfe; }
    .msg header { font-weight: 600; font-size: 0.85rem; margin-bottom: 8px; color: #334155; }
    pre { white-space: pre-wrap; font-family: inherit; margin: 0; }
  </style>
</head>
<body>
  <h1>${escapeHtml(session.title)}</h1>
  <div class="meta">SAKO AI · sako-ai.ai.studio · ${new Date(session.updatedAt).toLocaleString()}</div>
  ${rows}
</body>
</html>`;
}

export default function App() {
  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LANG_KEY);
      if (saved && saved.trim().length > 0) return saved.trim();
      return 'ru';
    } catch {
      return 'ru';
    }
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_THEME_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'dark';
    }
  });

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_SESSIONS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          const valid: ChatSession[] = parsed
            .filter(
              (s): s is Record<string, unknown> =>
                Boolean(s) && typeof s === 'object' && typeof (s as Record<string, unknown>).id === 'string'
            )
            .map((s) => ({
              id: String(s.id),
              title: typeof s.title === 'string' && s.title.trim() ? s.title : 'Новый чат',
              mode:
                s.mode === 'html' || s.mode === 'games' || s.mode === 'learning'
                  ? s.mode
                  : 'general',
              persona: s.persona === 'angry' ? 'angry' : 'normal',
              updatedAt: typeof s.updatedAt === 'number' ? s.updatedAt : Date.now(),
              messages: Array.isArray(s.messages)
                ? s.messages.filter(
                    (m): m is ChatMessage =>
                      Boolean(m) &&
                      typeof m === 'object' &&
                      typeof (m as ChatMessage).id === 'string' &&
                      typeof (m as ChatMessage).text === 'string' &&
                      ((m as ChatMessage).role === 'user' || (m as ChatMessage).role === 'model')
                  )
                : [],
            }));
          if (valid.length > 0) return valid;
        }
      }
    } catch {
      // fallback to fresh session
    }
    return [createEmptySession('general', 'ru')];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => sessions[0]?.id ?? '');
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<AppView>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showModelsModal, setShowModelsModal] = useState(false);
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [translatingLang, setTranslatingLang] = useState<string | null>(null);
  const [translationVersion, setTranslationVersion] = useState(0);
  const [liveVoice, setLiveVoice] = useState<LiveVoiceName>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_VOICE_KEY) as LiveVoiceName | null;
      if (saved && LIVE_VOICE_ORDER.includes(saved)) return saved;
    } catch {
      // ignore
    }
    return 'Zephyr';
  });
  const [modelPreset, setModelPreset] = useState<ModelPresetId>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_MODEL_KEY) as ModelPresetId | null;
      if (saved && MODEL_PRESET_ORDER.includes(saved)) return saved;
    } catch {
      // ignore
    }
    return 'flash-lite';
  });
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachmentNotice, setAttachmentNotice] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [studioHtml, setStudioHtml] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_STUDIO_HTML_KEY) || DEFAULT_SAKO_HTML;
    } catch {
      return DEFAULT_SAKO_HTML;
    }
  });

  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const currentLangInfo = getWorldLanguage(lang);
  const t = useMemo(() => getTranslation(lang), [lang, translationVersion]);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) || sessions[0],
    [sessions, activeSessionId]
  );

  const filteredSessions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((s) => s.title.toLowerCase().includes(q));
  }, [sessions, searchQuery]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(STORAGE_THEME_KEY, theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = getWorldLanguage(lang).rtl ? 'rtl' : 'ltr';
    try {
      localStorage.setItem(STORAGE_LANG_KEY, lang);
    } catch {
      // ignore
    }
  }, [lang]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(sessions));
    } catch {
      // ignore
    }
  }, [sessions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_STUDIO_HTML_KEY, studioHtml);
    } catch {
      // ignore
    }
  }, [studioHtml]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_MODEL_KEY, modelPreset);
    } catch {
      // ignore
    }
  }, [modelPreset]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_VOICE_KEY, liveVoice);
    } catch {
      // ignore
    }
  }, [liveVoice]);

  const handleSelectLanguage = async (targetCode: string) => {
    const normalized = targetCode.trim();
    if (!normalized) return;
    setLang(normalized);

    if (hasTranslationBundle(normalized)) {
      return;
    }

    const info = getWorldLanguage(normalized);
    setTranslatingLang(normalized);
    try {
      const resp = await fetch('/api/translate-ui', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetCode: normalized,
          targetName: `${info.nativeName} (${info.enName})`,
          baseBundle: TRANSLATIONS.en,
        }),
      });
      if (resp.ok) {
        const data = (await resp.json()) as { bundle?: Partial<TranslationBundle> };
        if (data.bundle && typeof data.bundle === 'object') {
          saveTranslatedBundle(normalized, data.bundle);
          setTranslationVersion((v) => v + 1);
        }
      }
    } catch {
      // Keep English fallback gracefully if offline or translation fails
    } finally {
      setTranslatingLang((curr) => (curr === normalized ? null : curr));
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages.length, isStreaming]);

  const handleNewChat = (mode: AssistantMode = activeSession?.mode || 'general') => {
    if (isStreaming) {
      abortRef.current?.abort();
      setIsStreaming(false);
    }
    const fresh = createEmptySession(mode, lang);
    setSessions((prev) => [fresh, ...prev]);
    setActiveSessionId(fresh.id);
    setView('chat');
    setSidebarOpen(false);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleSelectMode = (mode: AssistantMode) => {
    if (!activeSession) return;
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSession.id ? { ...s, mode, updatedAt: Date.now() } : s))
    );
    setView('chat');
    setSidebarOpen(false);
  };

  const handleSetPersona = (persona: PersonaTone) => {
    if (!activeSession) return;
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSession.id ? { ...s, persona, updatedAt: Date.now() } : s))
    );
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (filtered.length === 0) {
        const fresh = createEmptySession('general', lang);
        setActiveSessionId(fresh.id);
        return [fresh];
      }
      if (activeSessionId === id) {
        setActiveSessionId(filtered[0].id);
      }
      return filtered;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    setAttachmentNotice(null);

    for (const file of files) {
      if (file.size > 4 * 1024 * 1024) {
        setAttachmentNotice(t.fileTooLarge);
        continue;
      }

      const isImage = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type);
      const isText =
        file.type.startsWith('text/') ||
        /\.(html?|css|js|ts|tsx|jsx|json|py|md|txt|sql)$/i.test(file.name);

      if (isImage) {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = String(reader.result || '');
            resolve(result.split(',')[1] || '');
          };
          reader.readAsDataURL(file);
        });

        setAttachments((prev) => [
          ...prev,
          {
            id: createId(),
            name: file.name,
            mimeType: file.type,
            data: base64,
            previewUrl: URL.createObjectURL(file),
          },
        ]);
      } else if (isText) {
        const textContent = await file.text();
        setInput((prev) => {
          const ext = file.name.split('.').pop() || 'txt';
          const snippet = `\n\n\`\`\`${ext}\n// ${file.name}\n${textContent}\n\`\`\``;
          return prev ? `${prev}${snippet}` : snippet.trimStart();
        });
      } else {
        setAttachmentNotice(t.unsupportedFile);
      }
    }
  };

  const handleSend = async (overridePrompt?: string, overrideMode?: AssistantMode) => {
    if (!activeSession || isStreaming) return;
    const rawText = (overridePrompt !== undefined ? overridePrompt : input).trim();
    if (!rawText && attachments.length === 0) return;

    let textToSend = rawText;
    let targetPersona: PersonaTone = activeSession.persona === 'angry' ? 'angry' : 'normal';

    const normalCmdMatch = rawText.match(/^\/(?:normal|calm|kind|angry\s+off)(?:\s+([\s\S]*))?$/i);
    const angryCmdMatch = rawText.match(/^\/angry(?:\s+([\s\S]*))?$/i);

    if (normalCmdMatch) {
      targetPersona = 'normal';
      const trailing = (normalCmdMatch[1] || '').trim();
      if (!trailing && attachments.length === 0) {
        const userCmdMsg: ChatMessage = {
          id: createId(),
          role: 'user',
          text: rawText,
          createdAt: Date.now(),
        };
        const confirmMsg: ChatMessage = {
          id: createId(),
          role: 'model',
          text: t.normalModeRestored,
          createdAt: Date.now(),
        };
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSession.id
              ? {
                  ...s,
                  persona: 'normal',
                  updatedAt: Date.now(),
                  messages: [...s.messages, userCmdMsg, confirmMsg],
                }
              : s
          )
        );
        if (overridePrompt === undefined) {
          setInput('');
          if (textareaRef.current) textareaRef.current.style.height = 'auto';
        }
        return;
      }
      textToSend = trailing;
    } else if (angryCmdMatch) {
      targetPersona = 'angry';
    }

    const targetMode = overrideMode || activeSession.mode;
    const userMsg: ChatMessage = {
      id: createId(),
      role: 'user',
      text: textToSend,
      createdAt: Date.now(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    };

    const assistantMsgId = createId();
    const assistantPlaceholder: ChatMessage = {
      id: assistantMsgId,
      role: 'model',
      text: '',
      createdAt: Date.now(),
    };

    const isFirstMessage = activeSession.messages.length === 0;
    const nextTitle = isFirstMessage
      ? (textToSend || attachments[0]?.name || t.newChat).slice(0, 42)
      : activeSession.title;

    const updatedHistory = [...activeSession.messages, userMsg];

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSession.id
          ? {
              ...s,
              title: nextTitle,
              mode: targetMode,
              persona: targetPersona,
              updatedAt: Date.now(),
              messages: [...updatedHistory, assistantPlaceholder],
            }
          : s
      )
    );

    if (overridePrompt === undefined) {
      setInput('');
      setAttachments([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
    setAttachmentNotice(null);
    setView('chat');
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          mode: targetMode,
          persona: targetPersona,
          uiLang: lang,
          languageName: `${currentLangInfo.nativeName} (${currentLangInfo.enName})`,
          modelPreset,
          messages: updatedHistory.map((m) => ({
            role: m.role,
            text: m.text,
            attachments: m.attachments?.map((a) => ({
              mimeType: a.mimeType,
              data: a.data,
              name: a.name,
            })),
          })),
        }),
      });

      if (!response.ok || !response.body) {
        let errorMsg = `HTTP ${response.status}`;
        try {
          const errJson = (await response.json()) as { error?: string };
          if (errJson.error) errorMsg = errJson.error;
        } catch {
          // keep status
        }
        throw new Error(errorMsg);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const evt of events) {
          for (const rawLine of evt.split('\n')) {
            const line = rawLine.trim();
            if (!line.startsWith('data:')) continue;
            const jsonStr = line.slice(5).trim();
            if (!jsonStr) continue;
            try {
              const parsed = JSON.parse(jsonStr) as {
                type: 'chunk' | 'done' | 'error';
                text?: string;
                error?: string;
              };
              if (parsed.type === 'chunk' && parsed.text) {
                accumulated += parsed.text;
                setSessions((prev) =>
                  prev.map((s) =>
                    s.id === activeSession.id
                      ? {
                          ...s,
                          messages: s.messages.map((m) =>
                            m.id === assistantMsgId ? { ...m, text: accumulated } : m
                          ),
                        }
                      : s
                  )
                );
              } else if (parsed.type === 'error') {
                throw new Error(parsed.error || 'Unknown streaming error');
              }
            } catch (parseErr) {
              if (
                parseErr instanceof Error &&
                parseErr.message !== 'Unexpected end of JSON input'
              ) {
                throw parseErr;
              }
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setIsStreaming(false);
        return;
      }
      const message = err instanceof Error ? err.message : String(err);
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession.id
            ? {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, text: m.text ? `${m.text}\n\n${message}` : message, error: true }
                    : m
                ),
              }
            : s
        )
      );
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const handleStopStreaming = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
  };

  const handleRegenerateLast = () => {
    if (!activeSession || isStreaming || activeSession.messages.length < 2) return;
    const msgs = [...activeSession.messages];
    const last = msgs[msgs.length - 1];
    if (last.role !== 'model') return;
    const lastUser = msgs[msgs.length - 2];
    if (!lastUser || lastUser.role !== 'user') return;

    const trimmed = msgs.slice(0, -2);
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSession.id ? { ...s, messages: trimmed } : s))
    );
    setTimeout(() => {
      void handleSend(lastUser.text, activeSession.mode);
    }, 0);
  };

  const handleExportChatHtml = () => {
    if (!activeSession) return;
    const html = buildExportedChatHtml(activeSession);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sakoai-chat-${activeSession.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenHtmlInStudio = (html: string) => {
    setStudioHtml(html);
    setView('studio');
  };

  const handleAskSakoImproveHtml = (html: string) => {
    const prompt = `${t.studioImprovePrompt}${html}\n\`\`\``;
    setView('chat');
    void handleSend(prompt, 'html');
  };

  const handleSaveLiveTranscript = (transcriptText: string) => {
    if (!activeSession || !transcriptText.trim()) return;
    const savedMsg: ChatMessage = {
      id: createId(),
      role: 'model',
      text: transcriptText,
      createdAt: Date.now(),
    };
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSession.id
          ? {
              ...s,
              title:
                s.messages.length === 0
                  ? t.liveVoiceButton
                  : s.title,
              updatedAt: Date.now(),
              messages: [...s.messages, savedMsg],
            }
          : s
      )
    );
    setView('chat');
  };

  const modeIcons: Record<AssistantMode, React.ReactNode> = {
    general: <MessageSquare className="w-4 h-4 shrink-0" />,
    html: <Code2 className="w-4 h-4 shrink-0" />,
    games: <Gamepad2 className="w-4 h-4 shrink-0" />,
    learning: <GraduationCap className="w-4 h-4 shrink-0" />,
  };

  const hasMessages = (activeSession?.messages.length || 0) > 0;

  return (
    <div className="h-dvh w-full flex overflow-hidden bg-[#FAFAFB] dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/55 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[272px] flex flex-col border-r border-zinc-200/80 dark:border-zinc-800/90 bg-[#F4F4F6] dark:bg-[#111114] transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-4 py-3.5 border-b border-zinc-200/80 dark:border-zinc-800/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={sakoCrownLogo}
              alt="SAKO AI"
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-lg object-cover shrink-0 border border-zinc-200 dark:border-zinc-700"
            />
            <div className="min-w-0">
              <div className="font-display text-sm font-bold tracking-tight text-zinc-950 dark:text-white whitespace-nowrap">
                {t.brand}
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                {t.domain}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              title={t.settingsButton}
              aria-label={t.settingsButton}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-label={t.close}
              className="lg:hidden min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-200/70 dark:hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-3 space-y-2">
          <button
            type="button"
            onClick={() => handleNewChat()}
            className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-sm font-semibold transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0 shadow-xs"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>{t.newChat}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSidebarOpen(false);
              setShowLiveModal(true);
            }}
            className="w-full min-h-[42px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0 shadow-xs"
          >
            <Mic className="w-4 h-4 shrink-0" />
            <span>{t.liveVoiceButton}</span>
          </button>
        </div>

        {/* Mode Selector */}
        <div className="px-3 pb-3 border-b border-zinc-200/80 dark:border-zinc-800/90">
          <div className="px-2 pb-1.5 text-[11px] font-semibold tracking-tight text-zinc-500 dark:text-zinc-400">
            {t.modesLabel}
          </div>
          <div className="space-y-0.5">
            {(['general', 'html', 'games', 'learning'] as AssistantMode[]).map((modeKey) => {
              const isActive = activeSession?.mode === modeKey && view === 'chat';
              return (
                <button
                  key={modeKey}
                  type="button"
                  onClick={() => handleSelectMode(modeKey)}
                  className={`w-full min-h-[40px] px-2.5 py-2 rounded-xl text-left text-xs font-medium flex items-center gap-2.5 transition-colors ${
                    isActive
                      ? 'bg-white dark:bg-zinc-800/90 text-zinc-950 dark:text-white shadow-xs border border-zinc-200/70 dark:border-zinc-700/70'
                      : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/50 border border-transparent'
                  }`}
                >
                  <span className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400'}>
                    {modeIcons[modeKey]}
                  </span>
                  <span className="truncate">{t.modes[modeKey].label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat History + Local Search */}
        <div className="flex-1 flex flex-col min-h-0 px-3 py-3">
          <div className="px-2 pb-2 text-[11px] font-semibold tracking-tight text-zinc-500 dark:text-zinc-400">
            {t.historyTitle}
          </div>

          <div className="relative mb-2.5">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchChatsPlaceholder}
              aria-label={t.searchChatsPlaceholder}
              className="w-full min-h-[36px] pl-8 pr-8 py-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/35"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label={t.clearSearch}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-1">
            {filteredSessions.length === 0 ? (
              <div className="px-2 py-4 text-xs text-zinc-500 dark:text-zinc-400 text-center">
                {searchQuery.trim() ? t.noSearchResults : t.emptyHistory}
              </div>
            ) : (
              filteredSessions.map((session) => {
                const isCurrent = session.id === activeSession?.id && view === 'chat';
                return (
                  <div
                    key={session.id}
                    onClick={() => {
                      setActiveSessionId(session.id);
                      setView('chat');
                      setSidebarOpen(false);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setActiveSessionId(session.id);
                        setView('chat');
                        setSidebarOpen(false);
                      }
                    }}
                    className={`group min-h-[40px] px-2.5 py-2 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                      isCurrent
                        ? 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-950 dark:text-white'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <span className="text-xs font-medium truncate">{session.title}</span>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSession(session.id, e)}
                      aria-label={t.deleteChat}
                      className="opacity-70 lg:opacity-0 group-hover:opacity-100 p-1 rounded text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-opacity shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-3 border-t border-zinc-200/80 dark:border-zinc-800/90 space-y-2.5 bg-[#EFEFF2] dark:bg-[#0D0D10]">
          <div className="grid grid-cols-2 gap-2">
            {/* Settings & All Languages Trigger */}
            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              title={t.settingsTitle}
              className="min-h-[38px] px-2.5 rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-[#16161A] text-xs font-medium text-zinc-800 dark:text-zinc-100 flex items-center justify-between gap-1.5 hover:border-indigo-500/50 transition-colors"
            >
              <span className="flex items-center gap-1.5 min-w-0">
                <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="truncate">{currentLangInfo.nativeName}</span>
              </span>
              <Settings className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
              className="min-h-[38px] px-2.5 rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-[#16161A] text-xs font-medium text-zinc-800 dark:text-zinc-100 flex items-center justify-center gap-1.5 hover:border-indigo-500/50 transition-colors whitespace-nowrap"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{t.themeLight}</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>{t.themeDark}</span>
                </>
              )}
            </button>
          </div>

          <PWAInstallButton lang={lang} variant="sidebar" />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Top Bar Contract: Brand/Menu — 3 single-line nav tabs — 1 primary action */}
        <header className="h-14 shrink-0 px-4 sm:px-6 border-b border-zinc-200/80 dark:border-zinc-800/90 bg-white/85 dark:bg-[#09090B]/85 backdrop-blur-md flex items-center justify-between gap-4 sm:gap-8">
          {/* Zone 1 */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Menu"
              className="lg:hidden min-h-[44px] min-w-[44px] -ml-2 flex items-center justify-center rounded-xl text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="lg:hidden flex items-center gap-2 shrink-0">
              <img
                src={sakoCrownLogo}
                alt="SAKO AI"
                referrerPolicy="no-referrer"
                className="w-6 h-6 rounded-md object-cover border border-zinc-200 dark:border-zinc-700"
              />
              <span className="font-display text-base font-bold tracking-tight text-zinc-950 dark:text-white whitespace-nowrap">
                {t.brand}
              </span>
            </div>
            <div className="hidden lg:flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 min-w-0">
              <span className="font-semibold text-zinc-950 dark:text-white truncate max-w-[220px]">
                {activeSession?.title || t.brand}
              </span>
              <span aria-hidden="true">·</span>
              <span className="whitespace-nowrap shrink-0">
                {t.modes[activeSession?.mode || 'general'].short}
              </span>
            </div>
          </div>

          {/* Zone 2: Clean single-line navigation tabs */}
          <nav className="flex items-center gap-4 sm:gap-7 text-xs sm:text-sm font-medium">
            <button
              type="button"
              onClick={() => setView('chat')}
              className={`py-4 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                view === 'chat'
                  ? 'border-indigo-600 dark:border-indigo-400 text-zinc-950 dark:text-white'
                  : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200'
              }`}
            >
              {t.chatTab}
            </button>
            <button
              type="button"
              onClick={() => setView('studio')}
              className={`py-4 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                view === 'studio'
                  ? 'border-indigo-600 dark:border-indigo-400 text-zinc-950 dark:text-white'
                  : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200'
              }`}
            >
              {t.studioTab}
            </button>
            <button
              type="button"
              onClick={() => setView('about')}
              className={`py-4 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                view === 'about'
                  ? 'border-indigo-600 dark:border-indigo-400 text-zinc-950 dark:text-white'
                  : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200'
              }`}
            >
              {t.aboutTab}
            </button>
          </nav>

          {/* Zone 3: Voice Live + Export HTML */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowLiveModal(true)}
              title={t.liveModalTitle}
              className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 shadow-2xs"
            >
              <Mic className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xs:inline sm:inline">{t.liveVoiceButton}</span>
              <span className="xs:hidden sm:hidden">Live</span>
            </button>

            <button
              type="button"
              onClick={handleExportChatHtml}
              disabled={!hasMessages}
              title={t.exportHtml}
              aria-label={t.exportHtml}
              className="hidden sm:inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:border-indigo-500/50 disabled:opacity-40 disabled:pointer-events-none transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden md:inline">{t.exportHtml}</span>
            </button>
          </div>
        </header>

        {/* Active View */}
        {view === 'studio' ? (
          <HtmlStudio
            lang={lang}
            htmlCode={studioHtml}
            onChangeHtml={setStudioHtml}
            onAskSakoImprove={handleAskSakoImproveHtml}
          />
        ) : view === 'about' ? (
          <AboutSakoView
            lang={lang}
            onStartChat={() => setView('chat')}
            onOpenStudio={() => setView('studio')}
          />
        ) : (
          <main className="flex-1 flex flex-col min-h-0">
            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
              {!hasMessages ? (
                <div className="max-w-3xl mx-auto pt-4 sm:pt-12 pb-8 space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={sakoCrownLogo}
                        alt="SAKO AI"
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-2xl object-cover border border-zinc-200 dark:border-zinc-800 shadow-xs shrink-0"
                      />
                      <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        <span>{t.brand}</span>
                        <span aria-hidden="true"> · </span>
                        <span>{t.domain}</span>
                        <span aria-hidden="true"> · </span>
                        <span>{currentLangInfo.nativeName}</span>
                      </div>
                    </div>

                    <h1
                      className="font-display text-3xl sm:text-[42px] sm:leading-[1.12] font-bold tracking-tight text-zinc-950 dark:text-white"
                      style={{ textWrap: 'balance' }}
                    >
                      {t.welcomeHeadline}
                    </h1>
                    <p className="text-[15px] sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-2xl">
                      {t.welcomeSubhead}
                    </p>

                    <div className="pt-1 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setShowLiveModal(true)}
                        className="min-h-[44px] px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white text-sm font-semibold transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 shadow-xs"
                      >
                        <Mic className="w-4 h-4 shrink-0" />
                        <span>{t.liveVoiceButton}</span>
                      </button>

                      <PWAInstallButton lang={lang} variant="hero" />
                    </div>
                  </div>

                  {/* Starter Prompt Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {t.starters.map((starter, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => void handleSend(starter.prompt, starter.mode)}
                        className="group text-left p-5 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] hover:border-indigo-500/60 hover:-translate-y-0.5 transition-all duration-150 space-y-2 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display text-sm font-semibold text-zinc-950 dark:text-white">
                            {starter.title}
                          </span>
                          <span className="text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors shrink-0">
                            {modeIcons[starter.mode]}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                          {starter.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto space-y-6 pb-4">
                  {activeSession.messages.map((msg, index) => {
                    const isUser = msg.role === 'user';
                    const isLastModel =
                      !isUser && index === activeSession.messages.length - 1;

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                      >
                        <div className="mb-1.5 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                          {!isUser && (
                            <img
                              src={sakoCrownLogo}
                              alt=""
                              referrerPolicy="no-referrer"
                              className="w-4 h-4 rounded-sm object-cover shrink-0"
                            />
                          )}
                          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                            {isUser ? t.you : t.sako}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {isUser ? (
                          <div className="max-w-[88%] sm:max-w-[78%] rounded-2xl rounded-br-md bg-zinc-950 dark:bg-indigo-600 text-white px-4 py-3 text-[15px] leading-relaxed space-y-2.5 shadow-xs">
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {msg.attachments.map((att) =>
                                  att.previewUrl ? (
                                    <img
                                      key={att.id}
                                      src={att.previewUrl}
                                      alt={att.name}
                                      referrerPolicy="no-referrer"
                                      className="max-h-44 rounded-lg object-cover border border-white/20"
                                    />
                                  ) : null
                                )}
                              </div>
                            )}
                            <div className="whitespace-pre-wrap break-words">{msg.text}</div>
                          </div>
                        ) : (
                          <div
                            className={`w-full rounded-2xl border px-4 sm:px-5 py-4 ${
                              msg.error
                                ? 'border-red-300/80 dark:border-red-900/60 bg-red-50/80 dark:bg-red-950/30 text-red-800 dark:text-red-200'
                                : 'border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114]'
                            }`}
                          >
                            {msg.text ? (
                              <MarkdownRenderer
                                content={msg.text}
                                lang={lang}
                                onOpenHtmlInStudio={handleOpenHtmlInStudio}
                              />
                            ) : (
                              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                                {t.streamingNote}
                              </div>
                            )}

                            {isLastModel && !isStreaming && msg.text && (
                              <div className="mt-3 pt-2.5 border-t border-zinc-200/70 dark:border-zinc-800 flex items-center justify-end">
                                <button
                                  type="button"
                                  onClick={handleRegenerateLast}
                                  className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white transition-colors"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>{t.regenerate}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Composer */}
            <div className="shrink-0 px-4 sm:px-6 pb-4 pt-2 pb-safe bg-transparent">
              <div className="max-w-3xl mx-auto">
                {attachmentNotice && (
                  <div className="mb-2 text-xs text-amber-600 dark:text-amber-400">
                    {attachmentNotice}
                  </div>
                )}

                <div className="relative rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-lg shadow-zinc-950/5 dark:shadow-black/40 focus-within:border-indigo-500/70 focus-within:ring-2 focus-within:ring-indigo-500/15 transition-all p-2.5 sm:p-3 space-y-2">
                  {/* Slash-Command Suggestions when typing "/" */}
                  {input.startsWith('/') && !input.includes(' ') && !input.includes('\n') && (
                    <div className="absolute left-0 right-0 bottom-full mb-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#141418] shadow-xl p-1.5 space-y-1 z-20">
                      <button
                        type="button"
                        onClick={() => {
                          void handleSend('/angry');
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center justify-between gap-3 transition-colors"
                      >
                        <span className="flex items-center gap-2 text-xs font-semibold text-red-600 dark:text-red-400">
                          <Flame className="w-4 h-4 shrink-0" />
                          <span className="font-mono">/angry</span>
                        </span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                          {t.angryCmdDesc}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void handleSend('/normal');
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-between gap-3 transition-colors"
                      >
                        <span className="flex items-center gap-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                          <MessageSquare className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                          <span className="font-mono">/normal</span>
                        </span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                          {t.normalCmdDesc}
                        </span>
                      </button>
                    </div>
                  )}

                  {activeSession?.persona === 'angry' && (
                    <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200/80 dark:border-red-900/60 text-xs">
                      <span className="flex items-center gap-1.5 font-medium text-red-700 dark:text-red-300 min-w-0">
                        <Flame className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{t.angryModeHint}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSetPersona('normal')}
                        aria-label={t.close}
                        className="text-red-600 dark:text-red-300 hover:text-red-800 dark:hover:text-white p-0.5 rounded shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 px-1">
                      {attachments.map((att) => (
                        <div
                          key={att.id}
                          className="relative group rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800"
                        >
                          {att.previewUrl && (
                            <img
                              src={att.previewUrl}
                              alt={att.name}
                              referrerPolicy="no-referrer"
                              className="h-14 w-14 object-cover"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setAttachments((prev) => prev.filter((a) => a.id !== att.id))
                            }
                            aria-label="Remove attachment"
                            className="absolute top-0.5 right-0.5 h-5 w-5 rounded bg-black/75 text-white flex items-center justify-center"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        void handleSend();
                      }
                    }}
                    placeholder={t.inputPlaceholder}
                    className="w-full resize-none bg-transparent px-2 py-1.5 text-[15px] text-zinc-950 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none max-h-[180px]"
                  />

                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp,.html,.htm,.css,.js,.ts,.tsx,.jsx,.json,.py,.md,.txt,.sql"
                          multiple
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          title={t.attachFile}
                          aria-label={t.attachFile}
                          className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
                        >
                          <Paperclip className="w-4 h-4" />
                        </button>

                        {/* Live Voice & Phone Screen/Camera Modal Trigger */}
                        <button
                          type="button"
                          onClick={() => setShowLiveModal(true)}
                          title={t.liveModalTitle}
                          className="min-h-[38px] px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-500/35 bg-indigo-50 dark:bg-indigo-950/50 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/55 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                        >
                          <Mic className="w-3.5 h-3.5 shrink-0" />
                          <span>{t.liveVoiceButton}</span>
                        </button>

                        {/* /angry Fierce Mode Command Toggle */}
                        <button
                          type="button"
                          onClick={() => {
                            if (activeSession?.persona === 'angry') {
                              handleSetPersona('normal');
                            } else {
                              void handleSend('/angry');
                            }
                          }}
                          title={t.angryCmdDesc}
                          className={`min-h-[38px] px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 ${
                            activeSession?.persona === 'angry'
                              ? 'border-red-500 bg-red-600 text-white'
                              : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:border-red-400/70'
                          }`}
                        >
                          <Flame className="w-3.5 h-3.5 shrink-0" />
                          <span className="font-mono">{t.angryCommandLabel}</span>
                        </button>

                        {/* 5 Free Gemini Models Details Trigger */}
                        <button
                          type="button"
                          onClick={() => setShowModelsModal(true)}
                          title={t.modelsButtonLabel}
                          className="min-h-[38px] px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                        >
                          <Cpu className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          <span className="hidden sm:inline">{t.modelsButtonLabel}</span>
                        </button>

                        {/* Settings Gear (All World Languages, Theme, Defaults) */}
                        <button
                          type="button"
                          onClick={() => setShowSettingsModal(true)}
                          title={t.settingsTitle}
                          aria-label={t.settingsButton}
                          className="min-h-[38px] px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                        >
                          <Settings className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          <span className="uppercase text-[11px] font-semibold">
                            {lang.length <= 5 ? lang : currentLangInfo.nativeName}
                          </span>
                        </button>
                      </div>

                      {isStreaming ? (
                        <button
                          type="button"
                          onClick={handleStopStreaming}
                          aria-label={t.stop}
                          className="min-h-[40px] px-4 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-semibold flex items-center gap-1.5 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors whitespace-nowrap shrink-0"
                        >
                          <Square className="w-3.5 h-3.5 fill-current" />
                          <span>{t.stop}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void handleSend()}
                          disabled={!input.trim() && attachments.length === 0}
                          aria-label={t.send}
                          className="min-h-[40px] min-w-[40px] px-3.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-35 disabled:pointer-events-none transition-colors whitespace-nowrap shrink-0"
                        >
                          <ArrowUp className="w-4 h-4" />
                          <span className="hidden sm:inline">{t.send}</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1 overflow-x-auto p-1 rounded-xl bg-zinc-100/90 dark:bg-zinc-900/90 border border-zinc-200/70 dark:border-zinc-800">
                      {MODEL_PRESET_ORDER.map((presetId) => (
                        <button
                          key={presetId}
                          type="button"
                          onClick={() => setModelPreset(presetId)}
                          title={`${t.modelPresets[presetId].name} — ${t.modelPresets[presetId].speed}`}
                          className={`flex-1 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                            modelPreset === presetId
                              ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs'
                              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200'
                          }`}
                        >
                          {t.modelPresets[presetId].short}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        )}
      </div>

      {/* All Free Models Modal */}
      {showModelsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="models-modal-title"
          onClick={() => setShowModelsModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111114] p-5 sm:p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3
                  id="models-modal-title"
                  className="font-display text-base font-semibold text-zinc-950 dark:text-white"
                >
                  {t.modelsModalTitle}
                </h3>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {t.modelsModalHint}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModelsModal(false)}
                aria-label={t.close}
                className="min-h-[40px] min-w-[40px] -mt-1 -mr-2 flex items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {MODEL_PRESET_ORDER.map((presetId) => {
                const info = t.modelPresets[presetId];
                const selected = modelPreset === presetId;
                return (
                  <button
                    key={presetId}
                    type="button"
                    onClick={() => {
                      setModelPreset(presetId);
                      setShowModelsModal(false);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-colors flex items-start justify-between gap-3 ${
                      selected
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40'
                        : 'border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="text-sm font-semibold text-zinc-950 dark:text-white">
                        {info.name}
                      </div>
                      <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400 flex items-center gap-2 flex-wrap">
                        <span>{info.modelId}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-sans text-indigo-600 dark:text-indigo-400 font-medium">
                          {info.speed}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                        {info.desc}
                      </p>
                    </div>
                    {selected && (
                      <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <LiveVoiceModal
        isOpen={showLiveModal}
        onClose={() => setShowLiveModal(false)}
        lang={lang}
        defaultVoice={liveVoice}
        onChangeDefaultVoice={setLiveVoice}
        persona={activeSession?.persona || 'normal'}
        onChangePersona={handleSetPersona}
        onSaveTranscriptToChat={handleSaveLiveTranscript}
      />
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        lang={lang}
        translatingLang={translatingLang}
        onSelectLanguage={(code) => void handleSelectLanguage(code)}
        theme={theme}
        onChangeTheme={setTheme}
        modelPreset={modelPreset}
        onChangeModelPreset={setModelPreset}
        liveVoice={liveVoice}
        onChangeLiveVoice={setLiveVoice}
      />
      <WelcomeAnimation lang={lang} />
      <OfflineIndicator lang={lang} />
    </div>
  );
}
