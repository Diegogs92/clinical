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
    <div className="fixed inset-x-0 bottom-0 z-40 md:hidden pointer-events-none">
      <div className="px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-2">
        <div className="relative overflow-hidden pointer-events-auto rounded-3xl border border-elegant-200/80 dark:border-elegant-800/80 bg-white/90 dark:bg-elegant-900/90 backdrop-blur-xl shadow-[0_12px_45px_-10px_rgba(14,165,233,0.35)]">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5" />

          {action && (
            <div className="absolute -top-7 left-1/2 -translate-x-1/2">
              <button
                type="button"
                onClick={action.onPress}
                className="w-14 h-14 rounded-full bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/30 border-4 border-white dark:border-elegant-900 flex items-center justify-center active:scale-95 transition-transform"
                aria-label={action.label}
                title={action.label}
              >
                <action.icon className="w-6 h-6" />
              </button>
            </div>
          )}

          <div className="relative flex items-end justify-between gap-1 px-2 pt-4 pb-2">
            {items.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <button
                  key={href}
                  onClick={() => router.push(href)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-2xl transition-all ${
                    active
                      ? 'bg-primary/10 text-primary dark:text-primary-light shadow-inner shadow-primary/10'
                      : 'text-elegant-500 dark:text-elegant-300 hover:text-primary'
                  }`}
                  aria-label={label}
                >
                  <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : ''}`} />
                  <span className="text-[11px] font-semibold leading-none">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
