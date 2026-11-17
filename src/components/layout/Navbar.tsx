import React, { useState } from 'react';
import {
  Flame,
  RefreshCw,
  Bell,
  User,
  Settings,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { getLevelProgress } from '../../services/scheduleEngine';
import { ThemeToggle } from '../common/ThemeToggle';
import { NotificationCenterModal } from '../notifications/NotificationCenterModal';
import { LoginModal } from '../auth/LoginModal';
import { BrandLogo } from '../common/BrandLogo';
import { NavSection } from './Sidebar';

interface NavbarProps {
  currentTab: NavSection;
  onOpenAchievements: () => void;
  onOpenProfile: () => void;
}

const SECTION_TITLES: Record<NavSection, string> = {
  metas: 'Metas do Dia',
  cronograma: 'Cronograma',
  materias: 'Matérias & Presets',
  planilha: 'Planilha de Estudos',
  progresso: 'Progresso & Conquistas',
  perfil: 'Perfil & Rotina',
};

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onOpenAchievements,
  onOpenProfile,
}) => {
  const { state, recalculateSchedule } = useStudy();
  const { profile, notifications, currentUser } = state;

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

  const levelProgress = getLevelProgress(profile.xp);
  const unreadNotifs = (notifications || []).filter((n) => !n.read).length;

  const daysToExam = profile.examDate
    ? Math.max(
        0,
        Math.ceil(
          (new Date(profile.examDate).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : null;

  const handleRecalculate = () => {
    setIsRecalculating(true);
    setTimeout(() => {
      recalculateSchedule();
      setIsRecalculating(false);
    }, 450);
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-16 border-b border-stone-200 bg-white/90 backdrop-blur-md dark:border-slate-800/80 dark:bg-[#040714]/90 transition-colors duration-200">
        <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Left: Mobile Logo + Clean Active Section Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="md:hidden shrink-0">
              <BrandLogo iconOnly size="sm" />
            </div>

            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-stone-900 dark:text-white truncate">
                {SECTION_TITLES[currentTab]}
              </h1>
              {profile.targetExam && (
                <p className="hidden sm:flex items-center gap-1.5 text-xs text-stone-500 dark:text-slate-400 truncate tabular-nums">
                  <span className="truncate">{profile.targetExam}</span>
                  {daysToExam !== null && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="whitespace-nowrap">
                        Faltam {daysToExam} dias
                      </span>
                    </>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Right: Minimal Status Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Streak */}
            <div
              className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-bold text-stone-800 dark:border-slate-800 dark:bg-[#0b1121] dark:text-slate-200 tabular-nums"
              title="Sequência de dias estudando"
            >
              <Flame className="h-3.5 w-3.5 text-amber-500" />
              <span>{profile.streakDays}d</span>
            </div>

            {/* Level & XP */}
            <button
              type="button"
              onClick={onOpenAchievements}
              className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-bold text-stone-800 hover:bg-stone-100 dark:border-slate-800 dark:bg-[#0b1121] dark:text-slate-200 dark:hover:bg-slate-800/80 transition tabular-nums whitespace-nowrap"
              title="Ver níveis e conquistas"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-600 text-[11px] font-extrabold text-white">
                {levelProgress.currentLevel}
              </span>
              <span className="hidden sm:inline">{profile.xp} XP</span>
            </button>

            {/* Notifications */}
            <button
              type="button"
              onClick={() => setIsNotificationsOpen(true)}
              className="relative rounded-xl border border-stone-200 bg-white p-2 text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:border-slate-800 dark:bg-[#0b1121] dark:text-slate-300 dark:hover:bg-slate-800 transition"
              title="Notificações"
            >
              <Bell className="h-4 w-4" />
              {unreadNotifs > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white tabular-nums">
                  {unreadNotifs}
                </span>
              )}
            </button>

            {/* Recalculate */}
            <button
              type="button"
              onClick={handleRecalculate}
              disabled={isRecalculating}
              className="hidden sm:flex rounded-xl border border-stone-200 bg-white p-2 text-stone-600 hover:bg-stone-100 hover:text-stone-900 disabled:opacity-50 dark:border-slate-800 dark:bg-[#0b1121] dark:text-slate-300 dark:hover:bg-slate-800 transition"
              title="Recalcular cronograma"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  isRecalculating ? 'animate-spin text-indigo-500' : ''
                }`}
              />
            </button>

            {/* Mobile Profile Shortcut */}
            <button
              type="button"
              onClick={onOpenProfile}
              className="md:hidden rounded-xl border border-stone-200 bg-white p-2 text-stone-600 hover:bg-stone-100 dark:border-slate-800 dark:bg-[#0b1121] dark:text-slate-300 transition"
              title="Perfil & Rotina"
            >
              <Settings className="h-4 w-4" />
            </button>

            {/* User Account */}
            <button
              type="button"
              onClick={() => setIsLoginOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-bold text-stone-800 hover:bg-stone-100 dark:border-slate-800 dark:bg-[#0b1121] dark:text-slate-200 dark:hover:bg-slate-800 transition whitespace-nowrap"
              title="Minha Conta"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-cyan-300 font-extrabold text-[10px]">
                {currentUser?.name ? (
                  currentUser.name[0].toUpperCase()
                ) : (
                  <User className="h-3 w-3" />
                )}
              </div>
              <span className="hidden sm:inline max-w-[90px] truncate">
                {currentUser?.isLoggedIn
                  ? currentUser.name.split(' ')[0]
                  : 'Conta'}
              </span>
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <NotificationCenterModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />
    </>
  );
};
