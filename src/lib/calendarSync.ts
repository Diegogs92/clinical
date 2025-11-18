import { Appointment } from '@/types';
import { combineDateAndTime } from '@/lib/dateUtils';

function sanitizeIcsValue(value?: string) {
  if (!value) return '';
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function formatIcsDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function mapStatus(status: Appointment['status']) {
  switch (status) {
    case 'scheduled':
      return 'TENTATIVE';
    case 'confirmed':
    case 'completed':
      return 'CONFIRMED';
    case 'cancelled':
    case 'no-show':
      return 'CANCELLED';
    default:
      return 'TENTATIVE';
  }
}

export function buildCalendarIcs(appointments: Appointment[]) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'PRODID:-//Clinic Pro//Agenda//ES',
    'METHOD:PUBLISH',
  ];

  appointments.forEach((appointment) => {
    const start = combineDateAndTime(appointment.date, appointment.startTime);
    const end = combineDateAndTime(appointment.date, appointment.endTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;

    const summary = sanitizeIcsValue(`${appointment.patientName} • ${appointment.type || 'Turno'}`);
    const descriptionLines = [
      `Estado: ${appointment.status}`,
      appointment.notes ? `Notas: ${appointment.notes}` : undefined,
    ]
      .filter(Boolean)
      .map(sanitizeIcsValue);
    const description = descriptionLines.join('\\n');

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${appointment.id}`);
    lines.push(`DTSTAMP:${formatIcsDate(new Date())}`);
    lines.push(`DTSTART:${formatIcsDate(start)}`);
    lines.push(`DTEND:${formatIcsDate(end)}`);
    lines.push(`SUMMARY:${summary}`);
    if (description) {
      lines.push(`DESCRIPTION:${description}`);
    }
    lines.push(`LOCATION:${sanitizeIcsValue('Consultorio')}`);
    lines.push(`STATUS:${mapStatus(appointment.status)}`);
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadCalendarIcs(appointments: Appointment[]) {
  const calendarText = buildCalendarIcs(appointments);
  const blob = new Blob([calendarText], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'clinic-pro-turnos.ics';
  link.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}
