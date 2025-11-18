import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { ConfirmProvider } from '@/contexts/ConfirmContext';
import { CalendarSyncProvider } from '@/contexts/CalendarSyncContext';
import NextAuthProvider from '@/components/NextAuthProvider';
import ErrorBoundary from '@/components/ErrorBoundary';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Clinical - Gestión Profesional de Salud',
  description: 'Sistema de gestión integral para profesionales de la salud',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Clinical',
  },
  themeColor: '#08415C',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(console.error);
                });
              }
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const stored = localStorage.getItem('theme');
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const shouldBeDark = stored === 'dark' || (!stored && prefersDark);
                  window.__theme = shouldBeDark ? 'dark' : 'light';
                  document.documentElement.classList.toggle('dark', shouldBeDark);
                } catch (error) {
                  console.error(error);
                }
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <NextAuthProvider>
            <ThemeProvider>
              <AuthProvider>
                <CalendarSyncProvider>
                  <ToastProvider>
                    <ConfirmProvider>
                      {children}
                    </ConfirmProvider>
                  </ToastProvider>
                </CalendarSyncProvider>
              </AuthProvider>
            </ThemeProvider>
          </NextAuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
