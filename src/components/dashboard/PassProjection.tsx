import React, { useMemo } from 'react';
import { Target, TrendingUp, AlertTriangle, CheckCircle2, CalendarClock } from 'lucide-react';
import { UserProfile } from '../../types';

interface PassProjectionProps {
  profile: UserProfile;
  totalStudiedMinutes: number;
}

export const PassProjection: React.FC<PassProjectionProps> = ({
  profile,
  totalStudiedMinutes,
}) => {
  const { examDate, targetTotalHours, dailyAvailableMinutes, availableDays } = profile;

  const reading = useMemo(() => {
    const studiedHours = totalStudiedMinutes / 60;

    // Calculate days remaining
    let daysRemaining = 0;
    if (examDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(`${examDate}T00:00:00`);
      const diffMs = target.getTime() - today.getTime();
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    const activeDays = availableDays.length > 0 ? availableDays : [1, 2, 3, 4, 5];
    const weeklyAvailableMinutes = activeDays.reduce(
      (sum, d) => sum + (profile.dailyMinutesByDay?.[d] ?? dailyAvailableMinutes),
      0
    );
    const weeklyAvailableHours = weeklyAvailableMinutes / 60;

    // If targetTotalHours is configured (or estimated from examDate)
    const targetHours = targetTotalHours || (examDate ? Math.round(daysRemaining * 2.5) : 200);

    let projectedCoveredHours = 0;
    if (daysRemaining > 0) {
      const weeksLeft = daysRemaining / 7;
      projectedCoveredHours = studiedHours + weeksLeft * weeklyAvailableHours;
    } else {
      // no date, project next 12 weeks
      projectedCoveredHours = studiedHours + 12 * weeklyAvailableHours;
    }

    const deficit = targetHours - projectedCoveredHours;

    let verdict: 'viavel' | 'apertado' | 'inviavel' = 'viavel';
    let title = '';
    let explanation = '';

    if (deficit > 10) {
      verdict = 'inviavel';
      const extraPerDayMinutes = Math.round((deficit / Math.max(1, daysRemaining)) * 60);
      title = `No ritmo atual faltam cerca de ${Math.round(deficit)}h de estudo`;
      explanation = `Seu ritmo planejado cobre ${Math.round(projectedCoveredHours)}h até a meta. Recomenda-se aumentar cerca de ${extraPerDayMinutes}m por dia de estudo.`;
    } else if (deficit > -20 && deficit <= 10) {
      verdict = 'apertado';
      title = `Meta viável, porém com pouca margem (${Math.round(Math.abs(deficit))}h de folga)`;
      explanation = 'Evite perder dias ou acumular tarefas para não comprometer a revisão final.';
    } else {
      verdict = 'viavel';
      title = `No ritmo atual você atinge a meta com folga!`;
      explanation = `Você acumulará cerca de ${Math.round(projectedCoveredHours)}h contra ${targetHours}h necessárias. Excelente consistência!`;
    }

    const percent = Math.min(100, Math.round((studiedHours / targetHours) * 100));

    return {
      verdict,
      daysRemaining,
      targetHours,
      studiedHours,
      percent,
      title,
      explanation,
    };
  }, [examDate, targetTotalHours, dailyAvailableMinutes, availableDays, totalStudiedMinutes]);

  const config = {
    viavel: {
      border: 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/50 dark:bg-emerald-950/30',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      textColor: 'text-emerald-900 dark:text-emerald-200',
    },
    apertado: {
      border: 'border-amber-200 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/30',
      icon: AlertTriangle,
      iconColor: 'text-amber-600 dark:text-amber-400',
      textColor: 'text-amber-900 dark:text-amber-200',
    },
    inviavel: {
      border: 'border-rose-200 bg-rose-50/70 dark:border-rose-900/50 dark:bg-rose-950/30',
      icon: AlertTriangle,
      iconColor: 'text-rose-600 dark:text-rose-400',
      textColor: 'text-rose-900 dark:text-rose-200',
    },
  }[reading.verdict];

  const Icon = config.icon;

  return (
    <div className={`rounded-2xl border p-5 shadow-xs transition-colors ${config.border}`}>
      <div className="flex items-start gap-3.5">
        <div className={`mt-0.5 rounded-xl bg-white p-2 shadow-xs dark:bg-stone-900 ${config.iconColor}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Projeção de Ritmo & Aprovação
            </h4>
            {reading.daysRemaining > 0 && (
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-extrabold text-stone-700 shadow-xs dark:bg-stone-800 dark:text-stone-300">
                {reading.daysRemaining} dias restantes
              </span>
            )}
          </div>

          <p className={`mt-1 text-sm font-bold ${config.textColor}`}>
            {reading.title}
          </p>
          <p className="mt-0.5 text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
            {reading.explanation}
          </p>

          {/* Progress to Target Hours */}
          <div className="mt-3.5 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-stone-600 dark:text-stone-400">
              <span className="flex items-center gap-1">
                <Target className="h-3 w-3 text-indigo-500" />
                Meta de Horas
              </span>
              <span>
                {reading.studiedHours.toFixed(1)}h de {reading.targetHours}h ({reading.percent}%)
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200/80 dark:bg-stone-800">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                style={{ width: `${reading.percent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
