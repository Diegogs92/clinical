'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { auth, db, mockMode } from '@/lib/firebase';
import { UserProfile } from '@/types';
import { logger } from '@/lib/logger';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  googleAccessToken: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);

  // Cargar access token del localStorage al iniciar
  useEffect(() => {
    const savedToken = localStorage.getItem('google_access_token');
    if (savedToken) {
      setGoogleAccessToken(savedToken);
    }
  }, []);

  useEffect(() => {
    if (mockMode) {
      // Simulate async auth ready
      setTimeout(() => {
        const mockUser = { uid: 'mock', email: 'demo@local', displayName: 'Demo Usuario' } as unknown as User;
        setUser(mockUser);
        const mockProfile: UserProfile = {
          uid: 'mock',
            email: 'demo@local',
            displayName: 'Demo Usuario',
            photoURL: '',
            role: 'administrador', // Usuario mock es administrador
            defaultAppointmentDuration: 30,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        setUserProfile(mockProfile);
        setLoading(false);
      }, 300);
      return;
    }

    if (!auth || !db) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      logger.log('[AuthContext] onAuthStateChanged:', user?.email, user?.uid);
      setUser(user);

      if (user) {
        // Cargar access token del localStorage si existe y no ha expirado
        const savedToken = localStorage.getItem('google_access_token');
        const savedExpiry = localStorage.getItem('google_token_expires_at');

        if (savedToken && savedExpiry) {
          const expiresAt = parseInt(savedExpiry, 10);
          const now = Date.now();

          if (now < expiresAt) {
            logger.log('[AuthContext] Token válido recuperado del localStorage');
            setGoogleAccessToken(savedToken);
          } else {
            logger.log('[AuthContext] Token expirado, limpiando localStorage');
            localStorage.removeItem('google_access_token');
            localStorage.removeItem('google_token_expires_at');
            setGoogleAccessToken(null);
          }
        }

        if (!db) {
          logger.error('[AuthContext] Firestore no inicializado');
          setLoading(false);
          return;
        }
        try {
          const profileRef = doc(db!, 'userProfiles', user.uid);
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) {
            logger.log('[AuthContext] Perfil encontrado');
            setUserProfile(profileSnap.data() as UserProfile);
          } else {
            logger.log('[AuthContext] Perfil no existe, verificando invitaciones pendientes');

            // Verificar si hay una invitación pendiente para este email
            const pendingRef = doc(db!, 'pendingUsers', user.email || '');
            const pendingSnap = await getDoc(pendingRef);

            const username = (user.email || '').split('@')[0] || '';
            let newProfile: UserProfile;

            if (pendingSnap.exists()) {
              logger.log('[AuthContext] Invitación pendiente encontrada, creando perfil con rol asignado');
              const pendingData = pendingSnap.data();
              newProfile = {
                uid: user.uid,
                email: user.email || '',
                username,
                displayName: pendingData.displayName || user.displayName || username || '',
                photoURL: user.photoURL || '',
                role: pendingData.role || 'profesional',
                defaultAppointmentDuration: pendingData.defaultAppointmentDuration || 30,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };

              // Eliminar la invitación pendiente
              await deleteDoc(pendingRef);
              logger.log('[AuthContext] Invitación pendiente eliminada');
            } else {
              logger.log('[AuthContext] No hay invitación pendiente, creando perfil por defecto');
              newProfile = {
                uid: user.uid,
                email: user.email || '',
                username,
                displayName: user.displayName || username || '',
                photoURL: user.photoURL || '',
                role: 'profesional', // Por defecto, nuevos usuarios son profesionales
                defaultAppointmentDuration: 30,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
            }

            await setDoc(profileRef, newProfile);
            logger.log('[AuthContext] Perfil creado exitosamente');
            setUserProfile(newProfile);
          }
        } catch (error) {
          logger.error('[AuthContext] Error al manejar perfil:', error);
          setError('Error al crear perfil de usuario');
        }
      } else {
        // Usuario cerró sesión, limpiar perfil, error y token
        setUserProfile(null);
        setError(null);
        setGoogleAccessToken(null);
        localStorage.removeItem('google_access_token');
        localStorage.removeItem('google_token_expires_at');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (mockMode) {
      // Already simulated in effect
      return;
    }
    if (!auth) return;
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      // Solicitar scopes de Google Calendar
      provider.addScope('https://www.googleapis.com/auth/calendar');
      provider.addScope('https://www.googleapis.com/auth/calendar.events');
      provider.setCustomParameters({
        prompt: 'select_account',
        access_type: 'offline'
      });

      logger.log('[AuthContext] Iniciando signInWithPopup con scopes de Calendar');
      const result = await signInWithPopup(auth, provider);

      // Obtener el access token de Google
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        logger.log('[AuthContext] Access token obtenido');
        setGoogleAccessToken(credential.accessToken);
        // Guardar en localStorage con tiempo de expiración (1 hora por defecto)
        const expiresAt = Date.now() + (3600 * 1000); // 1 hora en ms
        localStorage.setItem('google_access_token', credential.accessToken);
        localStorage.setItem('google_token_expires_at', expiresAt.toString());
        logger.log('[AuthContext] Token guardado, expira en 1 hora');
      }
    } catch (e: any) {
      logger.error('[AuthContext] Error en signInWithGoogle:', e);
      if (e.code === 'auth/unauthorized-domain') {
        setError('Dominio no autorizado en Firebase. Verifica la configuración en Google Cloud Console.');
      } else if (e.code === 'auth/popup-blocked') {
        setError('Popup bloqueado. Permite popups para este sitio o usa otro navegador.');
      } else if (e.code === 'auth/popup-closed-by-user') {
        setError('Popup cerrado. Intenta nuevamente.');
      } else if (e.code === 'auth/cancelled-popup-request') {
        // Usuario cerró el popup, no mostrar error
        logger.log('[AuthContext] Usuario canceló el popup');
      } else {
        setError(e.message || 'Error al iniciar sesión con Google');
      }
      throw e;
    }
  };

  const signOut = async () => {
    if (mockMode) {
      setUser(null);
      setUserProfile(null);
      setError(null);
      return;
    }
    if (!auth) return;
    try {
      setError(null); // Limpiar error antes de cerrar sesión
      await firebaseSignOut(auth);
      setUserProfile(null);
    } catch (e: any) {
      setError(e.message || 'Error al cerrar sesión');
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, error, googleAccessToken, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
