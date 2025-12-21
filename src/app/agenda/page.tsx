'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useAppointments } from '@/contexts/AppointmentsContext';
import { usePatients } from '@/contexts/PatientsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { format, startOfWeek, endOfWeek, addDays, isSameDay, parseISO, isWithinInterval, differenceInMinutes, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, User, Phone, Ban, ChevronLeft, ChevronRight, X, PlusCircle, Eye } from 'lucide-react';
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
import { Calendar as BigCalendar, Views, dateFnsLocalizer, SlotInfo } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { listProfessionals } from '@/lib/users';
import { UserProfile } from '@/types';
import Modal from '@/components/ui/Modal';
import { createPayment } from '@/lib/payments';
import { deleteAppointment } from '@/lib/appointments';
import { translateAppointmentStatus } from '@/lib/translations';
import { DollarSign, CheckCircle2, Ban as BanIcon, Edit2, Trash2 } from 'lucide-react';
import { useConfirm } from '@/contexts/ConfirmContext';
import { usePayments } from '@/contexts/PaymentsContext';
import { useCalendarSync } from '@/contexts/CalendarSyncContext';

const locales = { es };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay: (date: Date) => date.getDay(),
  locales,
});

const DnDCalendar = withDragAndDrop(BigCalendar);

export default function AgendaPage() {
  const { user } = useAuth();
  const toast = useToast();
  const { appointments, loading, refreshAppointments } = useAppointments();
  const { patients } = usePatients();
  const router = useRouter();
  const confirm = useConfirm();
  const { refreshPayments, refreshPendingPayments } = usePayments();
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
  const minHour = 9;
  const maxHour = 19;
  const stepMinutes = 15;
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

        // Si es un error de índice, mostrar en consola
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

  // Calcular semana actual
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Lunes
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 }); // Domingo
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Obtener información del paciente
  const getPatientInfo = (patientId: string | undefined) => {
    if (!patientId) return null;
    return patients.find(p => p.id === patientId);
  };

  // Navegación de semanas
  const goToPreviousWeek = () => setCurrentDate(addDays(currentDate, -7));
  const goToNextWeek = () => setCurrentDate(addDays(currentDate, 7));
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

    console.log('📝 Intentando crear franja bloqueada:', {
      userId: user.uid,
      data: blockForm,
    });

    try {
      const newBlock = await createBlockedSlot(user.uid, blockForm);
      console.log('✅ Franja bloqueada creada exitosamente:', newBlock);

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
      console.error('❌ Error creating blocked slot:', error);
      console.error('Error completo:', JSON.stringify(error, null, 2));

      // Si es un error de índice, dar instrucciones específicas
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

  // Estadísticas de la semana
  const weekStats = useMemo(() => {
    const weekAppointments = appointments.filter(apt => {
      if (!apt.date) return false;
      const aptDate = parseISO(apt.date);
      return isWithinInterval(aptDate, { start: weekStart, end: weekEnd });
    });

    return {
      total: weekAppointments.length,
      confirmed: weekAppointments.filter(a => a.status === 'confirmed').length,
      pending: weekAppointments.filter(a => a.status === 'scheduled').length,
      blocked: blockedSlots.filter(slot => {
        const slotDate = parseISO(slot.date);
        return isWithinInterval(slotDate, { start: weekStart, end: weekEnd });
      }).length,
    };
  }, [appointments, blockedSlots, weekStart, weekEnd]);

  // Eventos para agenda interactiva
  const calendarEvents = useMemo(() => {
    const colorMap = new Map<string, string>();
    professionals.forEach(p => {
      if (p.color) colorMap.set(p.uid, p.color);
    });

    // Eventos de turnos
    const appointmentEvents = appointments.map(apt => {
      const start = combineDateAndTime(apt.date, apt.startTime);
      const end = apt.endTime ? combineDateAndTime(apt.date, apt.endTime) : new Date(start.getTime() + (apt.duration || 30) * 60000);
      const patient = getPatientInfo(apt.patientId);
      const title = apt.appointmentType === 'personal'
        ? apt.title || 'Evento personal'
        : patient
          ? `${patient.firstName} ${patient.lastName}`
          : apt.patientName || 'Turno';
      const professionalColor = colorMap.get(apt.userId || '');

      return {
        ...apt,
        title,
        start,
        end,
        professionalColor,
      };
    });

    // Eventos de cumpleaños
    const currentYear = currentDate.getFullYear();
    const birthdayEvents = patients
      .filter(patient => patient.birthDate)
      .map(patient => {
        const birthDate = parseISO(patient.birthDate!);
        const birthdayThisYear = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());

        return {
          id: `birthday-${patient.id}`,
          title: `🎂 ${patient.firstName} ${patient.lastName}`,
          start: birthdayThisYear,
          end: birthdayThisYear,
          isBirthday: true,
          patientId: patient.id,
          patientName: `${patient.firstName} ${patient.lastName}`,
          allDay: true,
        };
      });

    return [...appointmentEvents, ...birthdayEvents];
  }, [appointments, patients, professionals, currentDate]);

  const eventPropGetter = (event: any) => {
    const status = event.status;
    const isDark = document.documentElement.classList.contains('dark');

    const colorHex = event.professionalColor as string | undefined;
    const hexToRgba = (hex: string, alpha: number) => {
      const h = hex.replace('#', '');
      if (h.length !== 6) return `rgba(14,165,233,${alpha})`;
      const r = parseInt(h.substring(0, 2), 16);
      const g = parseInt(h.substring(2, 4), 16);
      const b = parseInt(h.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const baseColor = colorHex || '#38bdf8';
    let bgLight = colorHex ? hexToRgba(baseColor, 0.25) : '#CFE5FF';
    let bgDark = colorHex ? hexToRgba(baseColor, 0.35) : 'rgba(56, 189, 248, 0.42)';
    let borderColor = colorHex ? hexToRgba(baseColor, 0.6) : 'rgba(56, 189, 248, 0.65)';
    let textColor = isDark ? '#EAF6FF' : '#0B162E';

    if (status === 'confirmed') {
      bgLight = colorHex ? hexToRgba(baseColor, 0.3) : '#D1F6DD';
      bgDark = colorHex ? hexToRgba(baseColor, 0.45) : 'rgba(34, 197, 94, 0.42)';
      borderColor = isDark ? 'rgba(34, 197, 94, 0.72)' : 'rgba(22, 163, 74, 0.55)';
    } else if (status === 'completed') {
      bgLight = colorHex ? hexToRgba(baseColor, 0.3) : '#D9E8FF';
      bgDark = colorHex ? hexToRgba(baseColor, 0.45) : 'rgba(59, 130, 246, 0.42)';
      borderColor = isDark ? 'rgba(96, 165, 250, 0.7)' : 'rgba(37, 99, 235, 0.55)';
    } else if (status === 'cancelled') {
      bgLight = '#FBD2D2';
      bgDark = 'rgba(248, 113, 113, 0.42)';
      borderColor = isDark ? 'rgba(248, 113, 113, 0.75)' : 'rgba(220, 38, 38, 0.6)';
    } else if (status === 'no-show') {
      bgLight = '#FCE7B2';
      bgDark = 'rgba(234, 179, 8, 0.42)';
      borderColor = isDark ? 'rgba(234, 179, 8, 0.68)' : 'rgba(202, 138, 4, 0.6)';
    } else if (event.appointmentType === 'personal') {
      bgLight = '#E8D9FF';
      bgDark = 'rgba(168, 85, 247, 0.4)';
      borderColor = isDark ? 'rgba(192, 132, 252, 0.7)' : 'rgba(147, 51, 234, 0.55)';
    }

    if (event.isBlocked) {
      bgLight = 'repeating-linear-gradient(45deg, rgba(239,68,68,0.15), rgba(239,68,68,0.15) 8px, rgba(239,68,68,0.3) 8px, rgba(239,68,68,0.3) 16px)';
      bgDark = 'repeating-linear-gradient(45deg, rgba(239,68,68,0.3), rgba(239,68,68,0.3) 8px, rgba(239,68,68,0.45) 8px, rgba(239,68,68,0.45) 16px)';
      borderColor = isDark ? 'rgba(248, 113, 113, 0.7)' : 'rgba(220, 38, 38, 0.55)';
    }

    if (event.isBirthday) {
      bgLight = '#FFE4E8';
      bgDark = 'rgba(244, 114, 182, 0.35)';
      borderColor = isDark ? 'rgba(244, 114, 182, 0.7)' : 'rgba(236, 72, 153, 0.6)';
      textColor = isDark ? '#FFF1F2' : '#831843';
    }

    return {
      style: {
        backgroundColor: isDark ? bgDark : bgLight,
        color: textColor,
        borderRadius: 8,
        border: `1px solid ${borderColor}`,
        padding: '4px 8px',
        fontWeight: 600,
        boxShadow: isDark
          ? '0 10px 22px -12px rgba(0, 0, 0, 0.65)'
          : '0 8px 20px -12px rgba(15, 23, 42, 0.35)',
      },
    };
  };

  // Aplicar estilos a las franjas horarias según preferencias
  const slotPropGetter = (date: Date) => {
    const dayOfWeek = date.getDay();
    const time = format(date, 'HH:mm');
    const timeMinutes = parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1]);

    // Buscar si hay preferencia para este día y hora
    const preference = schedulePreferences.find(pref => {
      if (pref.dayOfWeek !== dayOfWeek) return false;

      const startMinutes = parseInt(pref.startTime.split(':')[0]) * 60 + parseInt(pref.startTime.split(':')[1]);
      const endMinutes = parseInt(pref.endTime.split(':')[0]) * 60 + parseInt(pref.endTime.split(':')[1]);

      return timeMinutes >= startMinutes && timeMinutes < endMinutes;
    });

    if (preference) {
      const professional = professionals.find(p => p.uid === preference.professionalId);
      const isDark = document.documentElement.classList.contains('dark');

      // Usar el color del profesional si está disponible, sino usar colores por defecto
      if (professional?.color) {
        const hexToRgba = (hex: string, alpha: number) => {
          const h = hex.replace('#', '');
          if (h.length !== 6) return `rgba(100,116,139,${alpha})`;
          const r = parseInt(h.substring(0, 2), 16);
          const g = parseInt(h.substring(2, 4), 16);
          const b = parseInt(h.substring(4, 6), 16);
          return `rgba(${r},${g},${b},${alpha})`;
        };

        return {
          style: {
            backgroundColor: isDark ? hexToRgba(professional.color, 0.08) : hexToRgba(professional.color, 0.05),
            borderLeft: `3px solid ${professional.color}`,
          },
        };
      }

      // Color por defecto si no hay color de profesional
      return {
        style: {
          backgroundColor: isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.05)',
          borderLeft: '3px solid rgba(59, 130, 246, 0.4)',
        },
      };
    }

    return {};
  };

  const handleEventDrop = async ({ event, start, end }: any) => {
    // No permitir mover cumpleaños
    if (event.isBirthday) {
      toast.error('Los cumpleaños no pueden moverse');
      return;
    }

    try {
      const duration = Math.max(15, differenceInMinutes(end, start));
      await updateAppointment(event.id, {
        date: start.toISOString(),
        startTime: format(start, 'HH:mm'),
        endTime: format(end, 'HH:mm'),
        duration,
      });
      await refreshAppointments();
      toast.success('Turno reprogramado');
    } catch (error) {
      console.error('Error moviendo turno:', error);
      toast.error('No se pudo mover el turno');
    }
  };

  const handleEventResize = async ({ event, start, end }: any) => {
    // No permitir redimensionar cumpleaños
    if (event.isBirthday) {
      toast.error('Los cumpleaños no pueden redimensionarse');
      return;
    }

    try {
      const duration = Math.max(15, differenceInMinutes(end, start));
      await updateAppointment(event.id, {
        endTime: format(end, 'HH:mm'),
        duration,
      });
      await refreshAppointments();
      toast.success('Duración ajustada');
    } catch (error) {
      console.error('Error ajustando turno:', error);
      toast.error('No se pudo ajustar la duración');
    }
  };

  const handleSelectSlot = (slot: SlotInfo) => {
    const start = slot.start;
    const end = slot.end;
    const startStr = format(start, 'HH:mm');
    const endStr = format(end, 'HH:mm');
    // Redirigir al formulario con parámetros prellenados
    const dateStr = format(start, 'yyyy-MM-dd');
    router.push(`/dashboard?create=appointment&date=${dateStr}&start=${startStr}&end=${endStr}`);
  };

  const selectedProfessionalName = selectedEvent
    ? professionals.find(p => p.uid === selectedEvent.userId)?.displayName || ''
    : '';

  const handleAttendance = async (evt: any) => {
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
          description: `Registrar honorarios de $${evt.fee.toLocaleString()} para este turno cancelado hoy?`,
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                Agenda Semanal
              </h1>
              <p className="text-sm text-elegant-600 dark:text-elegant-400 mt-1">
                Visualiza y gestiona tus turnos de la semana
              </p>
            </div>
            <button
              onClick={() => setShowBlockModal(true)}
              className="btn-danger flex items-center gap-2 whitespace-nowrap"
            >
              <Ban className="w-4 h-4" />
              Anular Franja Horaria
            </button>
          </div>
        </div>

        {/* Navegación de semana */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <button onClick={goToPreviousWeek} className="icon-btn">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-elegant-900 dark:text-white">
                {format(weekStart, 'd MMM', { locale: es })} - {format(weekEnd, 'd MMM yyyy', { locale: es })}
              </h2>
              <button onClick={goToToday} className="text-sm text-primary hover:underline">
                Ir a hoy
              </button>
            </div>
            <button onClick={goToNextWeek} className="icon-btn">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Estadísticas de la semana */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-primary/10 dark:bg-primary/25 border border-primary/20 dark:border-primary/30">
              <div className="text-2xl font-bold text-primary dark:text-primary-light">{weekStats.total}</div>
              <div className="text-xs text-elegant-600 dark:text-elegant-300">Total Turnos</div>
            </div>
            <div className="p-3 rounded-xl bg-green-500/10 dark:bg-green-500/25 border border-green-500/20 dark:border-green-500/30">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{weekStats.confirmed}</div>
              <div className="text-xs text-elegant-600 dark:text-elegant-300">Confirmados</div>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 dark:bg-amber-500/25 border border-amber-500/20 dark:border-amber-500/30">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{weekStats.pending}</div>
              <div className="text-xs text-elegant-600 dark:text-elegant-300">Pendientes</div>
            </div>
            <div className="p-3 rounded-xl bg-red-500/10 dark:bg-red-500/25 border border-red-500/20 dark:border-red-500/30">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{weekStats.blocked}</div>
              <div className="text-xs text-elegant-600 dark:text-elegant-300">Bloqueados</div>
            </div>
          </div>
        </div>


        {/* Agenda interactiva con drag & drop */}
        <div className="card overflow-hidden">
          <DnDCalendar
            className="agenda-calendar"
            localizer={localizer}
            events={calendarEvents}
            defaultView={Views.WEEK}
            views={[Views.WEEK, Views.DAY]}
            step={stepMinutes}
            timeslots={Math.max(1, Math.floor(60 / stepMinutes))}
            defaultDate={currentDate}
            onNavigate={setCurrentDate}
            resizable
            popup
            culture="es"
            style={{ height: 820 }}
            onEventDrop={handleEventDrop}
            onEventResize={handleEventResize}
            min={new Date(1970, 1, 1, minHour, 0, 0)}
            max={new Date(1970, 1, 1, maxHour, 0, 0)}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={(evt) => setSelectedEvent(evt)}
            messages={{
              today: 'Hoy',
              previous: 'Anterior',
              next: 'Siguiente',
              week: 'Semana',
              day: 'Día',
              month: 'Mes',
              noEventsInRange: 'Sin turnos en este rango',
              showMore: total => `+${total} más`,
            }}
            eventPropGetter={eventPropGetter}
            slotPropGetter={slotPropGetter}
          />
        </div>

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
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-elegant-800/50 border border-elegant-200 dark:border-elegant-700">
            <span className="inline-block w-5 h-5 rounded bg-amber-100 dark:bg-amber-500/30 border border-amber-300 dark:border-amber-400" />
            No show
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-elegant-800/50 border border-elegant-200 dark:border-elegant-700">
            <span className="inline-block w-5 h-5 rounded bg-purple-100 dark:bg-purple-500/30 border border-purple-300 dark:border-purple-400" />
            Evento personal
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-elegant-800/50 border border-elegant-200 dark:border-elegant-700">
            <span className="inline-block w-5 h-5 rounded bg-red-50 dark:bg-red-500/20 border border-red-300 dark:border-red-400" style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(239,68,68,0.15), rgba(239,68,68,0.15) 8px, rgba(239,68,68,0.3) 8px, rgba(239,68,68,0.3) 16px)' }} />
            Bloqueo
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-elegant-800/50 border border-elegant-200 dark:border-elegant-700">
            <span className="inline-block w-5 h-5 rounded bg-pink-100 dark:bg-pink-500/30 border border-pink-300 dark:border-pink-400" />
            Cumpleaños
          </div>
        </div>
        {/* Lista de franjas bloqueadas */}
        {blockedSlots.length > 0 && (
          <div className="card">
            <h3 className="text-lg font-semibold text-elegant-900 dark:text-white mb-4">
              Franjas Horarias Bloqueadas
            </h3>
            <div className="space-y-2">
              {blockedSlots.map(slot => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-elegant-900 dark:text-red-100">
                      <Calendar className="w-4 h-4 text-red-600 dark:text-red-400" />
                      {format(parseISO(slot.date), "d 'de' MMMM yyyy", { locale: es })}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-elegant-600 dark:text-red-200 mt-1">
                      <Clock className="w-4 h-4 text-red-600 dark:text-red-400" />
                      {slot.startTime} - {slot.endTime}
                    </div>
                    <div className="text-sm text-elegant-600 dark:text-red-200 mt-1">
                      Motivo: {slot.reason}
                    </div>
                  </div>
                  <button
                    onClick={() => removeBlock(slot.id)}
                    className="icon-btn-danger"
                    title="Eliminar bloqueo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal para anular franja horaria */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-elegant-900 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-elegant-900 dark:text-white mb-4">
              Anular Franja Horaria
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
                Anular Franja
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedEvent && (
        <Modal open={!!selectedEvent} onClose={() => setSelectedEvent(null)} title={selectedEvent.isBirthday ? "Cumpleaños" : "Detalle de turno"} maxWidth="max-w-2xl">
          {selectedEvent.isBirthday ? (
            <div className="space-y-4 text-center">
              <div className="text-6xl">🎂</div>
              <div>
                <p className="text-2xl font-bold text-elegant-900 dark:text-white mb-2">
                  {selectedEvent.patientName}
                </p>
                <p className="text-lg text-elegant-600 dark:text-elegant-300">
                  {format(selectedEvent.start, "d 'de' MMMM", { locale: es })}
                </p>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="btn-primary mx-auto"
              >
                Cerrar
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Información principal */}
              <div className="bg-gradient-to-r from-primary/5 to-primary-dark/5 dark:from-primary/10 dark:to-primary-dark/10 rounded-xl p-4 border border-primary/20 dark:border-primary/30">
                <h3 className="text-2xl font-bold text-elegant-900 dark:text-white mb-2">
                  {selectedEvent.patientName || 'Sin nombre'}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-sm text-elegant-600 dark:text-elegant-300">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>{format(selectedEvent.start, 'dd/MM/yyyy HH:mm', { locale: es })} - {format(selectedEvent.end, 'HH:mm', { locale: es })}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    <span>{selectedProfessionalName || 'N/D'}</span>
                  </div>
                </div>
              </div>

              {/* Detalles adicionales */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-elegant-50 dark:bg-elegant-800/50 rounded-lg p-3">
                  <p className="text-xs font-medium text-elegant-500 dark:text-elegant-400 mb-1">Estado</p>
                  <p className="text-lg font-semibold text-elegant-900 dark:text-white">{translateAppointmentStatus(selectedEvent.status)}</p>
                </div>
                <div className="bg-elegant-50 dark:bg-elegant-800/50 rounded-lg p-3">
                  <p className="text-xs font-medium text-elegant-500 dark:text-elegant-400 mb-1">Honorarios</p>
                  <p className="text-lg font-semibold text-primary dark:text-primary-light">{selectedEvent.fee ? `$${selectedEvent.fee.toLocaleString()}` : '-'}</p>
                </div>
              </div>

              {selectedEvent.notes && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
                  <p className="text-xs font-medium text-amber-800 dark:text-amber-400 mb-1">Notas</p>
                  <p className="text-sm text-amber-900 dark:text-amber-200 whitespace-pre-line">{selectedEvent.notes}</p>
                </div>
              )}

              {/* Acciones principales */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-elegant-500 dark:text-elegant-400 uppercase tracking-wide">Acciones rápidas</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => openPaymentDialog(selectedEvent)}
                    className="btn-primary flex items-center justify-center gap-2 py-3"
                  >
                    <DollarSign className="w-5 h-5" />
                    <span>Registrar pago</span>
                  </button>
                  <button
                    onClick={() => handleAttendance(selectedEvent)}
                    className="btn-success flex items-center justify-center gap-2 py-3"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Asistencia</span>
                  </button>
                </div>
              </div>

              {/* Acciones secundarias */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-elegant-500 dark:text-elegant-400 uppercase tracking-wide">Otras acciones</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      toast.info('Arrastra y suelta el turno en la Agenda para reprogramar.');
                      setSelectedEvent(null);
                    }}
                    className="btn-secondary flex items-center gap-2 text-sm"
                  >
                    <Edit2 className="w-4 h-4" />
                    Reprogramar
                  </button>
                  <button
                    onClick={() => handleCancelAppointment(selectedEvent)}
                    className="btn-warning flex items-center gap-2 text-sm"
                  >
                    <BanIcon className="w-4 h-4" />
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleDelete(selectedEvent)}
                    className="btn-danger flex items-center gap-2 text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}

      <Modal
        open={paymentDialog.open}
        onClose={() => setPaymentDialog({ open: false, appointment: undefined, mode: 'total', amount: '' })}
        title="Registrar pago"
        maxWidth="max-w-md"
      >
        {paymentDialog.appointment && (
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm text-elegant-600 dark:text-elegant-300">
                {paymentDialog.appointment.patientName || paymentDialog.appointment.title || 'Evento'}
              </p>
              <p className="text-lg font-semibold text-primary-dark dark:text-white">
                Honorarios: ${paymentDialog.appointment.fee?.toLocaleString()}
              </p>
            </div>

            <div className="flex items-center gap-2 bg-elegant-100 dark:bg-elegant-800/60 p-2 rounded-full">
              <button
                type="button"
                className={`flex-1 py-2 rounded-full text-sm font-semibold transition ${paymentDialog.mode === 'total' ? 'bg-primary text-white shadow' : 'text-elegant-600 dark:text-elegant-200'}`}
                onClick={() => setPaymentDialog(p => ({ ...p, mode: 'total', amount: p.appointment?.fee?.toString() || '' }))}
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
                <label className="text-xs font-semibold text-elegant-600 dark:text-elegant-300">Monto a pagar</label>
                <input
                  type="number"
                  min={0}
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
        )}
      </Modal>
    </DashboardLayout>
  );
}
