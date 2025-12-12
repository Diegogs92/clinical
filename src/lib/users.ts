import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db, mockMode } from './firebase';
import { UserProfile } from '@/types';
import { logger } from './logger';

const COLLECTION_NAME = 'userProfiles';

/**
 * Obtener todos los usuarios
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  if (mockMode) {
    logger.log('[users] Mock mode: returning empty array');
    return [];
  }

  if (!db) {
    throw new Error('Firestore no está inicializado');
  }

  try {
    const usersRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(usersRef);

    const users: UserProfile[] = [];
    snapshot.forEach((doc) => {
      users.push({ ...doc.data(), uid: doc.id } as UserProfile);
    });

    // Ordenar en memoria por fecha de creación (más reciente primero)
    users.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    logger.log(`[users] Loaded ${users.length} users`);
    return users;
  } catch (error) {
    logger.error('[users] Error loading users:', error);
    throw error;
  }
}

/**
 * Obtener un usuario por ID
 */
export async function getUserById(uid: string): Promise<UserProfile | null> {
  if (mockMode) {
    logger.log('[users] Mock mode: getUserById');
    return null;
  }

  if (!db) {
    throw new Error('Firestore no está inicializado');
  }

  try {
    const userRef = doc(db, COLLECTION_NAME, uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return null;
    }

    return { ...userDoc.data(), uid: userDoc.id } as UserProfile;
  } catch (error) {
    logger.error('[users] Error getting user:', error);
    throw error;
  }
}

/**
 * Actualizar perfil de usuario (solo datos de Firestore, no de Auth)
 */
export async function updateUserProfile(
  uid: string,
  data: Partial<UserProfile>
): Promise<void> {
  if (mockMode) {
    logger.log('[users] Mock mode: updateUserProfile');
    return;
  }

  if (!db) {
    throw new Error('Firestore no está inicializado');
  }

  try {
    const userRef = doc(db, COLLECTION_NAME, uid);

    // Preparar datos para actualizar
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    // Eliminar campos que no se pueden actualizar
    delete (updateData as any).uid;
    delete (updateData as any).email;
    delete (updateData as any).createdAt;

    await updateDoc(userRef, updateData);
    logger.log(`[users] Updated user profile: ${uid}`);
  } catch (error) {
    logger.error('[users] Error updating user:', error);
    throw error;
  }
}

/**
 * Eliminar usuario (solo de Firestore, no de Auth)
 * NOTA: Para eliminar de Auth también, se debe usar Firebase Admin SDK
 */
export async function deleteUserProfile(uid: string): Promise<void> {
  if (mockMode) {
    logger.log('[users] Mock mode: deleteUserProfile');
    return;
  }

  if (!db) {
    throw new Error('Firestore no está inicializado');
  }

  try {
    const userRef = doc(db, COLLECTION_NAME, uid);
    await deleteDoc(userRef);
    logger.log(`[users] Deleted user profile: ${uid}`);
  } catch (error) {
    logger.error('[users] Error deleting user:', error);
    throw error;
  }
}

/**
 * Crear perfil de usuario (manual, para usuarios creados desde admin)
 */
export async function createUserProfile(
  uid: string,
  data: Omit<UserProfile, 'uid' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  if (mockMode) {
    logger.log('[users] Mock mode: createUserProfile');
    return;
  }

  if (!db) {
    throw new Error('Firestore no está inicializado');
  }

  try {
    const userRef = doc(db, COLLECTION_NAME, uid);
    const now = new Date().toISOString();

    const profileData: UserProfile = {
      ...data,
      uid,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(userRef, profileData);
    logger.log(`[users] Created user profile: ${uid}`);
  } catch (error) {
    logger.error('[users] Error creating user:', error);
    throw error;
  }
}
