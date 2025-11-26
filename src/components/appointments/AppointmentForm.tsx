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
import { useOffices } from '@/contexts/OfficesContext';

const schema = z.object({
  patientId: z.string().min(1, 'Selecciona un paciente'),
  patientName: z.string().optional(),
  officeId: z.string().optional(),
  date: z.string().min(1, 'Fecha requerida'), // ISO date yyyy-MM-dd
  startTime: z.string().min(1, 'Hora inicio requerida'), // HH:mm
  duration: z.coerce.number().refine(val => [45, 60, 90, 120, 160].includes(val), {
    message: 'Selecciona una duración válida'
  }).default(45),
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
  const { offices } = useOffices();
  const { refreshAppointments } = useAppointments();
  const [showQuickPatient, setShowQuickPatient] = useState(false);
  const { syncAppointment } = useCalendarSync();
  const toast = useToast();
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<AppointmentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      duration: initialData?.duration || 45,
      type: initialData?.type || 'Consulta',
      fee: initialData?.fee || undefined,
      patientId: initialData?.patientId || '',
      officeId: initialData?.officeId || '',
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
        officeId: values.officeId,
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

      // Obtener el colorId del consultorio si existe
      const office = values.officeId ? offices.find(o => o.id === values.officeId) : null;
      const officeColorId = office?.colorId;

      if (initialData) {
        await updateAppointment(initialData.id, payload);
        const updated = { ...payload, id: initialData.id };

        if (initialData.googleCalendarEventId) {
          await syncAppointment(updated, 'update', initialData.googleCalendarEventId, officeColorId);
        }

        await refreshAppointments();
        reset();
        onCreated?.(updated);
      } else {
        const id = await createAppointment(payload);
        const created = { ...payload, id };

        const eventId = await syncAppointment(created, 'create', undefined, officeColorId);
        if (eventId) {
          await updateAppointment(id, { googleCalendarEventId: eventId });
          toast.success('Turno creado y sincronizado con Google Calendar');
        } else {
          toast.success('Turno creado (sin sincronizar con Google Calendar)');
          console.warn('No se pudo sincronizar con Google Calendar. Verifica tu sesión.');
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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm md:text-base font-semibold text-primary-dark dark:text-white">Paciente</label>
            <button
              type="button"
              onClick={() => setShowQuickPatient(true)}
              className="inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-white transition touch-manipulation py-1.5 px-2 -mr-2"
            >
              <UserPlus className="w-4 h-4 md:w-3.5 md:h-3.5" />
              <span className="hidden sm:inline">Nuevo paciente</span>
              <span className="sm:hidden">Nuevo</span>
            </button>
          </div>
          <select
            className="input-field text-base md:text-sm"
            value={watch('patientId')}
            onChange={handlePatientSelect}
          >
            <option value="">Selecciona un paciente</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.lastName} {p.firstName} · DNI {p.dni}</option>
            ))}
            <option value="__new">+ Crear nuevo paciente</option>
          </select>
          {errors.patientId && <p className="text-red-600 text-xs md:text-[11px] mt-1">{errors.patientId.message as string}</p>}
        </div>

        <div>
          <label className="block text-sm md:text-base font-semibold text-primary-dark dark:text-white mb-1.5 md:mb-1">Consultorio</label>
          <select className="input-field text-base md:text-sm" {...register('officeId')}>
            <option value="">Sin consultorio</option>
            {offices.map(office => (
              <option key={office.id} value={office.id}>{office.name} - {office.address}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-semibold text-elegant-600 dark:text-elegant-300 mb-1.5">Fecha</label>
            <input type="date" className="input-field text-base md:text-sm" {...register('date')} />
            {errors.date && <p className="text-red-600 text-xs md:text-[11px] mt-1">{errors.date.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-elegant-600 dark:text-elegant-300 mb-1.5">Hora</label>
            <input type="time" className="input-field text-base md:text-sm" {...register('startTime')} />
            {errors.startTime && <p className="text-red-600 text-xs md:text-[11px] mt-1">{errors.startTime.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-elegant-600 dark:text-elegant-300 mb-1.5">Duración</label>
            <select className="input-field text-base md:text-sm" {...register('duration', { valueAsNumber: true })}>
              <option value="45">45 min</option>
              <option value="60">60 min</option>
              <option value="90">90 min</option>
              <option value="120">120 min</option>
              <option value="160">160 min</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-elegant-600 dark:text-elegant-300 mb-1.5">Honorarios</label>
            <input type="number" className="input-field text-base md:text-sm" placeholder="0" {...register('fee', { valueAsNumber: true })} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-elegant-600 dark:text-elegant-300 mb-1.5">Notas</label>
            <textarea rows={2} className="input-field text-base md:text-sm resize-none" placeholder="Indicaciones, observaciones..." {...register('notes')} />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-2 md:pt-1">
          <button type="button" onClick={onCancel} className="btn-secondary text-base md:text-sm px-4 py-3 md:py-2 touch-manipulation order-2 sm:order-1">Cancelar</button>
          <button disabled={loading} className="btn-primary text-base md:text-sm px-5 py-3 md:py-2 disabled:opacity-50 touch-manipulation order-1 sm:order-2">
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
