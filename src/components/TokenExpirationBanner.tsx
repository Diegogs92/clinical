'use client';

import { useCalendarSync } from '@/contexts/CalendarSyncContext';
import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

export default function TokenExpirationBanner() {
  const { isTokenExpired, reconnectCalendar } = useCalendarSync();
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [isReauthing, setIsReauthing] = useState(false);

  if (!user || !isTokenExpired || dismissed) {
    return null;
  }

  const handleReconnect = async () => {
    try {
      setIsReauthing(true);
      await reconnectCalendar();
      setDismissed(true);
    } catch (error) {
      console.error('[TokenBanner] Error al reconectar:', error);
      alert('Error al conectar con Google Calendar. Por favor intenta nuevamente.');
    } finally {
      setIsReauthing(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] max-w-md">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-xl rounded-lg p-4 border border-blue-400">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-sm mb-1">Google Calendar desconectado</p>
            <p className="text-xs opacity-90 mb-3">
              Para mantener la sincronizaci?n autom?tica, conecta tu cuenta de Google Calendar.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReconnect}
                disabled={isReauthing}
                className="bg-white text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isReauthing ? 'Conectando...' : 'Conectar Calendar'}
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="text-white/80 hover:text-white text-xs underline"
              >
                M?s tarde
              </button>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="flex-shrink-0 text-white/80 hover:text-white transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
