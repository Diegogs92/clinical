'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
export const dynamic = 'force-dynamic';
import DashboardLayout from '@/components/DashboardLayout';
import StatsOverview from '@/components/dashboard/StatsOverview';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAllAppointments, updateAppointment, deleteAppointment } from '@/lib/appointments';
import { Appointment, UserProfile } from '@/types';
import { canModifyAppointment, getPermissionDeniedMessage } from '@/lib/appointmentPermissions';
import { usePatients } from '@/contexts/PatientsContext';
import { useAppointments } from '@/contexts/AppointmentsContext';
import AppointmentForm from '@/components/appointments/AppointmentForm';
import { CalendarDays, PlusCircle, Edit, DollarSign, Search, Clock, Ban, Trash2, CheckCircle2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import SuccessModal from '@/components/ui/SuccessModal';
import { useToast } from '@/contexts/ToastContext';
import { translateAppointmentStatus, translateAppointmentType } from '@/lib/translations';
import ECGLoader from '@/components/ui/ECGLoader';
import GlassViewSelector from '@/components/GlassViewSelector';
import { createPayment } from '@/lib/payments';
import { usePayments } from '@/contexts/PaymentsContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import { useCalendarSync } from '@/contexts/CalendarSyncContext';
import { addDays, addMonths, addYears, startOfMonth, startOfWeek, startOfYear, format, parseISO, isSameDay, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { combineDateAndTime } from '@/lib/dateUtils';
import { usePermissions } from '@/hooks/usePermissions';
import { listProfessionals } from '@/lib/users';
import { formatCurrency } from '@/lib/formatCurrency';

const statusOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'scheduled', label: 'Agendado' },
  { value: 'completed', label: 'Presente' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'no-show', label: 'Ausente' },
];

