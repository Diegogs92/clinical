"use client";

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { createAppointment, updateAppointment } from '@/lib/appointments';
import { useEffect, useState } from 'react';
import { getPatientsByUser } from '@/lib/patients';
import { Patient, Appointment } from '@/types';
import { useCalendarSync } from '@/contexts/CalendarSyncContext';
import { useToast } from '@/contexts/ToastContext';
import Modal from '@/components/ui/Modal';
import QuickPatientForm from '@/components/patients/QuickPatientForm';
import { UserPlus } from 'lucide-react';

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
  const [patients, setPatients] = useState<Patient[]>([]);
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

  useEffect(() => {
    if (!user) return;
    (async () => {
      const list = await getPatientsByUser(user.uid);
      setPatients(list);
    })();
  }, [user]);

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
        
        reset();
        onCreated?.(updated);
      } else {
        // Create new appointment
        const id = await createAppointment(payload);
        const created = { ...payload, id };
        
        // Sync with Google Calendar
        if (syncEnabled) {
          const eventId = await syncAppointment(created, 'create');
          if (eventId) {
            await updateAppointment(id, { googleCalendarEventId: eventId });
            toast.success('Turno sincronizado con Google Calendar');
          }
        }
        
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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-primary-dark dark:text-white">Paciente</label>
            <button
              type="button"
              onClick={() => setShowQuickPatient(true)}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-white transition-colors"
            >
              <UserPlus className="w-3 h-3" />
              Nuevo Paciente
            </button>
          </div>
          <select className="input-field" {...register('patientId')}>
            <option value="">Selecciona un paciente</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.lastName} {p.firstName} — DNI {p.dni}</option>
            ))}
          </select>
          {errors.patientId && <p className="text-red-600 text-xs mt-1">{errors.patientId.message as string}</p>}
        </div>
        
        {syncEnabled && isConnected && (
          <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
            Sincronización con Google Calendar activada
          </div>
        )}
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
        <button type="button" onClick={onCancel} className="btn-secondary hover:bg-gray-300 dark:hover:bg-gray-600 transition-all">Cancelar</button>
        <button disabled={loading} className="btn-primary hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
          {loading ? 'Guardando...' : (initialData ? 'Actualizar Turno' : 'Crear Turno')}
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
          const updatedList = await getPatientsByUser(user!.uid);
          setPatients(updatedList);
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
