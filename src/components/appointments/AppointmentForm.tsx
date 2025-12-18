"use client";

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { createAppointment, updateAppointment } from '@/lib/appointments';
import { getBlockedSlotsInRange } from '@/lib/blockedSlots';
import { useState, useEffect, ChangeEvent } from 'react';
import { Appointment, UserProfile } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import Modal from '@/components/ui/Modal';
import PatientForm from '@/components/patients/PatientForm';
import { UserPlus, AlertTriangle } from 'lucide-react';
import { usePatients } from '@/contexts/PatientsContext';
import { useAppointments } from '@/contexts/AppointmentsContext';
import { listProfessionals } from '@/lib/users';

const schema = z.object({
  patientId: z.string().min(1, 'Selecciona un paciente'),
  patientName: z.string().optional(),
  professionalId: z.string().min(1, 'Selecciona un profesional'),
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
  const { refreshAppointments } = useAppointments();
  const [showQuickPatient, setShowQuickPatient] = useState(false);
  const [professionals, setProfessionals] = useState<UserProfile[]>([]);
  const [loadingProfessionals, setLoadingProfessionals] = useState(false);
  const toast = useToast();
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<AppointmentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      duration: initialData?.duration || 45,
      type: initialData?.type || 'Consulta',
      fee: initialData?.fee || undefined,
      patientId: initialData?.patientId || '',
      professionalId: initialData?.userId || user?.uid || '',
      date: initialData?.date ? initialData.date.split('T')[0] : '',
      startTime: initialData?.startTime || '',
      notes: initialData?.notes || '',
    },
  });

  const onSubmit = async (values: AppointmentFormValues) => {
    if (!user) {
      console.error('[AppointmentForm] No hay usuario autenticado');
      toast.error('Debes iniciar sesión para crear turnos');
      return;
    }

    console.log('[AppointmentForm] Iniciando creación de turno:', {
      userId: user.uid,
      values,
    });

    setLoading(true);
    try {
      const [h, m] = values.startTime.split(':').map(Number);
      const [year, month, day] = values.date.split('-').map(Number);
      const startDate = new Date(year, month - 1, day, h, m, 0, 0);
      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + values.duration);

      // Calcular endTime
      const endHour = String(endDate.getHours()).padStart(2, '0');
      const endMinute = String(endDate.getMinutes()).padStart(2, '0');
      const endTime = `${endHour}:${endMinute}`;

      // Validar si hay franjas bloqueadas
      console.log('Validando franjas bloqueadas:', {
        userId: values.professionalId,
        date: values.date,
        startTime: values.startTime,
        endTime: endTime,
      });

      const blockedSlots = await getBlockedSlotsInRange(
        values.professionalId,
        values.date,
        values.startTime,
        endTime
      );

      console.log('Resultado de validacion:', {
        blockedSlotsCount: blockedSlots.length,
        blockedSlots: blockedSlots,
      });

      if (blockedSlots.length > 0) {
        const blockDetails = blockedSlots.map(slot =>
          `${slot.startTime} - ${slot.endTime}: ${slot.reason}`
        ).join('\n');

        console.log('Bloqueando creacion de turno:', blockDetails);

        toast.error(
          `No se puede agendar el turno porque se solapa con franjas bloqueadas:\n\n${blockDetails}`,
          { duration: 8000 }
        );
        setLoading(false);
        return;
      }

      console.log('No hay franjas bloqueadas, procediendo a crear turno');

      const selected = patients.find(p => p.id === (values.patientId as unknown as string));
      const selectedProfessional = professionals.find(p => p.uid === values.professionalId);

      const payload = {
        patientId: values.patientId as unknown as string,
        patientName: selected ? `${selected.lastName} ${selected.firstName}` : (values.patientName || ''),
        officeId: undefined,
        date: startDate.toISOString(),
        startTime: values.startTime,
        endTime: `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`,
        duration: values.duration,
        status: initialData?.status || 'scheduled',
        type: values.type,
        fee: values.fee,
        notes: values.notes,
        userId: values.professionalId,
        professionalName: selectedProfessional?.displayName || '',
        appointmentType: 'patient', // Siempre es tipo paciente en este formulario
        createdAt: initialData?.createdAt || '',
        updatedAt: '',
      } as any;

      console.log('[AppointmentForm] Payload a enviar:', payload);

      if (initialData) {
        console.log('[AppointmentForm] Actualizando turno existente:', initialData.id);
        await updateAppointment(initialData.id, payload);
        const updated = { ...payload, id: initialData.id };

        console.log('[AppointmentForm] Turno actualizado exitosamente');
        toast.success('Turno actualizado');
        await refreshAppointments();
        reset();
        onCreated?.(updated);
      } else {
        console.log('[AppointmentForm] Creando nuevo turno...');
        const id = await createAppointment(payload);
        const created = { ...payload, id };

        console.log('[AppointmentForm] Turno creado exitosamente con ID:', id);
        toast.success('Turno creado');
        await refreshAppointments();
        reset();
        onCreated?.(created);
      }
    } catch (e: any) {
      console.error('[AppointmentForm] Error completo:', e);
      console.error('[AppointmentForm] Error code:', e?.code);
      console.error('[AppointmentForm] Error message:', e?.message);

      // Mensajes de error más específicos
      if (e?.code === 'permission-denied') {
        toast.error('No tienes permisos para crear este turno. Verifica las reglas de Firestore.');
      } else if (e?.message?.includes('index')) {
        toast.error('Se necesita crear un índice en Firestore. Revisa la consola del navegador.');
      } else {
        toast.error(initialData ? `Error al actualizar turno: ${e?.message || 'Error desconocido'}` : `Error al crear turno: ${e?.message || 'Error desconocido'}`);
      }
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

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingProfessionals(true);
        const list = await listProfessionals();
        setProfessionals(list);
      } catch (error) {
        console.error('[AppointmentForm] Error loading professionals:', error);
        toast.error('No se pudieron cargar los profesionales');
      } finally {
        setLoadingProfessionals(false);
      }
    };
    load();
  }, [toast]);

  // Si no hay profesional seleccionado, usar el usuario actual como predeterminado
  const selectedProfessionalId = watch('professionalId');
  useEffect(() => {
    if (!selectedProfessionalId && user?.uid) {
      setValue('professionalId', user.uid);
    }
  }, [selectedProfessionalId, user, setValue]);

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-semibold text-primary-dark dark:text-white">Paciente</label>
            <button
              type="button"
              onClick={() => setShowQuickPatient(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark dark:text-primary-light transition active:scale-95"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Nuevo
            </button>
          </div>
          <select
            className="input-field"
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

        <div>
          <label className="block text-sm font-semibold text-primary-dark dark:text-white mb-1.5">Profesional</label>
          <select className="input-field" {...register('professionalId')}>
            <option value="">Selecciona un profesional</option>
            {loadingProfessionals && <option value="">Cargando...</option>}
            {professionals.map(prof => (
              <option key={prof.uid} value={prof.uid}>{prof.displayName || prof.email}</option>
            ))}
          </select>
          {errors.professionalId && <p className="text-red-600 text-xs mt-1">{errors.professionalId.message as string}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1.5">Fecha</label>
            <input type="date" className="input-field" {...register('date')} />
            {errors.date && <p className="text-red-600 text-xs mt-1">{errors.date.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1.5">Hora</label>
            <input type="time" className="input-field" {...register('startTime')} />
            {errors.startTime && <p className="text-red-600 text-xs mt-1">{errors.startTime.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1.5">Duración</label>
            <select className="input-field" {...register('duration', { valueAsNumber: true })}>
              <option value="45">45 min</option>
              <option value="60">60 min</option>
              <option value="90">90 min</option>
              <option value="120">120 min</option>
              <option value="160">160 min</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1.5">Honorarios</label>
            <input type="number" className="input-field" placeholder="0" {...register('fee', { valueAsNumber: true })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1.5">Notas</label>
            <textarea className="input-field resize-none" placeholder="Indicaciones..." {...register('notes')} />
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-end gap-3 pt-2">
          <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
          <button disabled={loading} className="btn-primary disabled:opacity-50">
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
