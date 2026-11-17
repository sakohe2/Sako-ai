import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { getTranslation } from '../i18n/translations';
import type { Language } from '../types/chat';

interface OfflineIndicatorProps {
  lang: Language;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ lang }) => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-4 z-50 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-600 px-3.5 py-2 text-xs font-medium text-white shadow-lg"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>{getTranslation(lang).offlineBanner}</span>
    </div>
  );
};
