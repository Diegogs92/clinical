'use client';

import { LucideIcon } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface MobileNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface MobileNavBarProps {
  items: MobileNavItem[];
  action?: {
    label: string;
    icon: LucideIcon;
    onPress: () => void;
  };
}

export default function MobileNavBar({ items, action }: MobileNavBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname?.startsWith(href));

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 50) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 md:hidden transition-all duration-300 ease-out ${
        isVisible ? 'translate-y-0' : 'translate-y-[calc(100%+1rem)]'
      }`}
    >
      {/* Degradado superior para difuminar contenido */}
      <div className="absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-white/80 via-white/40 to-transparent dark:from-elegant-950/80 dark:via-elegant-950/40 pointer-events-none" />

      <div className="px-2.5 pb-safe pt-1">
        {/* Container principal */}
        <div className="relative">
          {/* Botón FAB Central */}
          {action && (
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-10">
              <button
                type="button"
                onClick={action.onPress}
                className="group relative w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white shadow-[0_10px_30px_-5px_rgba(14,165,233,0.6)] active:scale-90 transition-all duration-200 touch-manipulation flex items-center justify-center overflow-hidden"
                aria-label={action.label}
              >
                {/* Glow effect al presionar */}
                <span className="absolute inset-0 bg-white/20 rounded-full scale-0 group-active:scale-100 transition-transform duration-200" />
                <action.icon className="relative w-6 h-6 stroke-[2.5]" />
              </button>
            </div>
          )}

          {/* Navbar */}
          <div className="relative bg-white/95 dark:bg-elegant-900/95 backdrop-blur-2xl rounded-[24px] border border-elegant-200/50 dark:border-elegant-700/50 shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.12)] dark:shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.4)] overflow-hidden">
            {/* Sutil gradiente de fondo */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.02] via-transparent to-secondary/[0.02]" />

            {/* Items de navegación */}
            <div className="relative grid grid-cols-5 gap-0 px-1 py-2">
              {items.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <button
                    key={href}
                    onClick={() => router.push(href)}
                    className={`group relative flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl transition-all duration-200 touch-manipulation min-h-[58px] ${
                      active
                        ? 'text-primary dark:text-primary-light'
                        : 'text-elegant-500 dark:text-elegant-400 active:scale-95'
                    }`}
                    aria-label={label}
                    aria-current={active ? 'page' : undefined}
                  >
                    {/* Fondo activo */}
                    {active && (
                      <span className="absolute inset-0 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent rounded-xl" />
                    )}

                    {/* Icono */}
                    <div className={`relative transition-transform duration-200 ${active ? 'scale-110' : 'group-active:scale-90'}`}>
                      <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
                      {/* Glow sutil cuando está activo */}
                      {active && (
                        <span className="absolute inset-0 bg-primary/20 blur-md rounded-full -z-10" />
                      )}
                    </div>

                    {/* Label */}
                    <span className={`relative text-[10px] font-semibold leading-tight ${
                      active ? 'text-primary dark:text-primary-light' : 'text-elegant-600 dark:text-elegant-400'
                    }`}>
                      {label}
                    </span>

                    {/* Indicador activo (dot) */}
                    {active && (
                      <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-primary dark:bg-primary-light" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Espacio para safe area */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </div>
  );
}
