'use client';

import { useCalendarSync } from '@/contexts/CalendarSyncContext';
import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function TokenExpirationBanner() {
  const { isTokenExpired } = useCalendarSync();
  const { signInWithGoogle, user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [isReauthing, setIsReauthing] = useState(false);

  // Resetear el dismissed cuando el token se renueva exitosamente
  useEffect(() => {
    if (!isTokenExpired) {
      setDismissed(false);
    }
  }, [isTokenExpired]);

  // Solo mostrar si el usuario está autenticado, el token expiró y no fue dismissed
  if (!user || !isTokenExpired || dismissed) {
    return null;
  }

  const handleReauth = async () => {
    try {
      setIsReauthing(true);
      console.log('[TokenBanner] Iniciando re-autenticación con Google...');

      // Re-autenticar para obtener nuevo token
      await signInWithGoogle();

      console.log('[TokenBanner] Re-autenticación exitosa');
      setDismissed(true);
    } catch (error) {
      console.error('[TokenBanner] Error al re-autenticar:', error);
      alert('Error al renovar permisos. Por favor intenta nuevamente.');
    } finally {
      setIsReauthing(false);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-pulse" />
            <div>
              <p className="font-semibold text-sm">Tu sesión con Google Calendar expiró</p>
              <p className="text-xs opacity-90">
                Los nuevos turnos no se sincronizarán hasta que renueves los permisos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReauth}
              disabled={isReauthing}
              className="bg-white text-orange-600 hover:bg-orange-50 px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isReauthing ? 'Renovando...' : 'Renovar Permisos'}
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
