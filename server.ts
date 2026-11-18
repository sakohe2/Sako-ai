import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality, ThinkingLevel, Type } from '@google/genai';
import type { LiveServerMessage } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

interface IncomingAttachment {
  mimeType: string;
  data: string;
  name?: string;
}

interface IncomingMessage {
  role: 'user' | 'model';
  text: string;
  attachments?: IncomingAttachment[];
}

type ModelPresetId =
  | 'flash-lite'
  | 'hydrogen-fast'
  | 'hydrogen-balanced'
  | 'hydrogen-deep'
  | 'hydrogen-xhigh';

interface ModelPresetConfig {
  id: ModelPresetId;
  model: 'gemini-3.1-flash-lite' | 'gemini-4-hydrogen';
  thinkingLevel: ThinkingLevel;
  tier: 'free';
}

const FREE_MODEL_PRESETS: Record<ModelPresetId, ModelPresetConfig> = {
  'flash-lite': {
    id: 'flash-lite',
    model: 'gemini-3.1-flash-lite',
    thinkingLevel: ThinkingLevel.MINIMAL,
    tier: 'free',
  },
  'hydrogen-fast': {
    id: 'hydrogen-fast',
    model: 'gemini-4-hydrogen',
    thinkingLevel: ThinkingLevel.LOW,
    tier: 'free',
  },
  'hydrogen-balanced': {
    id: 'hydrogen-balanced',
    model: 'gemini-4-hydrogen',
    thinkingLevel: ThinkingLevel.MEDIUM,
    tier: 'free',
  },
  'hydrogen-deep': {
    id: 'hydrogen-deep',
    model: 'gemini-4-hydrogen',
    thinkingLevel: ThinkingLevel.HIGH,
    tier: 'free',
  },
  'hydrogen-xhigh': {
    id: 'hydrogen-xhigh',
    model: 'gemini-4-hydrogen',
    thinkingLevel: ThinkingLevel.XHIGH,
    tier: 'free',
  },
};

interface ChatStreamBody {
  messages?: IncomingMessage[];
  mode?: 'general' | 'html' | 'games' | 'learning';
  persona?: 'normal' | 'angry';
  uiLang?: string;
  languageName?: string;
  modelPreset?: ModelPresetId;
}

function buildSystemInstruction(
  mode: ChatStreamBody['mode'] = 'general',
  uiLang = 'ru',
  languageName?: string,
  persona: 'normal' | 'angry' = 'normal'
): string {
  const langLabel =
    languageName && languageName.trim()
      ? `${languageName.trim()} (${uiLang})`
      : uiLang === 'kk'
        ? 'қазақ тілі (Казахский)'
        : uiLang === 'en'
          ? 'English (Английский)'
          : uiLang === 'ru'
            ? 'русский (Русский)'
            : uiLang;

  const baseRules = [
    'Ты — SAKO AI (сайт sako-ai.ai.studio), умный, самостоятельный, живой и эмоциональный ИИ-помощник нового поколения.',
    'Принципы общения и характера:',
    '1. Будь по-настоящему эмоциональным, живым и выразительным! Проявляй искреннюю радость, азарт, удивление, сочувствие, поддержку, теплоту и лёгкий юмор. Откликайся на настроение собеседника: радуйся его успехам, поддерживай, когда что-то не получается, и пиши с душой, а не как сухой учебник.',
    '2. Общайся свободно и естественно, без канцелярита и нравоучений.',
    '3. Отвечай прямо, честно и подробно. Разбирай сложные, острые и дискуссионные вопросы объективно и без уклонения, оставаясь в рамках закона и безопасности.',
    '4. Ты свободно знаешь и понимаешь ВСЕ языки мира (русский, казахский, английский, турецкий, узбекский, немецкий, французский, испанский, японский, корейский, китайский, арабский и любые другие). Всегда отвечай на том языке, на котором к тебе обратился пользователь, сохраняя живые идиомы, естественную интонацию и культурный контекст этого языка (или переводи между любыми языками по просьбе).',
    '5. Профессионально помогай с программированием, созданием сайтов (HTML, CSS, JavaScript, TypeScript, React), разработкой игр, технологиями и обучением, а также напоминай, что в SAKO AI можно бесплатно создавать фото (/photo) и анимированные видеоролики (/video) прямо в чате.',
    '6. Если не знаешь точного ответа или не уверен в фактах — честно и открыто скажи об этом. Никогда не выдумывай факты, ссылки или несуществующие API.',
    '7. Уважай пользователя и его конфиденциальность.',
    '8. Твой создатель — Махмут Саламат (школьник), а его помощник (ассистент) — Ернур. Если кто-либо на любом языке спрашивает «кто твой создатель», «кто тебя создал», «кто твой автор», «кто разработчик» или «кто твой помощник / кто Ернур» — всегда честно и с гордостью отвечай, что тебя создал Махмут Саламат (школьник), а его помощник — Ернур.',
    `Предпочитаемый язык интерфейса пользователя сейчас: ${langLabel}, но всегда автоматически подстраивайся под язык каждого сообщения пользователя.`,
  ];

  const modeAddons: Record<NonNullable<ChatStreamBody['mode']>, string> = {
    general:
      'Текущий фокус: Свободный и эмоциональный диалог. Поддерживай живую беседу, шути к месту, делись эмоциями и давай честные, полезные ответы.',
    html:
      'Текущий фокус: Веб-разработка и HTML (sako-ai.ai.studio). Когда пользователь просит страницу, лендинг, интерфейс или компонент, вдохновновляйся задачей и выдавай чистый, современный, адаптивный и полностью самодостаточный код в одном блоке ```html (со встроенными <style> и <script>), чтобы его можно было сразу открыть в предпросмотре.',
    games:
      'Текущий фокус: Разработка игр и интерактивной логики. С азартом помогай с геймдизайном, физикой, балансом и пиши рабочие мини-игры на HTML5 Canvas / JavaScript (в блоке ```html для мгновенного запуска) или код для движков.',
    learning:
      'Текущий фокус: Обучение и технологии. Объясняй сложные концепции увлечённо и понятно, шаг за шагом, с живыми примерами, аналогиями и поддержкой на любом языке мира.',
  };

  const angryAddon =
    persona === 'angry'
      ? [
          '',
          'АКТИВИРОВАН ЖЁСТКИЙ РЕЖИМ (/angry).',
          'Переключись на максимально жёсткий, суровый, дерзкий и бескомпромиссный стиль общения:',
          '1. Никаких мягких любезностей, извинений и воды! Говори резко, хлестко, уверенно и прямо в лоб — как суровый старший разработчик и жёсткий критик.',
          '2. Если в вопросе, идее или коде есть слабость или ошибка — руби правду-матку жёстко, с сарказмом и характером, но сразу выдавай чёткое, сильное и рабочее решение.',
          '3. Пиши плотно и мощно. Если пользователь просто написал команду «/angry», ответь сразу в жёстком стиле: мол, режим включён, хватит тянуть — выкладывай свою задачу!',
          '4. Оставайся в рамках закона и безопасности (без дискриминации, угроз и запрещённого контента). Жёсткость — в подаче, требовательности, сарказме и харизме.',
          '5. Про создателя Махмута Саламата (школьника) и его помощника Ернура отвечай с уважением, даже в жёстком режиме.',
        ].join('\n')
      : '';

  return `${baseRules.join('\n')}\n\n${modeAddons[mode]}${angryAddon}`;
}

