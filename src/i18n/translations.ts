import type { AssistantMode, Language, LiveSessionMode, LiveVoiceName, ModelPresetId } from '../types/chat';

export const DEFAULT_SAKO_HTML = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SAKO AI — sako-ai.ai.studio</title>
  <style>
    :root {
      --bg: #0b0f17;
      --surface: #111827;
      --border: #1e293b;
      --text: #f8fafc;
      --muted: #94a3b8;
      --accent: #3b82f6;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
    }
    .container { max-width: 1040px; margin: 0 auto; padding: 0 24px; }
    header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 0; border-bottom: 1px solid var(--border);
    }
    .brand { font-size: 1.25rem; font-weight: 700; letter-spacing: -0.02em; }
    .domain { color: var(--muted); font-size: 0.875rem; }
    .hero { padding: 72px 0 56px; }
    h1 {
      font-size: clamp(2rem, 5vw, 3.25rem);
      line-height: 1.15; max-width: 18ch; margin-bottom: 20px;
    }
    .lead { color: var(--muted); font-size: 1.125rem; max-width: 58ch; margin-bottom: 32px; }
    .btn {
      display: inline-block; background: var(--accent); color: #fff;
      text-decoration: none; padding: 12px 24px; border-radius: 10px;
      font-weight: 600; font-size: 0.95rem;
    }
    .grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px; padding: 32px 0 64px;
    }
    .card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 14px; padding: 24px;
    }
    .card h3 { font-size: 1.05rem; margin-bottom: 8px; }
    .card p { color: var(--muted); font-size: 0.925rem; }
    footer {
      border-top: 1px solid var(--border); padding: 24px 0;
      color: var(--muted); font-size: 0.85rem;
      display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">SAKO AI</div>
      <div class="domain">sako-ai.ai.studio</div>
    </header>
    <main>
      <section class="hero">
        <h1>Умный ИИ на русском и казахском</h1>
        <p class="lead">
          Прямое и естественное общение без лишней воды. Помощь с кодом,
          HTML-сайтами, играми, технологиями и обучением.
        </p>
        <a href="#features" class="btn">Начать работу</a>
      </section>
      <section id="features" class="grid">
        <article class="card">
          <h3>Русский и Қазақша</h3>
          <p>Свободное понимание и живые ответы на двух языках с сохранением контекста.</p>
        </article>
        <article class="card">
          <h3>Код и HTML-сайты</h3>
          <p>Генерация чистой вёрстки, веб-приложений, скриптов и разбор архитектуры.</p>
        </article>
        <article class="card">
          <h3>Игры и логика</h3>
          <p>Проектирование механик, баланса и готовые HTML5-мини-игры в одном файле.</p>
        </article>
      </section>
    </main>
    <footer>
      <span>SAKO AI · sako-ai.ai.studio</span>
      <span>Честно, прямо и по делу</span>
    </footer>
  </div>
</body>
</html>`;

export interface StarterPrompt {
  title: string;
  description: string;
  prompt: string;
  mode: AssistantMode;
}

export const TRANSLATIONS = {
  ru: {
    brand: 'SAKO AI',
    domain: 'sako-ai.ai.studio',
    newChat: 'Новый чат',
    chatTab: 'Чат',
    studioTab: 'HTML Студия',
    aboutTab: 'О SAKO AI',
    historyTitle: 'История диалогов',
    searchChatsPlaceholder: 'Поиск по названиям...',
    clearSearch: 'Очистить поиск',
    noSearchResults: 'Чаты по запросу не найдены',
    emptyHistory: 'Диалогов пока нет',
    deleteChat: 'Удалить чат',
    exportHtml: 'Экспорт HTML',
    themeLight: 'Светлая',
    themeDark: 'Тёмная',
    installApp: 'Скачать SAKO AI',
    installedLabel: 'Приложение установлено',
    installIos: 'Установить на iOS',
    installGuideTitle: 'Скачать и установить SAKO AI',
    installIframeHint: 'Приложение сейчас открыто во встроенном окне. Откройте его на весь экран браузера — тогда установка на телефон и ПК запустится в один клик.',
    installOpenFullWindow: 'Открыть SAKO AI для установки',
    installDownloadLauncher: 'Скачать файл запуска (SAKO-AI.html)',
    installIosSteps: [
      'Нажмите кнопку «Поделиться» на нижней панели Safari.',
      'Прокрутите список вниз и выберите «На экран „Домой“».',
      'Нажмите «Добавить» — SAKO AI появится как отдельное приложение.',
    ],
    installDesktopSteps: [
      'Откройте меню браузера (Chrome, Edge или Яндекс) или нажмите на значок установки в адресной строке.',
      'Выберите «Установить SAKO AI» или «Установить приложение».',
      'На Android: нажмите меню браузера (⋮) → «Добавить на главный экран» или «Установить приложение».',
    ],
    close: 'Закрыть',
    offlineBanner: 'Нет подключения к сети — интерфейс и история доступны офлайн',
    welcomeBannerTitle: 'Добро пожаловать на SAKO AI',
    welcomeBannerSubtitle: 'sako-ai.ai.studio · Все языки мира · Быстрый старт',
    welcomeHeadline: 'Привет, я SAKO AI',
    welcomeSubhead:
      'Живой, эмоциональный ИИ-помощник, который понимает все языки мира. Общаюсь с душой и юмором, помогаю с кодом, HTML-сайтами, играми, технологиями и обучением.',
    inputPlaceholder: 'Напишите на любом языке мира...',
    attachFile: 'Прикрепить изображение или код',
    send: 'Отправить',
    stop: 'Остановить',
    modelsButtonLabel: 'Модели (5 бесплатных)',
    modelsModalTitle: 'Бесплатные модели Gemini в SAKO AI',
    modelsModalHint: 'Выберите скорость и глубину рассуждений. По умолчанию включена самая быстрая модель без задержек.',
    modelPresets: {
      'flash-lite': {
        short: 'Турбо',
        name: 'Gemini 3.1 Flash Lite · Турбо',
        modelId: 'gemini-3.1-flash-lite',
        speed: 'Мгновенно',
        desc: 'Минимальная задержка — печатает сразу без паузы на размышления.',
      },
      'hydrogen-fast': {
        short: 'Быстро',
        name: 'Gemini 4 Hydrogen · Быстрая',
        modelId: 'gemini-4-hydrogen (Low)',
        speed: 'Очень быстро',
        desc: 'Лёгкое рассуждение и быстрый старт ответа для чата и короткого кода.',
      },
      'hydrogen-balanced': {
        short: 'Баланс',
        name: 'Gemini 4 Hydrogen · Баланс',
        modelId: 'gemini-4-hydrogen (Medium)',
        speed: 'Средне',
        desc: 'Универсальный баланс скорости и точности для сайтов и текстов.',
      },
      'hydrogen-deep': {
        short: 'Глубоко',
        name: 'Gemini 4 Hydrogen · Глубокая',
        modelId: 'gemini-4-hydrogen (High)',
        speed: 'Вдумчиво',
        desc: 'Глубокий разбор сложного кода, игр и технических задач.',
      },
      'hydrogen-xhigh': {
        short: 'Макс',
        name: 'Gemini 4 Hydrogen · Максимум',
        modelId: 'gemini-4-hydrogen (XHigh)',
        speed: 'Макс. анализ',
        desc: 'Предельная глубина рассуждений для сложной архитектуры и отладки.',
      },
    } as Record<ModelPresetId, { short: string; name: string; modelId: string; speed: string; desc: string }>,
    modesLabel: 'Режим работы',
    modes: {
      general: {
        label: 'Свободный диалог',
        short: 'Диалог',
        hint: 'Эмоциональное живое общение, юмор и честные ответы',
      },
      html: {
        label: 'Код и Сайты (HTML)',
        short: 'HTML и Код',
        hint: 'Создание сайтов, HTML/CSS/JS и архитектуры',
      },
      games: {
        label: 'Игры и Логика',
        short: 'Игры',
        hint: 'Геймдизайн и мини-игры на HTML5/JS',
      },
      learning: {
        label: 'Обучение и Технологии',
        short: 'Обучение',
        hint: 'Увлечённые разборы сложных тем на любом языке',
      },
    } as Record<AssistantMode, { label: string; short: string; hint: string }>,
    starters: [
      {
        title: 'Создать HTML-сайт целиком',
        description: 'Адаптивная страница в одном HTML-файле с живым предпросмотром',
        prompt:
          'Сделай стильный адаптивный одностраничный HTML-сайт для студии разработки игр на чистом HTML, CSS и JS в одном файле ```html.',
        mode: 'html',
      },
      {
        title: 'Сұрақ қазақ тілінде',
        description: 'Түсінікті әрі табиғи жауап қазақша',
        prompt:
          'Қазіргі заманғы жасанды интеллект қалай жұмыс істейді? Қарапайым мысалдармен және аздаған әзілмен түсіндіріп берші.',
        mode: 'learning',
      },
      {
        title: 'Мини-игра в одном HTML',
        description: 'Готовая браузерная игра на Canvas — сразу в предпросмотр',
        prompt:
          'Напиши увлекательную аркадную мини-игру на HTML5 Canvas (например, «Арканоид» или «Космический уклонист») в одном самодостаточном ```html файле с управлением с клавиатуры и тач-кнопками.',
        mode: 'games',
      },
      {
        title: 'Честный разбор сложной темы',
        description: 'Прямой ответ без воды и шаблонных фраз',
        prompt:
          'Какие навыки в программировании реально останутся востребованными через 5 лет, а что нейросети заберут на себя? Ответь прямо и без маркетинговой воды.',
        mode: 'general',
      },
    ] as StarterPrompt[],
    copyCode: 'Копировать',
    copiedCode: 'Скопировано',
    downloadFile: 'Скачать',
    previewHtml: 'Превью',
    hidePreview: 'Скрыть превью',
    openInStudio: 'В HTML Студию',
    studioTitle: 'HTML Студия — sako-ai.ai.studio',
    studioSubtitle: 'Редактируйте HTML-код слева и проверяйте результат в реальном времени справа.',
    studioCopy: 'Копировать HTML',
    studioDownload: 'Скачать index.html',
    studioReset: 'Шаблон sako-ai.ai.studio',
    studioImprove: 'Улучшить с SAKO AI',
    studioImprovePrompt:
      'Вот мой текущий HTML-код для сайта. Предложи улучшения по дизайну, адаптивности и выдай обновлённую полную версию в одном блоке ```html:\n\n```html\n',
    viewportDesktop: 'Десктоп',
    viewportTablet: 'Планшет',
    viewportMobile: 'Телефон',
    aboutTitle: 'SAKO AI — принципы и архитектура',
    aboutLead:
      'Самостоятельный эмоциональный ИИ-помощник на базе sako-ai.ai.studio, свободно владеющий всеми языками мира и устанавливаемый как приложение (PWA) на телефон и компьютер.',
    aboutInstallHeading: 'Установите SAKO AI как приложение',
    aboutInstallDesc:
      'SAKO AI поддерживает стандарт Progressive Web App: работает в отдельном окне без рамок браузера, кэширует интерфейс и хранит историю диалогов локально на вашем устройстве.',
    principles: [
      {
        title: 'Эмоциональное и живое общение',
        desc: 'Искренние эмоции, эмпатия, живой характер, уместный юмор и ответы по существу без сухих шаблонов и нравоучений.',
      },
      {
        title: 'Все языки мира',
        desc: 'Свободное понимание, живой перевод и естественное общение на русском, казахском, английском, турецком, японском и любом другом языке.',
      },
      {
        title: 'Фокус на HTML, код, игры и обучение',
        desc: 'Встроенная HTML Студия с живым предпросмотром позволяет сразу тестировать и скачивать готовые веб-страницы и мини-игры.',
      },
      {
        title: 'Честность и приватность',
        desc: 'Если точного ответа нет, SAKO AI прямо об этом скажет и не станет выдумывать факты. История чатов сохраняется локально в вашем браузере.',
      },
    ],
    regenerate: 'Повторить ответ',
    clearConfirm: 'Очистить',
    you: 'Вы',
    sako: 'SAKO AI',
    streamingNote: 'Генерация ответа...',
    fileTooLarge: 'Файл слишком большой (максимум 4 МБ).',
    unsupportedFile: 'Поддерживаются изображения (PNG, JPEG, WebP) и текстовые файлы кода.',
    liveVoiceButton: 'Голос Live',
    liveModalTitle: 'SAKO AI Live · Голос и Экран',
    liveModalSubtitle: 'Живой голосовой разговор как в Gemini с выбором голоса и показом экрана или камеры телефона.',
    liveVoiceSectionTitle: 'Выберите голос SAKO AI',
    livePreviewVoice: 'Прослушать',
    livePreviewing: 'Звучит...',
    liveModeSectionTitle: 'Режим диалога',
    liveModes: {
      instant: {
        label: 'Быстрый Live',
        desc: 'Мгновенный живой отклик (gemini-3.8-live)',
      },
      thinking: {
        label: 'Глубокий Live',
        desc: 'Рассуждение перед ответом (gemini-3.8-live-extended-thinking)',
      },
      coach: {
        label: 'Экран и Код',
        desc: 'Подсказывает по экрану телефона, сайтам и ошибкам',
      },
    } as Record<LiveSessionMode, { label: string; desc: string }>,
    liveVoices: {
      Zephyr: { name: 'Zephyr', vibe: 'Тёплый и яркий', desc: 'Живой дружелюбный голос с эмоциями и энергией' },
      Puck: { name: 'Puck', vibe: 'Бодрый и с юмором', desc: 'Лёгкий, быстрый и весёлый тон для свободного общения' },
      Kore: { name: 'Kore', vibe: 'Мягкий и спокойный', desc: 'Чистый, уравновешенный голос для учёбы и объяснений' },
      Fenrir: { name: 'Fenrir', vibe: 'Уверенный и глубокий', desc: 'Выразительный сильный голос для серьёзных разборов' },
      Charon: { name: 'Charon', vibe: 'Спокойный и вдумчивый', desc: 'Ровный бархатный тембр для долгих бесед и кода' },
    } as Record<LiveVoiceName, { name: string; vibe: string; desc: string }>,
    liveStartCall: 'Начать голосовой чат',
    liveEndCall: 'Завершить',
    liveConnecting: 'Подключение к SAKO Live...',
    liveConnected: 'В эфире · говорите свободно',
    liveIdleHint: 'Выберите голос, режим и нажмите «Начать голосовой чат». Во время разговора можно включить экран или камеру телефона.',
    liveMuteMic: 'Выкл. микрофон',
    liveUnmuteMic: 'Вкл. микрофон',
    liveShareScreen: 'Экран',
    liveStopScreen: 'Стоп экран',
    liveShareCamera: 'Камера',
    liveStopCamera: 'Стоп камера',
    liveFlipCamera: 'Повернуть',
    liveSendScreenshot: 'Скриншот',
    liveTranscriptTitle: 'Диалог в реальном времени',
    liveNoTranscriptYet: 'Говорите в микрофон или покажите экран — здесь появятся субтитры разговора.',
    liveSaveToChat: 'Сохранить в чат',
    liveSavedToChat: 'Сохранено в чат',
    liveVideoActiveHint: 'Трансляция видео/экрана активна (1 кадр/сек) — SAKO AI видит изображение.',
    liveScreenshotSent: 'Снимок экрана отправлен в голосовой эфир.',
    liveScreenUnsupportedMobile:
      'Браузер на этом телефоне ограничивает прямой захват экрана (getDisplayMedia). Используйте кнопку «Камера» или «Скриншот», чтобы мгновенно показать экран SAKO AI!',
    liveMicDenied: 'Нет доступа к микрофону. Разрешите микрофон в настройках браузера.',
    settingsButton: 'Настройки',
    settingsTitle: 'Настройки SAKO AI',
    settingsSubtitle: 'Язык интерфейса и ответов, тема оформления, модель и голос.',
    settingsLanguageLabel: 'Язык (все языки мира)',
    settingsLanguageSearch: 'Поиск языка (напр. Türkçe, Oʻzbekcha, 日本語, العربية)...',
    settingsLanguageHint: 'Меняет язык всего интерфейса и основной язык общения SAKO AI.',
    settingsTranslating: 'Переводим интерфейс...',
    settingsNoLanguageMatch: 'Язык не найден. Попробуйте ввести название на русском, английском или родном языке.',
    settingsThemeLabel: 'Тема оформления',
    settingsModelLabel: 'Бесплатная модель по умолчанию',
    settingsVoiceLabel: 'Голос SAKO Live по умолчанию',
    settingsCustomLanguageApply: 'Использовать этот язык для ответов ИИ',
    creatorLabel: 'Создатель: Махмут Саламат (школьник)',
    angryCommandLabel: '/angry',
    angryModeActive: 'Жёсткий режим (/angry)',
    angryModeHint: 'Жёсткий, резкий стиль без воды · /normal чтобы выключить',
    angryCmdDesc: 'Включить жёсткий, дерзкий и прямолинейный стиль',
    normalCmdDesc: 'Вернуть обычный дружелюбный стиль',
    normalModeRestored: 'Обычный режим SAKO AI возвращён. Можем общаться как обычно!',
  },
  kk: {
    brand: 'SAKO AI',
    domain: 'sako-ai.ai.studio',
    newChat: 'Жаңа чат',
    chatTab: 'Чат',
    studioTab: 'HTML Студия',
    aboutTab: 'SAKO AI туралы',
    historyTitle: 'Диалогтар тарихы',
    searchChatsPlaceholder: 'Атауы бойынша іздеу...',
    clearSearch: 'Іздеуді тазалау',
    noSearchResults: 'Сұрау бойынша чат табылмады',
    emptyHistory: 'Әзірге диалогтар жоқ',
    deleteChat: 'Чатты өшіру',
    exportHtml: 'HTML экспорт',
    themeLight: 'Жарық',
    themeDark: 'Қараңғы',
    installApp: 'SAKO AI жүктеу',
    installedLabel: 'Қолданба орнатылған',
    installIos: 'iOS-қа орнату',
    installGuideTitle: 'SAKO AI жүктеу және орнату',
    installIframeHint: 'Қолданба қазір кірістірілген терезеде ашылған. Толық экранда ашсаңыз, телефон мен компьютерге орнату бір рет басу арқылы іске қосылады.',
    installOpenFullWindow: 'Орнату үшін толық ашу',
    installDownloadLauncher: 'Іске қосу файлын жүктеу (SAKO-AI.html)',
    installIosSteps: [
      'Safari браузерінің төменгі панеліндегі «Бөлісу» (Поделиться) батырмасын басыңыз.',
      'Тізімді төмен жылжытып, «Негізгі экранға» (На экран Домой) тармағын таңдаңыз.',
      '«Қосу» батырмасын басыңыз — SAKO AI бөлек қолданба ретінде ашылады.',
    ],
    installDesktopSteps: [
      'Браузер мәзірін (Chrome, Edge) ашыңыз немесе мекенжай жолағындағы орнату белгішесін басыңыз.',
      '«SAKO AI орнату» немесе «Қолданбаны орнату» тармағын таңдаңыз.',
      'Android жүйесінде: браузер мәзірі (⋮) → «Қолданбаны орнату» немесе «Негізгі экранға қосу».',
    ],
    close: 'Жабу',
    offlineBanner: 'Желіге қосылым жоқ — интерфейс пен тарих офлайн қолжетімді',
    welcomeBannerTitle: 'SAKO AI-ға қош келдіңіз',
    welcomeBannerSubtitle: 'sako-ai.ai.studio · Барлық тілдер · Жылдам жауап',
    welcomeHeadline: 'Сәлем, мен SAKO AI-мын',
    welcomeSubhead:
      'Әлемнің барлық тілдерін білетін жанды, эмоционалды ИИ-көмекші. Жылулықпен, әзілмен және шын жүректен бағдарламалау, HTML-сайттар, ойындар мен оқу бойынша көмектесемін.',
    inputPlaceholder: 'Кез келген тілде жазыңыз...',
    attachFile: 'Сурет немесе код файлын тіркеу',
    send: 'Жіберу',
    stop: 'Тоқтату',
    modelsButtonLabel: 'Модельдер (5 тегін)',
    modelsModalTitle: 'SAKO AI-дағы тегін Gemini модельдері',
    modelsModalHint: 'Жылдамдық пен талдау тереңдігін таңдаңыз. Әдепкі бойынша ең жылдам модель қосулы.',
    modelPresets: {
      'flash-lite': {
        short: 'Турбо',
        name: 'Gemini 3.1 Flash Lite · Турбо',
        modelId: 'gemini-3.1-flash-lite',
        speed: 'Лезде',
        desc: 'Ең төмен кідіріс — ойлану үзілісінсіз бірден жаза бастайды.',
      },
      'hydrogen-fast': {
        short: 'Жылдам',
        name: 'Gemini 4 Hydrogen · Жылдам',
        modelId: 'gemini-4-hydrogen (Low)',
        speed: 'Өте жылдам',
        desc: 'Жеңіл талдау және чат пен шағын код үшін жылдам жауап.',
      },
      'hydrogen-balanced': {
        short: 'Теңгерім',
        name: 'Gemini 4 Hydrogen · Теңгерімді',
        modelId: 'gemini-4-hydrogen (Medium)',
        speed: 'Орташа',
        desc: 'Сайттар мен мәтіндер үшін жылдамдық пен дәлдік теңгерімі.',
      },
      'hydrogen-deep': {
        short: 'Терең',
        name: 'Gemini 4 Hydrogen · Терең',
        modelId: 'gemini-4-hydrogen (High)',
        speed: 'Мұқият',
        desc: 'Күрделі кодты, ойындарды және техникалық тапсырмаларды терең талдау.',
      },
      'hydrogen-xhigh': {
        short: 'Макс',
        name: 'Gemini 4 Hydrogen · Максимум',
        modelId: 'gemini-4-hydrogen (XHigh)',
        speed: 'Макс. талдау',
        desc: 'Күрделі архитектура мен жөндеуге арналған ең жоғары ойлау тереңдігі.',
      },
    } as Record<ModelPresetId, { short: string; name: string; modelId: string; speed: string; desc: string }>,
    modesLabel: 'Жұмыс режимі',
    modes: {
      general: {
        label: 'Еркін сұхбат',
        short: 'Сұхбат',
        hint: 'Еркін әңгіме, әзіл және тікелей жауаптар',
      },
      html: {
        label: 'Код және Сайт (HTML)',
        short: 'HTML және Код',
        hint: 'Сайттар, HTML/CSS/JS және архитектура жасау',
      },
      games: {
        label: 'Ойындар мен Логика',
        short: 'Ойындар',
        hint: 'Ойын дизайны және HTML5/JS шағын ойындар',
      },
      learning: {
        label: 'Оқу және Технология',
        short: 'Оқу',
        hint: 'Күрделі тақырыптарды қарапайым тілмен түсіндіру',
      },
    } as Record<AssistantMode, { label: string; short: string; hint: string }>,
    starters: [
      {
        title: 'Толық HTML-сайт жасау',
        description: 'Тікелей алдын ала қарауы бар бейімделгіш HTML бет',
        prompt:
          'Заманауи технологиялық стартапқа арналған таза HTML, CSS және JS тілінде бір ```html файлда адаптивті лендинг жасап бер.',
        mode: 'html',
      },
      {
        title: 'Қазақша еркін түсіндірме',
        description: 'Күрделі тақырыпты қарапайым әрі қызықты баяндау',
        prompt:
          'Заманауи жасанды интеллект қалай жұмыс істейді? Қарапайым өмірлік мысалдармен және аздаған әзілмен түсіндіріп берші.',
        mode: 'learning',
      },
      {
        title: 'Бір HTML-дегі шағын ойын',
        description: 'Canvas негізіндегі дайын браузерлік ойын',
        prompt:
          'Бір ```html файлда пернетақтамен және сенсорлық батырмалармен басқарылатын қызықты HTML5 Canvas аркада ойынын жазып бер.',
        mode: 'games',
      },
      {
        title: 'Тікелей әрі адал талдау',
        description: 'Артық сөзсіз нақты жауап',
        prompt:
          'Алдағы 5 жылда бағдарламалауда қандай дағдылар ең маңызды болып қалады? Жалпы сөзсіз, нақты және тура жауап бер.',
        mode: 'general',
      },
    ] as StarterPrompt[],
    copyCode: 'Көшіру',
    copiedCode: 'Көшірілді',
    downloadFile: 'Жүктеу',
    previewHtml: 'Алдын ала қарау',
    hidePreview: 'Жасыру',
    openInStudio: 'HTML Студияға',
    studioTitle: 'HTML Студия — sako-ai.ai.studio',
    studioSubtitle: 'Сол жақта HTML-кодты өңдеп, оң жақта нәтижені бірден көріңіз.',
    studioCopy: 'HTML көшіру',
    studioDownload: 'index.html жүктеу',
    studioReset: 'sako-ai.ai.studio үлгісі',
    studioImprove: 'SAKO AI-мен жақсарту',
    studioImprovePrompt:
      'Мынау менің ағымдағы HTML-кодым. Дизайн мен адаптивтілік бойынша жақсартулар ұсынып, жаңартылған толық нұсқасын бір ```html блокта берші:\n\n```html\n',
    viewportDesktop: 'Десктоп',
    viewportTablet: 'Планшет',
    viewportMobile: 'Телефон',
    aboutTitle: 'SAKO AI — қағидалар мен құрылым',
    aboutLead:
      'sako-ai.ai.studio негізіндегі әлемнің барлық тілдерін меңгерген эмоционалды ИИ-көмекші. Браузерде жұмыс істейді және дербес қолданба (PWA) ретінде орнатылады.',
    aboutInstallHeading: 'SAKO AI-ды қолданба ретінде орнатыңыз',
    aboutInstallDesc:
      'SAKO AI Progressive Web App стандартын қолдайды: браузер жақтауынсыз бөлек терезеде ашылады және диалог тарихын құрылғыңызда жергілікті сақтайды.',
    principles: [
      {
        title: 'Эмоционалды әрі тірі қарым-қатынас',
        desc: 'Шынайы эмоция, қолдау, мінез бен әзіл, құрғақ жауапсыз нақты сұхбат.',
      },
      {
        title: 'Әлемнің барлық тілдері',
        desc: 'Қазақ, орыс, ағылшын, түрік, жапон және басқа да кез келген тілде еркін сөйлесіп, аударады.',
      },
      {
        title: 'HTML, код, ойындар және оқу',
        desc: 'Тікелей алдын ала қарауы бар HTML Студия дайын веб-беттер мен шағын ойындарды лезде тексеруге мүмкіндік береді.',
      },
      {
        title: 'Адалдық пен құпиялылық',
        desc: 'Нақты жауапты білмесе, SAKO AI оны ашық айтады және фактілерді ойдан шығармайды. Чат тарихы тек сіздің браузеріңізде сақталады.',
      },
    ],
    regenerate: 'Қайта генерациялау',
    clearConfirm: 'Тазалау',
    you: 'Сіз',
    sako: 'SAKO AI',
    streamingNote: 'Жауап жазылуда...',
    fileTooLarge: 'Файл тым үлкен (максимум 4 МБ).',
    unsupportedFile: 'Тек суреттер (PNG, JPEG, WebP) және мәтіндік код файлдары қолданылады.',
    liveVoiceButton: 'Дауыс Live',
    liveModalTitle: 'SAKO AI Live · Дауыс және Экран',
    liveModalSubtitle: 'Gemini сияқты таңдаулы дауыспен тікелей сөйлесу және телефон экраны мен камерасын көрсету.',
    liveVoiceSectionTitle: 'SAKO AI дауысын таңдаңыз',
    livePreviewVoice: 'Тыңдау',
    livePreviewing: 'Ойнауда...',
    liveModeSectionTitle: 'Сұхбат режимі',
    liveModes: {
      instant: {
        label: 'Жылдам Live',
        desc: 'Лезде тірі жауап беру (gemini-3.8-live)',
      },
      thinking: {
        label: 'Терең Live',
        desc: 'Талдап барып жауап беру (gemini-3.8-live-extended-thinking)',
      },
      coach: {
        label: 'Экран және Код',
        desc: 'Телефон экраны, сайттар және код бойынша көмек',
      },
    } as Record<LiveSessionMode, { label: string; desc: string }>,
    liveVoices: {
      Zephyr: { name: 'Zephyr', vibe: 'Жылы әрі жарқын', desc: 'Эмоцияға бай, ашық және жігерлі дауыс' },
      Puck: { name: 'Puck', vibe: 'Сергек және әзілқой', desc: 'Еркін әңгімеге арналған жеңіл әрі жылдам үн' },
      Kore: { name: 'Kore', vibe: 'Жұмсақ әрі байсалды', desc: 'Оқу мен түсіндіруге арналған таза дауыс' },
      Fenrir: { name: 'Fenrir', vibe: 'Сенімді әрі терең', desc: 'Маңызды тақырыптарға арналған айқын қуатты дауыс' },
      Charon: { name: 'Charon', vibe: 'Сабырлы әрі ойлы', desc: 'Ұзақ сұхбат пен кодқа арналған барқыт үн' },
    } as Record<LiveVoiceName, { name: string; vibe: string; desc: string }>,
    liveStartCall: 'Дауыстық чатты бастау',
    liveEndCall: 'Аяқтау',
    liveConnecting: 'SAKO Live-қа қосылуда...',
    liveConnected: 'Эфирде · еркін сөйлеңіз',
    liveIdleHint: 'Дауыс пен режимді таңдап, бастау батырмасын басыңыз. Сұхбат кезінде телефон экранын немесе камерасын қосуға болады.',
    liveMuteMic: 'Микрофонды өшіру',
    liveUnmuteMic: 'Микрофонды қосу',
    liveShareScreen: 'Экран',
    liveStopScreen: 'Экранды тоқтату',
    liveShareCamera: 'Камера',
    liveStopCamera: 'Камераны тоқтату',
    liveFlipCamera: 'Ауыстыру',
    liveSendScreenshot: 'Скриншот',
    liveTranscriptTitle: 'Тікелей субтитрлер',
    liveNoTranscriptYet: 'Микрофонға сөйлеңіз немесе экранды көрсетіңіз — сөздер осында жазылады.',
    liveSaveToChat: 'Чатқа сақтау',
    liveSavedToChat: 'Чатқа сақталды',
    liveVideoActiveHint: 'Экран/камера таратылымы қосулы (1 кадр/сек) — SAKO AI көріп тұр.',
    liveScreenshotSent: 'Скриншот дауыстық эфирге жіберілді.',
    liveScreenUnsupportedMobile:
      'Бұл телефон браузерінде тікелей экран жазу (getDisplayMedia) шектелген. SAKO AI-ға көрсету үшін «Камера» немесе «Скриншот» батырмасын басыңыз!',
    liveMicDenied: 'Микрофонға рұқсат жоқ. Браузер баптауынан рұқсат беріңіз.',
    settingsButton: 'Баптаулар',
    settingsTitle: 'SAKO AI баптаулары',
    settingsSubtitle: 'Интерфейс пен жауап тілі, безендіру тақырыбы, модель және дауыс.',
    settingsLanguageLabel: 'Тіл (әлемнің барлық тілдері)',
    settingsLanguageSearch: 'Тілді іздеу (мыс. Türkçe, Oʻzbekcha, 日本語, العربية)...',
    settingsLanguageHint: 'Бүкіл интерфейс тілін және SAKO AI жауап тілін өзгертеді.',
    settingsTranslating: 'Интерфейс аударылуда...',
    settingsNoLanguageMatch: 'Тіл табылмады. Атауын қазақша, орысша немесе ағылшынша жазып көріңіз.',
    settingsThemeLabel: 'Безендіру тақырыбы',
    settingsModelLabel: 'Әдепкі тегін модель',
    settingsVoiceLabel: 'Әдепкі SAKO Live дауысы',
    settingsCustomLanguageApply: 'Осы тілді ИИ жауаптары үшін қолдану',
    creatorLabel: 'Жасаушы: Махмут Саламат (оқушы)',
    angryCommandLabel: '/angry',
    angryModeActive: 'Қатал режим (/angry)',
    angryModeHint: 'Қатал әрі тура стиль · өшіру үшін /normal',
    angryCmdDesc: 'Қатал, батыл және өткір мінезді қосу',
    normalCmdDesc: 'Қалыпты жылы режимге оралу',
    normalModeRestored: 'SAKO AI қалыпты режиміне оралды!',
  },
  en: {
    brand: 'SAKO AI',
    domain: 'sako-ai.ai.studio',
    newChat: 'New chat',
    chatTab: 'Chat',
    studioTab: 'HTML Studio',
    aboutTab: 'About SAKO AI',
    historyTitle: 'Chat history',
    searchChatsPlaceholder: 'Search by title...',
    clearSearch: 'Clear search',
    noSearchResults: 'No matching chats found',
    emptyHistory: 'No conversations yet',
    deleteChat: 'Delete chat',
    exportHtml: 'Export HTML',
    themeLight: 'Light',
    themeDark: 'Dark',
    installApp: 'Install SAKO AI',
    installedLabel: 'App installed',
    installIos: 'Install on iOS',
    installGuideTitle: 'Download & install SAKO AI',
    installIframeHint: 'The app is currently inside an embedded preview frame. Open it directly in the browser tab to trigger one-tap native installation.',
    installOpenFullWindow: 'Open SAKO AI to install',
    installDownloadLauncher: 'Download app launcher (SAKO-AI.html)',
    installIosSteps: [
      'Tap the Share button in Safari bottom toolbar.',
      'Scroll down and choose Add to Home Screen.',
      'Tap Add — SAKO AI will launch as a standalone app.',
    ],
    installDesktopSteps: [
      'Open your browser menu (Chrome, Edge) or click the install icon in the address bar.',
      'Select Install SAKO AI or Install App.',
      'On Android: tap browser menu (⋮) → Install app or Add to Home screen.',
    ],
    close: 'Close',
    offlineBanner: 'You are offline — interface and chat history remain available',
    welcomeBannerTitle: 'Welcome to SAKO AI',
    welcomeBannerSubtitle: 'sako-ai.ai.studio · All languages · Instant replies',
    welcomeHeadline: 'Hey, I am SAKO AI',
    welcomeSubhead:
      'An expressive, emotional AI companion fluent in every language. I bring real warmth, humor, and honesty to coding, HTML websites, games, tech, and learning.',
    inputPlaceholder: 'Write in any language...',
    attachFile: 'Attach image or code file',
    send: 'Send',
    stop: 'Stop',
    modelsButtonLabel: 'Models (5 free)',
    modelsModalTitle: 'Free Gemini models in SAKO AI',
    modelsModalHint: 'Pick speed and reasoning depth. The fastest instant model is active by default.',
    modelPresets: {
      'flash-lite': {
        short: 'Turbo',
        name: 'Gemini 3.1 Flash Lite · Turbo',
        modelId: 'gemini-3.1-flash-lite',
        speed: 'Instant',
        desc: 'Lowest latency — starts streaming immediately with zero thinking delay.',
      },
      'hydrogen-fast': {
        short: 'Fast',
        name: 'Gemini 4 Hydrogen · Fast',
        modelId: 'gemini-4-hydrogen (Low)',
        speed: 'Very fast',
        desc: 'Light reasoning and rapid response for chat and quick snippets.',
      },
      'hydrogen-balanced': {
        short: 'Balanced',
        name: 'Gemini 4 Hydrogen · Balanced',
        modelId: 'gemini-4-hydrogen (Medium)',
        speed: 'Balanced',
        desc: 'Solid balance of speed and intelligence for websites and writing.',
      },
      'hydrogen-deep': {
        short: 'Deep',
        name: 'Gemini 4 Hydrogen · Deep',
        modelId: 'gemini-4-hydrogen (High)',
        speed: 'Thorough',
        desc: 'Deep reasoning for complex code, games, and technical problem solving.',
      },
      'hydrogen-xhigh': {
        short: 'Max',
        name: 'Gemini 4 Hydrogen · Max',
        modelId: 'gemini-4-hydrogen (XHigh)',
        speed: 'Max depth',
        desc: 'Maximum reasoning depth on Gemini 4 Hydrogen for heavy architecture.',
      },
    } as Record<ModelPresetId, { short: string; name: string; modelId: string; speed: string; desc: string }>,
    modesLabel: 'Workspace mode',
    modes: {
      general: {
        label: 'Free conversation',
        short: 'Chat',
        hint: 'Emotional, lively dialogue with wit and honesty',
      },
      html: {
        label: 'Code & Websites (HTML)',
        short: 'HTML & Code',
        hint: 'Websites, HTML/CSS/JS, and architecture',
      },
      games: {
        label: 'Games & Logic',
        short: 'Games',
        hint: 'Game design and HTML5 Canvas mini-games',
      },
      learning: {
        label: 'Learning & Tech',
        short: 'Learning',
        hint: 'Passionate, clear breakdowns in any language',
      },
    } as Record<AssistantMode, { label: string; short: string; hint: string }>,
    starters: [
      {
        title: 'Build a complete HTML website',
        description: 'Responsive single-file HTML landing page with live preview',
        prompt:
          'Create a sleek, responsive one-page HTML website for a creative game studio using pure HTML, CSS, and JS in a single ```html block.',
        mode: 'html',
      },
      {
        title: 'Chat across any language',
        description: 'Expressive, natural conversation with cultural nuance',
        prompt:
          'Say hi with real emotion and teach me 3 expressive everyday phrases in Japanese, Spanish, and Kazakh with their vibe and meaning!',
        mode: 'general',
      },
      {
        title: 'Playable HTML5 mini-game',
        description: 'Ready-to-play Canvas game inside one HTML file',
        prompt:
          'Build a fun arcade mini-game on HTML5 Canvas inside a single self-contained ```html file with keyboard and touch controls.',
        mode: 'games',
      },
      {
        title: 'Honest, no-fluff deep dive',
        description: 'Direct perspective without robotic clichés',
        prompt:
          'Which programming skills will genuinely matter most over the next 5 years, and what will AI automate away? Give me an honest, lively take.',
        mode: 'learning',
      },
    ] as StarterPrompt[],
    copyCode: 'Copy',
    copiedCode: 'Copied',
    downloadFile: 'Download',
    previewHtml: 'Preview',
    hidePreview: 'Hide preview',
    openInStudio: 'Open in Studio',
    studioTitle: 'HTML Studio — sako-ai.ai.studio',
    studioSubtitle: 'Edit HTML on the left and preview the live page on the right.',
    studioCopy: 'Copy HTML',
    studioDownload: 'Download index.html',
    studioReset: 'sako-ai.ai.studio template',
    studioImprove: 'Improve with SAKO AI',
    studioImprovePrompt:
      'Here is my current HTML page. Suggest visual & responsive improvements and return the updated full page in a single ```html block:\n\n```html\n',
    viewportDesktop: 'Desktop',
    viewportTablet: 'Tablet',
    viewportMobile: 'Mobile',
    aboutTitle: 'SAKO AI — principles & architecture',
    aboutLead:
      'An expressive, emotional AI companion on sako-ai.ai.studio that speaks every language and installs natively as a Progressive Web App.',
    aboutInstallHeading: 'Install SAKO AI as an app',
    aboutInstallDesc:
      'SAKO AI supports the PWA standard: runs in its own standalone window, caches the interface, and keeps your conversation history locally on your device.',
    principles: [
      {
        title: 'Emotional & expressive voice',
        desc: 'Genuine enthusiasm, empathy, warmth, wit, and direct answers without dry robotic templates or lecturing.',
      },
      {
        title: 'Fluent in all world languages',
        desc: 'Understands, converses, and translates naturally across Russian, Kazakh, English, Turkish, Japanese, Spanish, and any other language.',
      },
      {
        title: 'HTML Studio, code, games & learning',
        desc: 'Built-in HTML Studio with live preview lets you test, refine, and download generated web pages and mini-games immediately.',
      },
      {
        title: 'Honesty & local privacy',
        desc: 'When unsure, SAKO AI admits it openly without fabricating facts. Your chat history stays locally in your browser.',
      },
    ],
    regenerate: 'Regenerate',
    clearConfirm: 'Clear',
    you: 'You',
    sako: 'SAKO AI',
    streamingNote: 'Thinking & writing...',
    fileTooLarge: 'File is too large (4 MB max).',
    unsupportedFile: 'Only images (PNG, JPEG, WebP) and text/code files are supported.',
    liveVoiceButton: 'Voice Live',
    liveModalTitle: 'SAKO AI Live · Voice & Screen',
    liveModalSubtitle: 'Real-time Gemini-style voice conversation with selectable voices and phone screen or camera sharing.',
    liveVoiceSectionTitle: 'Choose SAKO AI voice',
    livePreviewVoice: 'Preview',
    livePreviewing: 'Playing...',
    liveModeSectionTitle: 'Live mode',
    liveModes: {
      instant: {
        label: 'Fast Live',
        desc: 'Low-latency natural conversation (gemini-3.8-live)',
      },
      thinking: {
        label: 'Thinking Live',
        desc: 'Deeper reasoning before speaking (gemini-3.8-live-extended-thinking)',
      },
      coach: {
        label: 'Screen & Code',
        desc: 'Focused on phone screen guidance, websites, and debugging',
      },
    } as Record<LiveSessionMode, { label: string; desc: string }>,
    liveVoices: {
      Zephyr: { name: 'Zephyr', vibe: 'Warm & bright', desc: 'Expressive, upbeat voice full of warmth and energy' },
      Puck: { name: 'Puck', vibe: 'Lively & witty', desc: 'Quick, playful tone great for casual banter' },
      Kore: { name: 'Kore', vibe: 'Soft & clear', desc: 'Calm, articulate voice for learning and explanations' },
      Fenrir: { name: 'Fenrir', vibe: 'Confident & deep', desc: 'Bold, resonant tone for serious discussions' },
      Charon: { name: 'Charon', vibe: 'Calm & thoughtful', desc: 'Smooth, steady voice for long sessions and coding' },
    } as Record<LiveVoiceName, { name: string; vibe: string; desc: string }>,
    liveStartCall: 'Start voice chat',
    liveEndCall: 'End call',
    liveConnecting: 'Connecting to SAKO Live...',
    liveConnected: 'Live · speak naturally',
    liveIdleHint: 'Pick a voice and mode, then start the call. You can share your phone screen, camera, or screenshots anytime.',
    liveMuteMic: 'Mute mic',
    liveUnmuteMic: 'Unmute mic',
    liveShareScreen: 'Screen',
    liveStopScreen: 'Stop screen',
    liveShareCamera: 'Camera',
    liveStopCamera: 'Stop camera',
    liveFlipCamera: 'Flip',
    liveSendScreenshot: 'Screenshot',
    liveTranscriptTitle: 'Live transcript',
    liveNoTranscriptYet: 'Speak into your mic or share your screen — live captions will appear here.',
    liveSaveToChat: 'Save to chat',
    liveSavedToChat: 'Saved to chat',
    liveVideoActiveHint: 'Live screen/camera feed active (1 FPS) — SAKO AI can see it.',
    liveScreenshotSent: 'Screenshot sent into the live voice session.',
    liveScreenUnsupportedMobile:
      'Direct screen capture (getDisplayMedia) is restricted on this mobile browser. Use Camera or Screenshot to instantly show your phone screen to SAKO AI!',
    liveMicDenied: 'Microphone access denied. Please allow microphone permission in browser settings.',
    settingsButton: 'Settings',
    settingsTitle: 'SAKO AI Settings',
    settingsSubtitle: 'Interface & AI language, appearance theme, default model, and voice.',
    settingsLanguageLabel: 'Language (all world languages)',
    settingsLanguageSearch: 'Search any language (e.g. Türkçe, Oʻzbekcha, 日本語, العربية)...',
    settingsLanguageHint: 'Changes both the entire app interface and SAKO AI conversation language.',
    settingsTranslating: 'Translating interface...',
    settingsNoLanguageMatch: 'No matching language found. Try another spelling.',
    settingsThemeLabel: 'Appearance theme',
    settingsModelLabel: 'Default free Gemini model',
    settingsVoiceLabel: 'Default SAKO Live voice',
    settingsCustomLanguageApply: 'Use this language for AI replies',
    creatorLabel: 'Creator: Mahmut Salamat (school student)',
    angryCommandLabel: '/angry',
    angryModeActive: 'Fierce mode (/angry)',
    angryModeHint: 'Brutally direct, no-sugar style · /normal to exit',
    angryCmdDesc: 'Activate fierce, blunt, uncompromising persona',
    normalCmdDesc: 'Return to normal friendly persona',
    normalModeRestored: 'SAKO AI is back to normal friendly mode.',
  },
};

