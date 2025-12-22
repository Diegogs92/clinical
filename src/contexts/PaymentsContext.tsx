'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Payment } from '@/types';
import { deletePayment, listPayments, listPendingPayments } from '@/lib/payments';
import { useAuth } from './AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useAppointments } from '@/contexts/AppointmentsContext';

interface PaymentsContextType {
  payments: Payment[];
  pendingPayments: Payment[];
  loading: boolean;
  refreshPayments: () => Promise<Payment[]>;
  refreshPendingPayments: () => Promise<Payment[]>;
}

const PaymentsContext = createContext<PaymentsContextType | undefined>(undefined);

export function PaymentsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { canViewAllPayments } = usePermissions();
  const { appointments } = useAppointments();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshPayments = useCallback(async () => {
    if (!user) {
      setPayments([]);
      return [];
    }
    try {
      const data = await listPayments(user.uid, canViewAllPayments);
      setPayments(data);
      return data;
    } catch (error) {
      console.error('Error loading payments:', error);
      return [];
    }
  }, [user, canViewAllPayments]);

  const refreshPendingPayments = useCallback(async () => {
    if (!user) {
      setPendingPayments([]);
      return [];
    }
    try {
      const data = await listPendingPayments(user.uid, canViewAllPayments);
      setPendingPayments(data);
      return data;
    } catch (error) {
      console.error('Error loading pending payments:', error);
      return [];
    }
  }, [user, canViewAllPayments]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([refreshPayments(), refreshPendingPayments()]);
      setLoading(false);
    };
    loadData();
  }, [refreshPayments, refreshPendingPayments]);

  useEffect(() => {
    if (!user) return;
    if (pendingPayments.length === 0) return;

    const appointmentIds = new Set(appointments.map(a => a.id));
    const orphanPending = pendingPayments.filter(p => p.appointmentId && !appointmentIds.has(p.appointmentId));

    if (orphanPending.length === 0) return;

    const cleanup = async () => {
      try {
        await Promise.all(orphanPending.map(p => deletePayment(p.id)));
        await Promise.all([refreshPayments(), refreshPendingPayments()]);
      } catch (error) {
        console.error('Error limpiando pagos pendientes sin turno:', error);
      }
    };

    cleanup();
  }, [appointments, pendingPayments, refreshPayments, refreshPendingPayments, user]);

  return (
    <PaymentsContext.Provider
      value={{
        payments,
        pendingPayments,
        loading,
        refreshPayments,
        refreshPendingPayments,
      }}
    >
      {children}
    </PaymentsContext.Provider>
  );
}

export function usePayments() {
  const context = useContext(PaymentsContext);
  if (context === undefined) {
    throw new Error('usePayments must be used within a PaymentsProvider');
  }
  return context;
}
