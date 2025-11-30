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
    <div className="fixed inset-x-0 bottom-0 z-50 md:hidden">
      {/* Contenedor con padding safe area */}
      <div className="px-3 pb-safe">
        <div className="relative">
          {/* Botón de acción flotante */}
          {action && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-10">
              <button
                type="button"
                onClick={action.onPress}
                className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg shadow-primary/40 active:scale-90 transition-transform duration-150 flex items-center justify-center"
                aria-label={action.label}
              >
                <action.icon className="w-6 h-6 stroke-[2.5]" />
              </button>
            </div>
          )}

          {/* Barra de navegación */}
          <div className="bg-white/95 dark:bg-elegant-900/95 backdrop-blur-xl rounded-3xl border border-elegant-200/60 dark:border-elegant-700/60 shadow-xl shadow-black/5 dark:shadow-black/20 overflow-hidden">
            {/* Grid de navegación */}
            <div className="grid grid-cols-5 gap-0">
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
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary dark:bg-primary-light rounded-b-full" />
                    )}

                    {/* Icono */}
                    <Icon
                      className={`w-6 h-6 mb-1 transition-colors duration-150 ${
                        active
                          ? 'text-primary dark:text-primary-light stroke-[2.5]'
                          : 'text-elegant-400 dark:text-elegant-500 stroke-2'
                      }`}
                    />

                    {/* Label */}
                    <span
                      className={`text-[10px] font-medium transition-colors duration-150 ${
                        active
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
      </div>

      {/* Espacio adicional para safe area en dispositivos con notch */}
      <div className="h-[env(safe-area-inset-bottom)] bg-white dark:bg-elegant-900" />
    </div>
  );
}
