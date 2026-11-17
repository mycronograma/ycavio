import React, { useState } from 'react';
import {
  GraduationCap,
  Stethoscope,
  Scale,
  Sparkles,
  BookOpen,
  Code2,
  Clock,
  Layers,
  ArrowRight,
  ListChecks,
} from 'lucide-react';
import { STUDY_PRESETS, PresetGoal } from '../../services/storageService';

export type WeeklyLoadLevel = 'leve' | 'normal' | 'intensivo';

interface PresetSelectorProps {
  initialLoad?: WeeklyLoadLevel;
  existingSubjectsCount: number;
  onSelectPreset: (presetId: string, weeklyLoad: WeeklyLoadLevel) => void;
  onBackToMySubjects?: () => void;
}

const LOAD_OPTIONS: Array<{
  id: WeeklyLoadLevel;
  label: string;
  subtitle: string;
}> = [
  { id: 'leve', label: 'Leve', subtitle: 'trabalha e estuda' },
  { id: 'normal', label: 'Normal', subtitle: 'meio período' },
  { id: 'intensivo', label: 'Intensivo', subtitle: 'dedicação total' },
];

function getPresetVisual(presetId: string) {
  switch (presetId) {
    case 'enem':
      return {
        icon: GraduationCap,
        iconBg: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400',
      };
    case 'medicina':
      return {
        icon: Stethoscope,
        iconBg: 'bg-rose-100 text-rose-600 dark:bg-rose-950/70 dark:text-rose-400',
      };
    case 'concurso_geral':
      return {
        icon: Scale,
        iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-950/70 dark:text-amber-400',
      };
    case 'personalizado':
      return {
        icon: Sparkles,
        iconBg: 'bg-teal-100 text-teal-600 dark:bg-teal-950/70 dark:text-teal-400',
      };
    case 'oab':
      return {
        icon: BookOpen,
        iconBg: 'bg-sky-100 text-sky-600 dark:bg-sky-950/70 dark:text-sky-400',
      };
    default:
      return {
        icon: Code2,
        iconBg: 'bg-violet-100 text-violet-600 dark:bg-violet-950/70 dark:text-violet-400',
      };
  }
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  initialLoad = 'leve',
  existingSubjectsCount,
  onSelectPreset,
  onBackToMySubjects,
}) => {
  const [weeklyLoad, setWeeklyLoad] = useState<WeeklyLoadLevel>(initialLoad);

  const loadLabel =
    weeklyLoad === 'leve' ? 'Leve' : weeklyLoad === 'normal' ? 'Normal' : 'Intensivo';

  return (
    <div className="space-y-6 pb-12">
      {/* Top Instructional Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Escolha um modelo para começar. As horas exibidas são referências iniciais, não sua agenda final.
        </p>

        {existingSubjectsCount > 0 && onBackToMySubjects && (
          <button
            type="button"
            onClick={onBackToMySubjects}
            className="inline-flex items-center gap-2 self-start sm:self-auto rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-bold text-stone-700 hover:bg-stone-100 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800 transition whitespace-nowrap shrink-0"
          >
            <ListChecks className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>Ver Minhas Matérias ({existingSubjectsCount})</span>
          </button>
        )}
      </div>

      {/* Carga de Partida Selector Card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900/90">
        <div>
          <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
            Carga de partida
          </h2>
          <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
            Escolha sua rotina antes de comparar as horas sugeridas.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
          {LOAD_OPTIONS.map((opt) => {
            const isActive = weeklyLoad === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setWeeklyLoad(opt.id)}
                className={`rounded-xl border px-4 py-2.5 text-left transition ${
                  isActive
                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 ring-1 ring-indigo-600/30 dark:border-sky-500 dark:bg-sky-950/50 dark:text-stone-100 dark:ring-sky-500/30'
                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-300 hover:bg-stone-100 dark:border-stone-800 dark:bg-stone-950/60 dark:text-stone-300 dark:hover:border-stone-700'
                }`}
              >
                <span className="block text-xs sm:text-sm font-bold">{opt.label}</span>
                <span className="block text-[11px] text-stone-500 dark:text-stone-400 whitespace-nowrap">
                  {opt.subtitle}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Presets 2-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {STUDY_PRESETS.map((preset: PresetGoal) => {
          const visual = getPresetVisual(preset.id);
          const Icon = visual.icon;
          const isCustom = preset.id === 'personalizado';
          const weeklyHoursText = preset.weeklyHoursByLoad[weeklyLoad];

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(preset.id, weeklyLoad)}
              className="group flex items-start gap-4 rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 text-left transition hover:border-indigo-400 hover:bg-stone-50/70 dark:border-stone-800 dark:bg-stone-900/80 dark:hover:border-sky-500/60 dark:hover:bg-stone-900"
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${visual.iconBg}`}
              >
                <Icon className="h-6 w-6" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100 group-hover:text-indigo-600 dark:group-hover:text-sky-400 transition">
                    {preset.name}
                  </h3>
                  <ArrowRight className="h-4 w-4 text-stone-300 group-hover:text-indigo-600 dark:text-stone-600 dark:group-hover:text-sky-400 transition-transform group-hover:translate-x-0.5 shrink-0" />
                </div>

                <p className="mt-1 text-xs leading-relaxed text-stone-600 dark:text-stone-400">
                  {preset.description}
                </p>

                {!isCustom && (
                  <div className="mt-3.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-stone-500 dark:text-stone-400 tabular-nums">
                    <span className="inline-flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-sky-500" />
                      <span>{preset.subjects.length} obrigatórias</span>
                    </span>
                    {preset.modules && preset.modules.length > 0 && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">
                          {preset.modules.reduce((acc, m) => acc + m.subjects.length, 0)} opcionais ({preset.modules.length} módulos)
                        </span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-emerald-500" />
                      <span>
                        {weeklyHoursText} na carga {loadLabel}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Suggestion Info Box */}
      <div className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 dark:border-stone-800 dark:bg-stone-900/70">
        <Sparkles className="h-4 w-4 text-sky-500 shrink-0 mt-0.5" />
        <div className="text-xs">
          <p className="font-bold text-stone-900 dark:text-stone-100">
            As predefinições são apenas sugestões
          </p>
          <p className="mt-0.5 text-stone-600 dark:text-stone-400 leading-relaxed">
            Você pode personalizar disciplinas, prioridades e horas depois de importar. O cronograma automático usa esses pesos para distribuir o tempo.
          </p>
        </div>
      </div>
    </div>
  );
};
