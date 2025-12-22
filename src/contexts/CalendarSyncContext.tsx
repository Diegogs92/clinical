'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppointments } from '@/contexts/AppointmentsContext';
import { createAppointment, deleteAppointment, updateAppointment } from '@/lib/appointments';
import { Appointment } from '@/types';
import { getTokenInfo, clearTokenInfo } from '@/lib/tokenRefresh';

const CALENDAR_ENABLED = true;
const disabledValue: CalendarSyncContextType = {
  isConnected: false,
  isTokenExpired: false,
  syncAppointment: async () => null,
  checkTokenExpiration: () => false,
  reconnectCalendar: async () => false,
};

interface CalendarSyncContextType {
  isConnected: boolean;
  isTokenExpired: boolean;
  syncAppointment: (appointment: Appointment, action: 'create' | 'update' | 'delete', eventId?: string, officeColorId?: string) => Promise<string | null>;
  checkTokenExpiration: () => boolean;
  reconnectCalendar: () => Promise<boolean>;
}

const CalendarSyncContext = createContext<CalendarSyncContextType>({
  isConnected: false,
  isTokenExpired: false,
  syncAppointment: async () => null,
  checkTokenExpiration: () => false,
  reconnectCalendar: async () => false,
});

export function useCalendarSync() {
  return useContext(CalendarSyncContext);
}

interface Props {
  children: ReactNode;
}

