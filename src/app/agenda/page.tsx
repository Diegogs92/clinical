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
import { BlockedSlot } from '@/types';
import {
  getBlockedSlotsByUser,
  createBlockedSlot,
  deleteBlockedSlot,
} from '@/lib/blockedSlots';
import { updateAppointment } from '@/lib/appointments';
import { combineDateAndTime } from '@/lib/dateUtils';
import { Calendar as BigCalendar, Views, dateFnsLocalizer, SlotInfo } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

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
  const [minHour, setMinHour] = useState(7);
  const [maxHour, setMaxHour] = useState(21);
  const [stepMinutes, setStepMinutes] = useState<10 | 15 | 20 | 30>(15);
  const [showPreferences, setShowPreferences] = useState(false);

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
    return appointments.map(apt => {
      const start = combineDateAndTime(apt.date, apt.startTime);
      const end = apt.endTime ? combineDateAndTime(apt.date, apt.endTime) : new Date(start.getTime() + (apt.duration || 30) * 60000);
      const patient = getPatientInfo(apt.patientId);
      const title = apt.appointmentType === 'personal'
        ? apt.title || 'Evento personal'
        : patient
          ? `${patient.firstName} ${patient.lastName}`
          : apt.patientName || 'Turno';

      return {
        ...apt,
        title,
        start,
        end,
      };
    });
  }, [appointments, patients]);

  const eventPropGetter = (event: any) => {
    const status = event.status;
    const isDark = document.documentElement.classList.contains('dark');

    let bgLight = '#E0F2FE';
    let bgDark = 'rgba(14, 165, 233, 0.25)';
    let borderColor = 'rgba(14, 165, 233, 0.5)';
    let textColor = isDark ? '#F0F9FF' : '#0F172A';

    if (status === 'confirmed') {
      bgLight = '#DCFCE7';
      bgDark = 'rgba(34, 197, 94, 0.25)';
      borderColor = isDark ? 'rgba(34, 197, 94, 0.5)' : 'rgba(22, 163, 74, 0.4)';
    } else if (status === 'completed') {
      bgLight = '#DBEAFE';
      bgDark = 'rgba(59, 130, 246, 0.25)';
      borderColor = isDark ? 'rgba(59, 130, 246, 0.5)' : 'rgba(37, 99, 235, 0.4)';
    } else if (status === 'cancelled') {
      bgLight = '#FEE2E2';
      bgDark = 'rgba(239, 68, 68, 0.25)';
      borderColor = isDark ? 'rgba(239, 68, 68, 0.5)' : 'rgba(220, 38, 38, 0.4)';
    } else if (status === 'no-show') {
      bgLight = '#FDE68A';
      bgDark = 'rgba(234, 179, 8, 0.25)';
      borderColor = isDark ? 'rgba(234, 179, 8, 0.5)' : 'rgba(202, 138, 4, 0.4)';
    } else if (event.appointmentType === 'personal') {
      bgLight = '#F3E8FF';
      bgDark = 'rgba(168, 85, 247, 0.25)';
      borderColor = isDark ? 'rgba(168, 85, 247, 0.5)' : 'rgba(147, 51, 234, 0.4)';
    }

    if (event.isBlocked) {
      bgLight = 'repeating-linear-gradient(45deg, rgba(239,68,68,0.15), rgba(239,68,68,0.15) 8px, rgba(239,68,68,0.3) 8px, rgba(239,68,68,0.3) 16px)';
      bgDark = 'repeating-linear-gradient(45deg, rgba(239,68,68,0.25), rgba(239,68,68,0.25) 8px, rgba(239,68,68,0.4) 8px, rgba(239,68,68,0.4) 16px)';
      borderColor = isDark ? 'rgba(239, 68, 68, 0.6)' : 'rgba(220, 38, 38, 0.5)';
    }

    return {
      style: {
        backgroundColor: isDark ? bgDark : bgLight,
        color: textColor,
        borderRadius: 8,
        border: `1px solid ${borderColor}`,
        padding: '4px 8px',
        fontWeight: 600,
      },
    };
  };

  const handleEventDrop = async ({ event, start, end }: any) => {
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

          {/* Controles de vista compactos */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-elegant-50 dark:bg-elegant-800/50 border border-elegant-200 dark:border-elegant-700">
              <Clock className="w-4 h-4 text-elegant-500" />
              <select
                className="bg-transparent border-0 text-sm font-medium text-elegant-700 dark:text-elegant-200 outline-none cursor-pointer pr-1"
                value={minHour}
                onChange={(e) => setMinHour(Number(e.target.value))}
                title="Hora de inicio"
              >
                {[6,7,8,9,10].map(h => (
                  <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                ))}
              </select>
              <span className="text-elegant-400 dark:text-elegant-500">-</span>
              <select
                className="bg-transparent border-0 text-sm font-medium text-elegant-700 dark:text-elegant-200 outline-none cursor-pointer pr-1"
                value={maxHour}
                onChange={(e) => setMaxHour(Number(e.target.value))}
                title="Hora de fin"
              >
                {[18,19,20,21,22].map(h => (
                  <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-elegant-50 dark:bg-elegant-800/50 border border-elegant-200 dark:border-elegant-700">
              <Calendar className="w-4 h-4 text-elegant-500" />
              <select
                className="bg-transparent border-0 text-sm font-medium text-elegant-700 dark:text-elegant-200 outline-none cursor-pointer"
                value={stepMinutes}
                onChange={(e) => setStepMinutes(Number(e.target.value) as 10 | 15 | 20 | 30)}
                title="Intervalo de tiempo"
              >
                {[10,15,20,30].map(m => (
                  <option key={m} value={m}>{m} min</option>
                ))}
              </select>
            </div>
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
            <div className="p-3 rounded-xl bg-primary/10 dark:bg-primary/20">
              <div className="text-2xl font-bold text-primary">{weekStats.total}</div>
              <div className="text-xs text-elegant-600 dark:text-elegant-400">Total Turnos</div>
            </div>
            <div className="p-3 rounded-xl bg-green-500/10 dark:bg-green-500/20">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{weekStats.confirmed}</div>
              <div className="text-xs text-elegant-600 dark:text-elegant-400">Confirmados</div>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 dark:bg-amber-500/20">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{weekStats.pending}</div>
              <div className="text-xs text-elegant-600 dark:text-elegant-400">Pendientes</div>
            </div>
            <div className="p-3 rounded-xl bg-red-500/10 dark:bg-red-500/20">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{weekStats.blocked}</div>
              <div className="text-xs text-elegant-600 dark:text-elegant-400">Bloqueados</div>
            </div>
          </div>
        </div>


        {/* Agenda interactiva con drag & drop */}
        <div className="card overflow-hidden">
          <DnDCalendar
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
            messages={{
              today: 'Hoy',
              previous: 'Anterior',
              next: 'Siguiente',
              week: 'Semana',
              day: 'D?a',
              month: 'Mes',
              noEventsInRange: 'Sin turnos en este rango',
              showMore: total => `+${total} m?s`,
            }}
            eventPropGetter={eventPropGetter}
          />
        </div>

        {/* Leyenda de estados */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-elegant-700 dark:text-elegant-200">
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 rounded bg-sky-100 border border-sky-200" />
            Agendado
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 rounded bg-emerald-100 border border-emerald-200" />
            Confirmado
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 rounded bg-blue-100 border border-blue-200" />
            Completado
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 rounded bg-red-100 border border-red-200" />
            Cancelado
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 rounded bg-amber-100 border border-amber-200" />
            No show
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 rounded bg-purple-100 border border-purple-200" />
            Evento personal
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 rounded bg-red-50 border border-red-200" style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(239,68,68,0.15), rgba(239,68,68,0.15) 8px, rgba(239,68,68,0.3) 8px, rgba(239,68,68,0.3) 16px)' }} />
            Bloqueo
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
                  className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-elegant-900 dark:text-white">
                      <Calendar className="w-4 h-4" />
                      {format(parseISO(slot.date), "d 'de' MMMM yyyy", { locale: es })}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-elegant-600 dark:text-elegant-400 mt-1">
                      <Clock className="w-4 h-4" />
                      {slot.startTime} - {slot.endTime}
                    </div>
                    <div className="text-sm text-elegant-600 dark:text-elegant-400 mt-1">
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
    </DashboardLayout>
  );
}
