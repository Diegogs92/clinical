'use client';

import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAppointments } from '@/contexts/AppointmentsContext';
import { usePatientsContext } from '@/contexts/PatientsContext';
import { format, startOfWeek, endOfWeek, addDays, isSameDay, parseISO, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, User, Phone, Ban, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Appointment } from '@/types';

interface BlockedSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
}

export default function AgendaPage() {
  const { appointments, loading } = useAppointments();
  const { patients } = usePatientsContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [blockForm, setBlockForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '10:00',
    reason: '',
  });

  // Calcular semana actual
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Lunes
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 }); // Domingo
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Horarios de trabajo (9 AM - 6 PM)
  const workingHours = Array.from({ length: 10 }, (_, i) => i + 9); // 9-18

  // Obtener turnos para un día y hora específica
  const getAppointmentsForSlot = (date: Date, hour: number) => {
    return appointments.filter(apt => {
      if (!apt.date || !apt.time) return false;
      const aptDate = parseISO(apt.date);
      const aptHour = parseInt(apt.time.split(':')[0]);
      return isSameDay(aptDate, date) && aptHour === hour;
    });
  };

  // Verificar si un slot está bloqueado
  const isSlotBlocked = (date: Date, hour: number) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return blockedSlots.some(slot => {
      if (slot.date !== dateStr) return false;
      const slotStart = parseInt(slot.startTime.split(':')[0]);
      const slotEnd = parseInt(slot.endTime.split(':')[0]);
      return hour >= slotStart && hour < slotEnd;
    });
  };

  // Obtener información del paciente
  const getPatientInfo = (patientId: string) => {
    return patients.find(p => p.id === patientId);
  };

  // Navegación de semanas
  const goToPreviousWeek = () => setCurrentDate(addDays(currentDate, -7));
  const goToNextWeek = () => setCurrentDate(addDays(currentDate, 7));
  const goToToday = () => setCurrentDate(new Date());

  // Manejar bloqueo de franja horaria
  const handleBlockSlot = () => {
    if (!blockForm.reason.trim()) {
      alert('Por favor ingresa un motivo para el bloqueo');
      return;
    }

    const newBlock: BlockedSlot = {
      id: Date.now().toString(),
      ...blockForm,
    };

    setBlockedSlots([...blockedSlots, newBlock]);
    setShowBlockModal(false);
    setBlockForm({
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: '09:00',
      endTime: '10:00',
      reason: '',
    });
  };

  // Eliminar bloqueo
  const removeBlock = (id: string) => {
    setBlockedSlots(blockedSlots.filter(b => b.id !== id));
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
      pending: weekAppointments.filter(a => a.status === 'pending').length,
      blocked: blockedSlots.filter(slot => {
        const slotDate = parseISO(slot.date);
        return isWithinInterval(slotDate, { start: weekStart, end: weekEnd });
      }).length,
    };
  }, [appointments, blockedSlots, weekStart, weekEnd]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
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
            className="btn-danger flex items-center gap-2"
          >
            <Ban className="w-4 h-4" />
            Anular Franja Horaria
          </button>
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

        {/* Grilla de agenda semanal */}
        <div className="card overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Encabezados de días */}
            <div className="grid grid-cols-8 gap-2 mb-4">
              <div className="text-xs font-semibold text-elegant-600 dark:text-elegant-400 p-2">
                Hora
              </div>
              {weekDays.map(day => (
                <div
                  key={day.toString()}
                  className={`text-center p-2 rounded-lg ${
                    isSameDay(day, new Date())
                      ? 'bg-primary/10 dark:bg-primary/20 border-2 border-primary'
                      : 'bg-elegant-100 dark:bg-elegant-800'
                  }`}
                >
                  <div className="text-xs font-semibold text-elegant-900 dark:text-white">
                    {format(day, 'EEE', { locale: es })}
                  </div>
                  <div className="text-lg font-bold text-elegant-900 dark:text-white">
                    {format(day, 'd')}
                  </div>
                </div>
              ))}
            </div>

            {/* Grilla de horarios */}
            <div className="space-y-2">
              {workingHours.map(hour => (
                <div key={hour} className="grid grid-cols-8 gap-2">
                  <div className="flex items-center justify-center text-sm font-medium text-elegant-600 dark:text-elegant-400">
                    {String(hour).padStart(2, '0')}:00
                  </div>
                  {weekDays.map(day => {
                    const slotAppointments = getAppointmentsForSlot(day, hour);
                    const isBlocked = isSlotBlocked(day, hour);

                    return (
                      <div
                        key={`${day}-${hour}`}
                        className={`min-h-[80px] p-2 rounded-lg border-2 transition-all ${
                          isBlocked
                            ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                            : slotAppointments.length > 0
                            ? 'bg-primary/5 dark:bg-primary/10 border-primary/30'
                            : 'bg-white dark:bg-elegant-900 border-elegant-200 dark:border-elegant-700 hover:border-primary/50'
                        }`}
                      >
                        {isBlocked ? (
                          <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                            <Ban className="w-3 h-3" />
                            <span>Bloqueado</span>
                          </div>
                        ) : (
                          slotAppointments.map(apt => {
                            const patient = getPatientInfo(apt.patientId);
                            return (
                              <div
                                key={apt.id}
                                className="mb-1 p-2 rounded bg-primary/10 dark:bg-primary/20 border border-primary/30"
                              >
                                <div className="flex items-center gap-1 text-xs font-semibold text-elegant-900 dark:text-white mb-1">
                                  <User className="w-3 h-3" />
                                  {patient?.name || 'Paciente'}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-elegant-600 dark:text-elegant-400">
                                  <Clock className="w-3 h-3" />
                                  {apt.time}
                                </div>
                                {patient?.phone && (
                                  <div className="flex items-center gap-1 text-xs text-elegant-600 dark:text-elegant-400">
                                    <Phone className="w-3 h-3" />
                                    {patient.phone}
                                  </div>
                                )}
                                <div className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                  apt.status === 'confirmed'
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                    : apt.status === 'pending'
                                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                }`}>
                                  {apt.status === 'confirmed' ? 'Confirmado' : apt.status === 'pending' ? 'Pendiente' : 'Cancelado'}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
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
