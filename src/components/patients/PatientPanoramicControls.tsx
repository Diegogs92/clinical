'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Eye, Paperclip, X } from 'lucide-react';
import { uploadPatientFile, updatePatient } from '@/lib/patients';
import { usePatients } from '@/contexts/PatientsContext';
import { useToast } from '@/contexts/ToastContext';
import Modal from '@/components/ui/Modal';

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
  const [currentUrl, setCurrentUrl] = useState(panoramicUrl || '');
  const [currentName, setCurrentName] = useState(panoramicName || '');
  const [viewerOpen, setViewerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setCurrentUrl(panoramicUrl || '');
    setCurrentName(panoramicName || '');
  }, [panoramicUrl, panoramicName]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Solo se permite PDF o imagen para la panor\u00e1mica.');
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
        throw new Error('Storage no configurado');
      }
      await updatePatient(patientId, {
        panoramicUrl: uploadedFile.url,
        panoramicName: uploadedFile.name,
        panoramicUploadedAt: uploadedFile.uploadedAt,
      });
      setCurrentUrl(uploadedFile.url);
      setCurrentName(uploadedFile.name);
      if (onUploaded) {
        onUploaded(uploadedFile.url, uploadedFile.name, uploadedFile.uploadedAt);
      }
      await refreshPatients();
      toast.success('Panorámica subida correctamente.');
    } catch (error) {
      console.error('Panoramic upload error:', error);
      const message = error instanceof Error ? error.message : 'Error al subir la panorámica.';
      toast.error(message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const isPdf = currentName.toLowerCase().endsWith('.pdf') || currentUrl.toLowerCase().includes('.pdf');

  return (
    <div className={compact ? 'flex items-center gap-2' : 'flex flex-wrap items-center gap-3'}>
      <input
        id={inputId}
        type="file"
        className="hidden"
        accept="application/pdf,image/jpeg,image/png,image/jpg"
        onChange={handleFileSelect}
        disabled={uploading}
        ref={inputRef}
        aria-label="Adjuntar panor\u00e1mica"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-elegant-200 dark:border-elegant-700 text-elegant-700 dark:text-elegant-200 hover:border-primary/60 hover:text-primary-dark dark:hover:text-white transition-all ${
          uploading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
        }`}
        disabled={uploading}
      >
        <Paperclip className="w-4 h-4" />
        {uploading ? 'Subiendo...' : 'Adjuntar panor\u00e1mica'}
      </button>
      {currentUrl && (
        <button
          type="button"
          onClick={() => setViewerOpen(true)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-dark underline-offset-4 hover:underline"
        >
          <Eye className="w-4 h-4" />
          Ver panorámica
        </button>
      )}
      {!currentUrl && currentName && (
        <span className="text-sm text-secondary dark:text-gray-400">
          {currentName}
        </span>
      )}
      <Modal
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        title="Panorámica"
        maxWidth="max-w-4xl"
      >
        <div className="relative">
          <button
            type="button"
            onClick={() => setViewerOpen(false)}
            className="absolute right-2 top-2 icon-btn"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="mt-6">
            {isPdf ? (
              <iframe
                title="Panorámica"
                src={currentUrl}
                className="w-full h-[70vh] rounded-lg border border-elegant-200 dark:border-elegant-700"
              />
            ) : (
              <img
                src={currentUrl}
                alt="Panorámica"
                className="w-full max-h-[70vh] object-contain rounded-lg border border-elegant-200 dark:border-elegant-700 bg-white"
              />
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
