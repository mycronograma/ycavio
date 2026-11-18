import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, AlertTriangle, Info, X, AlertCircle } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Record<string, number>>({});

  const dismissToast = useCallback((id: string) => {
    if (timersRef.current[id]) {
      window.clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'success') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
      timersRef.current[id] = window.setTimeout(() => {
        dismissToast(id);
      }, 3400);
    },
    [dismissToast]
  );

  const getStyleClasses = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'border-emerald-300 bg-white text-emerald-950 shadow-lg dark:border-emerald-500/40 dark:bg-[#0b1121] dark:text-emerald-200';
      case 'warning':
        return 'border-amber-300 bg-white text-amber-950 shadow-lg dark:border-amber-500/40 dark:bg-[#0b1121] dark:text-amber-200';
      case 'error':
        return 'border-rose-300 bg-white text-rose-950 shadow-lg dark:border-rose-500/40 dark:bg-[#0b1121] dark:text-rose-200';
      default:
        return 'border-indigo-300 bg-white text-slate-900 shadow-lg dark:border-cyan-400/40 dark:bg-[#0b1121] dark:text-slate-100';
    }
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />;
      default:
        return <Info className="h-4 w-4 text-indigo-600 dark:text-cyan-400 shrink-0" />;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {toasts.length > 0 && (
        <div
          aria-live="polite"
          className="pointer-events-none fixed bottom-20 md:bottom-5 right-4 z-[80] flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] sm:w-auto"
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs font-semibold backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-2 ${getStyleClasses(
                toast.type
              )}`}
            >
              {getIcon(toast.type)}
              <span className="flex-1 leading-snug">{toast.message}</span>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Fechar aviso"
                className="rounded-md p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
