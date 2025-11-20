'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
export const dynamic = 'force-dynamic';
import DashboardLayout from '@/components/DashboardLayout';
import StatsOverview from '@/components/dashboard/StatsOverview';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updateAppointment, deleteAppointment } from '@/lib/appointments';
import { Appointment } from '@/types';
import { usePatients } from '@/contexts/PatientsContext';
import { useAppointments } from '@/contexts/AppointmentsContext';
import AppointmentForm from '@/components/appointments/AppointmentForm';
import { CalendarDays, PlusCircle, Edit2, Trash2, Filter } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/contexts/ToastContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import { translateAppointmentStatus } from '@/lib/translations';
import ECGLoader from '@/components/ui/ECGLoader';
import GlassViewSelector from '@/components/GlassViewSelector';

export default function DashboardPage() {
  const { user } = useAuth();
  const { patients } = usePatients();
  const { appointments, loading: appointmentsLoading, refreshAppointments } = useAppointments();
  const [view, setView] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [baseDate, setBaseDate] = useState<string>(() => new Date().toISOString().slice(0,10));
  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  // Filtros
  const [filterPatient, setFilterPatient] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const toast = useToast();
  const confirm = useConfirm();

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
      const inDateRange = d >= start && d < end;
      const matchesPatient = !filterPatient || a.patientId === filterPatient;
      const matchesStatus = !filterStatus || a.status === filterStatus;
      const matchesType = !filterType || a.type.toLowerCase().includes(filterType.toLowerCase());

      return inDateRange && matchesPatient && matchesStatus && matchesType;
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [appointments, baseDate, view, filterPatient, filterStatus, filterType]);

  const uniqueTypes = useMemo(() => {
    const types = new Set(appointments.map(a => a.type));
    return Array.from(types).sort();
  }, [appointments]);

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
      await refreshAppointments();
      toast.success('Turno eliminado correctamente');
    } catch (error) {
      toast.error('Error al eliminar el turno');
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
              <GlassViewSelector
                options={[
                  { value: 'day', label: 'Día' },
                  { value: 'week', label: 'Semana' },
                  { value: 'month', label: 'Mes' },
                  { value: 'year', label: 'Año' }
                ]}
                value={view}
                onChange={(v) => setView(v as 'day' | 'week' | 'month' | 'year')}
              />
              <input type="date" value={baseDate} onChange={e=>setBaseDate(e.target.value)} className="input-field md:w-56" />
            </div>

            {/* Filtros - Botón toggle en móvil */}
            <div className="mb-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden w-full flex items-center justify-between px-4 py-3 bg-secondary-lighter/30 dark:bg-gray-700/30 rounded-lg text-sm font-medium text-primary-dark dark:text-white mb-2"
              >
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <span>Filtros</span>
                  {(filterPatient || filterStatus || filterType) && (
                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-primary rounded-full">
                      !
                    </span>
                  )}
                </div>
                <span className="text-xs">{showFilters ? '▲' : '▼'}</span>
              </button>

              {/* Filtros desplegables */}
              <div className={`${showFilters ? 'block' : 'hidden'} md:flex flex-col md:flex-row gap-3 p-4 bg-secondary-lighter/30 dark:bg-gray-700/30 rounded-lg`}>
                <div className="hidden md:flex items-center gap-2 text-sm font-medium text-primary-dark dark:text-white">
                  <Filter className="w-4 h-4" />
                  Filtros:
                </div>
                <select
                  value={filterPatient}
                  onChange={e => setFilterPatient(e.target.value)}
                  className="input-field flex-1"
                >
                  <option value="">Todos los pacientes</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{`${p.lastName} ${p.firstName}`}</option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="input-field flex-1"
                >
                  <option value="">Todos los estados</option>
                  <option value="scheduled">Programado</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="completed">Completado</option>
                  <option value="cancelled">Cancelado</option>
                  <option value="no-show">No asistió</option>
                </select>
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className="input-field flex-1"
                >
                  <option value="">Todos los tipos</option>
                  {uniqueTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {(filterPatient || filterStatus || filterType) && (
                  <button
                    onClick={() => {
                      setFilterPatient('');
                      setFilterStatus('');
                      setFilterType('');
                    }}
                    className="px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all whitespace-nowrap"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            {appointmentsLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-primary dark:text-white">
                <ECGLoader />
                <p className="mt-4 text-sm">Cargando turnos...</p>
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-secondary dark:text-gray-400">No hay turnos en el período seleccionado.</p>
            ) : (
              <>
                {/* Vista Desktop: Tabla */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full bg-white dark:bg-[#18181b] rounded-lg">
                    <thead className="bg-gradient-to-r from-primary/20 to-primary-light/20 dark:bg-gradient-to-r dark:from-primary/30 dark:to-primary-light/30">
                      <tr className="text-left text-sm">
                        <th className="p-3 font-bold text-navy-darkest dark:text-white">Fecha</th>
                        <th className="p-3 font-bold text-navy-darkest dark:text-white">Hora</th>
                        <th className="p-3 font-bold text-navy-darkest dark:text-white">Paciente</th>
                        <th className="p-3 font-bold text-navy-darkest dark:text-white">Tipo</th>
                        <th className="p-3 font-bold text-navy-darkest dark:text-white">Estado</th>
                        <th className="p-3 text-right font-bold text-navy-darkest dark:text-white">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm text-gray-900 dark:text-gray-100">
                      {filtered.map(a => {
                        const d = new Date(a.date);
                        const fecha = d.toLocaleDateString();
                        return (
                          <tr key={a.id} className="border-t border-elegant-100 dark:border-elegant-800 hover:bg-secondary-lighter/40 dark:hover:bg-[#27272a] transition-colors">
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
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleEdit(a)}
                                  className="icon-btn-primary"
                                  aria-label="Editar turno"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(a)}
                                  className="icon-btn-danger"
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

                {/* Vista Mobile: Cards */}
                <div className="md:hidden space-y-3">
                  {filtered.map(a => {
                    const d = new Date(a.date);
                    const fecha = d.toLocaleDateString();
                    return (
                      <div
                        key={a.id}
                        className="bg-white dark:bg-[#18181b] border border-secondary-lighter dark:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-primary-dark dark:text-white text-base">
                              {a.patientName}
                            </h3>
                            <p className="text-sm text-secondary dark:text-gray-400 mt-1">
                              {a.type}
                            </p>
                          </div>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                            a.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            a.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                            a.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                            a.status === 'no-show' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' :
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}>
                            {translateAppointmentStatus(a.status)}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300 mb-3">
                          <div className="flex items-center gap-1">
                            <CalendarDays className="w-4 h-4" />
                            <span>{fecha}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{a.startTime} - {a.endTime}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-3 border-t border-secondary-lighter dark:border-gray-700">
                          <button
                            onClick={() => handleEdit(a)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                          >
                            <Edit2 className="w-4 h-4" />
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(a)}
                            className="px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <Modal open={showForm} onClose={()=>{setShowForm(false); setEditingAppointment(null);}} title={editingAppointment ? 'Editar Turno' : 'Nuevo Turno'}>
            <AppointmentForm
              initialData={editingAppointment || undefined}
              onCreated={(appt?: Appointment) => {
                console.log('[Dashboard] onCreated callback received:', appt);
                setShowForm(false);
                setEditingAppointment(null);
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
