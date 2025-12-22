'use client';

import { useCalendarSync } from '@/contexts/CalendarSyncContext';
import { Calendar, AlertCircle, RefreshCw } from 'lucide-react';
import { useState } from 'react';

export default function GoogleCalendarToggle() {
  const { isConnected, isTokenExpired, reconnectCalendar } = useCalendarSync();
  const [isHovered, setIsHovered] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      await reconnectCalendar();
    } catch (error) {
      console.error('Error al reconectar con Google Calendar:', error);
    } finally {
      setIsReconnecting(false);
    }
  };

  // No mostrar nada si el usuario no tiene Google auth
  if (!isConnected && !isTokenExpired) {
    return null;
  }

  // Mostrar alerta si el token expiró
  if (isTokenExpired) {
    return (
      <button
        onClick={handleReconnect}
        disabled={isReconnecting}
        className="relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors disabled:opacity-50"
        aria-label="Conectar con Google Calendar"
      >
        {isReconnecting ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <AlertCircle className="w-4 h-4" />
        )}
        <span className="hidden sm:inline whitespace-nowrap">
          {isReconnecting ? 'Conectando...' : 'Conectar Calendar'}
        </span>
      </button>
    );
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
      aria-label="Sincronizado con Google Calendar"
    >
      <Calendar className="w-4 h-4" />

      <span className="hidden sm:inline whitespace-nowrap">
        Google Calendar
      </span>

      <span className="flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
      </span>

      {/* Tooltip */}
      {isHovered && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg whitespace-nowrap">
          Los turnos se sincronizan automáticamente con Google Calendar
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45"></div>
        </div>
      )}
    </div>
  );
}
