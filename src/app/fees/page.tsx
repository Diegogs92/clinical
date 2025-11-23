'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { usePayments } from '@/contexts/PaymentsContext';
export const dynamic = 'force-dynamic';

export default function FeesPage() {
  const { payments, pendingPayments: pending } = usePayments();

  const totalRevenue = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
  const pendingTotal = pending.reduce((sum, p) => sum + p.amount, 0);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-2xl font-bold text-navy-darkest dark:text-white">Honorarios</h1>
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
              <table className="table-skin">
                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>Monto</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.slice(0, 10).map(p => (
                    <tr key={p.id}>
                      <td>{p.patientName}</td>
                      <td>${p.amount.toLocaleString()}</td>
                      <td>{new Date(p.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-black dark:text-white">Sin registros</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="card overflow-x-auto">
              <h2 className="font-semibold text-primary-dark dark:text-white mb-4">Pendientes</h2>
              <table className="table-skin">
                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>Monto</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.slice(0, 10).map(p => (
                    <tr key={p.id}>
                      <td>{p.patientName}</td>
                      <td>${p.amount.toLocaleString()}</td>
                      <td>{new Date(p.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {pending.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-black dark:text-white">Sin pendientes</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
