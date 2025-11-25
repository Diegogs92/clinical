'use client';

import { ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import GlassNavbar from './GlassNavbar';
import ThemeToggle from './ThemeToggle';
import { Footer } from './Footer';
import TokenExpirationBanner from './TokenExpirationBanner';
import {
  LayoutDashboard,
  Users,
  Shield,
  DollarSign,
  Building2,
  LogOut,
  Menu,
  X,
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
}

export default function DashboardLayout({ children, mobileAction }: DashboardLayoutProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
    { href: '/patients', label: 'Pacientes', icon: Users },
    { href: '/offices', label: 'Consultorios', icon: Building2 },
    { href: '/insurances', label: 'Obras Sociales', icon: Shield },
    { href: '/fees', label: 'Honorarios', icon: DollarSign },
  ];

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pearl via-white to-secondary-lighter/15 dark:from-elegant-950 dark:via-elegant-900 dark:to-elegant-950">
      <TokenExpirationBanner />

      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-elegant-900/80 border-b border-elegant-200 dark:border-elegant-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl overflow-hidden">
                <img src="/logo.svg" alt="Clinical Logo" className="w-full h-full object-cover" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                  Clinical
                </h1>
                {user && (
                  <p className="text-xs text-elegant-600 dark:text-elegant-400">
                    {user.displayName || user.email}
                  </p>
                )}
              </div>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <GlassNavbar items={navItems} />
              <div className="flex items-center gap-2">
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

            <div className="md:hidden flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="icon-btn"
                aria-label={mobileMenuOpen ? 'Cerrar menu' : 'Abrir menu'}
                title={mobileMenuOpen ? 'Cerrar menu' : 'Menu rapido'}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-elegant-200 dark:border-elegant-800 bg-white/95 dark:bg-elegant-900/95 backdrop-blur-xl shadow-xl shadow-primary/10">
            <div className="px-4 py-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-semibold">
                  {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'C'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-primary-dark dark:text-white">Sesion activa</p>
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
                  className="btn-secondary w-full justify-center"
                >
                  Ir al inicio
                </button>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="btn-danger w-full justify-center"
                >
                  Cerrar sesion
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 md:pb-12">
        {children}
      </main>

      <Footer />

      <MobileNavBar items={navItems} action={mobileAction} />
    </div>
  );
}
