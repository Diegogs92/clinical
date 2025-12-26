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
import { Appointment, UserProfile, FollowUpReason } from '@/types';
import { useToast } from '@/hooks/useToast';
import Modal from '@/components/ui/Modal';
import PatientForm from '@/components/patients/PatientForm';
import PatientSelect from '@/components/forms/PatientSelect';
import ProfessionalSelect from '@/components/forms/ProfessionalSelect';
import DateTimePicker from '@/components/forms/DateTimePicker';
import CurrencyInput from '@/components/forms/CurrencyInput';
import SelectField, { SelectOption } from '@/components/forms/SelectField';
import { usePatients } from '@/contexts/PatientsContext';
import { useAppointments } from '@/contexts/AppointmentsContext';
import { listProfessionals } from '@/lib/users';
import { listFollowUpReasons, createFollowUpReason } from '@/lib/followUpReasons';

const schema = z.object({
  patientId: z.string().min(1, 'Selecciona un paciente'),
  patientName: z.string().optional(),
  professionalId: z.string().min(1, 'Selecciona un profesional'),
  date: z.string().min(1, 'Fecha requerida'), // ISO date yyyy-MM-dd
  startTime: z.string().min(1, 'Hora inicio requerida'), // HH:mm
  duration: z.coerce.number().refine(val => [45, 60, 90, 120, 160].includes(val), {
    message: 'Selecciona una duración válida'
  }).default(45),
  type: z.enum(['odontologia-general', 'ortodoncia', 'endodoncia', 'armonizacion']).default('odontologia-general'),
  fee: z.coerce.number().optional(),
  deposit: z.coerce.number().optional(),
  notes: z.string().optional(),
  followUpMonths: z.coerce.number().optional(),
  followUpReason: z.string().optional(),
});

export type AppointmentFormValues = z.infer<typeof schema>;

interface Props {
  initialData?: Appointment;
  onCreated?: (appt?: any) => void;
  onCancel?: () => void;
}