export default function DashboardPage() {
  const { user, userProfile } = useAuth();
  const { patients } = usePatients();
  const { appointments: baseAppointments, loading: baseLoading, refreshAppointments } = useAppointments();
  const { payments, pendingPayments, refreshPayments, refreshPendingPayments } = usePayments();
  const confirm = useConfirm();
  const { syncAppointment } = useCalendarSync();
  const permissions = usePermissions();
  const [professionals, setProfessionals] = useState<UserProfile[]>([]);
  const [loadingProfessionals, setLoadingProfessionals] = useState(false);
  const [view, setView] = useState<'day' | 'week' | 'month' | 'year' | 'all'>('week');
  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [paymentDialog, setPaymentDialog] = useState<{ open: boolean; appointment?: Appointment; mode: 'total' | 'partial'; amount: string }>({
    open: false,
    appointment: undefined,
    mode: 'total',
    amount: '',
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [filterPatient, setFilterPatient] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [now, setNow] = useState<Date>(new Date());
  const [successModal, setSuccessModal] = useState<{ show: boolean; title: string; message?: string }>({
    show: false,
    title: '',
    message: ''
  });
  const [dashboardAppointments, setDashboardAppointments] = useState<Appointment[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const defaultFilterSet = useRef(false);
  const isProfessionalRole = userProfile?.role === 'profesional';
  const appointments = isProfessionalRole ? dashboardAppointments : baseAppointments;
  const appointmentsLoading = isProfessionalRole ? dashboardLoading : baseLoading;

  const toast = useToast();
  const openNewAppointment = () => {
    setEditingAppointment(null);
    setShowForm(true);
  };

  const refreshDashboardAppointments = useCallback(async () => {
    if (!user || !userProfile) {
      setDashboardAppointments([]);
      setDashboardLoading(false);
      return [];
    }
    if (!isProfessionalRole) {
      const list = await refreshAppointments();
      setDashboardAppointments(list);
      return list;
    }
    setDashboardLoading(true);
    try {
      const list = await getAllAppointments();
      setDashboardAppointments(list);
      return list;
    } catch (error) {
      console.error('[Dashboard] Error fetching all appointments', error);
      return [];
    } finally {
      setDashboardLoading(false);
    }
  }, [isProfessionalRole, refreshAppointments, user, userProfile]);

  // Reloj en vivo
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const loadProfessionals = async () => {
      try {
        setLoadingProfessionals(true);
        const list = await listProfessionals();
        setProfessionals(list);
      } catch (error) {
        console.error('[Dashboard] Error cargando profesionales:', error);
      } finally {
        setLoadingProfessionals(false);
      }
    };
    loadProfessionals();
  }, []);

  useEffect(() => {
    if (!isProfessionalRole) {
      setDashboardAppointments(baseAppointments);
      return;
    }
    refreshDashboardAppointments();
  }, [baseAppointments, isProfessionalRole, refreshDashboardAppointments]);

  useEffect(() => {
    if (!user || !isProfessionalRole || defaultFilterSet.current) return;
    setFilterPatient('mine');
    defaultFilterSet.current = true;
  }, [isProfessionalRole, user]);

  useEffect(() => {
    const processStatuses = async () => {
      const current = new Date();
      const toUpdate = appointments.filter(a => {
        if (['cancelled', 'no-show', 'completed'].includes(a.status)) return false;
        if (!canModifyAppointment(a, user, userProfile)) return false;
        const end = combineDateAndTime(a.date, a.endTime);
        return end < current;
      });

      if (!toUpdate.length) return;

      try {
        await Promise.all(toUpdate.map(a => updateAppointment(a.id, { status: 'completed' })));
        await refreshDashboardAppointments();
      } catch (error) {
        console.error('Error auto-actualizando estados:', error);
      }
    };

    processStatuses();
  }, [appointments, refreshDashboardAppointments, user, userProfile]);

  const windowRange = useMemo(() => {
    const startBase = new Date(now);
    startBase.setHours(0, 0, 0, 0);

    switch (view) {
      case 'day': {
        const end = addDays(startBase, 1);
        return { start: startBase, end };
      }
      case 'week': {
        const start = startOfWeek(startBase, { weekStartsOn: 1 });
        const end = addDays(start, 7);
        return { start, end };
      }
      case 'month': {
        const start = startOfMonth(startBase);
        const end = addMonths(start, 1);
        return { start, end };
      }
      case 'year': {
        const start = startOfYear(startBase);
        const end = addYears(start, 1);
        return { start, end };
      }
      case 'all': {
        // Para "todas las fechas", usar un rango muy amplio
        const start = new Date(2020, 0, 1); // Desde 1 de enero de 2020
        const end = new Date(2099, 11, 31); // Hasta 31 de diciembre de 2099
        return { start, end };
      }
      default:
        return { start: startBase, end: addDays(startBase, 7) };
    }
  }, [now, view]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const getProfessionalName = (id?: string) => {
      if (!id) return '';
      const found = professionals.find(p => p.uid === id);
      return found?.displayName || found?.email || '';
    };

    return appointments
      .filter(a => {
        const d = new Date(a.date);
        const inDateRange = d >= windowRange.start && d < windowRange.end;
        const patient = patients.find(p => p.id === a.patientId);
        const matchesPatient = (() => {
          if (!filterPatient) return true;
          if (filterPatient === 'mine') {
            return patient?.userId === user?.uid;
          }
          if (filterPatient.startsWith('pro:')) {
            const targetId = filterPatient.slice(4);
            return patient?.userId === targetId;
          }
          return a.patientId === filterPatient;
        })();
        const matchesStatus = !filterStatus || a.status === filterStatus;

        // Búsqueda mejorada: incluye nombre, DNI y obra social
        if (query) {
          const professionalName = getProfessionalName(a.userId) || '';
          const patientDNI = patient?.dni || '';
          const patientInsurance = patient?.insuranceName || '';

          const searchableText = `${a.patientName || a.title || ''} ${professionalName} ${patientDNI} ${patientInsurance}`;
          const matchesSearch = searchableText.toLowerCase().includes(query);

          if (!matchesSearch) return false;
        }

        return inDateRange && matchesPatient && matchesStatus;
      })
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  }, [appointments, filterPatient, filterStatus, search, windowRange.end, windowRange.start, professionals, patients, user?.uid]);

  const paymentStateFor = useMemo(() => {
    return (appt: Appointment) => {
      if (!appt.fee) {
        return { color: 'text-elegant-900 dark:text-white', status: 'none', remainingAmount: 0, isDue: false };
      }
          const deposit = appt.deposit || 0;
          const completed = payments
            .filter(p => p.appointmentId === appt.id && p.status === 'completed')
            .reduce((sum, p) => sum + p.amount, 0);
      const pending = (() => {
        const seen = new Set<string>();
        let sum = 0;
        for (const payment of [...payments, ...pendingPayments]) {
          if (payment.appointmentId !== appt.id || payment.status !== 'pending') continue;
          if (seen.has(payment.id)) continue;
          seen.add(payment.id);
          sum += payment.amount;
        }
        return sum;
      })();
          const totalPaid = deposit + completed + pending;
          const remainingAmount = Math.max(0, (appt.fee || 0) - totalPaid);
      const isAttended = appt.status === 'completed';

      if (totalPaid >= (appt.fee || 0)) {
        return { color: 'text-green-600 dark:text-green-400', status: 'paid', remainingAmount: 0, isDue: false };
      }
      if (!isAttended) {
        return { color: 'text-elegant-900 dark:text-white', status: 'none', remainingAmount, isDue: false };
      }
      if (totalPaid > 0) {
        return { color: 'text-amber-500', status: 'partial', remainingAmount, isDue: true };
      }
      return { color: 'text-red-500', status: 'unpaid', remainingAmount: appt.fee, isDue: true };
    };
  }, [now, payments, pendingPayments]);

  const canViewFees = (appt: Appointment) => {
    if (!user || !userProfile) return false;
    if (userProfile.role === 'administrador' || userProfile.role === 'secretaria') return true;
    return appt.userId === user.uid;
  };

  const handleEdit = (appt: Appointment) => {
    // Verificar permisos: solo admin puede editar turnos de otros
    if (appt.userId !== user?.uid && !permissions.canEditAppointmentsForOthers) {
      toast.error('No tienes permisos para editar turnos de otros profesionales');
      return;
    }
    setEditingAppointment(appt);
    setShowForm(true);
  };

  const handleCancel = async (appt: Appointment) => {
    // Verificar permisos para modificar el turno
    if (!canModifyAppointment(appt, user, userProfile)) {
      toast.error(getPermissionDeniedMessage());
      return;
    }

    const displayName = appt.patientName || appt.title || 'este turno';
    const confirmed = await confirm({
      title: 'Cancelar turno',
      description: `Cancelar el turno de ${displayName}?`,
      confirmText: 'Cancelar turno',
      tone: 'danger',
    });
    if (!confirmed) return;

    const isToday = appt.date === format(now, 'yyyy-MM-dd');

    try {
      await updateAppointment(appt.id, { status: 'cancelled' });

      // Sincronizar cancelacion con Google Calendar
      if (appt.googleCalendarEventId) {
        await syncAppointment({ ...appt, status: 'cancelled' }, 'delete', appt.googleCalendarEventId);
      }

      if (isToday && appt.fee && appt.appointmentType === 'patient' && appt.patientId && appt.patientName) {
        const charge = await confirm({
          title: 'Cobraste honorarios?',
          description: `Registrar honorarios de $${formatCurrency(appt.fee)} para este turno cancelado hoy?`,
          confirmText: 'Si, registrar',
          cancelText: 'No, omitir',
          tone: 'success',
        });

        await createPayment({
          appointmentId: appt.id,
          patientId: appt.patientId,
          patientName: appt.patientName,
          amount: appt.fee,
          method: 'cash',
          status: charge ? 'completed' : 'pending',
          date: new Date().toISOString(),
          consultationType: appt.type || '',
          userId: user?.uid || '',
        });
      }

      await refreshDashboardAppointments();
      await refreshPayments();
      await refreshPendingPayments();
      setSuccessModal({ show: true, title: 'Turno cancelado', message: 'El turno se ha cancelado correctamente' });
    } catch (error) {
      console.error('Error al cancelar turno:', error);
      toast.error('No se pudo cancelar el turno');
    }
  };

  const handleDelete = async (appt: Appointment) => {
    if (!user) return;

    // Verificar permisos para eliminar el turno
    if (!canModifyAppointment(appt, user, userProfile)) {
      toast.error(getPermissionDeniedMessage());
      return;
    }

    const displayName = appt.patientName || appt.title || 'este turno';
    const confirmed = await confirm({
      title: 'Eliminar turno',
      description: `Eliminar definitivamente el turno de ${displayName}?`,
      confirmText: 'Eliminar',
      tone: 'danger',
    });
    if (!confirmed) return;

    try {
      // Sincronizar eliminacion con Google Calendar ANTES de eliminar de Firestore
      if (appt.googleCalendarEventId) {
        await syncAppointment(appt, 'delete', appt.googleCalendarEventId);
      }

      await deleteAppointment(appt.id, appt.userId);
      await refreshDashboardAppointments();
      await refreshPayments();
      await refreshPendingPayments();
      setSuccessModal({ show: true, title: 'Turno eliminado', message: 'El turno se ha eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar turno:', error);
      toast.error('No se pudo eliminar el turno');
    }
  };

  const openPaymentDialog = (appt: Appointment) => {
    if (!canViewFees(appt)) {
      toast.error('No tienes permisos para ver honorarios de este turno');
      return;
    }
    if (!appt.fee) {
      toast.error('Este turno no tiene honorarios asignados');
      return;
    }
    setPaymentDialog({
      open: true,
      appointment: appt,
      mode: 'total',
      amount: appt.fee.toString(),
    });
  };

  const submitPayment = async () => {
    console.log('[submitPayment] Iniciando...');
    const appt = paymentDialog.appointment;
    if (!appt) {
      console.log('[submitPayment] No hay turno seleccionado');
      return;
    }
    if (!user) {
      console.log('[submitPayment] No hay usuario autenticado');
      toast.error('Debes iniciar sesion para registrar pagos');
      return;
    }

    console.log('[submitPayment] Turno:', appt);
    console.log('[submitPayment] Monto ingresado:', paymentDialog.amount);

    const sanitized = paymentDialog.amount.replace(/\./g, '').replace(',', '.');
    const amountNum = Number(sanitized);
    console.log('[submitPayment] Monto sanitizado:', amountNum);

    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      console.log('[submitPayment] Monto invalido');
      toast.error('Ingresa un monto valido');
      return;
    }

    // Validar que sea un turno de paciente
    if (appt.appointmentType !== 'patient' || !appt.patientId || !appt.patientName) {
      toast.error('No se puede registrar pago para este tipo de evento');
      return;
    }

    // Validación crítica: verificar que el paciente del turno coincide con un paciente real
    const patient = patients.find(p => p.id === appt.patientId);
    if (!patient) {
      console.error('[submitPayment] ERROR: No se encontró el paciente con ID:', appt.patientId);
      toast.error('Error: El paciente del turno no existe. Por favor verifica los datos del turno.');
      return;
    }

    // Verificar que el nombre del paciente coincide
    const expectedName = `${patient.lastName}, ${patient.firstName}`;
    if (appt.patientName !== expectedName) {
      console.warn('[submitPayment] ADVERTENCIA: El nombre del paciente en el turno no coincide:', {
        enTurno: appt.patientName,
        esperado: expectedName,
        patientId: appt.patientId
      });
      toast.error(`Error: El turno tiene información incorrecta del paciente. Se esperaba "${expectedName}" pero el turno muestra "${appt.patientName}". Por favor edita el turno primero.`);
      return;
    }

    // Calcular monto restante disponible
    const paymentState = paymentStateFor(appt);
    const remainingAmount = paymentState.remainingAmount;

    // Validar que el pago no supere el monto restante
    if (amountNum > remainingAmount) {
      toast.error(`El monto ingresado ($${formatCurrency(amountNum)}) supera el monto restante ($${formatCurrency(remainingAmount)})`);
      return;
    }

      const isTotal = amountNum >= remainingAmount;
      const status: 'completed' = 'completed';
    console.log('[submitPayment] Es pago total', isTotal, 'Status:', status);

    try {
      setSubmittingPayment(true);
      console.log('[submitPayment] Llamando a createPayment...');
      const paymentId = await createPayment({
        appointmentId: appt.id,
        patientId: appt.patientId,
        patientName: appt.patientName,
        amount: amountNum,
        method: 'cash',
        status,
        date: new Date().toISOString(),
        consultationType: appt.type || '',
        userId: user.uid,
      });
      console.log('[submitPayment] Pago creado con ID:', paymentId);

      if (isTotal && appt.status !== 'completed') {
        console.log('[submitPayment] Actualizando estado del turno...');
        await updateAppointment(appt.id, { status: 'completed' });
        await refreshDashboardAppointments();
      } else {
        await refreshDashboardAppointments();
      }

      console.log('[submitPayment] Refrescando pagos...');
      await refreshPayments();
      await refreshPendingPayments();
      console.log('[submitPayment] Todo completado exitosamente');
      setSuccessModal({
        show: true,
        title: isTotal ? 'Pago registrado' : 'Pago parcial registrado',
        message: isTotal ? 'El pago se ha registrado con éxito' : 'El pago parcial se ha registrado con éxito'
      });
      setPaymentDialog({ open: false, appointment: undefined, mode: 'total', amount: '' });
    } catch (error) {
      console.error('[submitPayment] Error al registrar pago:', error);
      toast.error('Error al registrar el pago');
    } finally {
      setSubmittingPayment(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
            <div className="w-full md:w-auto p-2 md:p-0 rounded-2xl border border-elegant-100/80 dark:border-elegant-800/70 bg-white/90 dark:bg-elegant-900/90 backdrop-blur-lg shadow-sm md:shadow-none md:border-0 md:bg-transparent flex items-center gap-2 md:gap-3">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] md:text-xs uppercase tracking-[0.1em] md:tracking-[0.15em] text-elegant-500">Inicio</p>
                <h1 className="text-lg md:text-xl font-bold text-primary-dark dark:text-white truncate">
                  {format(now, 'dd/MM/yyyy HH:mm')}
                </h1>
                <p className="text-[12px] md:text-xs text-elegant-500 dark:text-elegant-400 truncate">Agenda sincronizada</p>
              </div>
            </div>
          </div>

          <StatsOverview />

          <div className="card relative overflow-hidden">
            <div className="absolute inset-x-0 -top-24 h-40 bg-gradient-to-r from-primary/10 via-secondary/5 to-primary/10 blur-3xl pointer-events-none" />
            <div className="relative flex flex-col gap-2.5 mb-3">
              <GlassViewSelector
                options={[
                  { value: 'day', label: 'Dia' },
                  { value: 'week', label: 'Semana' },
                  { value: 'month', label: 'Mes' },
                  { value: 'year', label: 'Año' },
                  { value: 'all', label: 'Todas las fechas' }
                ]}
                value={view}
                onChange={(v) => setView(v as 'day' | 'week' | 'month' | 'year' | 'all')}
              />

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-2.5">
                <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-elegant-100 dark:bg-elegant-800 text-sm text-elegant-700 dark:text-elegant-300">
                  <Search className="w-4 h-4" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por paciente, DNI u obra social"
                    className="flex-1 bg-transparent outline-none text-sm placeholder:text-elegant-400 dark:placeholder:text-elegant-500"
                  />
                </label>
                <select
                  value={filterPatient}
                  onChange={e => setFilterPatient(e.target.value)}
                  className="input-field"
                >
                  {isProfessionalRole && <option value="mine">Mis pacientes</option>}
                  <option value="">Todos los pacientes</option>
                  {professionals.map(pro => (
                    <option key={pro.uid} value={`pro:${pro.uid}`}>
                      {`Pacientes de ${pro.displayName || pro.email}`}
                    </option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="input-field"
                >
                  {statusOptions.map(o => (
                    <option key={o.value || 'all'} value={o.value}>{o.label}</option>
                  ))}
                </select>
                {(filterPatient || filterStatus || search) && (
                  <button
                    onClick={() => { setFilterPatient(''); setFilterStatus(''); setSearch(''); }}
                    className="btn-secondary"
                  >
                    Limpiar filtros
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
              <p className="text-black dark:text-white">No hay turnos en el periodo seleccionado.</p>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <table className="table-skin">
                    <thead>
                      <tr>
                        <th className="w-20"></th>
                        <th>Fecha</th>
                        <th>Hora</th>
                        <th>Paciente</th>
                        <th>Profesional</th>
                        <th>Honorarios</th>
                        <th>Estado Turno</th>
                        <th>Estado Pago</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(a => {
                        const d = new Date(a.date);
                        const fecha = d.toLocaleDateString();
                        const professional = professionals.find(p => p.uid === a.userId);
                        const paymentState = paymentStateFor(a);
                        const canSeeFees = canViewFees(a);

                        // Determinar el label del estado de pago
                          const getPaymentStatusLabel = () => {
                            if (!a.fee) return 'Sin honorarios';

                            const deposit = a.deposit || 0;
                            const completed = payments
                              .filter(p => p.appointmentId === a.id && p.status === 'completed')
                              .reduce((sum, p) => sum + p.amount, 0);
                            const totalPaid = deposit + completed;
                            const remaining = paymentState.remainingAmount;

                            // Si está completamente pagado
                            if (paymentState.status === 'paid') {
                              return `Pagado: $${formatCurrency(totalPaid)}`;
                            }

                            // Si no hay deuda (turno futuro sin pago aún)
                            if (!paymentState.isDue && paymentState.status !== 'paid') {
                              return totalPaid > 0 ? `Pagado: $${formatCurrency(totalPaid)}` : 'Sin deuda';
                            }

                            // Si tiene pagos parciales
                            if (totalPaid > 0 && remaining > 0) {
                              return `Pagado: $${formatCurrency(totalPaid)} | Falta: $${formatCurrency(remaining)}`;
                            }

                            // Si no ha pagado nada aún
                            return `Pendiente: $${formatCurrency(remaining)}`;
                          };

                        return (
                          <tr key={a.id}>
                            <td>
                              <div className="flex items-center gap-1">
                                {(a.userId === user?.uid || permissions.canEditAppointmentsForOthers) && (
                                  <button
                                    onClick={() => handleEdit(a)}
                                    className="icon-btn-primary"
                                    aria-label="Editar turno"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                )}
                                {(a.userId === user?.uid || permissions.canDeleteAppointmentsForOthers) && (
                                  <button
                                    onClick={() => handleDelete(a)}
                                    className="icon-btn-danger"
                                    aria-label="Eliminar turno"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="font-medium">{fecha}</td>
                            <td>{a.startTime} - {a.endTime}</td>
                            <td>{a.patientName || a.title || 'Evento'}</td>
                            <td>
                              {professional ? (
                                <span className="text-sm text-gray-600 dark:text-gray-300">
                                  {professional.displayName || professional.email}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs">-</span>
                              )}
                            </td>
                            <td>
                              {canSeeFees && a.fee ? (
                                <span className="font-semibold text-elegant-900 dark:text-white">
                                  ${formatCurrency(a.fee)}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td>
                              {(a.userId === user?.uid || permissions.canEditAppointmentsForOthers) ? (
                                <button
                                  onClick={() => handleCancel(a)}
                                  disabled={a.status === 'cancelled'}
                                  className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                                    a.status === 'completed' ? 'bg-green-100/80 text-green-800 dark:bg-green-900/60 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800/60' :
                                    a.status === 'cancelled' ? 'bg-red-100/80 text-red-800 dark:bg-red-900/60 dark:text-red-200' :
                                    a.status === 'no-show' ? 'bg-gray-100/80 text-gray-800 dark:bg-gray-700/60 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600/60' :
                                    'bg-blue-100/80 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800/60'
                                  }`}
                                >
                                  {translateAppointmentStatus(a.status)}
                                </button>
                              ) : (
                                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                                  a.status === 'completed' ? 'bg-green-100/80 text-green-800 dark:bg-green-900/60 dark:text-green-200' :
                                  a.status === 'cancelled' ? 'bg-red-100/80 text-red-800 dark:bg-red-900/60 dark:text-red-200' :
                                  a.status === 'no-show' ? 'bg-gray-100/80 text-gray-800 dark:bg-gray-700/60 dark:text-gray-200' :
                                  'bg-blue-100/80 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200'
                                }`}>
                                  {translateAppointmentStatus(a.status)}
                                </span>
                              )}
                            </td>
                            <td>
                              {canSeeFees && a.fee && permissions.canRegisterPayments ? (
                                <button
                                  onClick={() => openPaymentDialog(a)}
                                  disabled={paymentState.status === 'paid'}
                                  className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                                    !paymentState.isDue && paymentState.status !== 'paid'
                                      ? 'bg-elegant-100/80 text-elegant-700 dark:bg-elegant-800/60 dark:text-elegant-300'
                                      : paymentState.status === 'paid'
                                        ? 'bg-green-100/80 text-green-800 dark:bg-green-900/60 dark:text-green-200'
                                        : (a.deposit || 0) > 0 && paymentState.remainingAmount > 0
                                          ? 'bg-amber-100/80 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-800/60'
                                          : paymentState.status === 'partial'
                                            ? 'bg-amber-100/80 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-800/60'
                                            : 'bg-red-100/80 text-red-800 dark:bg-red-900/60 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800/60'
                                  }`}
                                >
                                  {getPaymentStatusLabel()}
                                </button>
                              ) : canSeeFees && a.fee ? (
                                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                                  !paymentState.isDue && paymentState.status !== 'paid'
                                    ? 'bg-elegant-100/80 text-elegant-700 dark:bg-elegant-800/60 dark:text-elegant-300'
                                    : paymentState.status === 'paid'
                                      ? 'bg-green-100/80 text-green-800 dark:bg-green-900/60 dark:text-green-200'
                                      : (a.deposit || 0) > 0 && paymentState.remainingAmount > 0
                                        ? 'bg-amber-100/80 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                                        : paymentState.status === 'partial'
                                          ? 'bg-amber-100/80 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                                          : 'bg-red-100/80 text-red-800 dark:bg-red-900/60 dark:text-red-200'
                                }`}>
                                  {getPaymentStatusLabel()}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden space-y-2.5">
                  {filtered.map(a => {
                    const d = new Date(a.date);
                    const fecha = d.toLocaleDateString();
                    const paymentState = paymentStateFor(a);
                    const canSeeFees = canViewFees(a);
                    const professional = professionals.find(p => p.uid === a.userId);
                    const paymentLabel =
                      paymentState.status === 'paid'
                        ? 'Pagado'
                        : !paymentState.isDue
                          ? 'Sin deuda'
                          : paymentState.status === 'partial'
                            ? `$${formatCurrency(paymentState.remainingAmount)}`
                            : a.fee
                              ? `$${formatCurrency(paymentState.remainingAmount)}`
                              : 'Sin honorarios';
                    const paymentTone =
                      paymentState.status === 'paid'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                        : !paymentState.isDue
                          ? 'bg-elegant-100 text-elegant-700 dark:bg-elegant-800/60 dark:text-elegant-300'
                          : paymentState.status === 'partial'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200';
                    return (
                      <div
                        key={a.id}
                        className="relative overflow-hidden bg-white/98 dark:bg-elegant-900/98 border border-elegant-200/60 dark:border-elegant-700/60 rounded-[20px] p-4 shadow-sm hover:shadow-md transition-all touch-manipulation backdrop-blur-sm active:scale-[0.99] duration-200"
                      >
                        <div className="absolute inset-x-0 -top-10 h-16 bg-gradient-to-r from-primary/8 via-secondary/8 to-primary/8 blur-2xl pointer-events-none" />

                        <div className="relative space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-primary-dark dark:text-white text-base truncate">
                                {a.patientName || a.title || 'Evento'}
                              </h3>
                              <p className="text-xs text-elegant-600 dark:text-elegant-400 mt-0.5">
                                {fecha} · {a.startTime} - {a.endTime}
                              </p>
                              {professional && (
                                <p className="text-[12px] text-elegant-500 dark:text-elegant-400 mt-0.5 truncate">
                                  {professional.displayName || professional.email}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              <span className={`inline-block px-2 py-1 rounded-full text-[12px] font-bold ${
                                a.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' :
                                a.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200' :
                                a.status === 'no-show' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-200' :
                                'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                              }`}>
                                {translateAppointmentStatus(a.status)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {canSeeFees && a.fee ? (
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold flex-1 ${paymentTone}`}>
                                <DollarSign className="w-3.5 h-3.5" />
                                {paymentLabel}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-elegant-100 dark:bg-elegant-800/60 text-elegant-600 dark:text-elegant-300 text-xs font-medium flex-1">
                                Sin honorarios
                              </span>
                            )}
                            {a.type && (
                              <span className="inline-flex items-center px-2.5 py-1.5 rounded-xl bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light text-[12px] font-bold">
                                {translateAppointmentType(a.type)}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-4 gap-1.5 pt-2.5 border-t border-elegant-200 dark:border-elegant-700">
                            {canSeeFees && permissions.canRegisterPayments && (
                              <button
                                onClick={() => openPaymentDialog(a)}
                                disabled={!a.fee}
                                className={`col-span-2 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all touch-manipulation disabled:opacity-40 ${
                                  paymentState.status === 'paid'
                                    ? 'bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-200'
                                    : !paymentState.isDue
                                      ? 'bg-elegant-100 text-elegant-700 dark:bg-elegant-800/60 dark:text-elegant-300'
                                      : paymentState.status === 'partial'
                                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200'
                                        : 'bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-200'
                                } active:scale-95`}
                              >
                                <DollarSign className="w-4 h-4" />
                                {paymentState.status === 'paid' ? 'Pagado' : 'Pago'}
                              </button>
                            )}
                            {(a.userId === user?.uid || permissions.canEditAppointmentsForOthers) && (
                              <button
                                onClick={() => handleEdit(a)}
                                className="flex items-center justify-center px-2 py-2.5 rounded-xl bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light transition-all touch-manipulation active:scale-95"
                                aria-label="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            {(a.userId === user?.uid || permissions.canEditAppointmentsForOthers) && (
                              <button
                                onClick={() => handleCancel(a)}
                                className="flex items-center justify-center px-2 py-2.5 rounded-xl bg-elegant-100 text-danger dark:bg-elegant-800/60 dark:text-red-400 transition-all touch-manipulation active:scale-95"
                                aria-label="Cancelar"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <Modal open={showForm} onClose={()=>{setShowForm(false); setEditingAppointment(null);}} title={editingAppointment ? 'Editar Turno' : 'Nuevo Turno'} maxWidth="max-w-2xl">
            <AppointmentForm
              initialData={editingAppointment || undefined}
              onCreated={(appt: Appointment) => {
                // No cerrar el modal aquí, ya se cierra en onSuccess
                // Solo refrescar los datos
                refreshDashboardAppointments();
              }}
              onCancel={()=>{setShowForm(false); setEditingAppointment(null);}}
              onSuccess={(title: string, message: string) => {
                // Cerrar el modal del formulario primero
                setShowForm(false);
                setEditingAppointment(null);
                  // Mostrar el modal de éxito después de la transición del formulario
                  setTimeout(() => {
                    setSuccessModal({ show: true, title, message });
                  }, 250);
                }}
              />
          </Modal>
        </div>
      <Modal
        open={paymentDialog.open}
        onClose={() => setPaymentDialog({ open: false, appointment: undefined, mode: 'total', amount: '' })}
        title="Registrar pago"
        maxWidth="max-w-md"
      >
        {paymentDialog.appointment && (() => {
          const appt = paymentDialog.appointment;
          if (!canViewFees(appt)) {
            return (
              <div className="space-y-4">
                <p className="text-sm text-elegant-600 dark:text-elegant-300">
                  No tienes permisos para ver honorarios de este turno.
                </p>
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="btn-secondary text-sm px-4 py-2"
                    onClick={() => setPaymentDialog({ open: false, appointment: undefined, mode: 'total', amount: '' })}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            );
          }
          const paymentState = paymentStateFor(appt);
          const remainingAmount = paymentState.remainingAmount;
          const deposit = appt.deposit || 0;

          return (
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm text-elegant-600 dark:text-elegant-300">
                  {appt.patientName || appt.title || 'Evento'}
                </p>
                <p className="text-lg font-semibold text-primary-dark dark:text-white">
                  Honorarios: ${appt.fee ? formatCurrency(appt.fee) : '0'}
                </p>
                {deposit > 0 && (
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Seña pagada: ${formatCurrency(deposit)}
                  </p>
                )}
                <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                  Monto restante: ${formatCurrency(remainingAmount)}
                </p>
              </div>

                <div className="flex items-center gap-2 bg-elegant-100 dark:bg-elegant-800/60 p-2 rounded-full">
                  <button
                    type="button"
                    className={`flex-1 py-2 rounded-full text-sm font-semibold transition ${paymentDialog.mode === 'total' ? 'bg-primary text-white shadow' : 'text-elegant-600 dark:text-elegant-200'}`}
                    onClick={() => setPaymentDialog(p => ({ ...p, mode: 'total', amount: remainingAmount.toString() }))}
                  >
                    {(appt.fee || 0) - remainingAmount > 0 && remainingAmount > 0 && remainingAmount < (appt.fee || 0)
                      ? 'Pagar saldo'
                      : 'Pago total'}
                  </button>
                  <button
                    type="button"
                    className={`flex-1 py-2 rounded-full text-sm font-semibold transition ${paymentDialog.mode === 'partial' ? 'bg-primary text-white shadow' : 'text-elegant-600 dark:text-elegant-200'}`}
                    onClick={() => setPaymentDialog(p => ({ ...p, mode: 'partial', amount: '' }))}
                  >
                    Pago parcial
                  </button>
                </div>

              {paymentDialog.mode === 'partial' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-elegant-600 dark:text-elegant-300">
                    Monto a pagar (máximo: ${formatCurrency(remainingAmount)})
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={remainingAmount}
                    value={paymentDialog.amount}
                    onChange={(e) => setPaymentDialog(p => ({ ...p, amount: e.target.value }))}
                    className="input-field text-sm py-2"
                    placeholder="Ingresar monto"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="btn-secondary text-sm px-4 py-2"
                  onClick={() => setPaymentDialog({ open: false, appointment: undefined, mode: 'total', amount: '' })}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-primary text-sm px-4 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={submitPayment}
                  disabled={submittingPayment}
                >
                  {submittingPayment ? 'Registrando...' : 'Registrar'}
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Modal de éxito */}
      <SuccessModal
        isOpen={successModal.show}
        onClose={() => setSuccessModal({ show: false, title: '', message: '' })}
        title={successModal.title}
        message={successModal.message}
      />

      </DashboardLayout>
    </ProtectedRoute>
  );
}
