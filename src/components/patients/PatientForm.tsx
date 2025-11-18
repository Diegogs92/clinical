'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { createPatient, updatePatient, getPatient } from '@/lib/patients';
import { listInsurances } from '@/lib/insurances';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Patient, Insurance } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import PatientFileUpload from './PatientFileUpload';

const patientSchema = z.object({
  firstName: z.string().min(1, 'Nombre requerido'),
  lastName: z.string().min(1, 'Apellido requerido'),
  dni: z.string().min(6, 'DNI inválido'),
  phone: z.string().min(6, 'Teléfono inválido'),
  email: z.string().email().optional().or(z.literal('')),
  insuranceType: z.enum(['particular', 'obra-social', 'prepaga']).optional(),
  insuranceName: z.string().optional(),
  insuranceId: z.string().optional(),
  insuranceNumber: z.string().optional(),
  birthDate: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export type PatientFormValues = z.infer<typeof patientSchema>;

interface Props {
  patientId?: string;
}

export default function PatientForm({ patientId }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [initialPatient, setInitialPatient] = useState<Patient | null>(null);
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [selectedType, setSelectedType] = useState<'particular' | 'obra-social' | 'prepaga'>('particular');

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      insuranceType: 'particular',
    },
  });

  const insuranceType = watch('insuranceType');

  useEffect(() => {
    if (!user) return;
    (async () => {
      const ins = await listInsurances(user.uid);
      setInsurances(ins);
    })();
  }, [user]);

  useEffect(() => {
    if (patientId) {
      (async () => {
        const p = await getPatient(patientId);
        if (p) {
          setInitialPatient(p);
          setSelectedType(p.insuranceType || 'particular');
          reset({
            firstName: p.firstName,
            lastName: p.lastName,
            dni: p.dni,
            phone: p.phone,
            email: p.email || '',
            insuranceType: p.insuranceType || 'particular',
            insuranceName: p.insuranceName || '',
            insuranceId: p.insuranceId || '',
            insuranceNumber: p.insuranceNumber || '',
            birthDate: p.birthDate || '',
            address: p.address || '',
            notes: p.notes || '',
          });
        }
      })();
    }
  }, [patientId, reset]);

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

      // Solo agregar campos opcionales si tienen valor
      if (values.email && values.email.trim()) {
        patientData.email = values.email;
      }
      if (values.insuranceType) {
        patientData.insuranceType = values.insuranceType;
      }
      if (values.insuranceName && values.insuranceName.trim()) {
        patientData.insuranceName = values.insuranceName;
      }
      if (values.insuranceId && values.insuranceId.trim()) {
        patientData.insuranceId = values.insuranceId;
      }
      if (values.insuranceNumber && values.insuranceNumber.trim()) {
        patientData.insuranceNumber = values.insuranceNumber;
      }
      if (values.birthDate && values.birthDate.trim()) {
        patientData.birthDate = values.birthDate;
      }
      if (values.address && values.address.trim()) {
        patientData.address = values.address;
      }
      if (values.notes && values.notes.trim()) {
        patientData.notes = values.notes;
      }

      if (patientId && initialPatient) {
        await updatePatient(patientId, patientData);
        toast.success('Paciente actualizado correctamente');
      } else {
        await createPatient(patientData);
        toast.success('Paciente creado correctamente');
      }
      router.push('/patients');
    } catch (e) {
      console.error('Error al guardar:', e);
      alert(`Error al guardar paciente: ${e instanceof Error ? e.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">Nombre</label>
          <input className="input-field" {...register('firstName')} />
          {errors.firstName && <p className="text-red-600 text-xs mt-1">{errors.firstName.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">Apellido</label>
          <input className="input-field" {...register('lastName')} />
          {errors.lastName && <p className="text-red-600 text-xs mt-1">{errors.lastName.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">DNI</label>
            <input className="input-field" {...register('dni')} />
            {errors.dni && <p className="text-red-600 text-xs mt-1">{errors.dni.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">Teléfono</label>
          <input className="input-field" {...register('phone')} />
          {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone.message}</p>}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">Email</label>
        <input className="input-field" {...register('email')} />
        {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">Fecha de Nacimiento</label>
        <input type="date" className="input-field" {...register('birthDate')} />
      </div>

      {/* Tipo de cobertura */}
      <div>
        <label className="block text-sm font-medium text-primary-dark dark:text-white mb-2">Tipo de Cobertura</label>
        <div className="grid grid-cols-3 gap-3">
          <label className={`flex items-center justify-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
            insuranceType === 'particular'
              ? 'border-primary bg-primary/10 dark:bg-primary/20'
              : 'border-secondary-lighter dark:border-gray-600 hover:border-primary/50'
          }`}>
            <input
              type="radio"
              value="particular"
              {...register('insuranceType')}
              className="sr-only"
            />
            <span className={`text-sm font-medium ${insuranceType === 'particular' ? 'text-primary dark:text-white' : 'text-secondary dark:text-gray-400'}`}>
              Particular
            </span>
          </label>

          <label className={`flex items-center justify-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
            insuranceType === 'obra-social'
              ? 'border-primary bg-primary/10 dark:bg-primary/20'
              : 'border-secondary-lighter dark:border-gray-600 hover:border-primary/50'
          }`}>
            <input
              type="radio"
              value="obra-social"
              {...register('insuranceType')}
              className="sr-only"
            />
            <span className={`text-sm font-medium ${insuranceType === 'obra-social' ? 'text-primary dark:text-white' : 'text-secondary dark:text-gray-400'}`}>
              Obra Social
            </span>
          </label>

          <label className={`flex items-center justify-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
            insuranceType === 'prepaga'
              ? 'border-primary bg-primary/10 dark:bg-primary/20'
              : 'border-secondary-lighter dark:border-gray-600 hover:border-primary/50'
          }`}>
            <input
              type="radio"
              value="prepaga"
              {...register('insuranceType')}
              className="sr-only"
            />
            <span className={`text-sm font-medium ${insuranceType === 'prepaga' ? 'text-primary dark:text-white' : 'text-secondary dark:text-gray-400'}`}>
              Prepaga
            </span>
          </label>
        </div>
      </div>

      {/* Mostrar campos adicionales si no es particular */}
      {insuranceType && insuranceType !== 'particular' && (
        <>
          <div>
            <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">
              Nombre de {insuranceType === 'obra-social' ? 'la Obra Social' : 'la Prepaga'}
            </label>
            <input
              className="input-field"
              {...register('insuranceName')}
              placeholder={insuranceType === 'obra-social' ? 'Ej: OSDE, Swiss Medical...' : 'Ej: Galeno, Omint...'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">Nº de Afiliado</label>
            <input
              className="input-field"
              {...register('insuranceNumber')}
              placeholder="Número de credencial"
            />
          </div>
        </>
      )}
      <div>
        <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">Dirección</label>
        <input className="input-field" {...register('address')} />
      </div>
      <div>
        <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">Notas</label>
        <textarea rows={4} className="input-field" {...register('notes')} />
      </div>

      {patientId && initialPatient && (
        <PatientFileUpload
          patientId={patientId}
          onUpload={(file) => {
            toast.success(`Archivo "${file.name}" subido correctamente`);
          }}
        />
      )}

      <button disabled={loading} className="btn-primary hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
        {loading ? 'Guardando...' : (patientId ? 'Actualizar Paciente' : 'Crear Paciente')}
      </button>
    </form>
  );
}
