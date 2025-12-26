import { db, mockMode } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, Firestore } from 'firebase/firestore';
import { FollowUpReason } from '@/types';
import { loadFromLocalStorage, saveToLocalStorage } from './mockStorage';

const COLLECTION_NAME = 'followUpReasons';
const mockFollowUpReasons: FollowUpReason[] = loadFromLocalStorage<FollowUpReason>('follow-up-reasons');

export async function listFollowUpReasons(userId: string): Promise<FollowUpReason[]> {
  if (mockMode || !db) {
    return mockFollowUpReasons
      .filter(reason => reason.userId === userId)
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  const q = query(collection(db as Firestore, COLLECTION_NAME), where('userId', '==', userId));
  const snap = await getDocs(q);
  const reasons = snap.docs.map(d => ({ ...d.data() as FollowUpReason, id: d.id }));
  return reasons.sort((a, b) => a.label.localeCompare(b.label));
}

export async function createFollowUpReason(userId: string, label: string): Promise<string> {
  const now = new Date().toISOString();
  const payload = { userId, label, createdAt: now, updatedAt: now };

  if (mockMode || !db) {
    const id = `mock-fur-${Date.now()}`;
    mockFollowUpReasons.push({ ...(payload as FollowUpReason), id });
    saveToLocalStorage('follow-up-reasons', mockFollowUpReasons);
    return id;
  }

  const colRef = collection(db as Firestore, COLLECTION_NAME);
  const docRef = await addDoc(colRef, payload);
  return docRef.id;
}
