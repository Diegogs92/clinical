'use client';

import { useAuth } from '@/contexts/AuthContext';
import ECGLoader from './ui/ECGLoader';

export default function GlobalLoader() {
  const { loading } = useAuth();

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-pearl/95 dark:bg-navy-darkest/95 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6">
        <ECGLoader className="text-primary" />
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-2xl font-bold text-primary dark:text-primary-light">DENTIFY</h2>
          <p className="text-sm text-elegant-600 dark:text-elegant-400 animate-pulse">
            Cargando tu asistente odontológico...
          </p>
        </div>
      </div>
    </div>
  );
}
