import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Manrope } from 'next/font/google';
import './globals.css';
import 'react-datepicker/dist/react-datepicker.css';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from 'sonner';
import { ConfirmProvider } from '@/contexts/ConfirmContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { PatientsProvider } from '@/contexts/PatientsContext';
import { AppointmentsProvider } from '@/contexts/AppointmentsContext';
import { PaymentsProvider } from '@/contexts/PaymentsContext';
import { OfficesProvider } from '@/contexts/OfficesContext';
import { CalendarSyncProvider } from '@/contexts/CalendarSyncContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import GlobalLoader from '@/components/GlobalLoader';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
});

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'DENTIFY - Asistente de Gestión Odontológica',
  description: 'Plataforma profesional para la gestión de consultorios odontológicos',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
  },
};
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0EA5E9',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning className={`${jakarta.variable} ${manrope.variable}`}>
      <body className="antialiased bg-pearl dark:bg-elegant-950 text-elegant-900 dark:text-elegant-50 min-h-screen font-sans">
        <ErrorBoundary>
          <ThemeProvider>
            <AuthProvider>
              <ConfirmProvider>
                <PatientsProvider>
                  <OfficesProvider>
                    <AppointmentsProvider>
                      <PaymentsProvider>
                        <CalendarSyncProvider>
                          <GlobalLoader />
                          {children}
                          <Toaster position="top-center" richColors closeButton />
                        </CalendarSyncProvider>
                      </PaymentsProvider>
                    </AppointmentsProvider>
                  </OfficesProvider>
                </PatientsProvider>
              </ConfirmProvider>
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
