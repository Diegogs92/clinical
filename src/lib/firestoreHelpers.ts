import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, Timestamp } from 'firebase/firestore';
import { db, mockMode } from './firebase';
import type { Patient, Appointment, Insurance, Payment, UserProfile } from '@/types';

// In-memory fallback stores for mockMode
const mem = {
  patients: new Map<string, Patient>(),
  appointments: new Map<string, Appointment>(),
  insurances: new Map<string, Insurance>(),
  payments: new Map<string, Payment>(),
  userProfiles: new Map<string, UserProfile>(),
};

function genId() { return Math.random().toString(36).slice(2, 11); }
function nowISO() { return new Date().toISOString(); }

// Generic helpers
export async function getById<T>(col: string, id: string): Promise<T | null> {
  if (mockMode) {
    // @ts-ignore
    return mem[col]?.get(id) || null;
  }
  if (!db) return null;
  const snap = await getDoc(doc(db, col, id));
  return snap.exists() ? (snap.data() as T) : null;
}

export async function listByUser<T>(col: string, userId: string): Promise<T[]> {
  if (mockMode) {
    // @ts-ignore
    return Array.from(mem[col].values()).filter((d: any) => d.userId === userId);
  }
  if (!db) return [];
  const q = query(collection(db, col), where('userId', '==', userId));
  const snaps = await getDocs(q);
  return snaps.docs.map(d => d.data() as T);
}

export async function createDoc<T extends { id?: string; createdAt?: string; updatedAt?: string }>(col: string, data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
  const id = genId();
  const base: T = { ...(data as any), id, createdAt: nowISO(), updatedAt: nowISO() };
  if (mockMode) {
    // @ts-ignore
    mem[col].set(id, base);
    return base;
  }
  if (!db) return base;
  await addDoc(collection(db, col), base as any);
  return base;
}

export async function updateDocById<T extends { updatedAt?: string }>(col: string, id: string, partial: Partial<T>): Promise<void> {
  if (mockMode) {
    // @ts-ignore
    const current = mem[col].get(id);
    if (current) {
      // @ts-ignore
      mem[col].set(id, { ...current, ...partial, updatedAt: nowISO() });
    }
    return;
  }
  if (!db) return;
  await updateDoc(doc(db, col, id), { ...partial, updatedAt: nowISO() } as any);
}

export async function deleteById(col: string, id: string): Promise<void> {
  if (mockMode) {
    // @ts-ignore
    mem[col].delete(id);
    return;
  }
  if (!db) return;
  await deleteDoc(doc(db, col, id));
}

// Domain specific convenience wrappers
// Patients
export const getPatient = (id: string) => getById<Patient>('patients', id);
export const listPatients = (userId: string) => listByUser<Patient>('patients', userId);
export const createPatient = (data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => createDoc<Patient>('patients', data);
export const updatePatient = (id: string, partial: Partial<Patient>) => updateDocById<Patient>('patients', id, partial);
export const deletePatient = (id: string) => deleteById('patients', id);

// Appointments
export const getAppointment = (id: string) => getById<Appointment>('appointments', id);
export const listAppointments = (userId: string) => listByUser<Appointment>('appointments', userId);
export const createAppointment = (data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => createDoc<Appointment>('appointments', data);
export const updateAppointment = (id: string, partial: Partial<Appointment>) => updateDocById<Appointment>('appointments', id, partial);
export const deleteAppointment = (id: string) => deleteById('appointments', id);

// Insurances
export const getInsurance = (id: string) => getById<Insurance>('insurances', id);
export const listInsurances = (userId: string) => listByUser<Insurance>('insurances', userId);
export const createInsurance = (data: Omit<Insurance, 'id' | 'createdAt' | 'updatedAt'>) => createDoc<Insurance>('insurances', data);
export const updateInsurance = (id: string, partial: Partial<Insurance>) => updateDocById<Insurance>('insurances', id, partial);
export const deleteInsurance = (id: string) => deleteById('insurances', id);

// UserProfiles
export const getUserProfile = (id: string) => getById<UserProfile>('userProfiles', id);
export const createUserProfile = (data: Omit<UserProfile, 'createdAt' | 'updatedAt'>) => createDoc<UserProfile>('userProfiles', data as any);
export const updateUserProfile = (id: string, partial: Partial<UserProfile>) => updateDocById<UserProfile>('userProfiles', id, partial);

// Payments (simple list & CRUD)
export const getPayment = (id: string) => getById<Payment>('payments', id);
export const listPayments = (userId: string) => listByUser<Payment>('payments', userId);
export const createPayment = (data: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>) => createDoc<Payment>('payments', data);
export const updatePayment = (id: string, partial: Partial<Payment>) => updateDocById<Payment>('payments', id, partial);
export const deletePayment = (id: string) => deleteById('payments', id);

// Util para seed rapido en mockMode
export async function seedMockData(userId: string) {
  if (!mockMode) return;
  if (mem.patients.size) return; // evitar duplicado
  await createPatient({
    userId,
    firstName: 'Juan',
    lastName: 'Pérez',
    dni: '12345678',
    phone: '+54 11 5555 1111',
    email: 'juan.perez@example.com',
    notes: 'Paciente demo',
    insuranceId: undefined,
    insuranceNumber: undefined,
    birthDate: '1985-05-10',
    address: 'Calle Falsa 123'
  });
}
