import type { FreeVideoPlan } from '../types/chat';

export function sanitizeSvgMarkup(rawSvg: string): string {
  const trimmed = (rawSvg || '').trim();
  const match = trimmed.match(/<svg[\s\S]*<\/svg>/i);
  let svg = match
    ? match[0]
    : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><rect width="1024" height="1024" fill="#09090B"/></svg>';

  svg = svg
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/<image[^>]*>/gi, '');

  if (!/\bxmlns=/.test(svg)) {
    svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  return svg;
}

export function getDimensionsForAspect(
  aspectRatio: '1:1' | '16:9' | '9:16',
  target: 'photo' | 'video'
): { width: number; height: number } {
  if (target === 'photo') {
    if (aspectRatio === '16:9') return { width: 1280, height: 720 };
    if (aspectRatio === '9:16') return { width: 720, height: 1280 };
    return { width: 1024, height: 1024 };
  }
  if (aspectRatio === '16:9') return { width: 960, height: 540 };
  if (aspectRatio === '1:1') return { width: 720, height: 720 };
  return { width: 540, height: 960 };
}

export async function loadImageElement(src: string): Promise<HTMLImageElement | null> {
  if (!src) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.referrerPolicy = 'no-referrer';
    if (!src.startsWith('data:') && !src.startsWith('blob:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function fetchFallbackImageAsDataUrl(
  url: string,
  onCooldownTick?: (secondsLeft: number) => void
): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const resp = await fetch(url, { referrerPolicy: 'no-referrer' });
    const ct = resp.headers.get('content-type') || '';
    if (resp.ok && ct.startsWith('image/')) {
      const blob = await resp.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Failed to read image'));
        reader.readAsDataURL(blob);
      });
    }

    let waitSec = 18;
    try {
      const json = (await resp.json()) as { error?: { message?: string } };
      const msg = json?.error?.message || '';
      const m = msg.match(/Retry after (\d+)s/i);
      if (m) waitSec = Math.min(50, Math.max(5, Number(m[1]) + 2));
    } catch {
      // keep default wait
    }

    if (attempt < 2) {
      for (let s = waitSec; s > 0; s--) {
        onCooldownTick?.(s);
        await new Promise((r) => setTimeout(r, 1000));
      }
      onCooldownTick?.(0);
    }
  }
  throw new Error('Image service busy, please try again in a moment.');
}

export async function imageUrlToPngBlob(
  src: string,
  aspectRatio: '1:1' | '16:9' | '9:16'
): Promise<Blob> {
  const img = await loadImageElement(src);
  if (!img) throw new Error('Image could not be loaded');

  const fallback = getDimensionsForAspect(aspectRatio, 'photo');
  const width = img.naturalWidth || fallback.width;
  const height = img.naturalHeight || fallback.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.drawImage(img, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to encode PNG'));
      },
      'image/png',
      1
    );
  });
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = (text || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length >= maxLines) break;
    }
  }
  if (current && lines.length < maxLines) {
    lines.push(current);
  }
  return lines;
}

