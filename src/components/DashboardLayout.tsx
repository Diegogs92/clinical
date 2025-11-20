'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { CalendarDays, Users, Hospital, Wallet, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import GoogleCalendarToggle from '../components/GoogleCalendarToggle';
import { Footer } from '../components/Footer';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Agenda', icon: CalendarDays },
  { href: '/patients', label: 'Pacientes', icon: Users },
  { href: '/insurances', label: 'Obras Sociales', icon: Hospital },
  { href: '/fees', label: 'Honorarios', icon: Wallet },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, userProfile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-pearl dark:bg-navy-darkest flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-navy-dark/80 backdrop-blur-xl border-b border-elegant-200/50 dark:border-navy-light/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Image src="/logo.svg" alt="Clinical" width={32} height={32} className="rounded-xl" />
                <span className="hidden sm:block font-bold text-lg text-navy-dark dark:text-pearl">Clinical</span>
              </div>
            </div>

            {/* Desktop Navigation - Pill Style */}
            <nav className="hidden md:flex items-center bg-elegant-50/50 dark:bg-navy-darkest/50 rounded-full px-2 py-1.5 backdrop-blur-md border border-elegant-200/30 dark:border-navy-light/10">
              {navItems.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== '/dashboard' && pathname?.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`
                      relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                      transition-all duration-200
                      ${active
                        ? 'bg-white dark:bg-navy-light text-navy-dark dark:text-pearl shadow-sm'
                        : 'text-elegant-600 dark:text-elegant-300 hover:text-navy-dark dark:hover:text-pearl'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="whitespace-nowrap">{label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Section */}
            <div className="flex items-center gap-3">
              {/* Desktop Controls */}
              <div className="hidden md:flex items-center gap-2">
                <GoogleCalendarToggle />
                <ThemeToggle />
                {user?.photoURL && (
                  <Image
                    src={user.photoURL}
                    alt="avatar"
                    width={32}
                    height={32}
                    className="rounded-full ring-2 ring-elegant-300/30 dark:ring-elegant-700/30"
                  />
                )}
                <button
                  onClick={signOut}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors duration-200"
                  aria-label="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-elegant-100 dark:hover:bg-navy-light/20 transition-colors duration-200"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-elegant-200/50 dark:border-navy-light/20 bg-white/95 dark:bg-navy-dark/95 backdrop-blur-xl">
            <nav className="px-4 py-3 space-y-1">
              {navItems.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== '/dashboard' && pathname?.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-200
                      ${active
                        ? 'bg-navy-dark dark:bg-navy-light text-white dark:text-pearl'
                        : 'text-elegant-600 dark:text-elegant-300 hover:bg-elegant-100 dark:hover:bg-navy-light/20'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Mobile User Section */}
            <div className="px-4 py-3 border-t border-elegant-200/50 dark:border-navy-light/20">
              <div className="flex items-center gap-3 mb-3">
                {user?.photoURL && (
                  <Image
                    src={user.photoURL}
                    alt="avatar"
                    width={40}
                    height={40}
                    className="rounded-full ring-2 ring-elegant-300/30 dark:ring-elegant-700/30"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-navy-dark dark:text-pearl truncate text-sm">
                    {userProfile?.displayName || user?.email?.split('@')[0]}
                  </div>
                  <div className="text-xs text-elegant-500 dark:text-elegant-400">Profesional</div>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <GoogleCalendarToggle />
                <ThemeToggle />
              </div>
              <button
                onClick={signOut}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-6 lg:px-8 py-8 w-full">
        {children}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
