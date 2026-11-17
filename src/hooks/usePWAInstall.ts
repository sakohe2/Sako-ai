import { useCallback, useEffect, useState } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface Window {
    __sakoDeferredInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() =>
    typeof window !== 'undefined' ? window.__sakoDeferredInstallPrompt ?? null : null
  );
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }

    if (window.__sakoDeferredInstallPrompt) {
      setDeferredPrompt(window.__sakoDeferredInstallPrompt);
    }

    const syncEarlyPrompt = () => {
      if (window.__sakoDeferredInstallPrompt) {
        setDeferredPrompt(window.__sakoDeferredInstallPrompt);
      }
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const evt = e as BeforeInstallPromptEvent;
      window.__sakoDeferredInstallPrompt = evt;
      setDeferredPrompt(evt);
    };

    const handleAppInstalled = () => {
      window.__sakoDeferredInstallPrompt = null;
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('sako:installready', syncEarlyPrompt);
    window.addEventListener('sako:appinstalled', handleAppInstalled);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('sako:installready', syncEarlyPrompt);
      window.removeEventListener('sako:appinstalled', handleAppInstalled);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    const promptEvent = deferredPrompt || window.__sakoDeferredInstallPrompt;
    if (!promptEvent) return 'unavailable';

    try {
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      window.__sakoDeferredInstallPrompt = null;
      setDeferredPrompt(null);
      if (outcome === 'accepted') {
        setIsInstalled(true);
        return 'accepted';
      }
      return 'dismissed';
    } catch {
      return 'unavailable';
    }
  }, [deferredPrompt]);

  const downloadStandaloneLauncher = useCallback(() => {
    const targetUrl =
      typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : 'https://sako-ai.ai.studio/';

    const launcherHtml = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SAKO AI — sako-ai.ai.studio</title>
  <meta http-equiv="refresh" content="0;url=${targetUrl}" />
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #09090b; color: #fafafa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; text-align: center; padding: 24px; }
    a { display: inline-block; margin-top: 16px; padding: 12px 22px; border-radius: 10px; background: #4f46e5; color: #fff; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <main>
    <h1>SAKO AI</h1>
    <p>Открываем приложение sako-ai.ai.studio...</p>
    <a href="${targetUrl}">Открыть SAKO AI</a>
  </main>
  <script>window.location.replace(${JSON.stringify(targetUrl)});</script>
</body>
</html>`;

    const blob = new Blob([launcherHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'SAKO-AI.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    isInIframe,
    install,
    downloadStandaloneLauncher,
  };
}
