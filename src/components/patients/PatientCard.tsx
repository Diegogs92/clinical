"use client";

import { User, Calendar, Phone, MapPin, FileText, Clock } from 'lucide-react';
import { Patient } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

interface PatientCardProps {
  patient: Patient;
  showLastVisit?: boolean;
  showActions?: boolean;
  onEdit?: (patient: Patient) => void;
  onDelete?: (patient: Patient) => void;
  className?: string;
  lastVisit?: string; // Optional last visit date
}

export default function PatientCard({
  patient,
  showLastVisit = true,
  showActions = false,
  onEdit,
  onDelete,
  className = '',
  lastVisit
}: PatientCardProps) {
  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return '?';
    const first = firstName?.[0]?.toUpperCase() || '';
    const last = lastName?.[0]?.toUpperCase() || '';
    return first + last || '?';
  };

  const getFullName = () => {
    return `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Sin nombre';
  };

  const getInsuranceBadgeColor = (insuranceType?: string) => {
    if (!insuranceType || insuranceType === 'particular') {
      return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    }
    return 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400';
  };

  const getInsuranceLabel = () => {
    if (patient.insuranceName) return patient.insuranceName;
    if (patient.insuranceType === 'particular') return 'Particular';
    if (patient.insuranceType === 'obra-social') return 'Obra Social';
    if (patient.insuranceType === 'prepaga') return 'Prepaga';
    return 'Particular';
  };

  return (
    <Link
      href={`/dashboard/patients/${patient.id}`}
      className={`block bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:shadow-lg hover:border-sky-300 dark:hover:border-sky-700 transition-all duration-200 ${className}`}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-14 h-14 bg-gradient-to-br from-sky-400 to-sky-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
            {getInitials(patient.firstName, patient.lastName)}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Name and Insurance */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white truncate">
                {getFullName()}
              </h3>
              {patient.dni && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  DNI: {patient.dni}
                </p>
              )}
            </div>
            <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${getInsuranceBadgeColor(patient.insuranceType)}`}>
              {getInsuranceLabel()}
            </span>
          </div>

          {/* Contact Info */}
          <div className="space-y-1.5 mb-3">
            {patient.phone && (
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{patient.phone}</span>
              </div>
            )}
            {patient.email && (
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="truncate">{patient.email}</span>
              </div>
            )}
            {patient.address && (
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{patient.address}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-700">
            {showLastVisit && lastVisit ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  Última visita{' '}
                  {formatDistanceToNow(new Date(lastVisit), {
                    addSuffix: true,
                    locale: es
                  })}
                </span>
              </div>
            ) : showLastVisit ? (
              <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                <Calendar className="w-3.5 h-3.5" />
                <span>Sin visitas registradas</span>
              </div>
            ) : (
              <div />
            )}

            {patient.notes && (
              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <FileText className="w-3.5 h-3.5" />
                <span>Tiene notas</span>
              </div>
            )}
          </div>

          {/* Actions */}
          {showActions && (onEdit || onDelete) && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEdit(patient);
                  }}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg transition-colors"
                >
                  Editar
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete(patient);
                  }}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  Eliminar
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
