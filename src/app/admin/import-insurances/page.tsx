'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/contexts/ToastContext';
import { Upload } from 'lucide-react';

export default function ImportInsurancesPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [file, setFile] = useState<File | null>(null);

  const parseCSV = (text: string) => {
    const lines = text.split('\n');
    const insurances = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Parsear la línea teniendo en cuenta las comillas
      const values: string[] = [];
      let currentValue = '';
      let insideQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];

        if (char === '"') {
          insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
          values.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim());

      const [code, acronym, contact, name] = values;

      if (name) {
        insurances.push({ code, acronym, contact, name });
      }
    }

    return insurances;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!user) {
      toast.error('Debes estar autenticado');
      return;
    }

    if (!file) {
      toast.error('Selecciona un archivo CSV');
      return;
    }

    try {
      const text = await file.text();
      const insurancesData = parseCSV(text);

      const confirm = window.confirm(
        `¿Estás seguro de importar ${insurancesData.length} obras sociales? Esta operación no se puede deshacer.`
      );

      if (!confirm) return;

      setImporting(true);
      setTotal(insurancesData.length);
      let imported = 0;
      let errors = 0;

      for (const insurance of insurancesData) {
        try {
          const insuranceData = {
            code: insurance.code || '',
            acronym: insurance.acronym || '',
            name: insurance.name,
            type: 'obra-social' as const,
            phone: insurance.contact && !insurance.contact.includes('@') && !insurance.contact.includes('www')
              ? insurance.contact
              : '',
            email: insurance.contact && insurance.contact.includes('@')
              ? insurance.contact
              : '',
            website: insurance.contact && insurance.contact.includes('www')
              ? insurance.contact
              : '',
            notes: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userId: user.uid,
          };

          if (!db) {
            throw new Error('Database not initialized');
          }
          await addDoc(collection(db, 'insurances'), insuranceData);
          imported++;
          setProgress(imported);
        } catch (error) {
          console.error('Error importando:', insurance.name, error);
          errors++;
        }
      }

      toast.success(`✅ Importación completada: ${imported} obras sociales`);
      if (errors > 0) {
        toast.error(`❌ Errores: ${errors}`);
      }
    } catch (error) {
      console.error('Error general:', error);
      toast.error('Error al importar obras sociales');
    } finally {
      setImporting(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold text-primary-dark dark:text-white">
            Importar Obras Sociales
          </h1>

          <div className="card">
            <h2 className="font-semibold text-primary-dark dark:text-white mb-4">
              Seleccionar archivo CSV
            </h2>

            <div className="mb-4">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-10 h-10 mb-2 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Click para seleccionar</span> o arrastra el archivo
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">CSV (obras sociales.csv)</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".csv"
                  onChange={handleFileChange}
                />
              </label>

              {file && (
                <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                  ✓ Archivo seleccionado: {file.name}
                </p>
              )}
            </div>

            {importing && (
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Progreso:</span>
                  <span>{progress} / {total}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: total > 0 ? `${(progress / total) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleImport}
              disabled={importing || !file}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? 'Importando...' : 'Iniciar Importación'}
            </button>
          </div>

          <div className="card">
            <h2 className="font-semibold text-primary-dark dark:text-white mb-2">
              Instrucciones
            </h2>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300">
              <li>Descarga el archivo "obras sociales.csv"</li>
              <li>Selecciona el archivo usando el botón de arriba</li>
              <li>Haz clic en "Iniciar Importación"</li>
              <li>Espera a que el proceso complete</li>
              <li>Verifica las obras sociales en la sección correspondiente</li>
            </ol>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
