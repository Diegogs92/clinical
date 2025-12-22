import { NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

const requestSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1),
  role: z.enum(['administrador', 'profesional', 'secretaria']),
  defaultAppointmentDuration: z.number().int().min(10).max(240).optional(),
});

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
    console.log('[api/admin/users] Creating userProfile for Google auth:', email);

    // Generar un UID temporal para el perfil
    // El usuario se autenticará con Google y su perfil se actualizará automáticamente
    const tempUid = `pending_${crypto.randomBytes(16).toString('hex')}`;
    console.log('[api/admin/users] Generated temp UID:', tempUid);

    const now = new Date().toISOString();
    const username = email.split('@')[0] || '';
    const defaultAppointmentDuration = parsed.data.defaultAppointmentDuration ?? 30;

    // Guardar en una colección temporal de invitaciones
    await db
      .collection('pendingUsers')
      .doc(email)
      .set(
        {
          email,
          username,
          displayName,
          role,
          defaultAppointmentDuration,
          invitedAt: now,
          invitedBy: requesterUid,
        },
        { merge: false }
      );
    console.log('[api/admin/users] Pending invitation created for:', email);

    // TODO: Opcional - Enviar email de invitación con link al login
    // Para ahora, el usuario simplemente usará "Continuar con Google" en /login

    return NextResponse.json(
      {
        email,
        displayName,
        role,
        message: 'Usuario invitado. Debe iniciar sesión con Google.',
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
