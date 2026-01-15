"use client";

import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { useCalendarSync } from '@/contexts/CalendarSyncContext';
import { createAppointment, updateAppointment, getOverlappingAppointments } from '@/lib/appointments';
import { getBlockedSlotsInRange } from '@/lib/blockedSlots';
import { createPayment } from '@/lib/payments';
import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { format } from 'date-fns';
import { Appointment, UserProfile } from '@/types';
import { useToast } from '@/hooks/useToast';
import Modal from '@/components/ui/Modal';
import SuccessModal from '@/components/ui/SuccessModal';
import PatientForm from '@/components/patients/PatientForm';
import PatientSelect from '@/components/forms/PatientSelect';
import ProfessionalSelect from '@/components/forms/ProfessionalSelect';
import DateTimePicker from '@/components/forms/DateTimePicker';
import CurrencyInput from '@/components/forms/CurrencyInput';
import SelectField, { SelectOption } from '@/components/forms/SelectField';
import { usePatients } from '@/contexts/PatientsContext';
import { useAppointments } from '@/contexts/AppointmentsContext';
import { listProfessionals } from '@/lib/users';

const schema = z.object({
  patientId: z.string().min(1, 'Selecciona un paciente'),
  patientName: z.string().optional(),
  professionalId: z.string().min(1, 'Selecciona un profesional'),
  date: z.string().min(1, 'Fecha requerida'), // ISO date yyyy-MM-dd
  startTime: z.string().min(1, 'Hora inicio requerida'), // HH:mm
  duration: z.coerce.number().min(15, 'La duración mínima es 15 minutos').default(30),
  type: z.enum(['odontologia-general', 'ortodoncia', 'endodoncia', 'armonizacion']).default('odontologia-general'),
  fee: z.coerce.number().optional(),
  deposit: z.coerce.number().optional(),
  notes: z.string().optional(),
});

export type AppointmentFormValues = z.infer<typeof schema>;

interface Props {
  initialData?: Appointment;
  onCreated?: (appt?: any) => void;
  onCancel?: () => void;
  onSuccess?: (title: string, message: string) => void;
}

