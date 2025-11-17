import { db, mockMode } from '@/lib/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, query, where, orderBy, Firestore } from 'firebase/firestore';
import { MedicalHistory } from '@/types';
import { MedicalHistorySchema } from './schemas';
import { logger } from './logger';
import { loadFromLocalStorage, saveToLocalStorage } from './mockStorage';

const HISTORY_COLLECTION = 'medicalHistory';
const mockHistory: MedicalHistory[] = loadFromLocalStorage<MedicalHistory>('medicalHistory');

export async function createMedicalHistory(data: Omit<MedicalHistory, 'id' | 'createdAt'>) {
  const now = new Date().toISOString();
  if (mockMode || !db) {
    const id = `mock-hist-${Date.now()}`;
    mockHistory.push({ ...data, id, createdAt: now });
    saveToLocalStorage('medicalHistory', mockHistory);
    return id;
  }
  const colRef = collection(db as Firestore, HISTORY_COLLECTION);
  const docRef = await addDoc(colRef, { ...data, createdAt: now });
  return docRef.id;
}

export async function updateMedicalHistory(id: string, data: Partial<MedicalHistory>) {
  if (mockMode || !db) {
    const idx = mockHistory.findIndex(h => h.id === id);
    if (idx !== -1) {
      mockHistory[idx] = { ...mockHistory[idx], ...data };
      saveToLocalStorage('medicalHistory', mockHistory);
    }
    return;
  }
  const docRef = doc(db as Firestore, HISTORY_COLLECTION, id);
  await updateDoc(docRef, data);
}

export async function deleteMedicalHistory(id: string) {
  if (mockMode || !db) {
    const idx = mockHistory.findIndex(h => h.id === id);
    if (idx !== -1) {
      mockHistory.splice(idx, 1);
      saveToLocalStorage('medicalHistory', mockHistory);
    }
    return;
  }
  const docRef = doc(db as Firestore, HISTORY_COLLECTION, id);
  await deleteDoc(docRef);
}

export async function getMedicalHistory(id: string): Promise<MedicalHistory | null> {
  if (mockMode || !db) return mockHistory.find(h => h.id === id) || null;
  const docRef = doc(db as Firestore, HISTORY_COLLECTION, id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;

  try {
    return MedicalHistorySchema.parse({ ...snap.data(), id: snap.id });
  } catch (error) {
    logger.error('Error validating medical history data:', error);
    return null;
  }
}

export async function getMedicalHistoryByPatient(patientId: string): Promise<MedicalHistory[]> {
  if (mockMode || !db) {
    return mockHistory
      .filter(h => h.patientId === patientId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }
  const colRef = collection(db as Firestore, HISTORY_COLLECTION);
  const q = query(colRef, where('patientId', '==', patientId), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    try {
      return MedicalHistorySchema.parse({ ...d.data(), id: d.id });
    } catch (error) {
      logger.error('Error validating medical history data:', error);
      return null;
    }
  }).filter((h): h is MedicalHistory => h !== null);
}
