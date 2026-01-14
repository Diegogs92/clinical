/**
 * Traducciones de estados y textos comunes
 */

export const appointmentStatusTranslations = {
  scheduled: 'AGENDADO',
  confirmed: 'AGENDADO',
  completed: 'PRESENTE',
  cancelled: 'CANCELADO',
  'no-show': 'AUSENTE',
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

export const appointmentTypeTranslations: Record<string, string> = {
  'odontologia-general': 'Odontologia General',
  'ortodoncia': 'Ortodoncia',
  'endodoncia': 'Endodoncia',
  'armonizacion': 'Armonizacion',
};

export function translateAppointmentStatus(status: string): string {
  return appointmentStatusTranslations[status as keyof typeof appointmentStatusTranslations] || status;
}

export function translatePaymentStatus(status: string): string {
  return paymentStatusTranslations[status as keyof typeof paymentStatusTranslations] || status;
}

export function translateAuthorizationStatus(status: string): string {
  return authorizationStatusTranslations[status as keyof typeof authorizationStatusTranslations] || status;
}

export function translateAppointmentType(type?: string): string {
  if (!type) return '';
  return appointmentTypeTranslations[type] || type;
}
