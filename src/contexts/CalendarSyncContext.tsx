'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppointments } from '@/contexts/AppointmentsContext';
import { createAppointment, deleteAppointment, updateAppointment } from '@/lib/appointments';
import { Appointment } from '@/types';

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
  const { user } = useAuth();
  const { refreshAppointments } = useAppointments();
  const [isConnected, setIsConnected] = useState(false);
  const [isTokenExpired, setIsTokenExpired] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const syncingRef = useRef(false);

  if (!CALENDAR_ENABLED) {
    return (
      <CalendarSyncContext.Provider value={disabledValue}>
        {children}
      </CalendarSyncContext.Provider>
    );
  }

  const getAuthHeader = useCallback(async () => {
    if (!user) return null;
    const idToken = await user.getIdToken();
    return `Bearer ${idToken}`;
  }, [user]);

  const checkTokenExpiration = (): boolean => {
    if (!user) {
      setIsConnected(false);
      setIsTokenExpired(false);
      return false;
    }

    setIsTokenExpired(!isConnected);
    return !isConnected;
  };

  const refreshConnectionStatus = useCallback(async () => {
    if (!user) {
      setIsConnected(false);
      setIsTokenExpired(false);
      return false;
    }

    const authHeader = await getAuthHeader();
    if (!authHeader) return false;

    try {
      const response = await fetch('/api/google/calendar/status', {
        headers: {
          Authorization: authHeader,
        },
      });
      const data = await response.json();
      const connected = !!data.connected;
      setIsConnected(connected);
      setIsTokenExpired(!connected);
      return connected;
    } catch (error) {
      console.error('[CalendarSync] Error verificando estado:', error);
      setIsConnected(false);
      setIsTokenExpired(true);
      return false;
    }
  }, [user, getAuthHeader]);

  useEffect(() => {
    refreshConnectionStatus();
  }, [refreshConnectionStatus]);

  useEffect(() => {
    if (!user) return;
    const intervalId = setInterval(() => {
      refreshConnectionStatus();
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [user, refreshConnectionStatus]);

  const formatTime = (date: Date): string => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const syncFromGoogleCalendar = useCallback(async () => {
    if (!user || syncingRef.current || !isConnected) return;

    syncingRef.current = true;
    setSyncing(true);
    try {
      const now = new Date();
      const timeMin = new Date(now);
      timeMin.setMonth(timeMin.getMonth() - 1);
      const timeMax = new Date(now);
      timeMax.setMonth(timeMax.getMonth() + 6);

      const authHeader = await getAuthHeader();
      if (!authHeader) return;

      const response = await fetch('/api/calendar/pull', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          timeMin: timeMin.toISOString(),
          timeMax: timeMax.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[CalendarSync] Error al obtener eventos:', errorData);
        if (response.status === 401) {
          setIsConnected(false);
          setIsTokenExpired(true);
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
      syncingRef.current = false;
      setSyncing(false);
    }
  }, [user, isConnected, refreshAppointments, getAuthHeader]);

  useEffect(() => {
    if (!isConnected) return;
    syncFromGoogleCalendar();
    const intervalId = setInterval(() => {
      syncFromGoogleCalendar();
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [isConnected, syncFromGoogleCalendar]);

  const reconnectCalendar = async (): Promise<boolean> => {
    if (!user) return false;

    const authHeader = await getAuthHeader();
    if (!authHeader) return false;

    try {
      const response = await fetch('/api/google/calendar/connect', {
        method: 'POST',
        headers: {
          Authorization: authHeader,
        },
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      if (data?.url) {
        window.location.assign(data.url);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[CalendarSync] Error conectando Calendar:', error);
      return false;
    }
  };

  const syncAppointment = async (
    appointment: Appointment,
    action: 'create' | 'update' | 'delete',
    eventId?: string,
    officeColorId?: string
  ): Promise<string | null> => {
    if (!isConnected || !user) {
      console.warn('[CalendarSync] No conectado a Google Calendar');
      return null;
    }

    const authHeader = await getAuthHeader();
    if (!authHeader) return null;

    try {
      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          appointment: { ...appointment, googleCalendarEventId: eventId },
          action,
          officeColorId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[CalendarSync] Error del servidor:', errorData);
        if (response.status === 401) {
          setIsConnected(false);
          setIsTokenExpired(true);
        }
        return null;
      }

      const data = await response.json();
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
        reconnectCalendar,
      }}
    >
      {children}
    </CalendarSyncContext.Provider>
  );
}
