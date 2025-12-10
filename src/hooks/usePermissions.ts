import { useAuth } from '@/contexts/AuthContext';
import {
  canViewAllAppointments,
  canCreateAppointmentsForOthers,
  canEditAppointmentsForOthers,
  canDeleteAppointmentsForOthers,
  canCreatePersonalEvents,
  canMarkAttendance,
  canRegisterPayments,
  canViewAllPayments,
  canViewAllPatients,
  canManageUsers,
  isAdministrator,
  isProfessional,
  isSecretary,
} from '@/lib/permissions';
import { UserRole } from '@/types';

/**
 * Hook para gestionar permisos del usuario actual
 */
export function usePermissions() {
  const { userProfile } = useAuth();
  const userRole: UserRole = userProfile?.role || 'profesional';

  return {
    userRole,

    // Información del rol
    isAdmin: isAdministrator(userRole),
    isProfessional: isProfessional(userRole),
    isSecretary: isSecretary(userRole),

    // Permisos de turnos
    canViewAllAppointments: canViewAllAppointments(userRole),
    canCreateAppointmentsForOthers: canCreateAppointmentsForOthers(userRole),
    canEditAppointmentsForOthers: canEditAppointmentsForOthers(userRole),
    canDeleteAppointmentsForOthers: canDeleteAppointmentsForOthers(userRole),

    // Permisos de eventos personales
    canCreatePersonalEvents: canCreatePersonalEvents(userRole),

    // Permisos de asistencias y pagos
    canMarkAttendance: canMarkAttendance(userRole),
    canRegisterPayments: canRegisterPayments(userRole),
    canViewAllPayments: canViewAllPayments(userRole),

    // Permisos de pacientes
    canViewAllPatients: canViewAllPatients(userRole),

    // Permisos de configuración
    canManageUsers: canManageUsers(userRole),
  };
}
