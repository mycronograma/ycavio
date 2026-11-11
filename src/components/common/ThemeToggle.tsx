import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, ChevronDown, Check } from 'lucide-react';
import { useTheme, ThemeMode } from '../../context/ThemeContext';

interface ThemeToggleProps {
  showMenu?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ showMenu = false, className = '' }) => {
  const { theme, isDark, setTheme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (!showMenu) {
    // Quick 1-click toggle button
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`relative flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 shadow-xs transition-all hover:bg-stone-100 hover:text-stone-900 active:scale-95 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100 ${className}`}
        title={isDark ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
        aria-label="Alternar modo de cor"
      >
        {isDark ? (
          <Sun className="h-4 w-4 text-amber-400 transition-transform rotate-0 hover:rotate-45" />
        ) : (
          <Moon className="h-4 w-4 text-indigo-600 transition-transform -rotate-12 hover:rotate-0" />
        )}
      </button>
    );
  }

  // Full dropdown selector
  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 shadow-xs transition hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 ${className}`}
        aria-expanded={isOpen}
      >
        {theme === 'dark' ? (
          <Moon className="h-4 w-4 text-indigo-400" />
        ) : theme === 'light' ? (
          <Sun className="h-4 w-4 text-amber-500" />
        ) : (
          <Monitor className="h-4 w-4 text-stone-400" />
        )}
        <span className="capitalize">
          {theme === 'system' ? 'Sistema' : theme === 'dark' ? 'Escuro' : 'Claro'}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-stone-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-44 origin-top-right rounded-2xl border border-stone-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5 z-50 dark:border-stone-800 dark:bg-stone-900">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
            Aparência
          </div>
          <button
            type="button"
            onClick={() => {
              setTheme('light');
              setIsOpen(false);
            }}
            className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-medium transition ${
              theme === 'light'
                ? 'bg-indigo-50 text-indigo-700 font-bold dark:bg-indigo-950/60 dark:text-indigo-300'
                : 'text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sun className="h-3.5 w-3.5 text-amber-500" />
              <span>Modo Claro</span>
            </div>
            {theme === 'light' && <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setTheme('dark');
              setIsOpen(false);
            }}
            className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-medium transition ${
              theme === 'dark'
                ? 'bg-indigo-50 text-indigo-700 font-bold dark:bg-indigo-950/60 dark:text-indigo-300'
                : 'text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Moon className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
              <span>Modo Escuro</span>
            </div>
            {theme === 'dark' && <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setTheme('system');
              setIsOpen(false);
            }}
            className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-medium transition ${
              theme === 'system'
                ? 'bg-indigo-50 text-indigo-700 font-bold dark:bg-indigo-950/60 dark:text-indigo-300'
                : 'text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Monitor className="h-3.5 w-3.5 text-stone-400" />
              <span>Seguir Sistema</span>
            </div>
            {theme === 'system' && <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />}
          </button>
        </div>
      )}
    </div>
  );
};
