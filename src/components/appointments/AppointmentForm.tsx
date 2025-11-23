"use client";

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { createAppointment, updateAppointment } from '@/lib/appointments';
import { useState, ChangeEvent } from 'react';
import { Appointment } from '@/types';
import { useCalendarSync } from '@/contexts/CalendarSyncContext';
import { useToast } from '@/contexts/ToastContext';
import Modal from '@/components/ui/Modal';
import PatientForm from '@/components/patients/PatientForm';
import { UserPlus } from 'lucide-react';
import { usePatients } from '@/contexts/PatientsContext';
import { useAppointments } from '@/contexts/AppointmentsContext';

const schema = z.object({
  patientId: z.string().min(1, 'Selecciona un paciente'),
  patientName: z.string().optional(),
  date: z.string().min(1, 'Fecha requerida'), // ISO date yyyy-MM-dd
  startTime: z.string().min(1, 'Hora inicio requerida'), // HH:mm
  duration: z.coerce.number().min(5).max(600).default(30),
  type: z.string().default('Consulta'),
  fee: z.coerce.number().optional(),
  notes: z.string().optional(),
});

export type AppointmentFormValues = z.infer<typeof schema>;

interface Props {
  initialData?: Appointment;
  onCreated?: (appt?: any) => void;
  onCancel?: () => void;
}

export default function AppointmentForm({ initialData, onCreated, onCancel }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const { patients, refreshPatients } = usePatients();
  const { refreshAppointments } = useAppointments();
  const [showQuickPatient, setShowQuickPatient] = useState(false);
  const { syncAppointment, syncEnabled, isConnected } = useCalendarSync();
  const toast = useToast();
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<AppointmentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      duration: initialData?.duration || 30,
      type: initialData?.type || 'Consulta',
      fee: initialData?.fee || undefined,
      patientId: initialData?.patientId || '',
      date: initialData?.date ? initialData.date.split('T')[0] : '',
      startTime: initialData?.startTime || '',
      notes: initialData?.notes || '',
    },
  });

  const onSubmit = async (values: AppointmentFormValues) => {
    if (!user) return;
    setLoading(true);
    try {
      const [h, m] = values.startTime.split(':').map(Number);
      const [year, month, day] = values.date.split('-').map(Number);
      const startDate = new Date(year, month - 1, day, h, m, 0, 0);
      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + values.duration);

      const selected = patients.find(p => p.id === (values.patientId as unknown as string));

      const payload = {
        patientId: values.patientId as unknown as string,
        patientName: selected ? `${selected.lastName} ${selected.firstName}` : (values.patientName || ''),
        date: startDate.toISOString(),
        startTime: values.startTime,
        endTime: `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`,
        duration: values.duration,
        status: initialData?.status || 'scheduled',
        type: values.type,
        fee: values.fee,
        notes: values.notes,
        userId: user.uid,
        createdAt: initialData?.createdAt || '',
        updatedAt: '',
      } as any;

      if (initialData) {
        await updateAppointment(initialData.id, payload);
        const updated = { ...payload, id: initialData.id };

        if (syncEnabled && initialData.googleCalendarEventId) {
          await syncAppointment(updated, 'update', initialData.googleCalendarEventId);
        }

        await refreshAppointments();
        reset();
        onCreated?.(updated);
      } else {
        const id = await createAppointment(payload);
        const created = { ...payload, id };

        if (syncEnabled) {
          const eventId = await syncAppointment(created, 'create');
          if (eventId) {
            await updateAppointment(id, { googleCalendarEventId: eventId });
            toast.success('Turno sincronizado con Google Calendar');
          }
        }

        await refreshAppointments();
        reset();
        onCreated?.(created);
      }
    } catch (e) {
      console.error(e);
      alert(initialData ? 'Error al actualizar turno' : 'Error al crear turno');
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === '__new') {
      setShowQuickPatient(true);
      setValue('patientId', '');
    } else {
      setValue('patientId', value);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-primary-dark dark:text-white">Paciente</label>
            <button
              type="button"
              onClick={() => setShowQuickPatient(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-white transition"
            >
              <UserPlus className="w-4 h-4" />
              Nuevo paciente
            </button>
          </div>
          <select
            className="input-field text-sm py-2"
            value={watch('patientId')}
            onChange={handlePatientSelect}
          >
            <option value="">Selecciona un paciente</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.lastName} {p.firstName} · DNI {p.dni}</option>
            ))}
            <option value="__new">+ Crear nuevo paciente</option>
          </select>
          {errors.patientId && <p className="text-red-600 text-xs mt-1">{errors.patientId.message as string}</p>}
        </div>

        {syncEnabled && isConnected && (
          <div className="text-[11px] text-green-600 dark:text-green-400 flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
            Sincronización con Google Calendar activada
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-elegant-600 dark:text-elegant-300 mb-1">Fecha</label>
            <input type="date" className="input-field text-sm py-2" {...register('date')} />
            {errors.date && <p className="text-red-600 text-[11px] mt-1">{errors.date.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-elegant-600 dark:text-elegant-300 mb-1">Hora</label>
            <input type="time" className="input-field text-sm py-2" {...register('startTime')} />
            {errors.startTime && <p className="text-red-600 text-[11px] mt-1">{errors.startTime.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-elegant-600 dark:text-elegant-300 mb-1">Duración (min)</label>
            <input type="number" className="input-field text-sm py-2" {...register('duration', { valueAsNumber: true })} />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-elegant-600 dark:text-elegant-300 mb-1">Honorarios</label>
            <input type="number" className="input-field text-sm py-2" placeholder="0" {...register('fee', { valueAsNumber: true })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-elegant-600 dark:text-elegant-300 mb-1">Notas</label>
            <textarea rows={2} className="input-field text-sm py-2 resize-none" placeholder="Indicaciones, observaciones..." {...register('notes')} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button type="button" onClick={onCancel} className="btn-secondary text-sm px-4 py-2">Cancelar</button>
          <button disabled={loading} className="btn-primary text-sm px-5 py-2 disabled:opacity-50">
            {loading ? 'Guardando...' : (initialData ? 'Actualizar' : 'Crear')}
          </button>
        </div>
      </form>

      <Modal
        open={showQuickPatient}
        onClose={() => setShowQuickPatient(false)}
        title="Crear nuevo paciente"
        maxWidth="max-w-3xl"
      >
        <PatientForm
          onSuccess={async () => {
            await refreshPatients();
            setShowQuickPatient(false);
            toast.success('Paciente creado correctamente. Selecciónalo de la lista.');
          }}
        />
      </Modal>
    </>
  );
}
