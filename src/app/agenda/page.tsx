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
import SuccessModal from '@/components/ui/SuccessModal';
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
  const [successModal, setSuccessModal] = useState<{ show: boolean; title: string; message?: string }>({
    show: false,
    title: '',
    message: ''
  });
  const [attendanceDialog, setAttendanceDialog] = useState<{ open: boolean; appointment?: any }>({
    open: false,
    appointment: undefined
  });

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
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i)); // Solo lunes a viernes

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
      setSuccessModal({ show: true, title: 'Franja bloqueada', message: 'La franja se ha bloqueado exitosamente' });
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
      setSuccessModal({ show: true, title: 'Franja eliminada', message: 'La franja bloqueada se eliminó exitosamente' });
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

  const handleAttendance = (evt: any) => {
    if (!canModifyAppointment(evt, user, userProfile)) {
      toast.error(getPermissionDeniedMessage());
      return;
    }
    setAttendanceDialog({ open: true, appointment: evt });
  };

  const submitAttendance = async (status: 'completed' | 'no-show') => {
    const evt = attendanceDialog.appointment;
    if (!evt) return;

    try {
      await updateAppointment(evt.id, { status });
      await refreshAppointments();
      setAttendanceDialog({ open: false, appointment: undefined });
      setSuccessModal({
        show: true,
        title: status === 'completed' ? 'Asistencia registrada' : 'Ausencia registrada',
        message: status === 'completed'
          ? 'El paciente ha sido marcado como presente'
          : 'El paciente ha sido marcado como ausente'
      });
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
      setSuccessModal({ show: true, title: 'Turno cancelado', message: 'El turno se ha cancelado correctamente' });
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
      setSelectedEvent(null);
      setSuccessModal({ show: true, title: 'Turno eliminado', message: 'El turno se ha eliminado correctamente' });
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

      setSuccessModal({
        show: true,
        title: isTotal ? 'Pago registrado' : 'Pago parcial registrado',
        message: isTotal ? 'El pago se ha registrado con éxito' : 'El pago parcial se ha registrado con éxito'
      });
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
      setSuccessModal({ show: true, title: 'Turno reprogramado', message: 'El turno se ha reprogramado correctamente' });
    } catch (error) {
      console.error('Error moviendo turno:', error);
      toast.error('No se pudo mover el turno');
    } finally {
      setDraggedAppointment(null);
    }
  };

  // Función para renderizar card de turno
  // Calcular monto pendiente de pagar
  const calculatePending = (apt: any) => {
    const deposit = apt.deposit || 0;
    const completed = payments
      .filter(p => p.appointmentId === apt.id && p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
    const pending = [...payments, ...pendingPayments]
      .filter(p => p.appointmentId === apt.id && p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0);
    const totalPaid = deposit + completed + pending;
    return (apt.fee || 0) - totalPaid;
  };

  const renderAppointmentCard = (apt: any, compact: boolean = false) => {
    const patient = getPatientInfo(apt.patientId);
    const patientName = apt.appointmentType === 'personal'
      ? apt.title || 'Evento personal'
      : patient
        ? `${patient.lastName} ${patient.firstName}`
        : apt.patientName || 'Sin nombre';

    const professional = professionals.find(p => p.uid === apt.userId);
    const professionalColor = professional?.color || '#38bdf8';
    const pendingAmount = calculatePending(apt);

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
          <div className="flex-1 min-w-0 space-y-1.5">
            {/* Nombre del paciente */}
            <h4 className={`font-semibold text-sm ${statusText} line-clamp-2`}>
              {patientName}
            </h4>

            {/* Horario */}
            <div className="flex items-center gap-1.5 text-xs text-elegant-600 dark:text-elegant-300">
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="font-medium">{apt.startTime} - {apt.endTime}</span>
            </div>

            {/* Tipo de tratamiento */}
            {apt.type && (
              <div className="text-xs text-elegant-600 dark:text-elegant-300">
                {apt.type === 'odontologia-general' ? 'Odontología General' :
                 apt.type === 'ortodoncia' ? 'Ortodoncia' :
                 apt.type === 'endodoncia' ? 'Endodoncia' :
                 apt.type === 'armonizacion' ? 'Armonización' :
                 apt.type}
              </div>
            )}

            {/* Monto pendiente */}
            {pendingAmount > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400">
                <DollarSign className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Pendiente: ${formatCurrency(pendingAmount)}</span>
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
          <div className="flex gap-3">
            {/* Columna de horarios */}
            <div className="hidden lg:block w-20 flex-shrink-0">
              <div className="card sticky top-4">
                <div className="mb-3 pb-3 border-b border-elegant-200 dark:border-elegant-700">
                  <div className="text-center text-xs font-medium text-elegant-500 dark:text-elegant-400">
                    Hora
                  </div>
                </div>
                <div className="space-y-4">
                  {Array.from({ length: 11 }, (_, i) => 9 + i).map((hour) => (
                    <div key={hour} className="text-center text-xs font-medium text-elegant-600 dark:text-elegant-400 py-1">
                      {String(hour).padStart(2, '0')}:00
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Grid de días */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
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
                  className={`card min-h-[400px] transition-all ${
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
                        className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-3 group hover:shadow-md transition-shadow"
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
                          <button
                            onClick={async () => {
                              if (await confirm({
                                title: 'Eliminar franja bloqueada',
                                message: `¿Estás seguro de que deseas eliminar esta franja bloqueada (${slot.startTime} - ${slot.endTime})?`,
                                confirmText: 'Eliminar',
                                cancelText: 'Cancelar'
                              })) {
                                try {
                                  await deleteBlockedSlot(slot.id);
                                  const slots = await getBlockedSlotsByUser(user!.uid);
                                  setBlockedSlots(slots);
                                  setSuccessModal({ show: true, title: 'Franja eliminada', message: 'La franja bloqueada se ha eliminado correctamente' });
                                } catch (error) {
                                  console.error('Error eliminando franja:', error);
                                  toast.error('No se pudo eliminar la franja bloqueada');
                                }
                              }
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-200 dark:hover:bg-red-800/50"
                            title="Eliminar franja bloqueada"
                          >
                            <X className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                          </button>
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
                          Sin turnos
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
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
            {/* Card principal con diseño mejorado */}
            <div className="relative overflow-hidden bg-gradient-to-br from-white via-sky-50/30 to-blue-50/50 dark:from-elegant-800 dark:via-sky-900/10 dark:to-blue-900/10 rounded-xl shadow-lg border border-elegant-200/50 dark:border-elegant-700/50">
              {/* Barra lateral colorida del profesional */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1.5"
                style={{ backgroundColor: professionals.find(p => p.uid === selectedEvent.userId)?.color || '#38bdf8' }}
              />

              <div className="p-5">
                {/* Header con nombre y estado */}
                <div className="flex items-start justify-between mb-4 pb-4 border-b border-elegant-200 dark:border-elegant-700">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-elegant-900 dark:text-white mb-1">
                      {selectedEvent.patientName || 'Sin nombre'}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: professionals.find(p => p.uid === selectedEvent.userId)?.color || '#38bdf8' }}
                      />
                      <p className="text-sm font-medium text-elegant-600 dark:text-elegant-300">
                        {selectedProfessionalName || 'N/D'}
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide ${
                    selectedEvent.status === 'completed' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' :
                    selectedEvent.status === 'confirmed' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white' :
                    selectedEvent.status === 'cancelled' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' :
                    selectedEvent.status === 'no-show' ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white' :
                    'bg-gradient-to-r from-sky-500 to-sky-600 text-white'
                  }`}>
                    {translateAppointmentStatus(selectedEvent.status)}
                  </div>
                </div>

                {/* Información del turno */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white dark:bg-elegant-800/50 rounded-lg p-3 border border-elegant-200 dark:border-elegant-700">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-elegant-500 dark:text-elegant-400">Fecha</p>
                        <p className="text-xs font-bold text-elegant-900 dark:text-white capitalize truncate">
                          {format(parseISO(selectedEvent.date), "EEE d 'de' MMM", { locale: es })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-elegant-800/50 rounded-lg p-3 border border-elegant-200 dark:border-elegant-700">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-elegant-500 dark:text-elegant-400">Horario</p>
                        <p className="text-xs font-bold text-elegant-900 dark:text-white">
                          {selectedEvent.startTime} - {selectedEvent.endTime}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Honorarios */}
                {selectedEvent.fee && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                          <DollarSign className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-green-700 dark:text-green-400">Honorarios</p>
                          <p className="text-xs text-green-600 dark:text-green-500">Total a cobrar</p>
                        </div>
                      </div>
                      <span className="text-xl font-black text-green-600 dark:text-green-400">
                        ${formatCurrency(selectedEvent.fee)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notas */}
            {selectedEvent.notes && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-amber-800 dark:text-amber-400 mb-1">Notas</p>
                    <p className="text-xs text-amber-900 dark:text-amber-200 whitespace-pre-line leading-relaxed">{selectedEvent.notes}</p>
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
                className="group relative overflow-hidden bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 hover:from-green-600 hover:via-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg p-3.5 transition-all duration-200 hover:shadow-lg hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  <span className="text-sm font-bold">Registrar Pago</span>
                </div>
              </button>

              <button
                onClick={() => {
                  handleAttendance(selectedEvent);
                  setSelectedEvent(null);
                }}
                disabled={selectedEvent.status === 'completed' || selectedEvent.status === 'cancelled'}
                className="group relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg p-3.5 transition-all duration-200 hover:shadow-lg hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-bold">Marcar Asistencia</span>
                </div>
              </button>
            </div>

            {/* Acciones secundarias */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  handleCancelAppointment(selectedEvent);
                  setSelectedEvent(null);
                }}
                disabled={selectedEvent.status === 'cancelled'}
                className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-amber-300 dark:border-amber-700"
              >
                <BanIcon className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300">Cancelar</span>
              </button>

              <button
                onClick={() => {
                  handleDelete(selectedEvent);
                }}
                className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 transition-all border border-red-300 dark:border-red-700"
              >
                <Trash2 className="w-4 h-4 text-red-700 dark:text-red-400" />
                <span className="text-xs font-bold text-red-800 dark:text-red-300">Eliminar</span>
              </button>
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

      {/* Modal de confirmación de asistencia */}
      <Modal
        open={attendanceDialog.open}
        onClose={() => setAttendanceDialog({ open: false, appointment: undefined })}
        title="Registrar asistencia"
        maxWidth="max-w-md"
      >
        {attendanceDialog.appointment && (
          <div className="space-y-6">
            <p className="text-elegant-600 dark:text-elegant-300 text-center">
              ¿El paciente <span className="font-semibold text-elegant-900 dark:text-white">{attendanceDialog.appointment.patientName}</span> asistió a la cita?
            </p>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => submitAttendance('completed')}
                className="flex flex-col items-center gap-3 p-6 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white transition-all duration-200 hover:shadow-lg hover:scale-105"
              >
                <CheckCircle2 className="w-12 h-12" />
                <span className="text-lg font-bold">Asistió</span>
              </button>

              <button
                onClick={() => submitAttendance('no-show')}
                className="flex flex-col items-center gap-3 p-6 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white transition-all duration-200 hover:shadow-lg hover:scale-105"
              >
                <Ban className="w-12 h-12" />
                <span className="text-lg font-bold">Ausente</span>
              </button>
            </div>

            <button
              onClick={() => setAttendanceDialog({ open: false, appointment: undefined })}
              className="w-full btn-secondary"
            >
              Cancelar
            </button>
          </div>
        )}
      </Modal>

      {/* Modal de éxito */}
      <SuccessModal
        isOpen={successModal.show}
        onClose={() => setSuccessModal({ show: false, title: '', message: '' })}
        title={successModal.title}
        message={successModal.message}
      />
    </DashboardLayout>
  );
}
