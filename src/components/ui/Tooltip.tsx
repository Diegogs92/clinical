'use client';

import { ReactNode, useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  disabled?: boolean;
}

export default function Tooltip({
  content,
  children,
  position = 'top',
  delay = 300,
  disabled = false,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const tooltipRef = useRef<HTMLDivElement>(null);

  const showTooltip = () => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-elegant-900 dark:border-t-elegant-700',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-elegant-900 dark:border-b-elegant-700',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-elegant-900 dark:border-l-elegant-700',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-elegant-900 dark:border-r-elegant-700',
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && !disabled && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className={`
            absolute z-50
            px-3 py-2
            text-xs font-medium text-white
            bg-elegant-900 dark:bg-elegant-700
            rounded-lg shadow-lg
            whitespace-nowrap
            pointer-events-none
            animate-in fade-in-0 zoom-in-95
            duration-150
            ${positionClasses[position]}
          `}
        >
          {content}
          {/* Flecha del tooltip */}
          <div
            className={`
              absolute
              w-0 h-0
              border-4 border-transparent
              ${arrowClasses[position]}
            `}
          />
        </div>
      )}
    </div>
  );
}
