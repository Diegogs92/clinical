'use client';

import { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import GlassNavbar from './GlassNavbar';
import ThemeToggle from './ThemeToggle';
import GoogleCalendarToggle from './GoogleCalendarToggle';
import { Footer } from './Footer';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  Shield, 
  DollarSign,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
    { href: '/patients', label: 'Pacientes', icon: Users },
    { href: '/insurances', label: 'Obras Sociales', icon: Shield },
    { href: '/fees', label: 'Honorarios', icon: DollarSign },
  ];

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pearl via-white to-secondary-lighter/20 dark:from-elegant-950 dark:via-elegant-900 dark:to-elegant-950">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-elegant-900/80 border-b border-elegant-200 dark:border-elegant-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
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

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <GlassNavbar items={navItems} />
              <div className="flex items-center gap-2">
                <GoogleCalendarToggle />
                <ThemeToggle />
                <button
                  onClick={handleLogout}
                  className="icon-btn-danger"
                  aria-label="Cerrar sesión"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden icon-btn"
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-elegant-200 dark:border-elegant-800 bg-white/95 dark:bg-elegant-900/95 backdrop-blur-xl">
            <nav className="px-4 py-3 space-y-1">
              {navItems.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || (href !== '/dashboard' && pathname?.startsWith(href));
                return (
                  <button
                    key={href}
                    onClick={() => {
                      router.push(href);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-primary text-white shadow-md'
                        : 'text-elegant-600 dark:text-elegant-300 hover:bg-elegant-100 dark:hover:bg-elegant-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
                  </button>
                );
              })}
              <div className="flex items-center gap-2 pt-3 border-t border-elegant-200 dark:border-elegant-800 mt-3">
                <GoogleCalendarToggle />
                <ThemeToggle />
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-danger hover:bg-danger/10 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
