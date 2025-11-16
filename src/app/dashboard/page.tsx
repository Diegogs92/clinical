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
            <div className="card">
              <h2 className="font-semibold text-primary-dark mb-4">Próximos Turnos</h2>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between"><span>09:00 - Juan Pérez</span><span className="text-secondary">Confirmado</span></li>
                <li className="flex justify-between"><span>10:30 - Ana Gómez</span><span className="text-secondary">Pendiente</span></li>
                <li className="flex justify-between"><span>12:00 - Carlos Díaz</span><span className="text-secondary">Confirmado</span></li>
                <li className="flex justify-between"><span>16:00 - Lucía Romero</span><span className="text-secondary">Pendiente</span></li>
              </ul>
            </div>
            <div className="card">
              <h2 className="font-semibold text-primary-dark mb-4">Resumen Financiero</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Ingresos Semana</span><span className="font-semibold">$38.200</span></div>
                <div className="flex justify-between"><span>Ingresos Mes</span><span className="font-semibold">$152.300</span></div>
                <div className="flex justify-between"><span>Pendientes Cobro</span><span className="font-semibold text-red-600">$18.500</span></div>
                <div className="flex justify-between"><span>Promedio por Consulta</span><span className="font-semibold">$3.200</span></div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
