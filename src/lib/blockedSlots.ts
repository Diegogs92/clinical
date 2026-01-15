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
    recurrence?: 'none' | 'weekly' | 'monthly';
    exceptions?: string[];
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

  const slots = await getBlockedSlotsByUser(userId);
  return slots
    .filter(slot => isBlockedSlotActiveOnDate(slot, date))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
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
    recurrence: 'none' | 'weekly' | 'monthly';
    exceptions: string[];
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

function parseDateParts(date: string): { year: number; month: number; day: number } | null {
  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day) return null;
  return { year, month, day };
}

function compareDateParts(a: string, b: string): number {
  const left = parseDateParts(a);
  const right = parseDateParts(b);
  if (!left || !right) return 0;
  const leftValue = left.year * 10000 + left.month * 100 + left.day;
  const rightValue = right.year * 10000 + right.month * 100 + right.day;
  return leftValue - rightValue;
}

function dayOfWeek(date: string): number | null {
  const parts = parseDateParts(date);
  if (!parts) return null;
  return new Date(parts.year, parts.month - 1, parts.day).getDay();
}

export function isBlockedSlotActiveOnDate(slot: BlockedSlot, date: string): boolean {
  if (!slot || !date) return false;
  if (slot.exceptions?.includes(date)) return false;

  const recurrence = slot.recurrence ?? 'none';
  if (recurrence === 'none') return slot.date === date;

  if (compareDateParts(date, slot.date) < 0) return false;

  if (recurrence === 'weekly') {
    const slotDay = dayOfWeek(slot.date);
    const targetDay = dayOfWeek(date);
    return slotDay !== null && targetDay !== null && slotDay === targetDay;
  }

  if (recurrence === 'monthly') {
    const slotParts = parseDateParts(slot.date);
    const targetParts = parseDateParts(date);
    return !!slotParts && !!targetParts && slotParts.day === targetParts.day;
  }

  return slot.date === date;
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