export function drawVideoFrame(
  ctx: CanvasRenderingContext2D,
  plan: FreeVideoPlan,
  heroImage: HTMLImageElement | null,
  width: number,
  height: number,
  elapsedSec: number,
  sceneDurationSec = 2.0
) {
  const scenes =
    plan.scenes.length > 0 ? plan.scenes : [{ badge: 'SAKO AI', headline: 'SAKO AI', subline: '' }];
  const totalSec = scenes.length * sceneDurationSec;
  const wrappedTime = totalSec > 0 ? elapsedSec % totalSec : 0;
  const sceneIdx = Math.min(scenes.length - 1, Math.floor(wrappedTime / sceneDurationSec));
  const localT = (wrappedTime - sceneIdx * sceneDurationSec) / sceneDurationSec; // 0..1
  const scene = scenes[sceneIdx];

  const fadeAlpha = localT < 0.14 ? localT / 0.14 : localT > 0.88 ? (1 - localT) / 0.12 : 1;
  const easedAlpha = Math.max(0, Math.min(1, fadeAlpha));
  const accent = plan.accentColor || '#6366F1';

  ctx.save();
  ctx.fillStyle = plan.bgColor || '#09090B';
  ctx.fillRect(0, 0, width, height);

  // 1. Photorealistic background with cinematic Ken Burns zoom & pan per scene
  if (heroImage && heroImage.naturalWidth > 0) {
    const coverScale = Math.max(width / heroImage.naturalWidth, height / heroImage.naturalHeight);
    const motionZoom =
      sceneIdx % 2 === 0 ? 1.04 + localT * 0.1 : 1.14 - localT * 0.08;
    const panX =
      sceneIdx === 1
        ? (localT - 0.5) * 28
        : sceneIdx === 2
          ? (0.5 - localT) * 28
          : Math.sin(elapsedSec * 0.7) * 10;
    const drawW = heroImage.naturalWidth * coverScale * motionZoom;
    const drawH = heroImage.naturalHeight * coverScale * motionZoom;
    const drawX = (width - drawW) / 2 + panX;
    const drawY = (height - drawH) / 2;
    ctx.drawImage(heroImage, drawX, drawY, drawW, drawH);
  } else {
    const glowX = width * (0.5 + 0.16 * Math.sin(elapsedSec * 0.9));
    const glowY = height * (0.42 + 0.08 * Math.cos(elapsedSec * 0.7));
    const radGrad = ctx.createRadialGradient(
      glowX,
      glowY,
      10,
      glowX,
      glowY,
      Math.max(width, height) * 0.7
    );
    radGrad.addColorStop(0, `${accent}55`);
    radGrad.addColorStop(1, 'rgba(9,9,11,0)');
    ctx.fillStyle = radGrad;
    ctx.fillRect(0, 0, width, height);
  }

  // 2. Cinema contrast scrims (top + bottom)
  const topScrim = ctx.createLinearGradient(0, 0, 0, height * 0.25);
  topScrim.addColorStop(0, 'rgba(9,9,11,0.82)');
  topScrim.addColorStop(1, 'rgba(9,9,11,0)');
  ctx.fillStyle = topScrim;
  ctx.fillRect(0, 0, width, height * 0.25);

  const bottomScrim = ctx.createLinearGradient(0, height * 0.5, 0, height);
  bottomScrim.addColorStop(0, 'rgba(9,9,11,0)');
  bottomScrim.addColorStop(0.45, 'rgba(9,9,11,0.78)');
  bottomScrim.addColorStop(1, 'rgba(9,9,11,0.95)');
  ctx.fillStyle = bottomScrim;
  ctx.fillRect(0, height * 0.5, width, height * 0.5);

  // 3. Subtle theme atmospheric particles & lighting
  ctx.save();
  if (plan.theme === 'stadium') {
    for (let b = 0; b < 3; b++) {
      const ang = Math.sin(elapsedSec * 1.3 + b * 2.1) * 0.35;
      const sx = width * (0.2 + b * 0.3);
      ctx.fillStyle = `${accent}18`;
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx + Math.sin(ang - 0.16) * height, height);
      ctx.lineTo(sx + Math.sin(ang + 0.16) * height, height);
      ctx.closePath();
      ctx.fill();
    }
  }
  for (let p = 0; p < 18; p++) {
    const px = (Math.sin(p * 17.3 + elapsedSec * 0.45) * 0.5 + 0.5) * width;
    const py = height - ((elapsedSec * (26 + (p % 5) * 14) + p * 73) % (height + 40)) + 20;
    const radius = 1.4 + (p % 3) * 1.2;
    ctx.globalAlpha = 0.22 + 0.4 * Math.abs(Math.sin(elapsedSec * 1.7 + p));
    ctx.fillStyle = p % 3 === 0 ? '#FFFFFF' : accent;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Sleek outer border
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 2;
  ctx.strokeRect(14, 14, width - 28, height - 28);

  // 4. Scene badge & kinetic typography
  ctx.globalAlpha = easedAlpha;

  const badgeText = (scene.badge || 'SAKO AI').toUpperCase();
  const badgeFontSize = Math.max(13, Math.round(Math.min(width, height) * 0.025));
  ctx.font = `700 ${badgeFontSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
  const badgeWidth = Math.min(width - 64, ctx.measureText(badgeText).width + 34);
  const badgeH = badgeFontSize + 18;
  const badgeX = (width - badgeWidth) / 2;
  const badgeY = height * 0.065;

  ctx.fillStyle = 'rgba(9, 9, 11, 0.78)';
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeWidth, badgeH, badgeH / 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeText, width / 2, badgeY + badgeH / 2 + 1);

  const slideOffset = (1 - Math.min(1, localT * 3.5)) * 16;
  const headFontSize = Math.max(22, Math.round(Math.min(width, height) * 0.058));
  ctx.font = `800 ${headFontSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const headLines = wrapTextLines(ctx, scene.headline, width - 72, 2);
  let textY = height * 0.68 + slideOffset;
  for (const line of headLines) {
    ctx.fillText(line, width / 2, textY);
    textY += headFontSize * 1.18;
  }

  if (scene.subline) {
    const subFontSize = Math.max(14, Math.round(Math.min(width, height) * 0.032));
    ctx.font = `500 ${subFontSize}px "DM Sans", system-ui, sans-serif`;
    ctx.fillStyle = '#E4E4E7';
    const subLines = wrapTextLines(ctx, scene.subline, width - 80, 2);
    textY += 8;
    for (const line of subLines) {
      ctx.fillText(line, width / 2, textY);
      textY += subFontSize * 1.28;
    }
  }

  const footFontSize = Math.max(11, Math.round(Math.min(width, height) * 0.022));
  ctx.font = `600 ${footFontSize}px "JetBrains Mono", monospace`;
  ctx.fillStyle = 'rgba(255,255,255,0.62)';
  ctx.textBaseline = 'bottom';
  ctx.fillText('SAKO AI · sako-ai.ai.studio', width / 2, height - 22);

  ctx.restore();
}

export interface RecordedVideoResult {
  blob: Blob;
  mimeType: string;
  extension: 'mp4' | 'webm';
}

export async function recordFreeVideoBlob(
  plan: FreeVideoPlan,
  aspectRatio: '9:16' | '16:9' | '1:1',
  heroSrc?: string,
  onProgress?: (pct: number) => void
): Promise<RecordedVideoResult> {
  const { width, height } = getDimensionsForAspect(aspectRatio, 'video');
  const heroImage = heroSrc ? await loadImageElement(heroSrc) : null;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D not supported');

  const sceneDurationSec = 2.0;
  const totalSec = Math.max(2, plan.scenes.length) * sceneDurationSec;
  const fps = 30;

  const canvasStream = canvas.captureStream(fps);
  const combinedStream = new MediaStream(canvasStream.getVideoTracks());

  let audioCtx: AudioContext | null = null;
  let audioTimer: number | null = null;
  try {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (Ctor) {
      audioCtx = new Ctor();
      const dest = audioCtx.createMediaStreamDestination();
      const masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.14;
      masterGain.connect(dest);

      const chordRoots = [220, 174.61, 261.63, 196];
      let step = 0;
      const triggerChord = () => {
        if (!audioCtx || audioCtx.state === 'closed') return;
        const root = chordRoots[step % chordRoots.length];
        step++;
        const now = audioCtx.currentTime;
        [root, root * 1.25, root * 1.5].forEach((freq) => {
          if (!audioCtx) return;
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.001, now);
          gain.gain.exponentialRampToValueAtTime(0.25, now + 0.15);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.85);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now);
          osc.stop(now + 1.9);
        });
      };

      triggerChord();
      audioTimer = window.setInterval(triggerChord, sceneDurationSec * 1000);
      for (const track of dest.stream.getAudioTracks()) {
        combinedStream.addTrack(track);
      }
    }
  } catch {
    // Silent video stream fallback
  }

  const mimeCandidates = [
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];
  const chosenMime =
    typeof MediaRecorder !== 'undefined'
      ? mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) || ''
      : '';

  if (typeof MediaRecorder === 'undefined') {
    throw new Error('MediaRecorder is not supported in this browser');
  }

  const recorder = chosenMime
    ? new MediaRecorder(combinedStream, { mimeType: chosenMime, videoBitsPerSecond: 2_500_000 })
    : new MediaRecorder(combinedStream, { videoBitsPerSecond: 2_500_000 });

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  return new Promise<RecordedVideoResult>((resolve, reject) => {
    const startMs = performance.now();
    let rafId = 0;

    const cleanup = () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (audioTimer !== null) window.clearInterval(audioTimer);
      if (audioCtx && audioCtx.state !== 'closed') {
        void audioCtx.close().catch(() => {});
      }
      combinedStream.getTracks().forEach((t) => t.stop());
    };

    recorder.onerror = () => {
      cleanup();
      reject(new Error('Video recording failed'));
    };

    recorder.onstop = () => {
      cleanup();
      const finalMime = recorder.mimeType || chosenMime || 'video/webm';
      const blob = new Blob(chunks, { type: finalMime });
      resolve({
        blob,
        mimeType: finalMime,
        extension: finalMime.includes('mp4') ? 'mp4' : 'webm',
      });
    };

    const tick = () => {
      const elapsedSec = (performance.now() - startMs) / 1000;
      const pct = Math.min(99, Math.round((elapsedSec / totalSec) * 100));
      onProgress?.(pct);
      drawVideoFrame(ctx, plan, heroImage, width, height, elapsedSec, sceneDurationSec);

      if (elapsedSec >= totalSec) {
        onProgress?.(100);
        if (recorder.state === 'recording') {
          recorder.stop();
        }
        return;
      }
      rafId = requestAnimationFrame(tick);
    };

    drawVideoFrame(ctx, plan, heroImage, width, height, 0, sceneDurationSec);
    recorder.start(200);
    rafId = requestAnimationFrame(tick);
  });
}
