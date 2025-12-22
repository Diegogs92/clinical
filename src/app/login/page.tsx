'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ECGLoader from '@/components/ui/ECGLoader';
import { debugFirebaseAuth } from '@/lib/authDebug';

export default function LoginPage() {
  const { user, loading: authLoading, signInWithGoogle, error } = useAuth();
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.search.includes('debug=true'))) {
      debugFirebaseAuth();
    }
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setLocalError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setLocalError(err?.message || 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary-dark to-secondary">
        <ECGLoader className="text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary-dark to-secondary p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Image src="/logo.svg" alt="DENTIFY" width={80} height={80} priority />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">DENTIFY</h1>
          <p className="text-white/90 text-lg font-medium drop-shadow-lg">
            Asistente de Gestión Odontológica
          </p>
        </div>

        <div className="card glass-panel border border-white/50 dark:border-elegant-800/70 shadow-xl">

          {(error || localError) && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error || localError}
            </div>
          )}
          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white text-primary-dark font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 120 60" className="animate-pulse">
                    <path
                      d="M0,30 L15,30 L18,10 L21,50 L24,30 L30,30 L33,25 L36,35 L39,30 L120,30"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  Iniciando...
                </span>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.935 32.42 29.385 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.965 3.035l5.657-5.657C34.058 6.053 29.279 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20c11.045 0 20-8.955 20-20 0-1.341-.138-2.651-.389-3.917z"/>
                    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 16.138 19.01 12 24 12c3.059 0 5.842 1.154 7.965 3.035l5.657-5.657C34.058 6.053 29.279 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                    <path fill="#4CAF50" d="M24 44c5.292 0 10.05-2.026 13.621-5.314l-6.285-5.316C29.245 35.086 26.76 36 24 36c-5.364 0-9.906-3.556-11.289-8.443l-6.5 5.012C9.52 39.556 16.218 44 24 44z"/>
                    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.055 2.828-3.16 5.188-6.017 6.57l6.285 5.316C39.969 36.206 44 30.702 44 24c0-1.341-.138-2.651-.389-3.917z"/>
                  </svg>
                  Continuar con Google
                </>
              )}
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-secondary">
            <p>Acceso exclusivo con Google para habilitar la sincronización de Calendar.</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 text-white text-sm">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 font-semibold mb-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="2"/>
                <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/>
                <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Agenda
            </div>
            <div className="text-secondary-lighter">Gestión de turnos</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 font-semibold mb-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Pacientes
            </div>
            <div className="text-secondary-lighter">Fichas completas</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 font-semibold mb-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Honorarios
            </div>
            <div className="text-secondary-lighter">Control financiero</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 font-semibold mb-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
              </svg>
              Obras Sociales
            </div>
            <div className="text-secondary-lighter">Autorizaciones</div>
          </div>
        </div>
      </div>
    </div>
  );
}
