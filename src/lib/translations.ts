/**
 * Traducciones de estados y textos comunes
 */

export const appointmentStatusTranslations = {
  scheduled: 'Programado',
  confirmed: 'Confirmado',
  completed: 'Completado',
  cancelled: 'Cancelado',
  'no-show': 'Ausente',
} as const;

export const paymentStatusTranslations = {
  pending: 'Pendiente',
  paid: 'Pagado',
  cancelled: 'Cancelado',
} as const;

export const authorizationStatusTranslations = {
  active: 'Activa',
  expired: 'Expirada',
  exhausted: 'Agotada',
} as const;

export function translateAppointmentStatus(status: string): string {
  return appointmentStatusTranslations[status as keyof typeof appointmentStatusTranslations] || status;
}

export function translatePaymentStatus(status: string): string {
  return paymentStatusTranslations[status as keyof typeof paymentStatusTranslations] || status;
}

export function translateAuthorizationStatus(status: string): string {
  return authorizationStatusTranslations[status as keyof typeof authorizationStatusTranslations] || status;
}
