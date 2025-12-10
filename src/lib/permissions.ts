import { UserRole } from '@/types';

/**
 * Sistema de permisos basado en roles para DENTIFY
 *
 * Roles:
 * - administrador: Romina - puede gestionar todo el consultorio
 * - profesional: Colegas - solo pueden gestionar sus propios turnos
 * - secretaria: Puede ver todo, marcar asistencias y pagos
 */

export const PERMISSIONS = {
  // Permisos de turnos
  appointments: {
    viewAll: ['administrador', 'secretaria'] as UserRole[],
    viewOwn: ['profesional'] as UserRole[],
    createOwn: ['administrador', 'profesional'] as UserRole[],
    createForOthers: ['administrador'] as UserRole[],
    editOwn: ['administrador', 'profesional'] as UserRole[],
    editForOthers: ['administrador'] as UserRole[],
    deleteOwn: ['administrador', 'profesional'] as UserRole[],
    deleteForOthers: ['administrador'] as UserRole[],
  },

  // Permisos de eventos personales
  personalEvents: {
    create: ['administrador'] as UserRole[],
    view: ['administrador'] as UserRole[],
    edit: ['administrador'] as UserRole[],
    delete: ['administrador'] as UserRole[],
  },

  // Permisos de asistencias y pagos
  attendance: {
    mark: ['administrador', 'secretaria', 'profesional'] as UserRole[],
  },

  payments: {
    register: ['administrador', 'secretaria', 'profesional'] as UserRole[],
    viewAll: ['administrador', 'secretaria'] as UserRole[],
    viewOwn: ['profesional'] as UserRole[],
  },

  // Permisos de pacientes
  patients: {
    viewAll: ['administrador', 'secretaria'] as UserRole[],
    viewOwn: ['profesional'] as UserRole[],
    create: ['administrador', 'profesional'] as UserRole[],
    edit: ['administrador', 'profesional'] as UserRole[],
    delete: ['administrador'] as UserRole[],
  },

  // Permisos de configuración
  settings: {
    manageUsers: ['administrador'] as UserRole[],
    manageOffices: ['administrador'] as UserRole[],
    viewCalendarSync: ['administrador', 'secretaria', 'profesional'] as UserRole[],
    configureCalendarSync: ['administrador'] as UserRole[],
  },
} as const;

/**
 * Verifica si un rol tiene un permiso específico
 */
export function hasPermission(userRole: UserRole, permission: UserRole[]): boolean {
  return permission.includes(userRole);
}

/**
 * Verifica si el usuario puede ver todos los turnos
 */
export function canViewAllAppointments(userRole: UserRole): boolean {
  return hasPermission(userRole, PERMISSIONS.appointments.viewAll);
}

/**
 * Verifica si el usuario puede crear turnos para otros profesionales
 */
export function canCreateAppointmentsForOthers(userRole: UserRole): boolean {
  return hasPermission(userRole, PERMISSIONS.appointments.createForOthers);
}

/**
 * Verifica si el usuario puede editar turnos de otros profesionales
 */
export function canEditAppointmentsForOthers(userRole: UserRole): boolean {
  return hasPermission(userRole, PERMISSIONS.appointments.editForOthers);
}

/**
 * Verifica si el usuario puede eliminar turnos de otros profesionales
 */
export function canDeleteAppointmentsForOthers(userRole: UserRole): boolean {
  return hasPermission(userRole, PERMISSIONS.appointments.deleteForOthers);
}

/**
 * Verifica si el usuario puede crear eventos personales
 */
export function canCreatePersonalEvents(userRole: UserRole): boolean {
  return hasPermission(userRole, PERMISSIONS.personalEvents.create);
}

/**
 * Verifica si el usuario puede marcar asistencias
 */
export function canMarkAttendance(userRole: UserRole): boolean {
  return hasPermission(userRole, PERMISSIONS.attendance.mark);
}

/**
 * Verifica si el usuario puede registrar pagos
 */
export function canRegisterPayments(userRole: UserRole): boolean {
  return hasPermission(userRole, PERMISSIONS.payments.register);
}

/**
 * Verifica si el usuario puede ver todos los pagos
 */
export function canViewAllPayments(userRole: UserRole): boolean {
  return hasPermission(userRole, PERMISSIONS.payments.viewAll);
}

/**
 * Verifica si el usuario puede ver todos los pacientes
 */
export function canViewAllPatients(userRole: UserRole): boolean {
  return hasPermission(userRole, PERMISSIONS.patients.viewAll);
}

/**
 * Verifica si el usuario puede gestionar otros usuarios
 */
export function canManageUsers(userRole: UserRole): boolean {
  return hasPermission(userRole, PERMISSIONS.settings.manageUsers);
}

/**
 * Verifica si el usuario es administrador
 */
export function isAdministrator(userRole: UserRole): boolean {
  return userRole === 'administrador';
}

/**
 * Verifica si el usuario es profesional
 */
export function isProfessional(userRole: UserRole): boolean {
  return userRole === 'profesional';
}

/**
 * Verifica si el usuario es secretaria
 */
export function isSecretary(userRole: UserRole): boolean {
  return userRole === 'secretaria';
}
