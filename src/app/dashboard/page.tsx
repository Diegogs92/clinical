'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
export const dynamic = 'force-dynamic';
import DashboardLayout from '@/components/DashboardLayout';
import StatsOverview from '@/components/dashboard/StatsOverview';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAppointmentsByUser, updateAppointment, deleteAppointment } from '@/lib/appointments';
import { Appointment } from '@/types';
import AppointmentForm from '@/components/appointments/AppointmentForm';
import { CalendarDays, PlusCircle, Edit2, Trash2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/contexts/ToastContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import { translateAppointmentStatus } from '@/lib/translations';

export default function DashboardPage() {
  const { user } = useAuth();
  const [view, setView] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [baseDate, setBaseDate] = useState<string>(() => new Date().toISOString().slice(0,10));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const toast = useToast();
  const confirm = useConfirm();

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

  const handleEdit = (appt: Appointment) => {
    setEditingAppointment(appt);
    setShowForm(true);
  };

  const handleDelete = async (appt: Appointment) => {
    const confirmed = await confirm({
      title: 'Eliminar turno',
      description: `¿Estás seguro de eliminar el turno de ${appt.patientName}? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      tone: 'danger'
    });
    if (!confirmed) return;

    try {
      await deleteAppointment(appt.id);
      setAppointments(prev => prev.filter(a => a.id !== appt.id));
      toast.success('Turno eliminado correctamente');
    } catch (error) {
      toast.error('Error al eliminar el turno');
    }
  };

  const refreshAppointments = async () => {
    if (!user) return;
    try {
      const data = await getAppointmentsByUser(user.uid);
      setAppointments(data);
    } catch (error) {
      toast.error('Error al cargar turnos');
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="flex items-center gap-2 text-2xl font-bold text-primary-dark dark:text-white"><CalendarDays className="w-6 h-6"/> Agenda</h1>
            <div className="flex gap-2">
              <button onClick={() => { setEditingAppointment(null); setShowForm(true); }} className="btn-primary flex items-center gap-2 hover:shadow-lg hover:scale-105 transition-all"><PlusCircle className="w-4 h-4"/> Nuevo Turno</button>
            </div>
          </div>
          <StatsOverview />
          <div className="card">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <div className="flex items-center gap-2 bg-secondary-lighter/50 dark:bg-gray-700 rounded-lg p-1 w-fit">
                {(['day','week','month','year'] as const).map(v => (
                  <button key={v} onClick={() => setView(v)} className={`px-3 py-1 rounded-md text-sm transition-all hover:bg-white/70 dark:hover:bg-gray-600 hover:shadow-sm ${view===v ? 'bg-white dark:bg-gray-600 font-semibold' : 'text-primary-dark dark:text-gray-300'}`}>{
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
                      <th className="p-2 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-gray-900 dark:text-gray-100">
                    {filtered.map(a => {
                      const d = new Date(a.date);
                      const fecha = d.toLocaleDateString();
                      return (
                        <tr key={a.id} className="border-t border-secondary-lighter dark:border-gray-700 hover:bg-secondary-lighter/40 dark:hover:bg-gray-700 transition-colors">
                          <td className="p-2 font-medium">{fecha}</td>
                          <td className="p-2">{a.startTime} - {a.endTime}</td>
                          <td className="p-2">{a.patientName}</td>
                          <td className="p-2">{a.type}</td>
                          <td className="p-2">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                              a.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                              a.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                              a.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                              a.status === 'no-show' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' :
                              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}>
                              {translateAppointmentStatus(a.status)}
                            </span>
                          </td>
                          <td className="p-2 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEdit(a)}
                                className="text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-white transition-all hover:scale-110"
                                aria-label="Editar turno"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(a)}
                                className="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-all hover:scale-110"
                                aria-label="Eliminar turno"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <Modal open={showForm} onClose={()=>{setShowForm(false); setEditingAppointment(null);}} title={editingAppointment ? 'Editar Turno' : 'Nuevo Turno'}>
            <AppointmentForm
              initialData={editingAppointment || undefined}
              onCreated={(appt?: Appointment) => {
                setShowForm(false);
                setEditingAppointment(null);
                refreshAppointments();
                toast.success(editingAppointment ? 'Turno actualizado correctamente' : 'Turno creado correctamente');
              }}
              onCancel={()=>{setShowForm(false); setEditingAppointment(null);}}
            />
          </Modal>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
