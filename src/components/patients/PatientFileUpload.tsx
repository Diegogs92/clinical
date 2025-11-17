'use client';

import { useState } from 'react';
import { Upload, File, X } from 'lucide-react';
import { uploadPatientFile } from '@/lib/patients';
import { PatientFile } from '@/types';

interface Props {
  patientId: string;
  onUpload?: (file: PatientFile) => void;
}

export default function PatientFileUpload({ patientId, onUpload }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<PatientFile[]>([]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    setUploading(true);

    try {
      const file = files[0];

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('El archivo no puede ser mayor a 10MB');
        setUploading(false);
        return;
      }

      // Validate file type (documents and images only)
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/jpg',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!allowedTypes.includes(file.type)) {
        setError('Tipo de archivo no permitido. Solo PDF, imágenes y documentos Word.');
        setUploading(false);
        return;
      }

      const uploadedFile = await uploadPatientFile(patientId, file);
      setUploadedFiles(prev => [...prev, uploadedFile]);

      if (onUpload) {
        onUpload(uploadedFile);
      }

      // Reset input
      e.target.value = '';
    } catch (err) {
      setError('Error al subir el archivo. Por favor, intenta nuevamente.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-primary-dark dark:text-white mb-2">
          Archivos adjuntos
        </label>
        <div className="border-2 border-dashed border-secondary-lighter dark:border-gray-600 rounded-lg p-6 text-center hover:border-accent dark:hover:border-accent transition-colors">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploading}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            aria-label="Subir archivo"
          />
          <label
            htmlFor="file-upload"
            className={`cursor-pointer flex flex-col items-center ${uploading ? 'opacity-50' : ''}`}
          >
            <Upload className="w-10 h-10 text-secondary dark:text-gray-400 mb-2" />
            <span className="text-sm text-secondary dark:text-gray-400">
              {uploading ? 'Subiendo archivo...' : 'Haz clic para seleccionar un archivo'}
            </span>
            <span className="text-xs text-secondary dark:text-gray-500 mt-1">
              PDF, imágenes o Word (máx. 10MB)
            </span>
          </label>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-primary-dark dark:text-white">
            Archivos subidos
          </h4>
          <ul className="space-y-2">
            {uploadedFiles.map(file => (
              <li
                key={file.id}
                className="flex items-center justify-between bg-secondary-lighter/30 dark:bg-gray-700 rounded-lg p-3"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <File className="w-5 h-5 text-accent flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-primary-dark dark:text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-secondary dark:text-gray-400">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(file.id)}
                  className="flex-shrink-0 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors ml-2"
                  aria-label="Eliminar archivo"
                >
                  <X className="w-5 h-5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
