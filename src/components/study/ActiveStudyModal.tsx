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
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { Task } from '../../types';

interface ActiveStudyModalProps {
  task: Task;
  onClose: () => void;
}

export const ActiveStudyModal: React.FC<ActiveStudyModalProps> = ({ task, onClose }) => {
  const { completeStudySession } = useStudy();

  const totalSecondsInitial = Math.max(1, task.durationMinutes) * 60;
  const [secondsRemaining, setSecondsRemaining] = useState(totalSecondsInitial);
  const [isActive, setIsActive] = useState(false);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  // Completed objectives state
  const [checkedObjectives, setCheckedObjectives] = useState<Record<number, boolean>>({});

  // Exercise tracking
  const [exercisesDone, setExercisesDone] = useState(task.exercisesDone || 0);
  const [exercisesCorrect, setExercisesCorrect] = useState(task.exercisesCorrect || 0);

  // Scratchpad
  const [notes, setNotes] = useState(task.notes || '');

  // Step for finishing: 'active' | 'rating' | 'reward'
  const [finishStep, setFinishStep] = useState<'active' | 'rating' | 'reward'>('active');
  const [selectedRating, setSelectedRating] = useState<'facil' | 'medio' | 'dificil'>('medio');
  const [rewardData, setRewardData] = useState<{ xpEarned: number; newLevel: boolean; newLevelNum: number } | null>(null);

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isActive) {
      timerRef.current = window.setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            if (timerRef.current) clearInterval(timerRef.current);
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
  }, [isActive]);

  // Calculate actual elapsed minutes
  const actualMinutes = Math.max(
    1,
    Math.round((totalSecondsInitial - secondsRemaining) / 60)
  );

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const toggleObjective = (index: number) => {
    setCheckedObjectives((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleStartFinish = () => {
    setIsActive(false);
    setFinishStep('rating');
  };

  const handleConfirmCompletion = () => {
    const res = completeStudySession({
      taskId: task.id,
      durationMinutes: actualMinutes > 0 ? actualMinutes : task.durationMinutes,
      exercisesDone,
      exercisesCorrect: Math.min(exercisesDone, exercisesCorrect),
      notes,
      performanceRating: selectedRating,
    });
    setRewardData(res);
    setFinishStep('reward');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-stone-900/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-6 shadow-2xl sm:p-8 dark:border-stone-800 dark:bg-stone-900 transition-colors">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-lg p-1.5 text-stone-400 transition hover:bg-stone-100 dark:hover:bg-stone-750 hover:text-stone-700 dark:text-stone-300"
        >
          <X className="h-5 w-5" />
        </button>

        {/* STEP 1: ACTIVE STUDY MODE */}
        {finishStep === 'active' && (
          <div className="space-y-6">
            {/* Header info */}
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: task.subjectColor }}
                />
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  {task.subjectName}
                </span>
                <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-600 dark:text-stone-400 uppercase">
                  {task.type}
                </span>
              </div>
              <h2 className="mt-1 text-2xl font-extrabold text-stone-900 dark:text-stone-100">{task.topicName}</h2>
            </div>

            {/* Timer Display */}
            <div className="flex flex-col items-center justify-center rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50/80 p-6 dark:border-stone-800 dark:bg-stone-800/60">
              <span className="text-5xl sm:text-6xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 font-mono">
                {formatTimer(secondsRemaining)}
              </span>
              <span className="mt-1 text-xs font-semibold text-stone-500 dark:text-stone-400">
                {isActive ? 'Sessão em andamento... Mantenha o foco!' : 'Cronômetro pausado'}
              </span>

              {/* Timer Controls */}
              <div className="mt-5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-md transition active:scale-95 ${
                    isActive ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {isActive ? (
                    <>
                      <Pause className="h-4 w-4" />
                      <span>Pausar</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      <span>{secondsRemaining === totalSecondsInitial ? 'Iniciar Cronômetro' : 'Continuar'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsActive(false);
                    setSecondsRemaining(totalSecondsInitial);
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3.5 py-2.5 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-750"
                  title="Reiniciar tempo"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Objectives Checklist */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
                Objetivos da Sessão
              </h3>
              <div className="space-y-2">
                {task.objectives.map((obj, idx) => {
                  const isChecked = !!checkedObjectives[idx];
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleObjective(idx)}
                      className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
                        isChecked
                          ? 'border-emerald-200 bg-emerald-50/50 text-stone-500 dark:text-stone-400'
                          : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 hover:bg-stone-50 dark:hover:bg-stone-750'
                      }`}
                    >
                      <div
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-md border ${
                          isChecked
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800'
                        }`}
                      >
                        {isChecked && <Check className="h-3 w-3" />}
                      </div>
                      <span className={`text-sm ${isChecked ? 'line-through text-stone-400' : 'font-medium'}`}>
                        {obj}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Exercise Log Section */}
            <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/60 p-4 dark:border-stone-800 dark:bg-stone-800/40">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                    Registro de Questões Práticas
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400">Acompanhe seu desempenho nesta sessão</p>
                </div>
                {exercisesDone > 0 && (
                  <div className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                    {Math.round((exercisesCorrect / exercisesDone) * 100)}% de acerto
                  </div>
                )}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                {/* Total Questions */}
                <div className="flex items-center justify-between rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-2.5">
                  <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">Feitas</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const next = Math.max(0, exercisesDone - 1);
                        setExercisesDone(next);
                        if (exercisesCorrect > next) setExercisesCorrect(next);
                      }}
                      className="rounded-md border border-stone-200 dark:border-stone-700 p-1 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-750"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold text-stone-900 dark:text-stone-100">
                      {exercisesDone}
                    </span>
                    <button
                      type="button"
                      onClick={() => setExercisesDone(exercisesDone + 1)}
                      className="rounded-md border border-stone-200 dark:border-stone-700 p-1 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-750"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Correct Questions */}
                <div className="flex items-center justify-between rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-2.5">
                  <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">Acertos</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setExercisesCorrect(Math.max(0, exercisesCorrect - 1))}
                      className="rounded-md border border-stone-200 dark:border-stone-700 p-1 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-750"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold text-emerald-600">
                      {exercisesCorrect}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = exercisesCorrect + 1;
                        setExercisesCorrect(next);
                        if (next > exercisesDone) setExercisesDone(next);
                      }}
                      className="rounded-md border border-stone-200 dark:border-stone-700 p-1 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-750"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Notes */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
                <FileText className="h-3.5 w-3.5" />
                <span>Anotações & Dúvidas para Revisão</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Pegadinha no conceito X; revisar fórmula Y amanhã..."
                rows={2}
                className="w-full rounded-xl border border-stone-300 dark:border-stone-600 p-3 text-xs text-stone-900 dark:text-stone-100 outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10"
              />
            </div>

            {/* Complete Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleStartFinish}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700 active:scale-98 transition"
              >
                <CheckCircle2 className="h-5 w-5" />
                <span>Concluir Estudo</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: DIFFICULTY FEEDBACK FOR SPACED REPETITION */}
        {finishStep === 'rating' && (
          <div className="space-y-6 py-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
              <HelpCircle className="h-8 w-8" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100">Como foi seu domínio deste conteúdo?</h3>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400 max-w-sm mx-auto">
                Isso calibra o algoritmo de <strong>repetição espaçada</strong> para programar sua próxima revisão no momento exato.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-left">
              <button
                type="button"
                onClick={() => setSelectedRating('dificil')}
                className={`rounded-xl border p-4 transition ${
                  selectedRating === 'dificil'
                    ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-500/20'
                    : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-750'
                }`}
              >
                <span className="block text-sm font-bold text-rose-700">Difícil</span>
                <span className="text-xs text-stone-500 dark:text-stone-400 mt-1 block">
                  Tive dúvidas. Revisar novamente em breve (D+1).
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRating('medio')}
                className={`rounded-xl border p-4 transition ${
                  selectedRating === 'medio'
                    ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-500/20'
                    : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-750'
                }`}
              >
                <span className="block text-sm font-bold text-amber-700">Médio</span>
                <span className="text-xs text-stone-500 dark:text-stone-400 mt-1 block">
                  Entendi o essencial. Revisão normal (D+7).
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRating('facil')}
                className={`rounded-xl border p-4 transition ${
                  selectedRating === 'facil'
                    ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20'
                    : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-750'
                }`}
              >
                <span className="block text-sm font-bold text-emerald-700">Fácil</span>
                <span className="text-xs text-stone-500 dark:text-stone-400 mt-1 block">
                  Domínio sólido. Próxima revisão espaçada ampliada.
                </span>
              </button>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFinishStep('active')}
                className="flex-1 rounded-xl border border-stone-300 dark:border-stone-600 py-2.5 text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-750"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmCompletion}
                className="flex-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700"
              >
                Confirmar & Receber XP
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: REWARD SUMMARY & CELEBRATION */}
        {finishStep === 'reward' && rewardData && (
          <div className="space-y-6 py-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50">
              <Sparkles className="h-8 w-8 animate-bounce" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-stone-900 dark:text-stone-100">Sessão Concluída com Sucesso!</h3>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                Você acaba de dar mais um passo sólido na sua aprovação.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
              <span className="block text-3xl font-extrabold text-emerald-700">
                +{rewardData.xpEarned} XP
              </span>
              <span className="text-xs font-semibold text-emerald-800">
                Recompensa creditada à sua evolução
              </span>
              {rewardData.newLevel && (
                <div className="mt-3 rounded-xl bg-amber-100 border border-amber-300 p-2 text-xs font-bold text-amber-900">
                  🎉 Parabéns! Você subiu para o Nível {rewardData.newLevelNum}!
                </div>
              )}
            </div>

            <p className="text-xs text-stone-500 dark:text-stone-400">
              A próxima revisão deste tópico já foi programada de forma automática pelo sistema de repetição espaçada.
            </p>

            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-stone-900 py-3 text-xs font-bold text-white shadow-md hover:bg-stone-800"
            >
              Continuar Estudando
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
