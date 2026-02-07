'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { deletePatient } from '@/lib/patients';
import { listPayments } from '@/lib/payments';
import { Payment } from '@/types';
import { Trash2, Edit, Search, Calendar, DollarSign, CheckCircle, XCircle, Clock, FileText, ArrowUpDown } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import ECGLoader from '@/components/ui/ECGLoader';
import Modal from '@/components/ui/Modal';
import SuccessModal from '@/components/ui/SuccessModal';
import PatientForm from './PatientForm';
import PatientPanoramicControls from './PatientPanoramicControls';
import { usePatients } from '@/contexts/PatientsContext';
import { useAppointments } from '@/contexts/AppointmentsContext';
import { usePermissions } from '@/hooks/usePermissions';
import { combineDateAndTime } from '@/lib/dateUtils';
import { formatCurrency } from '@/lib/formatCurrency';
import { translateAppointmentStatus, translateAppointmentType } from '@/lib/translations';
import { format, parseISO, differenceInYears } from 'date-fns';
import { es } from 'date-fns/locale';

export default function PatientList() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);
  const [editPatientModal, setEditPatientModal] = useState<{ open: boolean; patientId?: string; patientName?: string }>({ open: false });
  const [historyModal, setHistoryModal] = useState<{ open: boolean; patientId?: string; patientName?: string }>({ open: false });
  const [historyOrder, setHistoryOrder] = useState<'asc' | 'desc'>('asc');
  const [successModal, setSuccessModal] = useState<{ show: boolean; title: string; message?: string }>({
    show: false,
    title: '',
    message: ''
  });
  const { patients, loading: patientsLoading, refreshPatients } = usePatients();
  const { appointments } = useAppointments();
  const { canViewAllPayments } = usePermissions();
  const toast = useToast();
  const confirm = useConfirm();

  // Debounce search input para mejor performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Memoizar cálculos de estadísticas por paciente para evitar recalcularlos en cada render
  const patientStats = useMemo(() => {
    const stats = new Map<string, {
      appointmentsCount: number;
      debt: number;
      paid: number;
      pending: number;
    }>();

    // Crear índice de pagos por turno
    const paymentsByAppointment = new Map<string, number>();
    payments.forEach(payment => {
      if (!payment.appointmentId) return;
      if (payment.status !== 'completed' && payment.status !== 'pending') return;
      const prev = paymentsByAppointment.get(payment.appointmentId) || 0;
      paymentsByAppointment.set(payment.appointmentId, prev + payment.amount);
    });

    // Calcular estadísticas por paciente
    patients.forEach(patient => {
      const patientAppointments = appointments.filter(a => a.patientId === patient.id);
      const completedAppointments = patientAppointments.filter(a => a.fee && a.status === 'completed');
      const scheduledAppointments = patientAppointments.filter(
        a => a.fee && (a.status === 'scheduled' || a.status === 'confirmed')
      );

      // Calcular deuda (turnos completados sin pagar completamente)
      const debt = completedAppointments.reduce((sum, appt) => {
        const paid = paymentsByAppointment.get(appt.id) || 0;
        const deposit = appt.deposit || 0;
        if (appt.status === 'cancelled' && paid === 0 && deposit === 0) return sum;
        const totalPaid = paid + deposit;
        const remaining = Math.max(0, (appt.fee || 0) - totalPaid);
        return sum + remaining;
      }, 0);

      // Calcular total pagado (pagos completados + TODAS las señas de turnos con fee)
      const paymentsTotal = payments
        .filter(p =>
          p.patientId === patient.id &&
          p.status === 'completed'
        )
        .reduce((sum, p) => sum + p.amount, 0);
      // Incluir señas de TODOS los turnos con fee, no solo completados
      const depositsTotal = patientAppointments
        .filter(a => a.fee && a.fee > 0)
        .reduce((sum, appt) => sum + (appt.deposit || 0), 0);
      const paid = paymentsTotal + depositsTotal;

      // Calcular pendiente (turnos futuros agendados)
      const pending = scheduledAppointments.reduce((sum, appt) => {
        const paidForAppt = paymentsByAppointment.get(appt.id) || 0;
        const deposit = appt.deposit || 0;
        const remaining = Math.max(0, (appt.fee || 0) - deposit - paidForAppt);
        return sum + remaining;
      }, 0);

      stats.set(patient.id, {
        appointmentsCount: patientAppointments.length,
        debt,
        paid,
        pending
      });
    });

    return stats;
  }, [patients, appointments, payments]);

  // Helper functions optimizadas que usan el caché
  const getPatientAppointments = (patientId: string) => {
    return patientStats.get(patientId)?.appointmentsCount || 0;
  };

  const getPatientDebt = (patientId: string) => {
    return patientStats.get(patientId)?.debt || 0;
  };

  const getPatientPaid = (patientId: string) => {
    return patientStats.get(patientId)?.paid || 0;
  };

  const getPatientPending = (patientId: string) => {
    return patientStats.get(patientId)?.pending || 0;
  };

  // Helper function to get formatted birthdate and next birthday
  const getBirthdateInfo = (birthDate?: string) => {
    if (!birthDate) return { age: '-', nextBirthday: '-' };

    try {
      const birth = parseISO(birthDate);
      const today = new Date();
      const age = differenceInYears(today, birth);

      // Calculate next birthday
      const nextBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
      if (nextBirthday < today) {
        nextBirthday.setFullYear(today.getFullYear() + 1);
      }

      return {
        age: `${age} a\u00f1os`,
        nextBirthday: format(nextBirthday, 'dd MMM', { locale: es })
      };
    } catch (e) {
      return { age: '-', nextBirthday: '-' };
    }
  };

  const loadData = useCallback(async ({ showLoading = false } = {}) => {
    if (!user) return;
    if (showLoading) setLoading(true);
    try {
      const paymentsData = await listPayments(user.uid, canViewAllPayments);
      setPayments(paymentsData);
    } catch (e) {
      console.error(e);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [user, canViewAllPayments]);

  useEffect(() => {
    loadData({ showLoading: true });
  }, [loadData]);

  useEffect(() => {
    const handleFocus = () => {
      loadData();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadData]);

  // Memoizar búsqueda filtrada para evitar filtrar en cada render
  const filtered = useMemo(() => {
    if (!debouncedSearch.trim()) return patients;
    const searchLower = debouncedSearch.toLowerCase();
    return patients.filter(p =>
      `${p.lastName}, ${p.firstName}`.toLowerCase().includes(searchLower) ||
      p.dni.includes(debouncedSearch)
    );
  }, [patients, debouncedSearch]);

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Eliminar paciente',
      description: 'Esta acción es irreversible. ¿Deseas continuar?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await deletePatient(id);
      setSuccessModal({
        show: true,
        title: 'Paciente eliminado',
        message: 'El paciente se ha eliminado correctamente'
      });
      await refreshPatients();
      loadData();
    } catch (e) {
      console.error(e);
      toast.error('Error al eliminar paciente');
    }
  };

  if (loading || patientsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-primary dark:text-white">
        <ECGLoader />
        <p className="mt-4 text-sm">Cargando pacientes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="relative md:max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary dark:text-gray-400" />
          <input
            placeholder="Buscar por nombre o DNI..."
            className="input-field pl-10 w-full"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={() => setIsNewPatientModalOpen(true)}
          className="btn-primary inline-block text-center hover:shadow-lg hover:scale-105 transition-all"
        >
          + Nuevo Paciente
        </button>
      </div>
      <Modal
        open={isNewPatientModalOpen}
        onClose={() => setIsNewPatientModalOpen(false)}
        title="Nuevo paciente"
        maxWidth="max-w-2xl"
      >
        <PatientForm
          onSuccess={async (title, message) => {
            setIsNewPatientModalOpen(false);
            await refreshPatients();
            loadData();
            setTimeout(() => {
              setSuccessModal({ show: true, title, message });
            }, 250);
          }}
        />
      </Modal>
      <Modal
        open={editPatientModal.open}
        onClose={() => setEditPatientModal({ open: false })}
        title={`Editar paciente${editPatientModal.patientName ? `: ${editPatientModal.patientName}` : ''}`}
        maxWidth="max-w-2xl"
      >
        {editPatientModal.patientId && (
          <PatientForm
            patientId={editPatientModal.patientId}
            onSuccess={async (title, message) => {
              setEditPatientModal({ open: false });
              await refreshPatients();
              loadData();
              setTimeout(() => {
                setSuccessModal({ show: true, title, message });
              }, 250);
            }}
          />
        )}
      </Modal>
      {/* Vista Desktop: Tabla */}
      <div className="hidden md:block overflow-x-auto">
        <table className="table-skin table-compact table-fixed">
          <colgroup>
            <col className="w-14" />
            <col className="w-44" />
            <col className="w-48" />
            <col className="w-24" />
            <col className="w-24" />
            <col className="w-28" />
            <col className="w-32" />
            <col className="w-20" />
            <col className="w-24" />
            <col className="w-24" />
            <col className="w-24" />
          </colgroup>
          <thead>
            <tr>
              <th className="w-14"></th>
              <th className="w-44">Adjuntar panor&aacute;mica</th>
              <th>Paciente</th>
              <th>DNI</th>
              <th>Edad</th>
              <th>Cumplea&ntilde;os</th>
              <th>Tel&eacute;fono</th>
              <th>Turnos</th>
              <th>Pagado</th>
              <th>Pendiente</th>
              <th>Deuda</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const patientAppts = getPatientAppointments(p.id);
              const totalPaid = getPatientPaid(p.id);
              const pendingAmount = getPatientPending(p.id);
              const debt = getPatientDebt(p.id);
              const { age, nextBirthday } = getBirthdateInfo(p.birthDate);

              return (
                <tr key={p.id} className="cursor-pointer hover:bg-elegant-50 dark:hover:bg-elegant-800/30 transition-colors">
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditPatientModal({ open: true, patientId: p.id, patientName: `${p.lastName}, ${p.firstName}` })}
                        className="icon-btn-primary"
                        aria-label="Editar paciente"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="icon-btn-danger" aria-label="Eliminar paciente">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="w-44" onClick={(e) => e.stopPropagation()}>
                    <PatientPanoramicControls
                      patientId={p.id}
                      panoramicUrl={p.panoramicUrl}
                      panoramicName={p.panoramicName}
                      compact
                    />
                  </td>
                  <td className="font-medium" onClick={() => setHistoryModal({ open: true, patientId: p.id, patientName: `${p.lastName}, ${p.firstName}` })}>
                    {p.lastName}, {p.firstName}
                  </td>
                  <td onClick={() => setHistoryModal({ open: true, patientId: p.id, patientName: `${p.lastName}, ${p.firstName}` })}>{p.dni}</td>
                  <td onClick={() => setHistoryModal({ open: true, patientId: p.id, patientName: `${p.lastName}, ${p.firstName}` })}>
                    <span className="text-elegant-700 dark:text-elegant-300">{age}</span>
                  </td>
                  <td onClick={() => setHistoryModal({ open: true, patientId: p.id, patientName: `${p.lastName}, ${p.firstName}` })}>
                    <span className="text-elegant-700 dark:text-elegant-300">{nextBirthday}</span>
                  </td>
                  <td onClick={() => setHistoryModal({ open: true, patientId: p.id, patientName: `${p.lastName}, ${p.firstName}` })}>{p.phone}</td>
                  <td onClick={() => setHistoryModal({ open: true, patientId: p.id, patientName: `${p.lastName}, ${p.firstName}` })}>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-semibold">
                      {patientAppts}
                    </span>
                  </td>
                  <td onClick={() => setHistoryModal({ open: true, patientId: p.id, patientName: `${p.lastName}, ${p.firstName}` })}>
                    {totalPaid > 0 ? (
                      <span className="text-green-600 dark:text-green-400 font-semibold">
                        ${formatCurrency(totalPaid)}
                      </span>
                    ) : (
                      <span className="text-secondary dark:text-gray-500">-</span>
                    )}
                  </td>
                  <td onClick={() => setHistoryModal({ open: true, patientId: p.id, patientName: `${p.lastName}, ${p.firstName}` })}>
                    {pendingAmount > 0 ? (
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">
                        ${formatCurrency(pendingAmount)}
                      </span>
                    ) : (
                      <span className="text-secondary dark:text-gray-500">-</span>
                    )}
                  </td>
                  <td onClick={() => setHistoryModal({ open: true, patientId: p.id, patientName: `${p.lastName}, ${p.firstName}` })}>
                    {debt > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full text-xs font-semibold">
                        ${formatCurrency(debt)}
                      </span>
                    ) : (
                      <span className="text-secondary dark:text-gray-500">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={11} className="p-4 text-center text-black dark:text-white">Sin resultados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Vista Mobile: Cards */}
      <div className="md:hidden space-y-3">
        {filtered.map(p => {
          const patientAppts = getPatientAppointments(p.id);
          const totalPaid = getPatientPaid(p.id);
          const pendingAmount = getPatientPending(p.id);
          const debt = getPatientDebt(p.id);

          return (
            <div
              key={p.id}
              className="bg-white dark:bg-[#18181b] border border-secondary-lighter dark:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-primary-dark dark:text-white text-base">
                    {p.lastName}, {p.firstName}
                  </h3>
                  <p className="text-sm text-secondary dark:text-gray-400 mt-1">
                    DNI: {p.dni}
                  </p>
                  <p className="text-sm text-secondary dark:text-gray-400">
                    Tel: {p.phone}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-3 py-3 border-y border-secondary-lighter dark:border-gray-700">
                <div className="text-center">
                  <div className="text-xs text-secondary dark:text-gray-400 mb-1">Turnos</div>
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-semibold">
                    {patientAppts}
                  </span>
                </div>
                <div className="text-center">
                  <div className="text-xs text-secondary dark:text-gray-400 mb-1">Pagado</div>
                  {totalPaid > 0 ? (
                    <span className="text-green-600 dark:text-green-400 font-semibold text-sm">
                      ${formatCurrency(totalPaid)}
                    </span>
                  ) : (
                    <span className="text-secondary dark:text-gray-500">-</span>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-xs text-secondary dark:text-gray-400 mb-1">Pendiente</div>
                  {pendingAmount > 0 ? (
                    <span className="text-amber-600 dark:text-amber-400 font-semibold text-sm">
                      ${formatCurrency(pendingAmount)}
                    </span>
                  ) : (
                    <span className="text-secondary dark:text-gray-500">-</span>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-xs text-secondary dark:text-gray-400 mb-1">Deuda</div>
                  {debt > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full text-xs font-semibold">
                      ${formatCurrency(debt)}
                    </span>
                  ) : (
                    <span className="text-secondary dark:text-gray-500">-</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs text-secondary dark:text-gray-400">Panor&aacute;mica</span>
                <PatientPanoramicControls
                  patientId={p.id}
                  panoramicUrl={p.panoramicUrl}
                  panoramicName={p.panoramicName}
                  compact
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditPatientModal({ open: true, patientId: p.id, patientName: `${p.lastName}, ${p.firstName}` });
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark hover:shadow-lg hover:scale-105 transition-all duration-200 active:scale-[0.98]"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(p.id);
                  }}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 hover:shadow-lg hover:scale-105 transition-all duration-200 active:scale-[0.98]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="p-8 text-center text-black dark:text-white">
            Sin resultados
          </div>
        )}
      </div>

      {/* Modal de Historial del Paciente */}
      <Modal
        open={historyModal.open}
        onClose={() => setHistoryModal({ open: false })}
        title={`Historial de ${historyModal.patientName || 'Paciente'}`}
        maxWidth="max-w-4xl"
      >
        {historyModal.patientId && (() => {
          const patient = patients.find(p => p.id === historyModal.patientId);
          const patientAppts = appointments
            .filter(a => a.patientId === historyModal.patientId)
            .sort((a, b) => {
              const dateCompare = b.date.localeCompare(a.date);
              if (dateCompare !== 0) return dateCompare;
              return b.startTime.localeCompare(a.startTime);
            });

          const patientPayments = payments
            .filter(p => p.patientId === historyModal.patientId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          // Crear timeline de eventos
          const events: Array<{
            date: string;
            time?: string;
            type: 'appointment' | 'payment' | 'status_change';
            icon: any;
            color: string;
            title: string;
            description: string;
            amount?: number;
            notes?: string;
            sortKey: number;
          }> = [];

          const getEventDateTime = (value?: string, fallbackDate?: string, fallbackTime?: string) => {
            if (value) {
              const parsed = new Date(value);
              if (!Number.isNaN(parsed.getTime())) {
                return {
                  date: parsed.toISOString().split('T')[0],
                  time: parsed.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
                };
              }
            }
            return { date: fallbackDate || '', time: fallbackTime };
          };

          const getSortKey = (value?: string, fallbackDate?: string, fallbackTime?: string) => {
            if (value) {
              const parsed = new Date(value);
              if (!Number.isNaN(parsed.getTime())) {
                return parsed.getTime();
              }
            }
            if (fallbackDate && fallbackTime) {
              const combined = combineDateAndTime(fallbackDate, fallbackTime);
              return combined.getTime();
            }
            if (fallbackDate) {
              const parsed = new Date(`${fallbackDate}T00:00:00`);
              return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
            }
            return 0;
          };

          // Agregar turnos
          patientAppts.forEach(appt => {
            const typeLabel = translateAppointmentType(appt.type) || 'Consulta';
            const createdEventTime = getEventDateTime(appt.createdAt, appt.date, appt.startTime);
            events.push({
              date: createdEventTime.date,
              time: createdEventTime.time,
              type: 'appointment',
              icon: Calendar,
              color: 'blue',
              title: 'Turno creado',
              description: `${typeLabel} - ${appt.startTime} a ${appt.endTime}`,
              amount: appt.fee,
              notes: appt.notes,
              sortKey: getSortKey(appt.createdAt, appt.date, appt.startTime),
            });

            if (appt.updatedAt && appt.updatedAt !== appt.createdAt) {
              const updatedEventTime = getEventDateTime(appt.updatedAt, appt.date, appt.endTime);
              events.push({
                date: updatedEventTime.date,
                time: updatedEventTime.time,
                type: 'status_change',
                icon: Edit,
                color: 'amber',
                title: 'Turno actualizado',
                description: `${typeLabel} - ${appt.startTime} a ${appt.endTime}`,
                sortKey: getSortKey(appt.updatedAt, appt.date, appt.endTime),
              });
            }

            if (appt.status === 'completed') {
              const statusEventTime = getEventDateTime(appt.updatedAt, appt.date, appt.endTime);
              events.push({
                date: statusEventTime.date,
                time: statusEventTime.time,
                type: 'status_change',
                icon: CheckCircle,
                color: 'green',
                title: 'Asistencia registrada',
                description: 'Paciente presente',
                sortKey: getSortKey(appt.updatedAt, appt.date, appt.endTime),
              });
            } else if (appt.status === 'no-show') {
              const statusEventTime = getEventDateTime(appt.updatedAt, appt.date, appt.endTime);
              events.push({
                date: statusEventTime.date,
                time: statusEventTime.time,
                type: 'status_change',
                icon: XCircle,
                color: 'red',
                title: 'Asistencia registrada',
                description: 'Paciente ausente',
                sortKey: getSortKey(appt.updatedAt, appt.date, appt.endTime),
              });
            } else if (appt.status === 'cancelled') {
              const statusEventTime = getEventDateTime(appt.updatedAt, appt.date, appt.endTime);
              events.push({
                date: statusEventTime.date,
                time: statusEventTime.time,
                type: 'status_change',
                icon: XCircle,
                color: 'red',
                title: 'Turno cancelado',
                description: `${typeLabel} - ${appt.startTime} a ${appt.endTime}`,
                sortKey: getSortKey(appt.updatedAt, appt.date, appt.endTime),
              });
            }

            if (appt.followUpDate) {
              const reminderEventTime = getEventDateTime(appt.followUpDate);
              const reason = appt.followUpReason ? `Motivo: ${appt.followUpReason}` : 'Recordatorio de seguimiento';
              events.push({
                date: reminderEventTime.date,
                time: reminderEventTime.time,
                type: 'status_change',
                icon: Clock,
                color: 'purple',
                title: 'Recordatorio programado',
                description: reason,
                sortKey: getSortKey(appt.followUpDate, reminderEventTime.date, reminderEventTime.time),
              });
            }

            // Si tiene seña, agregarla
            if (appt.deposit && appt.deposit > 0) {
              const depositEventTime = getEventDateTime(appt.date, appt.date, appt.startTime);
              events.push({
                date: depositEventTime.date,
                time: depositEventTime.time,
                type: 'payment',
                icon: DollarSign,
                color: 'amber',
                title: 'Seña pagada',
                description: `Seña del turno del ${new Date(appt.date).toLocaleDateString('es-AR')}`,
                amount: appt.deposit,
                sortKey: getSortKey(appt.date, appt.date, appt.startTime),
              });
            }
          });

          if (patient?.panoramicUploadedAt) {
            const panoramicEventTime = getEventDateTime(patient.panoramicUploadedAt);
            events.push({
              date: panoramicEventTime.date,
              time: panoramicEventTime.time,
              type: 'status_change',
              icon: FileText,
              color: 'amber',
              title: 'Panoramica cargada',
              description: patient.panoramicName || 'Archivo cargado',
              sortKey: getSortKey(patient.panoramicUploadedAt),
            });
          }

          // Agregar pagos
          patientPayments.forEach(payment => {
            events.push({
              date: payment.date.split('T')[0],
              time: new Date(payment.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
              type: 'payment',
              icon: payment.status === 'completed' ? CheckCircle : Clock,
              color: payment.status === 'completed' ? 'green' : 'yellow',
              title: payment.status === 'completed' ? 'Pago completado' : 'Pago parcial',
              description: payment.consultationType || 'Pago',
              amount: payment.amount,
              sortKey: new Date(payment.date).getTime(),
            });
          });

          // Ordenar eventos por fecha y hora
          events.sort((a, b) => (
            historyOrder === 'asc' ? a.sortKey - b.sortKey : b.sortKey - a.sortKey
          ));

          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-elegant-200/70 dark:border-elegant-800/70 bg-elegant-50/70 dark:bg-elegant-900/40 px-3 py-2">
                <div className="text-xs font-semibold text-elegant-600 dark:text-elegant-300">
                  Orden: {historyOrder === 'asc' ? 'mas antiguos primero' : 'mas recientes primero'}
                </div>
                <button
                  type="button"
                  onClick={() => setHistoryOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-dark"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  {historyOrder === 'asc' ? 'Ver mas recientes' : 'Ver mas antiguos'}
                </button>
              </div>
              {events.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  No hay movimientos registrados para este paciente
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

                  {/* Events */}
                  <div className="space-y-6">
                    {events.map((event, index) => {
                      const Icon = event.icon;
                      const colorClasses = {
                        blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                        green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
                        amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
                        yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
                        red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
                        purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
                      };

                      return (
                        <div key={index} className="relative flex gap-4 items-start">
                          {/* Icon */}
                          <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full ${colorClasses[event.color as keyof typeof colorClasses]}`}>
                            <Icon className="w-5 h-5" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 bg-white dark:bg-elegant-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-elegant-900 dark:text-white">{event.title}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{event.description}</p>
                                {event.notes && (
                                  <div className="mt-2 p-2 bg-gray-50 dark:bg-elegant-900/50 rounded border border-gray-200 dark:border-gray-700">
                                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Notas:</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{event.notes}</p>
                                  </div>
                                )}
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                  {new Date(event.date).toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                  {event.time && ` • ${event.time}`}
                                </p>
                              </div>
                              {event.amount !== undefined && (
                                <div className="text-right">
                                  <p className="text-lg font-bold text-primary dark:text-primary-light">
                                    ${formatCurrency(event.amount)}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>

      <SuccessModal
        isOpen={successModal.show}
        onClose={() => setSuccessModal({ show: false, title: '', message: '' })}
        title={successModal.title}
        message={successModal.message}
      />
    </div>
  );
}



