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
            <h1 className="text-2xl font-bold text-navy-darkest dark:text-navy-darkest">Honorarios</h1>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card">
              <div className="text-xs font-semibold text-navy-darkest dark:text-white">Total Ingresos</div>
              <div className="text-4xl font-bold text-navy-darkest dark:text-white">${totalRevenue.toLocaleString()}</div>
            </div>
            <div className="card">
              <div className="text-xs font-semibold text-navy-darkest dark:text-white">Pendientes</div>
              <div className="text-4xl font-bold text-navy-darkest dark:text-white">${pendingTotal.toLocaleString()}</div>
            </div>
            <div className="card">
              <div className="text-xs font-semibold text-navy-darkest dark:text-white">Cobros</div>
              <div className="text-4xl font-bold text-navy-darkest dark:text-white">{payments.length}</div>
            </div>
            <div className="card">
              <div className="text-xs font-semibold text-navy-darkest dark:text-white">Pendientes Cobro</div>
              <div className="text-4xl font-bold text-navy-darkest dark:text-white">{pending.length}</div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card overflow-x-auto">
              <h2 className="font-semibold text-primary-dark dark:text-white mb-4">Últimos Cobros</h2>
              <table className="min-w-full text-sm">
                <thead className="bg-gradient-to-r from-primary/20 to-primary-light/20 dark:bg-gradient-to-r dark:from-primary/30 dark:to-primary-light/30">
                  <tr className="text-left">
                    <th className="p-3 font-bold text-navy-darkest dark:text-white">Paciente</th>
                    <th className="p-3 font-bold text-navy-darkest dark:text-white">Monto</th>
                    <th className="p-3 font-bold text-navy-darkest dark:text-white">Estado</th>
                    <th className="p-3 font-bold text-navy-darkest dark:text-white">Método</th>
                    <th className="p-3 font-bold text-navy-darkest dark:text-white">Fecha</th>
                  </tr>
                </thead>
                <tbody className="text-black dark:text-white">
                  {payments.slice(0,10).map(p => (
                    <tr key={p.id} className="border-t border-elegant-100 dark:border-elegant-800 hover:bg-secondary-lighter/40 dark:hover:bg-[#27272a] transition-colors">
                      <td className="p-2">{p.patientName}</td>
                      <td className="p-2">${p.amount.toLocaleString()}</td>
                      <td className="p-2">{p.status}</td>
                      <td className="p-2">{p.method}</td>
                      <td className="p-2">{new Date(p.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {payments.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-black dark:text-white">Sin registros</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="card overflow-x-auto">
              <h2 className="font-semibold text-primary-dark dark:text-white mb-4">Pendientes</h2>
              <table className="min-w-full text-sm">
                <thead className="bg-gradient-to-r from-primary/20 to-primary-light/20 dark:bg-gradient-to-r dark:from-primary/30 dark:to-primary-light/30">
                  <tr className="text-left">
                    <th className="p-3 font-bold text-navy-darkest dark:text-white">Paciente</th>
                    <th className="p-3 font-bold text-navy-darkest dark:text-white">Monto</th>
                    <th className="p-3 font-bold text-navy-darkest dark:text-white">Método</th>
                    <th className="p-3 font-bold text-navy-darkest dark:text-white">Fecha</th>
                  </tr>
                </thead>
                <tbody className="text-black dark:text-white">
                  {pending.slice(0,10).map(p => (
                    <tr key={p.id} className="border-t border-elegant-100 dark:border-elegant-800 hover:bg-secondary-lighter/40 dark:hover:bg-[#27272a] transition-colors">
                      <td className="p-2">{p.patientName}</td>
                      <td className="p-2">${p.amount.toLocaleString()}</td>
                      <td className="p-2">{p.method}</td>
                      <td className="p-2">{new Date(p.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {pending.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-black dark:text-white">Sin pendientes</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
