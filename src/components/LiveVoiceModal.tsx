import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera,
  Check,
  Flame,
  ImagePlus,
  MessageSquarePlus,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Phone,
  PhoneOff,
  RefreshCw,
  Volume2,
  X,
} from 'lucide-react';
import { getWorldLanguage } from '../i18n/languages';
import { getTranslation } from '../i18n/translations';
import type { Language, LiveSessionMode, LiveVoiceName, PersonaTone } from '../types/chat';

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  defaultVoice?: LiveVoiceName;
  onChangeDefaultVoice?: (voice: LiveVoiceName) => void;
  persona?: PersonaTone;
  onChangePersona?: (persona: PersonaTone) => void;
  onSaveTranscriptToChat?: (transcriptText: string) => void;
}

interface TranscriptEntry {
  id: string;
  role: 'user' | 'model';
  text: string;
}

const VOICE_ORDER: LiveVoiceName[] = ['Zephyr', 'Puck', 'Kore', 'Fenrir', 'Charon'];
const LIVE_MODES: LiveSessionMode[] = ['instant', 'thinking', 'coach'];
const STORAGE_VOICE_KEY = 'sakoai_live_voice_v1';

function downsampleTo16k(input: Float32Array, sourceRate: number): Int16Array {
  if (sourceRate === 16000) {
    const out = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const clamped = Math.max(-1, Math.min(1, input[i]));
      out[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
    }
    return out;
  }

  const ratio = sourceRate / 16000;
  const newLength = Math.max(1, Math.round(input.length / ratio));
  const result = new Int16Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const pos = i * ratio;
    const idx = Math.floor(pos);
    const frac = pos - idx;
    const s0 = input[idx] ?? 0;
    const s1 = input[Math.min(idx + 1, input.length - 1)] ?? s0;
    const sample = s0 + (s1 - s0) * frac;
    const clamped = Math.max(-1, Math.min(1, sample));
    result[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }
  return result;
}

function int16ToBase64(pcm: Int16Array): string {
  const bytes = new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64PcmToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const byteLength = binary.length;
  const bytes = new Uint8Array(byteLength);
  for (let i = 0; i < byteLength; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const int16 = new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2));
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 0x8000;
  }
  return float32;
}

