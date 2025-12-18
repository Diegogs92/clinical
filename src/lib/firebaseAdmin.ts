import admin from 'firebase-admin';

type ServiceAccountFromEnv = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

function normalizePrivateKey(privateKey: string) {
  return privateKey.replace(/\\n/g, '\n');
}

function getServiceAccountFromEnv(): admin.ServiceAccount | null {
  const base64 = process.env.FIREBASE_ADMIN_CREDENTIALS_BASE64;
  if (base64) {
    const json = Buffer.from(base64, 'base64').toString('utf8');
    const parsed = JSON.parse(json) as admin.ServiceAccount;
    if ((parsed as any).private_key) {
      (parsed as any).private_key = normalizePrivateKey((parsed as any).private_key);
    }
    return parsed;
  }

  const raw = process.env.FIREBASE_ADMIN_CREDENTIALS;
  if (raw) {
    const parsed = JSON.parse(raw) as admin.ServiceAccount;
    if ((parsed as any).private_key) {
      (parsed as any).private_key = normalizePrivateKey((parsed as any).private_key);
    }
    return parsed;
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (projectId && clientEmail && privateKey) {
    const sa: ServiceAccountFromEnv = {
      projectId,
      clientEmail,
      privateKey: normalizePrivateKey(privateKey),
    };
    return {
      projectId: sa.projectId,
      clientEmail: sa.clientEmail,
      privateKey: sa.privateKey,
    };
  }

  return null;
}

export function getFirebaseAdminApp() {
  if (!admin.apps.length) {
    const serviceAccount = getServiceAccountFromEnv();
    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    }
  }
  return admin.app();
}

export function getAdminAuth() {
  return getFirebaseAdminApp().auth();
}

export function getAdminFirestore() {
  return getFirebaseAdminApp().firestore();
}

