import React from 'react';
import {
  Trophy,
  Award,
  Flame,
  Star,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  Target,
  RotateCw,
  Footprints,
  Lock,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { getLevelProgress } from '../../services/scheduleEngine';
import { Achievement } from '../../types';

export const AchievementsView: React.FC = () => {
  const { state } = useStudy();
  const { profile, achievements, dailyGoal } = state;

  const levelProgress = getLevelProgress(profile.xp);

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Footprints':
        return Footprints;
      case 'Flame':
        return Flame;
      case 'ShieldCheck':
        return ShieldCheck;
      case 'Clock':
        return Clock;
      case 'Award':
        return Award;
      case 'RotateCw':
        return RotateCw;
      case 'Target':
        return Target;
      default:
        return Trophy;
    }
  };

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-xs dark:border-stone-800 dark:bg-stone-900 transition-colors">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <span>Evolução, Níveis & Conquistas</span>
          </h2>
          <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
            Gamificação focada em consistência e retenção: ganhe XP e suba de patente
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-stone-600 dark:text-stone-300 bg-stone-50 dark:bg-stone-800 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700">
          <span>{unlockedCount} de {achievements.length} conquistas liberadas</span>
        </div>
      </div>

      {/* Main Level Progression Card */}
      <div className="rounded-2xl border border-indigo-200 bg-linear-to-br from-indigo-900 via-indigo-950 to-stone-900 p-6 sm:p-8 text-white shadow-md dark:border-indigo-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500 font-mono text-3xl font-extrabold text-white ring-4 ring-indigo-400/30 shadow-lg">
              {levelProgress.currentLevel}
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                Patente Atual
              </span>
              <h3 className="text-2xl font-black tracking-tight text-white">
                {levelProgress.title}
              </h3>
              <p className="text-xs text-indigo-200 mt-0.5">
                Total acumulado: <strong>{profile.xp} XP</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 backdrop-blur-xs border border-white/10">
              <Flame className="h-5 w-5 fill-amber-400 text-amber-400 animate-pulse" />
              <div>
                <span className="block text-xs font-bold text-white">
                  {profile.streakDays} Dias de Sequência
                </span>
                <span className="text-[10px] text-amber-200">Constância diária</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar to next level */}
        <div className="mt-6 pt-5 border-t border-white/10">
          <div className="flex justify-between text-xs font-bold mb-2 text-indigo-200">
            <span>Progresso para o Nível {levelProgress.currentLevel + 1}</span>
            <span>
              {levelProgress.currentLevelXP} / {levelProgress.nextLevelXP} XP ({levelProgress.percent}%)
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full bg-linear-to-r from-indigo-400 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${levelProgress.percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Daily & Weekly Challenges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Daily Goal Challenge */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs dark:border-stone-800 dark:bg-stone-900">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Target className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>Desafio Diário: Foco no Cronograma</span>
            </h4>
            <span className="rounded-md bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
              +50 XP Bônus
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Conclua as tarefas planejadas para hoje ({dailyGoal.completedTasks}/{dailyGoal.targetTasks} concluídas)
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all"
              style={{
                width: `${Math.min(
                  100,
                  (dailyGoal.completedTasks / Math.max(1, dailyGoal.targetTasks)) * 100
                )}%`,
              }}
            />
          </div>
        </div>

        {/* Spaced Review Challenge */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs dark:border-stone-800 dark:bg-stone-900">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <RotateCw className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Desafio: Fixação Ativa</span>
            </h4>
            <span className="rounded-md bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
              +40 XP por ciclo
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Realize suas revisões espaçadas programadas para manter a Curva de Ebbinghaus protegida
          </p>
          <div className="mt-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            {state.reviews.filter((r) => r.status === 'concluida').length} revisões fixadas no total
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs dark:border-stone-800 dark:bg-stone-900">
        <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-amber-500" />
          <span>Mural de Conquistas</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {achievements.map((ach) => {
            const Icon = getBadgeIcon(ach.icon);
            const isUnlocked = ach.unlocked;

            return (
              <div
                key={ach.id}
                className={`flex items-start gap-3.5 rounded-2xl border p-4 transition ${
                  isUnlocked
                    ? 'border-amber-200/80 bg-amber-50/30 dark:border-amber-900/50 dark:bg-amber-950/20'
                    : 'border-stone-200 bg-stone-50/60 opacity-60 dark:border-stone-800 dark:bg-stone-850'
                }`}
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                    isUnlocked
                      ? 'border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                      : 'border-stone-200 bg-stone-200 text-stone-400 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-500'
                  }`}
                >
                  {isUnlocked ? <Icon className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">{ach.title}</h4>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded-md shrink-0">
                      +{ach.xpReward} XP
                    </span>
                  </div>

                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-snug">
                    {ach.description}
                  </p>

                  {/* Progress indicator */}
                  <div className="mt-2.5">
                    <div className="flex justify-between text-[10px] text-stone-400 dark:text-stone-500 mb-0.5">
                      <span>{isUnlocked ? 'Concluída!' : 'Progresso'}</span>
                      <span>
                        {ach.progress} / {ach.maxProgress}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isUnlocked ? 'bg-amber-500' : 'bg-stone-400 dark:bg-stone-500'
                        }`}
                        style={{
                          width: `${Math.min(100, (ach.progress / ach.maxProgress) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
