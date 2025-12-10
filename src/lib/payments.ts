import { db, mockMode } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, where, Firestore } from 'firebase/firestore';
import { Payment } from '@/types';
import { loadFromLocalStorage, saveToLocalStorage } from './mockStorage';

const PAYMENTS_COLLECTION = 'payments';

// Helper functions
const sortByDateDesc = (items: Payment[]) => [...items].sort((a, b) => b.date.localeCompare(a.date));
const getMockPayments = (): Payment[] => loadFromLocalStorage<Payment>('payments');
const saveMockPayments = (payments: Payment[]) => saveToLocalStorage('payments', payments);

export async function createPayment(data: Omit<Payment,'id'|'createdAt'|'updatedAt'>) {
  console.log('[createPayment] Iniciando creación de pago:', data);
  const now = new Date().toISOString();
  if (mockMode || !db) {
    console.log('[createPayment] Modo mock activado');
    const id = `mock-pay-${Date.now()}`;
    const mockPayments = getMockPayments();
    console.log('[createPayment] Pagos existentes:', mockPayments.length);
    const newPayment: Payment = { ...data, id, createdAt: now, updatedAt: now };
    mockPayments.push(newPayment);
    saveMockPayments(mockPayments);
    console.log('[createPayment] Pago guardado, total ahora:', mockPayments.length);
    return id;
  }
  console.log('[createPayment] Modo Firestore');
  const colRef = collection(db as Firestore, PAYMENTS_COLLECTION);
  const docRef = await addDoc(colRef, { ...data, createdAt: now, updatedAt: now });
  console.log('[createPayment] Pago guardado en Firestore:', docRef.id);
  return docRef.id;
}

export async function updatePayment(id: string, data: Partial<Payment>) {
  if (mockMode || !db) {
    const mockPayments = getMockPayments();
    const idx = mockPayments.findIndex(p => p.id === id);
    if (idx !== -1) {
      mockPayments[idx] = { ...mockPayments[idx], ...data, updatedAt: new Date().toISOString() };
      saveMockPayments(mockPayments);
    }
    return;
  }
  const docRef = doc(db as Firestore, PAYMENTS_COLLECTION, id);
  await updateDoc(docRef, { ...data, updatedAt: new Date().toISOString() });
}

export async function deletePayment(id: string) {
  if (mockMode || !db) {
    const mockPayments = getMockPayments();
    const idx = mockPayments.findIndex(p => p.id === id);
    if (idx !== -1) {
      mockPayments.splice(idx, 1);
      saveMockPayments(mockPayments);
    }
    return;
  }
  const docRef = doc(db as Firestore, PAYMENTS_COLLECTION, id);
  await deleteDoc(docRef);
}

export async function getPayment(id: string): Promise<Payment|null> {
  if (mockMode || !db) {
    const mockPayments = getMockPayments();
    return mockPayments.find(p => p.id === id) || null;
  }
  const docRef = doc(db as Firestore, PAYMENTS_COLLECTION, id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  const data = snap.data() as Payment;
  return { ...data, id: snap.id };
}

export async function listPayments(userId: string, viewAll: boolean = false): Promise<Payment[]> {
  if (mockMode || !db) {
    const mockPayments = getMockPayments();
    const filtered = viewAll ? mockPayments : mockPayments.filter(p => p.userId === userId);
    return sortByDateDesc(filtered);
  }

  const snap = viewAll
    ? await getDocs(collection(db as Firestore, PAYMENTS_COLLECTION))
    : await getDocs(query(collection(db as Firestore, PAYMENTS_COLLECTION), where('userId','==',userId)));

  const payments = snap.docs.map(d => ({ ...d.data() as Payment, id: d.id }));
  return sortByDateDesc(payments);
}

export async function listPendingPayments(userId: string, viewAll: boolean = false): Promise<Payment[]> {
  if (mockMode || !db) {
    const mockPayments = getMockPayments();
    const filtered = viewAll ? mockPayments : mockPayments.filter(p => p.userId === userId);
    return sortByDateDesc(filtered.filter(p => p.status === 'pending'));
  }

  const snap = viewAll
    ? await getDocs(collection(db as Firestore, PAYMENTS_COLLECTION))
    : await getDocs(query(collection(db as Firestore, PAYMENTS_COLLECTION), where('userId','==',userId)));

  const payments = snap.docs.map(d => ({ ...d.data() as Payment, id: d.id }));
  return sortByDateDesc(payments.filter(p => p.status === 'pending'));
}

export async function listPaymentsByAppointment(appointmentId: string): Promise<Payment[]> {
  if (mockMode || !db) {
    const mockPayments = getMockPayments();
    return mockPayments.filter(p => p.appointmentId === appointmentId);
  }

  const q = query(collection(db as Firestore, PAYMENTS_COLLECTION), where('appointmentId','==',appointmentId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data() as Payment, id: d.id }));
}
