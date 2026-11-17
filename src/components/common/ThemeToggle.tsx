import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, ChevronDown, Check, Zap } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  showMenu?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ showMenu = false, className = '' }) => {
  const { theme, isDark, isNeon, isNeonLight, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const currentLabel =
    theme === 'neon'
      ? 'Gamer Escuro'
      : theme === 'neon-light'
      ? 'Gamer Claro'
      : theme === 'system'
      ? 'Sistema'
      : theme === 'dark'
      ? 'Minimalista Escuro'
      : 'Minimalista Claro';

  const isGamerActive = theme === 'neon' || theme === 'neon-light';
  const isMinimalActive = theme === 'light' || theme === 'dark';

  const dropdownMenu = isOpen && (
    <div className="absolute right-0 mt-1.5 w-60 origin-top-right rounded-2xl border border-stone-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5 z-50 dark:border-slate-800 dark:bg-[#0b1121] space-y-1">
      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500">
        Escolha o Tema
      </div>

      {/* 1. Gamer (Claro / Escuro) */}
      <div
        className={`flex items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-xs transition ${
          isGamerActive
            ? 'bg-cyan-50/80 text-cyan-700 font-bold dark:bg-cyan-500/15 dark:text-cyan-300'
            : 'text-stone-700 hover:bg-stone-100/80 dark:text-slate-300 dark:hover:bg-slate-800/80'
        }`}
      >
        <button
          type="button"
          onClick={() => {
            setTheme(isDark ? 'neon' : 'neon-light');
            setIsOpen(false);
          }}
          className="flex items-center gap-2 font-semibold text-left"
        >
          <Zap className={`h-3.5 w-3.5 ${isGamerActive ? 'text-cyan-500' : 'text-cyan-500/80'}`} />
          <span>Gamer</span>
        </button>

        <div className="flex items-center gap-0.5 rounded-lg bg-stone-200/80 p-0.5 dark:bg-slate-900/90">
          <button
            type="button"
            onClick={() => {
              setTheme('neon-light');
              setIsOpen(false);
            }}
            className={`rounded-md px-2 py-0.5 text-[11px] font-bold transition ${
              theme === 'neon-light'
                ? 'bg-white text-cyan-700 shadow-xs'
                : 'text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Claro
          </button>
          <button
            type="button"
            onClick={() => {
              setTheme('neon');
              setIsOpen(false);
            }}
            className={`rounded-md px-2 py-0.5 text-[11px] font-bold transition ${
              theme === 'neon'
                ? 'bg-slate-950 text-cyan-300 shadow-xs ring-1 ring-cyan-400/50'
                : 'text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Escuro
          </button>
        </div>
      </div>

      {/* 2. Minimalista (Claro / Escuro) */}
      <div
        className={`flex items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-xs transition ${
          isMinimalActive
            ? 'bg-indigo-50 text-indigo-700 font-bold dark:bg-indigo-950/60 dark:text-indigo-300'
            : 'text-stone-700 hover:bg-stone-100/80 dark:text-slate-300 dark:hover:bg-slate-800/80'
        }`}
      >
        <button
          type="button"
          onClick={() => {
            setTheme(isDark ? 'dark' : 'light');
            setIsOpen(false);
          }}
          className="flex items-center gap-2 font-semibold text-left"
        >
          {theme === 'light' ? (
            <Sun className="h-3.5 w-3.5 text-amber-500" />
          ) : (
            <Moon className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
          )}
          <span>Minimalista</span>
        </button>

        <div className="flex items-center gap-0.5 rounded-lg bg-stone-200/80 p-0.5 dark:bg-slate-900/90">
          <button
            type="button"
            onClick={() => {
              setTheme('light');
              setIsOpen(false);
            }}
            className={`rounded-md px-2 py-0.5 text-[11px] font-bold transition ${
              theme === 'light'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Claro
          </button>
          <button
            type="button"
            onClick={() => {
              setTheme('dark');
              setIsOpen(false);
            }}
            className={`rounded-md px-2 py-0.5 text-[11px] font-bold transition ${
              theme === 'dark'
                ? 'bg-slate-800 text-indigo-300 shadow-xs'
                : 'text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Escuro
          </button>
        </div>
      </div>

      {/* 3. Sistema */}
      <button
        type="button"
        onClick={() => {
          setTheme('system');
          setIsOpen(false);
        }}
        className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-medium transition ${
          theme === 'system'
            ? 'bg-indigo-50 text-indigo-700 font-bold dark:bg-indigo-950/60 dark:text-indigo-300'
            : 'text-stone-700 hover:bg-stone-100 dark:text-slate-300 dark:hover:bg-slate-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <Monitor className="h-3.5 w-3.5 text-stone-400" />
          <span>Sistema</span>
        </div>
        {theme === 'system' && <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />}
      </button>
    </div>
  );

  if (!showMenu) {
    return (
      <div className="relative inline-block text-left" ref={menuRef}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`relative flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 shadow-xs transition-all hover:bg-stone-100 hover:text-stone-900 active:scale-95 dark:border-slate-800 dark:bg-[#0b1121] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white ${
            isNeon
              ? 'border-cyan-400/60 text-cyan-300 shadow-[0_0_14px_rgba(0,245,255,0.3)]'
              : isNeonLight
              ? 'border-cyan-500/60 text-cyan-600 shadow-[0_0_12px_rgba(6,182,212,0.22)]'
              : ''
          } ${className}`}
          title={`Tema atual: ${currentLabel} (clique para escolher)`}
          aria-label="Selecionar tema de aparência"
          aria-expanded={isOpen}
        >
          {isNeon ? (
            <Zap className="h-4 w-4 text-cyan-300 fill-cyan-400/30 drop-shadow-[0_0_6px_rgba(0,245,255,0.8)]" />
          ) : isNeonLight ? (
            <Zap className="h-4 w-4 text-cyan-600 fill-cyan-500/20" />
          ) : isDark ? (
            <Moon className="h-4 w-4 text-indigo-400" />
          ) : (
            <Sun className="h-4 w-4 text-amber-500" />
          )}
        </button>

        {dropdownMenu}
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 shadow-xs transition hover:bg-stone-50 dark:border-slate-800 dark:bg-[#0b1121] dark:text-slate-300 dark:hover:bg-slate-800 ${className}`}
        aria-expanded={isOpen}
      >
        {theme === 'neon' ? (
          <Zap className="h-4 w-4 text-cyan-400" />
        ) : theme === 'neon-light' ? (
          <Zap className="h-4 w-4 text-cyan-600" />
        ) : theme === 'dark' ? (
          <Moon className="h-4 w-4 text-indigo-400" />
        ) : theme === 'light' ? (
          <Sun className="h-4 w-4 text-amber-500" />
        ) : (
          <Monitor className="h-4 w-4 text-stone-400" />
        )}
        <span>{currentLabel}</span>
        <ChevronDown className="h-3.5 w-3.5 text-stone-400" />
      </button>

      {dropdownMenu}
    </div>
  );
};
