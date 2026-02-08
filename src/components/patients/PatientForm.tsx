'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { createPatient, updatePatient, getPatient } from '@/lib/patients';
import { listInsurances, createInsurance } from '@/lib/insurances';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Patient, Insurance } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import PatientPanoramicControls from './PatientPanoramicControls';
import { usePatients } from '@/contexts/PatientsContext';
import SuccessModal from '@/components/ui/SuccessModal';

const patientSchema = z.object({
  firstName: z.string().min(1, 'Nombre requerido'),
  lastName: z.string().min(1, 'Apellido requerido'),
  dni: z.string().min(6, 'DNI inválido'),
  phone: z.string().min(6, 'Teléfono inválido'),
  insuranceType: z.enum(['particular', 'obra-social']).optional(),
  insuranceName: z.string().optional(),
  insuranceId: z.string().optional(),
  insuranceNumber: z.string().optional(),
  birthDate: z.string().optional(),
});

export type PatientFormValues = z.infer<typeof patientSchema>;

interface Props {
  patientId?: string;
  onSuccess?: (title: string, message: string) => void;
}
export default function PatientForm({ patientId, onSuccess }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [initialPatient, setInitialPatient] = useState<Patient | null>(null);
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [selectedType, setSelectedType] = useState<'particular' | 'obra-social'>('particular');
  const [showNewInsuranceInput, setShowNewInsuranceInput] = useState(false);
  const [newInsuranceName, setNewInsuranceName] = useState('');
  const { refreshPatients } = usePatients();
  const [successModal, setSuccessModal] = useState<{ show: boolean; title: string; message?: string }>({
    show: false,
    title: '',
    message: ''
  });

  const { register, handleSubmit, formState: { errors, touchedFields }, reset, watch, setValue } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    mode: 'onBlur', // Validación en tiempo real al salir del campo
    defaultValues: {
      insuranceType: 'particular',
    },
  });

  const insuranceType = watch('insuranceType');

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
          // Convertir 'prepaga' a 'obra-social' para pacientes existentes
          const insuranceType = p.insuranceType === 'prepaga' ? 'obra-social' : (p.insuranceType || 'particular');
          setSelectedType(insuranceType);
          reset({
            firstName: p.firstName,
            lastName: p.lastName,
            dni: p.dni,
            phone: p.phone,
            insuranceType: insuranceType,
            insuranceName: p.insuranceName || '',
            insuranceId: p.insuranceId || '',
            insuranceNumber: p.insuranceNumber || '',
            birthDate: p.birthDate || '',
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
      if (values.insuranceType) {
        patientData.insuranceType = values.insuranceType;
      }
      if (values.insuranceName && values.insuranceName.trim()) {
        patientData.insuranceName = values.insuranceName;
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

      if (patientId && initialPatient) {
        await updatePatient(patientId, patientData);
        await refreshPatients();
        if (onSuccess) {
          onSuccess('Paciente actualizado', 'El paciente se ha actualizado correctamente');
        } else {
          setSuccessModal({
            show: true,
            title: 'Paciente actualizado',
            message: 'El paciente se ha actualizado correctamente'
          });
        }
      } else {
        await createPatient(patientData);
        await refreshPatients();
        if (onSuccess) {
          onSuccess('Paciente creado', 'El paciente se ha creado correctamente');
        } else {
          setSuccessModal({
            show: true,
            title: 'Paciente creado',
            message: 'El paciente se ha creado correctamente'
          });
        }
      }
    } catch (e) {
      console.error('Error al guardar:', e);
      alert(`Error al guardar paciente: ${e instanceof Error ? e.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-primary-dark dark:text-white mb-1.5">
            Nombre <span className="text-red-500">*</span>
          </label>
          <input
            id="firstName"
            className="input-field"
            autoFocus={!patientId}
            placeholder="Ej: Juan"
            {...register('firstName')}
          />
          {touchedFields.firstName && errors.firstName && (
            <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
              <span className="text-sm">⚠</span>
              {errors.firstName.message}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-primary-dark dark:text-white mb-1.5">
            Apellido <span className="text-red-500">*</span>
          </label>
          <input
            id="lastName"
            className="input-field"
            placeholder="Ej: García"
            {...register('lastName')}
          />
          {touchedFields.lastName && errors.lastName && (
            <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
              <span className="text-sm">⚠</span>
              {errors.lastName.message}
            </p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label htmlFor="dni" className="block text-sm font-medium text-primary-dark dark:text-white mb-1.5">
            DNI <span className="text-red-500">*</span>
          </label>
          <input
            id="dni"
            className="input-field"
            placeholder="Ej: 12345678"
            {...register('dni')}
          />
          {touchedFields.dni && errors.dni && (
            <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
              <span className="text-sm">⚠</span>
              {errors.dni.message}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-primary-dark dark:text-white mb-1.5">
            Teléfono <span className="text-red-500">*</span>
          </label>
          <input
            id="phone"
            className="input-field"
            placeholder="Ej: 1112345678"
            {...register('phone')}
          />
          {touchedFields.phone && errors.phone && (
            <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
              <span className="text-sm">⚠</span>
              {errors.phone.message}
            </p>
          )}
        </div>
      </div>
      <div>
        <label htmlFor="birthDate" className="block text-sm font-medium text-primary-dark dark:text-white mb-1.5">
          Fecha de Nacimiento
        </label>
        <input
          id="birthDate"
          type="date"
          className="input-field"
          {...register('birthDate')}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-primary-dark dark:text-white mb-2">Tipo de Cobertura</label>
        <div className="grid grid-cols-2 gap-2 md:gap-3">
          <label className={`flex items-center justify-center p-3 md:p-3.5 border-2 rounded-xl cursor-pointer transition-all active:scale-95 ${
            insuranceType === 'particular'
              ? 'border-primary bg-primary/10 dark:bg-primary/20'
              : 'border-secondary-lighter dark:border-gray-600 hover:border-primary/50'
          }`}>
            <input
              type="radio"
              value="particular"
              {...register('insuranceType')}
              className="sr-only"
            />
            <span className={`text-sm font-medium ${insuranceType === 'particular' ? 'text-primary dark:text-white' : 'text-secondary dark:text-gray-400'}`}>
              Particular
            </span>
          </label>

          <label className={`flex items-center justify-center p-3 md:p-3.5 border-2 rounded-xl cursor-pointer transition-all active:scale-95 ${
            insuranceType === 'obra-social'
              ? 'border-primary bg-primary/10 dark:bg-primary/20'
              : 'border-secondary-lighter dark:border-gray-600 hover:border-primary/50'
          }`}>
            <input
              type="radio"
              value="obra-social"
              {...register('insuranceType')}
              className="sr-only"
            />
            <span className={`text-sm font-medium ${insuranceType === 'obra-social' ? 'text-primary dark:text-white' : 'text-secondary dark:text-gray-400'}`}>
              Obra Social
            </span>
          </label>
        </div>
      </div>

      {insuranceType && insuranceType !== 'particular' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1.5">
              Obra Social
            </label>
            {!showNewInsuranceInput ? (
              <div className="flex gap-2">
                <select
                  className="input-field flex-1"
                  {...register('insuranceId')}
                  onChange={(e) => {
                    const selectedInsurance = insurances.find(i => i.id === e.target.value);
                    if (selectedInsurance) {
                      setValue('insuranceId', selectedInsurance.id);
                      setValue('insuranceName', selectedInsurance.name);
                    }
                  }}
                >
                  <option value="">Seleccionar obra social</option>
                  {insurances
                    .filter(i => i.type === insuranceType)
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(insurance => (
                      <option key={insurance.id} value={insurance.id}>
                        {insurance.code ? `${insurance.code} - ` : ''}{insurance.acronym ? `${insurance.acronym} - ` : ''}{insurance.name}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewInsuranceInput(true)}
                  className="btn-secondary whitespace-nowrap"
                >
                  + Nueva
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input-field flex-1"
                  placeholder="Nombre de la obra social"
                  value={newInsuranceName}
                  onChange={(e) => setNewInsuranceName(e.target.value)}
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!newInsuranceName.trim()) {
                      toast.error('Ingresa un nombre');
                      return;
                    }
                    try {
                      const newId = await createInsurance({
                        name: newInsuranceName.trim(),
                        type: insuranceType,
                        userId: user!.uid,
                      });
                      setValue('insuranceId', newId);
                      setValue('insuranceName', newInsuranceName.trim());
                      const updatedList = await listInsurances(user!.uid);
                      setInsurances(updatedList);
                      setNewInsuranceName('');
                      setShowNewInsuranceInput(false);
                      toast.success('Cobertura creada exitosamente');
                    } catch (error) {
                      console.error('Error creating insurance:', error);
                      toast.error('Error al crear la cobertura');
                    }
                  }}
                  className="btn-primary whitespace-nowrap"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewInsuranceInput(false);
                    setNewInsuranceName('');
                  }}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1.5">Nº Afiliado</label>
            <input
              className="input-field"
              {...register('insuranceNumber')}
              placeholder="Número"
            />
          </div>
        </div>
      )}

      {patientId && initialPatient && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-primary-dark dark:text-white">
            Panoramicas
          </label>
          <PatientPanoramicControls
            patientId={patientId}
            panoramics={initialPatient.panoramics}
            onPanoramicsChange={(panoramics) => {
              setInitialPatient(prev =>
                prev ? { ...prev, panoramics } : prev
              );
            }}
          />
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button disabled={loading} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? 'Guardando...' : (patientId ? 'Actualizar' : 'Crear')}
        </button>
      </div>
      </form>

      <SuccessModal
        isOpen={successModal.show}
        onClose={() => {
          setSuccessModal({ show: false, title: '', message: '' });
          router.push('/patients');
        }}
        title={successModal.title}
        message={successModal.message}
      />
    </>
  );
}
