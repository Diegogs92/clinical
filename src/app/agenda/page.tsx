'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useAppointments } from '@/contexts/AppointmentsContext';
import { usePatients } from '@/contexts/PatientsContext';
import { useAuth } from '@/contexts/AuthContext';
import { canModifyAppointment, getPermissionDeniedMessage } from '@/lib/appointmentPermissions';
import { useToast } from '@/contexts/ToastContext';
import { format, startOfWeek, endOfWeek, addDays, isSameDay, parseISO, isWithinInterval, startOfDay, endOfDay, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, User, Ban, ChevronLeft, ChevronRight, X, PlusCircle, FileText, GripVertical } from 'lucide-react';
import { BlockedSlot, SchedulePreference } from '@/types';
import {
  getBlockedSlotsByUser,
  createBlockedSlot,
  deleteBlockedSlot,
} from '@/lib/blockedSlots';
import {
  getAllSchedulePreferences,
} from '@/lib/schedulePreferences';
import { updateAppointment } from '@/lib/appointments';
import { combineDateAndTime } from '@/lib/dateUtils';
import { listProfessionals } from '@/lib/users';
import { UserProfile } from '@/types';
import Modal from '@/components/ui/Modal';
import { createPayment } from '@/lib/payments';
import { deleteAppointment } from '@/lib/appointments';
import { translateAppointmentStatus } from '@/lib/translations';
import { DollarSign, CheckCircle2, Ban as BanIcon, Trash2 } from 'lucide-react';
import { useConfirm } from '@/contexts/ConfirmContext';
import { usePayments } from '@/contexts/PaymentsContext';
import { useCalendarSync } from '@/contexts/CalendarSyncContext';
import { formatCurrency } from '@/lib/formatCurrency';

