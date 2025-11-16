import { db, mockMode } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, where, Firestore } from 'firebase/firestore';
import { Insurance, Authorization, InsuranceFee } from '@/types';

const INS_COLLECTION = 'insurances';
const AUTH_COLLECTION = 'authorizations';
const FEES_COLLECTION = 'insurance-fees';
// Mock stores
const mockInsurances: Insurance[] = [];
const mockAuthorizations: Authorization[] = [];
const mockFees: InsuranceFee[] = [];

export async function createInsurance(data: Omit<Insurance,'id'|'createdAt'|'updatedAt'>) {
  const now = new Date().toISOString();
  if (mockMode || !db) {
    const id = `mock-ins-${Date.now()}`;
    mockInsurances.push({ ...(data as Insurance), id, createdAt: now, updatedAt: now });
    return id;
  }
  const colRef = collection(db as Firestore, INS_COLLECTION);
  const docRef = await addDoc(colRef, { ...data, createdAt: now, updatedAt: now });
  return docRef.id;
}

export async function updateInsurance(id: string, data: Partial<Insurance>) {
  if (mockMode || !db) {
    const idx = mockInsurances.findIndex(i => i.id === id);
    if (idx !== -1) mockInsurances[idx] = { ...mockInsurances[idx], ...data, updatedAt: new Date().toISOString() };
    return;
  }
  const docRef = doc(db as Firestore, INS_COLLECTION, id);
  await updateDoc(docRef, { ...data, updatedAt: new Date().toISOString() });
}

export async function deleteInsurance(id: string) {
  if (mockMode || !db) {
    const idx = mockInsurances.findIndex(i => i.id === id);
    if (idx !== -1) mockInsurances.splice(idx, 1);
    return;
  }
  const docRef = doc(db as Firestore, INS_COLLECTION, id);
  await deleteDoc(docRef);
}

export async function getInsurance(id: string): Promise<Insurance|null> {
  if (mockMode || !db) return mockInsurances.find(i => i.id === id) || null;
  const docRef = doc(db as Firestore, INS_COLLECTION, id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  const data = snap.data() as Insurance;
  return { ...data, id: snap.id };
}

export async function listInsurances(userId: string): Promise<Insurance[]> {
  if (mockMode || !db) return mockInsurances.filter(i => i.userId === userId);
  const q = query(collection(db as Firestore, INS_COLLECTION), where('userId','==',userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data() as Insurance, id: d.id }));
}

export async function createAuthorization(data: Omit<Authorization,'id'|'createdAt'|'updatedAt'|'status'>) {
  const now = new Date().toISOString();
  const status: Authorization['status'] = new Date(data.validTo) < new Date() ? 'expired' : 'active';
  if (mockMode || !db) {
    const id = `mock-auth-${Date.now()}`;
    mockAuthorizations.push({ ...(data as Authorization), id, status, sessionsUsed: 0, createdAt: now, updatedAt: now });
    return id;
  }
  const colRef = collection(db as Firestore, AUTH_COLLECTION);
  const docRef = await addDoc(colRef, { ...data, status, sessionsUsed: 0, createdAt: now, updatedAt: now });
  return docRef.id;
}

export async function updateAuthorization(id: string, sessionsUsed: number) {
  if (mockMode || !db) {
    const idx = mockAuthorizations.findIndex(a => a.id === id);
    if (idx !== -1) mockAuthorizations[idx] = { ...mockAuthorizations[idx], sessionsUsed, updatedAt: new Date().toISOString() };
    return;
  }
  const docRef = doc(db as Firestore, AUTH_COLLECTION, id);
  await updateDoc(docRef, { sessionsUsed, updatedAt: new Date().toISOString() });
}

export async function listAuthorizations(patientId: string): Promise<Authorization[]> {
  if (mockMode || !db) return mockAuthorizations.filter(a => a.patientId === patientId);
  const q = query(collection(db as Firestore, AUTH_COLLECTION), where('patientId','==',patientId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data() as Authorization, id: d.id }));
}

export async function createInsuranceFee(data: Omit<InsuranceFee,'id'>) {
  if (mockMode || !db) {
    const id = `mock-fee-${Date.now()}`;
    mockFees.push({ ...(data as InsuranceFee), id });
    return id;
  }
  const colRef = collection(db as Firestore, FEES_COLLECTION);
  const docRef = await addDoc(colRef, data);
  return docRef.id;
}

export async function listInsuranceFees(insuranceId: string): Promise<InsuranceFee[]> {
  if (mockMode || !db) return mockFees.filter(f => f.insuranceId === insuranceId);
  const q = query(collection(db as Firestore, FEES_COLLECTION), where('insuranceId','==',insuranceId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data() as InsuranceFee, id: d.id }));
}
