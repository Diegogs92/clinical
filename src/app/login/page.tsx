'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Loader2 } from 'lucide-react';
import Image from 'next/image';

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
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary-dark to-secondary p-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Image src="/logo.svg" alt="Clnical" width={80} height={80} priority />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Clnical</h1>
          <p className="text-secondary-lighter text-lg">
            Sistema de Gestión para Profesionales de Salud
          </p>
        </div>

        {/* Login Card */}
        <div className="card bg-white/95 backdrop-blur">
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
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-primary hover:bg-primary hover:text-white text-primary-dark font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Iniciando sesión...</span>
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
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
