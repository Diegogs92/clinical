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
} from 'firebase/firestore';
import { SchedulePreference } from '@/types';

const COLLECTION_NAME = 'schedulePreferences';

/**
 * Crear una nueva preferencia de horario
 */
export async function createSchedulePreference(
  data: Omit<SchedulePreference, 'id' | 'createdAt' | 'updatedAt'>
): Promise<SchedulePreference> {
  if (!db) throw new Error('Firestore not initialized');

  const now = new Date().toISOString();

  const preferenceData = {
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, COLLECTION_NAME), preferenceData);

  return {
    id: docRef.id,
    ...preferenceData,
  };
}

/**
 * Obtener todas las preferencias de horario
 */
export async function getAllSchedulePreferences(): Promise<SchedulePreference[]> {
  if (!db) throw new Error('Firestore not initialized');

  const snapshot = await getDocs(collection(db, COLLECTION_NAME));

  const results = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as SchedulePreference[];

  return results.sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));
}

/**
 * Obtener preferencias de horario para un día de la semana específico
 */
export async function getSchedulePreferencesByDay(
  dayOfWeek: number
): Promise<SchedulePreference[]> {
  if (!db) throw new Error('Firestore not initialized');

  const q = query(
    collection(db, COLLECTION_NAME),
    where('dayOfWeek', '==', dayOfWeek)
  );

  const snapshot = await getDocs(q);

  const results = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as SchedulePreference[];

  return results.sort((a, b) => a.startTime.localeCompare(b.startTime));
}

/**
 * Obtener preferencias de horario para un profesional específico
 */
export async function getSchedulePreferencesByProfessional(
  professionalId: string
): Promise<SchedulePreference[]> {
  if (!db) throw new Error('Firestore not initialized');

  const q = query(
    collection(db, COLLECTION_NAME),
    where('professionalId', '==', professionalId)
  );

  const snapshot = await getDocs(q);

  const results = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as SchedulePreference[];

  return results.sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));
}

/**
 * Encontrar qué profesional tiene preferencia para un día/hora específicos
 */
export async function getPreferenceForTimeSlot(
  dayOfWeek: number,
  time: string,
  sessionType?: 'normal' | 'estetica'
): Promise<SchedulePreference | null> {
  const preferences = await getSchedulePreferencesByDay(dayOfWeek);

  const timeMinutes = timeToMinutes(time);

  // Buscar preferencia que contenga este tiempo
  const matching = preferences.find(pref => {
    const startMinutes = timeToMinutes(pref.startTime);
    const endMinutes = timeToMinutes(pref.endTime);

    const inTimeRange = timeMinutes >= startMinutes && timeMinutes < endMinutes;

    // Si se especifica tipo de sesión, verificar que coincida
    if (sessionType && pref.sessionType && pref.sessionType !== 'any') {
      return inTimeRange && pref.sessionType === sessionType;
    }

    return inTimeRange;
  });

  return matching || null;
}

/**
 * Actualizar una preferencia de horario
 */
export async function updateSchedulePreference(
  id: string,
  data: Partial<Omit<SchedulePreference, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');

  const docRef = doc(db, COLLECTION_NAME, id);

  await updateDoc(docRef, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Eliminar una preferencia de horario
 */
export async function deleteSchedulePreference(id: string): Promise<void> {
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
 * Seed inicial de preferencias de horario según los requerimientos
 */
export async function seedSchedulePreferences(professionals: { romi: string; jime: string; paula: string }): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');

  // Limpiar preferencias existentes primero
  const existing = await getAllSchedulePreferences();
  for (const pref of existing) {
    await deleteSchedulePreference(pref.id);
  }

  const now = new Date().toISOString();

  const preferences = [
    // Lunes (1): 9-10 Romi, 11-16 Jime, 17:15-19:30 Romi
    {
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '10:00',
      professionalId: professionals.romi,
      professionalName: 'Romi',
      sessionType: 'any',
      createdAt: now,
      updatedAt: now,
    },
    {
      dayOfWeek: 1,
      startTime: '11:00',
      endTime: '16:00',
      professionalId: professionals.jime,
      professionalName: 'Jime',
      sessionType: 'any',
      createdAt: now,
      updatedAt: now,
    },
    {
      dayOfWeek: 1,
      startTime: '17:15',
      endTime: '19:30',
      professionalId: professionals.romi,
      professionalName: 'Romi',
      sessionType: 'any',
      createdAt: now,
      updatedAt: now,
    },
    // Martes (2): 9-11:30 Romi, 17:15-19:00 Romi
    {
      dayOfWeek: 2,
      startTime: '09:00',
      endTime: '11:30',
      professionalId: professionals.romi,
      professionalName: 'Romi',
      sessionType: 'any',
      createdAt: now,
      updatedAt: now,
    },
    {
      dayOfWeek: 2,
      startTime: '17:15',
      endTime: '19:00',
      professionalId: professionals.romi,
      professionalName: 'Romi',
      sessionType: 'any',
      createdAt: now,
      updatedAt: now,
    },
    // Jueves (4): 15-18:30 Romi
    {
      dayOfWeek: 4,
      startTime: '15:00',
      endTime: '18:30',
      professionalId: professionals.romi,
      professionalName: 'Romi',
      sessionType: 'any',
      createdAt: now,
      updatedAt: now,
    },
    // Viernes (5): 13:30-17:30 Paula (puede tomar sesiones estéticas de Romi)
    {
      dayOfWeek: 5,
      startTime: '13:30',
      endTime: '17:30',
      professionalId: professionals.paula,
      professionalName: 'Paula',
      sessionType: 'any',
      notes: 'Puede tomar sesiones estéticas de Romi',
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const pref of preferences) {
    await addDoc(collection(db, COLLECTION_NAME), pref);
  }

  console.log(`✅ Seeded ${preferences.length} schedule preferences`);
}
