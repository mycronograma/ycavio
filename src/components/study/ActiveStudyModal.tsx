import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  HelpCircle,
  Plus,
  Minus,
  Check,
  FileText,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Edit3,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { Task } from '../../types';
import { playChimeSound } from '../../lib/audio';

interface ActiveStudyModalProps {
  task: Task;
  onClose: () => void;
}

export const ActiveStudyModal: React.FC<ActiveStudyModalProps> = ({ task, onClose }) => {
  const { state, completeStudySession, updateSubjectSpreadsheetField } = useStudy();
  const matchedSubject = state.subjects.find((s) => s.id === task.subjectId);

  // Time state in seconds
  const initialDuration = Math.max(1, task.durationMinutes);
  const [totalSeconds, setTotalSeconds] = useState(initialDuration * 60);
  const [secondsRemaining, setSecondsRemaining] = useState(initialDuration * 60);
  const [isActive, setIsActive] = useState(false);

  // Editing time directly (HH:MM)
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editHours, setEditHours] = useState(Math.floor(initialDuration / 60));
  const [editMinutes, setEditMinutes] = useState(initialDuration % 60);

  // Zen mode (fullscreen)
  const [isZenMode, setIsZenMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Spreadsheet "Onde Parei" and "Caderno de Questões" inputs during study
  const [pareiEmValue, setPareiEmValue] = useState(task.pareiEm || matchedSubject?.pareiEm || '');
  const [cadernoQuestoesValue, setCadernoQuestoesValue] = useState(
    task.cadernoQuestoes || matchedSubject?.cadernoQuestoes || ''
  );

  // Completed objectives & checklist
  const [checkedObjectives, setCheckedObjectives] = useState<Record<number, boolean>>({});
  const [checkedTopics, setCheckedTopics] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (matchedSubject?.topics) {
      matchedSubject.topics.forEach((top) => {
        initial[top.id] = top.completed;
      });
    }
    return initial;
  });

  // Exercise tracking
  const [exercisesDone, setExercisesDone] = useState(task.exercisesDone || 0);
  const [exercisesCorrect, setExercisesCorrect] = useState(task.exercisesCorrect || 0);

  // Scratchpad
  const [notes, setNotes] = useState(task.notes || '');

  // Step for finishing: 'active' | 'rating' | 'reward'
  const [finishStep, setFinishStep] = useState<'active' | 'rating' | 'reward'>('active');
  const [selectedRating, setSelectedRating] = useState<'facil' | 'medio' | 'dificil'>('medio');
  const [rewardData, setRewardData] = useState<{
    xpEarned: number;
    newLevel: boolean;
    newLevelNum: number;
  } | null>(null);

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isActive) {
      timerRef.current = window.setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            if (timerRef.current) clearInterval(timerRef.current);
            if (soundEnabled) {
              playChimeSound();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, soundEnabled]);

  // Adjust time by delta minutes (e.g. +5, -5, +15)
  const adjustMinutes = (deltaMinutes: number) => {
    const deltaSeconds = deltaMinutes * 60;
    const newRemaining = Math.max(60, secondsRemaining + deltaSeconds);
    const newTotal = Math.max(newRemaining, totalSeconds + deltaSeconds);
    setSecondsRemaining(newRemaining);
    setTotalSeconds(newTotal);
  };

  // Save manual HH:MM edit
  const applyManualTimeEdit = () => {
    const safeH = Math.max(0, Number(editHours) || 0);
    const safeM = Math.max(0, Math.min(59, Number(editMinutes) || 0));
    const totalMins = safeH * 60 + safeM;
    if (totalMins <= 0) return;

    const newSec = totalMins * 60;
    setTotalSeconds(newSec);
    setSecondsRemaining(newSec);
    setIsEditingTime(false);
  };

  // Calculate actual elapsed minutes
  const actualMinutes = Math.max(
    1,
    Math.round((totalSeconds - secondsRemaining) / 60)
  );

  const formatTimer = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressPercent = totalSeconds > 0 ? ((totalSeconds - secondsRemaining) / totalSeconds) * 100 : 0;

  const toggleObjective = (index: number) => {
    setCheckedObjectives((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const toggleSubjectTopic = (topicId: string) => {
    setCheckedTopics((prev) => ({
      ...prev,
      [topicId]: !prev[topicId],
    }));
  };

  const handleStartFinish = () => {
    setIsActive(false);
    setFinishStep('rating');
  };

  const handleConfirmCompletion = () => {
    // 1. Update the subject spreadsheet fields directly
    if (task.subjectId) {
      if (pareiEmValue.trim()) {
        updateSubjectSpreadsheetField(task.subjectId, 'pareiEm', pareiEmValue.trim());
      }
      if (cadernoQuestoesValue.trim()) {
        updateSubjectSpreadsheetField(task.subjectId, 'cadernoQuestoes', cadernoQuestoesValue.trim());
      }
    }

    // 2. Complete study session
    const res = completeStudySession({
      taskId: task.id,
      durationMinutes: actualMinutes > 0 ? actualMinutes : Math.round(totalSeconds / 60),
      exercisesDone,
      exercisesCorrect: Math.min(exercisesDone, exercisesCorrect),
      notes: notes.trim()
        ? `${notes}\n[Parei em: ${pareiEmValue || 'N/A'}]`
        : `[Parei em: ${pareiEmValue || 'N/A'}]`,
      performanceRating: selectedRating,
    });

    setRewardData(res);
    setFinishStep('reward');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-stone-950/80 p-2 sm:p-4 backdrop-blur-md transition-all">
      <div
        className={`relative w-full rounded-3xl border border-stone-200 bg-white p-5 sm:p-7 shadow-2xl transition-all duration-300 dark:border-stone-800 dark:bg-stone-900 ${
          isZenMode ? 'max-w-4xl min-h-[90vh] flex flex-col justify-between' : 'max-w-2xl'
        }`}
      >
        {/* Top bar controls */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: task.subjectColor || '#3b82f6' }}
            />
            <span className="text-xs font-black uppercase tracking-wider text-stone-600 dark:text-stone-300">
              {task.subjectName}
            </span>
            <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 uppercase">
              {task.type}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Audio Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
              title={soundEnabled ? 'Silenciar alarme de conclusão' : 'Ativar alarme de conclusão'}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> : <VolumeX className="h-4 w-4" />}
            </button>

            {/* Zen Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsZenMode(!isZenMode)}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
              title={isZenMode ? 'Sair do Modo Zen' : 'Modo Zen (Tela Cheia)'}
            >
              {isZenMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
              title="Fechar sessão"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* STEP 1: ACTIVE STUDY TIMER */}
        {finishStep === 'active' && (
          <div className="space-y-5">
            {/* Subject and Topic info */}
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 leading-tight">
                {task.topicName}
              </h3>
              {pareiEmValue && (
                <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                  <span>📍 Você parou em:</span>
                  <span className="font-bold underline">{pareiEmValue}</span>
                </p>
              )}
            </div>

            {/* MAIN TIMER CARD */}
            <div className="flex flex-col items-center justify-center rounded-2xl border border-stone-200 bg-stone-50/80 p-6 dark:border-stone-800 dark:bg-stone-800/50 shadow-inner">
              {/* Manual Time Edit View */}
              {isEditingTime ? (
                <div className="flex flex-col items-center gap-3 py-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    Definir Tempo Manual do Cronômetro
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-center">
                      <input
                        type="number"
                        min="0"
                        max="12"
                        value={editHours}
                        onChange={(e) => setEditHours(Number(e.target.value))}
                        className="w-16 rounded-xl border border-stone-300 bg-white p-2 text-center text-2xl font-black text-stone-900 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
                      />
                      <span className="text-[10px] font-bold text-stone-400 mt-1">Horas</span>
                    </div>
                    <span className="text-2xl font-black text-stone-400">:</span>
                    <div className="flex flex-col items-center">
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={editMinutes}
                        onChange={(e) => setEditMinutes(Number(e.target.value))}
                        className="w-16 rounded-xl border border-stone-300 bg-white p-2 text-center text-2xl font-black text-stone-900 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
                      />
                      <span className="text-[10px] font-bold text-stone-400 mt-1">Minutos</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setIsEditingTime(false)}
                      className="rounded-lg px-3 py-1 text-xs font-semibold text-stone-500 hover:text-stone-800 dark:text-stone-400"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={applyManualTimeEdit}
                      className="rounded-lg bg-indigo-600 px-4 py-1 text-xs font-bold text-white hover:bg-indigo-700 shadow-xs"
                    >
                      Salvar Tempo
                    </button>
                  </div>
                </div>
              ) : (
                /* Regular Large Timer Display */
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setEditHours(Math.floor(secondsRemaining / 3600));
                      setEditMinutes(Math.floor((secondsRemaining % 3600) / 60));
                      setIsEditingTime(true);
                    }}
                    className="group relative flex items-center gap-2 rounded-2xl px-4 py-1 hover:bg-stone-200/50 dark:hover:bg-stone-700/40 transition"
                    title="Clique para editar horas e minutos diretamente"
                  >
                    <span className="font-mono text-5xl sm:text-6xl font-black tracking-tight text-stone-900 dark:text-stone-100">
                      {formatTimer(secondsRemaining)}
                    </span>
                    <Edit3 className="h-4 w-4 text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>

                  <span className="mt-1 text-xs font-semibold text-stone-400 dark:text-stone-500">
                    {isActive ? '⏱ Foco em andamento' : 'Pausado • Clique no tempo para editar'}
                  </span>
                </div>
              )}

              {/* Progress bar */}
              <div className="mt-4 h-2 w-full max-w-md overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700">
                <div
                  className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Quick +5m, -5m, +15m adjustments */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustMinutes(-5)}
                  className="rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-bold text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 shadow-2xs"
                  title="Diminuir 5 minutos"
                >
                  -5m
                </button>
                <button
                  type="button"
                  onClick={() => adjustMinutes(5)}
                  className="rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-bold text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 shadow-2xs"
                  title="Adicionar 5 minutos"
                >
                  +5m
                </button>
                <button
                  type="button"
                  onClick={() => adjustMinutes(15)}
                  className="rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-bold text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 shadow-2xs"
                  title="Adicionar 15 minutos"
                >
                  +15m
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditHours(Math.floor(secondsRemaining / 3600));
                    setEditMinutes(Math.floor((secondsRemaining % 3600) / 60));
                    setIsEditingTime(true);
                  }}
                  className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300 shadow-2xs"
                >
                  Digitar Tempo (HH:MM)
                </button>
              </div>

              {/* Play / Pause / Reset Controls */}
              <div className="mt-5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSecondsRemaining(totalSeconds)}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 shadow-xs"
                  title="Reiniciar cronômetro"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`flex items-center gap-2 rounded-2xl px-7 py-3 text-sm font-extrabold text-white shadow-md transition-all active:scale-95 ${
                    isActive
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30'
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
                  }`}
                >
                  {isActive ? (
                    <>
                      <Pause className="h-5 w-5 fill-white" />
                      <span>PAUSAR</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 fill-white" />
                      <span>{secondsRemaining === totalSeconds ? 'INICIAR ESTUDO' : 'CONTINUAR'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleStartFinish}
                  className="flex items-center gap-1.5 rounded-2xl bg-emerald-600 px-5 py-3 text-xs font-extrabold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-700 active:scale-95"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>CONCLUIR</span>
                </button>
              </div>
            </div>

            {/* SPREADSHEET SYNC INPUTS: Onde Parou & Caderno de Questões */}
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 dark:border-indigo-950/60 dark:bg-indigo-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-950 dark:text-indigo-200">
                  Atualizar Planilha Desta Matéria
                </span>
                <span className="text-[10px] text-stone-400">Salva ao concluir</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                    📍 Onde Parou Agora (PAREI)
                  </label>
                  <input
                    type="text"
                    value={pareiEmValue}
                    onChange={(e) => setPareiEmValue(e.target.value)}
                    placeholder="Ex: aula 1.6 - morfologia..."
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-900 outline-hidden focus:border-indigo-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                    📝 Caderno de Questões
                  </label>
                  <input
                    type="text"
                    value={cadernoQuestoesValue}
                    onChange={(e) => setCadernoQuestoesValue(e.target.value)}
                    placeholder="Ex: questão 40 - ortográfica..."
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-900 outline-hidden focus:border-indigo-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                  />
                </div>
              </div>
            </div>

            {/* SUBTOPICS CHECKLIST (From Subject Topics) */}
            {matchedSubject && matchedSubject.topics.length > 0 && (
              <div className="rounded-2xl border border-stone-200 bg-stone-50/60 p-4 dark:border-stone-800 dark:bg-stone-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                    Subtópicos da Matéria (Marque o que avançar)
                  </span>
                  <span className="text-[10px] text-stone-400">
                    {Object.values(checkedTopics).filter(Boolean).length}/{matchedSubject.topics.length}
                  </span>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {matchedSubject.topics.map((top) => {
                    const isChecked = !!checkedTopics[top.id];
                    return (
                      <button
                        key={top.id}
                        type="button"
                        onClick={() => toggleSubjectTopic(top.id)}
                        className={`flex w-full items-center justify-between rounded-xl border p-2 text-left text-xs transition ${
                          isChecked
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 font-semibold'
                            : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-850 dark:text-stone-300'
                        }`}
                      >
                        <span className={isChecked ? 'line-through opacity-80' : ''}>{top.name}</span>
                        <div
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border ${
                            isChecked
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-stone-300 dark:border-stone-600'
                          }`}
                        >
                          {isChecked && <Check className="h-3 w-3 stroke-3" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* EXERCISES & NOTES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Question counter */}
              <div className="rounded-2xl border border-stone-200 bg-stone-50/60 p-4 dark:border-stone-800 dark:bg-stone-800/40">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 block mb-2">
                  Questões Praticadas
                </span>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-2 dark:border-stone-700 dark:bg-stone-850">
                    <span className="text-xs text-stone-600 dark:text-stone-400">Total Feitas</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setExercisesDone(Math.max(0, exercisesDone - 1))}
                        className="rounded-md border border-stone-200 p-1 text-stone-500 hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-7 text-center font-bold text-stone-900 dark:text-stone-100">
                        {exercisesDone}
                      </span>
                      <button
                        type="button"
                        onClick={() => setExercisesDone(exercisesDone + 1)}
                        className="rounded-md border border-stone-200 p-1 text-stone-500 hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-2 dark:border-stone-700 dark:bg-stone-850">
                    <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Acertos</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setExercisesCorrect(Math.max(0, exercisesCorrect - 1))}
                        className="rounded-md border border-stone-200 p-1 text-stone-500 hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-7 text-center font-bold text-emerald-700 dark:text-emerald-400">
                        {exercisesCorrect}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setExercisesCorrect(Math.min(exercisesDone, exercisesCorrect + 1))
                        }
                        className="rounded-md border border-stone-200 p-1 text-stone-500 hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Scratchpad */}
              <div className="rounded-2xl border border-stone-200 bg-stone-50/60 p-4 dark:border-stone-800 dark:bg-stone-800/40">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 block mb-2">
                  Rascunho de Dúvidas / Fórmulas
                </span>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anotações rápidas para a revisão..."
                  className="w-full rounded-xl border border-stone-200 bg-white p-2.5 text-xs text-stone-900 outline-hidden focus:border-indigo-600 dark:border-stone-700 dark:bg-stone-850 dark:text-stone-100 resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: RATING & CONFIRMATION */}
        {finishStep === 'rating' && (
          <div className="py-6 text-center space-y-4">
            <h4 className="text-xl font-black text-stone-900 dark:text-stone-100">
              Como foi a sessão de estudo?
            </h4>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto">
              Tempo registrado: <strong>{actualMinutes} minutos</strong> de estudo.
              {pareiEmValue && <span> Parou em: <strong>{pareiEmValue}</strong>.</span>}
            </p>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedRating('dificil')}
                className={`rounded-2xl border p-4 text-left transition ${
                  selectedRating === 'dificil'
                    ? 'border-rose-400 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/60 ring-2 ring-rose-400/30'
                    : 'border-stone-200 bg-white hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800'
                }`}
              >
                <span className="block text-sm font-bold text-rose-800 dark:text-rose-300">Difícil</span>
                <span className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 block">Tópico denso, preciso revisar logo</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRating('medio')}
                className={`rounded-2xl border p-4 text-left transition ${
                  selectedRating === 'medio'
                    ? 'border-amber-400 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/60 ring-2 ring-amber-400/30'
                    : 'border-stone-200 bg-white hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800'
                }`}
              >
                <span className="block text-sm font-bold text-amber-800 dark:text-amber-300">Médio</span>
                <span className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 block">Ritmo bom, absorvi o principal</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRating('facil')}
                className={`rounded-2xl border p-4 text-left transition ${
                  selectedRating === 'facil'
                    ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/60 ring-2 ring-emerald-400/30'
                    : 'border-stone-200 bg-white hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800'
                }`}
              >
                <span className="block text-sm font-bold text-emerald-800 dark:text-emerald-300">Fácil</span>
                <span className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 block">Conteúdo dominado com facilidade</span>
              </button>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setFinishStep('active')}
                className="flex-1 rounded-xl border border-stone-300 py-3 text-xs font-bold text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
              >
                Voltar ao Cronômetro
              </button>
              <button
                type="button"
                onClick={handleConfirmCompletion}
                className="flex-1 rounded-xl bg-indigo-600 py-3 text-xs font-extrabold text-white shadow-md hover:bg-indigo-700"
              >
                Gravar e Atualizar Planilha
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: REWARD SUMMARY */}
        {finishStep === 'reward' && rewardData && (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 ring-4 ring-emerald-500/20">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div>
              <h4 className="text-2xl font-black text-stone-900 dark:text-stone-100">
                Sessão Registrada com Sucesso!
              </h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Sua planilha e suas estatísticas de estudo foram atualizadas.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 px-5 py-2.5 border border-indigo-200 dark:border-indigo-800">
              <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-base font-black text-indigo-950 dark:text-indigo-200">
                +{rewardData.xpEarned} XP Conquistados!
              </span>
            </div>

            {pareiEmValue && (
              <div className="rounded-xl bg-stone-50 dark:bg-stone-800 p-3 text-xs text-stone-700 dark:text-stone-300 max-w-sm mx-auto">
                📍 Gravado na Planilha: <strong>{pareiEmValue}</strong>
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-stone-900 px-7 py-3 text-xs font-bold text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
              >
                Concluir e Voltar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
