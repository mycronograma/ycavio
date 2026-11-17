import React, { useEffect, useState } from 'react';
import { ProgressView } from './ProgressView';
import { ReviewsView } from '../reviews/ReviewsView';
import { AchievementsView } from '../gamification/AchievementsView';
import { useStudy } from '../../context/StudyContext';
import { getTodayStr } from '../../services/scheduleEngine';

export type ProgressSubTab = 'evolucao' | 'revisoes' | 'conquistas';

interface ProgressHubViewProps {
  initialSubTab?: ProgressSubTab;
  subTabSignal?: number;
  onNavigateToSubjects?: () => void;
}

export const ProgressHubView: React.FC<ProgressHubViewProps> = ({
  initialSubTab = 'evolucao',
  subTabSignal = 0,
  onNavigateToSubjects,
}) => {
  const { state } = useStudy();
  const [subTab, setSubTab] = useState<ProgressSubTab>(initialSubTab);

  useEffect(() => {
    setSubTab(initialSubTab);
  }, [initialSubTab, subTabSignal]);

  const todayStr = getTodayStr();
  const pendingReviewsCount = state.reviews.filter(
    (r) => r.dueDate <= todayStr && r.status === 'pendente'
  ).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-stone-200 bg-stone-100 p-1 text-xs font-bold dark:border-slate-800 dark:bg-[#0b1121]">
          <button
            type="button"
            onClick={() => setSubTab('evolucao')}
            className={`rounded-lg px-4 py-1.5 transition whitespace-nowrap shrink-0 ${
              subTab === 'evolucao'
                ? 'bg-white text-stone-900 shadow-2xs dark:bg-slate-800 dark:text-white'
                : 'text-stone-600 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Evolução &amp; Métricas
          </button>

          <button
            type="button"
            onClick={() => setSubTab('revisoes')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 transition whitespace-nowrap shrink-0 ${
              subTab === 'revisoes'
                ? 'bg-white text-stone-900 shadow-2xs dark:bg-slate-800 dark:text-white'
                : 'text-stone-600 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <span>Revisões Programadas</span>
            {pendingReviewsCount > 0 && (
              <span className="text-[11px] font-mono tabular-nums text-amber-600 dark:text-amber-400">
                ({pendingReviewsCount})
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSubTab('conquistas')}
            className={`rounded-lg px-4 py-1.5 transition whitespace-nowrap shrink-0 ${
              subTab === 'conquistas'
                ? 'bg-white text-stone-900 shadow-2xs dark:bg-slate-800 dark:text-white'
                : 'text-stone-600 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Níveis &amp; Conquistas
          </button>
        </div>
      </div>

      {subTab === 'evolucao' && <ProgressView />}
      {subTab === 'revisoes' && (
        <ReviewsView onNavigateToSubjects={onNavigateToSubjects} />
      )}
      {subTab === 'conquistas' && <AchievementsView />}
    </div>
  );
};