const AppointmentForm = memo(function AppointmentForm({ initialData, onCreated, onCancel, onSuccess }: Props) {
  const { user } = useAuth();
  const { syncAppointment } = useCalendarSync();
  const [loading, setLoading] = useState(false);
  const { patients, refreshPatients } = usePatients();
  const { refreshAppointments } = useAppointments();
  const [showQuickPatient, setShowQuickPatient] = useState(false);
  const [professionals, setProfessionals] = useState<UserProfile[]>([]);
  const [loadingProfessionals, setLoadingProfessionals] = useState(false);
  const [noDeposit, setNoDeposit] = useState(false);
  const [successModal, setSuccessModal] = useState<{ show: boolean; title: string; message?: string }>({
    show: false,
    title: '',
    message: ''
  });
  const [validationModal, setValidationModal] = useState<{ open: boolean; title: string; message: string }>({
    open: false,
    title: '',
    message: ''
  });
  const toast = useToast();
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch, control } = useForm<AppointmentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      duration: initialData?.duration || 30,
      type: (initialData?.type && ['odontologia-general', 'ortodoncia', 'endodoncia', 'armonizacion'].includes(initialData.type)
        ? initialData.type
        : 'odontologia-general') as 'odontologia-general' | 'ortodoncia' | 'endodoncia' | 'armonizacion',
      fee: initialData?.fee || undefined,
      deposit: initialData?.deposit || undefined,
      patientId: initialData?.patientId || '',
      professionalId: initialData?.userId || user?.uid || '',
      date: initialData?.date ? initialData.date.split('T')[0] : '',
      startTime: initialData?.startTime || '',
      notes: initialData?.notes || '',
    },
  });
  const parseLocalDate = (value: string): Date | null => {
    if (!value) return null;
    if (value.includes('T')) {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    const parts = value.split('-').map(Number);
    if (parts.length !== 3) return null;
    const [year, month, day] = parts;
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  };

  useEffect(() => {
    if (!validationModal.open) return;
    const timer = setTimeout(() => {
      setValidationModal({ open: false, title: '', message: '' });
    }, 4000);
    return () => clearTimeout(timer);
  }, [validationModal.open]);


  const onSubmit = async (values: AppointmentFormValues) => {
    console.log('[AppointmentForm] onSubmit ejecutado con valores:', values);

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

        setValidationModal({
          open: true,
          title: 'No se puede agendar el turno',
          message: `Se solapa con franjas bloqueadas:\n\n${blockDetails}`
        });
        setLoading(false);
        return;
      }

      console.log('No hay franjas bloqueadas, validando solapamiento con otros turnos');

      // Validar si se solapa con otros turnos
      const overlappingAppointments = await getOverlappingAppointments(
        values.professionalId,
        values.date,
        values.startTime,
        endTime,
        initialData?.id // Excluir el turno actual si estamos editando
      );

      if (overlappingAppointments.length > 0) {
        const overlapDetails = overlappingAppointments.map(appt => {
          const patientInfo = appt.appointmentType === 'patient'
            ? `Paciente: ${appt.patientName || 'Sin nombre'}`
            : `Evento personal: ${appt.title || 'Sin título'}`;
          return `${appt.startTime} - ${appt.endTime} (${patientInfo})`;
        }).join('\n');

        console.log('Bloqueando creacion de turno por solapamiento:', overlapDetails);

        setValidationModal({
          open: true,
          title: 'No se puede agendar el turno',
          message: `Se solapa con otros turnos:\n\n${overlapDetails}`
        });
        setLoading(false);
        return;
      }

      console.log('No hay solapamientos, procediendo a crear turno');

      const selected = patients.find(p => p.id === (values.patientId as unknown as string));

      // Validación crítica: asegurar que el paciente existe antes de crear/actualizar
      if (!selected) {
        console.error('[AppointmentForm] ERROR CRÍTICO: No se encontró el paciente con ID:', values.patientId);
        toast.error('Error: No se encontró el paciente seleccionado. Por favor, recarga la página e intenta nuevamente.');
        setLoading(false);
        return;
      }

      const selectedProfessional = professionals.find(p => p.uid === values.professionalId);
      const payload = {
        patientId: selected.id, // Usar el ID del paciente encontrado para mayor seguridad
        patientName: `${selected.lastName}, ${selected.firstName}`, // Siempre construir desde el paciente encontrado
        date: startDate.toISOString(),
        startTime: values.startTime,
        endTime: `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`,
        duration: values.duration,
        status: initialData?.status || 'scheduled',
        type: values.type,
        fee: values.fee ?? 0,
        deposit: values.deposit ?? 0,
        notes: values.notes || '',
        userId: values.professionalId,
        professionalName: selectedProfessional?.displayName || '',
        appointmentType: 'patient', // Siempre es tipo paciente en este formulario
        createdAt: initialData?.createdAt || '',
        updatedAt: '',
      } as any;

      // Remover campos undefined para evitar errores en Firestore
      if (payload.officeId === undefined) {
        delete payload.officeId;
      }

      console.log('[AppointmentForm] Payload a enviar:', payload);

      if (initialData) {
        console.log('[AppointmentForm] Actualizando turno existente:', initialData.id);
        await updateAppointment(initialData.id, payload);
        const updated = { ...payload, id: initialData.id, googleCalendarEventId: initialData.googleCalendarEventId };

        const nextEventId = await syncAppointment(
          updated as Appointment,
          initialData.googleCalendarEventId ? 'update' : 'create',
          initialData.googleCalendarEventId
        );
        if (nextEventId && nextEventId !== initialData.googleCalendarEventId) {
          await updateAppointment(initialData.id, { googleCalendarEventId: nextEventId });
        }

        console.log('[AppointmentForm] Turno actualizado exitosamente');
        await refreshAppointments();
        reset();

        if (onSuccess) {
          onSuccess('Turno actualizado', 'El turno se ha actualizado correctamente');
          // Esperar a que el modal se cierre antes de cerrar el formulario
          setTimeout(() => {
            onCreated?.(updated);
          }, 2100);
        } else {
          setSuccessModal({ show: true, title: 'Turno actualizado', message: 'El turno se ha actualizado correctamente' });
          // Cerrar el formulario después de que se cierre el modal (2 segundos)
          setTimeout(() => {
            onCreated?.(updated);
          }, 2100);
        }
      } else {
        console.log('[AppointmentForm] Creando nuevo turno...');
        const id = await createAppointment(payload);
        const created = { ...payload, id };

        const eventId = await syncAppointment(created as Appointment, 'create');
        if (eventId) {
          await updateAppointment(id, { googleCalendarEventId: eventId });
        }

        console.log('[AppointmentForm] Turno creado exitosamente con ID:', id);
        await refreshAppointments();
        reset();

        if (onSuccess) {
          onSuccess(
            values.deposit && values.deposit > 0 ? 'Turno creado con seña registrada' : 'Turno creado',
            values.deposit && values.deposit > 0
              ? 'El turno se ha creado y la seña ha sido registrada'
              : 'El turno se ha creado correctamente'
          );
          // Esperar a que el modal se cierre antes de cerrar el formulario
          setTimeout(() => {
            onCreated?.(created);
          }, 2100);
        } else {
          setSuccessModal({
            show: true,
            title: values.deposit && values.deposit > 0 ? 'Turno creado con seña registrada' : 'Turno creado',
            message: values.deposit && values.deposit > 0
              ? 'El turno se ha creado y la seña ha sido registrada'
              : 'El turno se ha creado correctamente'
          });
          // Cerrar el formulario después de que se cierre el modal (2 segundos)
          setTimeout(() => {
            onCreated?.(created);
          }, 2100);
        }
      }
    } catch (e: any) {
      console.error('[AppointmentForm] Error completo:', e);
      console.error('[AppointmentForm] Error code:', e?.code);
      console.error('[AppointmentForm] Error message:', e?.message);

      // Mensajes de error mas especificos
      const errorTitle = initialData ? 'No se pudo actualizar el turno' : 'No se pudo crear el turno';
      if (e?.code === 'permission-denied') {
        setValidationModal({
          open: true,
          title: errorTitle,
          message: 'No tienes permisos para crear este turno. Verifica las reglas de Firestore.'
        });
      } else if (e?.message?.includes('index')) {
        setValidationModal({
          open: true,
          title: errorTitle,
          message: 'Se necesita crear un indice en Firestore. Revisa la consola del navegador.'
        });
      } else {
        setValidationModal({
          open: true,
          title: errorTitle,
          message: initialData
            ? `Error al actualizar turno: ${e?.message || 'Error desconocido'}`
            : `Error al crear turno: ${e?.message || 'Error desconocido'}`
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Generar opciones de horario desde 09:00 hasta 19:45 en intervalos de 15 minutos (memoizado)
  const timeOptions = useMemo((): SelectOption[] => {
    const options: SelectOption[] = [];
    const startHour = 9;
    const endHour = 19;
    const endMinute = 45;

    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        // Si es la última hora (19), solo permitir hasta 19:45
        if (hour === endHour && minute > endMinute) break;

        const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        options.push({ value: timeString, label: timeString });
      }
    }
    return options;
  }, []); // No dependencies, static list

  const durationOptions = useMemo((): SelectOption[] => [
    { value: 30, label: '30 min' },
    { value: 60, label: '60 min' },
    { value: 90, label: '90 min' },
    { value: 120, label: '120 min' },
    { value: 150, label: '150 min' },
  ], []);

  const treatmentOptions = useMemo((): SelectOption[] => [
    { value: 'odontologia-general', label: 'Odontología General' },
    { value: 'ortodoncia', label: 'Ortodoncia' },
    { value: 'endodoncia', label: 'Endodoncia' },
    { value: 'armonizacion', label: 'Armonización' },
  ], []);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si no hay profesional seleccionado, usar el usuario actual como predeterminado
  useEffect(() => {
    if (!initialData && user?.uid) {
      setValue('professionalId', user.uid);
    }
  }, [initialData, user?.uid, setValue]);

  useEffect(() => {
    if (!initialData) return;
    if (!initialData.deposit || initialData.deposit === 0) {
      setNoDeposit(true);
    }
  }, [initialData]);

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit, (errors) => {
        console.log('[AppointmentForm] Errores de validación:', errors);
      })} className="space-y-3">
        {/* Paciente y Profesional */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">Paciente</label>
            <Controller
              name="patientId"
              control={control}
              render={({ field }) => (
                <PatientSelect
                  patients={patients}
                  value={field.value}
                  onChange={field.onChange}
                  onCreateNew={() => setShowQuickPatient(true)}
                  error={errors.patientId?.message as string}
                />
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">Profesional</label>
            <Controller
              name="professionalId"
              control={control}
              render={({ field }) => (
                <ProfessionalSelect
                  professionals={professionals}
                  value={field.value}
                  onChange={field.onChange}
                  loading={loadingProfessionals}
                  error={errors.professionalId?.message as string}
                />
              )}
            />
          </div>
        </div>

        {/* Fecha, Hora y Duración */}
        <div className="grid grid-cols-3 gap-2.5">
          <div>
            <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">Fecha</label>
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <DateTimePicker
                  selected={field.value ? parseLocalDate(field.value) : null}
                  onChange={(date) => {
                    if (date) {
                      const formatted = format(date, 'yyyy-MM-dd');
                      field.onChange(formatted);
                    }
                  }}
                  error={errors.date?.message}
                />
              )}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">Hora</label>
            <Controller
              name="startTime"
              control={control}
              render={({ field }) => (
                <SelectField
                  options={timeOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Selecciona la hora"
                  error={errors.startTime?.message}
                />
              )}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">Duración</label>
            <Controller
              name="duration"
              control={control}
              render={({ field }) => (
                <SelectField
                  options={durationOptions}
                  value={field.value}
                  onChange={(value) => field.onChange(Number(value))}
                  placeholder="Duración"
                />
              )}
            />
          </div>
        </div>

        {/* Tipo y Honorarios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <div>
            <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">Tratamiento</label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <SelectField
                  options={treatmentOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Tipo de tratamiento"
                  error={errors.type?.message}
                />
              )}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">Honorarios</label>
            <Controller
              name="fee"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">Seña</label>
            <Controller
              name="deposit"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  value={field.value}
                  onChange={field.onChange}
                  disabled={noDeposit}
                />
              )}
            />
            <label className="mt-1 inline-flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
              <input
                type="checkbox"
                className="accent-primary cursor-pointer"
                checked={noDeposit}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setNoDeposit(checked);
                  setValue('deposit', checked ? 0 : 0);
                }}
              />
              Sin seña
            </label>
          </div>
        </div>

        {/* Notas */}
        <div>
          <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">Notas</label>
          <textarea className="input-field resize-none h-16" placeholder="Indicaciones o comentarios adicionales..." {...register('notes')} />
        </div>
        {/* Botones */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-elegant-200 dark:border-gray-700">
          <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
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

      <Modal
        open={validationModal.open}
        onClose={() => setValidationModal({ open: false, title: '', message: '' })}
        title={validationModal.title}
        maxWidth="max-w-md"
      >
        <div className="space-y-6">
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
            {validationModal.message}
          </p>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setValidationModal({ open: false, title: '', message: '' })}
              className="btn-primary"
            >
              Entendido
            </button>
          </div>
        </div>
      </Modal>

      <SuccessModal
        isOpen={successModal.show}
        onClose={() => setSuccessModal({ show: false, title: '', message: '' })}
        title={successModal.title}
        message={successModal.message}
      />
    </>
  );
});

export default AppointmentForm;

