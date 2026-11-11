import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Clock,
  Play,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  Filter,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { getTodayStr, addDays, formatDate } from '../../services/scheduleEngine';
import { Task } from '../../types';

export const ScheduleView: React.FC = () => {
  const { state, startStudySession, recalculateSchedule } = useStudy();
  const { tasks, profile } = state;

  const todayStr = getTodayStr();

  // Selected date filter (defaults to today)
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
  const [isRecalculating, setIsRecalculating] = useState(false);

  const handleRecalculate = () => {
    setIsRecalculating(true);
    setTimeout(() => {
      recalculateSchedule();
      setIsRecalculating(false);
    }, 450);
  };

  // Generate 7 days range starting from today
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const dStr = addDays(todayStr, i);
    const dateObj = new Date(dStr + 'T12:00:00');
    const dayName = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' });
    const dayNum = dateObj.getDate();
    const tasksCount = tasks.filter((t) => t.date === dStr).length;
    const completedCount = tasks.filter((t) => t.date === dStr && t.status === 'concluida').length;

    return {
      dateStr: dStr,
      dayName: dayName.replace('.', ''),
      dayNum,
      tasksCount,
      completedCount,
      isToday: dStr === todayStr,
    };
  });

  // Tasks for day view
  const currentDayTasks = tasks.filter((t) => t.date === selectedDate);

  // Overdue tasks
  const overdueTasks = tasks.filter(
    (t) => t.date < todayStr && (t.status === 'pendente' || t.status === 'atrasada')
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-xs dark:border-stone-800 dark:bg-stone-900 transition-colors">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <span>Cronograma Inteligente de Estudos</span>
          </h2>
          <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
            Distribuição ponderada por peso do conteúdo, curva do esquecimento e seu histórico
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Day / Week toggle */}
          <div className="flex rounded-xl border border-stone-200 bg-stone-100 p-1 text-xs font-semibold dark:border-stone-800 dark:bg-stone-800/80">
            <button
              onClick={() => setViewMode('week')}
              className={`rounded-lg px-3 py-1 transition ${
                viewMode === 'week'
                  ? 'bg-white text-indigo-900 shadow-xs font-bold dark:bg-stone-900 dark:text-indigo-300'
                  : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200'
              }`}
            >
              Visão Semanal
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`rounded-lg px-3 py-1 transition ${
                viewMode === 'day'
                  ? 'bg-white text-indigo-900 shadow-xs font-bold dark:bg-stone-900 dark:text-indigo-300'
                  : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200'
              }`}
            >
              Visão Diária
            </button>
          </div>

          {/* Recalculate button */}
          <button
            onClick={handleRecalculate}
            disabled={isRecalculating}
            className="flex items-center gap-1.5 rounded-xl bg-stone-900 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-stone-800 disabled:opacity-50 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRecalculating ? 'animate-spin' : ''}`} />
            <span>Recalcular</span>
          </button>
        </div>
      </div>

      {/* Overdue alert if any */}
      {overdueTasks.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/40 dark:bg-rose-950/30">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <div className="text-xs text-rose-900 dark:text-rose-200">
              <span className="font-bold block">
                Você tem {overdueTasks.length} {overdueTasks.length === 1 ? 'tarefa atrasada' : 'tarefas atrasadas'} de dias anteriores.
              </span>
              O algoritmo pode redistribuir essas tarefas nos próximos dias sem sobrecarregar sua rotina.
            </div>
          </div>
          <button
            onClick={handleRecalculate}
            className="self-start sm:self-auto rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700"
          >
            Rebalancear Agora
          </button>
        </div>
      )}

      {/* Week Navigator Strip */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((w) => {
          const isSelected = selectedDate === w.dateStr;
          return (
            <button
              key={w.dateStr}
              type="button"
              onClick={() => {
                setSelectedDate(w.dateStr);
                if (viewMode === 'week') setViewMode('day');
              }}
              className={`flex flex-col items-center justify-center rounded-2xl border p-2.5 sm:p-3 transition-all ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600/20 dark:border-indigo-500 dark:bg-indigo-950/50 dark:ring-indigo-500/30'
                  : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700 dark:hover:bg-stone-850'
              }`}
            >
              <span className="text-[11px] font-bold uppercase text-stone-500 dark:text-stone-400">
                {w.dayName}
              </span>
              <span className="text-base sm:text-lg font-black text-stone-900 dark:text-stone-100 mt-0.5">
                {w.dayNum}
              </span>
              {w.isToday && (
                <span className="rounded-full bg-indigo-600 px-1.5 py-0.2 text-[9px] font-bold text-white mt-1">
                  Hoje
                </span>
              )}
              <div className="mt-1 flex items-center gap-1 text-[10px] text-stone-400 dark:text-stone-500">
                {w.tasksCount > 0 ? (
                  <span>
                    {w.completedCount}/{w.tasksCount}
                  </span>
                ) : (
                  <span>Livre</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* VIEW MODE: WEEK (7 Days Columns or Accordions) */}
      {viewMode === 'week' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {weekDays.map((w) => {
              const dayTasks = tasks.filter((t) => t.date === w.dateStr);
              return (
                <div
                  key={w.dateStr}
                  className={`rounded-2xl border p-4 shadow-xs flex flex-col justify-between ${
                    w.isToday
                      ? 'border-indigo-300 bg-indigo-50/20 ring-1 ring-indigo-200 dark:border-indigo-900/60 dark:bg-indigo-950/20 dark:ring-indigo-900/40'
                      : 'border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900'
                  }`}
                >
                  <div>
                    {/* Column Header */}
                    <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-stone-900 dark:text-stone-100 capitalize">
                          {w.dayName}, {w.dayNum}
                        </span>
                        {w.isToday && (
                          <span className="rounded-md bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            Hoje
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-stone-400 dark:text-stone-500">
                        {dayTasks.length} {dayTasks.length === 1 ? 'bloco' : 'blocos'}
                      </span>
                    </div>

                    {/* Task cards */}
                    {dayTasks.length === 0 ? (
                      <div className="py-6 text-center text-xs text-stone-400 dark:text-stone-500">
                        Nenhum estudo agendado para este dia.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {dayTasks.map((t, tIdx) => {
                          const isDone = t.status === 'concluida';
                          return (
                            <div
                              key={`${t.id}-${tIdx}`}
                              className={`rounded-xl border p-3 transition ${
                                isDone
                                  ? 'border-stone-200 bg-stone-50/60 opacity-75 dark:border-stone-800 dark:bg-stone-800/40'
                                  : 'border-stone-200 bg-white hover:border-indigo-300 dark:border-stone-800 dark:bg-stone-900/90 dark:hover:border-indigo-700'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="h-2.5 w-2.5 rounded-full"
                                    style={{ backgroundColor: t.subjectColor }}
                                  />
                                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                                    {t.subjectName}
                                  </span>
                                </div>
                                <span className="text-[10px] font-semibold text-stone-400 dark:text-stone-500">
                                  ⏱ {t.durationMinutes}m
                                </span>
                              </div>

                              <h4
                                className={`mt-1 text-xs font-bold leading-tight ${
                                  isDone ? 'line-through text-stone-400 dark:text-stone-500' : 'text-stone-900 dark:text-stone-100'
                                }`}
                              >
                                {t.topicName}
                              </h4>

                              <div className="mt-2.5 flex items-center justify-between pt-1 border-t border-stone-50 dark:border-stone-800">
                                <span className="rounded-md bg-stone-100 px-1.5 py-0.2 text-[9px] font-semibold text-stone-600 uppercase dark:bg-stone-800 dark:text-stone-400">
                                  {t.type}
                                </span>

                                {isDone ? (
                                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Feito
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => startStudySession(t)}
                                    className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                                  >
                                    <Play className="h-3 w-3 fill-indigo-600 dark:fill-indigo-400" />
                                    <span>Estudar</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* VIEW MODE: DAY (Expanded Detailed List) */
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs dark:border-stone-800 dark:bg-stone-900">
          <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-4 mb-4">
            <h3 className="text-lg font-extrabold text-stone-900 dark:text-stone-100">
              Tarefas para {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { dateStyle: 'full' })}
            </h3>
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              {currentDayTasks.length} {currentDayTasks.length === 1 ? 'tarefa' : 'tarefas'}
            </span>
          </div>

          {currentDayTasks.length === 0 ? (
            <div className="py-12 text-center text-stone-500 dark:text-stone-400">
              <p className="text-sm">Nenhum estudo agendado para esta data específica.</p>
              <button
                onClick={handleRecalculate}
                className="mt-3 rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
              >
                Distribuir Matérias Neste Dia
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {currentDayTasks.map((t, idx) => {
                const isDone = t.status === 'concluida';
                return (
                  <div
                    key={`${t.id}-${idx}`}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border p-4 ${
                      isDone
                        ? 'border-stone-200 bg-stone-50/60 opacity-80 dark:border-stone-800 dark:bg-stone-800/40'
                        : 'border-stone-200 bg-white hover:border-indigo-300 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-indigo-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                          isDone
                            ? 'bg-emerald-600 text-white'
                            : 'bg-stone-100 text-stone-700 border border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700'
                        }`}
                      >
                        {isDone ? '✓' : idx + 1}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: t.subjectColor }}
                          />
                          <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                            {t.subjectName}
                          </span>
                          <span className="rounded-md bg-stone-100 px-2 py-0.2 text-[10px] font-semibold text-stone-600 uppercase dark:bg-stone-800 dark:text-stone-300">
                            {t.type}
                          </span>
                          {t.isSpacedReview && (
                            <span className="rounded-md bg-amber-100 px-2 py-0.2 text-[10px] font-bold text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                              Revisão Espaçada
                            </span>
                          )}
                        </div>

                        <h4
                          className={`mt-0.5 text-base font-bold ${
                            isDone ? 'line-through text-stone-400 dark:text-stone-500' : 'text-stone-900 dark:text-stone-100'
                          }`}
                        >
                          {t.topicName}
                        </h4>

                        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                          ⏱ {t.durationMinutes} minutos • Prioridade calculada: {t.priorityScore} pts
                        </p>

                        <div className="mt-2 space-y-1">
                          {t.objectives.map((obj, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-300">
                              <span className="h-1.5 w-1.5 rounded-full bg-stone-300 dark:bg-stone-600" />
                              <span>{obj}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="self-end sm:self-center">
                      {isDone ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          Concluído
                        </span>
                      ) : (
                        <button
                          onClick={() => startStudySession(t)}
                          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 active:scale-95 transition-all"
                        >
                          <Play className="h-3.5 w-3.5 fill-white" />
                          <span>Iniciar Bloco</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