export function CalendarSyncProvider({ children }: Props) {
  const { user, googleAccessToken, signInWithGoogle } = useAuth();
  const { refreshAppointments } = useAppointments();
  const [isConnected, setIsConnected] = useState(false);
  const [isTokenExpired, setIsTokenExpired] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  if (!CALENDAR_ENABLED) {
    return (
      <CalendarSyncContext.Provider value={disabledValue}>
        {children}
      </CalendarSyncContext.Provider>
    );
  }

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

    // Verificar expiración periódicamente cada 5 minutos
    const intervalId = setInterval(() => {
      if (user && googleAccessToken) {
        const expired = checkTokenExpiration();
        if (expired) {
          console.log('[CalendarSync] Token expirado detectado en chequeo periódico');
        }
      }
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(intervalId);
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

  const formatTime = (date: Date): string => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const syncFromGoogleCalendar = useCallback(async () => {
    if (!user || !googleAccessToken || syncing || !isConnected) return;

    const expired = checkTokenExpiration();
    if (expired) return;

    setSyncing(true);
    try {
      const now = new Date();
      const timeMin = new Date(now);
      timeMin.setMonth(timeMin.getMonth() - 1);
      const timeMax = new Date(now);
      timeMax.setMonth(timeMax.getMonth() + 6);

      const response = await fetch('/api/calendar/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: googleAccessToken,
          timeMin: timeMin.toISOString(),
          timeMax: timeMax.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[CalendarSync] Error al obtener eventos:', errorData);
        if (response.status === 401) {
          clearTokenInfo();
          setIsTokenExpired(true);
          setIsConnected(false);
        }
        return;
      }

      const data = await response.json();
      const events = Array.isArray(data.items) ? data.items : [];
      if (!events.length) return;

      const currentAppointments = await refreshAppointments();
      const byEventId = new Map(
        currentAppointments
          .filter(a => a.googleCalendarEventId)
          .map(a => [a.googleCalendarEventId as string, a])
      );
      const byId = new Map(currentAppointments.map(a => [a.id, a]));

      for (const event of events) {
        if (!event?.id) continue;

        const privateMeta = event.extendedProperties?.private || {};
        const target =
          (privateMeta.appointmentId && byId.get(privateMeta.appointmentId)) ||
          byEventId.get(event.id);

        if (event.status === 'cancelled') {
          if (target) {
            await deleteAppointment(target.id);
          }
          continue;
        }

        const startDateTime = event.start?.dateTime;
        const endDateTime = event.end?.dateTime;
        if (!startDateTime || !endDateTime) {
          console.warn('[CalendarSync] Evento sin dateTime, se omite:', event.id);
          continue;
        }

        const startDate = new Date(startDateTime);
        const endDate = new Date(endDateTime);
        const duration = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 60000));
        const date = startDate.toISOString();
        const startTime = formatTime(startDate);
        const endTime = formatTime(endDate);

        const hasPatientMeta = privateMeta.patientName || privateMeta.patientId;
        const appointmentType = privateMeta.appointmentType === 'patient' && hasPatientMeta ? 'patient' : 'personal';

        const basePayload: Partial<Appointment> = {
          appointmentType,
          patientId: privateMeta.patientId || undefined,
          patientName: privateMeta.patientName || undefined,
          title: event.summary || 'Evento',
          notes: event.description || '',
          date,
          startTime,
          endTime,
          duration,
          status: 'scheduled',
          userId: privateMeta.userId || user.uid,
          googleCalendarEventId: event.id,
        };

        if (target) {
          const updatePayload: Partial<Appointment> = {};

          if (target.date !== basePayload.date) updatePayload.date = basePayload.date;
          if (target.startTime !== basePayload.startTime) updatePayload.startTime = basePayload.startTime;
          if (target.endTime !== basePayload.endTime) updatePayload.endTime = basePayload.endTime;
          if (target.duration !== basePayload.duration) updatePayload.duration = basePayload.duration;

          if (appointmentType === 'personal') {
            if (target.title !== basePayload.title) updatePayload.title = basePayload.title;
            if (target.notes !== basePayload.notes) updatePayload.notes = basePayload.notes;
          }

          if (!target.googleCalendarEventId) {
            updatePayload.googleCalendarEventId = basePayload.googleCalendarEventId;
          }

          if (Object.keys(updatePayload).length > 0) {
            await updateAppointment(target.id, updatePayload);
          }
        } else {
          await createAppointment({
            ...basePayload,
            status: 'scheduled',
          } as Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>);
        }
      }
    } catch (error) {
      console.error('[CalendarSync] Error sincronizando desde Google:', error);
    } finally {
      setSyncing(false);
    }
  }, [user, googleAccessToken, syncing, isConnected, refreshAppointments]);

  // DESHABILITADO TEMPORALMENTE: Causa bucle infinito
  // TODO: Arreglar dependencias para evitar re-renderizados infinitos
  /*
  useEffect(() => {
    if (!isConnected || !googleAccessToken) return;
    syncFromGoogleCalendar();
    const intervalId = setInterval(() => {
      syncFromGoogleCalendar();
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [isConnected, googleAccessToken, syncFromGoogleCalendar]);
  */

  const reconnectCalendar = async (): Promise<boolean> => {
    if (isReconnecting) {
      console.log('[CalendarSync] Ya hay una reconexión en progreso');
      return false;
    }

    setIsReconnecting(true);
    try {
      console.log('[CalendarSync] 🔄 Intentando reconexión automática con Google Calendar...');
      await signInWithGoogle();

      // Esperar un momento para que el token se guarde
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('[CalendarSync] ✅ Reconexión exitosa');
      setIsTokenExpired(false);
      setIsConnected(true);
      return true;
    } catch (error) {
      console.error('[CalendarSync] ❌ Error al reconectar:', error);
      return false;
    } finally {
      setIsReconnecting(false);
    }
  };

  const syncAppointment = async (
    appointment: Appointment,
    action: 'create' | 'update' | 'delete',
    eventId?: string,
    officeColorId?: string
  ): Promise<string | null> => {
    // Función interna para hacer el sync real
    const doSync = async (token: string): Promise<string | null> => {
      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointment: { ...appointment, googleCalendarEventId: eventId },
          action,
          accessToken: token,
          officeColorId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Si es un error 401, retornar un error especial
        if (response.status === 401) {
          throw new Error('TOKEN_EXPIRED');
        }

        throw new Error(errorData.error || 'Failed to sync');
      }

      const data = await response.json();
      return data.eventId;
    };

    // Verificar si el token está expirado ANTES de intentar sincronizar
    const expired = checkTokenExpiration();
    if (expired) {
      console.warn('[CalendarSync] Token expirado detectado. Intentando reconexión automática...');
      const reconnected = await reconnectCalendar();

      if (!reconnected) {
        console.error('[CalendarSync] No se pudo reconectar automáticamente');
        return null;
      }

      // Obtener el nuevo token
      const newToken = localStorage.getItem('google_access_token');
      if (!newToken) {
        console.error('[CalendarSync] No se pudo obtener nuevo token después de reconectar');
        return null;
      }

      console.log('[CalendarSync] Reintentando sincronización con nuevo token...');
      try {
        const eventId = await doSync(newToken);
        console.log('[CalendarSync] ✅ Sincronizado exitosamente después de reconectar. Event ID:', eventId);
        return eventId;
      } catch (error) {
        console.error('[CalendarSync] Error al sincronizar después de reconectar:', error);
        return null;
      }
    }

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
      const eventId = await doSync(googleAccessToken);
      console.log('[CalendarSync] ✅ Sincronizado exitosamente. Event ID:', eventId);
      return eventId;
    } catch (error: any) {
      // Si el token expiró durante la sincronización, intentar reconectar y reintentar UNA VEZ
      if (error.message === 'TOKEN_EXPIRED') {
        console.warn('[CalendarSync] Token expiró durante sincronización. Intentando reconexión automática...');
        clearTokenInfo();
        setIsTokenExpired(true);
        setIsConnected(false);

        const reconnected = await reconnectCalendar();
        if (!reconnected) {
          console.error('[CalendarSync] No se pudo reconectar automáticamente');
          return null;
        }

        const newToken = localStorage.getItem('google_access_token');
        if (!newToken) {
          console.error('[CalendarSync] No se pudo obtener nuevo token');
          return null;
        }

        console.log('[CalendarSync] Reintentando sincronización con nuevo token...');
        try {
          const eventId = await doSync(newToken);
          console.log('[CalendarSync] ✅ Sincronizado exitosamente después de reconectar. Event ID:', eventId);
          return eventId;
        } catch (retryError) {
          console.error('[CalendarSync] Error al reintentar después de reconectar:', retryError);
          return null;
        }
      }

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
        reconnectCalendar,
      }}
    >
      {children}
    </CalendarSyncContext.Provider>
  );
}
