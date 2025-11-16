import { db, storage, mockMode } from '@/lib/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, query, where, orderBy, Firestore } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Patient, PatientFile } from '@/types';

const PATIENTS_COLLECTION = 'patients';
const mockPatients: Patient[] = [];
const PATIENT_FILES_FOLDER = 'patient-files';

export async function createPatient(data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date().toISOString();
  if (mockMode || !db) {
    const id = `mock-p-${Date.now()}`;
    mockPatients.push({ ...(data as Patient), id, createdAt: now, updatedAt: now });
    return id;
  }
  const colRef = collection(db as Firestore, PATIENTS_COLLECTION);
  const docRef = await addDoc(colRef, { ...data, createdAt: now, updatedAt: now });
  return docRef.id;
}

export async function updatePatient(id: string, data: Partial<Patient>) {
  if (mockMode || !db) {
    const idx = mockPatients.findIndex(p => p.id === id);
    if (idx !== -1) mockPatients[idx] = { ...mockPatients[idx], ...data, updatedAt: new Date().toISOString() };
    return;
  }
  const docRef = doc(db as Firestore, PATIENTS_COLLECTION, id);
  await updateDoc(docRef, { ...data, updatedAt: new Date().toISOString() });
}

export async function deletePatient(id: string) {
  if (mockMode || !db) {
    const idx = mockPatients.findIndex(p => p.id === id);
    if (idx !== -1) mockPatients.splice(idx, 1);
    return;
  }
  const docRef = doc(db as Firestore, PATIENTS_COLLECTION, id);
  await deleteDoc(docRef);
}

export async function getPatient(id: string): Promise<Patient | null> {
  if (mockMode || !db) return mockPatients.find(p => p.id === id) || null;
  const docRef = doc(db as Firestore, PATIENTS_COLLECTION, id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  const data = snap.data() as Patient;
  return { ...data, id: snap.id };
}

export async function getPatientsByUser(userId: string): Promise<Patient[]> {
  if (mockMode || !db) return mockPatients.filter(p => p.userId === userId).sort((a,b) => a.lastName.localeCompare(b.lastName));
  const colRef = collection(db as Firestore, PATIENTS_COLLECTION);
  const q = query(colRef, where('userId', '==', userId), orderBy('lastName'));
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data() as Patient;
    return { ...data, id: d.id };
  });
}

export async function uploadPatientFile(patientId: string, file: File): Promise<PatientFile> {
  if (mockMode || !storage) {
    return {
      id: `mock-file-${Date.now()}`,
      patientId,
      name: file.name,
      url: '',
      type: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    };
  }
  const path = `${PATIENT_FILES_FOLDER}/${patientId}/${Date.now()}-${file.name}`;
  const storageRef = ref(storage!, path);
  const uploaded = await uploadBytes(storageRef, file);
  const url = await getDownloadURL(uploaded.ref);
  return {
    id: uploaded.ref.name,
    patientId,
    name: file.name,
    url,
    type: file.type,
    size: file.size,
    uploadedAt: new Date().toISOString(),
  };
}
