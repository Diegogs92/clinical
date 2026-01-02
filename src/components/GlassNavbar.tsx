'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { LucideIcon } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface GlassNavbarProps {
  items: NavItem[];
}

export default function GlassNavbar({ items }: GlassNavbarProps) {
  const pathname = usePathname();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [bubbleStyle, setBubbleStyle] = useState<React.CSSProperties>({});
  const navRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const activeIndex = items.findIndex(
    ({ href }) => pathname === href || (href !== '/dashboard' && pathname?.startsWith(href))
  );

  useEffect(() => {
    const updateBubble = (index: number) => {
      const item = itemRefs.current[index];
      const nav = navRef.current;

      if (item && nav) {
        const navRect = nav.getBoundingClientRect();
        const itemRect = item.getBoundingClientRect();

        setBubbleStyle({
          left: `${itemRect.left - navRect.left}px`,
          width: `${itemRect.width}px`,
          opacity: 1,
        });
      }
    };

    if (hoveredIndex !== null) {
      updateBubble(hoveredIndex);
    } else if (activeIndex !== -1) {
      updateBubble(activeIndex);
    }
  }, [hoveredIndex, activeIndex]);

  return (
    <nav
      ref={navRef}
      className="relative hidden md:flex items-center bg-white/70 dark:bg-elegant-900/70 rounded-full px-2 py-1.5 backdrop-blur-xl border border-elegant-200 dark:border-elegant-700/50 shadow-lg shadow-elegant-200/50 dark:shadow-elegant-900/50"
      onMouseLeave={() => setHoveredIndex(null)}
    >
      {/* Burbuja deslizante glass */}
      <div
        className="absolute top-1.5 bottom-1.5 rounded-full bg-gradient-to-r from-primary/90 to-primary-light/90 backdrop-blur-md shadow-lg shadow-primary/30 transition-all duration-300 ease-out pointer-events-none"
        style={bubbleStyle}
      />

      {items.map(({ href, label, icon: Icon }, index) => {
        const isActive = index === activeIndex;
        const isHovered = index === hoveredIndex;
        // El texto debe ser blanco si es el activo O si es el hover actual
        const isHighlighted = (hoveredIndex !== null && isHovered) || (hoveredIndex === null && isActive);

        return (
          <Link
            key={href}
            href={href}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            onMouseEnter={() => setHoveredIndex(index)}
            className={`
              relative z-10 flex items-center gap-2 px-4 py-2.5 rounded-full text-[0.95rem] font-semibold
              transition-colors duration-300 ease-out
              ${isHighlighted
                ? 'text-white'
                : 'text-elegant-600 dark:text-elegant-300'
              }
            `}
          >
            <Icon className="w-4 h-4 transition-transform duration-300" />
            <span className="whitespace-nowrap">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
