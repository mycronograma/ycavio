import React from 'react';
import { X, Bell, CheckCheck, Flame, AlertTriangle, RotateCw, Trophy, Info, Trash2 } from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { useToast } from '../../context/ToastContext';
import { InAppNotification } from '../../types';
import { formatRelativeDatePtBr, formatFullDatePtBr } from '../../lib/dateUtils';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { state, markNotificationRead, markAllNotificationsRead, clearAllNotifications } =
    useStudy();
  const { showToast } = useToast();
  const notifications = state.notifications || [];

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: InAppNotification['type']) => {
    switch (type) {
      case 'streak':
        return <Flame className="h-4 w-4 text-amber-500" />;
      case 'backlog':
        return <AlertTriangle className="h-4 w-4 text-rose-500" />;
      case 'review':
        return <RotateCw className="h-4 w-4 text-indigo-500" />;
      case 'achievement':
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-indigo-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl dark:border-stone-800 dark:bg-stone-900 transition-all max-h-[85vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-xl p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-tight text-stone-900 dark:text-stone-100">
                Notificações
              </h2>
              {unreadCount > 0 && (
                <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-black text-white tabular-nums">
                  {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Lembretes de estudo, avisos de atraso e marcos da sua jornada
            </p>
          </div>
        </div>

        {/* Actions bar */}
        {notifications.length > 0 && (
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-stone-100 dark:border-stone-800 text-xs">
            <span className="text-stone-400 tabular-nums">
              {notifications.length} {notifications.length === 1 ? 'aviso' : 'avisos'}
            </span>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    markAllNotificationsRead();
                    showToast('Avisos marcados como lidos.', 'info');
                  }}
                  className="flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 transition whitespace-nowrap"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>Marcar lidas</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  clearAllNotifications();
                  showToast('Notificações limpas.', 'info');
                }}
                className="flex items-center gap-1 font-bold text-stone-500 hover:text-rose-600 dark:text-stone-400 dark:hover:text-rose-400 transition whitespace-nowrap"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Limpar tudo</span>
              </button>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-400">
              <Bell className="h-8 w-8 mx-auto mb-2 text-stone-300 dark:text-stone-700" />
              Você não tem notificações no momento.
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markNotificationRead(notif.id)}
                className={`relative flex items-start gap-3 rounded-xl border p-3.5 transition cursor-pointer ${
                  notif.read
                    ? 'border-stone-200/70 bg-stone-50/50 dark:border-stone-800 dark:bg-stone-900/40 opacity-75'
                    : 'border-indigo-200 bg-indigo-50/40 dark:border-indigo-900/50 dark:bg-indigo-950/20 shadow-2xs'
                }`}
              >
                <div className="mt-0.5 rounded-lg bg-white p-2 shadow-xs dark:bg-stone-800">
                  {getIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                      {notif.title}
                    </h4>
                    <span
                      title={formatFullDatePtBr(notif.date)}
                      className="text-[10px] font-medium text-stone-400 whitespace-nowrap shrink-0"
                    >
                      {formatRelativeDatePtBr(notif.date, {
                        capitalize: true,
                        includeDateForFar: false,
                      })}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                    {notif.message}
                  </p>
                </div>

                {!notif.read && (
                  <span className="h-2 w-2 rounded-full bg-indigo-600 shrink-0 mt-1.5" />
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-stone-100 px-4 py-2 text-xs font-bold text-stone-700 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700 transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
