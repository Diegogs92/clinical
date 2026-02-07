'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { createPatient } from '@/lib/patients';
import { useState } from 'react';
import { usePatients } from '@/contexts/PatientsContext';


const patientSchema = z.object({
  firstName: z.string().min(1, 'Nombre requerido'),
  lastName: z.string().min(1, 'Apellido requerido'),
  dni: z.string().min(6, 'DNI inválido'),
  phone: z.string().min(6, 'Teléfono inválido'),
  insuranceType: z.enum(['particular', 'obra-social', 'prepaga']).optional(),
  insuranceName: z.string().optional(),
  insuranceNumber: z.string().optional(),
  birthDate: z.string().optional(),
});

type PatientFormValues = z.infer<typeof patientSchema>;

interface Props {
  onSuccess: (created: { id: string }) => void;
  onCancel: () => void;
}

export default function QuickPatientForm({ onSuccess, onCancel }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const { refreshPatients } = usePatients();

  const { register, handleSubmit, formState: { errors }, watch } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      insuranceType: 'particular',
    },
  });

  const insuranceType = watch('insuranceType');

  const onSubmit = async (values: PatientFormValues) => {
    if (!user) return;
    setLoading(true);
    try {
      const patientData: any = {
        firstName: values.firstName,
        lastName: values.lastName,
        dni: values.dni,
        phone: values.phone,
        userId: user.uid,
      };

      if (values.insuranceType) patientData.insuranceType = values.insuranceType;
      if (values.insuranceName && values.insuranceName.trim()) patientData.insuranceName = values.insuranceName;
      if (values.insuranceNumber && values.insuranceNumber.trim()) patientData.insuranceNumber = values.insuranceNumber;
      if (values.birthDate && values.birthDate.trim()) patientData.birthDate = values.birthDate;

      const newId = await createPatient(patientData);
      await refreshPatients();
      onSuccess({ id: newId });
    } catch (e) {
      console.error('Error al crear paciente:', e);
      alert(`Error al crear paciente: ${e instanceof Error ? e.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">Nombre *</label>
          <input className="input-field" {...register('firstName')} />
          {errors.firstName && <p className="text-red-600 text-xs mt-1">{errors.firstName.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">Apellido *</label>
          <input className="input-field" {...register('lastName')} />
          {errors.lastName && <p className="text-red-600 text-xs mt-1">{errors.lastName.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">DNI *</label>
          <input className="input-field" {...register('dni')} />
          {errors.dni && <p className="text-red-600 text-xs mt-1">{errors.dni.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">Teléfono *</label>
          <input className="input-field" {...register('phone')} />
          {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">Fecha de Nacimiento</label>
        <input type="date" className="input-field" {...register('birthDate')} />
      </div>

      <div>
        <label className="block text-sm font-medium text-primary-dark dark:text-white mb-2">Tipo de Cobertura</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className={`flex items-center justify-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
            insuranceType === 'particular'
              ? 'border-primary bg-primary/10 dark:bg-primary/20'
              : 'border-secondary-lighter dark:border-gray-600 hover:border-primary/50'
          }`}>
            <input type="radio" value="particular" {...register('insuranceType')} className="sr-only" />
            <span className={`text-sm font-medium ${insuranceType === 'particular' ? 'text-primary dark:text-white' : 'text-secondary dark:text-gray-400'}`}>
              Particular
            </span>
          </label>

          <label className={`flex items-center justify-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
            insuranceType === 'obra-social'
              ? 'border-primary bg-primary/10 dark:bg-primary/20'
              : 'border-secondary-lighter dark:border-gray-600 hover:border-primary/50'
          }`}>
            <input type="radio" value="obra-social" {...register('insuranceType')} className="sr-only" />
            <span className={`text-sm font-medium ${insuranceType === 'obra-social' ? 'text-primary dark:text-white' : 'text-secondary dark:text-gray-400'}`}>
              Obra Social
            </span>
          </label>

          <label className={`flex items-center justify-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
            insuranceType === 'prepaga'
              ? 'border-primary bg-primary/10 dark:bg-primary/20'
              : 'border-secondary-lighter dark:border-gray-600 hover:border-primary/50'
          }`}>
            <input type="radio" value="prepaga" {...register('insuranceType')} className="sr-only" />
            <span className={`text-sm font-medium ${insuranceType === 'prepaga' ? 'text-primary dark:text-white' : 'text-secondary dark:text-gray-400'}`}>
              Prepaga
            </span>
          </label>
        </div>
      </div>

      {insuranceType && insuranceType !== 'particular' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">
              Nombre de {insuranceType === 'obra-social' ? 'la Obra Social' : 'la Prepaga'}
            </label>
            <input className="input-field" {...register('insuranceName')} placeholder={insuranceType === 'obra-social' ? 'Ej: OSDE, Swiss Medical...' : 'Ej: Galeno, Omint...'} />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">Nº de Afiliado</label>
            <input className="input-field" {...register('insuranceNumber')} placeholder="Número de credencial" />
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-3 justify-end pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancelar
        </button>
        <button disabled={loading} type="submit" className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? 'Creando...' : 'Crear Paciente'}
        </button>
      </div>
    </form>
  );
}
