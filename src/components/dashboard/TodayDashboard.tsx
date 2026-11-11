import React from 'react';
import {
  Play,
  CheckCircle2,
  Clock,
  Flame,
  Award,
  ArrowRight,
  Sparkles,
  BookOpen,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Check,
  Zap,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { getTodayStr, getLevelProgress } from '../../services/scheduleEngine';
import { Task } from '../../types';

interface TodayDashboardProps {
  onNavigateToSchedule: () => void;
  onNavigateToReviews: () => void;
  onNavigateToSubjects: () => void;
}

export const TodayDashboard: React.FC<TodayDashboardProps> = ({
  onNavigateToSchedule,
  onNavigateToReviews,
  onNavigateToSubjects,
}) => {
  const { state, startStudySession, skipTask } = useStudy();
  const { profile, tasks, subjects, reviews, dailyGoal } = state;

  const todayStr = getTodayStr();

  // Filter tasks for today
  const todayTasks = tasks.filter((t) => t.date === todayStr);
  const completedToday = todayTasks.filter((t) => t.status === 'concluida');
  const pendingToday = todayTasks.filter((t) => t.status === 'pendente' || t.status === 'em_andamento');

  // Next recommended task is the highest priority pending task
  const nextTask = pendingToday.length > 0 ? pendingToday[0] : null;

  // Planned vs studied minutes today
  const plannedMinutesToday = todayTasks.reduce((acc, t) => acc + t.durationMinutes, 0) || dailyGoal.targetMinutes;
  const studiedMinutesToday = dailyGoal.completedMinutes;

  // Spaced reviews due today
  const dueReviewsToday = reviews.filter((r) => r.dueDate === todayStr && r.status === 'pendente');

  // Level progress
  const levelProg = getLevelProgress(profile.xp);

  // Time of day greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome & Daily Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs dark:border-stone-800 dark:bg-stone-900 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black tracking-tight text-stone-900 dark:text-stone-100">
              {greeting}, {profile.name || 'Estudante'}!
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              <Zap className="h-3 w-3 fill-emerald-500 text-emerald-500" />
              Rotina Ativa
            </span>
          </div>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            {pendingToday.length > 0
              ? `Você tem ${pendingToday.length} ${pendingToday.length === 1 ? 'tarefa prioritária programada' : 'tarefas prioritárias programadas'} para hoje.`
              : 'Sensacional! Você já concluiu todas as tarefas programadas para hoje! 🎉'}
          </p>
        </div>

        {/* Gamification Snapshot */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-2 dark:border-amber-900/50 dark:bg-amber-950/40">
            <Flame className="h-5 w-5 fill-amber-500 text-amber-500 animate-pulse" />
            <div>
              <span className="block text-xs font-bold text-amber-900 dark:text-amber-300 leading-none">
                {profile.streakDays} dias seguidos
              </span>
              <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400">Sequência mantida</span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3.5 py-2 dark:border-indigo-900/50 dark:bg-indigo-950/40">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 font-extrabold text-white text-xs">
              {levelProg.currentLevel}
            </div>
            <div>
              <span className="block text-xs font-bold text-indigo-950 dark:text-indigo-200 leading-none">
                {levelProg.title}
              </span>
              <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400">{profile.xp} XP acumulados</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero: "PRÓXIMA TAREFA RECOMENDADA" */}
      {nextTask ? (
        <div className="relative overflow-hidden rounded-2xl border-2 border-indigo-500/30 bg-radial from-indigo-50/80 via-white to-stone-50 p-6 sm:p-7 shadow-sm dark:from-indigo-950/40 dark:via-stone-900 dark:to-stone-900 dark:border-indigo-500/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-extrabold text-white uppercase tracking-wider">
                  <Sparkles className="h-3 w-3" />
                  Próxima Tarefa Recomendada
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-bold"
                  style={{
                    backgroundColor: `${nextTask.subjectColor}20`,
                    color: nextTask.subjectColor,
                  }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: nextTask.subjectColor }}
                  />
                  {nextTask.subjectName}
                </span>
                <span className="rounded-md bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-600 uppercase dark:bg-stone-800 dark:text-stone-300">
                  {nextTask.type}
                </span>
                {nextTask.isSpacedReview && (
                  <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    Revisão D+{nextTask.reviewStep === 1 ? '1' : nextTask.reviewStep === 2 ? '7' : nextTask.reviewStep === 3 ? '15' : '30'}
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100">
                  {nextTask.topicName}
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                  Tempo estimado: <strong>{nextTask.durationMinutes} minutos</strong> de foco com objetivos estruturados.
                </p>
              </div>

              {/* Objectives List */}
              <div className="space-y-1.5 pt-1">
                {nextTask.objectives.map((obj, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-stone-700 dark:text-stone-300">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                      {i + 1}
                    </span>
                    <span>{obj}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Big Action button */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
              <button
                type="button"
                onClick={() => startStudySession(nextTask)}
                className="flex items-center justify-center gap-2.5 rounded-2xl bg-indigo-600 px-7 py-4 text-sm font-extrabold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 active:scale-95 transition-all"
              >
                <Play className="h-5 w-5 fill-white" />
                <span>COMEÇAR AGORA</span>
              </button>

              <button
                type="button"
                onClick={() => skipTask(nextTask.id)}
                className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-bold text-stone-600 hover:bg-stone-50 hover:text-stone-900 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200"
              >
                Pular para a próxima
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 sm:p-8 text-center dark:border-emerald-900/40 dark:bg-emerald-950/30">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600 dark:text-emerald-400" />
          <h3 className="mt-3 text-lg font-black text-emerald-950 dark:text-emerald-200">
            Você zerou suas metas de hoje!
          </h3>
          <p className="mt-1 text-xs text-emerald-800 dark:text-emerald-400 max-w-md mx-auto">
            Excelente disciplina. Descanse para absorver o conteúdo ou revise matérias no cronograma semanal.
          </p>
          <button
            onClick={onNavigateToSchedule}
            className="mt-4 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
          >
            Ver Próximos Dias
          </button>
        </div>
      )}

      {/* Progress Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Planned vs Studied */}
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs dark:border-stone-800 dark:bg-stone-900">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Tempo Dedicado Hoje
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-stone-900 dark:text-stone-100">
              {studiedMinutesToday}m
            </span>
            <span className="text-xs text-stone-400 dark:text-stone-500">
              de {plannedMinutesToday}m meta
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all"
              style={{
                width: `${Math.min(100, (studiedMinutesToday / Math.max(1, plannedMinutesToday)) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Tasks completed */}
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs dark:border-stone-800 dark:bg-stone-900">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Tarefas de Hoje
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-stone-900 dark:text-stone-100">
              {completedToday.length}
            </span>
            <span className="text-xs text-stone-400 dark:text-stone-500">
              de {todayTasks.length} concluídas
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all"
              style={{
                width: `${todayTasks.length > 0 ? (completedToday.length / todayTasks.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Spaced Reviews Due */}
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs dark:border-stone-800 dark:bg-stone-900">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Revisões Espaçadas
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-stone-900 dark:text-stone-100">
              {dueReviewsToday.length}
            </span>
            <span className="text-xs text-stone-400 dark:text-stone-500">para hoje</span>
          </div>
          <button
            onClick={onNavigateToReviews}
            className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
          >
            <span>Ver revisões</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Total Exam Countdown */}
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs dark:border-stone-800 dark:bg-stone-900">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Reta Final
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-stone-900 dark:text-stone-100">
              {profile.examDate
                ? Math.max(
                    0,
                    Math.ceil(
                      (new Date(profile.examDate).getTime() - new Date().getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  )
                : '—'}
            </span>
            <span className="text-xs text-stone-400 dark:text-stone-500">dias restantes</span>
          </div>
          <span className="mt-1 block text-xs text-stone-500 dark:text-stone-400 truncate">
            {profile.targetExam || 'Meta em progresso'}
          </span>
        </div>
      </div>

      {/* Main Study Plan Section: "SEU ESTUDO DE HOJE" */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs dark:border-stone-800 dark:bg-stone-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-4 mb-5">
          <div>
            <h3 className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
              Seu Estudo de Hoje
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Tarefas ordenadas por prioridade matemática (peso, dificuldade e curva do esquecimento)
            </p>
          </div>
          <button
            onClick={onNavigateToSchedule}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Ver semana completa</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {todayTasks.length === 0 ? (
          <div className="text-center py-8 text-stone-500 dark:text-stone-400">
            <p className="text-sm">Nenhuma tarefa alocada para hoje no cronograma.</p>
            <button
              onClick={onNavigateToSchedule}
              className="mt-2 rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
            >
              Configurar ou Recalcular Cronograma
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {todayTasks.map((task, idx) => {
              const isDone = task.status === 'concluida';
              return (
                <div
                  key={task.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border p-4 transition-all ${
                    isDone
                      ? 'border-stone-200 bg-stone-50/60 opacity-80 dark:border-stone-800/60 dark:bg-stone-900/50'
                      : 'border-stone-200 bg-white hover:border-indigo-200 hover:shadow-xs dark:border-stone-800 dark:bg-stone-900/90 dark:hover:border-indigo-800'
                  }`}
                >
                  {/* Left task details */}
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                        isDone
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-100 text-stone-600 border border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700'
                      }`}
                    >
                      {isDone ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: task.subjectColor }}
                        />
                        <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                          {task.subjectName}
                        </span>
                        <span className="rounded-md bg-stone-100 px-2 py-0.2 text-[10px] font-semibold text-stone-600 uppercase dark:bg-stone-800 dark:text-stone-300">
                          {task.type}
                        </span>
                        {task.isSpacedReview && (
                          <span className="rounded-md bg-amber-100 px-2 py-0.2 text-[10px] font-bold text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                            Revisão
                          </span>
                        )}
                      </div>

                      <h4
                        className={`mt-0.5 text-base font-bold ${
                          isDone ? 'line-through text-stone-400 dark:text-stone-500' : 'text-stone-900 dark:text-stone-100'
                        }`}
                      >
                        {task.topicName}
                      </h4>

                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="h-3 w-3" />
                          ⏱ {task.durationMinutes} min
                        </span>
                        {task.exercisesDone !== undefined && task.exercisesDone > 0 && (
                          <span>
                            • {task.exercisesCorrect}/{task.exercisesDone} acertos (
                            {Math.round(((task.exercisesCorrect || 0) / task.exercisesDone) * 100)}%)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Action buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {isDone ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        Concluído
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => skipTask(task.id)}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300"
                          title="Pular esta tarefa hoje"
                        >
                          Pular
                        </button>
                        <button
                          type="button"
                          onClick={() => startStudySession(task)}
                          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 active:scale-95 transition-all"
                        >
                          <Play className="h-3.5 w-3.5 fill-white" />
                          <span>COMEÇAR</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Attention Alert banner if any subject has low accuracy */}
      {subjects.some((s) => s.totalExercisesDone >= 5 && s.totalExercisesCorrect / s.totalExercisesDone < 0.6) && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 dark:text-amber-200">
            <span className="font-bold block">Atenção ao desempenho em exercícios:</span>
            O algoritmo detectou matérias com índice de acerto abaixo de 60% e já aumentou a frequência de revisões no seu cronograma inteligente para garantir a fixação do conteúdo.
          </div>
        </div>
      )}
    </div>
  );
};
