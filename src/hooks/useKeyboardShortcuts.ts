"use client";

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
  preventDefault?: boolean;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled = true) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true';

      // Allow Cmd/Ctrl+K even in input fields for global search
      const isGlobalSearchShortcut = (event.ctrlKey || event.metaKey) && event.key === 'k';

      if (isTyping && !isGlobalSearchShortcut) return;

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl === undefined || shortcut.ctrl === event.ctrlKey;
        const metaMatch = shortcut.meta === undefined || shortcut.meta === event.metaKey;
        const shiftMatch = shortcut.shift === undefined || shortcut.shift === event.shiftKey;
        const altMatch = shortcut.alt === undefined || shortcut.alt === event.altKey;
        const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase();

        // For Cmd/Ctrl shortcuts, match if either ctrl or meta is pressed
        const cmdCtrlMatch =
          (shortcut.ctrl || shortcut.meta) &&
          (event.ctrlKey || event.metaKey);

        const isMatch = cmdCtrlMatch
          ? keyMatch && shiftMatch && altMatch
          : keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch;

        if (isMatch) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);

  return shortcuts;
}

// Helper to format shortcut for display
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.ctrl || shortcut.meta) {
    parts.push(typeof navigator !== 'undefined' && navigator.platform.includes('Mac') ? '⌘' : 'Ctrl');
  }
  if (shortcut.shift) parts.push('⇧');
  if (shortcut.alt) parts.push(typeof navigator !== 'undefined' && navigator.platform.includes('Mac') ? '⌥' : 'Alt');

  parts.push(shortcut.key.toUpperCase());

  return parts.join('+');
}