export const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({
  isOpen,
  onClose,
  lang,
  defaultVoice,
  onChangeDefaultVoice,
  persona = 'normal',
  onChangePersona,
  onSaveTranscriptToChat,
}) => {
  const t = getTranslation(lang);
  const langInfo = getWorldLanguage(lang);

  const [selectedVoice, setSelectedVoice] = useState<LiveVoiceName>(() => {
    if (defaultVoice && VOICE_ORDER.includes(defaultVoice)) return defaultVoice;
    try {
      const saved = localStorage.getItem(STORAGE_VOICE_KEY) as LiveVoiceName | null;
      if (saved && VOICE_ORDER.includes(saved)) return saved;
    } catch {
      // ignore storage errors
    }
    return 'Zephyr';
  });
  const [liveMode, setLiveMode] = useState<LiveSessionMode>('instant');
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [videoSource, setVideoSource] = useState<'none' | 'screen' | 'camera'>('none');
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [previewingVoice, setPreviewingVoice] = useState<LiveVoiceName | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [savedNotice, setSavedNotice] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const meterFrameRef = useRef<number | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const isMutedRef = useRef(false);

  const videoStreamRef = useRef<MediaStream | null>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameIntervalRef = useRef<number | null>(null);
  const screenshotInputRef = useRef<HTMLInputElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    if (defaultVoice && VOICE_ORDER.includes(defaultVoice)) {
      setSelectedVoice(defaultVoice);
    }
  }, [defaultVoice]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_VOICE_KEY, selectedVoice);
    } catch {
      // ignore
    }
  }, [selectedVoice]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  const stopOutputPlayback = useCallback(() => {
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
      } catch {
        // ignore already stopped
      }
    });
    activeSourcesRef.current.clear();
    if (outputAudioCtxRef.current) {
      nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
    } else {
      nextStartTimeRef.current = 0;
    }
  }, []);

  const stopVideoStream = useCallback(() => {
    if (frameIntervalRef.current !== null) {
      window.clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((tr) => tr.stop());
      videoStreamRef.current = null;
    }
    if (videoElRef.current) {
      videoElRef.current.srcObject = null;
    }
    setVideoSource('none');
  }, []);

  const stopLiveSession = useCallback(() => {
    if (meterFrameRef.current !== null) {
      cancelAnimationFrame(meterFrameRef.current);
      meterFrameRef.current = null;
    }
    setAudioLevel(0);

    stopVideoStream();
    stopOutputPlayback();

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((tr) => tr.stop());
      micStreamRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close().catch(() => {});
      outputAudioCtxRef.current = null;
    }
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {
        // ignore
      }
      wsRef.current = null;
    }
    setStatus('idle');
  }, [stopOutputPlayback, stopVideoStream]);

  useEffect(() => {
    if (!isOpen) {
      stopLiveSession();
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
      setPreviewingVoice(null);
    }
  }, [isOpen, stopLiveSession]);

  useEffect(() => {
    return () => {
      stopLiveSession();
    };
  }, [stopLiveSession]);

  const appendTranscript = useCallback((role: 'user' | 'model', chunkText: string) => {
    if (!chunkText) return;
    setTranscripts((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === role) {
        return [
          ...prev.slice(0, -1),
          { ...last, text: `${last.text}${chunkText}` },
        ];
      }
      return [
        ...prev,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          role,
          text: chunkText,
        },
      ];
    });
  }, []);

  const playIncomingAudio = useCallback((base64Pcm: string) => {
    const ctx = outputAudioCtxRef.current;
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const samples = base64PcmToFloat32(base64Pcm);
    if (samples.length === 0) return;

    const buffer = ctx.createBuffer(1, samples.length, 24000);
    buffer.getChannelData(0).set(samples);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    const now = ctx.currentTime;
    const startAt = Math.max(now + 0.02, nextStartTimeRef.current);
    source.start(startAt);
    nextStartTimeRef.current = startAt + buffer.duration;

    activeSourcesRef.current.add(source);
    source.onended = () => {
      activeSourcesRef.current.delete(source);
    };
  }, []);

  const startLiveSession = useCallback(
    async (
      voiceOverride?: LiveVoiceName,
      modeOverride?: LiveSessionMode,
      personaOverride?: PersonaTone
    ) => {
      const activeVoice = voiceOverride || selectedVoice;
      const activeMode = modeOverride || liveMode;
      const activePersona = personaOverride || persona;

      stopLiveSession();
      setErrorMsg(null);
      setInfoNotice(null);
      setStatus('connecting');

      try {
        if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
          throw new Error(t.liveMicDenied);
        }

        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        micStreamRef.current = micStream;

        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

        let inputCtx: AudioContext;
        try {
          inputCtx = new AudioCtx({ sampleRate: 16000 });
        } catch {
          inputCtx = new AudioCtx();
        }
        let outputCtx: AudioContext;
        try {
          outputCtx = new AudioCtx({ sampleRate: 24000 });
        } catch {
          outputCtx = new AudioCtx();
        }
        inputAudioCtxRef.current = inputCtx;
        outputAudioCtxRef.current = outputCtx;
        nextStartTimeRef.current = outputCtx.currentTime;

        if (inputCtx.state === 'suspended') await inputCtx.resume();
        if (outputCtx.state === 'suspended') await outputCtx.resume();

        const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const langLabel = `${langInfo.nativeName} (${langInfo.enName})`;
        const wsUrl = `${wsProto}//${window.location.host}/api/live?voice=${encodeURIComponent(activeVoice)}&liveMode=${encodeURIComponent(activeMode)}&persona=${encodeURIComponent(activePersona)}&uiLang=${encodeURIComponent(lang)}&languageName=${encodeURIComponent(langLabel)}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        const source = inputCtx.createMediaStreamSource(micStream);
        const analyser = inputCtx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        // Zero-gain node prevents mic echo while keeping ScriptProcessorNode active
        const silentGain = inputCtx.createGain();
        silentGain.gain.value = 0;

        source.connect(analyser);
        source.connect(processor);
        processor.connect(silentGain);
        silentGain.connect(inputCtx.destination);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateMeter = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / (dataArray.length * 255);
          setAudioLevel(isMutedRef.current ? 0 : Math.min(1, avg * 2.4));
          meterFrameRef.current = requestAnimationFrame(updateMeter);
        };
        meterFrameRef.current = requestAnimationFrame(updateMeter);

        processor.onaudioprocess = (event) => {
          if (isMutedRef.current) return;
          const activeWs = wsRef.current;
          if (!activeWs || activeWs.readyState !== WebSocket.OPEN) return;

          const floatSamples = event.inputBuffer.getChannelData(0);
          const pcm16 = downsampleTo16k(floatSamples, inputCtx.sampleRate);
          const base64 = int16ToBase64(pcm16);
          activeWs.send(JSON.stringify({ type: 'audio', data: base64 }));
        };

        ws.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data as string) as {
              type?: string;
              data?: string;
              text?: string;
              error?: string;
            };
            if (payload.type === 'ready') {
              setStatus('connected');
            } else if (payload.type === 'audio' && payload.data) {
              playIncomingAudio(payload.data);
            } else if (payload.type === 'inputTranscript' && payload.text) {
              appendTranscript('user', payload.text);
            } else if (payload.type === 'outputTranscript' && payload.text) {
              appendTranscript('model', payload.text);
            } else if (payload.type === 'interrupted') {
              stopOutputPlayback();
            } else if (payload.type === 'error' && payload.error) {
              setErrorMsg(payload.error);
              stopLiveSession();
            }
          } catch {
            // ignore malformed WS frames
          }
        };

        ws.onerror = () => {
          setErrorMsg(
            lang === 'kk'
              ? 'Live-байланыс қатесі. Қайта қосылып көріңіз.'
              : lang === 'en'
                ? 'Live connection error. Please try reconnecting.'
                : 'Ошибка соединения Live. Попробуйте подключиться снова.'
          );
          stopLiveSession();
        };

        ws.onclose = () => {
          if (wsRef.current === ws) {
            stopLiveSession();
          }
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.toLowerCase().includes('denied') || message.toLowerCase().includes('permission')) {
          setErrorMsg(t.liveMicDenied);
        } else {
          setErrorMsg(message);
        }
        stopLiveSession();
      }
    },
    [
      appendTranscript,
      lang,
      langInfo.enName,
      langInfo.nativeName,
      liveMode,
      persona,
      playIncomingAudio,
      selectedVoice,
      stopLiveSession,
      stopOutputPlayback,
      t.liveMicDenied,
    ]
  );

  const startVideoFramePump = useCallback((stream: MediaStream, kind: 'screen' | 'camera') => {
    stopVideoStream();
    videoStreamRef.current = stream;
    setVideoSource(kind);
    setInfoNotice(null);

    if (videoElRef.current) {
      videoElRef.current.srcObject = stream;
      videoElRef.current.play().catch(() => {});
    }

    const [track] = stream.getVideoTracks();
    if (track) {
      track.onended = () => {
        stopVideoStream();
      };
    }

    const sendFrame = () => {
      const video = videoElRef.current;
      const ws = wsRef.current;
      if (!video || !ws || ws.readyState !== WebSocket.OPEN) return;
      if (video.videoWidth === 0 || video.videoHeight === 0) return;

      let canvas = canvasRef.current;
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvasRef.current = canvas;
      }

      const maxDim = 960;
      const scale = Math.min(1, maxDim / Math.max(video.videoWidth, video.videoHeight));
      canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
      canvas.height = Math.max(1, Math.round(video.videoHeight * scale));

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
      const base64 = dataUrl.split(',')[1];
      if (base64) {
        ws.send(JSON.stringify({ type: 'video', data: base64 }));
      }
    };

    // Send an immediate frame once video dimensions stabilize, then 1 FPS per Live API guideline
    window.setTimeout(sendFrame, 350);
    frameIntervalRef.current = window.setInterval(sendFrame, 1000);
  }, [stopVideoStream]);

  useEffect(() => {
    if (videoSource !== 'none' && videoElRef.current && videoStreamRef.current) {
      videoElRef.current.srcObject = videoStreamRef.current;
      videoElRef.current.play().catch(() => {});
    }
  }, [videoSource]);

  const handleToggleScreenShare = async () => {
    if (videoSource === 'screen') {
      stopVideoStream();
      return;
    }
    setInfoNotice(null);
    setErrorMsg(null);

    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getDisplayMedia !== 'function') {
      setInfoNotice(t.liveScreenUnsupportedMobile);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 2, max: 5 } },
        audio: false,
      });
      startVideoFramePump(stream, 'screen');
    } catch (err) {
      const name = err instanceof Error ? err.name : '';
      if (name === 'NotSupportedError' || name === 'TypeError') {
        setInfoNotice(t.liveScreenUnsupportedMobile);
      } else if (name !== 'AbortError' && name !== 'NotAllowedError') {
        setInfoNotice(t.liveScreenUnsupportedMobile);
      }
    }
  };

  const handleToggleCamera = async (overrideFacing?: 'environment' | 'user') => {
    const facing = overrideFacing || cameraFacing;
    if (videoSource === 'camera' && !overrideFacing) {
      stopVideoStream();
      return;
    }
    setInfoNotice(null);
    setErrorMsg(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing },
        audio: false,
      });
      startVideoFramePump(stream, 'camera');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  };

  const handleFlipCamera = () => {
    const next = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(next);
    if (videoSource === 'camera') {
      void handleToggleCamera(next);
    }
  };

  const handleScreenshotSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const bitmap = await createImageBitmap(file);
      let canvas = canvasRef.current;
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvasRef.current = canvas;
      }
      const maxDim = 1024;
      const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();

      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      const base64 = dataUrl.split(',')[1];
      if (base64 && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'video', data: base64 }));
        wsRef.current.send(
          JSON.stringify({
            type: 'text',
            text:
              lang === 'kk'
                ? 'Міне менің телефонымның скриншоты. Онда не көріп тұрғаныңды айтып, көмектесші.'
                : lang === 'en'
                  ? 'I just shared a screenshot of my phone screen. Tell me what you see and help me with it.'
                  : 'Я отправил снимок экрана телефона. Посмотри, что на нём, и прокомментируй голосом!',
          })
        );
        setInfoNotice(t.liveScreenshotSent);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  };

  const handlePreviewVoice = async (voice: LiveVoiceName, e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    if (previewingVoice === voice) {
      setPreviewingVoice(null);
      return;
    }

    setPreviewingVoice(voice);
    setErrorMsg(null);
    try {
      const customSample =
        lang !== 'ru' && lang !== 'kk' && lang !== 'en' ? langInfo.greeting : undefined;
      const resp = await fetch('/api/voice-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceName: voice, uiLang: lang, sampleText: customSample }),
      });
      const data = (await resp.json()) as { audioBase64?: string; mimeType?: string; error?: string };
      if (!resp.ok || !data.audioBase64) {
        throw new Error(data.error || 'Voice preview failed');
      }
      const audio = new Audio(`data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`);
      previewAudioRef.current = audio;
      audio.onended = () => setPreviewingVoice(null);
      audio.onerror = () => setPreviewingVoice(null);
      await audio.play();
    } catch (err) {
      setPreviewingVoice(null);
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  };

  const handleSelectVoice = (voice: LiveVoiceName) => {
    setSelectedVoice(voice);
    onChangeDefaultVoice?.(voice);
    if (status === 'connected') {
      void startLiveSession(voice, liveMode, persona);
    }
  };

  const handleSelectMode = (mode: LiveSessionMode) => {
    setLiveMode(mode);
    if (status === 'connected') {
      void startLiveSession(selectedVoice, mode, persona);
    }
  };

  const handleToggleAngryLive = () => {
    const next: PersonaTone = persona === 'angry' ? 'normal' : 'angry';
    onChangePersona?.(next);
    if (status === 'connected') {
      void startLiveSession(selectedVoice, liveMode, next);
    }
  };

  const handleSaveTranscript = () => {
    if (!onSaveTranscriptToChat || transcripts.length === 0) return;
    const formatted = transcripts
      .map((item) => `**${item.role === 'user' ? t.you : t.sako}:** ${item.text.trim()}`)
      .join('\n\n');
    onSaveTranscriptToChat(formatted);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="live-voice-modal-title"
    >
      <div className="w-full h-[94dvh] sm:h-auto sm:max-h-[90dvh] sm:max-w-3xl rounded-t-3xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111114] shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <h2
              id="live-voice-modal-title"
              className="font-display text-base sm:text-lg font-bold text-zinc-950 dark:text-white truncate"
            >
              {t.liveModalTitle}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
              {status === 'connected'
                ? t.liveConnected
                : status === 'connecting'
                  ? t.liveConnecting
                  : t.liveModalSubtitle}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleToggleAngryLive}
              title={t.angryCmdDesc}
              className={`min-h-[38px] px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                persona === 'angry'
                  ? 'border-red-500 bg-red-600 text-white shadow-2xs'
                  : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:border-red-400/70'
              }`}
            >
              <Flame className="w-3.5 h-3.5 shrink-0" />
              <span>{t.angryCommandLabel}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                stopLiveSession();
                onClose();
              }}
              aria-label={t.close}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5">
          {errorMsg && (
            <div className="rounded-xl border border-red-300/80 dark:border-red-900/60 bg-red-50/90 dark:bg-red-950/40 px-4 py-3 text-xs text-red-800 dark:text-red-200">
              {errorMsg}
            </div>
          )}

          {infoNotice && (
            <div className="rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/80 dark:bg-indigo-950/40 px-4 py-3 text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
              {infoNotice}
            </div>
          )}

          {/* Active Call Stage: Visualizer + Optional Live Screen/Camera Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
            <div className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 p-5 flex flex-col items-center justify-center text-center min-h-[190px] space-y-3">
              <div
                className="w-20 h-20 rounded-full bg-indigo-600/10 dark:bg-indigo-500/15 border border-indigo-500/35 flex items-center justify-center transition-transform duration-100"
                style={{
                  transform: `scale(${1 + audioLevel * 0.28})`,
                }}
              >
                <div className="w-12 h-12 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shadow-sm">
                  {status === 'connected' && isMuted ? (
                    <MicOff className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-semibold text-zinc-950 dark:text-white">
                  {t.liveVoices[selectedVoice].name} · {t.liveVoices[selectedVoice].vibe}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {status === 'connected'
                    ? t.liveModes[liveMode].label
                    : t.liveIdleHint}
                </div>
              </div>
            </div>

            {/* Video / Screen Share Monitor or Live Transcript */}
            {videoSource !== 'none' ? (
              <div className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-black overflow-hidden flex flex-col min-h-[190px]">
                <div className="relative flex-1 flex items-center justify-center bg-black">
                  <video
                    ref={videoElRef}
                    playsInline
                    muted
                    autoPlay
                    className="w-full h-48 object-contain"
                  />
                </div>
                <div className="px-3 py-2 bg-zinc-900 text-[11px] text-zinc-200 flex items-center justify-between gap-2">
                  <span className="truncate">{t.liveVideoActiveHint}</span>
                  {videoSource === 'camera' && (
                    <button
                      type="button"
                      onClick={handleFlipCamera}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white whitespace-nowrap shrink-0"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>{t.liveFlipCamera}</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 p-4 flex flex-col min-h-[190px] max-h-[240px]">
                <div className="flex items-center justify-between gap-2 mb-2 shrink-0">
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                    {t.liveTranscriptTitle}
                  </span>
                  {onSaveTranscriptToChat && transcripts.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSaveTranscript}
                      className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap shrink-0"
                    >
                      {savedNotice ? <Check className="w-3.5 h-3.5" /> : <MessageSquarePlus className="w-3.5 h-3.5" />}
                      <span>{savedNotice ? t.liveSavedToChat : t.liveSaveToChat}</span>
                    </button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 text-xs">
                  {transcripts.length === 0 ? (
                    <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      {t.liveNoTranscriptYet}
                    </p>
                  ) : (
                    transcripts.map((entry) => (
                      <div
                        key={entry.id}
                        className={`rounded-xl px-3 py-2 ${
                          entry.role === 'user'
                            ? 'bg-indigo-50 dark:bg-indigo-950/40 text-zinc-900 dark:text-zinc-100'
                            : 'bg-white dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 border border-zinc-200/70 dark:border-zinc-700/60'
                        }`}
                      >
                        <span className="font-semibold mr-1.5">
                          {entry.role === 'user' ? t.you : t.sako}:
                        </span>
                        <span>{entry.text}</span>
                      </div>
                    ))
                  )}
                  <div ref={transcriptEndRef} />
                </div>
              </div>
            )}
          </div>

          {/* Live Mode Choices */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
              {t.liveModeSectionTitle}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {LIVE_MODES.map((modeKey) => {
                const active = liveMode === modeKey;
                return (
                  <button
                    key={modeKey}
                    type="button"
                    onClick={() => handleSelectMode(modeKey)}
                    className={`text-left p-3 rounded-xl border transition-colors ${
                      active
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40'
                        : 'border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className="text-xs font-semibold text-zinc-950 dark:text-white">
                      {t.liveModes[modeKey].label}
                    </div>
                    <div className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                      {t.liveModes[modeKey].desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5 Gemini Voice Selector Cards with Audition */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
              {t.liveVoiceSectionTitle}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {VOICE_ORDER.map((voice) => {
                const info = t.liveVoices[voice];
                const isSelected = selectedVoice === voice;
                const isPreviewing = previewingVoice === voice;
                return (
                  <div
                    key={voice}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectVoice(voice)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelectVoice(voice);
                      }
                    }}
                    className={`p-3 rounded-xl border transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40'
                        : 'border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="text-xs font-semibold text-zinc-950 dark:text-white flex items-center gap-1.5">
                        <span>{info.name}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                          {info.vibe}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                        {info.desc}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => void handlePreviewVoice(voice, e)}
                      className="min-h-[36px] px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[11px] font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 flex items-center gap-1 whitespace-nowrap shrink-0"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span>{isPreviewing ? t.livePreviewing : t.livePreviewVoice}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Hidden Mobile Screenshot File Picker */}
        <input
          ref={screenshotInputRef}
          type="file"
          accept="image/*"
          onChange={handleScreenshotSelected}
          className="hidden"
        />

        {/* Bottom Thumb-Zone Action Bar */}
        <div className="px-4 sm:px-6 py-3.5 pb-safe border-t border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/90 dark:bg-[#0D0D10] flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto">
            {status === 'connected' && (
              <>
                <button
                  type="button"
                  onClick={() => setIsMuted((prev) => !prev)}
                  className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
                    isMuted
                      ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100'
                  }`}
                >
                  {isMuted ? <MicOff className="w-4 h-4 shrink-0" /> : <Mic className="w-4 h-4 shrink-0" />}
                  <span>{isMuted ? t.liveUnmuteMic : t.liveMuteMic}</span>
                </button>

                <button
                  type="button"
                  onClick={() => void handleToggleScreenShare()}
                  className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
                    videoSource === 'screen'
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  {videoSource === 'screen' ? (
                    <MonitorOff className="w-4 h-4 shrink-0" />
                  ) : (
                    <Monitor className="w-4 h-4 shrink-0" />
                  )}
                  <span>{videoSource === 'screen' ? t.liveStopScreen : t.liveShareScreen}</span>
                </button>

                <button
                  type="button"
                  onClick={() => void handleToggleCamera()}
                  className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
                    videoSource === 'camera'
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Camera className="w-4 h-4 shrink-0" />
                  <span>{videoSource === 'camera' ? t.liveStopCamera : t.liveShareCamera}</span>
                </button>

                <button
                  type="button"
                  onClick={() => screenshotInputRef.current?.click()}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
                >
                  <ImagePlus className="w-4 h-4 shrink-0" />
                  <span>{t.liveSendScreenshot}</span>
                </button>
              </>
            )}
          </div>

          <div className="ml-auto shrink-0">
            {status === 'idle' ? (
              <button
                type="button"
                onClick={() => void startLiveSession()}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
              >
                <Phone className="w-4 h-4 shrink-0" />
                <span>{t.liveStartCall}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopLiveSession}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
              >
                <PhoneOff className="w-4 h-4 shrink-0" />
                <span>{status === 'connecting' ? t.close : t.liveEndCall}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
