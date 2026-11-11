import React, { useState } from 'react';
import {
  RotateCw,
  CheckCircle2,
  Clock,
  Calendar,
  Sparkles,
  AlertCircle,
  Check,
  Award,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { getTodayStr } from '../../services/scheduleEngine';
import { SpacedReview } from '../../types';

export const ReviewsView: React.FC = () => {
  const { state, completeSpacedReview } = useStudy();
  const { reviews } = state;

  const todayStr = getTodayStr();
  const [filterTab, setFilterTab] = useState<'hoje' | 'proximas' | 'concluidas'>('hoje');

  // Categorize reviews
  const dueTodayReviews = reviews.filter((r) => r.dueDate <= todayStr && r.status === 'pendente');
  const futureReviews = reviews.filter((r) => r.dueDate > todayStr && r.status === 'pendente');
  const completedReviews = reviews.filter((r) => r.status === 'concluida');

  const displayedReviews =
    filterTab === 'hoje'
      ? dueTodayReviews
      : filterTab === 'proximas'
      ? futureReviews
      : completedReviews;

  // Active review grading modal
  const [activeReviewToGrade, setActiveReviewToGrade] = useState<SpacedReview | null>(null);

  const handleGrade = (rating: 'facil' | 'medio' | 'dificil') => {
    if (!activeReviewToGrade) return;
    completeSpacedReview(activeReviewToGrade.id, rating);
    setActiveReviewToGrade(null);
  };

  const getStepBadge = (step: number) => {
    switch (step) {
      case 1:
        return { label: 'D+1 (24h)', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300' };
      case 2:
        return { label: 'D+7 (1 semana)', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' };
      case 3:
        return { label: 'D+15 (2 semanas)', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' };
      default:
        return { label: 'D+30 (1 mês)', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' };
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-xs dark:border-stone-800 dark:bg-stone-900 transition-colors">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <RotateCw className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <span>Revisão Inteligente & Repetição Espaçada</span>
          </h2>
          <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
            Fixação ativa baseada na Curva do Esquecimento de Ebbinghaus (D+1, D+7, D+15, D+30)
          </p>
        </div>

        {/* Tab pills */}
        <div className="flex rounded-xl border border-stone-200 bg-stone-100 p-1 text-xs font-semibold dark:border-stone-800 dark:bg-stone-800/80">
          <button
            onClick={() => setFilterTab('hoje')}
            className={`rounded-lg px-3 py-1.5 transition ${
              filterTab === 'hoje'
                ? 'bg-white text-indigo-900 shadow-xs font-bold dark:bg-stone-900 dark:text-indigo-300'
                : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200'
            }`}
          >
            Para Hoje ({dueTodayReviews.length})
          </button>
          <button
            onClick={() => setFilterTab('proximas')}
            className={`rounded-lg px-3 py-1.5 transition ${
              filterTab === 'proximas'
                ? 'bg-white text-indigo-900 shadow-xs font-bold dark:bg-stone-900 dark:text-indigo-300'
                : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200'
            }`}
          >
            Próximas ({futureReviews.length})
          </button>
          <button
            onClick={() => setFilterTab('concluidas')}
            className={`rounded-lg px-3 py-1.5 transition ${
              filterTab === 'concluidas'
                ? 'bg-white text-indigo-900 shadow-xs font-bold dark:bg-stone-900 dark:text-indigo-300'
                : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200'
            }`}
          >
            Concluídas ({completedReviews.length})
          </button>
        </div>
      </div>

      {/* Info callout */}
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs text-indigo-950 dark:text-indigo-200">
            <span className="font-bold block text-indigo-900 dark:text-indigo-300">
              Como funciona a Repetição Espaçada no Trilha:
            </span>
            Sempre que você conclui uma sessão de estudos, o sistema gera ciclos automáticos de revisão.
            Revisar nos momentos certos interrompe o esquecimento e transfere os conceitos da memória recente para a memória permanente.
          </div>
        </div>
      </div>

      {/* Reviews list */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs dark:border-stone-800 dark:bg-stone-900">
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3 mb-4">
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 capitalize">
            {filterTab === 'hoje'
              ? 'Revisões Prontas para Fixação'
              : filterTab === 'proximas'
              ? 'Próximas Revisões no Calendário'
              : 'Histórico de Revisões Realizadas'}
          </h3>
          <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
            {displayedReviews.length} {displayedReviews.length === 1 ? 'item' : 'itens'}
          </span>
        </div>

        {displayedReviews.length === 0 ? (
          <div className="text-center py-12 text-stone-400 dark:text-stone-500 text-sm">
            {filterTab === 'hoje'
              ? '🎉 Nenhuma revisão pendente para hoje! Sua memória está em dia.'
              : filterTab === 'proximas'
              ? 'Nenhuma revisão futura agendada ainda. Conclua tarefas para alimentar o sistema.'
              : 'Nenhuma revisão concluída registrada.'}
          </div>
        ) : (
          <div className="space-y-3">
            {displayedReviews.map((rev) => {
              const badge = getStepBadge(rev.step);
              const isOverdue = rev.dueDate < todayStr && rev.status === 'pendente';

              return (
                <div
                  key={rev.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-stone-200 bg-white p-4 hover:border-indigo-300 dark:border-stone-800 dark:bg-stone-900/90 dark:hover:border-indigo-700 transition"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-1 h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: rev.subjectColor }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                          {rev.subjectName}
                        </span>
                        <span className={`rounded-md px-2 py-0.2 text-[10px] font-bold ${badge.color}`}>
                          {badge.label}
                        </span>
                        {isOverdue && (
                          <span className="rounded-md bg-rose-100 px-1.5 py-0.2 text-[10px] font-bold text-rose-800 dark:bg-rose-950/70 dark:text-rose-300">
                            Atrasada
                          </span>
                        )}
                      </div>

                      <h4 className="mt-0.5 text-base font-bold text-stone-900 dark:text-stone-100">
                        {rev.topicName}
                      </h4>

                      <div className="mt-1 flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-stone-400 dark:text-stone-500" />
                          Agendado: <strong>{rev.dueDate}</strong>
                        </span>
                        <span>•</span>
                        <span>Estudado originalmente em {rev.lastStudiedDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="self-end sm:self-center">
                    {rev.status === 'concluida' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg">
                        <CheckCircle2 className="h-4 w-4" />
                        Revisado
                      </span>
                    ) : (
                      <button
                        onClick={() => setActiveReviewToGrade(rev)}
                        className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 active:scale-95 transition-all"
                      >
                        <RotateCw className="h-3.5 w-3.5" />
                        <span>Fazer Revisão</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Grade Review Modal */}
      {activeReviewToGrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-stone-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl text-center dark:border-stone-800 dark:bg-stone-900">
            <h3 className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
              Registrar Revisão
            </h3>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              {activeReviewToGrade.subjectName} • <strong>{activeReviewToGrade.topicName}</strong>
            </p>

            <p className="mt-4 text-sm text-stone-700 dark:text-stone-300">
              Como foi sua lembrança e retenção deste conteúdo?
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleGrade('dificil')}
                className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-left transition"
              >
                <span className="block text-xs font-bold text-rose-800 dark:text-rose-300">Difícil</span>
                <span className="text-[10px] text-stone-500 dark:text-stone-400 mt-1 block">Esqueci detalhes. Reagendar para amanhã.</span>
              </button>

              <button
                type="button"
                onClick={() => handleGrade('medio')}
                className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-left transition"
              >
                <span className="block text-xs font-bold text-amber-800 dark:text-amber-300">Médio</span>
                <span className="text-[10px] text-stone-500 dark:text-stone-400 mt-1 block">Lembrei do principal com algum esforço.</span>
              </button>

              <button
                type="button"
                onClick={() => handleGrade('facil')}
                className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-left transition"
              >
                <span className="block text-xs font-bold text-emerald-800 dark:text-emerald-300">Fácil</span>
                <span className="text-[10px] text-stone-500 dark:text-stone-400 mt-1 block">Conteúdo dominado. Ampliar intervalo.</span>
              </button>
            </div>

            <div className="mt-5">
              <button
                onClick={() => setActiveReviewToGrade(null)}
                className="text-xs font-semibold text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
