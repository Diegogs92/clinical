'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ECGLoader from '@/components/ui/ECGLoader';
import { debugFirebaseAuth } from '@/lib/authDebug';

const GoogleLogo = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 48 48"
    className="w-5 h-5"
    aria-hidden="true"
  >
    <path
      fill="#4285F4"
      d="M24 9.5c3.3 0 6.1 1.1 8.4 2.9l6.3-6.3C33.6 2.4 29.1 0 24 0 14.8 0 6.9 5.5 3 13.5l7.4 5.7C12.4 11.2 17.7 9.5 24 9.5z"
    />
    <path
      fill="#34A853"
      d="M46.5 24c0-1.6-.1-2.6-.4-3.8H24v7.2h12.9c-.6 3.6-3.1 6.9-6.9 8.9l7.2 5.6C43.4 38.7 46.5 31.8 46.5 24z"
    />
    <path
      fill="#FBBC05"
      d="M10.4 28.2A14.9 14.9 0 0 1 9.5 24c0-1.4.3-2.7.9-3.9l-7.4-5.7C.9 15.2 0 19.5 0 24s.9 8.8 3.9 12.3l6.5-6.1z"
    />
    <path
      fill="#EA4335"
      d="M24 48c5.5 0 10.1-1.8 13.4-4.9l-7.2-5.6c-2 1.4-4.6 2.5-6.9 2.5-6.3 0-11.6-3.7-13.5-9l-6.5 5C6.9 42.5 14.8 48 24 48z"
    />
  </svg>
);

export default function LoginPage() {
  const { user, loading: authLoading, signInWithGoogle, error } = useAuth();
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      console.log('[LoginPage] Usuario autenticado, redirigiendo a dashboard');
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    // Solo en desarrollo o si hay parámetros de debug
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
      // El redirect se maneja en el useEffect
    } catch (err) {
      setLocalError('Error al iniciar sesión con Google');
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
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Image src="/logo.svg" alt="Clinical" width={80} height={80} priority />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Clinical</h1>
          <p className="text-white/90 text-lg font-medium drop-shadow-lg">
            Sistema de Gestión para Profesionales de Salud
          </p>
        </div>

        {/* Login Card */}
        <div className="card bg-white/95 dark:bg-gray-900/80 border border-white/40 dark:border-gray-700/60 backdrop-blur">
          <h2 className="text-2xl font-semibold text-primary-dark mb-6 text-center">
            Bienvenido
          </h2>
          
          <p className="text-secondary text-center mb-6">
            Inicia sesión con tu cuenta de Google para acceder al sistema
          </p>

          {(error || localError) && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error || localError}
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-800 border-2 border-primary hover:bg-primary hover:text-white text-primary-dark dark:text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
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
                Iniciando sesión...
              </span>
            ) : (
              <>
                <GoogleLogo />
                <span>Iniciar sesión con Google</span>
              </>
            )}
          </button>

          <div className="mt-6 text-center text-sm text-secondary">
            <p>Al iniciar sesión, aceptas nuestros términos de servicio</p>
          </div>
        </div>

        {/* Features */}
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