const AppointmentForm = memo(function AppointmentForm({ initialData, onCreated, onCancel }: Props) {
  const { user } = useAuth();
  const { syncAppointment } = useCalendarSync();
  const [loading, setLoading] = useState(false);
  const { patients, refreshPatients } = usePatients();
  const { refreshAppointments } = useAppointments();
  const [showQuickPatient, setShowQuickPatient] = useState(false);
  const [professionals, setProfessionals] = useState<UserProfile[]>([]);
  const [loadingProfessionals, setLoadingProfessionals] = useState(false);
  const [followUpReasons, setFollowUpReasons] = useState<FollowUpReason[]>([]);
  const [loadingFollowUpReasons, setLoadingFollowUpReasons] = useState(false);
  const [savingFollowUpReason, setSavingFollowUpReason] = useState(false);
  const [showFollowUpReasonModal, setShowFollowUpReasonModal] = useState(false);
  const [newFollowUpReason, setNewFollowUpReason] = useState('');
  const [noDeposit, setNoDeposit] = useState(false);
  const toast = useToast();
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch, control } = useForm<AppointmentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      duration: initialData?.duration || 45,
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
      followUpMonths: initialData?.followUpMonths || undefined,
      followUpReason: initialData?.followUpReason || '',
    },
  });

  const normalizeReason = (value: string) => value.trim().toLowerCase();

  const saveFollowUpReason = async (reason: string, reasonUserId: string, showFeedback: boolean) => {
    const trimmed = reason.trim();
    if (!trimmed) {
      if (showFeedback) {
        toast.error('Ingresa un motivo para guardar');
      }
      return false;
    }

    const alreadyExists = followUpReasons.some(item => normalizeReason(item.label) === normalizeReason(trimmed));
    if (alreadyExists) {
      if (showFeedback) {
        toast.info('El motivo ya existe');
      }
      return false;
    }

    try {
      if (showFeedback) {
        setSavingFollowUpReason(true);
      }
      const id = await createFollowUpReason(reasonUserId, trimmed);
      const now = new Date().toISOString();
      setFollowUpReasons(prev => (
        [...prev, { id, label: trimmed, userId: reasonUserId, createdAt: now, updatedAt: now }]
          .sort((a, b) => a.label.localeCompare(b.label))
      ));
      if (showFeedback) {
        toast.success('Motivo guardado');
      }
      return true;
    } catch (error) {
      console.error('[AppointmentForm] Error saving follow-up reason:', error);
      if (showFeedback) {
        toast.error('No se pudo guardar el motivo');
      }
      return false;
    } finally {
      if (showFeedback) {
        setSavingFollowUpReason(false);
      }
    }
  };

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

        toast.error(
          `No se puede agendar el turno porque se solapa con otros turnos:\n\n${overlapDetails}`,
          { duration: 8000 }
        );
        setLoading(false);
        return;
      }

      console.log('No hay solapamientos, procediendo a crear turno');

      const selected = patients.find(p => p.id === (values.patientId as unknown as string));
      const selectedProfessional = professionals.find(p => p.uid === values.professionalId);

      // Calcular fecha de seguimiento si se especificó
      let followUpDate: string | undefined = undefined;
      if (values.followUpMonths && values.followUpMonths > 0) {
        const appointmentDate = new Date(startDate);
        appointmentDate.setMonth(appointmentDate.getMonth() + values.followUpMonths);
        followUpDate = appointmentDate.toISOString();
      }

      const payload = {
        patientId: values.patientId as unknown as string,
        patientName: selected ? `${selected.lastName} ${selected.firstName}` : (values.patientName || ''),
        date: startDate.toISOString(),
        startTime: values.startTime,
        endTime: `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`,
        duration: values.duration,
        status: initialData?.status || 'scheduled',
        type: values.type,
        fee: values.fee ?? 0,
        deposit: values.deposit ?? 0,
        notes: values.notes || '',
        followUpMonths: values.followUpMonths ?? 0,
        followUpReason: values.followUpReason || '',
        followUpDate: followUpDate,
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
      if (payload.followUpDate === undefined) {
        delete payload.followUpDate;
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
        toast.success('Turno actualizado');
        await refreshAppointments();
        await saveFollowUpReason(values.followUpReason || '', values.professionalId, false);
        reset();
        onCreated?.(updated);
      } else {
        console.log('[AppointmentForm] Creando nuevo turno...');
        const id = await createAppointment(payload);
        const created = { ...payload, id };

        const eventId = await syncAppointment(created as Appointment, 'create');
        if (eventId) {
          await updateAppointment(id, { googleCalendarEventId: eventId });
        }

        // Si hay seña, crear un pago automáticamente
        if (values.deposit && values.deposit > 0) {
          console.log('[AppointmentForm] Creando pago de seña:', values.deposit);
          await createPayment({
            appointmentId: id,
            patientId: values.patientId as unknown as string,
            patientName: selected ? `${selected.lastName} ${selected.firstName}` : (values.patientName || ''),
            amount: values.deposit,
            method: 'cash',
            status: 'completed',
            date: new Date().toISOString(),
            consultationType: values.type,
            notes: 'Seña del turno',
            userId: values.professionalId,
          });
          console.log('[AppointmentForm] Pago de seña creado exitosamente');
        }

        console.log('[AppointmentForm] Turno creado exitosamente con ID:', id);
        toast.success(values.deposit && values.deposit > 0 ? 'Turno creado y sena registrada' : 'Turno creado');
        await refreshAppointments();
        await saveFollowUpReason(values.followUpReason || '', values.professionalId, false);
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

  // Generar opciones de horario desde 09:00 hasta 19:30 en intervalos de 15 minutos (memoizado)
  const timeOptions = useMemo((): SelectOption[] => {
    const options: SelectOption[] = [];
    const startHour = 9;
    const endHour = 19;
    const endMinute = 30;

    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        // Si es la última hora (19), solo permitir hasta 19:30
        if (hour === endHour && minute > endMinute) break;

        const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        options.push({ value: timeString, label: timeString });
      }
    }
    return options;
  }, []); // No dependencies, static list

  const durationOptions = useMemo((): SelectOption[] => [
    { value: 45, label: '45 min' },
    { value: 60, label: '60 min' },
    { value: 90, label: '90 min' },
    { value: 120, label: '120 min' },
    { value: 160, label: '160 min' },
  ], []);

  const treatmentOptions = useMemo((): SelectOption[] => [
    { value: 'odontologia-general', label: 'Odontología General' },
    { value: 'ortodoncia', label: 'Ortodoncia' },
    { value: 'endodoncia', label: 'Endodoncia' },
    { value: 'armonizacion', label: 'Armonización' },
  ], []);

  const followUpReasonOptions = useMemo((): SelectOption[] =>
    followUpReasons.map(reason => ({
      value: reason.label,
      label: reason.label
    })),
    [followUpReasons]
  );

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

  useEffect(() => {
    const reasonUserId = user?.uid;
    if (!reasonUserId) return;
    let active = true;

    const loadReasons = async () => {
      try {
        setLoadingFollowUpReasons(true);
        const list = await listFollowUpReasons(reasonUserId);
        if (active) {
          setFollowUpReasons(list);
        }
      } catch (error) {
        console.error('[AppointmentForm] Error loading follow-up reasons:', error);
        toast.error('No se pudieron cargar los motivos de seguimiento');
      } finally {
        if (active) {
          setLoadingFollowUpReasons(false);
        }
      }
    };

    loadReasons();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const handleAddFollowUpReason = async () => {
    const reasonUserId = user?.uid;
    if (!reasonUserId) return;
    const trimmed = newFollowUpReason.trim();
    if (!trimmed) {
      toast.error('Ingresa un motivo para agregar');
      return;
    }

    const existing = followUpReasons.find(item => normalizeReason(item.label) === normalizeReason(trimmed));
    if (existing) {
      setValue('followUpReason', existing.label);
      setNewFollowUpReason('');
      toast.info('El motivo ya existe, se selecciono en la lista');
      return;
    }

    const saved = await saveFollowUpReason(trimmed, reasonUserId, true);
    if (saved) {
      setValue('followUpReason', trimmed);
      setNewFollowUpReason('');
      setShowFollowUpReasonModal(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Paciente y Profesional */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">Fecha</label>
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <DateTimePicker
                  selected={field.value ? new Date(field.value) : null}
                  onChange={(date) => {
                    if (date) {
                      const formatted = date.toISOString().split('T')[0];
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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

        {/* Seguimiento */}
        <div className="border-t border-elegant-200 dark:border-gray-700 pt-3">
          <h4 className="text-sm font-medium text-primary-dark dark:text-white mb-2">Recordatorio de Seguimiento</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Recordar en (meses)</label>
              <input
                type="number"
                className="input-field"
                placeholder="0"
                min="0"
                {...register('followUpMonths', { valueAsNumber: true })}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Motivo</label>
                <button
                  type="button"
                  onClick={() => {
                    setNewFollowUpReason('');
                    setShowFollowUpReasonModal(true);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-dark dark:text-primary-light transition"
                >
                  Nuevo
                </button>
              </div>
              <Controller
                name="followUpReason"
                control={control}
                render={({ field }) => (
                  <SelectField
                    options={followUpReasonOptions}
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="Selecciona un motivo"
                    isLoading={loadingFollowUpReasons}
                    noOptionsMessage="No hay motivos guardados"
                  />
                )}
              />
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-elegant-200 dark:border-gray-700">
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

      <Modal
        open={showFollowUpReasonModal}
        onClose={() => setShowFollowUpReasonModal(false)}
        title="Agregar motivo de seguimiento"
        maxWidth="max-w-lg"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleAddFollowUpReason();
          }}
          className="space-y-3"
        >
          <div>
            <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1.5">Motivo</label>
            <input
              type="text"
              className="input-field"
              placeholder="Ej: Control de ortodoncia, Limpieza, etc."
              value={newFollowUpReason}
              onChange={(event) => setNewFollowUpReason(event.target.value)}
              autoFocus
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={() => setShowFollowUpReasonModal(false)} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={savingFollowUpReason}>
              {savingFollowUpReason ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
});

export default AppointmentForm;
