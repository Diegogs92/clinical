'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getMedicalHistoryByPatient, createMedicalHistory, deleteMedicalHistory } from '@/lib/medicalHistory';
import { getPatient } from '@/lib/patients';
import { MedicalHistory, Patient } from '@/types';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { FileText, Plus, Trash2, Calendar, ArrowLeft } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import Modal from '@/components/ui/Modal';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const historySchema = z.object({
  diagnosis: z.string().min(1, 'El diagnóstico es requerido'),
  treatment: z.string().min(1, 'El tratamiento es requerido'),
  notes: z.string().optional(),
});

type HistoryFormValues = z.infer<typeof historySchema>;

export default function PatientHistoryPage() {
  const params = useParams();
  const router = useRouter();
    const patientId = params?.id as string;
  const [patient, setPatient] = useState<Patient | null>(null);
  const [history, setHistory] = useState<MedicalHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<HistoryFormValues>({
    resolver: zodResolver(historySchema),
  });

  useEffect(() => {
    loadData();
  }, [patientId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [patientData, historyData] = await Promise.all([
        getPatient(patientId),
        getMedicalHistoryByPatient(patientId)
      ]);
      setPatient(patientData);
      setHistory(historyData);
    } catch (error) {
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: HistoryFormValues) => {
    setSubmitting(true);
    try {
      await createMedicalHistory({
        patientId,
        date: new Date().toISOString(),
        diagnosis: values.diagnosis,
        treatment: values.treatment,
        notes: values.notes || '',
      });
      toast.success('Registro agregado correctamente');
      setShowForm(false);
      reset();
      loadData();
    } catch (error) {
      toast.error('Error al crear el registro');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Eliminar registro',
      description: '¿Estás seguro de eliminar este registro del historial? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      tone: 'danger'
    });
    if (!confirmed) return;

    try {
      await deleteMedicalHistory(id);
      toast.success('Registro eliminado');
      loadData();
    } catch (error) {
      toast.error('Error al eliminar el registro');
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/patients')}
                className="text-secondary hover:text-primary-dark dark:hover:text-white transition-colors"
                aria-label="Volver a pacientes"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-primary-dark dark:text-white flex items-center gap-2">
                  <FileText className="w-6 h-6" />
                  Historial Médico
                </h1>
                {patient && (
                  <p className="text-secondary dark:text-gray-400 mt-1">
                    {patient.firstName} {patient.lastName} - DNI: {patient.dni}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary flex items-center gap-2 hover:shadow-lg hover:scale-105 transition-all"
              aria-label="Agregar registro"
            >
              <Plus className="w-4 h-4" />
              Nuevo Registro
            </button>
          </div>

          {loading ? (
            <div className="card">
              <p className="text-secondary dark:text-gray-400">Cargando historial...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="card text-center py-12">
              <FileText className="w-16 h-16 text-secondary dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-primary-dark dark:text-white mb-2">
                No hay registros en el historial médico
              </h3>
              <p className="text-secondary dark:text-gray-400 mb-6">
                Comienza agregando el primer registro médico del paciente
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="btn-primary inline-flex items-center gap-2 hover:shadow-lg hover:scale-105 transition-all"
              >
                <Plus className="w-4 h-4" />
                Agregar Primer Registro
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry) => (
                <div key={entry.id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm text-secondary dark:text-gray-400 mb-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(entry.date).toLocaleDateString('es-AR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                      <h3 className="text-lg font-semibold text-primary-dark dark:text-white mb-2">
                        {entry.diagnosis}
                      </h3>
                      <div className="mb-2">
                        <span className="text-sm font-medium text-secondary dark:text-gray-400">
                          Tratamiento:
                        </span>
                        <p className="text-primary-dark dark:text-white mt-1">
                          {entry.treatment}
                        </p>
                      </div>
                      {entry.notes && (
                        <div className="mt-3 p-3 bg-secondary-lighter/30 dark:bg-gray-700 rounded-lg">
                          <span className="text-sm font-medium text-secondary dark:text-gray-400">
                            Notas:
                          </span>
                          <p className="text-sm text-primary-dark dark:text-white mt-1">
                            {entry.notes}
                          </p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors ml-4"
                      aria-label="Eliminar registro"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Modal open={showForm} onClose={() => setShowForm(false)} title="Nuevo Registro Médico">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">
                  Diagnóstico
                </label>
                <input
                  className="input-field"
                  {...register('diagnosis')}
                  placeholder="Ej: Gripe estacional"
                />
                {errors.diagnosis && (
                  <p className="text-red-600 text-xs mt-1">{errors.diagnosis.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">
                  Tratamiento
                </label>
                <textarea
                  rows={3}
                  className="input-field"
                  {...register('treatment')}
                  placeholder="Descripción del tratamiento indicado"
                />
                {errors.treatment && (
                  <p className="text-red-600 text-xs mt-1">{errors.treatment.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-dark dark:text-white mb-1">
                  Notas adicionales (opcional)
                </label>
                <textarea
                  rows={4}
                  className="input-field"
                  {...register('notes')}
                  placeholder="Observaciones, evolución, recomendaciones..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary flex-1 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98]"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  disabled={submitting}
                >
                  {submitting ? 'Guardando...' : 'Guardar Registro'}
                </button>
              </div>
            </form>
          </Modal>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