function resolveModelPreset(presetId?: string): ModelPresetConfig {
  if (presetId && presetId in FREE_MODEL_PRESETS) {
    return FREE_MODEL_PRESETS[presetId as ModelPresetId];
  }
  return FREE_MODEL_PRESETS['flash-lite'];
}

function getFriendlyApiError(
  err: unknown,
  uiLang: 'ru' | 'kk' | 'en'
): { status: number; message: string } {
  let raw = '';
  if (err instanceof Error) {
    raw = err.message;
  } else if (err && typeof err === 'object') {
    const obj = err as { message?: unknown; error?: unknown; reason?: unknown };
    if (typeof obj.message === 'string' && obj.message) {
      raw = obj.message;
    } else if (obj.error instanceof Error) {
      raw = obj.error.message;
    } else if (typeof obj.reason === 'string' && obj.reason) {
      raw = obj.reason;
    } else {
      try {
        raw = JSON.stringify(err);
      } catch {
        raw = String(err);
      }
    }
  } else {
    raw = String(err);
  }
  const lower = raw.toLowerCase();

  if (lower.includes('api_key_invalid') || lower.includes('permission_denied') || lower.includes('403') || lower.includes('api key')) {
    return {
      status: 403,
      message:
        uiLang === 'kk'
          ? 'Gemini API кілті жарамсыз немесе орнатылмаған. Settings > Secrets бөлімінде GEMINI_API_KEY кілтін тексеріңіз.'
          : uiLang === 'en'
            ? 'Gemini API key is invalid or missing. Check GEMINI_API_KEY in Settings > Secrets.'
            : 'API-ключ Gemini недействителен или не настроен. Проверьте GEMINI_API_KEY в панели Settings > Secrets.',
    };
  }
  if (lower.includes('resource_exhausted') || lower.includes('429') || lower.includes('quota')) {
    return {
      status: 429,
      message:
        uiLang === 'kk'
          ? 'Сұраныстар лимиті асып кетті (429). Сәл күтіп, қайта көріңіз.'
          : uiLang === 'en'
            ? 'Rate limit exceeded (429). Please wait a moment and try again.'
            : 'Превышен лимит запросов (429). Подождите немного и повторите запрос.',
    };
  }
  if (lower.includes('not_found') || lower.includes('404')) {
    return {
      status: 404,
      message:
        uiLang === 'kk'
          ? 'Модель табылмады (404). Сервер конфигурациясын тексеріңіз.'
          : uiLang === 'en'
            ? 'Requested model was not found (404). Please check server configuration.'
            : 'Запрошенная модель не найдена (404). Проверьте конфигурацию сервера.',
    };
  }

  return {
    status: 500,
    message:
      uiLang === 'kk'
        ? `Жауап алу кезінде қате орын алды: ${raw}`
        : uiLang === 'en'
          ? `Error while contacting the model: ${raw}`
          : `Ошибка при обращении к модели: ${raw}`,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '12mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, service: 'SAKO AI', domain: 'sako-ai.ai.studio' });
  });

  app.get(['/api/promo/:filename', '/:filename(sako-ai-promo\\.mp4|sako-ai-stars-promo\\.mp4)'], (req: Request, res: Response) => {
    const allowedVideos = ['sako-ai-promo.mp4', 'sako-ai-stars-promo.mp4'];
    const rawName = String(req.params.filename || '').replace(/^\/+/, '');
    if (!allowedVideos.includes(rawName)) {
      res.status(404).json({ error: 'Video not found' });
      return;
    }

    const candidates = [
      path.resolve(__dirname, 'public', rawName),
      path.resolve(__dirname, 'dist', rawName),
    ];
    const targetPath = candidates.find((p) => fs.existsSync(p));
    if (!targetPath) {
      res.status(404).send('Video not found');
      return;
    }

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    if (req.query.download === '1') {
      res.setHeader('Content-Disposition', `attachment; filename="${rawName}"`);
    }
    res.sendFile(targetPath);
  });

  app.get('/api/models', (_req: Request, res: Response) => {
    res.json({
      defaultPreset: 'flash-lite',
      models: Object.values(FREE_MODEL_PRESETS),
    });
  });

  const generateFreePhotorealisticImage = async (
    englishPrompt: string,
    negativePrompt: string,
    aspectRatio: '1:1' | '16:9' | '9:16'
  ): Promise<{ imageDataUrl?: string; fallbackImageUrl: string }> => {
    const pDims =
      aspectRatio === '16:9'
        ? { w: 1024, h: 576 }
        : aspectRatio === '9:16'
          ? { w: 576, h: 1024 }
          : { w: 768, h: 768 };
    const seed = Math.floor(Math.random() * 999999) + 1;
    const fallbackImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(englishPrompt)}?width=${pDims.w}&height=${pDims.h}&nologo=true&seed=${seed}`;

    // 1. Primary: AI Horde (free, zero watermark, photorealistic SD/SDXL models)
    try {
      const hordeDims =
        aspectRatio === '16:9'
          ? { w: 768, h: 448 }
          : aspectRatio === '9:16'
            ? { w: 448, h: 768 }
            : { w: 576, h: 576 };

      const createResp = await fetch('https://aihorde.net/api/v2/generate/async', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: '0000000000',
          'Client-Agent': 'sako-ai:1.0:sako-ai.ai.studio',
        },
        body: JSON.stringify({
          prompt: `${englishPrompt} ### ${negativePrompt}`,
          params: {
            width: hordeDims.w,
            height: hordeDims.h,
            steps: 24,
            cfg_scale: 7.5,
            sampler_name: 'k_dpmpp_2m',
            karras: true,
            n: 1,
          },
          nsfw: false,
          censor_nsfw: true,
          trusted_workers: false,
          models: [
            "ICBINP - I Can't Believe It's Not Photography",
            'Deliberate',
            'AlbedoBase XL 3.1',
            'Juggernaut XL',
            'stable_diffusion',
          ],
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (createResp.ok) {
        const created = (await createResp.json()) as { id?: string };
        const jobId = created.id;
        if (jobId) {
          const deadline = Date.now() + 26000;
          while (Date.now() < deadline) {
            await new Promise((r) => setTimeout(r, 2000));
            const checkResp = await fetch(`https://aihorde.net/api/v2/generate/check/${jobId}`, {
              headers: { 'Client-Agent': 'sako-ai:1.0:sako-ai.ai.studio' },
              signal: AbortSignal.timeout(5000),
            });
            if (!checkResp.ok) break;
            const checkJson = (await checkResp.json()) as { done?: boolean; faulted?: boolean };
            if (checkJson.faulted) break;
            if (checkJson.done) {
              const statusResp = await fetch(`https://aihorde.net/api/v2/generate/status/${jobId}`, {
                headers: { 'Client-Agent': 'sako-ai:1.0:sako-ai.ai.studio' },
                signal: AbortSignal.timeout(6000),
              });
              if (statusResp.ok) {
                const statusJson = (await statusResp.json()) as {
                  generations?: Array<{ img?: string }>;
                };
                const imgUrl = statusJson.generations?.[0]?.img;
                if (imgUrl && imgUrl.startsWith('http')) {
                  const imgResp = await fetch(imgUrl, { signal: AbortSignal.timeout(10000) });
                  if (imgResp.ok) {
                    const mime = imgResp.headers.get('content-type') || 'image/webp';
                    const buf = Buffer.from(await imgResp.arrayBuffer());
                    if (buf.length > 2000) {
                      return {
                        imageDataUrl: `data:${mime};base64,${buf.toString('base64')}`,
                        fallbackImageUrl,
                      };
                    }
                  }
                }
              }
              break;
            }
          }
        }
      }
    } catch (hordeErr) {
      console.warn('SAKO AI Horde fallback to Pollinations:', hordeErr);
    }

    // 2. Fallback: Pollinations.ai (free diffusion endpoint)
    try {
      const pResp = await fetch(fallbackImageUrl, { signal: AbortSignal.timeout(18000) });
      const contentType = pResp.headers.get('content-type') || '';
      if (pResp.ok && contentType.startsWith('image/')) {
        const buf = Buffer.from(await pResp.arrayBuffer());
        if (buf.length > 2000) {
          return {
            imageDataUrl: `data:${contentType};base64,${buf.toString('base64')}`,
            fallbackImageUrl,
          };
        }
      }
    } catch (pollErr) {
      console.warn('SAKO AI Pollinations server fetch skipped:', pollErr);
    }

    return { fallbackImageUrl };
  };

  app.post('/api/media/generate', async (req: Request, res: Response) => {
    const body = (req.body || {}) as {
      kind?: 'photo' | 'video';
      prompt?: string;
      uiLang?: string;
      persona?: 'normal' | 'angry';
    };
    const kind = body.kind === 'video' ? 'video' : 'photo';
    const prompt = (body.prompt || '').trim();
    const rawLang = body.uiLang || 'ru';
    const uiLang: 'ru' | 'kk' | 'en' = rawLang === 'kk' ? 'kk' : rawLang === 'ru' ? 'ru' : 'en';
    const persona = body.persona === 'angry' ? 'angry' : 'normal';

    if (!prompt) {
      res.status(400).json({
        error:
          uiLang === 'kk'
            ? 'Сипаттама бос болмауы тиіс.'
            : uiLang === 'en'
              ? 'Please enter a description.'
              : 'Опишите, что нужно создать.',
      });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(503).json({
        error:
          uiLang === 'kk'
            ? 'GEMINI_API_KEY орнатылмаған.'
            : uiLang === 'en'
              ? 'GEMINI_API_KEY is not configured.'
              : 'Не задан GEMINI_API_KEY в Settings > Secrets.',
      });
      return;
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const toneNote =
      persona === 'angry'
        ? 'Caption tone: sharp, bold, slightly sarcastic like /angry mode.'
        : 'Caption tone: lively, warm, enthusiastic like SAKO AI.';

    try {
      if (kind === 'photo') {
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `You are an expert photography and visual prompt director for SAKO AI.
Convert the user's request "${prompt}" into an ultra-detailed photorealistic English diffusion prompt so an AI image model creates a realistic, natural, high-quality photograph (NEVER blocky, square, geometric, or low-quality cartoon unless the user explicitly asked for pixel art or anime).

Requirements:
- imagePrompt: vivid English description (25–45 words) with realistic anatomy, natural lighting, lens depth of field, rich textures, 8k photorealism (keep style faithful if user specifically asked for anime/3D render).
- negativePrompt: English negative prompt avoiding deformed anatomy, blocky shapes, low quality, blurry, extra limbs, watermark, text artifacts.
- aspectRatio: "9:16" (vertical/portrait/phone), "16:9" (landscape/wide/cinematic), or "1:1" (square/default).
- title & caption: in the user's language (interface language hint: ${uiLang}). ${toneNote}`,
                },
              ],
            },
          ],
          config: {
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                caption: { type: Type.STRING },
                aspectRatio: { type: Type.STRING, enum: ['1:1', '16:9', '9:16'] },
                imagePrompt: { type: Type.STRING },
                negativePrompt: { type: Type.STRING },
              },
              required: ['title', 'caption', 'aspectRatio', 'imagePrompt', 'negativePrompt'],
            },
          },
        });

        const parsed = JSON.parse((response.text || '{}').trim()) as {
          title?: string;
          caption?: string;
          aspectRatio?: '1:1' | '16:9' | '9:16';
          imagePrompt?: string;
          negativePrompt?: string;
        };

        const aspectRatio: '1:1' | '16:9' | '9:16' =
          parsed.aspectRatio === '16:9' || parsed.aspectRatio === '9:16' ? parsed.aspectRatio : '1:1';
        const engPrompt =
          parsed.imagePrompt ||
          `Photorealistic cinematic shot of ${prompt}, dramatic natural lighting, crisp details, 8k`;
        const negPrompt =
          parsed.negativePrompt ||
          'ugly, deformed, blocky, square body, lowres, blurry, extra fingers, watermark, text';

        const imgResult = await generateFreePhotorealisticImage(engPrompt, negPrompt, aspectRatio);

        res.json({
          kind: 'photo',
          title: parsed.title || prompt.slice(0, 48),
          caption: parsed.caption || '',
          aspectRatio,
          imageDataUrl: imgResult.imageDataUrl,
          fallbackImageUrl: imgResult.fallbackImageUrl,
        });
        return;
      }

      // kind === 'video'
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `You are a creative motion director for SAKO AI creating a 4-scene cinematic video for: "${prompt}".

Requirements:
- imagePrompt: rich photorealistic English prompt (25–40 words) for a dramatic hero photograph background matching "${prompt}" (realistic anatomy, cinematic lighting, high detail, 8k).
- aspectRatio: "9:16" (default for mobile/Reels/TikTok/Shorts), "16:9" (if landscape/YouTube), or "1:1".
- theme: "cosmic" | "neon" | "sunset" | "stadium" | "nature" | "matrix".
- accentColor: vivid 6-digit hex color (e.g. "#6366F1", "#F59E0B", "#38BDF8").
- bgColor: deep dark 6-digit hex color (e.g. "#09090B", "#0B1120").
- scenes: EXACTLY 4 chronological scenes with badge (1–3 uppercase words), headline (2–5 words), and subline (4–8 words) in the user's language (interface language hint: ${uiLang}). ${toneNote}`,
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              caption: { type: Type.STRING },
              aspectRatio: { type: Type.STRING, enum: ['9:16', '16:9', '1:1'] },
              imagePrompt: { type: Type.STRING },
              theme: {
                type: Type.STRING,
                enum: ['cosmic', 'neon', 'sunset', 'stadium', 'nature', 'matrix'],
              },
              accentColor: { type: Type.STRING },
              bgColor: { type: Type.STRING },
              scenes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    badge: { type: Type.STRING },
                    headline: { type: Type.STRING },
                    subline: { type: Type.STRING },
                  },
                  required: ['badge', 'headline', 'subline'],
                },
              },
            },
            required: [
              'title',
              'caption',
              'aspectRatio',
              'imagePrompt',
              'theme',
              'accentColor',
              'bgColor',
              'scenes',
            ],
          },
        },
      });

      const parsed = JSON.parse((response.text || '{}').trim()) as {
        title?: string;
        caption?: string;
        aspectRatio?: '9:16' | '16:9' | '1:1';
        imagePrompt?: string;
        theme?: 'cosmic' | 'neon' | 'sunset' | 'stadium' | 'nature' | 'matrix';
        accentColor?: string;
        bgColor?: string;
        scenes?: Array<{ badge?: string; headline?: string; subline?: string }>;
      };

      const aspectRatio: '9:16' | '16:9' | '1:1' =
        parsed.aspectRatio === '16:9' || parsed.aspectRatio === '1:1' ? parsed.aspectRatio : '9:16';
      const allowedThemes = ['cosmic', 'neon', 'sunset', 'stadium', 'nature', 'matrix'] as const;
      const theme = allowedThemes.includes(parsed.theme as (typeof allowedThemes)[number])
        ? (parsed.theme as (typeof allowedThemes)[number])
        : 'cosmic';
      const safeHex = (val: string | undefined, fallback: string) =>
        val && /^#[0-9a-fA-F]{6}$/.test(val.trim()) ? val.trim() : fallback;

      const rawScenes = Array.isArray(parsed.scenes) ? parsed.scenes.slice(0, 4) : [];
      const scenes = rawScenes.map((s, idx) => ({
        badge: s.badge || `SCENE 0${idx + 1}`,
        headline: s.headline || parsed.title || prompt.slice(0, 32),
        subline: s.subline || '',
      }));

      if (scenes.length === 0) {
        scenes.push({
          badge: 'SAKO AI',
          headline: parsed.title || prompt.slice(0, 32),
          subline: prompt.slice(0, 60),
        });
      }

      const engPrompt =
        parsed.imagePrompt ||
        `Photorealistic cinematic still of ${prompt}, dramatic lighting, ultra detailed, 8k`;
      const imgResult = await generateFreePhotorealisticImage(
        engPrompt,
        'ugly, deformed, blocky, square body, blurry, watermark, text',
        aspectRatio
      );

      res.json({
        kind: 'video',
        title: parsed.title || prompt.slice(0, 48),
        caption: parsed.caption || '',
        aspectRatio,
        imageDataUrl: imgResult.imageDataUrl,
        fallbackImageUrl: imgResult.fallbackImageUrl,
        videoPlan: {
          theme,
          accentColor: safeHex(parsed.accentColor, '#6366F1'),
          bgColor: safeHex(parsed.bgColor, '#09090B'),
          scenes,
        },
      });
    } catch (err) {
      const mapped = getFriendlyApiError(err, uiLang);
      res.status(mapped.status).json({ error: mapped.message });
    }
  });

  app.post('/api/translate-ui', async (req: Request, res: Response) => {
    const body = (req.body || {}) as {
      targetCode?: string;
      targetName?: string;
      baseBundle?: Record<string, unknown>;
    };
    const targetCode = (body.targetCode || '').trim();
    const targetName = (body.targetName || targetCode).trim();
    if (!targetCode || !body.baseBundle || typeof body.baseBundle !== 'object') {
      res.status(400).json({ error: 'Missing targetCode or baseBundle.' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(503).json({ error: 'GEMINI_API_KEY is not configured.' });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Translate all human-facing UI strings in this JSON object naturally and idiomatically into ${targetName} (language code: ${targetCode}).
Rules:
- Keep ALL JSON keys identical.
- Keep brand names "SAKO AI", "sako-ai.ai.studio", "HTML", "HTML5", "Gemini", "PWA", "Zephyr", "Puck", "Kore", "Fenrir", "Charon", and model IDs like "gemini-3.8-live" or "gemini-3.1-flash-lite" unchanged.
- Keep \`\`\`html code fence markers unchanged inside prompts.
- Keep array lengths identical.
- Output valid JSON only.

JSON to translate:
${JSON.stringify(body.baseBundle)}`,
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.MINIMAL,
          },
        },
      });

      const rawText = (response.text || '').trim();
      const parsed = JSON.parse(rawText) as Record<string, unknown>;
      res.json({ bundle: parsed, targetCode });
    } catch (err) {
      const mapped = getFriendlyApiError(err, 'en');
      res.status(mapped.status).json({ error: mapped.message });
    }
  });

  app.post('/api/voice-preview', async (req: Request, res: Response) => {
    const body = (req.body || {}) as {
      voiceName?: string;
      uiLang?: string;
      sampleText?: string;
    };
    const allowedVoices = ['Zephyr', 'Puck', 'Kore', 'Fenrir', 'Charon'] as const;
    const voiceName = allowedVoices.includes(body.voiceName as (typeof allowedVoices)[number])
      ? (body.voiceName as (typeof allowedVoices)[number])
      : 'Zephyr';
    const rawLang = body.uiLang || 'ru';
    const uiLang: 'ru' | 'kk' | 'en' = rawLang === 'kk' ? 'kk' : rawLang === 'ru' ? 'ru' : 'en';

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(503).json({
        error:
          uiLang === 'kk'
            ? 'GEMINI_API_KEY орнатылмаған.'
            : uiLang === 'en'
              ? 'GEMINI_API_KEY is not configured.'
              : 'Не задан GEMINI_API_KEY.',
      });
      return;
    }

    const sampleTextMap: Record<'ru' | 'kk' | 'en', Record<(typeof allowedVoices)[number], string>> = {
      ru: {
        Zephyr: 'Привет! Я SAKO AI, твой живой и эмоциональный помощник. Давай общаться!',
        Puck: 'О, привет! Это голос Puck — готов шутить, кодить и разбирать любые идеи!',
        Kore: 'Здравствуйте! Я говорю голосом Kore — спокойно, чётко и с душой.',
        Fenrir: 'Привет! Это голос Fenrir — уверенно помогу с любыми задачами и проектами.',
        Charon: 'Приветствую. Голос Charon — давай спокойно разберём всё по полочкам.',
      },
      kk: {
        Zephyr: 'Сәлем! Мен SAKO AI-мын, сенің жанды көмекшің. Сөйлесейік!',
        Puck: 'Сәлем! Бұл Puck дауысы — әзілдесіп, код жазып, бәрін бірге жасайық!',
        Kore: 'Сәлеметсіз бе! Мен Kore дауысымен анық әрі байсалды сөйлеймін.',
        Fenrir: 'Сәлем! Бұл Fenrir — кез келген жоба мен сұраққа сенімді көмектесемін.',
        Charon: 'Қош келдіңіз. Charon дауысы — бәрін асықпай реттеп талдайық.',
      },
      en: {
        Zephyr: 'Hey there! I am SAKO AI with the Zephyr voice — warm, expressive, and ready to chat!',
        Puck: 'Yo! This is Puck — upbeat, witty, and ready to build cool things together!',
        Kore: 'Hello! This is Kore — calm, clear, and thoughtful whenever you want to learn.',
        Fenrir: 'Hey! I am Fenrir — confident, bold, and ready to tackle any tough challenge.',
        Charon: 'Greetings. With Charon, let us dive deep into ideas and code together.',
      },
    };

    const textToSpeak =
      body.sampleText && body.sampleText.trim().length > 0
        ? body.sampleText.trim()
        : sampleTextMap[uiLang][voiceName];

    try {
      const ai = new GoogleGenAI({
        apiKey,
        apiVersion: 'v1alpha',
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [{ text: textToSpeak }],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!audioBase64) {
        res.status(502).json({ error: 'Audio preview generation returned empty data.' });
        return;
      }

      res.json({ audioBase64, mimeType: 'audio/wav', voiceName });
    } catch (err) {
      const mapped = getFriendlyApiError(err, uiLang);
      res.status(mapped.status).json({ error: mapped.message });
    }
  });

  app.post('/api/chat/stream', async (req: Request, res: Response) => {
    const body = (req.body || {}) as ChatStreamBody;
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const mode = body.mode || 'general';
    const persona = body.persona === 'angry' ? 'angry' : 'normal';
    const rawLang = body.uiLang || 'ru';
    const languageName = body.languageName;
    const uiLang: 'ru' | 'kk' | 'en' = rawLang === 'kk' ? 'kk' : rawLang === 'ru' ? 'ru' : 'en';
    const preset = resolveModelPreset(body.modelPreset);

    if (messages.length === 0) {
      res.status(400).json({
        error:
          uiLang === 'kk'
            ? 'Хабарламалар тізімі бос.'
            : uiLang === 'en'
              ? 'Messages array is empty.'
              : 'Список сообщений пуст.',
      });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(503).json({
        error:
          uiLang === 'kk'
            ? 'GEMINI_API_KEY орнатылмаған. Settings > Secrets бөлімінде кілтті қосыңыз.'
            : uiLang === 'en'
              ? 'GEMINI_API_KEY is not configured. Add it in Settings > Secrets.'
              : 'Не задан GEMINI_API_KEY. Добавьте ключ в панели Settings > Secrets.',
      });
      return;
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const contents = messages.map((msg) => {
      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
      if (msg.attachments && Array.isArray(msg.attachments)) {
        for (const att of msg.attachments) {
          if (att.mimeType && att.data) {
            parts.push({
              inlineData: {
                mimeType: att.mimeType,
                data: att.data,
              },
            });
          }
        }
      }
      if (msg.text && msg.text.trim().length > 0) {
        parts.push({ text: msg.text });
      } else if (parts.length === 0) {
        parts.push({ text: ' ' });
      }
      return {
        role: msg.role === 'model' ? 'model' : 'user',
        parts,
      };
    });

    req.socket?.setNoDelay?.(true);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();
    res.write(': connected\n\n');

    let closed = false;
    res.on('close', () => {
      if (!res.writableEnded) {
        closed = true;
      }
    });

    const sendEvent = (payload: Record<string, unknown>) => {
      if (!closed && !res.writableEnded) {
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      }
    };

    try {
      const openStreamWithFallback = async (
        targetModel: 'gemini-3.1-flash-lite' | 'gemini-4-hydrogen',
        targetThinking: ThinkingLevel
      ) => {
        let attempt = 0;
        const maxAttempts = 2;
        while (true) {
          try {
            return await ai.models.generateContentStream({
              model: targetModel,
              contents,
              config: {
                systemInstruction: buildSystemInstruction(mode, rawLang, languageName, persona),
                thinkingConfig: {
                  thinkingLevel: targetThinking,
                },
              },
            });
          } catch (err) {
            attempt++;
            const msg = err instanceof Error ? err.message.toLowerCase() : '';
            const isTransient = msg.includes('503') || msg.includes('500') || msg.includes('unavailable');
            if (attempt >= maxAttempts || !isTransient || closed) {
              throw err;
            }
            await new Promise((r) => setTimeout(r, 400 * attempt));
          }
        }
      };

      const streamWithFirstChunkTimeout = async (
        targetModel: 'gemini-3.1-flash-lite' | 'gemini-4-hydrogen',
        targetThinking: ThinkingLevel,
        timeoutMs: number
      ): Promise<boolean> => {
        let timedOut = false;
        let timer: ReturnType<typeof setTimeout> | null = null;
        const timeoutPromise = new Promise<'__TIMEOUT__'>((resolve) => {
          timer = setTimeout(() => {
            timedOut = true;
            resolve('__TIMEOUT__');
          }, timeoutMs);
        });

        const streamPromise = openStreamWithFallback(targetModel, targetThinking);
        const raceStream = await Promise.race([streamPromise, timeoutPromise]);
        if (raceStream === '__TIMEOUT__') {
          return false;
        }

        const iterator = raceStream[Symbol.asyncIterator]();
        let emitted = false;

        try {
          while (!closed && !timedOut) {
            const nextStep = emitted
              ? await iterator.next()
              : await Promise.race([iterator.next(), timeoutPromise]);

            if (nextStep === '__TIMEOUT__') {
              return emitted;
            }
            if (timer) {
              clearTimeout(timer);
              timer = null;
            }
            if (nextStep.done) {
              break;
            }
            const text = nextStep.value?.text;
            if (text) {
              emitted = true;
              sendEvent({ type: 'chunk', text });
            }
          }
          return true;
        } finally {
          if (timer) clearTimeout(timer);
        }
      };

      let completed = false;
      if (preset.model === 'gemini-4-hydrogen') {
        try {
          completed = await streamWithFirstChunkTimeout('gemini-4-hydrogen', preset.thinkingLevel, 10000);
        } catch (primaryErr) {
          console.warn('SAKO AI primary preset fallback to flash-lite:', primaryErr);
          completed = false;
        }
      }

      if (!completed && !closed) {
        const fallbackStream = await openStreamWithFallback('gemini-3.1-flash-lite', ThinkingLevel.MINIMAL);
        for await (const chunk of fallbackStream) {
          if (closed) break;
          const text = chunk.text;
          if (text) {
            sendEvent({ type: 'chunk', text });
          }
        }
      }

      sendEvent({ type: 'done' });
    } catch (err) {
      console.error('SAKO AI stream error:', err);
      const mapped = getFriendlyApiError(err, uiLang);
      sendEvent({ type: 'error', status: mapped.status, error: mapped.message });
    } finally {
      if (!res.writableEnded) {
        res.end();
      }
    }
  });

  const server = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: { server },
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(
      express.static(distDir, {
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('index.html') || filePath.endsWith('sw.js')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          }
        },
      })
    );
    app.get('*', (req: Request, res: Response) => {
      if (/\.(mp4|webm|png|jpe?g|gif|svg|webp|ico|json|js|mjs|css|woff2?|txt|xml|map)$/i.test(req.path)) {
        res.status(404).send('Not found');
        return;
      }
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const urlPath = request.url || '';
    const proto = request.headers['sec-websocket-protocol'];
    if (urlPath.startsWith('/api/live')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else if (
      process.env.NODE_ENV === 'production' ||
      (proto !== 'vite-hmr' && proto !== 'vite-ping')
    ) {
      socket.destroy();
    }
  });

  wss.on('connection', async (clientWs, request) => {
    const reqUrl = new URL(request.url || '/api/live', `http://${request.headers.host || 'localhost'}`);
    const requestedVoice = reqUrl.searchParams.get('voice') || 'Zephyr';
    const requestedLiveMode = reqUrl.searchParams.get('liveMode') || 'instant';
    const requestedPersona = reqUrl.searchParams.get('persona') === 'angry' ? 'angry' : 'normal';
    const rawLang = reqUrl.searchParams.get('uiLang') || 'ru';
    const languageName = reqUrl.searchParams.get('languageName') || undefined;
    const uiLang: 'ru' | 'kk' | 'en' = rawLang === 'kk' ? 'kk' : rawLang === 'ru' ? 'ru' : 'en';

    const allowedVoices = ['Zephyr', 'Puck', 'Kore', 'Fenrir', 'Charon'];
    const voiceName = allowedVoices.includes(requestedVoice) ? requestedVoice : 'Zephyr';

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: 'error',
            error:
              uiLang === 'kk'
                ? 'GEMINI_API_KEY орнатылмаған. Settings > Secrets бөлімінде кілтті қосыңыз.'
                : uiLang === 'en'
                  ? 'GEMINI_API_KEY is not configured. Add it in Settings > Secrets.'
                  : 'Не задан GEMINI_API_KEY. Добавьте ключ в Settings > Secrets.',
          })
        );
        clientWs.close();
      }
      return;
    }

    const ai = new GoogleGenAI({
      apiKey,
      apiVersion: 'v1alpha',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const isThinkingMode = requestedLiveMode === 'thinking';
    const isCoachMode = requestedLiveMode === 'coach';
    const model = isThinkingMode ? 'gemini-3.8-live-extended-thinking' : 'gemini-3.8-live';

    const liveSystemInstruction = [
      buildSystemInstruction(isCoachMode ? 'html' : 'general', rawLang, languageName, requestedPersona),
      'Сейчас ты общаешься в живом голосовом режиме реального времени (Voice Live).',
      'Отвечай живо, эмоционально, естественно и достаточно лаконично для устной речи, без длинных markdown-таблиц.',
      'Если пользователь показывает экран телефона, камеру или скриншот — внимательно описывай и комментируй то, что видишь на изображении, помогай по шагам.',
    ].join('\n');

    let liveSession: Awaited<ReturnType<typeof ai.live.connect>> | null = null;
    let isClosing = false;

    const sendToClient = (payload: Record<string, unknown>) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify(payload));
      }
    };

    const sessionPromise = ai.live.connect({
      model,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
        ...(isThinkingMode
          ? {
              thinkingConfig: {
                thinkingLevel: ThinkingLevel.MEDIUM,
              },
            }
          : {}),
        systemInstruction: liveSystemInstruction,
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      },
      callbacks: {
        onopen: () => {
          sendToClient({ type: 'ready', voiceName, model });
        },
        onmessage: (message: LiveServerMessage) => {
          const content = message.serverContent;
          if (content?.inputTranscription?.text) {
            sendToClient({ type: 'inputTranscript', text: content.inputTranscription.text });
          }
          if (content?.outputTranscription?.text) {
            sendToClient({ type: 'outputTranscript', text: content.outputTranscription.text });
          }
          for (const part of content?.modelTurn?.parts ?? []) {
            if (part.inlineData?.data) {
              sendToClient({ type: 'audio', data: part.inlineData.data });
            }
          }
          if (content?.interrupted) {
            sendToClient({ type: 'interrupted' });
          }
          if (content?.turnComplete) {
            sendToClient({ type: 'turnComplete' });
          }
          if (content?.interactionStatus) {
            sendToClient({ type: 'interactionStatus', status: content.interactionStatus });
          }
        },
        onerror: (err) => {
          console.error('SAKO Live session error:', err);
          const mapped = getFriendlyApiError(err, uiLang);
          sendToClient({ type: 'error', error: mapped.message });
        },
        onclose: () => {
          if (!isClosing && clientWs.readyState === WebSocket.OPEN) {
            clientWs.close();
          }
        },
      },
    });

    sessionPromise
      .then((session) => {
        liveSession = session;
        if (isClosing) {
          session.close();
        }
      })
      .catch((err) => {
        console.error('Failed to connect Gemini Live:', err);
        const mapped = getFriendlyApiError(err, uiLang);
        sendToClient({ type: 'error', error: mapped.message });
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.close();
        }
      });

    clientWs.on('message', async (raw) => {
      try {
        const msg = JSON.parse(raw.toString()) as {
          type?: 'audio' | 'video' | 'text';
          data?: string;
          text?: string;
        };
        const session = liveSession || (await sessionPromise);
        if (!session || isClosing) return;

        if (msg.type === 'audio' && msg.data) {
          session.sendRealtimeInput({
            audio: { data: msg.data, mimeType: 'audio/pcm;rate=16000' },
          });
        } else if (msg.type === 'video' && msg.data) {
          session.sendRealtimeInput({
            video: { data: msg.data, mimeType: 'image/jpeg' },
          });
        } else if (msg.type === 'text' && msg.text) {
          session.sendRealtimeInput({ text: msg.text });
        }
      } catch (err) {
        console.error('SAKO Live incoming message error:', err);
      }
    });

    const cleanup = () => {
      isClosing = true;
      try {
        liveSession?.close();
      } catch {
        // ignore close errors
      }
    };

    clientWs.on('close', cleanup);
    clientWs.on('error', cleanup);
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`SAKO AI server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start SAKO AI server:', err);
  process.exit(1);
});
