'use client';

import { useCalendarSync } from '@/contexts/CalendarSyncContext';
import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle, X } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { getTokenInfo } from '@/lib/tokenRefresh';

export default function TokenExpirationBanner() {
  const { isTokenExpired, checkTokenExpiration } = useCalendarSync();
  const { signInWithGoogle, user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [isReauthing, setIsReauthing] = useState(false);
  const [autoRenewing, setAutoRenewing] = useState(false);

  // Función para renovar token automáticamente de manera silenciosa
  const autoRenewToken = useCallback(async () => {
    if (autoRenewing || isReauthing) return;

    try {
      setAutoRenewing(true);
      console.log('[TokenBanner] Renovando token automáticamente de forma silenciosa...');

      // Intentar renovar sin mostrar popup
      await signInWithGoogle();

      console.log('[TokenBanner] Token renovado automáticamente');
      setDismissed(false); // Asegurar que el banner se oculta
    } catch (error) {
      console.warn('[TokenBanner] No se pudo renovar automáticamente:', error);
      // Si falla, mostrar el banner para renovación manual
    } finally {
      setAutoRenewing(false);
    }
  }, [autoRenewing, isReauthing, signInWithGoogle]);

  // Detectar actividad del usuario y verificar si el token está por expirar
  useEffect(() => {
    if (!user) return;

    const checkAndRenew = () => {
      const tokenInfo = getTokenInfo();
      if (!tokenInfo) return;

      const now = Date.now();
      const timeUntilExpiry = tokenInfo.expiresAt - now;
      const twentyMinutes = 20 * 60 * 1000; // Aumentado de 10 a 20 minutos

      // Si faltan menos de 20 minutos para que expire, renovar automáticamente
      if (timeUntilExpiry > 0 && timeUntilExpiry < twentyMinutes) {
        console.log('[TokenBanner] Token expirará pronto (en', Math.floor(timeUntilExpiry / 60000), 'minutos), renovando automáticamente...');
        autoRenewToken();
      }
    };

    // Verificar cada 1 minuto (más frecuente)
    const intervalId = setInterval(checkAndRenew, 60 * 1000);

    // Verificar cuando hay actividad del usuario
    const events = ['click', 'keydown', 'mousemove', 'touchstart'];
    const activityHandler = () => {
      checkAndRenew();
    };

    // Throttle: solo verificar una vez por minuto máximo
    let lastCheck = 0;
    const throttledHandler = () => {
      const now = Date.now();
      if (now - lastCheck > 60000) { // 1 minuto
        lastCheck = now;
        activityHandler();
      }
    };

    events.forEach(event => window.addEventListener(event, throttledHandler, { passive: true }));

    // Verificar inmediatamente al montar
    checkAndRenew();

    return () => {
      clearInterval(intervalId);
      events.forEach(event => window.removeEventListener(event, throttledHandler));
    };
  }, [user, autoRenewToken]);

  // Resetear el dismissed cuando el token se renueva exitosamente
  useEffect(() => {
    if (!isTokenExpired) {
      setDismissed(false);
    }
  }, [isTokenExpired]);

  // Solo mostrar si el usuario está autenticado, el token expiró y no fue dismissed
  if (!user || !isTokenExpired || dismissed || autoRenewing) {
    return null;
  }

  const handleReauth = async () => {
    try {
      setIsReauthing(true);
      console.log('[TokenBanner] Iniciando re-autenticación manual con Google...');

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
    <div className="fixed bottom-4 right-4 z-[9999] max-w-md">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-xl rounded-lg p-4 border border-blue-400">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-sm mb-1">Permisos de Google Calendar</p>
            <p className="text-xs opacity-90 mb-3">
              Para sincronizar turnos con Google Calendar, necesitas renovar los permisos (se vencen cada hora por seguridad de Google)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReauth}
                disabled={isReauthing}
                className="bg-white text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isReauthing ? 'Renovando...' : 'Renovar Permisos'}
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="text-white/80 hover:text-white text-xs underline"
              >
                Más tarde
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
