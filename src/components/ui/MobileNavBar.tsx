'use client';

import { LucideIcon } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

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

  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname?.startsWith(href));

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 md:hidden pointer-events-none">
      {/* Contenedor con padding safe area */}
      <div className="px-3 pb-safe">
        {/* Barra de navegación */}
        <div className="bg-white/95 dark:bg-elegant-900/95 backdrop-blur-xl rounded-3xl border border-elegant-200/60 dark:border-elegant-700/60 shadow-xl shadow-black/5 dark:shadow-black/20 overflow-hidden pointer-events-auto">
          {/* Grid de navegación */}
          <div className={`grid ${items.length === 4 ? 'grid-cols-4' : 'grid-cols-5'} gap-0`}>
            {items.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <button
                  key={href}
                  onClick={() => router.push(href)}
                  className="relative flex flex-col items-center justify-center py-3 px-2 min-h-[68px] active:scale-95 transition-transform duration-150"
                  aria-label={label}
                  aria-current={active ? 'page' : undefined}
                >
                  {/* Indicador activo superior */}
                  {active && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60 dark:from-primary-light/60 dark:via-primary-light dark:to-primary-light/60 rounded-b-full shadow-sm shadow-primary/30" />
                  )}

                  {/* Icono */}
                  <Icon
                    className={`w-6 h-6 mb-1 transition-colors duration-150 ${active
                      ? 'text-primary dark:text-primary-light stroke-[2.5]'
                      : 'text-elegant-400 dark:text-elegant-500 stroke-2'
                      }`}
                  />

                  {/* Label */}
                  <span
                    className={`text-[13px] font-medium transition-colors duration-150 ${active
                      ? 'text-primary dark:text-primary-light font-semibold'
                      : 'text-elegant-500 dark:text-elegant-400'
                      }`}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Espacio adicional para safe area en dispositivos con notch */}
      <div className="h-[env(safe-area-inset-bottom)] bg-white dark:bg-elegant-900" />
    </div>
  );
}
