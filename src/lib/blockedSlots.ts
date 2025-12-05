import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { BlockedSlot } from '@/types';

const COLLECTION_NAME = 'blockedSlots';

/**
 * Crear una nueva franja bloqueada
 */
export async function createBlockedSlot(
  userId: string,
  data: {
    date: string;
    startTime: string;
    endTime: string;
    reason: string;
  }
): Promise<BlockedSlot> {
  if (!db) throw new Error('Firestore not initialized');

  const now = new Date().toISOString();

  const blockedSlotData = {
    ...data,
    userId,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, COLLECTION_NAME), blockedSlotData);

  return {
    id: docRef.id,
    ...blockedSlotData,
  };
}

/**
 * Obtener todas las franjas bloqueadas de un usuario
 */
export async function getBlockedSlotsByUser(userId: string): Promise<BlockedSlot[]> {
  if (!db) throw new Error('Firestore not initialized');

  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId),
    orderBy('date', 'asc'),
    orderBy('startTime', 'asc')
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as BlockedSlot[];
}

/**
 * Obtener franjas bloqueadas para una fecha específica
 */
export async function getBlockedSlotsByDate(
  userId: string,
  date: string
): Promise<BlockedSlot[]> {
  if (!db) throw new Error('Firestore not initialized');

  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId),
    where('date', '==', date),
    orderBy('startTime', 'asc')
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as BlockedSlot[];
}

/**
 * Verificar si un horario específico está bloqueado
 */
export async function isTimeSlotBlocked(
  userId: string,
  date: string,
  time: string
): Promise<boolean> {
  const blockedSlots = await getBlockedSlotsByDate(userId, date);

  const timeMinutes = timeToMinutes(time);

  return blockedSlots.some(slot => {
    const startMinutes = timeToMinutes(slot.startTime);
    const endMinutes = timeToMinutes(slot.endTime);

    return timeMinutes >= startMinutes && timeMinutes < endMinutes;
  });
}

/**
 * Actualizar una franja bloqueada
 */
export async function updateBlockedSlot(
  id: string,
  data: Partial<{
    date: string;
    startTime: string;
    endTime: string;
    reason: string;
  }>
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');

  const docRef = doc(db, COLLECTION_NAME, id);

  await updateDoc(docRef, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Eliminar una franja bloqueada
 */
export async function deleteBlockedSlot(id: string): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');

  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
}

/**
 * Convertir hora en formato HH:mm a minutos desde medianoche
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Verificar si un rango de tiempo se solapa con franjas bloqueadas
 */
export async function hasBlockedSlotsInRange(
  userId: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<boolean> {
  const blockedSlots = await getBlockedSlotsByDate(userId, date);

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  return blockedSlots.some(slot => {
    const slotStartMinutes = timeToMinutes(slot.startTime);
    const slotEndMinutes = timeToMinutes(slot.endTime);

    // Verifica si hay solapamiento
    return (
      (startMinutes >= slotStartMinutes && startMinutes < slotEndMinutes) ||
      (endMinutes > slotStartMinutes && endMinutes <= slotEndMinutes) ||
      (startMinutes <= slotStartMinutes && endMinutes >= slotEndMinutes)
    );
  });
}

/**
 * Obtener las franjas bloqueadas que se solapan con un rango de tiempo
 */
export async function getBlockedSlotsInRange(
  userId: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<BlockedSlot[]> {
  console.log('🔎 getBlockedSlotsInRange llamada con:', { userId, date, startTime, endTime });

  const blockedSlots = await getBlockedSlotsByDate(userId, date);
  console.log('📋 Franjas bloqueadas encontradas para la fecha:', blockedSlots);

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  const overlapping = blockedSlots.filter(slot => {
    const slotStartMinutes = timeToMinutes(slot.startTime);
    const slotEndMinutes = timeToMinutes(slot.endTime);

    // Verifica si hay solapamiento
    const hasOverlap = (
      (startMinutes >= slotStartMinutes && startMinutes < slotEndMinutes) ||
      (endMinutes > slotStartMinutes && endMinutes <= slotEndMinutes) ||
      (startMinutes <= slotStartMinutes && endMinutes >= slotEndMinutes)
    );

    console.log('🔍 Verificando solapamiento:', {
      slot: `${slot.startTime} - ${slot.endTime}`,
      appointment: `${startTime} - ${endTime}`,
      slotMinutes: `${slotStartMinutes} - ${slotEndMinutes}`,
      appointmentMinutes: `${startMinutes} - ${endMinutes}`,
      hasOverlap,
    });

    return hasOverlap;
  });

  console.log('✅ Franjas bloqueadas que se solapan:', overlapping);
  return overlapping;
}
