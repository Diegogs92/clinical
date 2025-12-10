'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ECGLoader from '@/components/ui/ECGLoader';
import { debugFirebaseAuth } from '@/lib/authDebug';

export default function LoginPage() {
  const { user, loading: authLoading, signInWithEmail, registerWithEmail, error } = useAuth();
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const router = useRouter();

  const buildEmail = (u: string) => `${u.trim().toLowerCase()}@dentify.local`;

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

  const handleSubmit = async () => {
    setLoading(true);
    setLocalError(null);
    try {
      const aliasEmail = buildEmail(username);
      if (mode === 'login') {
        await signInWithEmail(aliasEmail, password);
      } else {
        await registerWithEmail(aliasEmail, password, displayName || username);
      }
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
          <div className="flex items-center justify-center gap-2 mb-6">
            <button
              className={`flex-1 py-2 rounded-full font-semibold transition ${mode === 'login' ? 'bg-primary text-white shadow' : 'text-primary-dark dark:text-white bg-elegant-100 dark:bg-elegant-800'}`}
              onClick={() => setMode('login')}
            >
              Iniciar sesión
            </button>
            <button
              className={`flex-1 py-2 rounded-full font-semibold transition ${mode === 'register' ? 'bg-primary text-white shadow' : 'text-primary-dark dark:text-white bg-elegant-100 dark:bg-elegant-800'}`}
              onClick={() => setMode('register')}
            >
              Crear cuenta
            </button>
          </div>

          {(error || localError) && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error || localError}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-secondary dark:text-gray-300">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field w-full"
                placeholder="Ej: romina"
                autoComplete="username"
              />
            </div>
            {mode === 'register' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-secondary dark:text-gray-300">Nombre</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="input-field w-full"
                  placeholder="Ej: Romina Fernández"
                  autoComplete="name"
                />
              </div>
            )}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-secondary dark:text-gray-300">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field w-full"
                placeholder="********"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading || !username || !password}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  {mode === 'login' ? 'Ingresando...' : 'Creando cuenta...'}
                </span>
              ) : (
                <span>{mode === 'login' ? 'Entrar' : 'Crear cuenta'}</span>
              )}
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-secondary">
            <p>Acceso por email y contraseña. Sin Google Calendar por ahora.</p>
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
