'use client';

import { Calendar, dateFnsLocalizer, Event as RBCEvent } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Appointment } from '@/types';

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
  onSelect?: (a: Appointment) => void;
}

export default function CalendarView({ appointments, onSelect }: Props) {
  const events: RBCEvent[] = appointments.map(a => ({
    title: `${a.patientName} (${a.status})`,
    start: new Date(a.startTime || a.date),
    end: new Date(a.endTime || a.date),
    resource: a,
  }));

  return (
    <div className="card">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        onSelectEvent={e => onSelect && onSelect(e.resource as Appointment)}
        views={['month', 'week', 'day']}
        messages={{
          month: 'Mes', week: 'Semana', day: 'Día', today: 'Hoy', previous: 'Atrás', next: 'Siguiente',
          agenda: 'Agenda', date: 'Fecha', time: 'Hora', event: 'Turno', noEventsInRange: 'Sin turnos'
        }}
      />
    </div>
  );
}
