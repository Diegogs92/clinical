import { db, mockMode } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, deleteDoc, getDoc, getDocs, query, where, orderBy, Firestore } from 'firebase/firestore';
import { Appointment, RecurrenceRule } from '@/types';

const APPOINTMENTS_COLLECTION = 'appointments';
// In-memory mocks when mockMode is active
const mockAppointments: Appointment[] = [];

export async function createAppointment(data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date().toISOString();
  if (mockMode || !db) {
    const id = `mock-ap-${Date.now()}`;
    mockAppointments.push({ ...(data as Appointment), id, createdAt: now, updatedAt: now });
    return id;
  }
  const colRef = collection(db as Firestore, APPOINTMENTS_COLLECTION);
  const docRef = await addDoc(colRef, { ...data, createdAt: now, updatedAt: now });
  return docRef.id;
}

export async function updateAppointment(id: string, data: Partial<Appointment>) {
  if (mockMode || !db) {
    const idx = mockAppointments.findIndex(a => a.id === id);
    if (idx !== -1) mockAppointments[idx] = { ...mockAppointments[idx], ...data, updatedAt: new Date().toISOString() };
    return;
  }
  const docRef = doc(db as Firestore, APPOINTMENTS_COLLECTION, id);
  await updateDoc(docRef, { ...data, updatedAt: new Date().toISOString() });
}

export async function deleteAppointment(id: string) {
  if (mockMode || !db) {
    const idx = mockAppointments.findIndex(a => a.id === id);
    if (idx !== -1) mockAppointments.splice(idx, 1);
    return;
  }
  const docRef = doc(db as Firestore, APPOINTMENTS_COLLECTION, id);
  await deleteDoc(docRef);
}

export async function getAppointment(id: string): Promise<Appointment | null> {
  if (mockMode || !db) {
    return mockAppointments.find(a => a.id === id) || null;
  }
  const docRef = doc(db as Firestore, APPOINTMENTS_COLLECTION, id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  const data = snap.data() as Appointment;
  return { ...data, id: snap.id };
}

export async function getAppointmentsByUser(userId: string): Promise<Appointment[]> {
  if (mockMode || !db) {
    return mockAppointments.filter(a => a.userId === userId).sort((a,b) => a.date.localeCompare(b.date));
  }
  const colRef = collection(db as Firestore, APPOINTMENTS_COLLECTION);
  const q = query(colRef, where('userId', '==', userId), orderBy('date'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data() as Appointment, id: d.id }));
}

// Utility to expand recurrence (client-side only for now)
export function expandRecurrence(base: Appointment): Appointment[] {
  if (!base.isRecurrent || !base.recurrenceRule) return [base];
  const rule: RecurrenceRule = base.recurrenceRule;
  const occurrences: Appointment[] = [];
  const startDate = new Date(base.date);
  let count = 0;
  const max = rule.count || 10; // safeguard
  while (count < max) {
    const d = new Date(startDate);
    switch (rule.frequency) {
      case 'daily': d.setDate(startDate.getDate() + count * rule.interval); break;
      case 'weekly': d.setDate(startDate.getDate() + count * 7 * rule.interval); break;
      case 'biweekly': d.setDate(startDate.getDate() + count * 14 * rule.interval); break;
      case 'monthly': d.setMonth(startDate.getMonth() + count * rule.interval); break;
    }
    const iso = d.toISOString();
    if (rule.endDate && d > new Date(rule.endDate)) break;
    occurrences.push({ ...base, id: `${base.id}-${count}`, date: iso });
    count++;
  }
  return occurrences;
}
