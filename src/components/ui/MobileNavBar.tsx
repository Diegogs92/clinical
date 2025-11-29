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
      } else if (currentScrollY > lastScrollY) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 md:hidden pointer-events-none transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-2">
        <div className="relative overflow-hidden pointer-events-auto rounded-[28px] border border-elegant-200/60 dark:border-elegant-700/50 bg-white/98 dark:bg-elegant-900/98 backdrop-blur-3xl shadow-[0_-2px_40px_-4px_rgba(14,165,233,0.25)] dark:shadow-[0_-2px_40px_-4px_rgba(14,165,233,0.15)]">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5" />

          {action && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2">
              <button
                type="button"
                onClick={action.onPress}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-primary via-primary to-primary-dark text-white shadow-[0_8px_32px_-8px_rgba(14,165,233,0.7)] border-[5px] border-white dark:border-elegant-900 flex items-center justify-center active:scale-90 transition-all duration-200 touch-manipulation hover:shadow-[0_12px_40px_-8px_rgba(14,165,233,0.8)]"
                aria-label={action.label}
                title={action.label}
              >
                <action.icon className="w-7 h-7 stroke-[2.5]" />
              </button>
            </div>
          )}

          <div className="relative flex items-center justify-between gap-0.5 px-2 py-2">
            {items.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <button
                  key={href}
                  onClick={() => router.push(href)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-2xl transition-all duration-300 touch-manipulation min-h-[64px] ${
                    active
                      ? 'bg-gradient-to-b from-primary/20 via-primary/15 to-primary/10 text-primary-dark dark:text-primary-light shadow-md shadow-primary/20 scale-105'
                      : 'text-elegant-500 dark:text-elegant-400 active:bg-elegant-50 dark:active:bg-elegant-800/40 active:scale-95 hover:bg-elegant-50/50 dark:hover:bg-elegant-800/20'
                  }`}
                  aria-label={label}
                  aria-current={active ? 'page' : undefined}
                >
                  <div className={`relative transition-transform duration-300 ${active ? 'scale-110' : 'scale-100'}`}>
                    <Icon className={`w-6 h-6 ${active ? 'stroke-[2.5]' : 'stroke-2'}`} />
                    {active && (
                      <span className="absolute -inset-1 bg-primary/20 dark:bg-primary/30 rounded-full blur-sm -z-10 animate-pulse" aria-hidden="true" />
                    )}
                  </div>
                  <span className={`text-[10.5px] font-bold leading-tight truncate max-w-full tracking-tight ${active ? 'text-primary-dark dark:text-primary-light' : ''}`}>
                    {label}
                  </span>
                  {active && (
                    <span className="absolute bottom-1 h-1 w-10 rounded-full bg-gradient-to-r from-primary/50 via-primary to-primary/50 shadow-sm shadow-primary/50" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
