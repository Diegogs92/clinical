'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { LogIn, Loader2, Mail } from 'lucide-react';

export default function LoginPage() {
  const { signInWithGoogle, signInWithEmail, registerWithEmail, error } = useAuth();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleGoogleSignIn = async () => {
    setLoadingGoogle(true);
    setLocalError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setLocalError('Error al iniciar sesión con Google');
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingEmail(true);
    setLocalError(null);
    try {
      if (isRegisterMode) {
        await registerWithEmail(email, password, displayName);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err) {
      setLocalError(isRegisterMode ? 'Error al registrar' : 'Error al iniciar sesión');
    } finally {
      setLoadingEmail(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary-dark to-secondary p-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4 shadow-lg">
            <span className="text-4xl font-bold text-primary">C</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">ClinicPro</h1>
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
            Accede con Google o con tu correo electrónico
          </p>

          {(error || localError) && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error || localError}
            </div>
          )}

          <form onSubmit={handleEmailSubmit} className="space-y-4 mb-6">
            {isRegisterMode && (
              <div>
                <label className="block text-sm font-medium text-primary-dark mb-1">Nombre</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full border border-secondary-lighter rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Tu nombre" required
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-primary-dark mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-secondary-lighter rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="correo@example.com" required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-dark mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-secondary-lighter rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="******" required
              />
            </div>
            <button
              type="submit"
              disabled={loadingEmail}
              className="w-full flex items-center justify-center gap-3 bg-primary text-white font-semibold py-3 px-6 rounded-lg hover:bg-primary-dark transition disabled:opacity-50"
            >
              {loadingEmail ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{isRegisterMode ? 'Creando cuenta...' : 'Ingresando...'}</span>
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  <span>{isRegisterMode ? 'Registrarme' : 'Ingresar'}</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsRegisterMode(m => !m)}
              className="w-full text-sm text-primary-dark hover:underline"
            >
              {isRegisterMode ? 'Ya tengo cuenta, iniciar sesión' : 'Crear nueva cuenta'}
            </button>
          </form>

          <button
            onClick={handleGoogleSignIn}
            disabled={loadingGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-primary hover:bg-primary hover:text-white text-primary-dark font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingGoogle ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Conectando...</span>
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
            <div className="font-semibold mb-1">🗓️ Agenda</div>
            <div className="text-secondary-lighter">Gestión de turnos</div>
          </div>
          <div className="text-center">
            <div className="font-semibold mb-1">👥 Pacientes</div>
            <div className="text-secondary-lighter">Fichas completas</div>
          </div>
          <div className="text-center">
            <div className="font-semibold mb-1">💰 Honorarios</div>
            <div className="text-secondary-lighter">Control financiero</div>
          </div>
          <div className="text-center">
            <div className="font-semibold mb-1">🏥 Obras Sociales</div>
            <div className="text-secondary-lighter">Autorizaciones</div>
          </div>
        </div>
      </div>
    </div>
  );
}
