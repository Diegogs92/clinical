'use client';

import { ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import GlassNavbar from './GlassNavbar';
import ThemeToggle from './ThemeToggle';
import { Footer } from './Footer';
import GoogleCalendarToggle from './GoogleCalendarToggle';
import TokenExpirationBanner from './TokenExpirationBanner';
import BirthdayFloatingButton from './dashboard/BirthdayFloatingButton';
import FloatingNewAppointmentButton from './appointments/FloatingNewAppointmentButton';
import { usePatients } from '@/contexts/PatientsContext';
import {
  LayoutDashboard,
  Users,
  Shield,
  DollarSign,
  LogOut,
  Menu,
  X,
  CalendarDays,
  UserCog,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import MobileNavBar from './ui/MobileNavBar';

interface DashboardLayoutProps {
  children: ReactNode;
  mobileAction?: {
    label: string;
    icon: LucideIcon;
    onPress: () => void;
  };
  fullWidth?: boolean;
}

export default function DashboardLayout({ children, mobileAction, fullWidth = false }: DashboardLayoutProps) {
  const { user, userProfile, signOut } = useAuth();
  const { patients } = usePatients();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
    { href: '/agenda', label: 'Agenda', icon: CalendarDays },
    { href: '/patients', label: 'Pacientes', icon: Users },
    // { href: '/insurances', label: 'Obras Sociales', icon: Shield }, // Temporalmente oculto
    { href: '/fees', label: 'Honorarios', icon: DollarSign },
    ...(userProfile?.role === 'administrador' ? [{ href: '/admin/users', label: 'Usuarios', icon: UserCog }] : []),
  ];

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pearl via-white to-secondary-lighter/15 dark:from-elegant-950 dark:via-elegant-900 dark:to-elegant-950">

      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 dark:bg-elegant-900/90 border-b border-elegant-200/80 dark:border-elegant-800/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12 md:h-14">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-xl overflow-hidden">
                <img src="/logo.svg" alt="DENTIFY Logo" className="w-full h-full object-cover" />
              </div>
              <div className="block">
                <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                  DENTIFY
                </h1>
                {user && (
                  <p className="hidden sm:block text-sm text-elegant-600 dark:text-elegant-400 truncate max-w-[150px] md:max-w-none">
                    {user.displayName || user.email}
                  </p>
                )}
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <GlassNavbar items={navItems} />
              <div className="flex items-center gap-1.5">
                <GoogleCalendarToggle />
                <ThemeToggle />
                <button
                  onClick={handleLogout}
                  className="icon-btn-danger"
                  aria-label="Cerrar sesion"
                  title="Cerrar sesion"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="md:hidden flex items-center gap-1.5">
              <GoogleCalendarToggle />
              <ThemeToggle />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="icon-btn p-2"
                aria-label={mobileMenuOpen ? 'Cerrar menu' : 'Abrir menu'}
                title={mobileMenuOpen ? 'Cerrar menu' : 'Menu rapido'}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-elegant-200 dark:border-elegant-800 bg-white/98 dark:bg-elegant-900/98 backdrop-blur-xl shadow-xl shadow-primary/10 animate-in slide-in-from-top duration-200">
            <div className="px-3 py-2 space-y-2">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center font-bold text-base shadow-lg shadow-primary/30">
                  {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'C'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-primary-dark dark:text-white">Sesión activa</p>
                  {user && (
                    <p className="text-xs text-elegant-600 dark:text-elegant-300 truncate">
                      {user.displayName || user.email}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    router.push('/dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="btn-secondary w-full justify-center text-base py-2.5"
                >
                  Ir al inicio
                </button>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="btn-danger w-full justify-center text-base py-2.5"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className={`flex-1 w-full ${fullWidth ? 'max-w-full px-3 sm:px-6 lg:px-8' : 'max-w-7xl mx-auto px-3 sm:px-6 lg:px-8'} py-3 md:py-6 pb-32 md:pb-12`}>
        {children}
      </main>

      <Footer />

      <TokenExpirationBanner />
      <MobileNavBar items={navItems} action={mobileAction} />

      {/* Floating Action Buttons */}
      <FloatingNewAppointmentButton />
      <BirthdayFloatingButton patients={patients} />
    </div>
  );
}
