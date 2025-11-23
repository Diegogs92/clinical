import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

// Determinar si estamos en modo mock (sin credenciales reales)
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
// FORZAR MODO MOCK: Cambiar a false cuando tengas Firebase configurado correctamente
const FORCE_MOCK_MODE = true;
export const mockMode = FORCE_MOCK_MODE || !apiKey || apiKey === 'your_api_key_here' || apiKey === 'TU_API_KEY_AQUI';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (!mockMode) {
  const firebaseConfig = {
    apiKey: apiKey,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  auth = getAuth(app);
  db = getFirestore(app);
  // Solo inicializar storage si hay bucket definido
  if (firebaseConfig.storageBucket) {
    try {
      storage = getStorage(app);
    } catch {/* ignorar si falla */}
  }
} else {
  if (process.env.NODE_ENV !== 'production') {
    console.info('[Firebase] Modo mock activado - se usarán stores en memoria.');
  }
}

export { app, auth, db, storage };
export default app;
