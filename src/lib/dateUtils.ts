import { format, parseISO, addMinutes, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Combina una fecha ISO (YYYY-MM-DD) con una hora (HH:mm) para crear un Date
 * en la zona horaria local (Argentina/Buenos Aires)
 */
export function combineDateAndTime(dateStr: string, timeStr: string): Date {
  // dateStr format: "2025-01-17" or ISO string
  // timeStr format: "14:30"
  const dateOnly = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const [year, month, day] = dateOnly.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);

  // Crear Date en hora local (no UTC)
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

/**
 * Extrae la fecha en formato YYYY-MM-DD de un Date o string ISO
 */
export function extractDate(date: Date | string): string {
  if (typeof date === 'string') {
    return date.split('T')[0];
  }
  return format(date, 'yyyy-MM-dd');
}

/**
 * Extrae la hora en formato HH:mm de un Date o string ISO
 */
export function extractTime(date: Date | string): string {
  if (typeof date === 'string') {
    const parsed = parseISO(date);
    if (!isValid(parsed)) {
      // Si es solo una hora tipo "14:30", devolverla tal cual
      if (/^\d{2}:\d{2}$/.test(date)) {
        return date;
      }
      return '00:00';
    }
    return format(parsed, 'HH:mm');
  }
  return format(date, 'HH:mm');
}

/**
 * Calcula la hora final dado un inicio y una duración en minutos
 */
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  // startTime format: "14:30"
  const today = format(new Date(), 'yyyy-MM-dd');
  const startDate = combineDateAndTime(today, startTime);
  const endDate = addMinutes(startDate, durationMinutes);
  return extractTime(endDate);
}

/**
 * Formatea una fecha para mostrar en UI
 */
export function formatDateForDisplay(date: Date | string, formatStr: string = 'PPP'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return '';
  return format(dateObj, formatStr, { locale: es });
}

/**
 * Formatea una hora para mostrar en UI
 */
export function formatTimeForDisplay(time: string): string {
  return time; // Ya está en formato HH:mm
}

/**
 * Valida si una string es una hora válida en formato HH:mm
 */
export function isValidTime(time: string): boolean {
  return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
}

/**
 * Valida si una string es una fecha válida
 */
export function isValidDate(date: string): boolean {
  const parsed = parseISO(date);
  return isValid(parsed);
}
