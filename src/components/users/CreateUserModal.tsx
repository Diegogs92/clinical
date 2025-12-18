'use client';

import { useMemo, useState } from 'react';
import { UserRole } from '@/types';
import { X, Plus, Mail, Shield, KeyRound, User } from 'lucide-react';

type CreateUserForm = {
  email: string;
  displayName: string;
  role: UserRole;
  password: string;
  defaultAppointmentDuration: number;
};

interface CreateUserModalProps {
  onClose: () => void;
  onCreate: (data: {
    email: string;
    displayName: string;
    role: UserRole;
    password?: string;
    defaultAppointmentDuration?: number;
  }) => Promise<{ generatedPassword?: string } | void>;
}

function generateClientPassword() {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%*?';
  const length = 12;
  let out = '';
  for (let i = 0; i < length; i++) out += charset[Math.floor(Math.random() * charset.length)];
  return out;
}

export default function CreateUserModal({ onClose, onCreate }: CreateUserModalProps) {
  const [formData, setFormData] = useState<CreateUserForm>({
    email: '',
    displayName: '',
    role: 'profesional',
    password: '',
    defaultAppointmentDuration: 30,
  });
  const [saving, setSaving] = useState(false);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
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
    setCreatedPassword(null);
    setErrorMessage(null);

    try {
      const res = await onCreate({
        email: formData.email.trim(),
        displayName: formData.displayName.trim(),
        role: formData.role,
        password: formData.password.trim() ? formData.password : undefined,
        defaultAppointmentDuration: formData.role === 'profesional' ? formData.defaultAppointmentDuration : undefined,
      });

      if (res && typeof res === 'object' && res.generatedPassword) {
        setCreatedPassword(res.generatedPassword);
      } else {
        onClose();
      }
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

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {createdPassword && (
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900">
              <div className="font-semibold">Contraseña generada</div>
              <div className="text-sm mt-1">Cópiala ahora, no se vuelve a mostrar:</div>
              <div className="mt-2 font-mono text-sm bg-white/70 rounded-lg px-3 py-2 border border-amber-200 select-all">
                {createdPassword}
              </div>
              <div className="mt-3 flex justify-end">
                <button type="button" className="btn-primary" onClick={onClose}>
                  Listo
                </button>
              </div>
            </div>
          )}

          {!createdPassword && (
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

              <div className="space-y-1">
                <label className="text-sm font-medium text-elegant-700 dark:text-elegant-300 flex items-center gap-2">
                  <KeyRound className="w-4 h-4" />
                  Contraseña (opcional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className="input-field w-full"
                    placeholder="Si se deja vacío, se genera una automáticamente"
                  />
                  <button
                    type="button"
                    className="btn-secondary whitespace-nowrap"
                    onClick={() => handleChange('password', generateClientPassword())}
                    disabled={saving}
                  >
                    Generar
                  </button>
                </div>
                <p className="text-xs text-elegant-500 dark:text-elegant-400">
                  Recomendado: mínimo 8 caracteres. Si queda vacía, el servidor generará una y se mostrará una sola vez.
                </p>
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

        {!createdPassword && (
          <div className="px-6 py-4 border-t border-elegant-200 dark:border-elegant-700 bg-elegant-50 dark:bg-elegant-800/50 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
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
