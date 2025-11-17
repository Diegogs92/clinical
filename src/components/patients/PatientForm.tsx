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

const patientSchema = z.object({
  firstName: z.string().min(1, 'Nombre requerido'),
  lastName: z.string().min(1, 'Apellido requerido'),
  dni: z.string().min(6, 'DNI inválido'),
  phone: z.string().min(6, 'Teléfono inválido'),
  email: z.string().email().optional().or(z.literal('')),
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

  const { register, handleSubmit, formState: { errors }, reset } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
  });

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
          reset({
            firstName: p.firstName,
            lastName: p.lastName,
            dni: p.dni,
            phone: p.phone,
            email: p.email || '',
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">Fecha de Nacimiento</label>
          <input type="date" className="input-field" {...register('birthDate')} />
        </div>
        <div>
          <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">Obra Social / Prepaga</label>
          <select className="input-field" {...register('insuranceId')}>
            <option value="">Particular</option>
            {insurances.map(ins => (
              <option key={ins.id} value={ins.id}>{ins.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">Nº de Afiliado</label>
        <input className="input-field" {...register('insuranceNumber')} placeholder="Solo si tiene obra social" />
      </div>
      <div>
        <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">Dirección</label>
        <input className="input-field" {...register('address')} />
      </div>
      <div>
        <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">Notas</label>
        <textarea rows={4} className="input-field" {...register('notes')} />
      </div>
      <button disabled={loading} className="btn-primary">
        {loading ? 'Guardando...' : (patientId ? 'Actualizar Paciente' : 'Crear Paciente')}
      </button>
    </form>
  );
}
