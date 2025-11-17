"use client";
import { useTheme } from "../contexts/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      aria-label="Alternar tema"
      onClick={toggleTheme}
      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/30 group"
    >
      {theme === "dark" ? (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-yellow-400 group-hover:text-yellow-300 transition-colors">
          <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" fill="currentColor" />
        </svg>
      ) : (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-amber-500 group-hover:text-amber-600 transition-colors">
          <circle cx="12" cy="12" r="5" fill="currentColor" />
          <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </g>
        </svg>
      )}
    </button>
  );
}
