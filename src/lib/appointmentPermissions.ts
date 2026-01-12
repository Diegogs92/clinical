import { Appointment, UserProfile } from '@/types';

/**
 * Verifica si un usuario puede editar o eliminar un turno
 * @param appointment - El turno a verificar
 * @param currentUser - El usuario actual (con uid)
 * @param userProfile - El perfil del usuario (con role)
 * @returns true si el usuario puede editar/eliminar el turno
 */
export function canModifyAppointment(
  appointment: Appointment,
  currentUser: { uid: string } | null,
  userProfile: UserProfile | null
): boolean {
  if (!currentUser) {
    return false;
  }

  // El creador del turno puede editar/eliminar su propio turno
  if (appointment.userId === currentUser.uid) {
    return true;
  }

  // Los administradores pueden editar/eliminar cualquier turno
  if (userProfile?.role === 'administrador') {
    return true;
  }

  // En cualquier otro caso, no tiene permiso
  return false;
}

/**
 * Obtiene un mensaje de error cuando no se tienen permisos
 * @returns Mensaje de error descriptivo
 */
export function getPermissionDeniedMessage(): string {
  return 'No tienes permisos para modificar este turno. Solo el creador o un administrador pueden editarlo o eliminarlo.';
}
