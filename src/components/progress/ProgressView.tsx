import React from 'react';
import {
  BarChart3,
  Clock,
  CheckCircle2,
  Flame,
  Target,
  TrendingUp,
  AlertTriangle,
  Award,
  Calendar,
  Check,
  Zap,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { getTodayStr, getLevelProgress } from '../../services/scheduleEngine';

export const ProgressView: React.FC = () => {
  const { state } = useStudy();
  const { subjects, sessions, profile, tasks } = state;

  const totalMinutesStudied = subjects.reduce((acc, s) => acc + s.totalMinutesStudied, 0);
  const totalHours = (totalMinutesStudied / 60).toFixed(1);

  const completedTasksCount = tasks.filter((t) => t.status === 'concluida').length;

  const totalExercisesDone = subjects.reduce((acc, s) => acc + s.totalExercisesDone, 0);
  const totalExercisesCorrect = subjects.reduce((acc, s) => acc + s.totalExercisesCorrect, 0);
  const overallAccuracy =
    totalExercisesDone > 0
      ? Math.round((totalExercisesCorrect / totalExercisesDone) * 100)
      : null;

  const levelProgress = getLevelProgress(profile.xp);

  // Group study minutes by day for the last 7 days
  const today = new Date();
  const last7Days = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - idx));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const dayLabel = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');

    const dayMinutes = sessions
      .filter((s) => s.date === dateStr)
      .reduce((acc, s) => acc + s.durationMinutes, 0);

    return {
      dateStr,
      dayLabel,
      minutes: dayMinutes,
    };
  });

  const maxDailyMinutes = Math.max(60, ...last7Days.map((d) => d.minutes));

  // Identify subjects with best vs needs-attention performance
  const subjectsWithData = subjects.filter((s) => s.totalExercisesDone > 0 || s.totalMinutesStudied > 0);

  const sortedByAccuracy = [...subjectsWithData].sort((a, b) => {
    const accA = a.totalExercisesDone > 0 ? a.totalExercisesCorrect / a.totalExercisesDone : 0.5;
    const accB = b.totalExercisesDone > 0 ? b.totalExercisesCorrect / b.totalExercisesDone : 0.5;
    return accB - accA;
  });

  const bestSubjects = sortedByAccuracy.slice(0, 2);
  const attentionSubjects = [...sortedByAccuracy].reverse().slice(0, 2);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-xs dark:border-stone-800 dark:bg-stone-900 transition-colors">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <span>Métricas & Evolução de Estudos</span>
          </h2>
          <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
            Acompanhe a constância da sua rotina, taxa de acertos e matérias que demandam reforço
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-bold text-stone-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300">
            Nível {levelProgress.currentLevel} • {levelProgress.title}
          </span>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 shadow-xs dark:border-stone-800 dark:bg-stone-900">
          <div className="flex items-center gap-2 text-stone-400 dark:text-stone-500 text-xs font-bold uppercase tracking-wider">
            <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>Horas Dedicadas</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-black text-stone-900 dark:text-stone-100">{totalHours}h</span>
            <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">líquidas</span>
          </div>
          <span className="mt-1 block text-xs text-stone-400 dark:text-stone-500">
            {totalMinutesStudied} minutos totais
          </span>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 shadow-xs dark:border-stone-800 dark:bg-stone-900">
          <div className="flex items-center gap-2 text-stone-400 dark:text-stone-500 text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Blocos Concluídos</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-black text-stone-900 dark:text-stone-100">{completedTasksCount}</span>
            <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">tarefas</span>
          </div>
          <span className="mt-1 block text-xs text-stone-400 dark:text-stone-500">
            No cronograma inteligente
          </span>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 shadow-xs dark:border-stone-800 dark:bg-stone-900">
          <div className="flex items-center gap-2 text-stone-400 dark:text-stone-500 text-xs font-bold uppercase tracking-wider">
            <Target className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span>Precisão Média</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-black text-stone-900 dark:text-stone-100">
              {overallAccuracy !== null ? `${overallAccuracy}%` : '—'}
            </span>
          </div>
          <span className="mt-1 block text-xs text-stone-400 dark:text-stone-500">
            {totalExercisesCorrect} acertos de {totalExercisesDone} questões
          </span>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 shadow-xs dark:border-stone-800 dark:bg-stone-900">
          <div className="flex items-center gap-2 text-stone-400 dark:text-stone-500 text-xs font-bold uppercase tracking-wider">
            <Flame className="h-4 w-4 fill-amber-500 text-amber-500" />
            <span>Sequência Ativa</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-black text-stone-900 dark:text-stone-100">{profile.streakDays}</span>
            <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">dias seguidos</span>
          </div>
          <span className="mt-1 block text-xs text-stone-400 dark:text-stone-500">
            Hábito e disciplina
          </span>
        </div>
      </div>

      {/* Main Graph & Radar Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Study time chart (Last 7 Days) */}
        <div className="lg:col-span-2 rounded-2xl border border-stone-200 bg-white p-6 shadow-xs flex flex-col justify-between dark:border-stone-800 dark:bg-stone-900">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>Horas de Estudo nos Últimos 7 Dias</span>
              </h3>
              <span className="text-xs font-semibold text-stone-400 dark:text-stone-500">Minutos / Dia</span>
            </div>
            <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
              Visualização da consistência ao longo da semana
            </p>
          </div>

          {/* Bar Chart Visualization */}
          <div className="mt-6 flex items-end justify-between gap-3 h-48 pt-4 border-b border-stone-100 dark:border-stone-800">
            {last7Days.map((d, i) => {
              const heightPercent = maxDailyMinutes > 0 ? (d.minutes / maxDailyMinutes) * 100 : 0;
              const hasActivity = d.minutes > 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400">
                    {hasActivity ? `${d.minutes}m` : '0m'}
                  </span>
                  <div className="w-full max-w-[36px] bg-stone-100 dark:bg-stone-800 rounded-t-lg overflow-hidden flex flex-col justify-end h-full">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        hasActivity
                          ? 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400'
                          : 'bg-stone-200 dark:bg-stone-700'
                      }`}
                      style={{ height: `${Math.max(hasActivity ? 10 : 4, heightPercent)}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-bold uppercase text-stone-600 dark:text-stone-400 capitalize">
                    {d.dayLabel}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 pt-2">
            <span>Meta recomendada: <strong>{profile.dailyAvailableMinutes}m por dia</strong></span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-indigo-600 dark:bg-indigo-500" />
              Tempo Realizado
            </span>
          </div>
        </div>

        {/* RADAR DE ATENÇÃO: Melhores vs Precisam de Atenção */}
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs flex flex-col justify-between dark:border-stone-800 dark:bg-stone-900">
          <div>
            <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <span>Radar de Atenção</span>
            </h3>
            <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
              Classificação inteligente por taxa de retenção
            </p>
          </div>

          <div className="my-4 space-y-4">
            {/* Top performing */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block mb-2 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                Matérias com Maior Domínio
              </span>
              {bestSubjects.length === 0 ? (
                <p className="text-xs text-stone-400 dark:text-stone-500">Cadastre e conclua exercícios para ver o radar.</p>
              ) : (
                <div className="space-y-2">
                  {bestSubjects.map((s) => {
                    const acc =
                      s.totalExercisesDone > 0
                        ? Math.round((s.totalExercisesCorrect / s.totalExercisesDone) * 100)
                        : 100;
                    return (
                      <div
                        key={s.id}
                        className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/50 p-2.5 text-xs dark:border-emerald-900/40 dark:bg-emerald-950/20"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: s.color }}
                          />
                          <span className="font-bold text-stone-800 dark:text-stone-200 truncate max-w-[140px]">
                            {s.name}
                          </span>
                        </div>
                        <span className="font-extrabold text-emerald-700 dark:text-emerald-400">{acc}% acertos</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Needs attention */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 block mb-2 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                Matérias que Precisam de Foco
              </span>
              {attentionSubjects.length === 0 ? (
                <p className="text-xs text-stone-400 dark:text-stone-500">Nenhum alerta crítico no momento.</p>
              ) : (
                <div className="space-y-2">
                  {attentionSubjects.map((s) => {
                    const acc =
                      s.totalExercisesDone > 0
                        ? Math.round((s.totalExercisesCorrect / s.totalExercisesDone) * 100)
                        : 0;
                    return (
                      <div
                        key={s.id}
                        className="flex items-center justify-between rounded-xl border border-rose-100 bg-rose-50/50 p-2.5 text-xs dark:border-rose-900/40 dark:bg-rose-950/20"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: s.color }}
                          />
                          <span className="font-bold text-stone-800 dark:text-stone-200 truncate max-w-[140px]">
                            {s.name}
                          </span>
                        </div>
                        <span className="font-extrabold text-rose-700 dark:text-rose-400">
                          {s.totalExercisesDone > 0 ? `${acc}% acertos` : 'Pouco praticada'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-stone-50 dark:bg-stone-800/60 p-3 text-[11px] text-stone-600 dark:text-stone-400 border border-stone-100 dark:border-stone-800">
            💡 O cronograma automático injeta mais blocos de questões nas matérias com taxa de acerto inferior.
          </div>
        </div>
      </div>

      {/* Recent study session logs */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs dark:border-stone-800 dark:bg-stone-900">
        <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-stone-500 dark:text-stone-400" />
          <span>Histórico Recente de Sessões</span>
        </h3>

        {sessions.length === 0 ? (
          <div className="text-center py-8 text-stone-400 dark:text-stone-500 text-xs">
            Nenhuma sessão registrada ainda. Conclua tarefas para preencher seu histórico.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-stone-200 dark:border-stone-800 text-stone-400 dark:text-stone-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="pb-2">Data</th>
                  <th className="pb-2">Matéria & Tópico</th>
                  <th className="pb-2">Duração</th>
                  <th className="pb-2">Exercícios</th>
                  <th className="pb-2 text-right">Recompensa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-stone-700 dark:text-stone-300">
                {sessions.slice(0, 10).map((sess) => (
                  <tr key={sess.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                    <td className="py-3 font-mono text-stone-500 dark:text-stone-400">{sess.date}</td>
                    <td className="py-3">
                      <div className="font-bold text-stone-900 dark:text-stone-100">{sess.subjectName}</div>
                      <div className="text-stone-500 dark:text-stone-400 text-[11px]">{sess.topicName}</div>
                    </td>
                    <td className="py-3 font-semibold text-stone-800 dark:text-stone-200">{sess.durationMinutes} min</td>
                    <td className="py-3">
                      {sess.exercisesDone > 0 ? (
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                          {sess.exercisesCorrect}/{sess.exercisesDone} acertos
                        </span>
                      ) : (
                        <span className="text-stone-400 dark:text-stone-500">Teoria / Leitura</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <span className="inline-block rounded-md bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 font-extrabold text-emerald-700 dark:text-emerald-400">
                        +{sess.xpEarned} XP
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
