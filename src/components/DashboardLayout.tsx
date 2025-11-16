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
    <div className="min-h-screen bg-secondary-lighter/40">
      <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-secondary-lighter p-4 hidden md:flex md:flex-col">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold">C</div>
          <div>
            <div className="text-primary-dark font-bold">ClinicPro</div>
            <div className="text-xs text-secondary">Gestión Profesional</div>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  active ? 'bg-primary text-white' : 'text-primary-dark hover:bg-secondary-lighter'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-secondary-lighter">
          <div className="flex items-center gap-3 mb-2">
            {user?.photoURL && (
              <Image src={user.photoURL} alt="avatar" width={36} height={36} className="rounded-full" />
            )}
            <div className="text-sm">
              <div className="font-semibold text-primary-dark">{userProfile?.displayName || user?.email}</div>
              <div className="text-secondary text-xs">Profesional</div>
            </div>
          </div>
          <ThemeToggle />
          <button onClick={signOut} className="mt-4 w-full flex items-center justify-center gap-2 btn-secondary">
            <LogOut className="w-4 h-4" /> Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="md:ml-64">
        <header className="bg-white border-b border-secondary-lighter p-4 flex items-center justify-between md:hidden">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">C</div>
            <div className="text-primary-dark font-bold">ClinicPro</div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={signOut} className="btn-secondary !py-1 !px-3 text-sm">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
