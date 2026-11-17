import React, { useState } from 'react';
import { X, Clock, Plus, Trash2, Shield, Check, AlertCircle } from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { FixedCommitment } from '../../types';
import { calculateCommittedMinutesForDay } from '../../services/scheduleEngine';

interface FixedScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WEEKDAYS = [
  { day: 0, label: 'Domingo' },
  { day: 1, label: 'Segunda-feira' },
  { day: 2, label: 'Terça-feira' },
  { day: 3, label: 'Quarta-feira' },
  { day: 4, label: 'Quinta-feira' },
  { day: 5, label: 'Sexta-feira' },
  { day: 6, label: 'Sábado' },
];

const PRESET_LABELS = [
  'Trabalho / Expediente',
  'Faculdade / Pós-graduação',
  'Academia / Treino',
  'Almoço / Refeição',
  'Sono / Descanso obrigatório',
  'Compromisso Familiar',
];

function formatMinsHM(totalMins: number): string {
  const safe = Math.max(0, Math.round(totalMins));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export const FixedScheduleModal: React.FC<FixedScheduleModalProps> = ({ isOpen, onClose }) => {
  const { state, saveFixedCommitments, recalculateSchedule } = useStudy();
  const commitments = state.fixedCommitments || [];
  const { profile } = state;

  const [activeDay, setActiveDay] = useState(1); // default Monday
  const [newLabel, setNewLabel] = useState('Trabalho / Expediente');
  const [newStart, setNewStart] = useState('08:00');
  const [newEnd, setNewEnd] = useState('17:00');
  const [saveFeedback, setSaveFeedback] = useState(false);

  if (!isOpen) return null;

  const dayCommitments = commitments.filter((c) => c.day === activeDay);
  const blockedMinutesToday = calculateCommittedMinutesForDay(commitments, activeDay);
  const freeAwakeMinutesToday = Math.max(0, 16 * 60 - blockedMinutesToday);
  const plannedStudyMinutesToday = profile.availableDays.includes(activeDay)
    ? (profile.dailyMinutesByDay?.[activeDay] ?? profile.dailyAvailableMinutes)
    : 0;
  const hasConflictToday = plannedStudyMinutesToday > freeAwakeMinutesToday;

  const handleAdd = () => {
    if (!newLabel.trim()) return;

    const newCommitment: FixedCommitment = {
      id: `fix-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      day: activeDay,
      startTime: newStart,
      endTime: newEnd,
      label: newLabel.trim(),
      color: '#6366f1',
    };

    saveFixedCommitments([...commitments, newCommitment]);
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2000);
  };

  const handleRemove = (id: string) => {
    saveFixedCommitments(commitments.filter((c) => c.id !== id));
  };

  const handleApplyToAllWeekdays = () => {
    // Replicate current day's commitments to Monday-Friday (days 1 to 5)
    const otherDays = commitments.filter((c) => c.day === 0 || c.day === 6);
    const newItems: FixedCommitment[] = [];

    for (let d = 1; d <= 5; d++) {
      dayCommitments.forEach((c) => {
        newItems.push({
          ...c,
          id: `fix-${Date.now()}-${d}-${Math.random().toString(36).slice(2, 6)}`,
          day: d,
        });
      });
    }

    saveFixedCommitments([...otherDays, ...newItems]);
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl dark:border-stone-800 dark:bg-stone-900 transition-all max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-xl p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-stone-900 dark:text-stone-100">
              Grade de Horários Fixos (Compromissos)
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Defina os horários em que você trabalha ou tem compromissos fixos para proteger sua rotina
            </p>
          </div>
        </div>

        {/* Day Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-stone-100 dark:border-stone-800">
          {WEEKDAYS.map((wd) => {
            const count = commitments.filter((c) => c.day === wd.day).length;
            const isActive = activeDay === wd.day;
            return (
              <button
                key={wd.day}
                onClick={() => setActiveDay(wd.day)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700'
                }`}
              >
                <span>{wd.label.split('-')[0]}</span>
                {count > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                      isActive ? 'bg-indigo-700 text-white' : 'bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-200'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Free Awake Time vs Planned Study Hours */}
          <div
            className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs ${
              hasConflictToday
                ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200'
                : 'border-stone-200 bg-stone-50 text-stone-700 dark:border-stone-800 dark:bg-stone-800/50 dark:text-stone-300'
            }`}
          >
            <AlertCircle
              className={`h-4 w-4 shrink-0 mt-0.5 ${
                hasConflictToday ? 'text-amber-600 dark:text-amber-400' : 'text-indigo-500'
              }`}
            />
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 tabular-nums">
              <span>
                Bloqueado: <strong>{formatMinsHM(blockedMinutesToday)}</strong>
              </span>
              <span>·</span>
              <span>
                Tempo livre útil: <strong>{formatMinsHM(freeAwakeMinutesToday)}</strong>
              </span>
              <span>·</span>
              <span>
                Meta de estudo:{' '}
                <strong>
                  {plannedStudyMinutesToday > 0 ? formatMinsHM(plannedStudyMinutesToday) : 'Folga'}
                </strong>
              </span>
              {hasConflictToday && (
                <span className="w-full text-[11px] font-bold text-amber-700 dark:text-amber-300">
                  A meta de estudo excede o tempo livre útil neste dia; o cronograma ajustará automaticamente.
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Bloqueios em {WEEKDAYS.find((w) => w.day === activeDay)?.label}
            </h3>

            {dayCommitments.length > 0 && (
              <button
                onClick={handleApplyToAllWeekdays}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline"
              >
                Copiar para Seg–Sex
              </button>
            )}
          </div>

          {/* List of current day commitments */}
          {dayCommitments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-200 p-6 text-center text-xs text-stone-400 dark:border-stone-800">
              Nenhum horário bloqueado neste dia. Adicione um compromisso abaixo.
            </div>
          ) : (
            <div className="space-y-2">
              {dayCommitments.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50/70 p-3 dark:border-stone-800 dark:bg-stone-800/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-stone-700 dark:text-stone-300">
                      <Clock className="h-3.5 w-3.5 text-indigo-500" />
                      <span>{c.startTime} – {c.endTime}</span>
                    </div>
                    <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                      {c.label}
                    </span>
                  </div>

                  <button
                    onClick={() => handleRemove(c.id)}
                    className="rounded-lg p-1.5 text-stone-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition"
                    title="Remover compromisso"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add New Commitment Section */}
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-800/60 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-stone-700 dark:text-stone-300">
              + Bloquear Novo Horário neste dia
            </h4>

            {/* Presets chips */}
            <div className="flex flex-wrap gap-1.5">
              {PRESET_LABELS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setNewLabel(preset)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                    newLabel === preset
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-stone-500 mb-1">Início</label>
                <input
                  type="time"
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-900 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-500 mb-1">Término</label>
                <input
                  type="time"
                  value={newEnd}
                  onChange={(e) => setNewEnd(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-900 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleAdd}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 active:scale-95 transition"
                >
                  <Plus className="h-4 w-4" />
                  <span>Adicionar Bloqueio</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-stone-100 pt-4 dark:border-stone-800">
          <span className="text-xs text-stone-400">
            Total de {commitments.length} bloqueios configurados na semana
          </span>

          <div className="flex items-center gap-2">
            {saveFeedback && (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <Check className="h-4 w-4" />
                Salvo!
              </span>
            )}
            <button
              onClick={() => {
                recalculateSchedule();
                onClose();
              }}
              className="rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white transition"
            >
              Concluir & Recalcular
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
