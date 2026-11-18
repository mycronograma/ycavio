import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Zap } from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { useToast } from '../../context/ToastContext';
import { getTodayStr } from '../../services/scheduleEngine';

export const BacklogWarning: React.FC = () => {
  const { state, rescheduleBacklog } = useStudy();
  const { showToast } = useToast();
  const { tasks } = state;

  const [isRescheduling, setIsRescheduling] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const todayStr = getTodayStr();
  const overdueTasks = tasks.filter(
    (t) => t.date < todayStr && t.status !== 'concluida' && t.status !== 'pulada'
  );

  if (overdueTasks.length === 0) return null;

  const overdueMinutes = overdueTasks.reduce((acc, t) => acc + t.durationMinutes, 0);
  const overdueHours = (overdueMinutes / 60).toFixed(1);

  const handleReschedule = () => {
    setIsRescheduling(true);
    setTimeout(() => {
      const result = rescheduleBacklog();
      setIsRescheduling(false);
      const msg = `${result.rescheduledCount} ${result.rescheduledCount === 1 ? 'tarefa foi redistribuída' : 'tarefas foram redistribuídas'} respeitando sua carga diária!`;
      setSuccessMsg(msg);
      showToast(msg, 'success');
      setTimeout(() => setSuccessMsg(null), 4000);
    }, 350);
  };

  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-5 shadow-xs dark:border-amber-900/60 dark:bg-amber-950/40 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-amber-200/60 p-2.5 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-amber-950 dark:text-amber-100 flex items-center gap-2">
              <span>Atenção: {overdueTasks.length} {overdueTasks.length === 1 ? 'tarefa atrasada' : 'tarefas atrasadas'} detectadas</span>
              <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[11px] font-black text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                {overdueHours}h pendentes
              </span>
            </h4>
            <p className="mt-0.5 text-xs text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
              Tarefas de dias anteriores que não foram marcadas como concluídas podem sobrecarregar seus estudos. O algoritmo pode redistribuí-las automaticamente.
            </p>
            {successMsg && (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>{successMsg}</span>
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleReschedule}
          disabled={isRescheduling}
          className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-600/20 hover:bg-amber-700 active:scale-95 disabled:opacity-50 transition"
        >
          <Zap className={`h-4 w-4 ${isRescheduling ? 'animate-spin' : ''}`} />
          <span>{isRescheduling ? 'Redistribuindo...' : 'Reagendar Automaticamente'}</span>
        </button>
      </div>
    </div>
  );
};
