import React, { useState, useMemo } from 'react';
import {
  Target,
  Clock,
  CheckCircle2,
  ListTodo,
  Plus,
  Play,
  SlidersHorizontal,
  Trash2,
  RotateCcw,
  CalendarDays,
  Check,
  Repeat,
  HelpCircle,
  Flame,
  Sparkles,
  Zap,
  RotateCw,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { getTodayStr, getLevelProgress } from '../../services/scheduleEngine';
import { TaskType, SpacedReview } from '../../types';
import { BacklogWarning } from '../dashboard/BacklogWarning';
import { PassProjection } from '../dashboard/PassProjection';
import { formatTimerClock } from '../study/ActiveStudyModal';

interface DailyGoalsViewProps {
  onNavigateToSchedule: () => void;
  onNavigateToReviews: () => void;
  onNavigateToSubjects: () => void;
}

function formatMinutesLabel(totalMins: number): string {
  const safe = Math.max(0, Math.round(totalMins));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatTodayHeading(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const formatted = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(dateObj);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

const TASK_TYPE_LABELS: Record<TaskType, string> = {
  teoria: 'Teoria',
  exercicios: 'Questões',
  revisao: 'Revisão',
  simulado: 'Simulado',
};

const CHECKLIST_SUGGESTIONS = [
  'Revisar caderno de erros',
  'Leitura / Lei Seca (20 min)',
  'Fazer bateria extra de questões',
];

export const DailyGoalsView: React.FC<DailyGoalsViewProps> = ({
  onNavigateToSchedule,
  onNavigateToReviews,
  onNavigateToSubjects,
}) => {
  const {
    state,
    activeTimerDraft,
    startStudySession,
    resumePausedTimer,
    clearTimerDraft,
    skipTask,
    recalculateSchedule,
    logQuestions,
    completeSpacedReview,
    updateDailyGoalTargets,
    addCustomDailyGoal,
    toggleCustomDailyGoal,
    deleteCustomDailyGoal,
    resetTodayCustomChecklist,
  } = useStudy();

  const todayStr = getTodayStr();
  const { profile, dailyGoal, tasks, sessions, questionLogs = [], subjects, reviews } = state;

  // Editable targets state
  const [isEditingTargets, setIsEditingTargets] = useState(false);
  const [draftMinutes, setDraftMinutes] = useState(String(dailyGoal.targetMinutes || 120));
  const [draftQuestions, setDraftQuestions] = useState(String(dailyGoal.targetQuestions ?? 30));
  const [draftTasks, setDraftTasks] = useState(String(dailyGoal.targetTasks || 2));

  // Quick questions logger inside Questões card
  const [showQuickQForm, setShowQuickQForm] = useState(false);
  const [quickQSubjectId, setQuickQSubjectId] = useState(() => subjects[0]?.id || '');
  const [quickQTotal, setQuickQTotal] = useState('10');
  const [quickQCorrect, setQuickQCorrect] = useState('7');

  // Custom checklist creator state
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalRecurring, setNewGoalRecurring] = useState(true);

  // Inline spaced review grading modal
  const [activeReviewToGrade, setActiveReviewToGrade] = useState<SpacedReview | null>(null);

  // Live automatic calculations strictly for today's date (YYYY-MM-DD)
  const todayStats = useMemo(() => {
    const todaySessions = sessions.filter(
      (s) => typeof s.date === 'string' && s.date.slice(0, 10) === todayStr
    );
    const todayLogs = questionLogs.filter(
      (q) => typeof q.date === 'string' && q.date.slice(0, 10) === todayStr
    );
    const todayTasks = tasks.filter((t) => t.date === todayStr);
    const pendingTasks = todayTasks.filter(
      (t) => t.status === 'pendente' || t.status === 'em_andamento'
    );

    const studiedMinutes = todaySessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

    const sessionQuestionsDone = todaySessions.reduce((acc, s) => acc + (s.exercisesDone || 0), 0);
    const sessionQuestionsCorrect = todaySessions.reduce(
      (acc, s) => acc + (s.exercisesCorrect || 0),
      0
    );

    const logQuestionsDone = todayLogs.reduce((acc, q) => acc + (q.totalQuestions || 0), 0);
    const logQuestionsCorrect = todayLogs.reduce((acc, q) => acc + (q.correctAnswers || 0), 0);

    const questionsDone = sessionQuestionsDone + logQuestionsDone;
    const questionsCorrect = sessionQuestionsCorrect + logQuestionsCorrect;

    const completedTasks = todayTasks.filter((t) => t.status === 'concluida').length;
    const sortedTodayTasks = [...todayTasks].sort((a, b) => {
      const rank = (s: string) => (s === 'em_andamento' ? 0 : s === 'pendente' ? 1 : 2);
      return rank(a.status) - rank(b.status);
    });

    const totalStudiedAllTime = sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

    return {
      studiedMinutes,
      questionsDone,
      questionsCorrect,
      todayTasks: sortedTodayTasks,
      pendingTasks,
      completedTasks,
      nextTask: pendingTasks.length > 0 ? pendingTasks[0] : null,
      totalStudiedAllTime,
    };
  }, [sessions, questionLogs, tasks, todayStr]);

  const dueReviewsToday = useMemo(
    () => reviews.filter((r) => r.dueDate <= todayStr && r.status === 'pendente'),
    [reviews, todayStr]
  );

  const levelProg = getLevelProgress(profile.xp);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  const targetMinutes = Math.max(15, dailyGoal.targetMinutes || 120);
  const targetQuestions = Math.max(1, dailyGoal.targetQuestions ?? 30);
  const plannedTasksTarget =
    todayStats.todayTasks.length > 0
      ? todayStats.todayTasks.length
      : Math.max(1, dailyGoal.targetTasks || 2);

  const customGoals = dailyGoal.customGoals || [];
  const completedCustomCount = customGoals.filter((g) => g.completed).length;

  const timeProgress = Math.min(100, Math.round((todayStats.studiedMinutes / targetMinutes) * 100));
  const questionsProgress = Math.min(
    100,
    Math.round((todayStats.questionsDone / targetQuestions) * 100)
  );
  const tasksProgress = Math.min(
    100,
    Math.round((todayStats.completedTasks / plannedTasksTarget) * 100)
  );
  const checklistProgress =
    customGoals.length > 0 ? Math.round((completedCustomCount / customGoals.length) * 100) : null;

  const overallPercent = useMemo(() => {
    const components = [timeProgress, questionsProgress, tasksProgress];
    if (checklistProgress !== null) {
      components.push(checklistProgress);
    }
    const sum = components.reduce((acc, val) => acc + val, 0);
    return Math.round(sum / components.length);
  }, [timeProgress, questionsProgress, tasksProgress, checklistProgress]);

  const accuracyPercent =
    todayStats.questionsDone > 0
      ? Math.round((todayStats.questionsCorrect / todayStats.questionsDone) * 100)
      : null;

  const daysToExam = profile.examDate
    ? Math.max(
        0,
        Math.ceil(
          (new Date(profile.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        )
      )
    : null;

  const handleOpenEditTargets = () => {
    setDraftMinutes(String(targetMinutes));
    setDraftQuestions(String(targetQuestions));
    setDraftTasks(String(dailyGoal.targetTasks || 2));
    setIsEditingTargets(true);
  };

  const handleSaveTargets = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedMins = parseInt(draftMinutes, 10);
    const parsedQ = parseInt(draftQuestions, 10);
    const parsedT = parseInt(draftTasks, 10);

    updateDailyGoalTargets({
      targetMinutes: Number.isNaN(parsedMins) ? targetMinutes : parsedMins,
      targetQuestions: Number.isNaN(parsedQ) ? targetQuestions : parsedQ,
      targetTasks: Number.isNaN(parsedT) ? dailyGoal.targetTasks : parsedT,
    });
    setIsEditingTargets(false);
  };

  const handleAddCustomGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;
    addCustomDailyGoal(newGoalTitle, newGoalRecurring);
    setNewGoalTitle('');
  };

  const handleSaveQuickQuestions = (e: React.FormEvent) => {
    e.preventDefault();
    const total = Math.max(1, parseInt(quickQTotal, 10) || 0);
    const correct = Math.min(total, Math.max(0, parseInt(quickQCorrect, 10) || 0));
    const resolvedSubId = quickQSubjectId || subjects[0]?.id || 'geral';

    logQuestions({
      subjectId: resolvedSubId,
      totalQuestions: total,
      correctAnswers: correct,
      date: todayStr,
      sessionType: 'EXERCICIOS',
    });
    setShowQuickQForm(false);
  };

  const handleGradeReview = (rating: 'facil' | 'medio' | 'dificil') => {
    if (!activeReviewToGrade) return;
    completeSpacedReview(activeReviewToGrade.id, rating);
    setActiveReviewToGrade(null);
  };

  const getSubjectColor = (subjectId: string) =>
    subjects.find((s) => s.id === subjectId)?.color || '#6366f1';

  const getSubjectName = (subjectId: string) =>
    subjects.find((s) => s.id === subjectId)?.name || 'Disciplina';

  if (subjects.length === 0) {
    return (
      <div className="space-y-6 pb-12">
        <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 dark:border-slate-800/90 dark:bg-[#0b1121]">
          <div className="max-w-lg space-y-3">
            <h2 className="text-2xl font-black tracking-tight text-stone-900 dark:text-white">
              {greeting}, {profile.name || 'Estudante'}!
            </h2>
            <p className="text-sm text-stone-600 dark:text-slate-400 leading-relaxed">
              Sua conta começou zerada (<strong className="tabular-nums">0 matérias</strong>,{' '}
              <strong className="tabular-nums">0 XP</strong> e{' '}
              <strong className="tabular-nums">0 dias</strong>). Escolha um preset ou cadastre suas
              matérias para gerarmos sua visão de hoje e metas automáticas.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onNavigateToSubjects}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition"
              >
                <Sparkles className="h-4 w-4" />
                <span>Escolher Preset ou Adicionar Matérias</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Overdue Backlog Warning & 1-Click Redistribution */}
      <BacklogWarning />

      {/* Top Welcome & Gamification Snapshot (Visão de Hoje) */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 dark:border-slate-800/90 dark:bg-[#0b1121]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-stone-900 dark:text-white">
              {greeting}, {profile.name || 'Estudante'}!
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              <Zap className="h-3 w-3 fill-emerald-500 text-emerald-500" />
              <span>Rotina Ativa</span>
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-stone-600 dark:text-slate-400">
            <span>{formatTodayHeading(todayStr)}</span>
            <span aria-hidden="true"> · </span>
            {todayStats.pendingTasks.length > 0
              ? `Você tem ${todayStats.pendingTasks.length} ${
                  todayStats.pendingTasks.length === 1
                    ? 'tarefa prioritária programada'
                    : 'tarefas prioritárias programadas'
                } para hoje.`
              : 'Você concluiu todas as tarefas programadas para hoje!'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-2 dark:border-amber-900/50 dark:bg-amber-950/40">
            <Flame className="h-5 w-5 fill-amber-500 text-amber-500" />
            <div className="tabular-nums">
              <span className="block text-xs font-bold text-amber-900 dark:text-amber-300 leading-none">
                {profile.streakDays} dias seguidos
              </span>
              <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400">
                Sequência mantida
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3.5 py-2 dark:border-indigo-900/50 dark:bg-indigo-950/40">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 font-extrabold text-white text-xs tabular-nums">
              {levelProg.currentLevel}
            </div>
            <div className="tabular-nums">
              <span className="block text-xs font-bold text-indigo-950 dark:text-indigo-200 leading-none">
                {levelProg.title}
              </span>
              <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
                {profile.xp} XP acumulados
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Projeção de Ritmo & Aprovação */}
      <PassProjection profile={profile} totalStudiedMinutes={todayStats.totalStudiedAllTime} />

      {/* Paused Session Highlight Card (when paused task differs from nextTask or all today's tasks are done) */}
      {activeTimerDraft &&
        (!todayStats.nextTask || activeTimerDraft.task.id !== todayStats.nextTask.id) && (
          <section className="rounded-2xl border-2 border-amber-400/50 bg-amber-50/70 p-5 sm:p-6 dark:border-amber-500/40 dark:bg-amber-950/25">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-500 px-2.5 py-0.5 text-[11px] font-extrabold text-white uppercase tracking-wider">
                    <Play className="h-3 w-3 fill-white" />
                    <span>Sessão Pausada</span>
                  </span>
                  <span className="text-xs font-bold text-stone-800 dark:text-slate-200 inline-flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: activeTimerDraft.task.subjectColor }}
                    />
                    <span>{activeTimerDraft.task.subjectName}</span>
                  </span>
                  <span aria-hidden="true" className="text-stone-400">
                    ·
                  </span>
                  <span className="text-xs font-semibold text-stone-600 uppercase dark:text-slate-300">
                    {TASK_TYPE_LABELS[activeTimerDraft.task.type]}
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white truncate">
                  {activeTimerDraft.task.topicName}
                </h3>

                <p className="text-xs sm:text-sm font-semibold text-amber-800 dark:text-amber-300 tabular-nums">
                  {activeTimerDraft.secondsRemaining > 0 ? (
                    <>
                      Você parou com{' '}
                      <strong>{formatTimerClock(activeTimerDraft.secondsRemaining)} restantes</strong>
                      {activeTimerDraft.totalSeconds > activeTimerDraft.secondsRemaining && (
                        <>
                          {' '}
                          (
                          {Math.max(
                            1,
                            Math.round(
                              (activeTimerDraft.totalSeconds - activeTimerDraft.secondsRemaining) /
                                60
                            )
                          )}{' '}
                          min já dedicados)
                        </>
                      )}
                    </>
                  ) : (
                    'Tempo concluído · pronto para salvar'
                  )}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={resumePausedTimer}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 active:scale-95 transition-all whitespace-nowrap"
                >
                  <Play className="h-4 w-4 fill-white" />
                  <span>Continuar</span>
                </button>

                <button
                  type="button"
                  onClick={() => clearTimerDraft(activeTimerDraft.task.id)}
                  className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-50 hover:text-stone-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 whitespace-nowrap"
                >
                  Descartar pausa
                </button>
              </div>
            </div>
          </section>
        )}

      {/* Hero: PRÓXIMA TAREFA RECOMENDADA (or Sessão Pausada when active draft matches) */}
      {todayStats.nextTask ? (() => {
        const nextTask = todayStats.nextTask;
        const isPausedNext = activeTimerDraft?.task.id === nextTask.id;
        const pausedElapsedMins = isPausedNext
          ? Math.max(
              0,
              Math.round(
                (activeTimerDraft.totalSeconds - activeTimerDraft.secondsRemaining) / 60
              )
            )
          : 0;

        return (
          <section
            className={`rounded-2xl border-2 p-6 sm:p-7 ${
              isPausedNext
                ? 'border-amber-400/60 bg-radial from-amber-50/80 via-white to-stone-50 dark:from-amber-950/30 dark:via-[#0b1121] dark:to-[#0b1121] dark:border-amber-500/40'
                : 'border-indigo-500/30 bg-radial from-indigo-50/80 via-white to-stone-50 dark:from-indigo-950/40 dark:via-[#0b1121] dark:to-[#0b1121] dark:border-indigo-500/40'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-extrabold text-white uppercase tracking-wider ${
                      isPausedNext ? 'bg-amber-500' : 'bg-indigo-600'
                    }`}
                  >
                    {isPausedNext ? (
                      <>
                        <Play className="h-3 w-3 fill-white" />
                        <span>Sessão Pausada</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3" />
                        <span>Próxima Tarefa Recomendada</span>
                      </>
                    )}
                  </span>
                  <span className="text-xs font-bold text-stone-700 dark:text-slate-200 inline-flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: nextTask.subjectColor }}
                    />
                    <span>{nextTask.subjectName}</span>
                  </span>
                  <span aria-hidden="true" className="text-stone-400">
                    ·
                  </span>
                  <span className="text-xs font-semibold text-stone-600 uppercase dark:text-slate-300">
                    {TASK_TYPE_LABELS[nextTask.type]}
                  </span>
                  {nextTask.isSpacedReview && (
                    <>
                      <span aria-hidden="true" className="text-stone-400">
                        ·
                      </span>
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                        Revisão D+
                        {nextTask.reviewStep === 1
                          ? '1'
                          : nextTask.reviewStep === 2
                          ? '7'
                          : nextTask.reviewStep === 3
                          ? '15'
                          : '30'}
                      </span>
                    </>
                  )}
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white">
                    {nextTask.topicName}
                  </h3>
                  {(isPausedNext && activeTimerDraft.pareiEm ? activeTimerDraft.pareiEm : nextTask.pareiEm) && (
                    <p className="mt-1 text-xs font-semibold text-indigo-700 dark:text-indigo-400 flex flex-wrap items-center gap-1.5">
                      <span>Você parou em:</span>
                      <span className="font-bold underline">
                        {isPausedNext && activeTimerDraft.pareiEm
                          ? activeTimerDraft.pareiEm
                          : nextTask.pareiEm}
                      </span>
                      {nextTask.cadernoQuestoes && (
                        <span className="text-stone-500 dark:text-slate-400 font-normal">
                          · Caderno: {nextTask.cadernoQuestoes}
                        </span>
                      )}
                    </p>
                  )}
                  <p className="mt-1 text-xs sm:text-sm text-stone-500 dark:text-slate-400 tabular-nums">
                    {isPausedNext ? (
                      <span className="font-semibold text-amber-800 dark:text-amber-300">
                        {activeTimerDraft.secondsRemaining > 0 ? (
                          <>
                            Você parou com{' '}
                            <strong>{formatTimerClock(activeTimerDraft.secondsRemaining)} restantes</strong>
                            {pausedElapsedMins > 0 && ` (${pausedElapsedMins} min já dedicados)`}
                          </>
                        ) : (
                          'Tempo finalizado · pronto para salvar'
                        )}
                      </span>
                    ) : (
                      <>
                        Tempo estimado: <strong>{nextTask.durationMinutes} minutos</strong> de foco.
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => (isPausedNext ? resumePausedTimer() : startStudySession(nextTask))}
                  className="flex items-center justify-center gap-2.5 rounded-2xl bg-indigo-600 px-7 py-4 text-sm font-extrabold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 active:scale-95 transition-all whitespace-nowrap"
                >
                  <Play className="h-5 w-5 fill-white" />
                  <span>{isPausedNext || nextTask.status === 'em_andamento' ? 'Continuar' : 'COMEÇAR AGORA'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => skipTask(nextTask.id)}
                  className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-bold text-stone-600 hover:bg-stone-50 hover:text-stone-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 whitespace-nowrap"
                >
                  Pular para a próxima
                </button>
              </div>
            </div>
          </section>
        );
      })() : (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 sm:p-7 text-center dark:border-emerald-900/40 dark:bg-emerald-950/30">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          <h3 className="mt-2.5 text-lg font-black text-emerald-950 dark:text-emerald-200">
            Você zerou os blocos programados de hoje!
          </h3>
          <p className="mt-1 text-xs text-emerald-800 dark:text-emerald-400 max-w-md mx-auto">
            Excelente disciplina. Você pode lançar questões extras abaixo, concluir seu checklist ou consultar os próximos dias.
          </p>
          <button
            type="button"
            onClick={onNavigateToSchedule}
            className="mt-4 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
          >
            Ver Próximos Dias
          </button>
        </section>
      )}

      {/* Metas do Dia Consolidated Progress + 4 Daily Metrics + Inline Target Tuner */}
      <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 dark:border-slate-800/90 dark:bg-[#0b1121] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-stone-900 dark:text-white flex items-center gap-2">
              <Target className="h-5 w-5 text-indigo-600 dark:text-cyan-400 shrink-0" />
              <span>Metas do Dia</span>
            </h3>
            <p className="mt-0.5 text-xs text-stone-500 dark:text-slate-400">
              Atualização automática pelo cronômetro e renovação diária
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right tabular-nums">
              <span className="block text-[11px] font-semibold text-stone-400 dark:text-slate-500">
                Conclusão hoje
              </span>
              <span
                className={`text-lg font-extrabold ${
                  overallPercent >= 100
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-stone-900 dark:text-white'
                }`}
              >
                {overallPercent}%
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                isEditingTargets ? setIsEditingTargets(false) : handleOpenEditTargets()
              }
              className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2 text-xs font-bold text-stone-700 hover:bg-stone-100 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800 transition whitespace-nowrap"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-600 dark:text-cyan-400" />
              <span>{isEditingTargets ? 'Fechar ajuste' : 'Ajustar metas'}</span>
            </button>
          </div>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-slate-800/90">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              overallPercent >= 100
                ? 'bg-emerald-500'
                : 'bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500'
            }`}
            style={{ width: `${overallPercent}%` }}
          />
        </div>

        {/* Inline Target Adjustment Form */}
        {isEditingTargets && (
          <form
            onSubmit={handleSaveTargets}
            className="pt-4 border-t border-stone-200 dark:border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in"
          >
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1.5">
                Meta de tempo diário (min)
              </label>
              <div className="flex items-center gap-1.5 mb-2">
                {[60, 120, 180, 240].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDraftMinutes(String(m))}
                    className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold tabular-nums transition ${
                      Number(draftMinutes) === m
                        ? 'border-indigo-500 bg-indigo-600 text-white'
                        : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                    }`}
                  >
                    {m / 60}h
                  </button>
                ))}
              </div>
              <input
                type="number"
                min={15}
                max={960}
                value={draftMinutes}
                onChange={(e) => setDraftMinutes(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-bold text-stone-900 tabular-nums outline-hidden focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900/70 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1.5">
                Meta de questões por dia
              </label>
              <div className="flex items-center gap-1.5 mb-2">
                {[15, 30, 50, 80].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setDraftQuestions(String(q))}
                    className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold tabular-nums transition ${
                      Number(draftQuestions) === q
                        ? 'border-indigo-500 bg-indigo-600 text-white'
                        : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                    }`}
                  >
                    {q}q
                  </button>
                ))}
              </div>
              <input
                type="number"
                min={1}
                max={500}
                value={draftQuestions}
                onChange={(e) => setDraftQuestions(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-bold text-stone-900 tabular-nums outline-hidden focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900/70 dark:text-white"
              />
            </div>

            <div className="flex flex-col justify-between">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1.5">
                  Meta mínima de blocos/tarefas
                </label>
                <p className="text-[11px] text-stone-400 dark:text-slate-500 mb-2">
                  Usada quando não houver blocos agendados hoje.
                </p>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={draftTasks}
                  onChange={(e) => setDraftTasks(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-bold text-stone-900 tabular-nums outline-hidden focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900/70 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setIsEditingTargets(false)}
                  className="rounded-xl px-3 py-2 text-xs font-semibold text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition whitespace-nowrap"
                >
                  Salvar metas
                </button>
              </div>
            </div>
          </form>
        )}

        {/* 4 Daily Metric Cells inside subtle divider grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-stone-100 dark:border-slate-800/80">
          {/* Tempo Dedicado */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-stone-500 dark:text-slate-400">
              <span>Tempo Dedicado Hoje</span>
              <Clock className="h-3.5 w-3.5 text-indigo-500 dark:text-cyan-400" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5 tabular-nums">
              <span className="text-2xl font-black text-stone-900 dark:text-white">
                {formatMinutesLabel(todayStats.studiedMinutes)}
              </span>
              <span className="text-xs text-stone-400 dark:text-slate-500">
                / {formatMinutesLabel(targetMinutes)}
              </span>
            </div>
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  timeProgress >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${timeProgress}%` }}
              />
            </div>
          </div>

          {/* Questões Hoje */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-stone-500 dark:text-slate-400">
              <span>Questões Hoje</span>
              <HelpCircle className="h-3.5 w-3.5 text-sky-500" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5 tabular-nums">
              <span className="text-2xl font-black text-stone-900 dark:text-white">
                {todayStats.questionsDone}
              </span>
              <span className="text-xs text-stone-400 dark:text-slate-500">
                / {targetQuestions} meta
              </span>
            </div>
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  questionsProgress >= 100 ? 'bg-emerald-500' : 'bg-sky-500'
                }`}
                style={{ width: `${questionsProgress}%` }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px]">
              <span className="text-stone-400 dark:text-slate-500 tabular-nums">
                {accuracyPercent !== null ? `${accuracyPercent}% acerto` : 'Sem acertos hoje'}
              </span>
              <button
                type="button"
                onClick={() => setShowQuickQForm((prev) => !prev)}
                className="font-bold text-indigo-600 hover:text-indigo-700 dark:text-cyan-400 dark:hover:text-cyan-300"
              >
                {showQuickQForm ? 'Fechar' : '+ Lançar'}
              </button>
            </div>
          </div>

          {/* Tarefas de Hoje */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-stone-500 dark:text-slate-400">
              <span>Tarefas de Hoje</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5 tabular-nums">
              <span className="text-2xl font-black text-stone-900 dark:text-white">
                {todayStats.completedTasks}
              </span>
              <span className="text-xs text-stone-400 dark:text-slate-500">
                de {plannedTasksTarget} concluídas
              </span>
            </div>
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-slate-800">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${tasksProgress}%` }}
              />
            </div>
          </div>

          {/* Reta Final / Meta de Horas */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-stone-500 dark:text-slate-400">
              <span>{daysToExam !== null ? 'Reta Final' : 'Meta de Horas'}</span>
              <CalendarDays className="h-3.5 w-3.5 text-amber-500" />
            </div>
            {daysToExam !== null ? (
              <div className="mt-1.5 flex items-baseline gap-1.5 tabular-nums">
                <span className="text-2xl font-black text-stone-900 dark:text-white">
                  {daysToExam}
                </span>
                <span className="text-xs text-stone-400 dark:text-slate-500">dias restantes</span>
              </div>
            ) : (
              <div className="mt-1.5 flex items-baseline gap-1.5 tabular-nums">
                <span className="text-2xl font-black text-stone-900 dark:text-white">
                  {Math.round(todayStats.totalStudiedAllTime / 60)}h
                </span>
                <span className="text-xs text-stone-400 dark:text-slate-500">
                  de {profile.targetTotalHours || 200}h meta
                </span>
              </div>
            )}
            <span className="mt-2 block text-[11px] text-stone-400 dark:text-slate-500 truncate">
              {profile.targetExam || 'Meta em progresso'}
            </span>
          </div>
        </div>

        {/* Inline Quick Question Logger */}
        {showQuickQForm && (
          <form
            onSubmit={handleSaveQuickQuestions}
            className="pt-4 border-t border-stone-100 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end animate-in fade-in"
          >
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-stone-500 dark:text-slate-400 mb-1">
                Matéria das questões
              </label>
              <select
                value={quickQSubjectId || subjects[0]?.id}
                onChange={(e) => setQuickQSubjectId(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-stone-500 dark:text-slate-400 mb-1">
                  Feitas
                </label>
                <input
                  type="number"
                  min={1}
                  max={300}
                  value={quickQTotal}
                  onChange={(e) => setQuickQTotal(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-bold tabular-nums dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-stone-500 dark:text-slate-400 mb-1">
                  Acertos
                </label>
                <input
                  type="number"
                  min={0}
                  max={300}
                  value={quickQCorrect}
                  onChange={(e) => setQuickQCorrect(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-bold tabular-nums dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition whitespace-nowrap"
            >
              Registrar agora
            </button>
          </form>
        )}
      </section>

      {/* Two-Column Execution Area: Seu Estudo de Hoje + Checklist Livre & Revisões */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left: Seu Estudo de Hoje */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 dark:border-slate-800/90 dark:bg-[#0b1121]">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-extrabold text-stone-900 dark:text-white flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-indigo-600 dark:text-cyan-400" />
                <span>Seu Estudo de Hoje</span>
              </h3>
              <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5 tabular-nums">
                {todayStats.todayTasks.length > 0
                  ? `${todayStats.completedTasks} de ${todayStats.todayTasks.length} blocos concluídos`
                  : 'Blocos puxados automaticamente do cronograma'}
              </p>
            </div>

            <button
              type="button"
              onClick={onNavigateToSchedule}
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-cyan-400 dark:hover:text-cyan-300 whitespace-nowrap"
            >
              <span>Ver semana</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {todayStats.todayTasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-200 dark:border-slate-800 p-6 text-center space-y-3">
              <p className="text-xs text-stone-500 dark:text-slate-400 leading-relaxed">
                Nenhum bloco agendado para hoje ainda. Você pode gerar os blocos agora ou focar no
                seu checklist livre ao lado.
              </p>
              <button
                type="button"
                onClick={recalculateSchedule}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition"
              >
                Gerar blocos de hoje
              </button>
            </div>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-slate-800/80">
              {todayStats.todayTasks.map((task) => {
                const isDone = task.status === 'concluida';
                const hasPausedDraft = activeTimerDraft?.task.id === task.id;
                const isActive = task.status === 'em_andamento' || hasPausedDraft;
                const subjectColor = getSubjectColor(task.subjectId);
                const subjectName = getSubjectName(task.subjectId);

                return (
                  <div
                    key={task.id}
                    className="py-3.5 first:pt-1 last:pb-1 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex items-start gap-3">
                      <span
                        className="mt-1.5 h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: subjectColor }}
                      />
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-bold truncate ${
                            isDone
                              ? 'line-through text-stone-400 dark:text-slate-500'
                              : 'text-stone-900 dark:text-slate-100'
                          }`}
                        >
                          {subjectName}
                        </p>
                        <p className="text-xs text-stone-500 dark:text-slate-400 truncate mt-0.5 tabular-nums">
                          <span>{task.topicName}</span>
                          <span aria-hidden="true"> · </span>
                          <span>{TASK_TYPE_LABELS[task.type]}</span>
                          <span aria-hidden="true"> · </span>
                          {hasPausedDraft ? (
                            <span className="font-bold text-amber-700 dark:text-amber-400">
                              {formatTimerClock(activeTimerDraft.secondsRemaining)} restantes
                            </span>
                          ) : (
                            <span>{task.durationMinutes} min</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isDone ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          <Check className="h-3.5 w-3.5" />
                          <span>Feito</span>
                        </span>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => skipTask(task.id)}
                            className="px-2 py-1 text-xs font-semibold text-stone-400 hover:text-stone-700 dark:text-slate-500 dark:hover:text-slate-300"
                            title="Pular esta tarefa hoje"
                          >
                            Pular
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              hasPausedDraft ? resumePausedTimer() : startStudySession(task)
                            }
                            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold text-white active:scale-95 transition whitespace-nowrap ${
                              isActive
                                ? 'bg-amber-600 hover:bg-amber-700'
                                : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                          >
                            <Play className="h-3 w-3 fill-current" />
                            <span>{isActive ? 'Continuar' : 'Estudar'}</span>
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

        {/* Right: Checklist Livre do Dia + Revisões Pendentes de Hoje (se houver) */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 dark:border-slate-800/90 dark:bg-[#0b1121]">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-stone-900 dark:text-white flex items-center gap-2">
                  <ListTodo className="h-4 w-4 text-indigo-600 dark:text-cyan-400" />
                  <span>Checklist Livre do Dia</span>
                </h3>
                <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5 tabular-nums">
                  {customGoals.length > 0
                    ? `${completedCustomCount} de ${customGoals.length} concluídas hoje`
                    : 'Crie metas próprias diárias ou pontuais para hoje'}
                </p>
              </div>

              {completedCustomCount > 0 && (
                <button
                  type="button"
                  onClick={resetTodayCustomChecklist}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white transition whitespace-nowrap"
                  title="Desmarcar todas as metas de hoje"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Desmarcar</span>
                </button>
              )}
            </div>

            <form onSubmit={handleAddCustomGoal} className="space-y-2.5 mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  placeholder="Nova meta do dia (ex: Ler 20 min de lei seca)..."
                  className="flex-1 min-w-0 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2 text-xs text-stone-900 outline-hidden focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900/70 dark:text-white"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-700 active:scale-95 transition whitespace-nowrap shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Adicionar</span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-stone-500 dark:text-slate-400">Frequência:</span>
                <div className="inline-flex items-center rounded-lg bg-stone-100 p-0.5 dark:bg-slate-900">
                  <button
                    type="button"
                    onClick={() => setNewGoalRecurring(true)}
                    className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition whitespace-nowrap ${
                      newGoalRecurring
                        ? 'bg-white text-stone-900 shadow-xs dark:bg-slate-800 dark:text-white'
                        : 'text-stone-500 hover:text-stone-800 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    <Repeat className="h-3 w-3" />
                    <span>Todo dia</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewGoalRecurring(false)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition whitespace-nowrap ${
                      !newGoalRecurring
                        ? 'bg-white text-stone-900 shadow-xs dark:bg-slate-800 dark:text-white'
                        : 'text-stone-500 hover:text-stone-800 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    Só hoje
                  </button>
                </div>
              </div>
            </form>

            {customGoals.length === 0 ? (
              <div className="rounded-xl border border-dashed border-stone-200 dark:border-slate-800 p-5 space-y-3">
                <p className="text-xs text-stone-500 dark:text-slate-400 text-center">
                  Nenhuma meta livre adicionada ainda. Digite acima ou use uma sugestão rápida:
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {CHECKLIST_SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => addCustomDailyGoal(suggestion, true)}
                      className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-[11px] font-semibold text-stone-700 hover:border-indigo-400 hover:text-indigo-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-cyan-500/60 dark:hover:text-cyan-300 transition"
                    >
                      <Plus className="h-3 w-3" />
                      <span>{suggestion}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="divide-y divide-stone-100 dark:divide-slate-800/80">
                {customGoals.map((item) => (
                  <div
                    key={item.id}
                    className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3"
                  >
                    <button
                      type="button"
                      onClick={() => toggleCustomDailyGoal(item.id)}
                      className="flex items-start gap-3 min-w-0 text-left flex-1 group"
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                          item.completed
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : 'border-stone-300 bg-white group-hover:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:group-hover:border-cyan-400'
                        }`}
                      >
                        {item.completed && <Check className="h-3.5 w-3.5" />}
                      </span>

                      <div className="min-w-0">
                        <span
                          className={`block text-sm font-semibold break-words ${
                            item.completed
                              ? 'line-through text-stone-400 dark:text-slate-500'
                              : 'text-stone-900 dark:text-slate-100'
                          }`}
                        >
                          {item.title}
                        </span>
                        <span className="block text-[11px] text-stone-400 dark:text-slate-500 mt-0.5">
                          {item.recurringDaily
                            ? 'Renova automaticamente todo dia'
                            : 'Meta pontual apenas para hoje'}
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteCustomDailyGoal(item.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-500 rounded-lg hover:bg-stone-100 dark:text-slate-500 dark:hover:text-rose-400 dark:hover:bg-slate-800/70 transition shrink-0"
                      title="Excluir meta"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contextual Due Spaced Reviews for Today (only appears when there are reviews due) */}
          {dueReviewsToday.length > 0 && (
            <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 dark:border-slate-800/90 dark:bg-[#0b1121]">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-stone-900 dark:text-white flex items-center gap-2">
                    <RotateCw className="h-4 w-4 text-amber-500" />
                    <span>Revisões Programadas para Hoje ({dueReviewsToday.length})</span>
                  </h3>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5">
                    Ciclos D+1, D+7, D+15 e D+30 gerados ao concluir blocos
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onNavigateToReviews}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-cyan-400 dark:hover:text-cyan-300 whitespace-nowrap"
                >
                  Ver todas
                </button>
              </div>

              <div className="divide-y divide-stone-100 dark:divide-slate-800/80">
                {dueReviewsToday.map((rev) => (
                  <div
                    key={rev.id}
                    className="py-2.5 first:pt-1 last:pb-1 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-stone-900 dark:text-slate-100 truncate">
                        {rev.topicName}
                      </p>
                      <p className="text-[11px] text-stone-500 dark:text-slate-400 truncate">
                        {rev.subjectName} · D+
                        {rev.step === 1 ? '1' : rev.step === 2 ? '7' : rev.step === 3 ? '15' : '30'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveReviewToGrade(rev)}
                      className="rounded-lg bg-amber-500 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-amber-600 transition whitespace-nowrap shrink-0"
                    >
                      Revisar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Low Accuracy Alert if applicable */}
      {subjects.some(
        (s) => s.totalExercisesDone >= 5 && s.totalExercisesCorrect / s.totalExercisesDone < 0.6
      ) && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 dark:text-amber-200">
            <span className="font-bold block">Atenção ao desempenho em exercícios:</span>
            Matérias com acerto abaixo de 60% recebem prioridade reforçada automaticamente no seu
            cronograma para fixação do conteúdo.
          </div>
        </div>
      )}

      {/* Inline Review Grading Modal */}
      {activeReviewToGrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl text-center dark:border-slate-800 dark:bg-[#0b1121]">
            <h3 className="text-lg font-extrabold text-stone-900 dark:text-white">
              Registrar Revisão
            </h3>
            <p className="mt-1 text-xs text-stone-500 dark:text-slate-400">
              {activeReviewToGrade.subjectName} · <strong>{activeReviewToGrade.topicName}</strong>
            </p>
            <p className="mt-4 text-sm text-stone-700 dark:text-slate-300">
              Como foi sua lembrança deste conteúdo?
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleGradeReview('dificil')}
                className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-left transition"
              >
                <span className="block text-xs font-bold text-rose-800 dark:text-rose-300">
                  Difícil
                </span>
                <span className="text-[10px] text-stone-500 dark:text-slate-400 mt-1 block">
                  Reagendar para amanhã.
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleGradeReview('medio')}
                className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-left transition"
              >
                <span className="block text-xs font-bold text-amber-800 dark:text-amber-300">
                  Médio
                </span>
                <span className="text-[10px] text-stone-500 dark:text-slate-400 mt-1 block">
                  Lembrei com algum esforço.
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleGradeReview('facil')}
                className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-left transition"
              >
                <span className="block text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  Fácil
                </span>
                <span className="text-[10px] text-stone-500 dark:text-slate-400 mt-1 block">
                  Ampliar intervalo.
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setActiveReviewToGrade(null)}
              className="mt-5 text-xs font-semibold text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
