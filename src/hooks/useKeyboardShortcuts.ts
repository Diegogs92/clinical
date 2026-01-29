import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean; // Para CMD en Mac
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

/**
 * Hook para manejar atajos de teclado globales
 *
 * @example
 * useKeyboardShortcuts([
 *   {
 *     key: 'k',
 *     ctrl: true,
 *     action: () => setSearchOpen(true),
 *     description: 'Abrir búsqueda'
 *   },
 *   {
 *     key: 'Escape',
 *     action: () => closeModal(),
 *     description: 'Cerrar modal'
 *   }
 * ]);
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const isCtrlOrMeta = shortcut.ctrl || shortcut.meta;
        const ctrlPressed = event.ctrlKey || event.metaKey;
        const shiftPressed = event.shiftKey;
        const altPressed = event.altKey;

        // Verificar si las teclas modificadoras coinciden
        const ctrlMatch = isCtrlOrMeta ? ctrlPressed : !ctrlPressed;
        const shiftMatch = shortcut.shift ? shiftPressed : !shiftPressed;
        const altMatch = shortcut.alt ? altPressed : !altPressed;

        // Verificar si la tecla coincide (case-insensitive)
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          event.preventDefault();
          event.stopPropagation();
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Hook simplificado para atajos comunes
 */
export function useCommonShortcuts({
  onSearch,
  onNew,
  onClose,
  onSave,
}: {
  onSearch?: () => void;
  onNew?: () => void;
  onClose?: () => void;
  onSave?: () => void;
}) {
  const shortcuts: KeyboardShortcut[] = [];

  if (onSearch) {
    shortcuts.push({
      key: 'k',
      ctrl: true,
      meta: true,
      action: onSearch,
      description: 'Buscar (Ctrl+K)',
    });
  }

  if (onNew) {
    shortcuts.push({
      key: 'n',
      ctrl: true,
      meta: true,
      action: onNew,
      description: 'Nuevo (Ctrl+N)',
    });
  }

  if (onClose) {
    shortcuts.push({
      key: 'Escape',
      action: onClose,
      description: 'Cerrar (Esc)',
    });
  }

  if (onSave) {
    shortcuts.push({
      key: 's',
      ctrl: true,
      meta: true,
      action: onSave,
      description: 'Guardar (Ctrl+S)',
    });
  }

  useKeyboardShortcuts(shortcuts);
}
