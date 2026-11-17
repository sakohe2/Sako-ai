import React from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryState {
  hasError: boolean;
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('SAKO AI render error:', error);
  }

  handleReset = () => {
    try {
      localStorage.removeItem('sakoai_sessions_v1');
    } catch {
      // ignore storage access errors
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-dvh flex items-center justify-center bg-[#FAFAFB] dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 p-6">
          <div className="max-w-md w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111114] p-6 space-y-4 shadow-xl">
            <h1 className="font-display text-lg font-bold">SAKO AI · Восстановление</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
              Произошла ошибка при отображении интерфейса. Нажмите кнопку ниже, чтобы очистить повреждённый локальный кэш и перезапустить приложение.
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
            >
              Перезапустить SAKO AI
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    try {
      const hadController = Boolean(navigator.serviceWorker?.controller);
      let reloading = false;
      if (hadController && navigator.serviceWorker) {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (reloading) return;
          reloading = true;
          window.location.reload();
        });
      }

      registerSW({
        immediate: true,
        onRegisteredSW(_swUrl, registration) {
          if (registration) {
            void registration.update();
          }
        },
        onNeedReload() {
          // Handled safely via controllerchange when replacing an older SW
        },
        onRegisterError(err) {
          console.warn('Service worker registration skipped:', err);
        },
      });
    } catch (err) {
      console.warn('Service worker initialization skipped:', err);
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
