import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasGoogleCalendarId: !!process.env.GOOGLE_CALENDAR_ID,
    hasFirebaseAdminCredentials: !!process.env.FIREBASE_ADMIN_CREDENTIALS_BASE64 ||
      !!process.env.FIREBASE_ADMIN_CREDENTIALS ||
      (!!process.env.FIREBASE_ADMIN_PROJECT_ID && !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL && !!process.env.FIREBASE_ADMIN_PRIVATE_KEY),
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    nextAuthUrl: process.env.NEXTAUTH_URL || 'not set',
    googleClientIdPrefix: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...',
  });
}
