'use client';

import { useMemo, useState } from 'react';
import { UserRole } from '@/types';
import { X, Plus, Mail, Shield, KeyRound, User } from 'lucide-react';

type CreateUserForm = {
  email: string;
  displayName: string;
  role: UserRole;
  defaultAppointmentDuration: number;
};

interface CreateUserModalProps {
  onClose: () => void;
  onCreate: (data: {
    email: string;
    displayName: string;
    role: UserRole;
    defaultAppointmentDuration?: number;
  }) => Promise<void>;
}


export default function CreateUserModal({ onClose, onCreate }: CreateUserModalProps) {
  const [formData, setFormData] = useState<CreateUserForm>({
    email: '',
    displayName: '',
    role: 'profesional',
    defaultAppointmentDuration: 30,
  });
  const [saving, setSaving] = useState(false);
  const [invitationSent, setInvitationSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const roleHelp = useMemo(() => {
    switch (formData.role) {
      case 'administrador':
        return 'Acceso completo a todas las funcionalidades del sistema.';
      case 'secretaria':
        return 'Puede ver todo y marcar asistencias/pagos (sin crear/editar turnos).';
      case 'profesional':
        return 'Solo ve y gestiona sus propios turnos y pacientes.';
    }
  }, [formData.role]);

  const handleChange = (field: keyof CreateUserForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setInvitationSent(false);
    setErrorMessage(null);

    try {
      await onCreate({
        email: formData.email.trim(),
        displayName: formData.displayName.trim(),
        role: formData.role,
        defaultAppointmentDuration: formData.role === 'profesional' ? formData.defaultAppointmentDuration : undefined,
      });

      setInvitationSent(true);
    } catch (error: any) {
      const msg = typeof error?.message === 'string' ? error.message : 'No se pudo crear el usuario';
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-elegant-900 rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-elegant-200 dark:border-elegant-700 bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center font-bold shadow-md">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-primary-dark dark:text-white">Agregar Usuario</h2>
                <p className="text-sm text-elegant-600 dark:text-elegant-400">Crear un nuevo usuario del sistema</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-elegant-100 dark:hover:bg-elegant-800 rounded-lg transition-colors"
              disabled={saving}
            >
              <X className="w-5 h-5 text-elegant-600 dark:text-elegant-400" />
            </button>
          </div>
        </div>

        <form id="create-user-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {invitationSent && (
            <div className="p-4 rounded-xl border border-green-200 bg-green-50 text-green-900 dark:bg-green-900/20 dark:text-green-100 dark:border-green-800">
              <div className="font-semibold flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Usuario creado exitosamente
              </div>
              <div className="text-sm mt-2">
                El usuario ha sido creado y debe iniciar sesión con Google usando el email <strong>{formData.email}</strong>
              </div>
              <div className="text-xs mt-2 text-green-700 dark:text-green-300">
                El usuario podrá acceder al sistema haciendo clic en "Continuar con Google" en la página de inicio de sesión.
              </div>
              <div className="mt-4 flex justify-end">
                <button type="button" className="btn-primary" onClick={onClose}>
                  Entendido
                </button>
              </div>
            </div>
          )}

          {!invitationSent && (
            <>
              {errorMessage && (
                <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-900">
                  <div className="font-semibold">No se pudo crear el usuario</div>
                  <div className="text-sm mt-1 whitespace-pre-line">{errorMessage}</div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-medium text-elegant-700 dark:text-elegant-300 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="input-field w-full"
                  placeholder="usuario@correo.com"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-elegant-700 dark:text-elegant-300 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Nombre
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => handleChange('displayName', e.target.value)}
                  className="input-field w-full"
                  placeholder="Ej: Juan Pérez"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-elegant-700 dark:text-elegant-300 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Rol
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(['administrador', 'secretaria', 'profesional'] as UserRole[]).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleChange('role', role)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all border ${
                        formData.role === role
                          ? 'bg-primary text-white border-primary shadow-md'
                          : 'bg-white dark:bg-elegant-800 text-elegant-800 dark:text-elegant-200 border-elegant-200 dark:border-elegant-700 hover:border-primary/50'
                      }`}
                    >
                      {role === 'administrador' ? 'Administrador' : role === 'secretaria' ? 'Secretaria' : 'Profesional'}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-elegant-500 dark:text-elegant-400">{roleHelp}</p>
              </div>

              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900 dark:text-blue-100">
                    <div className="font-semibold mb-1">Autenticación con Google</div>
                    <p>El usuario deberá iniciar sesión utilizando su cuenta de Google con el email ingresado arriba.</p>
                    <p className="mt-2">No se requiere contraseña ya que la autenticación es completamente gestionada por Google.</p>
                  </div>
                </div>
              </div>

              {formData.role === 'profesional' && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-elegant-700 dark:text-elegant-300">
                    Duración de turno por defecto (minutos)
                  </label>
                  <select
                    value={formData.defaultAppointmentDuration}
                    onChange={(e) => handleChange('defaultAppointmentDuration', parseInt(e.target.value, 10))}
                    className="input-field w-full"
                  >
                    <option value={15}>15 minutos</option>
                    <option value={30}>30 minutos</option>
                    <option value={45}>45 minutos</option>
                    <option value={60}>60 minutos</option>
                    <option value={90}>90 minutos</option>
                    <option value={120}>120 minutos</option>
                  </select>
                </div>
              )}
            </>
          )}
        </form>

        {!invitationSent && (
          <div className="px-6 py-4 border-t border-elegant-200 dark:border-elegant-700 bg-elegant-50 dark:bg-elegant-800/50 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={saving}>
              Cancelar
            </button>
            <button type="submit" form="create-user-form" className="btn-primary" disabled={saving}>
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creando...
                </>
              ) : (
                'Crear Usuario'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
