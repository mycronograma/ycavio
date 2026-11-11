import React from 'react';
import {
  Flame,
  Award,
  Sparkles,
  RefreshCw,
  Clock,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { getLevelProgress, getTodayStr } from '../../services/scheduleEngine';
import { ThemeToggle } from '../common/ThemeToggle';

interface NavbarProps {
  onOpenOnboarding: () => void;
  onOpenAchievements: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAchievements }) => {
  const { state, recalculateSchedule } = useStudy();
  const { profile, tasks, dailyGoal } = state;

  const todayStr = getTodayStr();
  const todayTasks = tasks.filter((t) => t.date === todayStr);
  const completedTodayCount = todayTasks.filter((t) => t.status === 'concluida').length;

  const levelProgress = getLevelProgress(profile.xp);

  const [isRecalculating, setIsRecalculating] = React.useState(false);

  const handleRecalculate = () => {
    setIsRecalculating(true);
    setTimeout(() => {
      recalculateSchedule();
      setIsRecalculating(false);
    }, 450);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-stone-50/95 backdrop-blur-md dark:border-stone-800 dark:bg-stone-950/95 transition-colors duration-200">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand & Target Exam */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white shadow-sm ring-2 ring-indigo-500/20">
            <span className="font-mono text-xl tracking-tighter">T</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold tracking-tight text-stone-900 dark:text-stone-100">Trilha</h1>
              <span className="hidden rounded-md bg-stone-200/60 dark:bg-stone-800 px-2 py-0.5 text-xs font-semibold text-stone-700 dark:text-stone-300 sm:inline-block">
                Cronograma Inteligente
              </span>
            </div>
            {profile.targetExam ? (
              <p className="flex items-center gap-1.5 text-xs font-medium text-stone-500 dark:text-stone-400">
                <Calendar className="h-3 w-3 text-indigo-500" />
                <span className="max-w-[140px] truncate sm:max-w-xs">{profile.targetExam}</span>
                {profile.examDate && (
                  <span className="text-stone-400 dark:text-stone-500">
                    • Faltam{' '}
                    {Math.max(
                      0,
                      Math.ceil(
                        (new Date(profile.examDate).getTime() - new Date().getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    )}{' '}
                    dias
                  </span>
                )}
              </p>
            ) : (
              <p className="text-xs text-stone-500 dark:text-stone-400">Planejamento & Evolução</p>
            )}
          </div>
        </div>

        {/* Gamification Stats, Theme Toggle & Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Daily Goal Quick Badge */}
          <div className="hidden items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-1.5 shadow-xs md:flex dark:border-stone-800 dark:bg-stone-900">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>
                Hoje: {completedTodayCount}/{todayTasks.length}
              </span>
            </div>
            <span className="text-stone-300 dark:text-stone-700">|</span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400">
              <Clock className="h-3.5 w-3.5 text-indigo-500" />
              <span>{dailyGoal.completedMinutes}m estudados</span>
            </div>
          </div>

          {/* Streak Flame */}
          <div
            className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/80 px-2.5 py-1.5 text-xs font-bold text-amber-900 shadow-xs dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300"
            title="Sequência de dias estudando"
          >
            <Flame className="h-4 w-4 fill-amber-500 text-amber-500 animate-pulse" />
            <span>{profile.streakDays}</span>
            <span className="hidden sm:inline font-semibold text-amber-700 dark:text-amber-400">dias</span>
          </div>

          {/* Level & XP button */}
          <button
            onClick={onOpenAchievements}
            className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/70 px-2.5 py-1.5 text-left transition-all hover:border-indigo-300 hover:bg-indigo-100/60 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:hover:border-indigo-800"
            title="Clique para ver conquistas e nível"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-xs font-extrabold text-white">
              {levelProgress.currentLevel}
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-950 dark:text-indigo-200">
                <Award className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                <span>{levelProgress.title}</span>
              </div>
              <div className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
                {profile.xp} XP ({levelProgress.percent}%)
              </div>
            </div>
          </button>

          {/* Recalculate button */}
          <button
            onClick={handleRecalculate}
            disabled={isRecalculating}
            className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 transition hover:bg-stone-100 hover:text-stone-900 active:scale-95 disabled:opacity-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100"
            title="Recalcular cronograma com base nas prioridades atuais"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-stone-500 dark:text-stone-400 ${isRecalculating ? 'animate-spin text-indigo-600' : ''}`} />
            <span className="hidden lg:inline">Recalcular</span>
          </button>

          {/* Theme Toggle Selector (Light / Dark) */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
