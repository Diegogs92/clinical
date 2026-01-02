'use client';

import { useId, useState } from 'react';
import { Eye, Paperclip } from 'lucide-react';
import { uploadPatientFile, updatePatient } from '@/lib/patients';
import { usePatients } from '@/contexts/PatientsContext';
import { useToast } from '@/contexts/ToastContext';

interface Props {
  patientId: string;
  panoramicUrl?: string;
  panoramicName?: string;
  compact?: boolean;
  onUploaded?: (url: string, name: string, uploadedAt: string) => void;
}

export default function PatientPanoramicControls({
  patientId,
  panoramicUrl,
  panoramicName,
  compact = false,
  onUploaded,
}: Props) {
  const inputId = useId();
  const toast = useToast();
  const { refreshPatients } = usePatients();
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    if (file.type !== 'application/pdf') {
      toast.error('Solo se permite PDF para la panorámica.');
      e.target.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo no puede ser mayor a 10MB.');
      e.target.value = '';
      return;
    }

    try {
      setUploading(true);
      const uploadedFile = await uploadPatientFile(patientId, file);
      if (!uploadedFile.url) {
        throw new Error('URL de archivo no disponible');
      }
      await updatePatient(patientId, {
        panoramicUrl: uploadedFile.url,
        panoramicName: uploadedFile.name,
        panoramicUploadedAt: uploadedFile.uploadedAt,
      });
      if (onUploaded) {
        onUploaded(uploadedFile.url, uploadedFile.name, uploadedFile.uploadedAt);
      }
      await refreshPatients();
      toast.success('Panorámica subida correctamente.');
    } catch (error) {
      console.error('Panoramic upload error:', error);
      toast.error('Error al subir la panorámica.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className={compact ? 'flex items-center gap-2' : 'flex flex-wrap items-center gap-3'}>
      <input
        id={inputId}
        type="file"
        className="hidden"
        accept="application/pdf"
        onChange={handleFileSelect}
        disabled={uploading}
        aria-label="Adjunatar panorámica"
      />
      <label
        htmlFor={inputId}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-elegant-200 dark:border-elegant-700 text-elegant-700 dark:text-elegant-200 hover:border-primary/60 hover:text-primary-dark dark:hover:text-white transition-all ${
          uploading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        <Paperclip className="w-4 h-4" />
        {uploading ? 'Subiendo...' : 'Adjunatar panorámica'}
      </label>
      {panoramicUrl && (
        <a
          href={panoramicUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-dark underline-offset-4 hover:underline"
        >
          <Eye className="w-4 h-4" />
          Ver panorámica
        </a>
      )}
      {!panoramicUrl && panoramicName && (
        <span className="text-sm text-secondary dark:text-gray-400">
          {panoramicName}
        </span>
      )}
    </div>
  );
}
