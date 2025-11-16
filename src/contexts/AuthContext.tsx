'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, mockMode } from '@/lib/firebase';
import { UserProfile } from '@/types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setUser(user);

      if (user) {
        if (!db) return; // safety
        const profileRef = doc(db!, 'users', user.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          setUserProfile(profileSnap.data() as UserProfile);
        } else {
          const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
            defaultAppointmentDuration: 30,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await setDoc(profileRef, newProfile);
          setUserProfile(newProfile);
        }
      } else {
        setUserProfile(null);
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
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      setError(e.message || 'Error al iniciar sesión con Google');
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (mockMode) return; // mock ya autenticado
    if (!auth) return;
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e: any) {
      setError(e.message || 'Error al iniciar sesión');
      throw e;
    }
  };

  const registerWithEmail = async (email: string, password: string, displayName?: string) => {
    if (mockMode) return;
    if (!auth || !db) return;
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(cred.user, { displayName });
      }
      // Perfil se crea en el listener si no existe, podemos forzar displayName
    } catch (e: any) {
      setError(e.message || 'Error al registrar usuario');
      throw e;
    }
  };

  const signOut = async () => {
    if (mockMode) {
      setUser(null);
      setUserProfile(null);
      return;
    }
    if (!auth) return;
    try {
      await firebaseSignOut(auth);
      setUserProfile(null);
    } catch (e: any) {
      setError(e.message || 'Error al cerrar sesión');
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, error, signInWithGoogle, signInWithEmail, registerWithEmail, signOut }}>
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
