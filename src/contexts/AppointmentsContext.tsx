"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAppointmentsByUser, getAllAppointments } from "@/lib/appointments";
import { Appointment } from "@/types";
import { canViewAllAppointments } from "@/lib/permissions";

interface AppointmentsContextValue {
  appointments: Appointment[];
  loading: boolean;
  refreshAppointments: () => Promise<Appointment[]>;
}

const AppointmentsContext = createContext<AppointmentsContextValue | undefined>(undefined);

export const AppointmentsProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, userProfile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const refreshRef = useRef<() => Promise<Appointment[]>>();

  const refreshAppointments = useCallback(async () => {
    if (!user || !userProfile) {
      console.log('[AppointmentsContext] No user or profile, clearing appointments');
      setAppointments([]);
      setLoading(false);
      return [];
    }

    console.log('[AppointmentsContext] Refreshing appointments for user:', user.uid, 'role:', userProfile.role);
    setLoading(true);
    try {
      // Admin y secretaria ven todos los turnos, profesionales solo los suyos
      const canViewAll = canViewAllAppointments(userProfile.role);
      const list = canViewAll
        ? await getAllAppointments()
        : await getAppointmentsByUser(user.uid);

      console.log('[AppointmentsContext] Fetched appointments:', list.length, 'viewAll:', canViewAll);
      setAppointments(list);
      return list;
    } catch (error) {
      console.error("[AppointmentsContext] Error fetching appointments", error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, userProfile]);

  // Mantener referencia actualizada
  useEffect(() => {
    refreshRef.current = refreshAppointments;
  }, [refreshAppointments]);

  useEffect(() => {
    if (user && userProfile) {
      refreshAppointments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, userProfile?.role]);

  // Auto-refresh cuando la ventana vuelve al foco
  useEffect(() => {
    const handleFocus = () => {
      if ((window as any).__dentifyFilePickerOpen) {
        console.log('[AppointmentsContext] Focus refresh skipped (file picker open)');
        (window as any).__dentifyFilePickerOpen = false;
        return;
      }
      console.log('[AppointmentsContext] Window focused, refreshing data');
      refreshRef.current?.();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if ((window as any).__dentifyFilePickerOpen) {
          console.log('[AppointmentsContext] Visibility refresh skipped (file picker open)');
          (window as any).__dentifyFilePickerOpen = false;
          return;
        }
        console.log('[AppointmentsContext] Tab visible, refreshing data');
        refreshRef.current?.();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <AppointmentsContext.Provider value={{ appointments, loading, refreshAppointments }}>
      {children}
    </AppointmentsContext.Provider>
  );
};

export const useAppointments = () => {
  const context = useContext(AppointmentsContext);
  if (!context) {
    throw new Error("useAppointments must be used within AppointmentsProvider");
  }
  return context;
};
