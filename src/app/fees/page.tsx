'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { listPayments, listPendingPayments } from '@/lib/payments';
import { Payment } from '@/types';
export const dynamic = 'force-dynamic';

export default function FeesPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pending, setPending] = useState<Payment[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const all = await listPayments(user.uid);
      const pend = await listPendingPayments(user.uid);
      setPayments(all);
      setPending(pend);
    })();
  }, [user]);

  const totalRevenue = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
  const pendingTotal = pending.reduce((sum, p) => sum + p.amount, 0);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-2xl font-bold text-primary-dark">Honorarios</h1>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card"><div className="text-xs text-secondary">Total Ingresos</div><div className="text-2xl font-bold text-primary-dark">${totalRevenue.toLocaleString()}</div></div>
            <div className="card"><div className="text-xs text-secondary">Pendientes</div><div className="text-2xl font-bold text-red-600">${pendingTotal.toLocaleString()}</div></div>
            <div className="card"><div className="text-xs text-secondary">Cobros</div><div className="text-2xl font-bold text-primary-dark">{payments.length}</div></div>
            <div className="card"><div className="text-xs text-secondary">Pendientes Cobro</div><div className="text-2xl font-bold text-primary-dark">{pending.length}</div></div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card overflow-x-auto">
              <h2 className="font-semibold text-primary-dark mb-4">Últimos Cobros</h2>
              <table className="min-w-full text-sm">
                <thead className="bg-secondary-lighter">
                  <tr className="text-left text-primary-dark">
                    <th className="p-2">Paciente</th>
                    <th className="p-2">Monto</th>
                    <th className="p-2">Estado</th>
                    <th className="p-2">Método</th>
                    <th className="p-2">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.slice(0,10).map(p => (
                    <tr key={p.id} className="border-t border-secondary-lighter">
                      <td className="p-2">{p.patientName}</td>
                      <td className="p-2">${p.amount.toLocaleString()}</td>
                      <td className="p-2">{p.status}</td>
                      <td className="p-2">{p.method}</td>
                      <td className="p-2">{new Date(p.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {payments.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-secondary">Sin registros</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="card overflow-x-auto">
              <h2 className="font-semibold text-primary-dark mb-4">Pendientes</h2>
              <table className="min-w-full text-sm">
                <thead className="bg-secondary-lighter">
                  <tr className="text-left text-primary-dark">
                    <th className="p-2">Paciente</th>
                    <th className="p-2">Monto</th>
                    <th className="p-2">Método</th>
                    <th className="p-2">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.slice(0,10).map(p => (
                    <tr key={p.id} className="border-t border-secondary-lighter">
                      <td className="p-2">{p.patientName}</td>
                      <td className="p-2">${p.amount.toLocaleString()}</td>
                      <td className="p-2">{p.method}</td>
                      <td className="p-2">{new Date(p.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {pending.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-secondary">Sin pendientes</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
