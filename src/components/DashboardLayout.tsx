'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { CalendarDays, Users, Hospital, Wallet, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ThemeToggle from '../components/ThemeToggle';

const navItems = [
  { href: '/dashboard', label: 'Agenda', icon: CalendarDays },
  { href: '/patients', label: 'Pacientes', icon: Users },
  { href: '/insurances', label: 'Obras Sociales', icon: Hospital },
  { href: '/fees', label: 'Honorarios', icon: Wallet },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, userProfile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-secondary-lighter/40 dark:bg-gray-900">
      <aside className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 border-r border-secondary-lighter dark:border-gray-700 p-4 hidden md:flex md:flex-col">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Image src="/logo.svg" alt="ClinicPro" width={40} height={40} className="rounded-lg" />
            <div>
              <div className="text-primary-dark dark:text-white font-bold">ClinicPro</div>
              <div className="text-xs text-secondary dark:text-gray-400">Gestión Profesional</div>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <nav className="space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  active ? 'bg-primary text-white' : 'text-primary-dark dark:text-gray-300 hover:bg-secondary-lighter dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-secondary-lighter dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            {user?.photoURL && (
              <Image src={user.photoURL} alt="avatar" width={36} height={36} className="rounded-full" />
            )}
            <div className="text-sm flex-1 min-w-0">
              <div className="font-semibold text-primary-dark dark:text-white truncate">{userProfile?.displayName || user?.email}</div>
              <div className="text-secondary dark:text-gray-400 text-xs">Profesional</div>
            </div>
          </div>
          <button onClick={signOut} className="w-full flex items-center justify-center gap-2 btn-secondary">
            <LogOut className="w-4 h-4" /> Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="md:ml-64 min-h-screen">
        <header className="bg-white dark:bg-gray-800 border-b border-secondary-lighter dark:border-gray-700 p-4 flex items-center justify-between md:hidden sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Image src="/logo.svg" alt="ClinicPro" width={32} height={32} className="rounded-lg" />
            <div className="text-primary-dark dark:text-white font-bold">ClinicPro</div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={signOut} className="btn-secondary !py-1 !px-3 text-sm">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Mobile Navigation */}
        <nav className="md:hidden bg-white dark:bg-gray-800 border-b border-secondary-lighter dark:border-gray-700 overflow-x-auto">
          <div className="flex gap-1 p-2">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap text-sm ${
                    active ? 'bg-primary text-white' : 'text-primary-dark dark:text-gray-300 hover:bg-secondary-lighter dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
