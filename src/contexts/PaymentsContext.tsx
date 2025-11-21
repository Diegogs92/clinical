'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Payment } from '@/types';
import { listPayments, listPendingPayments } from '@/lib/payments';
import { useAuth } from './AuthContext';

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
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshPayments = useCallback(async () => {
    if (!user) {
      setPayments([]);
      return [];
    }
    try {
      const data = await listPayments(user.uid);
      setPayments(data);
      return data;
    } catch (error) {
      console.error('Error loading payments:', error);
      return [];
    }
  }, [user]);

  const refreshPendingPayments = useCallback(async () => {
    if (!user) {
      setPendingPayments([]);
      return [];
    }
    try {
      const data = await listPendingPayments(user.uid);
      setPendingPayments(data);
      return data;
    } catch (error) {
      console.error('Error loading pending payments:', error);
      return [];
    }
  }, [user]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([refreshPayments(), refreshPendingPayments()]);
      setLoading(false);
    };
    loadData();
  }, [refreshPayments, refreshPendingPayments]);

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
