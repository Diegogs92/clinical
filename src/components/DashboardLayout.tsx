'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { CalendarDays, Users, Hospital, Wallet, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import { useState, useRef, useEffect } from 'react';

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
  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const navRef = useRef<HTMLDivElement>(null);

  // Set initial slider position based on active link
  useEffect(() => {
    if (navRef.current) {
      const activeLink = navRef.current.querySelector('.nav-link-active') as HTMLElement;
      if (activeLink) {
        setSliderStyle({
          left: activeLink.offsetLeft,
          width: activeLink.offsetWidth,
          opacity: 1,
        });
      }
    }
  }, [pathname]);

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const target = e.currentTarget;
    setSliderStyle({
      left: target.offsetLeft,
      width: target.offsetWidth,
      opacity: 1,
    });
  };

  const handleMouseLeave = () => {
    if (navRef.current) {
      const activeLink = navRef.current.querySelector('.nav-link-active') as HTMLElement;
      if (activeLink) {
        setSliderStyle({
          left: activeLink.offsetLeft,
          width: activeLink.offsetWidth,
          opacity: 1,
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-[#18181b] dark:via-[#18181b] dark:to-[#0a0a0b]">
      {/* Top Navigation Bar - iOS Style */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-[#18181b]/90 border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Image src="/logo.svg" alt="Clinical" width={36} height={36} className="rounded-xl" />
              <div className="hidden sm:block">
                <div className="text-primary-dark dark:text-white font-bold text-lg">Clinical</div>
                <div className="text-xs text-secondary dark:text-gray-400">Gestión Profesional</div>
              </div>
            </div>

            {/* Desktop Navigation Pills */}
            <nav 
              ref={navRef}
              className="hidden md:flex items-center relative bg-gray-100/80 dark:bg-[#27272a]/80 backdrop-blur-lg rounded-full p-1.5 shadow-inner"
              onMouseLeave={handleMouseLeave}
            >
              {/* Animated Slider */}
              <div
                className="absolute bg-white dark:bg-[#3f3f46] rounded-full shadow-md transition-all duration-300 ease-out"
                style={{
                  left: `${sliderStyle.left}px`,
                  width: `${sliderStyle.width}px`,
                  height: 'calc(100% - 12px)',
                  top: '6px',
                  opacity: sliderStyle.opacity,
                  pointerEvents: 'none',
                }}
              />
              {navItems.map(({ href, label, icon: Icon }) => {
                 const active = pathname === href || (href !== '/dashboard' && pathname?.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    onMouseEnter={handleMouseEnter}
                    className={`
                      relative z-10 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200
                      ${active
                        ? 'nav-link-active text-primary dark:text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
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
              {/* User Menu - Desktop */}
              <div className="hidden md:flex items-center gap-3">
                <ThemeToggle />
                {user?.photoURL && (
                  <Image
                    src={user.photoURL}
                    alt="avatar"
                    width={32}
                    height={32}
                    className="rounded-full ring-2 ring-primary/20"
                  />
                )}
                <div className="hidden lg:block text-sm">
                  <div className="font-semibold text-primary-dark dark:text-white">
                    {userProfile?.displayName || user?.email?.split('@')[0]}
                  </div>
                </div>
                <button
                  onClick={signOut}
                  className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-all hover:scale-110"
                  aria-label="Cerrar sesión"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#27272a] transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200/50 dark:border-gray-700/50 bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-lg">
            <nav className="px-4 py-3 space-y-1">
              {navItems.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== '/dashboard' && pathname?.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                      ${active
                        ? 'bg-primary text-white shadow-md'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#27272a]'
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
            <div className="px-4 py-3 border-t border-gray-200/50 dark:border-gray-700/50">
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
                  <div className="font-semibold text-primary-dark dark:text-white truncate">
                    {userProfile?.displayName || user?.email}
                  </div>
                  <div className="text-xs text-secondary dark:text-gray-400">Profesional</div>
                </div>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
