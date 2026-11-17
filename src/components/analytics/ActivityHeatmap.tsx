import React from 'react';
import { Calendar, Flame, Clock, Award } from 'lucide-react';
import { StudySession } from '../../types';

interface ActivityHeatmapProps {
  sessions: StudySession[];
  weeks?: number;
}

interface DayData {
  dateStr: string;
  minutes: number;
  sessionsCount: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ sessions, weeks = 14 }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Group minutes and count by dateStr
  const dataMap = new Map<string, { minutes: number; count: number }>();
  sessions.forEach((s) => {
    // normalise date (handles ISO or YYYY-MM-DD)
    const dStr = s.date.slice(0, 10);
    const existing = dataMap.get(dStr) || { minutes: 0, count: 0 };
    dataMap.set(dStr, {
      minutes: existing.minutes + s.durationMinutes,
      count: existing.count + 1,
    });
  });

  // Calculate grid starting from Sunday of (weeks - 1) weeks ago
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  startDate.setDate(startDate.getDate() - (weeks - 1) * 7);

  const weeksData: DayData[][] = [];
  const currentDate = new Date(startDate);

  for (let w = 0; w < weeks; w++) {
    const weekDays: DayData[] = [];
    for (let d = 0; d < 7; d++) {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const rec = dataMap.get(dateStr) || { minutes: 0, count: 0 };
      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (rec.minutes >= 150) level = 4;
      else if (rec.minutes >= 90) level = 3;
      else if (rec.minutes >= 45) level = 2;
      else if (rec.minutes > 0) level = 1;

      weekDays.push({
        dateStr,
        minutes: rec.minutes,
        sessionsCount: rec.count,
        level,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }
    weeksData.push(weekDays);
  }

  const allVisibleDays = weeksData.flat();
  const totalMinutes = allVisibleDays.reduce((acc, d) => acc + d.minutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const activeDays = allVisibleDays.filter((d) => d.minutes > 0).length;

  const levelColorMap = [
    'bg-stone-100 dark:bg-stone-800/80 border-stone-200/50 dark:border-stone-700/60',
    'bg-emerald-200 dark:bg-emerald-950/70 text-emerald-800 border-emerald-300 dark:border-emerald-800/60',
    'bg-emerald-400 dark:bg-emerald-700/80 text-white border-emerald-500',
    'bg-emerald-600 dark:bg-emerald-500 text-white border-emerald-600',
    'bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-700 shadow-xs',
  ];

  const dayLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs dark:border-stone-800 dark:bg-stone-900 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-extrabold tracking-tight text-stone-900 dark:text-stone-100">
              Mapa de Consistência (Estilo GitHub)
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
            Frequência e intensidade dos seus estudos nas últimas {weeks} semanas
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 dark:border-stone-700 dark:bg-stone-800">
            <span className="text-stone-500 dark:text-stone-400">Total: </span>
            <span className="font-extrabold text-stone-900 dark:text-stone-100">{totalHours}h</span>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 dark:border-emerald-900/50 dark:bg-emerald-950/40">
            <span className="text-emerald-700 dark:text-emerald-400">Dias Ativos: </span>
            <span className="font-extrabold text-emerald-800 dark:text-emerald-300">{activeDays}</span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto pb-2">
        <div className="inline-flex gap-1.5 min-w-[500px]">
          {/* Day of week labels */}
          <div className="flex flex-col gap-1.5 pr-2 pt-0.5 text-[10px] font-bold text-stone-400 dark:text-stone-500">
            {dayLabels.map((lbl, idx) => (
              <div key={idx} className="h-3.5 w-3 text-center flex items-center justify-center">
                {idx % 2 === 1 ? lbl : ''}
              </div>
            ))}
          </div>

          {/* Weeks columns */}
          {weeksData.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1.5">
              {week.map((day) => {
                const dateObj = new Date(`${day.dateStr}T12:00:00`);
                const formattedDate = dateObj.toLocaleDateString('pt-BR', {
                  day: 'numeric',
                  month: 'short',
                });
                return (
                  <div
                    key={day.dateStr}
                    title={`${formattedDate}: ${
                      day.minutes > 0 ? `${day.minutes} minutos estudados (${day.sessionsCount} sessões)` : 'Sem atividade'
                    }`}
                    className={`h-3.5 w-3.5 rounded-sm border cursor-pointer transition-transform hover:scale-125 ${
                      levelColorMap[day.level]
                    }`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3 text-xs text-stone-400 dark:border-stone-800/80 dark:text-stone-500">
        <div className="flex items-center gap-1.5 text-[11px]">
          <Flame className="h-3.5 w-3.5 text-amber-500" />
          <span>Consistência diária é a chave da aprovação</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px]">Menos</span>
          {levelColorMap.map((cls, idx) => (
            <div key={idx} className={`h-2.5 w-2.5 rounded-xs border ${cls}`} />
          ))}
          <span className="text-[11px]">Mais</span>
        </div>
      </div>
    </div>
  );
};
