import React, { useState, useEffect } from 'react';
import { Coffee, Timer, Brain, Sparkles } from 'lucide-react';
import { StudyMethodId } from '../../types';
import {
  STUDY_METHODS,
  FOCUS_PRESET_MINUTES,
  BREAK_PRESET_MINUTES,
  StudyMethodPreset,
  formatMethodProportionLabel,
} from '../../services/studyMethods';

interface StudyMethodSelectorProps {
  studyMethod: StudyMethodId;
  focusMinutes: number;
  breakMinutes: number;
  onChangeMethod: (methodId: StudyMethodId, preset: StudyMethodPreset) => void;
  onChangeFocusMinutes: (minutes: number) => void;
  onChangeBreakMinutes: (minutes: number) => void;
  darkSurface?: boolean;
}

export const StudyMethodSelector: React.FC<StudyMethodSelectorProps> = ({
  studyMethod,
  focusMinutes,
  breakMinutes,
  onChangeMethod,
  onChangeFocusMinutes,
  onChangeBreakMinutes,
  darkSurface = false,
}) => {
  const [focusInputStr, setFocusInputStr] = useState(String(focusMinutes));
  const [breakInputStr, setBreakInputStr] = useState(String(breakMinutes));

  useEffect(() => {
    setFocusInputStr(String(focusMinutes));
  }, [focusMinutes]);

  useEffect(() => {
    setBreakInputStr(String(breakMinutes));
  }, [breakMinutes]);

  const activePreset = STUDY_METHODS.find((m) => m.id === studyMethod) || STUDY_METHODS[0];
  const isCustomBreakPreset = !BREAK_PRESET_MINUTES.includes(breakMinutes);
  const isCustomFocusPreset = !FOCUS_PRESET_MINUTES.includes(focusMinutes);

  const labelClass = darkSurface
    ? 'block text-xs font-bold uppercase tracking-wider text-stone-400'
    : 'block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300';

  const helperClass = darkSurface
    ? 'text-[11px] text-stone-400'
    : 'text-[11px] text-stone-500 dark:text-stone-400';

  const inputClass = darkSurface
    ? 'w-20 rounded-xl border border-stone-700 bg-stone-900 px-2.5 py-1.5 text-center text-xs font-extrabold text-stone-100 tabular-nums outline-hidden focus:border-indigo-500'
    : 'w-20 rounded-xl border border-stone-300 bg-white px-2.5 py-1.5 text-center text-xs font-extrabold text-stone-900 tabular-nums outline-hidden focus:border-indigo-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:focus:border-indigo-400';

  const handleFocusInputChange = (raw: string) => {
    const clean = raw.replace(/\D/g, '').slice(0, 3);
    setFocusInputStr(clean);
    if (clean !== '') {
      const parsed = parseInt(clean, 10);
      if (!Number.isNaN(parsed) && parsed >= 10) {
        onChangeFocusMinutes(Math.min(240, parsed));
      }
    }
  };

  const handleFocusInputBlur = () => {
    const parsed = parseInt(focusInputStr, 10);
    const finalVal = Number.isNaN(parsed) ? focusMinutes : Math.min(240, Math.max(10, parsed));
    onChangeFocusMinutes(finalVal);
    setFocusInputStr(String(finalVal));
  };

  const handleBreakInputChange = (raw: string) => {
    const clean = raw.replace(/\D/g, '').slice(0, 2);
    setBreakInputStr(clean);
    if (clean !== '') {
      const parsed = parseInt(clean, 10);
      if (!Number.isNaN(parsed) && parsed >= 1) {
        onChangeBreakMinutes(Math.min(60, parsed));
      }
    }
  };

  const handleBreakInputBlur = () => {
    const parsed = parseInt(breakInputStr, 10);
    const finalVal = Number.isNaN(parsed) ? breakMinutes : Math.min(60, Math.max(1, parsed));
    onChangeBreakMinutes(finalVal);
    setBreakInputStr(String(finalVal));
  };

  return (
    <div className="space-y-5">
      {/* Study Method Picker */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <label className={`${labelClass} flex items-center gap-1.5`}>
            <Brain className="h-3.5 w-3.5 text-indigo-400" />
            <span>COMO VOCÊ GOSTA DE ESTUDAR? (MÉTODO)</span>
          </label>
          <span className="text-[11px] font-semibold text-indigo-500 dark:text-indigo-400">
            Ajusta foco, pausa e proporção teoria/questões
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {STUDY_METHODS.map((method) => {
            const isSelected = studyMethod === method.id;
            return (
              <button
                key={method.id}
                type="button"
                onClick={() => onChangeMethod(method.id, method)}
                className={`group rounded-2xl border p-3 text-left transition-all ${
                  isSelected
                    ? darkSurface
                      ? 'border-indigo-500 bg-indigo-950/50 ring-1 ring-indigo-500 text-stone-100'
                      : 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600 text-stone-900 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-stone-100'
                    : darkSurface
                    ? 'border-stone-700/80 bg-stone-800/40 text-stone-300 hover:border-stone-600'
                    : 'border-stone-200 bg-stone-50/60 text-stone-700 hover:border-stone-300 hover:bg-stone-100/70 dark:border-stone-800 dark:bg-stone-800/40 dark:text-stone-300 dark:hover:border-stone-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-xs font-extrabold ${
                      darkSurface
                        ? 'text-stone-100'
                        : 'text-stone-900 dark:text-stone-100'
                    }`}
                  >
                    {method.shortName}
                  </span>
                  <span
                    className={`shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold tabular-nums ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : darkSurface
                        ? 'bg-stone-800 text-stone-300'
                        : 'bg-white text-stone-600 border border-stone-200 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300'
                    }`}
                  >
                    {method.id === 'personalizado'
                      ? 'Livre'
                      : `${method.focusMinutes}m / ${method.breakMinutes}m`}
                  </span>
                </div>

                <p className={`mt-1 text-[11px] leading-snug ${helperClass}`}>
                  {method.shortDesc}
                </p>

                <div className="mt-2 flex items-center justify-between gap-2 text-[10px] font-bold">
                  <span className="text-indigo-500 dark:text-indigo-400">
                    {formatMethodProportionLabel(method)}
                  </span>
                  <span className={darkSurface ? 'text-stone-500' : 'text-stone-400 dark:text-stone-500'}>
                    {method.badge}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Method quick tip */}
        <div
          className={`mt-2.5 flex items-start gap-2 rounded-xl border px-3 py-2 text-[11px] ${
            darkSurface
              ? 'border-indigo-900/50 bg-indigo-950/25 text-indigo-200'
              : 'border-indigo-100 bg-indigo-50/50 text-indigo-900 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-200'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5 text-indigo-500 dark:text-indigo-400" />
          <span>
            <strong>Dica do método ({activePreset.shortName}):</strong> {activePreset.sessionTip}
          </span>
        </div>
      </div>

      {/* Focus & Break Duration Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Focus Block Duration */}
        <div
          className={`rounded-2xl border p-3.5 space-y-2.5 ${
            darkSurface
              ? 'border-stone-800 bg-stone-900/60'
              : 'border-stone-200 bg-stone-50/60 dark:border-stone-800 dark:bg-stone-800/30'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <label className={`${labelClass} flex items-center gap-1.5`}>
              <Timer className="h-3.5 w-3.5 text-indigo-400" />
              <span>DURAÇÃO DO BLOCO (FOCO)</span>
            </label>
            <span className="text-xs font-extrabold text-indigo-500 dark:text-indigo-400 tabular-nums">
              {focusMinutes} min
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {FOCUS_PRESET_MINUTES.map((mins) => {
              const selected = focusMinutes === mins;
              return (
                <button
                  key={mins}
                  type="button"
                  onClick={() => onChangeFocusMinutes(mins)}
                  className={`rounded-xl px-2.5 py-1.5 text-xs font-bold tabular-nums transition ${
                    selected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : darkSurface
                      ? 'border border-stone-700 bg-stone-800/70 text-stone-300 hover:bg-stone-800'
                      : 'border border-stone-200 bg-white text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300'
                  }`}
                >
                  {mins}m
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <span className={helperClass}>
              {isCustomFocusPreset ? 'Tempo livre ativo:' : 'Ou digite em minutos:'}
            </span>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                inputMode="numeric"
                value={focusInputStr}
                aria-label="Duração do bloco de foco em minutos"
                onChange={(e) => handleFocusInputChange(e.target.value)}
                onBlur={handleFocusInputBlur}
                className={inputClass}
              />
              <span className={helperClass}>min</span>
            </div>
          </div>
        </div>

        {/* Break Duration (5-20 min presets + free input) */}
        <div
          className={`rounded-2xl border p-3.5 space-y-2.5 ${
            darkSurface
              ? 'border-stone-800 bg-stone-900/60'
              : 'border-stone-200 bg-stone-50/60 dark:border-stone-800 dark:bg-stone-800/30'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <label className={`${labelClass} flex items-center gap-1.5`}>
              <Coffee className="h-3.5 w-3.5 text-emerald-400" />
              <span>DURAÇÃO DO INTERVALO</span>
            </label>
            <span className="text-xs font-extrabold text-emerald-500 dark:text-emerald-400 tabular-nums">
              {breakMinutes} min
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {BREAK_PRESET_MINUTES.map((mins) => {
              const selected = breakMinutes === mins;
              return (
                <button
                  key={mins}
                  type="button"
                  onClick={() => onChangeBreakMinutes(mins)}
                  className={`rounded-xl py-1.5 text-xs font-bold tabular-nums transition ${
                    selected
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : darkSurface
                      ? 'border border-stone-700 bg-stone-800/70 text-stone-300 hover:bg-stone-800'
                      : 'border border-stone-200 bg-white text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300'
                  }`}
                >
                  {mins} min
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <span className={helperClass}>
              {isCustomBreakPreset ? 'Intervalo livre ativo:' : 'Campo livre (min):'}
            </span>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                inputMode="numeric"
                value={breakInputStr}
                aria-label="Duração do intervalo em minutos"
                onChange={(e) => handleBreakInputChange(e.target.value)}
                onBlur={handleBreakInputBlur}
                className={inputClass}
              />
              <span className={helperClass}>min</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
