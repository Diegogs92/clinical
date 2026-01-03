'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Eye, Paperclip, Trash2, X } from 'lucide-react';
import { uploadPatientFile, updatePatient, deletePatientFileByUrl } from '@/lib/patients';
import { mockMode, storage } from '@/lib/firebase';
import { usePatients } from '@/contexts/PatientsContext';
import { useToast } from '@/contexts/ToastContext';
import Modal from '@/components/ui/Modal';
import SuccessModal from '@/components/ui/SuccessModal';
import { useConfirm } from '@/contexts/ConfirmContext';

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
  const confirm = useConfirm();
  const { refreshPatients } = usePatients();
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(panoramicUrl || '');
  const [currentName, setCurrentName] = useState(panoramicName || '');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successModal, setSuccessModal] = useState<{ show: boolean; title: string; message?: string }>({
    show: false,
    title: '',
    message: '',
  });
  const inputRef = useRef<HTMLInputElement | null>(null);
  const storageReady = !mockMode && !!storage;

  const triggerFilePicker = () => {
    if (!inputRef.current) return;
    inputRef.current.value = '';
    console.log('[Panoramic] Open file picker');
    (window as any).__dentifyFilePickerOpen = true;
    inputRef.current.click();
  };

  useEffect(() => {
    setCurrentUrl(panoramicUrl || '');
    setCurrentName(panoramicName || '');
  }, [panoramicUrl, panoramicName]);

  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement> | React.FormEvent<HTMLInputElement>
  ) => {
    const inputEl = e.currentTarget as HTMLInputElement;
    const files = inputEl.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setErrorMessage('');
    (window as any).__dentifyFilePickerOpen = false;
    console.log('[Panoramic] Input event:', e.type);
    console.log('[Panoramic] Selected file:', {
      name: file.name,
      type: file.type,
      size: file.size,
      storageReady,
      patientId,
    });

    if (!storageReady) {
      const message = 'Storage no configurado.';
      toast.error(message);
      setErrorMessage(message);
      inputEl.value = '';
      return;
    }

    const isPdfFile = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdfFile) {
      const message = 'Solo se permite PDF para la panor\u00e1mica.';
      toast.error(message);
      setErrorMessage(message);
      inputEl.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      const message = 'El archivo no puede ser mayor a 10MB.';
      toast.error(message);
      setErrorMessage(message);
      inputEl.value = '';
      return;
    }

    try {
      setUploading(true);
      console.log('[Panoramic] Upload started');
      const uploadedFile = await uploadPatientFile(patientId, file);
      console.log('[Panoramic] Upload response:', uploadedFile);
      if (!uploadedFile.url) {
        throw new Error('Storage no configurado');
      }
      setCurrentUrl(uploadedFile.url);
      setCurrentName(uploadedFile.name);
      console.log('[Panoramic] Updating patient record');
      await updatePatient(patientId, {
        panoramicUrl: uploadedFile.url,
        panoramicName: uploadedFile.name,
        panoramicUploadedAt: uploadedFile.uploadedAt,
      });
      if (onUploaded) {
        onUploaded(uploadedFile.url, uploadedFile.name, uploadedFile.uploadedAt);
      }
      await refreshPatients();
      setSuccessModal({
        show: true,
        title: 'Panorámica subida',
        message: 'El PDF se adjuntó correctamente.',
      });
    } catch (error) {
      console.error('[Panoramic] Upload error:', error);
      const message = error instanceof Error ? error.message : 'Error al subir la panorámica.';
      toast.error(message);
      setErrorMessage(message);
    } finally {
      console.log('[Panoramic] Upload finished');
      setUploading(false);
      inputEl.value = '';
    }
  };

  const handleDelete = async () => {
    if (!currentUrl) return;
    const confirmed = await confirm({
      title: 'Eliminar panorámica',
      description: 'Eliminar el PDF adjunto de este paciente?',
      confirmText: 'Eliminar',
      tone: 'danger',
    });
    if (!confirmed) return;

    try {
      setDeleting(true);
      await deletePatientFileByUrl(currentUrl);
      await updatePatient(patientId, {
        panoramicUrl: '',
        panoramicName: '',
        panoramicUploadedAt: '',
      });
      setCurrentUrl('');
      setCurrentName('');
      await refreshPatients();
      setSuccessModal({
        show: true,
        title: 'Panorámica eliminada',
        message: 'El PDF se eliminó correctamente.',
      });
    } catch (error) {
      console.error('[Panoramic] Delete error:', error);
      const message = error instanceof Error ? error.message : 'Error al eliminar la panorámica.';
      toast.error(message);
      setErrorMessage(message);
    } finally {
      setDeleting(false);
    }
  };

  const isPdf = currentName.toLowerCase().endsWith('.pdf') || currentUrl.toLowerCase().includes('.pdf');

  return (
    <div className={compact ? 'flex items-center gap-2' : 'flex flex-wrap items-center gap-3'}>
      <input
        id={inputId}
        type="file"
        className="hidden"
        accept="application/pdf,.pdf"
        onChange={handleFileSelect}
        onInput={handleFileSelect}
        onClick={() => console.log('[Panoramic] File input click')}
        disabled={uploading}
        ref={inputRef}
        aria-label="Adjuntar panor\u00e1mica"
      />
      <label
        onClick={triggerFilePicker}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            triggerFilePicker();
          }
        }}
        role="button"
        tabIndex={0}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-elegant-200 dark:border-elegant-700 text-elegant-700 dark:text-elegant-200 hover:border-primary/60 hover:text-primary-dark dark:hover:text-white transition-all ${
          uploading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
        }`}
        aria-disabled={uploading || deleting || !storageReady}
      >
        <Paperclip className="w-4 h-4" />
        {uploading ? 'Subiendo...' : 'Adjuntar panor\u00e1mica'}
      </label>
      {currentUrl && (
        <>
          <button
            type="button"
            onClick={() => setViewerOpen(true)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-dark underline-offset-4 hover:underline"
          >
            <Eye className="w-4 h-4" />
            Ver PDF
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700 underline-offset-4 hover:underline disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar PDF
          </button>
        </>
      )}
      {!currentUrl && currentName && (
        <span className="text-sm text-secondary dark:text-gray-400">
          {currentName}
        </span>
      )}
      {!storageReady && (
        <span className="text-xs text-red-600 dark:text-red-400">
          Storage no configurado.
        </span>
      )}
      {errorMessage && (
        <span className="text-xs text-red-600 dark:text-red-400">
          {errorMessage}
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
              <div className="text-sm text-elegant-600 dark:text-elegant-300">
                El archivo adjunto no es un PDF.
              </div>
            )}
          </div>
        </div>
      </Modal>
      <SuccessModal
        isOpen={successModal.show}
        onClose={() => setSuccessModal({ show: false, title: '', message: '' })}
        title={successModal.title}
        message={successModal.message}
      />
    </div>
  );
}
