'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { createPatient, updatePatient, getPatient } from '@/lib/patients';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Patient } from '@/types';

const patientSchema = z.object({
  firstName: z.string().min(1, 'Nombre requerido'),
  lastName: z.string().min(1, 'Apellido requerido'),
  dni: z.string().min(6, 'DNI inválido'),
  phone: z.string().min(6, 'Teléfono inválido'),
  email: z.string().email().optional().or(z.literal('')),
  notes: z.string().optional(),
});

export type PatientFormValues = z.infer<typeof patientSchema>;

interface Props {
  patientId?: string;
}

export default function PatientForm({ patientId }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialPatient, setInitialPatient] = useState<Patient | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
  });

  useEffect(() => {
    if (patientId) {
      (async () => {
        const p = await getPatient(patientId);
        if (p) {
          setInitialPatient(p);
          reset({
            firstName: p.firstName,
            lastName: p.lastName,
            dni: p.dni,
            phone: p.phone,
            email: p.email || '',
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
      if (patientId && initialPatient) {
        await updatePatient(patientId, values);
      } else {
        await createPatient({
          ...values,
          userId: user.uid,
          insuranceId: undefined,
          insuranceNumber: undefined,
          birthDate: undefined,
          address: undefined,
          notes: values.notes,
        });
      }
      router.push('/patients');
    } catch (e) {
      console.error(e);
      alert('Error al guardar paciente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-primary-dark mb-1">Nombre</label>
          <input className="input-field" {...register('firstName')} />
          {errors.firstName && <p className="text-red-600 text-xs mt-1">{errors.firstName.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-primary-dark mb-1">Apellido</label>
          <input className="input-field" {...register('lastName')} />
          {errors.lastName && <p className="text-red-600 text-xs mt-1">{errors.lastName.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-primary-dark mb-1">DNI</label>
            <input className="input-field" {...register('dni')} />
            {errors.dni && <p className="text-red-600 text-xs mt-1">{errors.dni.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-primary-dark mb-1">Teléfono</label>
          <input className="input-field" {...register('phone')} />
          {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone.message}</p>}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-primary-dark mb-1">Email</label>
        <input className="input-field" {...register('email')} />
        {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-primary-dark mb-1">Notas</label>
        <textarea rows={4} className="input-field" {...register('notes')} />
      </div>
      <button disabled={loading} className="btn-primary">
        {loading ? 'Guardando...' : (patientId ? 'Actualizar Paciente' : 'Crear Paciente')}
      </button>
    </form>
  );
}
