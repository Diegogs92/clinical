import { NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

const requestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).optional(),
  displayName: z.string().min(1),
  role: z.enum(['administrador', 'profesional', 'secretaria']),
  defaultAppointmentDuration: z.number().int().min(10).max(240).optional(),
});

function generatePassword() {
  // 16 chars-ish, URL-safe
  return crypto.randomBytes(12).toString('base64url');
}

export async function POST(req: Request) {
  console.log('[api/admin/users] POST');
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : '';
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminAuth = getAdminAuth();
    const db = getAdminFirestore();
    console.log('[api/admin/users] Admin SDK ready');

    const decoded = await adminAuth.verifyIdToken(token);
    const requesterUid = decoded.uid;
    console.log('[api/admin/users] Token verified for uid:', requesterUid);

    const requesterProfileSnap = await db.collection('userProfiles').doc(requesterUid).get();
    const requesterRole = (requesterProfileSnap.exists ? (requesterProfileSnap.data() as any).role : null) as
      | string
      | null;
    if (requesterRole !== 'administrador') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.log('[api/admin/users] Requester role:', requesterRole);

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
    }

    const { email, displayName, role } = parsed.data;
    const password = parsed.data.password || generatePassword();
    const didGeneratePassword = !parsed.data.password;
    console.log('[api/admin/users] Creating auth user:', email);

    const created = await adminAuth.createUser({
      email,
      password,
      displayName,
    });
    console.log('[api/admin/users] Auth user created:', created.uid);

    const now = new Date().toISOString();
    const username = email.split('@')[0] || '';
    const defaultAppointmentDuration = parsed.data.defaultAppointmentDuration ?? 30;

    await db
      .collection('userProfiles')
      .doc(created.uid)
      .set(
        {
          uid: created.uid,
          email,
          username,
          displayName,
          photoURL: '',
          role,
          defaultAppointmentDuration,
          createdAt: now,
          updatedAt: now,
        },
        { merge: false }
      );
    console.log('[api/admin/users] Profile created:', created.uid);

    return NextResponse.json(
      {
        uid: created.uid,
        email,
        displayName,
        role,
        ...(didGeneratePassword ? { generatedPassword: password } : {}),
      },
      { status: 201 }
    );
  } catch (error: any) {
    // Log completo en server (Vercel Logs) para diagnóstico
    console.error('[api/admin/users] Failed to create user:', error);

    const message = typeof error?.message === 'string' ? error.message : 'Unknown error';
    const code = typeof error?.code === 'string' ? error.code : '';

    if (code === 'auth/email-already-exists') {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }

    if (message.includes('Firebase ID token has incorrect') || message.includes('verifyIdToken')) {
      return NextResponse.json({ error: 'Unauthorized', message }, { status: 401 });
    }

    return NextResponse.json({ error: 'Failed to create user', message, code }, { status: 500 });
  }
}
