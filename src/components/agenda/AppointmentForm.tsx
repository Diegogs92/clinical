'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { createAppointment, getAppointment, updateAppointment } from '@/lib/appointments';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Appointment } from '@/types';

const schema = z.object({
  patientName: z.string().min(2),
  patientId: z.string().optional(),
  date: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  type: z.string().min(1),
  status: z.enum(['scheduled','confirmed','completed','cancelled','no-show']).default('scheduled'),
  notes: z.string().optional(),
  isRecurrent: z.boolean().optional(),
  frequency: z.enum(['daily','weekly','biweekly','monthly']).optional(),
  interval: z.coerce.number().optional(),
  count: z.coerce.number().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props { appointmentId?: string }

export default function AppointmentForm({ appointmentId }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initial, setInitial] = useState<Appointment | null>(null);
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (appointmentId) {
      (async () => {
        const ap = await getAppointment(appointmentId);
        if (ap) {
          setInitial(ap);
          reset({
            patientName: ap.patientName,
            patientId: ap.patientId,
            date: ap.date.substring(0,10),
            startTime: ap.startTime,
            endTime: ap.endTime,
            type: ap.type,
            status: ap.status,
            notes: ap.notes,
            isRecurrent: ap.isRecurrent,
            frequency: ap.recurrenceRule?.frequency,
            interval: ap.recurrenceRule?.interval,
            count: ap.recurrenceRule?.count,
          });
        }
      })();
    }
  }, [appointmentId, reset]);

  const onSubmit = async (v: FormValues) => {
    if (!user) return;
    setLoading(true);
    try {
      if (appointmentId && initial) {
        await updateAppointment(appointmentId, {
          patientName: v.patientName,
          startTime: v.startTime,
          endTime: v.endTime,
          status: v.status,
          notes: v.notes,
          type: v.type,
        });
      } else {
        await createAppointment({
          patientId: v.patientId || '',
          patientName: v.patientName,
          date: new Date(v.date).toISOString(),
          startTime: v.startTime,
          endTime: v.endTime,
          duration: 0,
          status: v.status,
          type: v.type,
          notes: v.notes,
          insuranceId: undefined,
          authorizationCode: undefined,
          isRecurrent: v.isRecurrent || false,
          recurrenceRule: v.isRecurrent ? {
            frequency: v.frequency!,
            interval: v.interval || 1,
            count: v.count,
          } : undefined,
          userId: user.uid,
        });
      }
      router.push('/agenda');
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const isRecurrent = watch('isRecurrent');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-primary-dark mb-1">Paciente (nombre)</label>
          <input className="input-field" {...register('patientName')} />
          {errors.patientName && <p className="text-red-600 text-xs">{errors.patientName.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-primary-dark mb-1">Fecha</label>
          <input type="date" className="input-field" {...register('date')} />
          {errors.date && <p className="text-red-600 text-xs">{errors.date.message}</p>}
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-primary-dark mb-1">Inicio</label>
          <input type="time" className="input-field" {...register('startTime')} />
          {errors.startTime && <p className="text-red-600 text-xs">{errors.startTime.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-primary-dark mb-1">Fin</label>
          <input type="time" className="input-field" {...register('endTime')} />
          {errors.endTime && <p className="text-red-600 text-xs">{errors.endTime.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-primary-dark mb-1">Tipo</label>
          <input className="input-field" {...register('type')} />
          {errors.type && <p className="text-red-600 text-xs">{errors.type.message}</p>}
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-primary-dark mb-1">Estado</label>
          <select className="input-field" {...register('status')}>
            <option value="scheduled">Programado</option>
            <option value="confirmed">Confirmado</option>
            <option value="completed">Completado</option>
            <option value="cancelled">Cancelado</option>
            <option value="no-show">Ausente</option>
          </select>
        </div>
        <div className="flex items-center gap-2 pt-6">
          <input type="checkbox" {...register('isRecurrent')} id="rec" />
          <label htmlFor="rec" className="text-sm text-primary-dark">Recurrente</label>
        </div>
      </div>
      {isRecurrent && (
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary-dark mb-1">Frecuencia</label>
            <select className="input-field" {...register('frequency')}>
              <option value="weekly">Semanal</option>
              <option value="biweekly">Quincenal</option>
              <option value="monthly">Mensual</option>
              <option value="daily">Diaria</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-dark mb-1">Intervalo</label>
            <input type="number" className="input-field" {...register('interval')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-dark mb-1">Cantidad</label>
            <input type="number" className="input-field" {...register('count')} />
          </div>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-primary-dark mb-1">Notas</label>
        <textarea rows={4} className="input-field" {...register('notes')} />
      </div>
      <button disabled={loading} className="btn-primary hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">{loading ? 'Guardando...' : (appointmentId ? 'Actualizar' : 'Crear Turno')}</button>
    </form>
  );
}
