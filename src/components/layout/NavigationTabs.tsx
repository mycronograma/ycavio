import React from 'react';
import {
  CalendarDays,
  BookOpen,
  RotateCw,
  BarChart3,
  Trophy,
  UserCheck,
  Compass,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { getTodayStr } from '../../services/scheduleEngine';

export type TabType = 'hoje' | 'cronograma' | 'materias' | 'revisoes' | 'progresso' | 'conquistas' | 'perfil';

interface NavigationTabsProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  currentTab,
  onSelectTab,
}) => {
  const { state } = useStudy();

  const todayStr = getTodayStr();
  const pendingToday = state.tasks.filter((t) => t.date === todayStr && t.status === 'pendente').length;
  const pendingReviews = state.reviews.filter((r) => r.dueDate <= todayStr && r.status === 'pendente').length;

  const tabs: Array<{ id: TabType; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }> = [
    { id: 'hoje', label: 'Hoje', icon: Compass, badge: pendingToday > 0 ? pendingToday : undefined },
    { id: 'cronograma', label: 'Cronograma', icon: CalendarDays },
    { id: 'materias', label: 'Matérias', icon: BookOpen },
    { id: 'revisoes', label: 'Revisões', icon: RotateCw, badge: pendingReviews > 0 ? pendingReviews : undefined },
    { id: 'progresso', label: 'Progresso', icon: BarChart3 },
    { id: 'conquistas', label: 'Conquistas', icon: Trophy },
    { id: 'perfil', label: 'Perfil & Rotina', icon: UserCheck },
  ];

  return (
    <>
      {/* Desktop Navigation Pills */}
      <nav className="hidden md:flex items-center gap-1 border-b border-stone-200 bg-stone-100/70 px-4 py-2 sm:px-6 lg:px-8 dark:border-stone-800 dark:bg-stone-900/60 transition-colors duration-200">
        <div className="mx-auto flex max-w-7xl w-full items-center justify-start gap-1.5 overflow-x-auto py-0.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-indigo-900 shadow-xs border border-stone-200 dark:bg-stone-800 dark:text-indigo-300 dark:border-stone-700'
                    : 'text-stone-600 hover:bg-stone-200/60 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800/60 dark:hover:text-stone-200'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-stone-400 dark:text-stone-500'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`ml-1 rounded-full px-1.5 py-0.2 text-[11px] font-bold ${
                      isActive ? 'bg-indigo-600 text-white' : 'bg-stone-300 text-stone-700 dark:bg-stone-700 dark:text-stone-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden items-center justify-around border-t border-stone-200 bg-white/95 py-2 backdrop-blur-md px-2 shadow-lg dark:border-stone-800 dark:bg-stone-950/95 transition-colors duration-200">
        {tabs.slice(0, 5).map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-lg relative ${
                isActive ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-stone-500 dark:text-stone-400 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px]">{tab.label}</span>
            </button>
          );
        })}

        {/* Overflow / more tab for mobile */}
        <button
          onClick={() => onSelectTab(currentTab === 'perfil' ? 'conquistas' : 'perfil')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-lg ${
            currentTab === 'perfil' || currentTab === 'conquistas' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-stone-500 dark:text-stone-400 font-medium'
          }`}
        >
          <UserCheck className="h-5 w-5" />
          <span className="text-[10px]">Mais</span>
        </button>
      </nav>
    </>
  );
};
