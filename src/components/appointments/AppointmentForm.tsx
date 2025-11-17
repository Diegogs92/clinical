"use client";

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { createAppointment } from '@/lib/appointments';
import { useState } from 'react';

const schema = z.object({
  patientName: z.string().min(1, 'Paciente requerido'),
  date: z.string().min(1, 'Fecha requerida'), // ISO date yyyy-MM-dd
  startTime: z.string().min(1, 'Hora inicio requerida'), // HH:mm
  duration: z.coerce.number().min(5).max(600).default(30),
  type: z.string().default('Consulta'),
  notes: z.string().optional(),
});

export type AppointmentFormValues = z.infer<typeof schema>;

export default function AppointmentForm({ onCreated, onCancel }: { onCreated?: () => void; onCancel?: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<AppointmentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { duration: 30, type: 'Consulta' },
  });

  const onSubmit = async (values: AppointmentFormValues) => {
    if (!user) return;
    setLoading(true);
    try {
      const start = values.startTime;
      const [h, m] = start.split(':').map(Number);
      const startDate = new Date(values.date);
      startDate.setHours(h, m, 0, 0);
      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + values.duration);

      await createAppointment({
        patientId: '', // opcional por ahora
        patientName: values.patientName,
        date: startDate.toISOString(),
        startTime: values.startTime,
        endTime: `${String(endDate.getHours()).padStart(2,'0')}:${String(endDate.getMinutes()).padStart(2,'0')}`,
        duration: values.duration,
        status: 'scheduled',
        type: values.type,
        notes: values.notes,
        userId: user.uid,
        createdAt: '',
        updatedAt: '',
      } as any);

      reset();
      onCreated?.();
    } catch (e) {
      console.error(e);
      alert('Error al crear turno');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">Paciente</label>
        <input className="input-field" placeholder="Nombre y apellido" {...register('patientName')} />
        {errors.patientName && <p className="text-red-600 text-xs mt-1">{errors.patientName.message}</p>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">Fecha</label>
          <input type="date" className="input-field" {...register('date')} />
          {errors.date && <p className="text-red-600 text-xs mt-1">{errors.date.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">Hora inicio</label>
          <input type="time" className="input-field" {...register('startTime')} />
          {errors.startTime && <p className="text-red-600 text-xs mt-1">{errors.startTime.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">Duración (min)</label>
          <input type="number" className="input-field" {...register('duration', { valueAsNumber: true })} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">Tipo</label>
        <input className="input-field" placeholder="Consulta" {...register('type')} />
      </div>
      <div>
        <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">Notas</label>
        <textarea rows={3} className="input-field" {...register('notes')} />
      </div>
      <div className="flex items-center justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
        <button disabled={loading} className="btn-primary">{loading ? 'Guardando...' : 'Crear Turno'}</button>
      </div>
    </form>
  );
}
