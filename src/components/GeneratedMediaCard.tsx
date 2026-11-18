import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Film, Image as ImageIcon, Loader2, Pause, Play, Sparkles } from 'lucide-react';
import { getTranslation } from '../i18n/translations';
import type { GeneratedMedia, Language } from '../types/chat';
import {
  drawVideoFrame,
  fetchFallbackImageAsDataUrl,
  getDimensionsForAspect,
  imageUrlToPngBlob,
  loadImageElement,
  recordFreeVideoBlob,
  sanitizeSvgMarkup,
} from '../utils/freeMediaRenderer';

interface GeneratedMediaCardProps {
  media: GeneratedMedia;
  lang: Language;
}

export const GeneratedMediaCard: React.FC<GeneratedMediaCardProps> = ({ media, lang }) => {
  const t = getTranslation(lang);
  const [downloadingPng, setDownloadingPng] = useState(false);

  const legacySvgUrl = useMemo(() => {
    if (!media.svgMarkup) return '';
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sanitizeSvgMarkup(media.svgMarkup))}`;
  }, [media.svgMarkup]);

  const [resolvedPhotoUrl, setResolvedPhotoUrl] = useState<string>(
    media.imageDataUrl || legacySvgUrl || ''
  );
  const [cooldownSec, setCooldownSec] = useState<number>(0);
  const [photoLoading, setPhotoLoading] = useState<boolean>(
    !media.imageDataUrl && !legacySvgUrl && Boolean(media.fallbackImageUrl)
  );
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Fetch fallback image client-side if server returned fallbackImageUrl only
  useEffect(() => {
    if (media.imageDataUrl) {
      setResolvedPhotoUrl(media.imageDataUrl);
      setPhotoLoading(false);
      setPhotoError(null);
      return;
    }
    if (!media.fallbackImageUrl) return;

    let cancelled = false;
    setPhotoLoading(true);
    setPhotoError(null);

    void fetchFallbackImageAsDataUrl(media.fallbackImageUrl, (sec) => {
      if (!cancelled) setCooldownSec(sec);
    })
      .then((dataUrl) => {
        if (!cancelled) {
          setResolvedPhotoUrl(dataUrl);
          setPhotoLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setPhotoLoading(false);
          setPhotoError(err instanceof Error ? err.message : 'Failed to load image');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [media.imageDataUrl, media.fallbackImageUrl]);

  // Video live canvas & recorded Blob state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoExt, setVideoExt] = useState<'mp4' | 'webm'>('webm');
  const [recordProgress, setRecordProgress] = useState<number>(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordFailed, setRecordFailed] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(true);

  const aspectClass =
    media.aspectRatio === '9:16'
      ? 'aspect-[9/16] max-w-[300px]'
      : media.aspectRatio === '16:9'
        ? 'aspect-video max-w-[540px]'
        : 'aspect-square max-w-[380px]';

  // Live animated canvas preview for video before / alongside recorded Blob
  useEffect(() => {
    if (media.kind !== 'video' || !media.videoPlan || videoUrl) return;
    const plan = media.videoPlan;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = getDimensionsForAspect(media.aspectRatio, 'video');
    canvas.width = width;
    canvas.height = height;

    let cancelled = false;
    let rafId = 0;
    let heroImg: HTMLImageElement | null = null;
    const startMs = performance.now();

    if (resolvedPhotoUrl) {
      void loadImageElement(resolvedPhotoUrl).then((img) => {
        if (!cancelled) heroImg = img;
      });
    }

    const renderLoop = () => {
      if (cancelled) return;
      const elapsedSec = isPlayingPreview ? (performance.now() - startMs) / 1000 : 0.6;
      drawVideoFrame(ctx, plan, heroImg, width, height, elapsedSec, 2.0);
      if (isPlayingPreview) {
        rafId = requestAnimationFrame(renderLoop);
      }
    };

    renderLoop();
    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [media.kind, media.videoPlan, media.aspectRatio, videoUrl, isPlayingPreview, resolvedPhotoUrl]);

  // Automatically encode downloadable video file once hero photo (or fallback) is ready
  useEffect(() => {
    if (media.kind !== 'video' || !media.videoPlan || photoLoading) return;
    let cancelled = false;
    let objectUrl: string | null = null;

    setIsRecording(true);
    setRecordFailed(false);
    setRecordProgress(5);

    void recordFreeVideoBlob(
      media.videoPlan,
      media.aspectRatio,
      resolvedPhotoUrl || undefined,
      (pct) => {
        if (!cancelled) setRecordProgress(pct);
      }
    )
      .then((res) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(res.blob);
        setVideoUrl(objectUrl);
        setVideoExt(res.extension);
        setIsRecording(false);
        setRecordProgress(100);
      })
      .catch(() => {
        if (!cancelled) {
          setIsRecording(false);
          setRecordFailed(true);
        }
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [media.kind, media.videoPlan, media.aspectRatio, resolvedPhotoUrl, photoLoading]);

  const handleDownloadPhoto = async () => {
    if (!resolvedPhotoUrl || downloadingPng) return;
    setDownloadingPng(true);
    try {
      const pngBlob = await imageUrlToPngBlob(resolvedPhotoUrl, media.aspectRatio);
      const url = URL.createObjectURL(pngBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sako-ai-photo-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      const a = document.createElement('a');
      a.href = resolvedPhotoUrl;
      a.download = `sako-ai-photo-${Date.now()}.png`;
      a.click();
    } finally {
      setDownloadingPng(false);
    }
  };

  const handleDownloadVideo = () => {
    if (!videoUrl) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `sako-ai-video-${Date.now()}.${videoExt}`;
    a.click();
  };

  return (
    <div className="mt-3 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-zinc-50/80 dark:bg-[#0D0D11] p-3 sm:p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-7 h-7 rounded-lg bg-indigo-600/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            {media.kind === 'photo' ? (
              <ImageIcon className="w-4 h-4" />
            ) : (
              <Film className="w-4 h-4" />
            )}
          </span>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white truncate">
              {media.title}
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500 shrink-0" />
              <span>{t.mediaFreeBadge}</span>
            </div>
          </div>
        </div>

        {media.kind === 'photo' ? (
          resolvedPhotoUrl ? (
            <button
              type="button"
              onClick={() => void handleDownloadPhoto()}
              disabled={downloadingPng}
              className="min-h-[36px] px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              {downloadingPng ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{t.mediaDownloadPhoto}</span>
            </button>
          ) : null
        ) : videoUrl ? (
          <button
            type="button"
            onClick={handleDownloadVideo}
            className="min-h-[36px] px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.mediaDownloadVideo}</span>
          </button>
        ) : isRecording ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 text-xs font-medium">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>
              {t.mediaEncodingVideo} {recordProgress}%
            </span>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setIsPlayingPreview((p) => !p)}
            className="min-h-[36px] px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-800 dark:text-zinc-100 flex items-center gap-1.5"
          >
            {isPlayingPreview ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlayingPreview ? t.stop : t.mediaPlayPreview}</span>
          </button>
        )}
      </div>

      {media.kind === 'photo' && (
        <div
          className={`w-full ${aspectClass} overflow-hidden rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-[#09090B] flex items-center justify-center`}
        >
          {resolvedPhotoUrl ? (
            <img
              src={resolvedPhotoUrl}
              alt={media.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : photoLoading ? (
            <div className="p-6 text-center space-y-2 text-xs text-zinc-400">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400 mx-auto" />
              <div>
                {cooldownSec > 0
                  ? `${t.mediaCreatingPhoto} (${cooldownSec}s)`
                  : t.mediaCreatingPhoto}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-red-400">
              {photoError || 'Image unavailable'}
            </div>
          )}
        </div>
      )}

      {media.kind === 'video' && (
        <div
          className={`w-full ${aspectClass} overflow-hidden rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-[#09090B] relative`}
        >
          {videoUrl ? (
            <video
              src={videoUrl}
              controls
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <canvas ref={canvasRef} className="w-full h-full object-cover block" />
          )}
        </div>
      )}

      {recordFailed && (
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          {t.mediaLivePreviewOnly}
        </p>
      )}
    </div>
  );
};
