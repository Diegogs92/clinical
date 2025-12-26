'use client';

import { LucideIcon } from 'lucide-react';

interface IconWithBadgeProps {
  icon: LucideIcon;
  badge?: number;
  color?: string;
  iconClassName?: string;
  badgeClassName?: string;
  showZero?: boolean;
}

export default function IconWithBadge({
  icon: Icon,
  badge,
  color = 'bg-red-500',
  iconClassName = 'w-5 h-5',
  badgeClassName = '',
  showZero = false,
}: IconWithBadgeProps) {
  const showBadge = badge !== undefined && (badge > 0 || showZero);

  return (
    <div className="relative inline-block">
      <Icon className={iconClassName} />
      {showBadge && (
        <span
          className={`absolute -top-2 -right-2 ${color} text-white text-[10px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center border-2 border-white dark:border-elegant-900 transition-all duration-200 ${
            badge && badge > 0 ? 'animate-pulse' : ''
          } ${badgeClassName}`}
        >
          {badge && badge > 99 ? '99+' : badge}
        </span>
      )}
    </div>
  );
}
