'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
export const dynamic = 'force-dynamic';
import DashboardLayout from '@/components/DashboardLayout';
import StatsOverview from '@/components/dashboard/StatsOverview';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-2xl font-bold text-primary-dark">Dashboard</h1>
            <div className="flex gap-2">
              <Link href="/patients" className="btn-primary">Ver Pacientes</Link>
              <Link href="/patients/new" className="btn-secondary">Nuevo Paciente</Link>
            </div>
          </div>
          <StatsOverview />
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card dark:bg-gray-800 dark:border-gray-700">
              <h2 className="font-semibold text-primary-dark dark:text-white mb-4">Próximos Turnos</h2>
              <p className="text-sm text-secondary dark:text-gray-400">No hay turnos registrados aún.</p>
            </div>
            <div className="card dark:bg-gray-800 dark:border-gray-700">
              <h2 className="font-semibold text-primary-dark dark:text-white mb-4">Resumen Financiero</h2>
              <p className="text-sm text-secondary dark:text-gray-400">No hay datos financieros disponibles.</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
