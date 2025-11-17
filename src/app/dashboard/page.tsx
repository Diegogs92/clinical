'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
export const dynamic = 'force-dynamic';
import DashboardLayout from '@/components/DashboardLayout';
import StatsOverview from '@/components/dashboard/StatsOverview';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAppointmentsByUser } from '@/lib/appointments';
import { Appointment } from '@/types';
import AppointmentForm from '@/components/appointments/AppointmentForm';
import { CalendarDays, PlusCircle } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [view, setView] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [baseDate, setBaseDate] = useState<string>(() => new Date().toISOString().slice(0,10));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      try {
        const data = await getAppointmentsByUser(user.uid);
        setAppointments(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const filtered = useMemo(() => {
    const start = new Date(baseDate);
    let end = new Date(baseDate);
    switch (view) {
      case 'day':
        end = new Date(start);
        end.setDate(start.getDate() + 1);
        break;
      case 'week':
        end = new Date(start);
        end.setDate(start.getDate() + 7);
        break;
      case 'month':
        end = new Date(start);
        end.setMonth(start.getMonth() + 1);
        break;
      case 'year':
        end = new Date(start);
        end.setFullYear(start.getFullYear() + 1);
        break;
    }
    return appointments.filter(a => {
      const d = new Date(a.date);
      return d >= start && d < end;
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [appointments, baseDate, view]);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="flex items-center gap-2 text-2xl font-bold text-primary-dark dark:text-white"><CalendarDays className="w-6 h-6"/> Agenda</h1>
            <div className="flex gap-2">
              <Link href="/patients" className="btn-primary hover:shadow-md">Ver Pacientes</Link>
              <Link href="/patients/new" className="btn-secondary hover:shadow-md">Nuevo Paciente</Link>
              <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 hover:shadow-md"><PlusCircle className="w-4 h-4"/> Nuevo Turno</button>
            </div>
          </div>
          <StatsOverview />
          <div className="card">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <div className="flex items-center gap-2 bg-secondary-lighter/50 dark:bg-gray-700 rounded-lg p-1 w-fit">
                {(['day','week','month','year'] as const).map(v => (
                  <button key={v} onClick={() => setView(v)} className={`px-3 py-1 rounded-md text-sm transition-colors hover:bg-white/50 dark:hover:bg-gray-600 ${view===v ? 'bg-white dark:bg-gray-600 font-semibold' : 'text-primary-dark dark:text-gray-300'}`}>{
                    v==='day'?'Día':v==='week'?'Semana':v==='month'?'Mes':'Año'
                  }</button>
                ))}
              </div>
              <input type="date" value={baseDate} onChange={e=>setBaseDate(e.target.value)} className="input-field md:w-56" />
            </div>

            {loading ? (
              <p className="text-secondary dark:text-gray-400">Cargando turnos...</p>
            ) : filtered.length === 0 ? (
              <p className="text-secondary dark:text-gray-400">No hay turnos en el período seleccionado.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-secondary-lighter dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg">
                  <thead className="bg-secondary-lighter dark:bg-gray-700">
                    <tr className="text-left text-sm text-primary-dark dark:text-white">
                      <th className="p-2">Fecha</th>
                      <th className="p-2">Hora</th>
                      <th className="p-2">Paciente</th>
                      <th className="p-2">Tipo</th>
                      <th className="p-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-gray-900 dark:text-gray-100">
                    {filtered.map(a => {
                      const d = new Date(a.date);
                      const fecha = d.toLocaleDateString();
                      return (
                        <tr key={a.id} className="border-t border-secondary-lighter dark:border-gray-700 hover:bg-secondary-lighter/40 dark:hover:bg-gray-700">
                          <td className="p-2 font-medium">{fecha}</td>
                          <td className="p-2">{a.startTime} - {a.endTime}</td>
                          <td className="p-2">{a.patientName}</td>
                          <td className="p-2">{a.type}</td>
                          <td className="p-2 capitalize">{a.status}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {showForm && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal>
              <div className="card w-full max-w-lg relative animate-in fade-in zoom-in">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-primary-dark dark:text-white">Nuevo Turno</h3>
                  <button onClick={()=>setShowForm(false)} className="text-secondary hover:text-primary dark:hover:text-white">✕</button>
                </div>
                <AppointmentForm onCreated={() => { setShowForm(false); /* naive refresh */ location.reload(); }} onCancel={()=>setShowForm(false)} />
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
