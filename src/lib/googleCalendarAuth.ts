import { google } from 'googleapis';
import crypto from 'crypto';
import admin from 'firebase-admin';
import { getAdminFirestore } from '@/lib/firebaseAdmin';

const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

const TOKEN_COLLECTION = 'googleCalendarTokens';
const STATE_COLLECTION = 'googleCalendarOAuthStates';

export function getCalendarScopes() {
  return CALENDAR_SCOPES.slice();
}

export function getOAuthClient(redirectUri?: string) {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
}

export function getBaseUrlFromRequest(req: { headers: Record<string, string | string[] | undefined> }) {
  const envBase = process.env.NEXTAUTH_URL;
  if (envBase) return envBase.replace(/\/$/, '');
  const host = req.headers.host || '';
  const proto = (req.headers['x-forwarded-proto'] || 'http') as string;
  return `${proto}://${host}`;
}

export async function createOAuthState(uid: string) {
  const state = crypto.randomBytes(16).toString('hex');
  const db = getAdminFirestore();
  await db.collection(STATE_COLLECTION).doc(state).set({
    uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return state;
}

export async function consumeOAuthState(state: string) {
  const db = getAdminFirestore();
  const ref = db.collection(STATE_COLLECTION).doc(state);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const data = snap.data() as { uid?: string } | undefined;
  await ref.delete();
  return data?.uid || null;
}

export async function storeRefreshToken(uid: string, refreshToken: string) {
  const db = getAdminFirestore();
  await db.collection(TOKEN_COLLECTION).doc(uid).set(
    {
      refreshToken,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getRefreshToken(uid: string) {
  const db = getAdminFirestore();
  const snap = await db.collection(TOKEN_COLLECTION).doc(uid).get();
  if (!snap.exists) return null;
  const data = snap.data() as { refreshToken?: string } | undefined;
  return data?.refreshToken || null;
}

export async function hasRefreshToken(uid: string) {
  const token = await getRefreshToken(uid);
  return !!token;
}