export default function AgendaPage() {
  const { user, userProfile } = useAuth();
  const toast = useToast();
  const { appointments, loading, refreshAppointments } = useAppointments();
  const { patients } = usePatients();
  const router = useRouter();
  const confirm = useConfirm();
  const { payments, pendingPayments, refreshPayments, refreshPendingPayments } = usePayments();
  const { syncAppointment } = useCalendarSync();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [blockForm, setBlockForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '10:00',
    reason: '',
  });
  const [professionals, setProfessionals] = useState<UserProfile[]>([]);
  const [schedulePreferences, setSchedulePreferences] = useState<SchedulePreference[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [paymentDialog, setPaymentDialog] = useState<{ open: boolean; appointment?: any; mode: 'total' | 'partial'; amount: string }>({
    open: false,
    appointment: undefined,
    mode: 'total',
    amount: '',
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [draggedAppointment, setDraggedAppointment] = useState<any | null>(null);
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null);

  // Cargar franjas bloqueadas al montar el componente
  useEffect(() => {
    const loadBlockedSlots = async () => {
      if (!user) return;
      setLoadingSlots(true);
      try {
        const slots = await getBlockedSlotsByUser(user.uid);
        setBlockedSlots(slots);
      } catch (error: any) {
        console.error('Error loading blocked slots:', error);

        if (error?.message?.includes('index')) {
          console.warn('⚠️ Se necesita crear un índice en Firestore. Busca el enlace "You can create it here" en la consola.');
        }
      } finally {
        setLoadingSlots(false);
      }
    };

    loadBlockedSlots();
  }, [user]);

  // Cargar profesionales (para colores) y preferencias de horarios
  useEffect(() => {
    const loadProfessionals = async () => {
      try {
        const list = await listProfessionals();
        setProfessionals(list);
      } catch (error) {
        console.error('[Agenda] Error loading professionals:', error);
      }
    };

    const loadSchedulePreferences = async () => {
      try {
        const prefs = await getAllSchedulePreferences();
        setSchedulePreferences(prefs);
      } catch (error) {
        console.error('[Agenda] Error loading schedule preferences:', error);
      }
    };

    loadProfessionals();
    loadSchedulePreferences();
  }, []);

  // Calcular rangos de fechas
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: startOfWeek(monthStart, { weekStartsOn: 1 }), end: endOfWeek(monthEnd, { weekStartsOn: 1 }) });

  // Obtener información del paciente
  const getPatientInfo = (patientId: string | undefined) => {
    if (!patientId) return null;
    return patients.find(p => p.id === patientId);
  };

  // Navegación
  const goToPrevious = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, -1));
    } else if (viewMode === 'week') {
      setCurrentDate(addDays(currentDate, -7));
    } else {
      setCurrentDate(addDays(currentDate, -1));
    }
  };

  const goToNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(addDays(currentDate, 7));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const goToToday = () => setCurrentDate(new Date());

  const newAppointment = () => {
    router.push('/dashboard?create=appointment');
  };

  // Manejar bloqueo de franja horaria
  const handleBlockSlot = async () => {
    if (!user) return;

    if (!blockForm.reason.trim()) {
      toast.error('Por favor ingresa un motivo para el bloqueo');
      return;
    }

    try {
      const newBlock = await createBlockedSlot(user.uid, blockForm);
      setBlockedSlots([...blockedSlots, newBlock]);
      setShowBlockModal(false);
      setBlockForm({
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: '09:00',
        endTime: '10:00',
        reason: '',
      });
      toast.success('Franja bloqueada creada exitosamente');
    } catch (error: any) {
      console.error('Error creating blocked slot:', error);
      if (error?.message?.includes('index')) {
        toast.error('Se necesita crear un índice en Firestore. Busca en la consola un enlace que diga "You can create it here" y haz clic en él.', { duration: 8000 });
      } else if (error?.code === 'permission-denied') {
        toast.error('Error de permisos. Por favor verifica que las reglas de Firestore estén actualizadas.', { duration: 6000 });
      } else {
        toast.error(`Error al crear la franja bloqueada: ${error?.message || 'Error desconocido'}`, { duration: 5000 });
      }
    }
  };

  // Eliminar bloqueo
  const removeBlock = async (id: string) => {
    try {
      await deleteBlockedSlot(id);
      setBlockedSlots(blockedSlots.filter(b => b.id !== id));
      toast.success('Franja bloqueada eliminada exitosamente');
    } catch (error) {
      console.error('Error deleting blocked slot:', error);
      toast.error('Error al eliminar la franja bloqueada. Por favor intenta de nuevo.');
    }
  };

  // Estadísticas
  const stats = useMemo(() => {
    const rangeStart = viewMode === 'month' ? monthStart : weekStart;
    const rangeEnd = viewMode === 'month' ? monthEnd : weekEnd;

    const rangeAppointments = appointments.filter(apt => {
      if (!apt.date) return false;
      const aptDate = parseISO(apt.date);
      return isWithinInterval(aptDate, { start: rangeStart, end: rangeEnd });
    });

    return {
      total: rangeAppointments.length,
      confirmed: rangeAppointments.filter(a => a.status === 'confirmed').length,
      pending: rangeAppointments.filter(a => a.status === 'scheduled').length,
      blocked: blockedSlots.filter(slot => {
        const slotDate = parseISO(slot.date);
        return isWithinInterval(slotDate, { start: rangeStart, end: rangeEnd });
      }).length,
    };
  }, [appointments, blockedSlots, viewMode, weekStart, weekEnd, monthStart, monthEnd]);

  // Función para obtener turnos y eventos de un día específico
  const getEventsForDay = (date: Date) => {
    const dayAppointments = appointments.filter(apt => {
      if (!apt.date) return false;
      return isSameDay(parseISO(apt.date), date);
    });

    const dayBlocked = blockedSlots.filter(slot => {
      return isSameDay(parseISO(slot.date), date);
    });

    const dayBirthdays = patients
      .filter(patient => patient.birthDate)
      .filter(patient => {
        const birthDate = parseISO(patient.birthDate!);
        return birthDate.getMonth() === date.getMonth() && birthDate.getDate() === date.getDate();
      });

    return { dayAppointments, dayBlocked, dayBirthdays };
  };

  const selectedProfessionalName = selectedEvent
    ? professionals.find(p => p.uid === selectedEvent.userId)?.displayName || ''
    : '';

  const handleAttendance = async (evt: any) => {
    if (!canModifyAppointment(evt, user, userProfile)) {
      toast.error(getPermissionDeniedMessage());
      return;
    }

    try {
      await updateAppointment(evt.id, { status: 'completed' });
      await refreshAppointments();
      toast.success('Asistencia registrada');
    } catch (error) {
      console.error('Error marcando asistencia:', error);
      toast.error('No se pudo registrar la asistencia');
    }
  };

  const handleCancelAppointment = async (evt: any) => {
    if (!canModifyAppointment(evt, user, userProfile)) {
      toast.error(getPermissionDeniedMessage());
      return;
    }

    const displayName = evt.patientName || evt.title || 'este turno';
    const confirmed = await confirm({
      title: 'Cancelar turno',
      description: `Cancelar el turno de ${displayName}?`,
      confirmText: 'Cancelar turno',
      tone: 'danger',
    });
    if (!confirmed) return;

    const isToday = evt.date && evt.date.startsWith(format(new Date(), 'yyyy-MM-dd'));

    try {
      await updateAppointment(evt.id, { status: 'cancelled' });

      if (evt.googleCalendarEventId) {
        await syncAppointment({ ...evt, status: 'cancelled' }, 'delete', evt.googleCalendarEventId);
      }

      if (isToday && evt.fee && evt.appointmentType === 'patient' && evt.patientId && evt.patientName) {
        const charge = await confirm({
          title: 'Cobraste honorarios?',
          description: `Registrar honorarios de $${formatCurrency(evt.fee)} para este turno cancelado hoy?`,
          confirmText: 'Si, registrar',
          cancelText: 'No, omitir',
          tone: 'success',
        });

        await createPayment({
          appointmentId: evt.id,
          patientId: evt.patientId,
          patientName: evt.patientName,
          amount: evt.fee,
          method: 'cash',
          status: charge ? 'completed' : 'pending',
          date: new Date().toISOString(),
          consultationType: evt.type || '',
          userId: evt.userId || user?.uid || '',
        });
      }

      await refreshAppointments();
      await refreshPayments();
      await refreshPendingPayments();
      toast.success('Turno cancelado');
    } catch (error) {
      console.error('Error cancelando turno:', error);
      toast.error('No se pudo cancelar el turno');
    }
  };

  const handleDelete = async (evt: any) => {
    if (!canModifyAppointment(evt, user, userProfile)) {
      toast.error(getPermissionDeniedMessage());
      return;
    }

    const displayName = evt.patientName || evt.title || 'este turno';
    const confirmed = await confirm({
      title: 'Eliminar turno',
      description: `Eliminar definitivamente el turno de ${displayName}?`,
      confirmText: 'Eliminar',
      tone: 'danger',
    });
    if (!confirmed) return;

    try {
      if (evt.googleCalendarEventId) {
        await syncAppointment(evt, 'delete', evt.googleCalendarEventId);
      }

      await deleteAppointment(evt.id);
      await refreshAppointments();
      await refreshPayments();
      await refreshPendingPayments();
      toast.success('Turno eliminado');
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error eliminando turno:', error);
      toast.error('No se pudo eliminar el turno');
    }
  };

  const openPaymentDialog = (appt: any) => {
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
    const appt = paymentDialog.appointment;
    if (!appt) return;
    if (!user) {
      toast.error('Debes iniciar sesión para registrar pagos');
      return;
    }

    const sanitized = paymentDialog.amount.replace(/\./g, '').replace(',', '.');
    const amountNum = Number(sanitized);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }

    if (appt.appointmentType !== 'patient' || !appt.patientId || !appt.patientName) {
      toast.error('No se puede registrar pago para este evento');
      return;
    }

    const deposit = appt.deposit || 0;
    const completed = payments
      .filter(p => p.appointmentId === appt.id && p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
    const pending = [...payments, ...pendingPayments]
      .filter(p => p.appointmentId === appt.id && p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0);
    const totalPaid = deposit + completed + pending;
    const remainingAmount = (appt.fee || 0) - totalPaid;

    if (amountNum > remainingAmount) {
      toast.error(`El monto ingresado ($${amountNum.toLocaleString('es-AR')}) supera el monto restante ($${remainingAmount.toLocaleString('es-AR')})`);
      return;
    }

    const isTotal = appt.fee ? amountNum >= appt.fee : true;
    const status: 'completed' | 'pending' = isTotal ? 'completed' : 'pending';

    try {
      setSubmittingPayment(true);
      await createPayment({
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

      if (isTotal && appt.status !== 'completed') {
        await updateAppointment(appt.id, { status: 'completed' });
      }

      await refreshAppointments();
      await refreshPayments();
      await refreshPendingPayments();

      toast.success(isTotal ? 'Pago registrado con éxito' : 'Pago parcial registrado con éxito');
      setPaymentDialog({ open: false, appointment: undefined, mode: 'total', amount: '' });
    } catch (error) {
      console.error('Error registrando pago:', error);
      toast.error('Error al registrar el pago');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, apt: any) => {
    if (!canModifyAppointment(apt, user, userProfile)) {
      e.preventDefault();
      toast.error(getPermissionDeniedMessage());
      return;
    }
    setDraggedAppointment(apt);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDate(date);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverDate(null);
  };

  const handleDrop = async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    setDragOverDate(null);

    if (!draggedAppointment) return;

    const hasConflict = blockedSlots.some(slot => {
      if (!isSameDay(parseISO(slot.date), targetDate)) return false;

      const slotStartTime = slot.startTime;
      const slotEndTime = slot.endTime;
      const aptStartTime = draggedAppointment.startTime;
      const aptEndTime = draggedAppointment.endTime;

      return (
        (aptStartTime >= slotStartTime && aptStartTime < slotEndTime) ||
        (aptEndTime > slotStartTime && aptEndTime <= slotEndTime) ||
        (aptStartTime <= slotStartTime && aptEndTime >= slotEndTime)
      );
    });

    if (hasConflict) {
      toast.error('No se puede mover el turno a una franja horaria bloqueada');
      setDraggedAppointment(null);
      return;
    }

    try {
      const newDate = targetDate.toISOString();

      await updateAppointment(draggedAppointment.id, {
        date: newDate,
      });

      const updated = {
        ...draggedAppointment,
        date: newDate,
      };

      const nextEventId = await syncAppointment(
        updated,
        draggedAppointment.googleCalendarEventId ? 'update' : 'create',
        draggedAppointment.googleCalendarEventId
      );

      if (nextEventId && !draggedAppointment.googleCalendarEventId) {
        await updateAppointment(draggedAppointment.id, { googleCalendarEventId: nextEventId });
      }

      await refreshAppointments();
      toast.success('Turno reprogramado');
    } catch (error) {
      console.error('Error moviendo turno:', error);
      toast.error('No se pudo mover el turno');
    } finally {
      setDraggedAppointment(null);
    }
  };

  // Función para renderizar card de turno
  const renderAppointmentCard = (apt: any, compact: boolean = false) => {
    const patient = getPatientInfo(apt.patientId);
    const patientName = apt.appointmentType === 'personal'
      ? apt.title || 'Evento personal'
      : patient
        ? `${patient.lastName} ${patient.firstName}`
        : apt.patientName || 'Sin nombre';

    const professional = professionals.find(p => p.uid === apt.userId);
    const professionalColor = professional?.color || '#38bdf8';

    let statusColor = 'bg-sky-100 border-sky-300 dark:bg-sky-900/30 dark:border-sky-700';
    let statusText = 'text-sky-700 dark:text-sky-300';

    if (apt.status === 'confirmed') {
      statusColor = 'bg-emerald-100 border-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-700';
      statusText = 'text-emerald-700 dark:text-emerald-300';
    } else if (apt.status === 'completed') {
      statusColor = 'bg-blue-100 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700';
      statusText = 'text-blue-700 dark:text-blue-300';
    } else if (apt.status === 'cancelled') {
      statusColor = 'bg-red-100 border-red-300 dark:bg-red-900/30 dark:border-red-700';
      statusText = 'text-red-700 dark:text-red-300';
    } else if (apt.status === 'no-show') {
      statusColor = 'bg-amber-100 border-amber-300 dark:bg-amber-900/30 dark:border-amber-700';
      statusText = 'text-amber-700 dark:text-amber-300';
    } else if (apt.appointmentType === 'personal') {
      statusColor = 'bg-purple-100 border-purple-300 dark:bg-purple-900/30 dark:border-purple-700';
      statusText = 'text-purple-700 dark:text-purple-300';
    }

    const isDragging = draggedAppointment?.id === apt.id;
    const canDrag = canModifyAppointment(apt, user, userProfile);

    if (compact) {
      return (
        <div
          key={apt.id}
          draggable={canDrag}
          onDragStart={(e) => handleDragStart(e, apt)}
          onClick={() => setSelectedEvent(apt)}
          className={`${statusColor} border-l-2 rounded p-1.5 cursor-pointer hover:shadow-sm transition-all text-xs ${
            isDragging ? 'opacity-50' : ''
          } ${canDrag ? 'cursor-move' : 'cursor-pointer'}`}
          style={{ borderLeftColor: professionalColor }}
        >
          <div className="flex items-center gap-1">
            {canDrag && <GripVertical className="w-3 h-3 text-elegant-400 dark:text-elegant-500 flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <div className={`font-medium ${statusText} truncate text-xs`}>{patientName}</div>
              <div className="text-[10px] text-elegant-600 dark:text-elegant-400">{apt.startTime}</div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        key={apt.id}
        draggable={canDrag}
        onDragStart={(e) => handleDragStart(e, apt)}
        onClick={() => setSelectedEvent(apt)}
        className={`${statusColor} border-l-4 rounded-lg p-3 cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02] ${
          isDragging ? 'opacity-50' : ''
        } ${canDrag ? 'cursor-move' : 'cursor-pointer'}`}
        style={{ borderLeftColor: professionalColor }}
      >
        <div className="flex items-start gap-2">
          {canDrag && (
            <GripVertical className="w-4 h-4 text-elegant-400 dark:text-elegant-500 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className={`font-semibold text-sm ${statusText} line-clamp-1`}>
                {patientName}
              </h4>
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor} ${statusText} whitespace-nowrap`}>
                {translateAppointmentStatus(apt.status)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-elegant-600 dark:text-elegant-300 mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-medium">{apt.startTime} - {apt.endTime}</span>
            </div>

            {professional && (
              <div className="flex items-center gap-1.5 text-xs text-elegant-600 dark:text-elegant-300 mb-1">
                <User className="w-3.5 h-3.5" />
                <span>{professional.displayName}</span>
              </div>
            )}

            {apt.fee && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary dark:text-primary-light mt-2">
                <DollarSign className="w-3.5 h-3.5" />
                <span>${formatCurrency(apt.fee)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                Agenda
              </h1>
              <p className="text-xs md:text-sm text-elegant-600 dark:text-elegant-400 mt-0.5">
                Gestiona tus turnos y citas - Arrastra para reprogramar
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={newAppointment}
                className="btn-primary flex items-center gap-2 whitespace-nowrap"
              >
                <PlusCircle className="w-4 h-4" />
                Nuevo Turno
              </button>
              <button
                onClick={() => setShowBlockModal(true)}
                className="btn-danger flex items-center gap-2 whitespace-nowrap"
              >
                <Ban className="w-4 h-4" />
                Bloquear Horario
              </button>
            </div>
          </div>
        </div>

        {/* Navegación y selector de vista */}
        <div className="card">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <button onClick={goToPrevious} className="icon-btn">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-center min-w-[200px]">
                <h2 className="text-lg font-semibold text-elegant-900 dark:text-white">
                  {viewMode === 'month'
                    ? format(currentDate, "MMMM yyyy", { locale: es })
                    : viewMode === 'week'
                    ? `${format(weekStart, 'd MMM', { locale: es })} - ${format(weekEnd, 'd MMM yyyy', { locale: es })}`
                    : format(currentDate, "EEEE d 'de' MMMM, yyyy", { locale: es })
                  }
                </h2>
                <button onClick={goToToday} className="text-sm text-primary hover:underline">
                  Ir a hoy
                </button>
              </div>
              <button onClick={goToNext} className="icon-btn">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 bg-elegant-100 dark:bg-elegant-800/60 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('day')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  viewMode === 'day'
                    ? 'bg-primary text-white shadow'
                    : 'text-elegant-600 dark:text-elegant-300 hover:bg-elegant-200 dark:hover:bg-elegant-700'
                }`}
              >
                Día
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  viewMode === 'week'
                    ? 'bg-primary text-white shadow'
                    : 'text-elegant-600 dark:text-elegant-300 hover:bg-elegant-200 dark:hover:bg-elegant-700'
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  viewMode === 'month'
                    ? 'bg-primary text-white shadow'
                    : 'text-elegant-600 dark:text-elegant-300 hover:bg-elegant-200 dark:hover:bg-elegant-700'
                }`}
              >
                Mes
              </button>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-primary/10 dark:bg-primary/25 border border-primary/20 dark:border-primary/30">
              <div className="text-2xl font-bold text-primary dark:text-primary-light">{stats.total}</div>
              <div className="text-xs text-elegant-600 dark:text-elegant-300">Total Turnos</div>
            </div>
            <div className="p-3 rounded-xl bg-green-500/10 dark:bg-green-500/25 border border-green-500/20 dark:border-green-500/30">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.confirmed}</div>
              <div className="text-xs text-elegant-600 dark:text-elegant-300">Confirmados</div>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 dark:bg-amber-500/25 border border-amber-500/20 dark:border-amber-500/30">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pending}</div>
              <div className="text-xs text-elegant-600 dark:text-elegant-300">Pendientes</div>
            </div>
            <div className="p-3 rounded-xl bg-red-500/10 dark:bg-red-500/25 border border-red-500/20 dark:border-red-500/30">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.blocked}</div>
              <div className="text-xs text-elegant-600 dark:text-elegant-300">Bloqueados</div>
            </div>
          </div>
        </div>

        {/* Vista de Semana */}
        {viewMode === 'week' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const { dayAppointments, dayBlocked, dayBirthdays } = getEventsForDay(day);
              const isToday = isSameDay(day, new Date());
              const isDragOver = dragOverDate && isSameDay(dragOverDate, day);

              return (
                <div
                  key={day.toISOString()}
                  onDragOver={(e) => handleDragOver(e, day)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, day)}
                  className={`card min-h-[350px] transition-all ${
                    isToday ? 'ring-2 ring-primary' : ''
                  } ${isDragOver ? 'ring-2 ring-blue-400 bg-blue-50 dark:bg-blue-900/20' : ''}`}
                >
                  <div className="mb-3 pb-3 border-b border-elegant-200 dark:border-elegant-700">
                    <div className="text-center">
                      <div className="text-xs font-medium text-elegant-500 dark:text-elegant-400 uppercase">
                        {format(day, 'EEE', { locale: es })}
                      </div>
                      <div className={`text-2xl font-bold ${isToday ? 'text-primary' : 'text-elegant-900 dark:text-white'}`}>
                        {format(day, 'd')}
                      </div>
                      <div className="text-xs text-elegant-500 dark:text-elegant-400">
                        {format(day, 'MMM', { locale: es })}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {dayBirthdays.map((patient) => (
                      <div
                        key={`birthday-${patient.id}`}
                        className="bg-pink-100 dark:bg-pink-900/30 border border-pink-300 dark:border-pink-700 rounded-lg p-3"
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-1">🎂</div>
                          <div className="text-xs font-semibold text-pink-700 dark:text-pink-300">
                            {patient.firstName} {patient.lastName}
                          </div>
                        </div>
                      </div>
                    ))}

                    {dayBlocked.map((slot) => (
                      <div
                        key={`blocked-${slot.id}`}
                        className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-3"
                      >
                        <div className="flex items-start gap-2">
                          <Ban className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1">
                              {slot.startTime} - {slot.endTime}
                            </div>
                            <div className="text-xs text-red-600 dark:text-red-400 line-clamp-2">
                              {slot.reason}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {dayAppointments
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map((apt) => renderAppointmentCard(apt))}

                    {dayAppointments.length === 0 && dayBlocked.length === 0 && dayBirthdays.length === 0 && (
                      <div className="text-center py-8">
                        <Calendar className="w-8 h-8 mx-auto text-elegant-300 dark:text-elegant-600 mb-2" />
                        <p className="text-xs text-elegant-400 dark:text-elegant-500">
                          Sin eventos
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Vista Mensual */}
        {viewMode === 'month' && (
          <div className="card">
            <div className="grid grid-cols-7 gap-px bg-elegant-200 dark:bg-elegant-700 border border-elegant-200 dark:border-elegant-700 rounded-lg overflow-hidden">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
                <div key={day} className="bg-elegant-100 dark:bg-elegant-800 p-2 text-center">
                  <span className="text-xs font-semibold text-elegant-600 dark:text-elegant-400">{day}</span>
                </div>
              ))}
              {monthDays.map((day) => {
                const { dayAppointments } = getEventsForDay(day);
                const isToday = isSameDay(day, new Date());
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isDragOver = dragOverDate && isSameDay(dragOverDate, day);

                return (
                  <div
                    key={day.toISOString()}
                    onDragOver={(e) => handleDragOver(e, day)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, day)}
                    className={`bg-white dark:bg-elegant-900 p-2 min-h-[100px] transition-all ${
                      !isCurrentMonth ? 'opacity-40' : ''
                    } ${isToday ? 'ring-2 ring-inset ring-primary' : ''} ${
                      isDragOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : 'text-elegant-900 dark:text-white'}`}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-1">
                      {dayAppointments.slice(0, 3).map((apt) => renderAppointmentCard(apt, true))}
                      {dayAppointments.length > 3 && (
                        <div className="text-[10px] text-elegant-500 dark:text-elegant-400 text-center">
                          +{dayAppointments.length - 3} más
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Vista de Día */}
        {viewMode === 'day' && (
          <div className="card">
            {(() => {
              const { dayAppointments, dayBlocked, dayBirthdays } = getEventsForDay(currentDate);

              return (
                <div className="space-y-3">
                  {dayBirthdays.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-elegant-700 dark:text-elegant-300 mb-2">
                        Cumpleaños
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {dayBirthdays.map((patient) => (
                          <div
                            key={`birthday-${patient.id}`}
                            className="bg-pink-100 dark:bg-pink-900/30 border border-pink-300 dark:border-pink-700 rounded-lg p-4"
                          >
                            <div className="text-center">
                              <div className="text-4xl mb-2">🎂</div>
                              <div className="font-semibold text-pink-700 dark:text-pink-300">
                                {patient.firstName} {patient.lastName}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {dayBlocked.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-elegant-700 dark:text-elegant-300 mb-2">
                        Franjas Bloqueadas
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {dayBlocked.map((slot) => (
                          <div
                            key={`blocked-${slot.id}`}
                            className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-4"
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <Ban className="w-5 h-5 text-red-600 dark:text-red-400" />
                                <span className="font-semibold text-red-700 dark:text-red-300">
                                  {slot.startTime} - {slot.endTime}
                                </span>
                              </div>
                              <button
                                onClick={() => removeBlock(slot.id)}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-sm text-red-600 dark:text-red-400">
                              {slot.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {dayAppointments.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-elegant-700 dark:text-elegant-300 mb-2">
                        Turnos del día
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {dayAppointments
                          .sort((a, b) => a.startTime.localeCompare(b.startTime))
                          .map((apt) => renderAppointmentCard(apt))}
                      </div>
                    </div>
                  )}

                  {dayAppointments.length === 0 && dayBlocked.length === 0 && dayBirthdays.length === 0 && (
                    <div className="text-center py-16">
                      <Calendar className="w-16 h-16 mx-auto text-elegant-300 dark:text-elegant-600 mb-4" />
                      <p className="text-elegant-500 dark:text-elegant-400">
                        No hay eventos programados para este día
                      </p>
                      <button
                        onClick={newAppointment}
                        className="btn-primary mt-4 inline-flex items-center gap-2"
                      >
                        <PlusCircle className="w-4 h-4" />
                        Crear Turno
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Leyenda de estados */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-medium text-elegant-700 dark:text-elegant-200">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-elegant-800/50 border border-elegant-200 dark:border-elegant-700">
            <span className="inline-block w-5 h-5 rounded bg-sky-100 dark:bg-sky-500/30 border border-sky-300 dark:border-sky-400" />
            Agendado
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-elegant-800/50 border border-elegant-200 dark:border-elegant-700">
            <span className="inline-block w-5 h-5 rounded bg-emerald-100 dark:bg-emerald-500/30 border border-emerald-300 dark:border-emerald-400" />
            Confirmado
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-elegant-800/50 border border-elegant-200 dark:border-elegant-700">
            <span className="inline-block w-5 h-5 rounded bg-blue-100 dark:bg-blue-500/30 border border-blue-300 dark:border-blue-400" />
            Completado
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-elegant-800/50 border border-elegant-200 dark:border-elegant-700">
            <span className="inline-block w-5 h-5 rounded bg-red-100 dark:bg-red-500/30 border border-red-300 dark:border-red-400" />
            Cancelado
          </div>
        </div>
      </div>

      {/* Modal para bloquear franja horaria */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-elegant-900 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-elegant-900 dark:text-white mb-4">
              Bloquear Franja Horaria
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-elegant-700 dark:text-elegant-300 mb-1.5">
                  Fecha
                </label>
                <input
                  type="date"
                  value={blockForm.date}
                  onChange={(e) => setBlockForm({ ...blockForm, date: e.target.value })}
                  className="input-field w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-elegant-700 dark:text-elegant-300 mb-1.5">
                    Hora Inicio
                  </label>
                  <input
                    type="time"
                    value={blockForm.startTime}
                    onChange={(e) => setBlockForm({ ...blockForm, startTime: e.target.value })}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-elegant-700 dark:text-elegant-300 mb-1.5">
                    Hora Fin
                  </label>
                  <input
                    type="time"
                    value={blockForm.endTime}
                    onChange={(e) => setBlockForm({ ...blockForm, endTime: e.target.value })}
                    className="input-field w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-elegant-700 dark:text-elegant-300 mb-1.5">
                  Motivo del bloqueo
                </label>
                <textarea
                  value={blockForm.reason}
                  onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
                  placeholder="Ej: Reunión, Capacitación, Feriado..."
                  rows={3}
                  className="input-field w-full resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowBlockModal(false)}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleBlockSlot}
                className="btn-danger flex-1"
              >
                Bloquear
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedEvent && (
        <Modal open={!!selectedEvent} onClose={() => setSelectedEvent(null)} title="Detalle de turno" maxWidth="max-w-2xl">
          <div className="space-y-4">
            {/* Card principal con gradiente similar al calendario */}
            <div className="bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-sky-900/20 dark:via-elegant-900 dark:to-blue-900/20 border-l-4 rounded-xl p-6 shadow-sm"
              style={{ borderLeftColor: professionals.find(p => p.uid === selectedEvent.userId)?.color || '#38bdf8' }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-elegant-900 dark:text-white mb-1">
                    {selectedEvent.patientName || 'Sin nombre'}
                  </h3>
                  <p className="text-sm text-elegant-600 dark:text-elegant-300">
                    {selectedProfessionalName || 'N/D'}
                  </p>
                </div>
                <div className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase ${
                  selectedEvent.status === 'completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                  selectedEvent.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' :
                  selectedEvent.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                  selectedEvent.status === 'no-show' ? 'bg-gray-100 text-gray-700 dark:bg-gray-700/40 dark:text-gray-300' :
                  'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300'
                }`}>
                  {translateAppointmentStatus(selectedEvent.status)}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                  <span className="font-medium text-elegant-900 dark:text-white">
                    {format(parseISO(selectedEvent.date), "EEEE d 'de' MMMM, yyyy", { locale: es })}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                  <span className="font-medium text-elegant-900 dark:text-white">
                    {selectedEvent.startTime} - {selectedEvent.endTime}
                  </span>
                </div>

                {selectedEvent.fee && (
                  <div className="flex items-center gap-3 pt-3 mt-3 border-t border-elegant-200 dark:border-elegant-700">
                    <DollarSign className="w-5 h-5 text-primary" />
                    <div className="flex-1 flex items-center justify-between">
                      <span className="text-sm text-elegant-600 dark:text-elegant-300">Honorarios</span>
                      <span className="text-xl font-bold text-primary dark:text-primary-light">
                        ${formatCurrency(selectedEvent.fee)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {selectedEvent.notes && (
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-400 mb-1">Notas del turno</p>
                    <p className="text-sm text-amber-900 dark:text-amber-200 whitespace-pre-line">{selectedEvent.notes}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Acciones principales */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  openPaymentDialog(selectedEvent);
                  setSelectedEvent(null);
                }}
                disabled={!selectedEvent.fee || selectedEvent.status === 'cancelled'}
                className="group relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl p-4 transition-all duration-200 hover:shadow-lg hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                <div className="relative z-10 flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-semibold">Registrar Pago</span>
                </div>
              </button>

              <button
                onClick={() => {
                  handleAttendance(selectedEvent);
                  setSelectedEvent(null);
                }}
                disabled={selectedEvent.status === 'completed' || selectedEvent.status === 'cancelled'}
                className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl p-4 transition-all duration-200 hover:shadow-lg hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                <div className="relative z-10 flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-semibold">Marcar Asistencia</span>
                </div>
              </button>
            </div>

            {/* Acciones secundarias */}
            <div className="border-t border-elegant-200 dark:border-elegant-700 pt-3">
              <p className="text-xs font-semibold text-elegant-500 dark:text-elegant-400 mb-2">Más opciones</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    handleCancelAppointment(selectedEvent);
                    setSelectedEvent(null);
                  }}
                  disabled={selectedEvent.status === 'cancelled'}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <BanIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Cancelar</span>
                </button>

                <button
                  onClick={() => {
                    handleDelete(selectedEvent);
                  }}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 transition-colors"
                >
                  <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <span className="text-xs font-medium text-red-700 dark:text-red-300">Eliminar</span>
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      <Modal
        open={paymentDialog.open}
        onClose={() => setPaymentDialog({ open: false, appointment: undefined, mode: 'total', amount: '' })}
        title="Registrar pago"
        maxWidth="max-w-md"
      >
        {paymentDialog.appointment && (() => {
          const appt = paymentDialog.appointment;
          const deposit = appt.deposit || 0;
          const completed = payments
            .filter(p => p.appointmentId === appt.id && p.status === 'completed')
            .reduce((sum, p) => sum + p.amount, 0);
          const pending = [...payments, ...pendingPayments]
            .filter(p => p.appointmentId === appt.id && p.status === 'pending')
            .reduce((sum, p) => sum + p.amount, 0);
          const totalPaid = deposit + completed + pending;
          const remainingAmount = (appt.fee || 0) - totalPaid;

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
                  Pago total
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
    </DashboardLayout>
  );
}
