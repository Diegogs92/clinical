import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

const bodySchema = z.object({
  email: z.string().email(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { uid: string } }
) {
  const { uid } = params;
  console.log('[api/admin/users/[uid]] PATCH uid:', uid);

  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : '';
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminAuth = getAdminAuth();
    const db = getAdminFirestore();
    console.log('[api/admin/users/[uid]] Admin SDK ready');

    const decoded = await adminAuth.verifyIdToken(token);
    const requesterUid = decoded.uid;
    console.log('[api/admin/users/[uid]] Token verified for uid:', requesterUid);

    const requesterProfileSnap = await db.collection('userProfiles').doc(requesterUid).get();
    const requesterRole = (requesterProfileSnap.exists ? (requesterProfileSnap.data() as any).role : null) as
      | string
      | null;
    if (requesterRole !== 'administrador') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.log('[api/admin/users/[uid]] Requester role:', requesterRole);

    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
    }

    const { email } = parsed.data;
    console.log('[api/admin/users/[uid]] Updating email to:', email);

    await adminAuth.updateUser(uid, { email });
    console.log('[api/admin/users/[uid]] Auth email updated');

    const now = new Date().toISOString();
    const username = email.split('@')[0] || '';
    await db
      .collection('userProfiles')
      .doc(uid)
      .set(
        {
          email,
          username,
          updatedAt: now,
        },
        { merge: true }
      );
    console.log('[api/admin/users/[uid]] Profile email updated');

    return NextResponse.json({ ok: true, uid, email });
  } catch (error: any) {
    console.error('[api/admin/users/[uid]] Error updating email:', error);
    const message = typeof error?.message === 'string' ? error.message : 'Unknown error';
    const code = typeof error?.code === 'string' ? error.code : '';

    if (code === 'auth/email-already-exists') {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }
    if (code === 'auth/user-not-found') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (message.includes('verifyIdToken')) {
      return NextResponse.json({ error: 'Unauthorized', message }, { status: 401 });
    }

    return NextResponse.json({ error: 'Failed to update email', message, code }, { status: 500 });
  }
}

