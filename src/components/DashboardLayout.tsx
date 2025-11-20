'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { CalendarDays, Users, Hospital, Wallet, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import GoogleCalendarToggle from '../components/GoogleCalendarToggle';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#18181b] flex">
      {/* Sidebar - Desktop (expandible on hover) */}
      <aside className="hidden md:flex flex-col w-20 hover:w-64 bg-white dark:bg-[#27272a] border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-out group">
        {/* Logo */}
        <div className="flex items-center h-20 border-b border-gray-200 dark:border-gray-700 px-3 overflow-hidden">
          <Image src="/logo.svg" alt="Clinical" width={36} height={36} className="rounded-xl flex-shrink-0" />
          <div className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            <div className="text-primary-dark dark:text-white font-bold text-lg">Clinical</div>
            <div className="text-xs text-secondary dark:text-gray-400">Gestión Pro</div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 flex flex-col gap-2 py-6 px-3">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname?.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`
                  relative flex items-center gap-3 h-14 rounded-2xl overflow-hidden
                  transition-all duration-200
                  ${active
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary dark:hover:text-primary-light'
                  }
                `}
              >
                <div className="flex items-center justify-center w-14 h-14 flex-shrink-0">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap font-medium">
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="flex flex-col gap-3 py-4 px-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 h-10">
            <div className="flex-shrink-0">
              <GoogleCalendarToggle />
            </div>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
              Google Calendar
            </span>
          </div>

          <div className="flex items-center gap-3 h-10">
            <div className="flex-shrink-0">
              <ThemeToggle />
            </div>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
              Tema
            </span>
          </div>

          {user?.photoURL && (
            <div className="flex items-center gap-3 py-2">
              <Image
                src={user.photoURL}
                alt="avatar"
                width={40}
                height={40}
                className="rounded-full ring-2 ring-primary/20 flex-shrink-0"
              />
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
                <div className="font-semibold text-sm text-primary-dark dark:text-white truncate">
                  {userProfile?.displayName || user?.email?.split('@')[0]}
                </div>
                <div className="text-xs text-secondary dark:text-gray-400">Profesional</div>
              </div>
            </div>
          )}

          <button
            onClick={signOut}
            className="flex items-center gap-3 h-10 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors duration-200"
          >
            <div className="flex items-center justify-center w-10 h-10 flex-shrink-0">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap font-medium">
              Cerrar sesión
            </span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`
        md:hidden fixed top-0 left-0 h-full w-64 bg-white dark:bg-[#27272a] border-r border-gray-200 dark:border-gray-700 z-50
        transform transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Mobile Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Image src="/logo.svg" alt="Clinical" width={32} height={32} className="rounded-xl" />
            <div>
              <div className="text-primary-dark dark:text-white font-bold">Clinical</div>
              <div className="text-xs text-secondary dark:text-gray-400">Gestión</div>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Navigation */}
        <nav className="px-3 py-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname?.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-200
                  ${active
                    ? 'bg-primary text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
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
        <div className="absolute bottom-0 left-0 right-0 px-4 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            {user?.photoURL && (
              <Image
                src={user.photoURL}
                alt="avatar"
                width={40}
                height={40}
                className="rounded-full ring-2 ring-primary/20"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-primary-dark dark:text-white truncate text-sm">
                {userProfile?.displayName || user?.email?.split('@')[0]}
              </div>
              <div className="text-xs text-secondary dark:text-gray-400">Profesional</div>
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
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Bar */}
        <header className="md:hidden sticky top-0 z-30 bg-white dark:bg-[#27272a] border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <Image src="/logo.svg" alt="Clinical" width={28} height={28} className="rounded-xl" />
              <span className="font-bold text-primary-dark dark:text-white">Clinical</span>
            </div>
            <div className="w-10" /> {/* Spacer */}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
