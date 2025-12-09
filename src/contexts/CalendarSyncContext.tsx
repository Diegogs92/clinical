'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Appointment } from '@/types';
import { getTokenInfo, clearTokenInfo } from '@/lib/tokenRefresh';

interface CalendarSyncContextType {
  isConnected: boolean;
  isTokenExpired: boolean;
  syncAppointment: (appointment: Appointment, action: 'create' | 'update' | 'delete', eventId?: string, officeColorId?: string) => Promise<string | null>;
  checkTokenExpiration: () => boolean;
}

const CalendarSyncContext = createContext<CalendarSyncContextType>({
  isConnected: false,
  isTokenExpired: false,
  syncAppointment: async () => null,
  checkTokenExpiration: () => false,
});

export function useCalendarSync() {
  return useContext(CalendarSyncContext);
}

interface Props {
  children: ReactNode;
}

export function CalendarSyncProvider({ children }: Props) {
  const { user, googleAccessToken } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isTokenExpired, setIsTokenExpired] = useState(false);

  useEffect(() => {
    console.log('[CalendarSync] useEffect - Estado actual:', {
      hasUser: !!user,
      hasToken: !!googleAccessToken,
      tokenLength: googleAccessToken?.length || 0
    });

    // Si el usuario está autenticado con Google, está "conectado" para Calendar
    if (user && googleAccessToken) {
      console.log('[CalendarSync] ✅ Usuario conectado con token válido');
      setIsConnected(true);
      // Verificar si el token está expirado
      checkTokenExpiration();
    } else {
      console.log('[CalendarSync] ❌ Usuario NO conectado:', {
        reason: !user ? 'no user' : 'no token'
      });
      setIsConnected(false);
      setIsTokenExpired(false);
    }
  }, [user, googleAccessToken]);

  const checkTokenExpiration = (): boolean => {
    const tokenInfo = getTokenInfo();
    if (!tokenInfo) {
      setIsTokenExpired(false);
      return false;
    }

    const now = Date.now();
    const expired = tokenInfo.expiresAt <= now;

    if (expired) {
      console.warn('[CalendarSync] Token expirado. Necesitas volver a iniciar sesión.');
      setIsTokenExpired(true);
      return true;
    }

    setIsTokenExpired(false);
    return false;
  };

  const syncAppointment = async (
    appointment: Appointment,
    action: 'create' | 'update' | 'delete',
    eventId?: string,
    officeColorId?: string
  ): Promise<string | null> => {
    if (!isConnected) {
      console.warn('[CalendarSync] No conectado a Google Calendar');
      return null;
    }

    if (!googleAccessToken) {
      console.warn('[CalendarSync] No hay access token de Google. Inicia sesión con Google para sincronizar.');
      return null;
    }

    console.log('[CalendarSync] Iniciando sincronización:', { action, officeColorId });

    try {
      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointment: { ...appointment, googleCalendarEventId: eventId },
          action,
          accessToken: googleAccessToken,
          officeColorId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[CalendarSync] Error del servidor:', errorData);

        // Si es un error 401 (Unauthorized), el token expiró
        if (response.status === 401) {
          console.warn('[CalendarSync] Token expirado (401). Limpiando token y marcando como expirado.');
          clearTokenInfo();
          setIsTokenExpired(true);
        }

        throw new Error(errorData.error || 'Failed to sync');
      }

      const data = await response.json();
      console.log('[CalendarSync] ✅ Sincronizado exitosamente. Event ID:', data.eventId);
      return data.eventId;
    } catch (error) {
      console.error('[CalendarSync] Error syncing appointment:', error);
      return null;
    }
  };

  return (
    <CalendarSyncContext.Provider
      value={{
        isConnected,
        isTokenExpired,
        syncAppointment,
        checkTokenExpiration,
      }}
    >
      {children}
    </CalendarSyncContext.Provider>
  );
}
