'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, Paperclip, Plus, Trash2 } from 'lucide-react';
import { uploadPatientFile, deletePatientFileByUrl, addPanoramic, removePanoramic } from '@/lib/patients';
import { mockMode, storage } from '@/lib/firebase';
import { usePatients } from '@/contexts/PatientsContext';
import { useToast } from '@/contexts/ToastContext';
import Modal from '@/components/ui/Modal';
import SuccessModal from '@/components/ui/SuccessModal';
import { useConfirm } from '@/contexts/ConfirmContext';
import { PanoramicImage } from '@/types';

interface Props {
  patientId: string;
  panoramics?: PanoramicImage[];
  compact?: boolean;
  onPanoramicsChange?: (panoramics: PanoramicImage[]) => void;
}

export default function PatientPanoramicControls({
  patientId,
  panoramics: panoramicsProp,
  compact = false,
  onPanoramicsChange,
}: Props) {
  const inputId = useId();
  const toast = useToast();
  const confirm = useConfirm();
  const { refreshPatients } = usePatients();
  const [images, setImages] = useState<PanoramicImage[]>(panoramicsProp ?? []);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewingIndex, setViewingIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [successModal, setSuccessModal] = useState<{ show: boolean; title: string; message?: string }>({
    show: false,
    title: '',
    message: '',
  });
  const inputRef = useRef<HTMLInputElement | null>(null);
  const storageReady = !mockMode && !!storage;

  useEffect(() => {
    setImages(panoramicsProp ?? []);
  }, [panoramicsProp]);

  const triggerFilePicker = () => {
    if (!inputRef.current) return;
    inputRef.current.value = '';
    (window as any).__dentifyFilePickerOpen = true;
    inputRef.current.click();
  };

  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement> | React.FormEvent<HTMLInputElement>
  ) => {
    const inputEl = e.currentTarget as HTMLInputElement;
    const files = inputEl.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setErrorMessage('');
    (window as any).__dentifyFilePickerOpen = false;

    if (!storageReady) {
      const message = 'Storage no configurado.';
      toast.error(message);
      setErrorMessage(message);
      inputEl.value = '';
      return;
    }

    const isImageFile = file.type.startsWith('image/') ||
                        /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(file.name);
    if (!isImageFile) {
      const message = 'Solo se permiten archivos de imagen para la panoramica.';
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
      const uploadedFile = await uploadPatientFile(patientId, file);
      if (!uploadedFile.url) {
        throw new Error('Storage no configurado');
      }
      const newImage: PanoramicImage = {
        url: uploadedFile.url,
        name: uploadedFile.name,
        uploadedAt: uploadedFile.uploadedAt,
      };
      await addPanoramic(patientId, newImage);
      const updatedImages = [...images, newImage];
      setImages(updatedImages);
      if (onPanoramicsChange) onPanoramicsChange(updatedImages);
      await refreshPatients();
      setSuccessModal({
        show: true,
        title: 'Panoramica subida',
        message: 'La imagen se adjunto correctamente.',
      });
    } catch (error) {
      console.error('[Panoramic] Upload error:', error);
      const message = error instanceof Error ? error.message : 'Error al subir la panoramica.';
      toast.error(message);
      setErrorMessage(message);
    } finally {
      setUploading(false);
      inputEl.value = '';
    }
  };

  const handleDeleteImage = async (image: PanoramicImage) => {
    const confirmed = await confirm({
      title: 'Eliminar panoramica',
      description: `Eliminar "${image.name}" de este paciente?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      tone: 'danger',
    });
    if (!confirmed) return;

    let shouldClear = true;
    try {
      setDeleting(true);
      await deletePatientFileByUrl(image.url);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (!message.includes('object-not-found')) {
        toast.error('Error al eliminar la panoramica.');
        setDeleting(false);
        return;
      }
    }

    try {
      await removePanoramic(patientId, image.url);
      const updatedImages = images.filter(i => i.url !== image.url);
      setImages(updatedImages);
      if (onPanoramicsChange) onPanoramicsChange(updatedImages);
      if (viewerOpen && images[viewingIndex]?.url === image.url) {
        if (updatedImages.length === 0) {
          setViewerOpen(false);
        } else {
          setViewingIndex(Math.min(viewingIndex, updatedImages.length - 1));
        }
      }
      await refreshPatients();
      setSuccessModal({
        show: true,
        title: 'Panoramica eliminada',
        message: 'La imagen se elimino correctamente.',
      });
    } finally {
      setDeleting(false);
    }
  };

  const openViewer = (index: number) => {
    setViewingIndex(index);
    setViewerOpen(true);
  };

  const fileInput = (
    <input
      id={inputId}
      type="file"
      className="hidden"
      accept="image/*,.jpg,.jpeg,.png,.gif,.webp,.bmp"
      onChange={handleFileSelect}
      disabled={uploading}
      ref={inputRef}
      aria-label="Adjuntar panoramica"
    />
  );

  // ─── Compact mode (PatientList) ───
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {fileInput}
        {images.length > 0 && (
          <button
            type="button"
            onClick={() => openViewer(images.length - 1)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            {images.length} {images.length === 1 ? 'panoramica' : 'panoramicas'}
          </button>
        )}
        <button
          type="button"
          onClick={triggerFilePicker}
          disabled={uploading || !storageReady}
          className={`inline-flex items-center gap-1 rounded-lg font-medium border border-elegant-200 dark:border-elegant-700 text-elegant-700 dark:text-elegant-200 hover:border-primary/60 hover:text-primary-dark dark:hover:text-white transition-all px-2 py-1.5 text-xs ${
            uploading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          {images.length === 0 ? (
            <>
              <Paperclip className="w-3.5 h-3.5" />
              {uploading ? 'Subiendo...' : 'Adjuntar'}
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              {uploading ? 'Subiendo...' : ''}
            </>
          )}
        </button>
        {!storageReady && (
          <span className="text-xs text-red-600 dark:text-red-400">Storage no configurado.</span>
        )}

        {/* Viewer modal */}
        <Modal
          open={viewerOpen}
          onClose={() => setViewerOpen(false)}
          title={images[viewingIndex]?.name || 'Panoramica'}
          maxWidth="max-w-4xl"
        >
          {images[viewingIndex] && (
            <div className="space-y-3">
              <img
                src={images[viewingIndex].url}
                alt={images[viewingIndex].name}
                className="w-full h-auto rounded-lg border border-elegant-200 dark:border-elegant-700"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewingIndex(i => Math.max(0, i - 1))}
                    disabled={viewingIndex === 0}
                    className="p-1.5 rounded-lg border border-elegant-200 dark:border-elegant-700 disabled:opacity-30 hover:bg-elegant-100 dark:hover:bg-elegant-800 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-secondary dark:text-gray-400">
                    {viewingIndex + 1} / {images.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setViewingIndex(i => Math.min(images.length - 1, i + 1))}
                    disabled={viewingIndex === images.length - 1}
                    className="p-1.5 rounded-lg border border-elegant-200 dark:border-elegant-700 disabled:opacity-30 hover:bg-elegant-100 dark:hover:bg-elegant-800 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteImage(images[viewingIndex])}
                  disabled={deleting}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-60"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar
                </button>
              </div>
            </div>
          )}
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

  // ─── Full gallery mode (PatientForm / PatientDetail) ───
  return (
    <div className="space-y-3">
      {fileInput}

      {/* Thumbnail grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img, idx) => (
            <div
              key={img.url}
              className="relative group rounded-lg overflow-hidden border border-elegant-200 dark:border-elegant-700 aspect-[4/3] bg-elegant-50 dark:bg-elegant-900"
            >
              <img
                src={img.url}
                alt={img.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => openViewer(idx)}
                  className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                >
                  <Eye className="w-4 h-4 text-primary" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteImage(img)}
                  disabled={deleting}
                  className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/60 to-transparent">
                <p className="text-[10px] text-white truncate">{img.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      <button
        type="button"
        onClick={triggerFilePicker}
        disabled={uploading || !storageReady}
        className={`inline-flex items-center gap-2 rounded-lg font-medium border border-elegant-200 dark:border-elegant-700 text-elegant-700 dark:text-elegant-200 hover:border-primary/60 hover:text-primary-dark dark:hover:text-white transition-all px-3 py-2 text-sm ${
          uploading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        <Paperclip className="w-4 h-4" />
        {uploading ? 'Subiendo...' : 'Adjuntar panoramica'}
      </button>

      {!storageReady && (
        <span className="text-xs text-red-600 dark:text-red-400">Storage no configurado.</span>
      )}
      {errorMessage && (
        <span className="text-xs text-red-600 dark:text-red-400">{errorMessage}</span>
      )}

      {/* Viewer modal */}
      <Modal
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        title={images[viewingIndex]?.name || 'Panoramica'}
        maxWidth="max-w-4xl"
      >
        {images[viewingIndex] && (
          <div className="space-y-3">
            <img
              src={images[viewingIndex].url}
              alt={images[viewingIndex].name}
              className="w-full h-auto rounded-lg border border-elegant-200 dark:border-elegant-700"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setViewingIndex(i => Math.max(0, i - 1))}
                      disabled={viewingIndex === 0}
                      className="p-1.5 rounded-lg border border-elegant-200 dark:border-elegant-700 disabled:opacity-30 hover:bg-elegant-100 dark:hover:bg-elegant-800 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-secondary dark:text-gray-400">
                      {viewingIndex + 1} / {images.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => setViewingIndex(i => Math.min(images.length - 1, i + 1))}
                      disabled={viewingIndex === images.length - 1}
                      className="p-1.5 rounded-lg border border-elegant-200 dark:border-elegant-700 disabled:opacity-30 hover:bg-elegant-100 dark:hover:bg-elegant-800 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDeleteImage(images[viewingIndex])}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700 disabled:opacity-60"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            </div>
          </div>
        )}
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
