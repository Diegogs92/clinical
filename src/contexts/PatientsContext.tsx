"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { getAllPatients, getPatientsByUser } from "@/lib/patients";
import { Patient } from "@/types";

interface PatientsContextValue {
  patients: Patient[];
  loading: boolean;
  refreshPatients: () => Promise<Patient[]>;
}

const PatientsContext = createContext<PatientsContextValue | undefined>(undefined);

export const PatientsProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { canViewAllPatients } = usePermissions();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshPatients = useCallback(async () => {
    if (!user) {
      setPatients([]);
      setLoading(false);
      return [];
    }
    setLoading(true);
    try {
      const list = canViewAllPatients
        ? await getAllPatients()
        : await getPatientsByUser(user.uid);
      setPatients(list);
      return list;
    } catch (error) {
      console.error('[PatientsContext] Error fetching patients', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, canViewAllPatients]);

  useEffect(() => {
    refreshPatients();
  }, [refreshPatients]);

  // Auto-refresh cuando la ventana vuelve al foco
  useEffect(() => {
    const handleFocus = () => {
      if ((window as any).__dentifyFilePickerOpen) {
        console.log('[PatientsContext] Focus refresh skipped (file picker open)');
        return;
      }
      console.log('[PatientsContext] Window focused, refreshing data');
      refreshPatients();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if ((window as any).__dentifyFilePickerOpen) {
          console.log('[PatientsContext] Visibility refresh skipped (file picker open)');
          return;
        }
        console.log('[PatientsContext] Tab visible, refreshing data');
        refreshPatients();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshPatients]);

  return (
    <PatientsContext.Provider value={{ patients, loading, refreshPatients }}>
      {children}
    </PatientsContext.Provider>
  );
};

export const usePatients = () => {
  const context = useContext(PatientsContext);
  if (!context) {
    throw new Error("usePatients must be used within PatientsProvider");
  }
  return context;
};
