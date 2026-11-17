import React from 'react';
import {
  Table2,
  Target,
  CalendarDays,
  BookOpen,
  BarChart3,
  UserCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { getTodayStr } from '../../services/scheduleEngine';
import { BrandLogo } from '../common/BrandLogo';

export type NavSection =
  | 'metas'
  | 'cronograma'
  | 'materias'
  | 'planilha'
  | 'progresso'
  | 'perfil';

interface SidebarProps {
  currentTab: NavSection;
  onSelectTab: (tab: NavSection) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
}) => {
  const { state } = useStudy();
  const todayStr = getTodayStr();
  const pendingToday = state.tasks.filter(
    (t) => t.date === todayStr && (t.status === 'pendente' || t.status === 'em_andamento')
  ).length;
  const pendingCustomGoals = (state.dailyGoal.customGoals || []).filter(
    (g) => !g.completed
  ).length;
  const totalPendingDailyGoals = pendingToday + pendingCustomGoals;

  const navItems: Array<{
    id: NavSection;
    label: string;
    shortLabel?: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    {
      id: 'metas',
      label: 'Metas do Dia',
      shortLabel: 'Metas',
      icon: Target,
      badge: totalPendingDailyGoals > 0 ? totalPendingDailyGoals : undefined,
    },
    {
      id: 'cronograma',
      label: 'Cronograma',
      icon: CalendarDays,
      badge: pendingToday > 0 ? pendingToday : undefined,
    },
    { id: 'materias', label: 'Matérias', icon: BookOpen },
    { id: 'planilha', label: 'Planilha', icon: Table2 },
    { id: 'progresso', label: 'Progresso', icon: BarChart3 },
  ];

  const userName = state.currentUser?.name || state.profile.name || 'Estudante';

  return (
    <>
      {/* Desktop Left Sidebar */}
      <aside
        className={`hidden md:flex flex-col shrink-0 border-r border-stone-200 bg-white dark:border-slate-800/80 dark:bg-[#070b18] transition-all duration-200 ${
          collapsed ? 'w-[76px]' : 'w-60'
        }`}
      >
        {/* Brand Header */}
        <div
          className={`flex items-center border-b border-stone-100 dark:border-slate-800/70 px-4 h-16 ${
            collapsed ? 'justify-center' : 'justify-start'
          }`}
        >
          <BrandLogo
            iconOnly={collapsed}
            size={collapsed ? 'sm' : 'md'}
            subtitleText="Estudo Inteligente"
          />
        </div>

        {/* 5 Essential Navigation Sections */}
        <nav className="flex-1 px-3 py-5 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition whitespace-nowrap ${
                  collapsed ? 'justify-center' : 'justify-between'
                } ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-cyan-300'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100'
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`h-[18px] w-[18px] shrink-0 ${
                      isActive
                        ? 'text-indigo-600 dark:text-cyan-400'
                        : 'text-stone-400 dark:text-slate-500'
                    }`}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </span>

                {!collapsed && item.badge !== undefined && (
                  <span
                    className={`text-xs font-mono font-bold tabular-nums ${
                      isActive
                        ? 'text-indigo-600 dark:text-cyan-300'
                        : 'text-stone-400 dark:text-slate-500'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Profile & Collapse Controls */}
        <div className="border-t border-stone-100 dark:border-slate-800/70 p-3 space-y-1.5">
          <button
            type="button"
            onClick={() => onSelectTab('perfil')}
            title={collapsed ? 'Perfil & Rotina' : undefined}
            className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition whitespace-nowrap ${
              collapsed ? 'justify-center' : ''
            } ${
              currentTab === 'perfil'
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-cyan-300'
                : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100'
            }`}
          >
            <UserCheck
              className={`h-[18px] w-[18px] shrink-0 ${
                currentTab === 'perfil'
                  ? 'text-indigo-600 dark:text-cyan-400'
                  : 'text-stone-400 dark:text-slate-500'
              }`}
            />
            {!collapsed && (
              <div className="min-w-0 text-left">
                <span className="block truncate text-xs font-bold">{userName}</span>
                <span className="block text-[11px] font-medium text-stone-400 dark:text-slate-500">
                  Perfil &amp; Rotina
                </span>
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={onToggleCollapse}
            className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:text-slate-500 dark:hover:bg-slate-800/60 dark:hover:text-slate-200 transition ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Recolher</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden items-center justify-around border-t border-stone-200 bg-white/95 py-1.5 backdrop-blur-md px-1 dark:border-slate-800 dark:bg-[#070b18]/95">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1 px-1 rounded-lg relative min-w-0 ${
                isActive
                  ? 'text-indigo-600 dark:text-cyan-400 font-bold'
                  : 'text-stone-500 dark:text-slate-400 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white tabular-nums">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] whitespace-nowrap truncate max-w-full">
                {item.shortLabel || item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