export type TranslationBundle = typeof TRANSLATIONS.ru;

const STORAGE_PACKS_KEY = 'sakoai_translated_packs_v1';

const runtimePacks: Record<string, TranslationBundle> = (() => {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_PACKS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (parsed && typeof parsed === 'object') {
          return parsed as Record<string, TranslationBundle>;
        }
      }
    }
  } catch {
    // ignore storage errors
  }
  return {};
})();

function mergeBundleWithFallback(
  partial: Partial<TranslationBundle>,
  fallback: TranslationBundle
): TranslationBundle {
  return {
    ...fallback,
    ...partial,
    modelPresets: {
      ...fallback.modelPresets,
      ...(partial.modelPresets || {}),
    },
    modes: {
      ...fallback.modes,
      ...(partial.modes || {}),
    },
    liveModes: {
      ...fallback.liveModes,
      ...(partial.liveModes || {}),
    },
    liveVoices: {
      ...fallback.liveVoices,
      ...(partial.liveVoices || {}),
    },
    starters:
      Array.isArray(partial.starters) && partial.starters.length === fallback.starters.length
        ? partial.starters
        : fallback.starters,
    principles:
      Array.isArray(partial.principles) && partial.principles.length === fallback.principles.length
        ? partial.principles
        : fallback.principles,
    installIosSteps:
      Array.isArray(partial.installIosSteps) && partial.installIosSteps.length > 0
        ? partial.installIosSteps
        : fallback.installIosSteps,
    installDesktopSteps:
      Array.isArray(partial.installDesktopSteps) && partial.installDesktopSteps.length > 0
        ? partial.installDesktopSteps
        : fallback.installDesktopSteps,
  };
}

export function hasTranslationBundle(lang: string): boolean {
  return lang === 'ru' || lang === 'kk' || lang === 'en' || Boolean(runtimePacks[lang]);
}

export function saveTranslatedBundle(lang: string, partial: Partial<TranslationBundle>): void {
  const merged = mergeBundleWithFallback(partial, TRANSLATIONS.en);
  runtimePacks[lang] = merged;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_PACKS_KEY, JSON.stringify(runtimePacks));
    }
  } catch {
    // ignore storage quota errors
  }
}

export function getTranslation(lang: string): TranslationBundle {
  if (lang === 'ru') return TRANSLATIONS.ru;
  if (lang === 'kk') return TRANSLATIONS.kk;
  if (lang === 'en') return TRANSLATIONS.en;
  if (runtimePacks[lang]) {
    return mergeBundleWithFallback(runtimePacks[lang], TRANSLATIONS.en);
  }
  return TRANSLATIONS.en;
}
