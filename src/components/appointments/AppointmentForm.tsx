"use client";

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { createAppointment, updateAppointment } from '@/lib/appointments';
import { useState } from 'react';
import { Appointment } from '@/types';
import { useCalendarSync } from '@/contexts/CalendarSyncContext';
import { useToast } from '@/contexts/ToastContext';
import Modal from '@/components/ui/Modal';
import QuickPatientForm from '@/components/patients/QuickPatientForm';
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
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<AppointmentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      duration: initialData?.duration || 30,
      type: initialData?.type || 'Consulta',
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
      const start = values.startTime;
      const [h, m] = start.split(':').map(Number);
      const startDate = new Date(values.date);
      startDate.setHours(h, m, 0, 0);
      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + values.duration);

      const selected = patients.find(p => p.id === (values.patientId as unknown as string));

      const payload = {
        patientId: values.patientId as unknown as string,
        patientName: selected ? `${selected.lastName} ${selected.firstName}` : (values.patientName || ''),
        date: startDate.toISOString(),
        startTime: values.startTime,
        endTime: `${String(endDate.getHours()).padStart(2,'0')}:${String(endDate.getMinutes()).padStart(2,'0')}`,
        duration: values.duration,
        status: initialData?.status || 'scheduled',
        type: values.type,
        notes: values.notes,
        userId: user.uid,
        createdAt: initialData?.createdAt || '',
        updatedAt: '',
      } as any;

      if (initialData) {
        // Update existing appointment
        await updateAppointment(initialData.id, payload);
        const updated = { ...payload, id: initialData.id };

        // Sync with Google Calendar
        if (syncEnabled && initialData.googleCalendarEventId) {
          await syncAppointment(updated, 'update', initialData.googleCalendarEventId);
        }

        await refreshAppointments();
        reset();
        onCreated?.(updated);
      } else {
        // Create new appointment
        console.log('[AppointmentForm] Creating appointment:', payload);
        const id = await createAppointment(payload);
        console.log('[AppointmentForm] Appointment created with ID:', id);
        const created = { ...payload, id };

        // Sync with Google Calendar
        if (syncEnabled) {
          console.log('[AppointmentForm] Syncing with Google Calendar...');
          const eventId = await syncAppointment(created, 'create');
          if (eventId) {
            await updateAppointment(id, { googleCalendarEventId: eventId });
            toast.success('Turno sincronizado con Google Calendar');
          }
        }

        console.log('[AppointmentForm] Calling refreshAppointments...');
        const updatedList = await refreshAppointments();
        console.log('[AppointmentForm] Appointments after refresh:', updatedList.length);
        console.log('[AppointmentForm] Calling onCreated with:', created);
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

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5">
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <label className="block text-xs font-medium text-primary-dark dark:text-white">Paciente</label>
            <button
              type="button"
              onClick={() => setShowQuickPatient(true)}
              className="flex items-center gap-1 text-[10px] text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-white transition-colors"
            >
              <UserPlus className="w-3 h-3" />
              Nuevo Paciente
            </button>
          </div>
          <select className="input-field text-sm py-1.5" {...register('patientId')}>
            <option value="">Selecciona un paciente</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.lastName} {p.firstName} — DNI {p.dni}</option>
            ))}
          </select>
          {errors.patientId && <p className="text-red-600 text-[10px] mt-0.5">{errors.patientId.message as string}</p>}
        </div>

        {syncEnabled && isConnected && (
          <div className="text-[10px] text-green-600 dark:text-green-400 flex items-center gap-1 py-1">
            <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full"></span>
            Sincronización con Google Calendar activada
          </div>
        )}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-xs font-medium text-primary-dark dark:text-white mb-0.5">Fecha</label>
          <input type="date" className="input-field text-sm py-1.5" {...register('date')} />
          {errors.date && <p className="text-red-600 text-[10px] mt-0.5">{errors.date.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-primary-dark dark:text-white mb-0.5">Hora</label>
          <input type="time" className="input-field text-sm py-1.5" {...register('startTime')} />
          {errors.startTime && <p className="text-red-600 text-[10px] mt-0.5">{errors.startTime.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-primary-dark dark:text-white mb-0.5">Mins</label>
          <input type="number" className="input-field text-sm py-1.5" {...register('duration', { valueAsNumber: true })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-primary-dark dark:text-white mb-0.5">Tipo</label>
          <input className="input-field text-sm py-1.5" placeholder="Consulta" {...register('type')} />
        </div>
        <div>
          <label className="block text-xs font-medium text-primary-dark dark:text-white mb-0.5">Notas</label>
          <textarea rows={2} className="input-field text-sm py-1.5 resize-none" {...register('notes')} />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 pt-1.5">
        <button type="button" onClick={onCancel} className="btn-secondary text-sm py-1.5 px-3 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all">Cancelar</button>
        <button disabled={loading} className="btn-primary text-sm py-1.5 px-4 hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
          {loading ? 'Guardando...' : (initialData ? 'Actualizar' : 'Crear')}
        </button>
      </div>
    </form>
    
    <Modal
      open={showQuickPatient}
      onClose={() => setShowQuickPatient(false)}
      title="Crear Nuevo Paciente"
    >
      <QuickPatientForm
        onSuccess={async (newPatient) => {
          await refreshPatients();
          setValue('patientId', newPatient.id);
          setShowQuickPatient(false);
          toast.success('Paciente creado y seleccionado correctamente');
        }}
        onCancel={() => setShowQuickPatient(false)}
      />
    </Modal>
    </>
  );
}
