'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Appointment } from '@/types';

interface CalendarSyncContextType {
  isConnected: boolean;
  syncEnabled: boolean;
  toggleSync: () => void;
  syncAppointment: (appointment: Appointment, action: 'create' | 'update' | 'delete', eventId?: string) => Promise<string | null>;
}

const CalendarSyncContext = createContext<CalendarSyncContextType>({
  isConnected: false,
  syncEnabled: false,
  toggleSync: () => {},
  syncAppointment: async () => null,
});

export function useCalendarSync() {
  return useContext(CalendarSyncContext);
}

interface Props {
  children: ReactNode;
}

export function CalendarSyncProvider({ children }: Props) {
  const { user } = useAuth();
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Si el usuario está autenticado, consideramos que está "conectado" para Google Calendar
    if (user) {
      setIsConnected(true);
      // Cargar preferencia de sincronización del localStorage
      const saved = localStorage.getItem('calendar_sync_enabled');
      setSyncEnabled(saved === 'true');
    } else {
      setIsConnected(false);
      setSyncEnabled(false);
    }
  }, [user]);

  const toggleSync = () => {
    const newValue = !syncEnabled;
    setSyncEnabled(newValue);
    localStorage.setItem('calendar_sync_enabled', String(newValue));
  };

  const syncAppointment = async (
    appointment: Appointment,
    action: 'create' | 'update' | 'delete',
    eventId?: string
  ): Promise<string | null> => {
      if (!syncEnabled || !isConnected) {
      return null;
    }

    try {
        const response = await fetch('/api/calendar/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appointment: { ...appointment, googleCalendarEventId: eventId },
            action,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to sync');
      }

        const data = await response.json();
        return data.eventId;
    } catch (error) {
      console.error('Error syncing appointment:', error);
      return null;
    }
  };

  return (
    <CalendarSyncContext.Provider
      value={{
        isConnected,
        syncEnabled,
        toggleSync,
        syncAppointment,
      }}
    >
      {children}
    </CalendarSyncContext.Provider>
  );
}
