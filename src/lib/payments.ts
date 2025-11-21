import { db, mockMode } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, where, Firestore } from 'firebase/firestore';
import { Payment } from '@/types';
import { loadFromLocalStorage, saveToLocalStorage } from './mockStorage';

const PAYMENTS_COLLECTION = 'payments';

// Mock store
const mockPayments: Payment[] = loadFromLocalStorage<Payment>('payments');
const sortByDateDesc = (items: Payment[]) => [...items].sort((a, b) => b.date.localeCompare(a.date));

export async function createPayment(data: Omit<Payment,'id'|'createdAt'|'updatedAt'>) {
  const now = new Date().toISOString();
  if (mockMode || !db) {
    const id = `mock-pay-${Date.now()}`;
    mockPayments.push({ ...(data as Payment), id, createdAt: now, updatedAt: now });
    saveToLocalStorage('payments', mockPayments);
    return id;
  }
  const colRef = collection(db as Firestore, PAYMENTS_COLLECTION);
  const docRef = await addDoc(colRef, { ...data, createdAt: now, updatedAt: now });
  return docRef.id;
}

export async function updatePayment(id: string, data: Partial<Payment>) {
  if (mockMode || !db) {
    const idx = mockPayments.findIndex(p => p.id === id);
    if (idx !== -1) {
      mockPayments[idx] = { ...mockPayments[idx], ...data, updatedAt: new Date().toISOString() };
      saveToLocalStorage('payments', mockPayments);
    }
    return;
  }
  const docRef = doc(db as Firestore, PAYMENTS_COLLECTION, id);
  await updateDoc(docRef, { ...data, updatedAt: new Date().toISOString() });
}

export async function deletePayment(id: string) {
  if (mockMode || !db) {
    const idx = mockPayments.findIndex(p => p.id === id);
    if (idx !== -1) {
      mockPayments.splice(idx, 1);
      saveToLocalStorage('payments', mockPayments);
    }
    return;
  }
  const docRef = doc(db as Firestore, PAYMENTS_COLLECTION, id);
  await deleteDoc(docRef);
}

export async function getPayment(id: string): Promise<Payment|null> {
  if (mockMode || !db) return mockPayments.find(p => p.id === id) || null;
  const docRef = doc(db as Firestore, PAYMENTS_COLLECTION, id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  const data = snap.data() as Payment;
  return { ...data, id: snap.id };
}

export async function listPayments(userId: string): Promise<Payment[]> {
  if (mockMode || !db) return sortByDateDesc(mockPayments.filter(p => p.userId === userId));

  // Evitar indices compuestos: filtramos por usuario y ordenamos en cliente
  const q = query(collection(db as Firestore, PAYMENTS_COLLECTION), where('userId','==',userId));
  const snap = await getDocs(q);
  const payments = snap.docs.map(d => ({ ...d.data() as Payment, id: d.id }));

  return sortByDateDesc(payments);
}

export async function listPendingPayments(userId: string): Promise<Payment[]> {
  if (mockMode || !db) return sortByDateDesc(mockPayments.filter(p => p.userId === userId && p.status === 'pending'));

  // Traemos todos los pagos del usuario y filtramos pendientes en memoria para evitar requerir indices
  const q = query(collection(db as Firestore, PAYMENTS_COLLECTION), where('userId','==',userId));
  const snap = await getDocs(q);
  const payments = snap.docs.map(d => ({ ...d.data() as Payment, id: d.id }));

  return sortByDateDesc(payments.filter(p => p.status === 'pending'));
}
