/**
 * Persistent localStorage-backed storage for mock mode
 * Allows mock data to persist across page refreshes
 */

const STORAGE_PREFIX = 'clinic-pro-mock-';

export function saveToLocalStorage<T>(key: string, data: T[]): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
    }
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

export function loadFromLocalStorage<T>(key: string, defaultValue: T[] = []): T[] {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_PREFIX + key);
      if (stored) {
        return JSON.parse(stored) as T[];
      }
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error);
  }
  return defaultValue;
}

export function clearLocalStorage(key?: string): void {
  try {
    if (typeof window !== 'undefined') {
      if (key) {
        localStorage.removeItem(STORAGE_PREFIX + key);
      } else {
        // Clear all clinic-pro mock data
        Object.keys(localStorage).forEach(k => {
          if (k.startsWith(STORAGE_PREFIX)) {
            localStorage.removeItem(k);
          }
        });
      }
    }
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
}
