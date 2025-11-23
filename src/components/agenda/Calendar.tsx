'use client';

import { Calendar, dateFnsLocalizer, Event as RBCEvent } from 'react-big-calendar';
import type { EventProps } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Appointment } from '@/types';
import { combineDateAndTime } from '@/lib/dateUtils';
import { DollarSign, Edit2, FileText, Trash2 } from 'lucide-react';

const locales = { 'es': es };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

interface Props {
  appointments: Appointment[];
  onPay?: (a: Appointment) => void;
  onDebt?: (a: Appointment) => void;
  onEdit?: (a: Appointment) => void;
  onDelete?: (a: Appointment) => void;
}

export default function CalendarView({ appointments, onPay, onDebt, onEdit, onDelete }: Props) {
  const events: RBCEvent[] = appointments.map(a => {
    // Combine date with start/end times properly
    const startDate = combineDateAndTime(a.date, a.startTime);
    const endDate = combineDateAndTime(a.date, a.endTime);

    return {
      title: `${a.patientName} (${a.status})`,
      start: startDate,
      end: endDate,
      resource: a,
    };
  });

  const EventCard = ({ event }: EventProps<RBCEvent>) => {
    const appt = event.resource as Appointment;
    return (
      <div className="relative group cursor-pointer">
        <div className="rounded-xl bg-gradient-to-r from-primary to-primary-light text-white px-3 py-2 shadow-md">
          <div className="flex items-center justify-between gap-2 text-sm font-semibold">
            <span className="truncate">{appt.patientName}</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/15 border border-white/20">
              {appt.status}
            </span>
          </div>
          <p className="text-[12px] text-white/80 mt-0.5">{appt.startTime} - {appt.endTime}</p>
        </div>

        <div className="pointer-events-none absolute -bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:pointer-events-auto z-10">
          <button
            type="button"
            className="action-bubble action-bubble-success"
            onClick={(e) => { e.stopPropagation(); onPay?.(appt); }}
            aria-label="Registrar pago"
            title="Registrar pago"
          >
            <DollarSign className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="action-bubble action-bubble-warning"
            onClick={(e) => { e.stopPropagation(); onDebt?.(appt); }}
            aria-label="Registrar deuda"
            title="Registrar deuda"
          >
            <FileText className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="action-bubble action-bubble-primary"
            onClick={(e) => { e.stopPropagation(); onEdit?.(appt); }}
            aria-label="Editar turno"
            title="Editar turno"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="action-bubble action-bubble-danger"
            onClick={(e) => { e.stopPropagation(); onDelete?.(appt); }}
            aria-label="Eliminar turno"
            title="Eliminar turno"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl bg-white/70 dark:bg-elegant-900/60 backdrop-blur border border-elegant-200/60 dark:border-elegant-800/60 shadow-sm">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 520, padding: '12px' }}
        className="agenda-calendar"
        views={['month', 'week', 'day']}
        messages={{
          month: 'Mes', week: 'Semana', day: 'Día', today: 'Hoy', previous: 'Atrás', next: 'Siguiente',
          agenda: 'Agenda', date: 'Fecha', time: 'Hora', event: 'Turno', noEventsInRange: 'Sin turnos'
        }}
        components={{
          event: EventCard,
        }}
      />
    </div>
  );
}
