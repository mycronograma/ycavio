import React, { useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Clock,
  Play,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Filter,
  Shield,
  Flag,
  Edit3,
  Check,
  X,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { useToast } from '../../context/ToastContext';
import {
  getTodayStr,
  addDays,
  formatDate,
  parseScheduleDate,
  diffDaysInclusive,
  resolveScheduleEndDate,
  getDailyCommitmentConflicts,
} from '../../services/scheduleEngine';
import { getStudyMethodPreset, resolveBreakMinutes } from '../../services/studyMethods';
import { formatFullDatePtBr, formatShortDatePtBr } from '../../lib/dateUtils';
import { formatTimerClock } from '../study/ActiveStudyModal';
import { Task } from '../../types';

interface ScheduleViewProps {
  onNavigateToSubjects?: () => void;
  onOpenFixedSchedule?: () => void;
}

type ScheduleViewMode = 'week' | 'month' | 'timeline' | 'day';

function formatHoursMinutes(totalMinutes: number): string {
  const safe = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, '0')}`;
}

function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7); // YYYY-MM
}

function formatMonthLabelPtBr(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(y, (m || 1) - 1, 1, 12, 0, 0);
  const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatShortMonthChip(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(y, (m || 1) - 1, 1, 12, 0, 0);
  const shortMonth = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
  return `${shortMonth.charAt(0).toUpperCase() + shortMonth.slice(1)}/${String(y).slice(-2)}`;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  onNavigateToSubjects,
  onOpenFixedSchedule,
}) => {
  const {
    state,
    activeTimerDraft,
    startStudySession,
    resumePausedTimer,
    recalculateSchedule,
    updateProfile,
  } = useStudy();
  const { showToast } = useToast();
  const { tasks, profile, subjects, fixedCommitments } = state;

  const todayStr = getTodayStr();
  const horizon = useMemo(() => resolveScheduleEndDate(profile, todayStr), [profile, todayStr]);

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [viewMode, setViewMode] = useState<ScheduleViewMode>('week');
  const [weekIndex, setWeekIndex] = useState<number>(0);
  const [activeMonthKey, setActiveMonthKey] = useState<string>(() => getMonthKey(todayStr));
  const [subjectFilterId, setSubjectFilterId] = useState<string>('all');
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>(() => ({
    [getMonthKey(todayStr)]: true,
  }));
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Inline target end date editor
  const [isEditingEndDate, setIsEditingEndDate] = useState(false);
  const [draftEndDate, setDraftEndDate] = useState<string>(
    profile.examDate || horizon.targetEndDate
  );

  const handleRecalculate = () => {
    setIsRecalculating(true);
    setTimeout(() => {
      recalculateSchedule();
      setIsRecalculating(false);
      showToast('Cronograma recalculado até a data final!', 'success');
    }, 350);
  };

  const handleSaveEndDate = () => {
    if (!draftEndDate || draftEndDate < todayStr) {
      showToast('Escolha uma data final igual ou posterior a hoje.', 'error');
      return;
    }
    updateProfile({ examDate: draftEndDate });
    setIsEditingEndDate(false);
    setWeekIndex(0);
    setActiveMonthKey(getMonthKey(todayStr));
    showToast(`Data final atualizada para ${formatShortDatePtBr(draftEndDate)}!`, 'success');
  };

  const conflicts = getDailyCommitmentConflicts(profile, fixedCommitments || []);
  const methodPreset = getStudyMethodPreset(profile.studyMethod);
  const breakMinutes = resolveBreakMinutes(profile);

  // Filtered tasks (optional subject filter)
  const filteredTasks = useMemo(() => {
    if (subjectFilterId === 'all') return tasks;
    return tasks.filter((t) => t.subjectId === subjectFilterId);
  }, [tasks, subjectFilterId]);

  // Index tasks by date for fast O(1) lookup across months / 365 days
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const task of filteredTasks) {
      if (!map[task.date]) map[task.date] = [];
      map[task.date].push(task);
    }
    return map;
  }, [filteredTasks]);

  // Total weeks from todayStr through horizon.generatedEndDate
  const totalWeeks = useMemo(
    () => Math.max(1, Math.ceil(horizon.generatedDays / 7)),
    [horizon.generatedDays]
  );

  const safeWeekIndex = Math.min(Math.max(0, weekIndex), totalWeeks - 1);

  // 7 days for the active week window (clamped up to horizon.generatedEndDate)
  const weekDays = useMemo(() => {
    const startOffset = safeWeekIndex * 7;
    return Array.from({ length: 7 })
      .map((_, i) => {
        const offset = startOffset + i;
        if (offset >= horizon.generatedDays && i > 0 && addDays(todayStr, offset) > horizon.generatedEndDate) {
          return null;
        }
        const dStr = addDays(todayStr, offset);
        const dateObj = parseScheduleDate(dStr);
        const dayName = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
        const dayNum = dateObj.getDate();
        const monthShort = dateObj.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
        const dayTasks = tasksByDate[dStr] || [];
        const completedCount = dayTasks.filter((t) => t.status === 'concluida').length;

        return {
          dateStr: dStr,
          dayName,
          dayNum,
          monthShort,
          tasksCount: dayTasks.length,
          completedCount,
          isToday: dStr === todayStr,
          isTargetEndDate: profile.examDate === dStr,
          dayTasks,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [safeWeekIndex, horizon.generatedDays, horizon.generatedEndDate, todayStr, tasksByDate, profile.examDate]);

  // Month list between todayStr and horizon.targetEndDate (at least up to generatedEndDate)
  const monthKeysInPeriod = useMemo(() => {
    const keys: string[] = [];
    const startMonth = getMonthKey(todayStr);
    const endLimit =
      horizon.targetEndDate > horizon.generatedEndDate
        ? horizon.generatedEndDate
        : horizon.targetEndDate;
    const endMonth = getMonthKey(endLimit);

    let [curY, curM] = startMonth.split('-').map(Number);
    const [endY, endM] = endMonth.split('-').map(Number);

    while (curY < endY || (curY === endY && curM <= endM)) {
      keys.push(`${curY}-${String(curM).padStart(2, '0')}`);
      curM += 1;
      if (curM > 12) {
        curM = 1;
        curY += 1;
      }
      if (keys.length >= 14) break;
    }
    return keys.length > 0 ? keys : [startMonth];
  }, [todayStr, horizon.targetEndDate, horizon.generatedEndDate]);

  const safeActiveMonthKey = monthKeysInPeriod.includes(activeMonthKey)
    ? activeMonthKey
    : monthKeysInPeriod[0];
  const activeMonthPos = monthKeysInPeriod.indexOf(safeActiveMonthKey);

  // Calendar grid days for the selected month
  const monthCalendarGrid = useMemo(() => {
    const [y, m] = safeActiveMonthKey.split('-').map(Number);
    const firstDayOfMonth = new Date(y, m - 1, 1, 12, 0, 0);
    const daysInMonth = new Date(y, m, 0).getDate();
    const leadingBlanks = firstDayOfMonth.getDay(); // 0=Dom..6=Sab

    const cells: Array<{
      dateStr: string | null;
      dayNum?: number;
      tasks?: Task[];
      totalMinutes?: number;
      completedCount?: number;
      isToday?: boolean;
      isPast?: boolean;
      isAfterEnd?: boolean;
      isTargetEndDate?: boolean;
    }> = [];

    for (let b = 0; b < leadingBlanks; b++) {
      cells.push({ dateStr: null });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDate(new Date(y, m - 1, day, 12, 0, 0));
      const dayTasks = tasksByDate[dateStr] || [];
      const totalMinutes = dayTasks.reduce((sum, t) => sum + (t.durationMinutes || 0), 0);
      const completedCount = dayTasks.filter((t) => t.status === 'concluida').length;

      cells.push({
        dateStr,
        dayNum: day,
        tasks: dayTasks,
        totalMinutes,
        completedCount,
        isToday: dateStr === todayStr,
        isPast: dateStr < todayStr,
        isAfterEnd: dateStr > horizon.generatedEndDate,
        isTargetEndDate: profile.examDate === dateStr,
      });
    }

    return cells;
  }, [safeActiveMonthKey, tasksByDate, todayStr, horizon.generatedEndDate, profile.examDate]);

  // Period-wide summary stats (from todayStr through horizon.generatedEndDate)
  const periodStats = useMemo(() => {
    const periodTasks = filteredTasks.filter(
      (t) => t.date >= todayStr && t.date <= horizon.generatedEndDate
    );
    const totalMinutes = periodTasks.reduce((sum, t) => sum + (t.durationMinutes || 0), 0);
    const completedBlocks = periodTasks.filter((t) => t.status === 'concluida').length;
    const activeDates = new Set(periodTasks.map((t) => t.date));

    const bySubjectMap = new Map<
      string,
      { id: string; name: string; color: string; blocks: number; minutes: number }
    >();
    for (const t of periodTasks) {
      const existing = bySubjectMap.get(t.subjectId);
      if (existing) {
        existing.blocks += 1;
        existing.minutes += t.durationMinutes || 0;
      } else {
        bySubjectMap.set(t.subjectId, {
          id: t.subjectId,
          name: t.subjectName,
          color: t.subjectColor,
          blocks: 1,
          minutes: t.durationMinutes || 0,
        });
      }
    }

    return {
      totalBlocks: periodTasks.length,
      completedBlocks,
      totalMinutes,
      studyDaysCount: activeDates.size,
      bySubject: Array.from(bySubjectMap.values()).sort((a, b) => b.minutes - a.minutes),
    };
  }, [filteredTasks, todayStr, horizon.generatedEndDate]);

  // Timeline sections grouped by month (todayStr -> horizon.generatedEndDate)
  const timelineByMonth = useMemo(() => {
    return monthKeysInPeriod.map((mKey) => {
      const monthDates: Array<{
        dateStr: string;
        weekdayLabel: string;
        shortDateLabel: string;
        tasks: Task[];
        totalMinutes: number;
        isToday: boolean;
        isTargetEndDate: boolean;
      }> = [];

      const [y, m] = mKey.split('-').map(Number);
      const daysInMonth = new Date(y, m, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const dStr = formatDate(new Date(y, m - 1, day, 12, 0, 0));
        if (dStr < todayStr || dStr > horizon.generatedEndDate) continue;
        const dayTasks = tasksByDate[dStr] || [];
        const isTarget = profile.examDate === dStr;
        if (dayTasks.length === 0 && !isTarget) continue;

        const dateObj = parseScheduleDate(dStr);
        monthDates.push({
          dateStr: dStr,
          weekdayLabel: dateObj
            .toLocaleDateString('pt-BR', { weekday: 'short' })
            .replace('.', ''),
          shortDateLabel: dateObj.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
          }),
          tasks: dayTasks,
          totalMinutes: dayTasks.reduce((sum, t) => sum + (t.durationMinutes || 0), 0),
          isToday: dStr === todayStr,
          isTargetEndDate: isTarget,
        });
      }

      const monthBlocks = monthDates.reduce((sum, d) => sum + d.tasks.length, 0);
      const monthMinutes = monthDates.reduce((sum, d) => sum + d.totalMinutes, 0);

      return {
        monthKey: mKey,
        label: formatMonthLabelPtBr(mKey),
        days: monthDates,
        totalBlocks: monthBlocks,
        totalMinutes: monthMinutes,
        hasTargetEndDate: monthDates.some((d) => d.isTargetEndDate),
      };
    });
  }, [monthKeysInPeriod, todayStr, horizon.generatedEndDate, tasksByDate, profile.examDate]);

  const currentDayTasks = tasksByDate[selectedDate] || [];

  const overdueTasks = tasks.filter(
    (t) => t.date < todayStr && (t.status === 'pendente' || t.status === 'atrasada')
  );

  const jumpToDate = (targetStr: string, targetMode?: ScheduleViewMode) => {
    const clampedTarget =
      targetStr < todayStr
        ? todayStr
        : targetStr > horizon.generatedEndDate
        ? horizon.generatedEndDate
        : targetStr;
    setSelectedDate(clampedTarget);
    const diffFromToday = Math.max(0, diffDaysInclusive(todayStr, clampedTarget) - 1);
    setWeekIndex(Math.min(totalWeeks - 1, Math.floor(diffFromToday / 7)));
    setActiveMonthKey(getMonthKey(clampedTarget));
    setExpandedMonths((prev) => ({ ...prev, [getMonthKey(clampedTarget)]: true }));
    if (targetMode) setViewMode(targetMode);
  };

  if (subjects.length === 0) {
    return (
      <div className="space-y-6 pb-12">
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center dark:border-stone-700 dark:bg-stone-900">
          <CalendarIcon className="mx-auto h-10 w-10 text-indigo-500 mb-3" />
          <h3 className="text-lg font-extrabold text-stone-900 dark:text-stone-100">
            Nenhum cronograma gerado ainda
          </h3>
          <p className="mt-1.5 text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto">
            Escolha um preset ou adicione suas matérias primeiro para distribuirmos seus blocos até a data final do seu objetivo.
          </p>
          {onNavigateToSubjects && (
            <button
              type="button"
              onClick={onNavigateToSubjects}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              <Sparkles className="h-4 w-4" />
              <span>Configurar Matérias &amp; Preset</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const weekStartLabel = weekDays[0] ? `${weekDays[0].dayNum} ${weekDays[0].monthShort}` : '';
  const weekEndLabel =
    weekDays.length > 0
      ? `${weekDays[weekDays.length - 1].dayNum} ${weekDays[weekDays.length - 1].monthShort}`
      : '';

  return (
    <div className="space-y-5 pb-12">
      {/* Header bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-xs dark:border-stone-800 dark:bg-stone-900 transition-colors">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <span>Cronograma Inteligente de Estudos</span>
          </h2>
          <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
            Método ativo:{' '}
            <strong className="text-stone-700 dark:text-stone-200">{methodPreset.shortName}</strong>{' '}
            • Blocos de{' '}
            <strong className="tabular-nums text-stone-700 dark:text-stone-200">
              {profile.preferredSessionLength || 50} min
            </strong>{' '}
            com pausa de{' '}
            <strong className="tabular-nums text-emerald-600 dark:text-emerald-400">
              {breakMinutes} min
            </strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View mode toggle: Semana / Mês / Período / Dia */}
          <div className="flex flex-wrap rounded-xl border border-stone-200 bg-stone-100 p-1 text-xs font-semibold dark:border-stone-800 dark:bg-stone-800/80">
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition whitespace-nowrap shrink-0 ${
                viewMode === 'week'
                  ? 'bg-white text-indigo-900 shadow-xs font-bold dark:bg-stone-900 dark:text-indigo-300'
                  : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200'
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Semana</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition whitespace-nowrap shrink-0 ${
                viewMode === 'month'
                  ? 'bg-white text-indigo-900 shadow-xs font-bold dark:bg-stone-900 dark:text-indigo-300'
                  : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200'
              }`}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              <span>Mês</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition whitespace-nowrap shrink-0 ${
                viewMode === 'timeline'
                  ? 'bg-white text-indigo-900 shadow-xs font-bold dark:bg-stone-900 dark:text-indigo-300'
                  : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200'
              }`}
            >
              <CalendarRange className="h-3.5 w-3.5" />
              <span>Até o Fim</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('day')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition whitespace-nowrap shrink-0 ${
                viewMode === 'day'
                  ? 'bg-white text-indigo-900 shadow-xs font-bold dark:bg-stone-900 dark:text-indigo-300'
                  : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Dia</span>
            </button>
          </div>

          {onOpenFixedSchedule && (
            <button
              type="button"
              onClick={onOpenFixedSchedule}
              className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition whitespace-nowrap shrink-0"
            >
              <Shield className="h-3.5 w-3.5 text-indigo-600 dark:text-cyan-400" />
              <span>Grade Fixa</span>
            </button>
          )}

          {/* Recalculate button */}
          <button
            type="button"
            onClick={handleRecalculate}
            disabled={isRecalculating}
            className="flex items-center gap-1.5 rounded-xl bg-stone-900 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-stone-800 disabled:opacity-50 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRecalculating ? 'animate-spin' : ''}`} />
            <span>Recalcular</span>
          </button>
        </div>
      </div>

      {/* Period / Target End Date Banner + Subject Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-2xl border border-indigo-200/80 bg-indigo-50/50 px-4 py-3.5 dark:border-indigo-900/50 dark:bg-indigo-950/25">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shrink-0">
              <Flag className="h-4 w-4" />
            </span>
            <div>
              <div className="text-xs font-extrabold text-stone-900 dark:text-stone-100">
                {horizon.hasCustomExamDate && profile.examDate
                  ? `Planejamento completo até ${formatFullDatePtBr(profile.examDate)}`
                  : `Planejamento de ${horizon.generatedDays} dias (até ${formatShortDatePtBr(horizon.generatedEndDate)})`}
              </div>
              <div className="text-[11px] text-stone-600 dark:text-stone-400 tabular-nums">
                {horizon.totalDaysToTarget} {horizon.totalDaysToTarget === 1 ? 'dia' : 'dias'} no período •{' '}
                <strong className="text-stone-800 dark:text-stone-200">{periodStats.totalBlocks} blocos</strong> (
                {formatHoursMinutes(periodStats.totalMinutes)}) distribuídos em{' '}
                <strong className="text-stone-800 dark:text-stone-200">{periodStats.studyDaysCount} dias de estudo</strong>
                {horizon.isCapped && (
                  <span className="text-amber-700 dark:text-amber-400">
                    {' '}
                    • Exibindo os próximos 365 dias ({formatShortDatePtBr(horizon.generatedEndDate)})
                  </span>
                )}
              </div>
            </div>
          </div>

          {isEditingEndDate ? (
            <div className="flex items-center gap-1.5 rounded-xl border border-indigo-300 bg-white px-2.5 py-1 dark:border-indigo-700 dark:bg-stone-900">
              <input
                type="date"
                min={todayStr}
                value={draftEndDate}
                onChange={(e) => setDraftEndDate(e.target.value)}
                className="text-xs font-semibold text-stone-800 dark:text-stone-100 bg-transparent focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSaveEndDate}
                className="rounded-lg bg-indigo-600 p-1 text-white hover:bg-indigo-700"
                title="Salvar data final"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsEditingEndDate(false)}
                className="rounded-lg p-1 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
                title="Cancelar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setDraftEndDate(profile.examDate || horizon.generatedEndDate);
                  setIsEditingEndDate(true);
                }}
                className="inline-flex items-center gap-1 rounded-xl border border-indigo-200 bg-white px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:bg-stone-900 dark:text-indigo-300 dark:hover:bg-indigo-950/60 transition"
              >
                <Edit3 className="h-3 w-3" />
                <span>{profile.examDate ? 'Alterar data final' : 'Definir data final'}</span>
              </button>

              <button
                type="button"
                onClick={() => jumpToDate(horizon.generatedEndDate, viewMode === 'timeline' ? 'timeline' : undefined)}
                className="inline-flex items-center gap-1 rounded-xl border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-bold text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800 transition"
              >
                <Flag className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                <span>Ir para o final</span>
              </button>
            </div>
          )}
        </div>

        {/* Subject filter */}
        <div className="flex items-center gap-2 self-start lg:self-auto">
          <Filter className="h-3.5 w-3.5 text-stone-500 dark:text-stone-400 shrink-0" />
          <select
            value={subjectFilterId}
            onChange={(e) => setSubjectFilterId(e.target.value)}
            aria-label="Filtrar cronograma por matéria"
            className="rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 focus:border-indigo-500 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
          >
            <option value="all">Todas as matérias ({subjects.length})</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Fixed Commitment Conflict Alert */}
      {conflicts.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 dark:text-amber-200">
            <span className="font-bold block">Ajuste automático pela Grade Fixa ativo</span>
            Em {conflicts.map((c) => c.dayLabel).join(', ')}, sua meta de estudo ultrapassava o tempo livre após trabalho/compromissos fixos e foi limitada ao tempo útil disponível no dia.
          </div>
        </div>
      )}

      {/* Overdue alert if any */}
      {overdueTasks.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/40 dark:bg-rose-950/30">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <div className="text-xs text-rose-900 dark:text-rose-200">
              <span className="font-bold block">
                Você tem {overdueTasks.length}{' '}
                {overdueTasks.length === 1 ? 'tarefa atrasada' : 'tarefas atrasadas'} de dias anteriores.
              </span>
              O algoritmo pode redistribuir essas tarefas nos próximos dias sem sobrecarregar sua rotina.
            </div>
          </div>
          <button
            type="button"
            onClick={handleRecalculate}
            className="self-start sm:self-auto rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700"
          >
            Rebalancear Agora
          </button>
        </div>
      )}

      {/* ===================== VIEW MODE: WEEK (NAVIGABLE TO END DATE) ===================== */}
      {viewMode === 'week' && (
        <div className="space-y-4">
          {/* Week Navigation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 dark:border-stone-800 dark:bg-stone-900">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safeWeekIndex <= 0}
                onClick={() => setWeekIndex((w) => Math.max(0, w - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 disabled:opacity-40 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700 transition"
                title="Semana anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div>
                <div className="text-sm font-extrabold text-stone-900 dark:text-stone-100 tabular-nums">
                  Semana {safeWeekIndex + 1} de {totalWeeks}
                </div>
                <div className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                  {weekStartLabel} – {weekEndLabel}
                </div>
              </div>
              <button
                type="button"
                disabled={safeWeekIndex >= totalWeeks - 1}
                onClick={() => setWeekIndex((w) => Math.min(totalWeeks - 1, w + 1))}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 disabled:opacity-40 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700 transition"
                title="Próxima semana"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={safeWeekIndex}
                onChange={(e) => setWeekIndex(Number(e.target.value))}
                aria-label="Selecionar semana do cronograma"
                className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200"
              >
                {Array.from({ length: totalWeeks }).map((_, idx) => {
                  const s = addDays(todayStr, idx * 7);
                  const e = addDays(todayStr, Math.min(horizon.generatedDays - 1, idx * 7 + 6));
                  return (
                    <option key={idx} value={idx}>
                      Semana {idx + 1} ({formatShortDatePtBr(s)} – {formatShortDatePtBr(e)})
                    </option>
                  );
                })}
              </select>

              {safeWeekIndex !== 0 && (
                <button
                  type="button"
                  onClick={() => setWeekIndex(0)}
                  className="rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-bold text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200"
                >
                  Hoje
                </button>
              )}

              {safeWeekIndex < totalWeeks - 1 && (
                <button
                  type="button"
                  onClick={() => setWeekIndex(totalWeeks - 1)}
                  className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300"
                >
                  Última semana
                </button>
              )}
            </div>
          </div>

          {/* 7-day interactive strip */}
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((w) => {
              const isSelected = selectedDate === w.dateStr;
              return (
                <button
                  key={w.dateStr}
                  type="button"
                  onClick={() => {
                    setSelectedDate(w.dateStr);
                    setViewMode('day');
                  }}
                  className={`flex flex-col items-center justify-center rounded-2xl border p-2 sm:p-3 transition-all ${
                    w.isTargetEndDate
                      ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20 dark:border-emerald-500 dark:bg-emerald-950/40'
                      : isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600/20 dark:border-indigo-500 dark:bg-indigo-950/50 dark:ring-indigo-500/30'
                      : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700'
                  }`}
                >
                  <span className="text-[11px] font-bold uppercase text-stone-500 dark:text-stone-400">
                    {w.dayName}
                  </span>
                  <span className="text-base sm:text-lg font-black text-stone-900 dark:text-stone-100 mt-0.5 tabular-nums">
                    {w.dayNum}
                  </span>
                  {w.isToday && (
                    <span className="rounded-md bg-indigo-600 px-1.5 py-0.2 text-[9px] font-bold text-white mt-1">
                      Hoje
                    </span>
                  )}
                  {w.isTargetEndDate && (
                    <span className="rounded-md bg-emerald-600 px-1.5 py-0.2 text-[9px] font-bold text-white mt-1">
                      Fim
                    </span>
                  )}
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-stone-400 dark:text-stone-500 tabular-nums">
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

          {/* Week Day Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {weekDays.map((w) => {
              const dayTasks = w.dayTasks;
              const dayMinutes = dayTasks.reduce((sum, t) => sum + (t.durationMinutes || 0), 0);
              return (
                <div
                  key={w.dateStr}
                  className={`rounded-2xl border p-4 shadow-xs flex flex-col justify-between ${
                    w.isTargetEndDate
                      ? 'border-emerald-400 bg-emerald-50/20 ring-1 ring-emerald-300/60 dark:border-emerald-700/70 dark:bg-emerald-950/20'
                      : w.isToday
                      ? 'border-indigo-300 bg-indigo-50/20 ring-1 ring-indigo-200 dark:border-indigo-900/60 dark:bg-indigo-950/20 dark:ring-indigo-900/40'
                      : 'border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-stone-900 dark:text-stone-100 capitalize">
                          {w.dayName}, {w.dayNum} {w.monthShort}
                        </span>
                        {w.isToday && (
                          <span className="rounded-md bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            Hoje
                          </span>
                        )}
                        {w.isTargetEndDate && (
                          <span className="rounded-md bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            Meta Final
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-stone-400 dark:text-stone-500 tabular-nums">
                        {dayTasks.length > 0
                          ? `${dayTasks.length} bl · ${formatHoursMinutes(dayMinutes)}`
                          : 'Livre'}
                      </span>
                    </div>

                    {dayTasks.length === 0 ? (
                      <div className="py-6 text-center text-xs text-stone-400 dark:text-stone-500">
                        Nenhum estudo agendado para este dia.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {dayTasks.map((t, tIdx) => {
                          const isDone = t.status === 'concluida';
                          const isDraftTask = activeTimerDraft?.task.id === t.id;
                          const isPausedTask = isDraftTask || t.status === 'em_andamento';
                          return (
                            <div
                              key={`${t.id}-${tIdx}`}
                              className={`rounded-xl border p-3 transition ${
                                isDone
                                  ? 'border-stone-200 bg-stone-50/60 opacity-75 dark:border-stone-800 dark:bg-stone-800/40'
                                  : isPausedTask
                                  ? 'border-amber-300 bg-amber-50/40 dark:border-amber-700/70 dark:bg-amber-950/20'
                                  : 'border-stone-200 bg-white hover:border-indigo-300 dark:border-stone-800 dark:bg-stone-900/90 dark:hover:border-indigo-700'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="h-2.5 w-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: t.subjectColor }}
                                  />
                                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 truncate max-w-[150px]">
                                    {t.subjectName}
                                  </span>
                                </div>
                                <span
                                  className={`text-[10px] font-semibold tabular-nums ${
                                    isDraftTask
                                      ? 'text-amber-700 dark:text-amber-400 font-bold'
                                      : 'text-stone-400 dark:text-stone-500'
                                  }`}
                                >
                                  {isDraftTask
                                    ? `⏸ ${formatTimerClock(activeTimerDraft.secondsRemaining)}`
                                    : `${t.durationMinutes}m`}
                                </span>
                              </div>

                              <h4
                                className={`mt-1 text-xs font-bold leading-tight ${
                                  isDone
                                    ? 'line-through text-stone-400 dark:text-stone-500'
                                    : 'text-stone-900 dark:text-stone-100'
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
                                    type="button"
                                    onClick={() =>
                                      isDraftTask ? resumePausedTimer() : startStudySession(t)
                                    }
                                    className={`flex items-center gap-1 text-[11px] font-bold ${
                                      isPausedTask
                                        ? 'text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300'
                                        : 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300'
                                    }`}
                                  >
                                    <Play className="h-3 w-3 fill-current" />
                                    <span>{isPausedTask ? 'Continuar' : 'Estudar'}</span>
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
      )}

      {/* ===================== VIEW MODE: MONTH (FULL CALENDAR TO END DATE) ===================== */}
      {viewMode === 'month' && (
        <div className="space-y-4">
          {/* Month Navigation + Quick Month Pills */}
          <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={activeMonthPos <= 0}
                  onClick={() => setActiveMonthKey(monthKeysInPeriod[Math.max(0, activeMonthPos - 1)])}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 disabled:opacity-40 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div>
                  <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
                    {formatMonthLabelPtBr(safeActiveMonthKey)}
                  </h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 tabular-nums">
                    Mês {activeMonthPos + 1} de {monthKeysInPeriod.length} até sua data final
                  </p>
                </div>
                <button
                  type="button"
                  disabled={activeMonthPos >= monthKeysInPeriod.length - 1}
                  onClick={() =>
                    setActiveMonthKey(
                      monthKeysInPeriod[Math.min(monthKeysInPeriod.length - 1, activeMonthPos + 1)]
                    )
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 disabled:opacity-40 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {monthKeysInPeriod.map((mKey) => {
                  const isActive = mKey === safeActiveMonthKey;
                  const isFinalMonth = profile.examDate && getMonthKey(profile.examDate) === mKey;
                  return (
                    <button
                      key={mKey}
                      type="button"
                      onClick={() => setActiveMonthKey(mKey)}
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'border border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300'
                      }`}
                    >
                      <span>{formatShortMonthChip(mKey)}</span>
                      {isFinalMonth && (
                        <Flag
                          className={`h-3 w-3 ${isActive ? 'text-emerald-200' : 'text-emerald-600 dark:text-emerald-400'}`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Weekday Header */}
            <div className="grid grid-cols-7 gap-1.5 pt-2 text-center text-[11px] font-bold uppercase text-stone-400 dark:text-stone-500">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Month Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {monthCalendarGrid.map((cell, idx) => {
                if (!cell.dateStr) {
                  return (
                    <div
                      key={`blank-${idx}`}
                      className="min-h-[76px] sm:min-h-[88px] rounded-xl bg-stone-50/40 dark:bg-stone-950/30"
                    />
                  );
                }

                const isSelected = selectedDate === cell.dateStr;
                const cellTasks = cell.tasks || [];
                const allDone =
                  cellTasks.length > 0 && (cell.completedCount || 0) === cellTasks.length;

                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    onClick={() => setSelectedDate(cell.dateStr!)}
                    className={`min-h-[76px] sm:min-h-[88px] flex flex-col justify-between rounded-xl border p-2 text-left transition ${
                      cell.isTargetEndDate
                        ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20 dark:border-emerald-500 dark:bg-emerald-950/35'
                        : isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600/20 dark:border-indigo-500 dark:bg-indigo-950/45'
                        : cell.isToday
                        ? 'border-indigo-300 bg-indigo-50/30 dark:border-indigo-800 dark:bg-indigo-950/20'
                        : cell.isPast || cell.isAfterEnd
                        ? 'border-stone-100 bg-stone-50/50 opacity-55 dark:border-stone-800/60 dark:bg-stone-900/40'
                        : 'border-stone-200 bg-white hover:border-indigo-300 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-indigo-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-extrabold tabular-nums ${
                          cell.isToday
                            ? 'text-indigo-700 dark:text-indigo-300'
                            : cell.isTargetEndDate
                            ? 'text-emerald-700 dark:text-emerald-300'
                            : 'text-stone-800 dark:text-stone-200'
                        }`}
                      >
                        {cell.dayNum}
                      </span>

                      {cell.isTargetEndDate ? (
                        <span className="rounded bg-emerald-600 px-1 py-0.2 text-[9px] font-bold text-white">
                          Fim
                        </span>
                      ) : cell.isToday ? (
                        <span className="rounded bg-indigo-600 px-1 py-0.2 text-[9px] font-bold text-white">
                          Hoje
                        </span>
                      ) : allDone ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : null}
                    </div>

                    {cellTasks.length > 0 ? (
                      <div className="space-y-1 w-full">
                        <div className="flex items-center gap-1 flex-wrap">
                          {cellTasks.slice(0, 4).map((t, tIdx) => (
                            <span
                              key={`${t.id}-${tIdx}`}
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: t.subjectColor }}
                              title={t.subjectName}
                            />
                          ))}
                          {cellTasks.length > 4 && (
                            <span className="text-[9px] font-bold text-stone-400">
                              +{cellTasks.length - 4}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-semibold text-stone-600 dark:text-stone-400 tabular-nums truncate">
                          {cellTasks.length} bl · {formatHoursMinutes(cell.totalMinutes || 0)}
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] text-stone-300 dark:text-stone-700">—</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Detail Preview below Calendar */}
          <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-3 mb-4">
              <div>
                <h4 className="text-sm font-extrabold text-stone-900 dark:text-stone-100 capitalize">
                  {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 tabular-nums">
                  {currentDayTasks.length}{' '}
                  {currentDayTasks.length === 1 ? 'bloco programado' : 'blocos programados'}
                  {profile.examDate === selectedDate && ' • Meta final / Dia da prova'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewMode('day')}
                className="self-start sm:self-auto rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-bold text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200"
              >
                Abrir Visão Diária
              </button>
            </div>

            {currentDayTasks.length === 0 ? (
              <p className="text-xs text-stone-500 dark:text-stone-400 py-4 text-center">
                Nenhuma tarefa agendada para esta data.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentDayTasks.map((t, idx) => {
                  const isDone = t.status === 'concluida';
                  const isDraftTask = activeTimerDraft?.task.id === t.id;
                  const isPausedTask = isDraftTask || t.status === 'em_andamento';
                  return (
                    <div
                      key={`${t.id}-${idx}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 p-3 dark:border-stone-800"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: t.subjectColor }}
                          />
                          <span className="text-[11px] font-bold uppercase text-stone-500 dark:text-stone-400 truncate">
                            {t.subjectName}
                          </span>
                          <span className="rounded bg-stone-100 px-1.5 py-0.2 text-[9px] font-semibold uppercase text-stone-600 dark:bg-stone-800 dark:text-stone-400">
                            {t.type}
                          </span>
                        </div>
                        <p
                          className={`mt-1 text-xs font-bold truncate ${
                            isDone ? 'line-through text-stone-400' : 'text-stone-900 dark:text-stone-100'
                          }`}
                        >
                          {t.topicName}
                        </p>
                        <span className="text-[10px] text-stone-400 tabular-nums">
                          {t.durationMinutes} min
                        </span>
                      </div>
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            isDraftTask ? resumePausedTimer() : startStudySession(t)
                          }
                          className={`shrink-0 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-bold text-white ${
                            isPausedTask
                              ? 'bg-amber-600 hover:bg-amber-700'
                              : 'bg-indigo-600 hover:bg-indigo-700'
                          }`}
                        >
                          <Play className="h-3 w-3 fill-white" />
                          <span>{isPausedTask ? 'Continuar' : 'Estudar'}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== VIEW MODE: TIMELINE (FULL PERIOD TO END DATE) ===================== */}
      {viewMode === 'timeline' && (
        <div className="space-y-4">
          {/* Subject Distribution Summary across entire period */}
          <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
                  Resumo Completo do Período (Hoje → {formatShortDatePtBr(horizon.generatedEndDate)})
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Clique em qualquer mês abaixo para expandir ou recolher todos os dias até o término.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const allOpen: Record<string, boolean> = {};
                    monthKeysInPeriod.forEach((k) => (allOpen[k] = true));
                    setExpandedMonths(allOpen);
                  }}
                  className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-[11px] font-bold text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200"
                >
                  Expandir todos os meses
                </button>
                <button
                  type="button"
                  onClick={() => setExpandedMonths({ [monthKeysInPeriod[0]]: true })}
                  className="rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-[11px] font-bold text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300"
                >
                  Recolher
                </button>
              </div>
            </div>

            {periodStats.bySubject.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {periodStats.bySubject.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setSubjectFilterId((curr) => (curr === item.id ? 'all' : item.id))
                    }
                    className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs transition ${
                      subjectFilterId === item.id
                        ? 'border-indigo-500 bg-indigo-50 font-bold text-indigo-900 dark:border-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-200'
                        : 'border-stone-200 bg-stone-50/70 text-stone-700 hover:bg-stone-100 dark:border-stone-800 dark:bg-stone-800/60 dark:text-stone-300'
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-semibold">{item.name}</span>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 tabular-nums">
                      {item.blocks} bl ({formatHoursMinutes(item.minutes)})
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Month Accordions all the way to the End Date */}
          <div className="space-y-3">
            {timelineByMonth.map((month) => {
              const isExpanded = Boolean(expandedMonths[month.monthKey]);
              return (
                <div
                  key={month.monthKey}
                  className="rounded-2xl border border-stone-200 bg-white overflow-hidden dark:border-stone-800 dark:bg-stone-900"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedMonths((prev) => ({
                        ...prev,
                        [month.monthKey]: !prev[month.monthKey],
                      }))
                    }
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-stone-50/80 dark:hover:bg-stone-800/40 transition"
                  >
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-base font-extrabold text-stone-900 dark:text-stone-100">
                        {month.label}
                      </span>
                      {month.hasTargetEndDate && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                          <Flag className="h-3 w-3" />
                          <span>Mês de Término</span>
                        </span>
                      )}
                      <span className="text-xs font-medium text-stone-500 dark:text-stone-400 tabular-nums">
                        {month.days.length} {month.days.length === 1 ? 'dia' : 'dias'} •{' '}
                        {month.totalBlocks} blocos • {formatHoursMinutes(month.totalMinutes)}
                      </span>
                    </div>

                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-stone-500 shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-stone-500 shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-stone-100 dark:border-stone-800 divide-y divide-stone-100 dark:divide-stone-800">
                      {month.days.length === 0 ? (
                        <div className="px-5 py-6 text-center text-xs text-stone-400">
                          Nenhum bloco correspondente ao filtro neste mês.
                        </div>
                      ) : (
                        month.days.map((day) => (
                          <div
                            key={day.dateStr}
                            className={`px-5 py-3.5 ${
                              day.isTargetEndDate
                                ? 'bg-emerald-50/40 dark:bg-emerald-950/20'
                                : day.isToday
                                ? 'bg-indigo-50/30 dark:bg-indigo-950/15'
                                : ''
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => jumpToDate(day.dateStr, 'day')}
                                  className="text-xs font-extrabold text-stone-900 hover:text-indigo-600 dark:text-stone-100 dark:hover:text-indigo-400 capitalize"
                                >
                                  {day.weekdayLabel}, {day.shortDateLabel}
                                </button>
                                {day.isToday && (
                                  <span className="rounded bg-indigo-600 px-1.5 py-0.2 text-[10px] font-bold text-white">
                                    Hoje
                                  </span>
                                )}
                                {day.isTargetEndDate && (
                                  <span className="inline-flex items-center gap-1 rounded bg-emerald-600 px-1.5 py-0.2 text-[10px] font-bold text-white">
                                    <Flag className="h-2.5 w-2.5" />
                                    Data Final Escolhida
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 tabular-nums">
                                {day.tasks.length} {day.tasks.length === 1 ? 'bloco' : 'blocos'} •{' '}
                                {formatHoursMinutes(day.totalMinutes)}
                              </span>
                            </div>

                            {day.tasks.length === 0 ? (
                              <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                                Dia final do cronograma (descanso / prova).
                              </p>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {day.tasks.map((t, idx) => {
                                  const isDone = t.status === 'concluida';
                                  const isDraftTask = activeTimerDraft?.task.id === t.id;
                                  const isPausedTask = isDraftTask || t.status === 'em_andamento';
                                  return (
                                    <div
                                      key={`${t.id}-${idx}`}
                                      className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 ${
                                        isDone
                                          ? 'border-stone-200 bg-stone-50/70 opacity-75 dark:border-stone-800 dark:bg-stone-800/40'
                                          : 'border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900'
                                      }`}
                                    >
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                          <span
                                            className="h-2 w-2 rounded-full shrink-0"
                                            style={{ backgroundColor: t.subjectColor }}
                                          />
                                          <span className="text-[10px] font-bold uppercase text-stone-500 dark:text-stone-400 truncate">
                                            {t.subjectName}
                                          </span>
                                          <span className="text-[10px] text-stone-400 tabular-nums">
                                            · {t.durationMinutes}m
                                          </span>
                                        </div>
                                        <p
                                          className={`text-xs font-bold truncate mt-0.5 ${
                                            isDone
                                              ? 'line-through text-stone-400'
                                              : 'text-stone-800 dark:text-stone-100'
                                          }`}
                                        >
                                          {t.topicName}
                                        </p>
                                      </div>

                                      {isDone ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            isDraftTask
                                              ? resumePausedTimer()
                                              : startStudySession(t)
                                          }
                                          className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-bold ${
                                            isPausedTask
                                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                              : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300'
                                          }`}
                                        >
                                          {isPausedTask ? 'Continuar' : 'Estudar'}
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================== VIEW MODE: DAY (EXPANDED DETAILED LIST) ===================== */}
      {viewMode === 'day' && (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs dark:border-stone-800 dark:bg-stone-900">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={selectedDate <= todayStr}
                onClick={() => setSelectedDate((d) => addDays(d, -1))}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 disabled:opacity-40 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 shrink-0"
                title="Dia anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-stone-900 dark:text-stone-100">
                  {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
                    dateStyle: 'full',
                  })}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  {selectedDate === todayStr && (
                    <span className="rounded bg-indigo-600 px-1.5 py-0.2 text-[10px] font-bold text-white">
                      Hoje
                    </span>
                  )}
                  {profile.examDate === selectedDate && (
                    <span className="rounded bg-emerald-600 px-1.5 py-0.2 text-[10px] font-bold text-white">
                      Data Final Escolhida
                    </span>
                  )}
                  <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 tabular-nums">
                    {currentDayTasks.length}{' '}
                    {currentDayTasks.length === 1 ? 'tarefa' : 'tarefas'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                disabled={selectedDate >= horizon.generatedEndDate}
                onClick={() => setSelectedDate((d) => addDays(d, 1))}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 disabled:opacity-40 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 shrink-0"
                title="Próximo dia"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {selectedDate !== todayStr && (
                <button
                  type="button"
                  onClick={() => jumpToDate(todayStr, 'day')}
                  className="rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-bold text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200"
                >
                  Hoje
                </button>
              )}
              <button
                type="button"
                onClick={() => setViewMode('week')}
                className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-bold text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200"
              >
                Voltar para Semana
              </button>
            </div>
          </div>

          {currentDayTasks.length === 0 ? (
            <div className="py-12 text-center text-stone-500 dark:text-stone-400">
              <p className="text-sm">Nenhum estudo agendado para esta data específica.</p>
              <button
                type="button"
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
                const isDraftTask = activeTimerDraft?.task.id === t.id;
                const isPausedTask = isDraftTask || t.status === 'em_andamento';
                return (
                  <div
                    key={`${t.id}-${idx}`}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border p-4 ${
                      isDone
                        ? 'border-stone-200 bg-stone-50/60 opacity-80 dark:border-stone-800 dark:bg-stone-800/40'
                        : isPausedTask
                        ? 'border-amber-300 bg-amber-50/40 dark:border-amber-700/70 dark:bg-amber-950/20'
                        : 'border-stone-200 bg-white hover:border-indigo-300 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-indigo-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                          isDone
                            ? 'bg-emerald-600 text-white'
                            : isPausedTask
                            ? 'bg-amber-500 text-white'
                            : 'bg-stone-100 text-stone-700 border border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700'
                        }`}
                      >
                        {isDone ? '✓' : idx + 1}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
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
                            isDone
                              ? 'line-through text-stone-400 dark:text-stone-500'
                              : 'text-stone-900 dark:text-stone-100'
                          }`}
                        >
                          {t.topicName}
                        </h4>

                        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 tabular-nums">
                          {isDraftTask ? (
                            <span className="font-bold text-amber-700 dark:text-amber-400">
                              Pausado com {formatTimerClock(activeTimerDraft.secondsRemaining)}{' '}
                              restantes
                            </span>
                          ) : (
                            <span>{t.durationMinutes} minutos</span>
                          )}
                          <span aria-hidden="true"> · </span>
                          <span>Prioridade calculada: {t.priorityScore} pts</span>
                          {t.pareiEm && (
                            <>
                              <span aria-hidden="true"> · </span>
                              <span className="font-semibold text-indigo-600 dark:text-cyan-400">
                                Parou em: {t.pareiEm}
                              </span>
                            </>
                          )}
                        </p>
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
                          type="button"
                          onClick={() =>
                            isDraftTask ? resumePausedTimer() : startStudySession(t)
                          }
                          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-xs active:scale-95 transition-all whitespace-nowrap ${
                            isPausedTask
                              ? 'bg-amber-600 hover:bg-amber-700'
                              : 'bg-indigo-600 hover:bg-indigo-700'
                          }`}
                        >
                          <Play className="h-3.5 w-3.5 fill-white" />
                          <span>{isPausedTask ? 'Continuar' : 'Iniciar Bloco'}</span>
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
