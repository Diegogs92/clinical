'use client';

import { useState, useEffect } from 'react';
import { UserProfile, UserRole } from '@/types';
import { X, Shield, User, Mail, Phone, MapPin, Briefcase, Clock } from 'lucide-react';

interface EditUserModalProps {
  user: UserProfile;
  onClose: () => void;
  onSave: (uid: string, data: Partial<UserProfile> & { email?: string }) => Promise<void>;
  allowEmailEdit?: boolean;
  allowColorEdit?: boolean;
}

export default function EditUserModal({ user, onClose, onSave, allowEmailEdit, allowColorEdit }: EditUserModalProps) {
  const [formData, setFormData] = useState({
    displayName: user.displayName || '',
    role: user.role,
    phone: user.phone || '',
    address: user.address || '',
    specialty: user.specialty || '',
    licenseNumber: user.licenseNumber || '',
    defaultAppointmentDuration: user.defaultAppointmentDuration || 30,
    email: user.email || '',
    color: user.color || '#0ea5e9',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await onSave(user.uid, formData);
    } catch (error) {
      console.error('Error saving user:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'administrador':
        return 'Administrador';
      case 'secretaria':
        return 'Secretaria';
      case 'profesional':
        return 'Profesional';
      default:
        return role;
    }
  };

  const getRoleDescription = (role: UserRole) => {
    switch (role) {
      case 'administrador':
        return 'Acceso completo a todas las funcionalidades del sistema';
      case 'secretaria':
        return 'Puede ver todos los turnos y marcar asistencias/pagos (sin crear/editar turnos)';
      case 'profesional':
        return 'Ve todos los pacientes y gestiona sus propios turnos';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-elegant-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-elegant-200 dark:border-elegant-700 bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center font-bold shadow-md">
                {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-primary-dark dark:text-white">
                  Editar Usuario
                </h2>
                <p className="text-sm text-elegant-600 dark:text-elegant-400">
                  {user.email}
                </p>
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary-dark dark:text-white flex items-center gap-2">
              <User className="w-5 h-5" />
              Información Básica
            </h3>

            <div className="space-y-1">
              <label className="text-sm font-medium text-elegant-700 dark:text-elegant-300">
                Nombre Completo
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

            <div className="space-y-1">
              <label className="text-sm font-medium text-elegant-700 dark:text-elegant-300 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={`input-field w-full ${allowEmailEdit ? '' : 'bg-elegant-50 dark:bg-elegant-800 cursor-not-allowed'}`}
                disabled={!allowEmailEdit}
              />
              {!allowEmailEdit && (
                <p className="text-xs text-elegant-500 dark:text-elegant-400">
                  Solo un Administrador puede modificar el email
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-elegant-700 dark:text-elegant-300 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="input-field w-full"
                  placeholder="Ej: +54 9 11 1234-5678"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-elegant-700 dark:text-elegant-300 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Dirección
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="input-field w-full"
                  placeholder="Ej: Av. Corrientes 1234"
                />
              </div>
            </div>
          </div>

          {/* Rol y Permisos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary-dark dark:text-white flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Rol y Permisos
            </h3>

            <div className="space-y-3">
              {(['administrador', 'secretaria', 'profesional'] as UserRole[]).map((role) => (
                <label
                  key={role}
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.role === role
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-elegant-200 dark:border-elegant-700 hover:border-primary/50 hover:bg-elegant-50 dark:hover:bg-elegant-800/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={formData.role === role}
                    onChange={(e) => handleChange('role', e.target.value)}
                    className="mt-1 w-4 h-4 text-primary"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-elegant-900 dark:text-white">
                      {getRoleLabel(role)}
                    </div>
                    <p className="text-sm text-elegant-600 dark:text-elegant-400 mt-0.5">
                      {getRoleDescription(role)}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Información Profesional (solo para profesionales) */}
          {formData.role === 'profesional' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary-dark dark:text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Información Profesional
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-elegant-700 dark:text-elegant-300">
                    Especialidad
                  </label>
                  <input
                    type="text"
                    value={formData.specialty}
                    onChange={(e) => handleChange('specialty', e.target.value)}
                    className="input-field w-full"
                    placeholder="Ej: Ortodoncia"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-elegant-700 dark:text-elegant-300">
                    Matrícula
                  </label>
                  <input
                    type="text"
                    value={formData.licenseNumber}
                    onChange={(e) => handleChange('licenseNumber', e.target.value)}
                    className="input-field w-full"
                    placeholder="Ej: MP 12345"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-elegant-700 dark:text-elegant-300 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Duración de Turno por Defecto (minutos)
                </label>
                <select
                  value={formData.defaultAppointmentDuration}
                  onChange={(e) => handleChange('defaultAppointmentDuration', parseInt(e.target.value))}
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
            </div>
          )}

          {allowColorEdit && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-elegant-700 dark:text-elegant-300 flex items-center gap-2">
                Color en Agenda
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => handleChange('color', e.target.value)}
                  className="h-10 w-16 rounded-lg border border-elegant-200 dark:border-elegant-700 bg-transparent cursor-pointer"
                />
                <span className="text-sm text-elegant-600 dark:text-elegant-400">
                  Se usará para identificar al profesional en la agenda.
                </span>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-elegant-200 dark:border-elegant-700 bg-elegant-50 dark:bg-elegant-800/50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="btn-primary"
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Guardando...
              </>
            ) : (
              'Guardar Cambios'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
