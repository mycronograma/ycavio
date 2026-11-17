import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Plus,
  Minus,
  FileText,
  Volume2,
  VolumeX,
  Coffee,
  MapPin,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { ActiveTimerDraft, Task } from '../../types';
import { playChimeSound, stopChimeSound, unlockAudioContext } from '../../lib/audio';
import { getStudyMethodPreset, resolveBreakMinutes } from '../../services/studyMethods';

interface ActiveStudyModalProps {
  task: Task;
  onClose: () => void;
}

const TASK_TYPE_LABEL: Record<string, string> = {
  teoria: 'TEORIA',
  exercicios: 'QUESTÕES',
  revisao: 'REVISÃO',
  simulado: 'SIMULADO',
};

function resolveRingColor(rawColor?: string): string {
  if (!rawColor) return '#4f46e5';
  if (rawColor.startsWith('#') || rawColor.startsWith('rgb') || rawColor.startsWith('hsl')) {
    return rawColor;
  }
  return '#4f46e5';
}

export function formatTimerClock(sec: number): string {
  const safeSec = Math.max(0, Math.floor(sec));
  const hrs = Math.floor(safeSec / 3600);
  const mins = Math.floor((safeSec % 3600) / 60);
  const s = safeSec % 60;
  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const ActiveStudyModal: React.FC<ActiveStudyModalProps> = ({ task, onClose }) => {
  const {
    state,
    activeTimerDraft,
    saveTimerProgress,
    clearTimerDraft,
    completeStudySession,
    updateSubjectSpreadsheetField,
  } = useStudy();

  const matchedSubject = state.subjects.find((s) => s.id === task.subjectId);
  const methodPreset = getStudyMethodPreset(state.profile.studyMethod);
  const configuredBreakMinutes = resolveBreakMinutes(state.profile);

  const matchingDraft =
    activeTimerDraft && activeTimerDraft.task.id === task.id ? activeTimerDraft : null;

  const defaultPlannedSeconds = Math.max(1, task.durationMinutes) * 60;
  const initialTotalSeconds = matchingDraft ? matchingDraft.totalSeconds : defaultPlannedSeconds;
  const initialSecondsRemaining = matchingDraft
    ? matchingDraft.secondsRemaining
    : defaultPlannedSeconds;

  const initialPareiEm = matchingDraft
    ? matchingDraft.pareiEm
    : task.pareiEm || matchedSubject?.pareiEm || '';
  const initialCaderno = matchingDraft
    ? matchingDraft.cadernoQuestoes
    : task.cadernoQuestoes || matchedSubject?.cadernoQuestoes || '';
  const initialExercisesDone = matchingDraft
    ? matchingDraft.exercisesDone
    : task.exercisesDone || 0;
  const initialExercisesCorrect = matchingDraft
    ? matchingDraft.exercisesCorrect
    : task.exercisesCorrect || 0;
  const initialNotes = matchingDraft ? matchingDraft.notes : task.notes || '';

  // Time state in seconds (always restored as PAUSADO when reopened from saved draft)
  const [totalSeconds, setTotalSeconds] = useState(initialTotalSeconds);
  const [secondsRemaining, setSecondsRemaining] = useState(initialSecondsRemaining);
  const [isActive, setIsActive] = useState(false);

  // Break countdown state
  const [breakDurationMinutes, setBreakDurationMinutes] = useState(configuredBreakMinutes);
  const [breakTotalSeconds, setBreakTotalSeconds] = useState(configuredBreakMinutes * 60);
  const [breakSecondsRemaining, setBreakSecondsRemaining] = useState(configuredBreakMinutes * 60);
  const [isBreakRunning, setIsBreakRunning] = useState(false);
  const [capturedFocusMinutes, setCapturedFocusMinutes] = useState<number | null>(() =>
    matchingDraft && matchingDraft.secondsRemaining <= 0
      ? Math.max(1, Math.round(matchingDraft.totalSeconds / 60))
      : null
  );

  // Editing time directly (click on timer numbers)
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editHours, setEditHours] = useState(Math.floor(initialSecondsRemaining / 3600));
  const [editMinutes, setEditMinutes] = useState(Math.floor((initialSecondsRemaining % 3600) / 60));

  // Audio & discreet details drawer (collapsed by default)
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  // Optional session fields synced with spreadsheet & draft
  const [pareiEmValue, setPareiEmValue] = useState(initialPareiEm);
  const [cadernoQuestoesValue, setCadernoQuestoesValue] = useState(initialCaderno);
  const [exercisesDone, setExercisesDone] = useState(initialExercisesDone);
  const [exercisesCorrect, setExercisesCorrect] = useState(initialExercisesCorrect);
  const [notes, setNotes] = useState(initialNotes);

  // Unified step flow: focus ring ('active'), single-step completion ('summary'), or optional green break ring ('break')
  const [finishStep, setFinishStep] = useState<'active' | 'summary' | 'break'>(() =>
    matchingDraft && matchingDraft.secondsRemaining <= 0 ? 'summary' : 'active'
  );
  const [selectedRating, setSelectedRating] = useState<'facil' | 'medio' | 'dificil'>('medio');

  // Wall-clock refs so background tab throttling or reload never loses exact remaining time
  const focusEndTimestampRef = useRef<number | null>(null);
  const breakEndTimestampRef = useRef<number | null>(null);
  const hadDraftOnOpenRef = useRef<boolean>(Boolean(matchingDraft));

  const latestRef = useRef({
    task,
    totalSeconds,
    secondsRemaining,
    isActive,
    pareiEmValue,
    cadernoQuestoesValue,
    exercisesDone,
    exercisesCorrect,
    notes,
    finishStep,
    isBreakRunning,
    breakSecondsRemaining,
  });

  latestRef.current = {
    task,
    totalSeconds,
    secondsRemaining,
    isActive,
    pareiEmValue,
    cadernoQuestoesValue,
    exercisesDone,
    exercisesCorrect,
    notes,
    finishStep,
    isBreakRunning,
    breakSecondsRemaining,
  };

  const buildDraftSnapshot = useCallback(
    (running: boolean, overrideRemaining?: number, overrideTotal?: number): ActiveTimerDraft => {
      const snap = latestRef.current;
      const resolvedTotal = overrideTotal ?? snap.totalSeconds;
      const resolvedRemaining = Math.max(
        0,
        Math.min(resolvedTotal, overrideRemaining ?? snap.secondsRemaining)
      );
      return {
        task: snap.task,
        totalSeconds: resolvedTotal,
        secondsRemaining: resolvedRemaining,
        isRunning: running,
        pareiEm: snap.pareiEmValue,
        cadernoQuestoes: snap.cadernoQuestoesValue,
        exercisesDone: snap.exercisesDone,
        exercisesCorrect: Math.min(snap.exercisesDone, snap.exercisesCorrect),
        notes: snap.notes,
        updatedAt: Date.now(),
      };
    },
    []
  );

  const computeCurrentFocusRemaining = useCallback((): number => {
    const snap = latestRef.current;
    if (snap.isActive && focusEndTimestampRef.current !== null) {
      return Math.max(0, Math.ceil((focusEndTimestampRef.current - Date.now()) / 1000));
    }
    return snap.secondsRemaining;
  }, []);

  const pauseAndPersist = useCallback(() => {
    const snap = latestRef.current;
    const remaining = computeCurrentFocusRemaining();
    focusEndTimestampRef.current = null;
    if (snap.isActive) {
      setIsActive(false);
      setSecondsRemaining(remaining);
    }

    const detailsChanged =
      snap.pareiEmValue !== (snap.task.pareiEm || matchedSubject?.pareiEm || '') ||
      snap.cadernoQuestoesValue !==
        (snap.task.cadernoQuestoes || matchedSubject?.cadernoQuestoes || '') ||
      snap.exercisesDone !== (snap.task.exercisesDone || 0) ||
      snap.exercisesCorrect !== (snap.task.exercisesCorrect || 0) ||
      snap.notes !== (snap.task.notes || '');

    const hasProgress =
      remaining < snap.totalSeconds ||
      snap.totalSeconds !== defaultPlannedSeconds ||
      detailsChanged ||
      hadDraftOnOpenRef.current ||
      snap.finishStep !== 'active';

    if (hasProgress) {
      saveTimerProgress(buildDraftSnapshot(false, remaining));
      hadDraftOnOpenRef.current = true;
    }
  }, [
    buildDraftSnapshot,
    computeCurrentFocusRemaining,
    defaultPlannedSeconds,
    matchedSubject?.cadernoQuestoes,
    matchedSubject?.pareiEm,
    saveTimerProgress,
  ]);

  // Persist optional Detalhes changes immediately whenever session already started or has draft
  useEffect(() => {
    const snap = latestRef.current;
    const detailsChanged =
      pareiEmValue !== (task.pareiEm || matchedSubject?.pareiEm || '') ||
      cadernoQuestoesValue !== (task.cadernoQuestoes || matchedSubject?.cadernoQuestoes || '') ||
      exercisesDone !== (task.exercisesDone || 0) ||
      exercisesCorrect !== (task.exercisesCorrect || 0) ||
      notes !== (task.notes || '');

    if (
      snap.secondsRemaining < snap.totalSeconds ||
      hadDraftOnOpenRef.current ||
      detailsChanged
    ) {
      saveTimerProgress(buildDraftSnapshot(snap.isActive, computeCurrentFocusRemaining()));
      hadDraftOnOpenRef.current = true;
    }
  }, [
    pareiEmValue,
    cadernoQuestoesValue,
    exercisesDone,
    exercisesCorrect,
    notes,
    task.pareiEm,
    task.cadernoQuestoes,
    task.exercisesDone,
    task.exercisesCorrect,
    task.notes,
    matchedSubject?.pareiEm,
    matchedSubject?.cadernoQuestoes,
    buildDraftSnapshot,
    computeCurrentFocusRemaining,
    saveTimerProgress,
  ]);

  // Wall-clock focus countdown interval (persists every second tick & syncs immediately on tab return)
  useEffect(() => {
    if (!isActive || finishStep !== 'active') {
      focusEndTimestampRef.current = null;
      return;
    }

    if (focusEndTimestampRef.current === null) {
      focusEndTimestampRef.current = Date.now() + latestRef.current.secondsRemaining * 1000;
    }

    const tick = () => {
      if (focusEndTimestampRef.current === null) return;
      const remaining = Math.max(0, Math.ceil((focusEndTimestampRef.current - Date.now()) / 1000));

      if (remaining !== latestRef.current.secondsRemaining) {
        setSecondsRemaining(remaining);
        if (remaining > 0) {
          saveTimerProgress(buildDraftSnapshot(true, remaining));
          hadDraftOnOpenRef.current = true;
        }
      }

      if (remaining <= 0) {
        focusEndTimestampRef.current = null;
        setIsActive(false);
        setSecondsRemaining(0);
        if (soundEnabled) {
          playChimeSound();
        }
        setCapturedFocusMinutes(Math.max(1, Math.round(latestRef.current.totalSeconds / 60)));
        setBreakDurationMinutes(configuredBreakMinutes);
        saveTimerProgress(buildDraftSnapshot(false, 0));
        hadDraftOnOpenRef.current = true;
        setFinishStep('summary');
      }
    };

    const handleTabReturn = () => {
      if (!document.hidden) {
        tick();
      }
    };

    const intervalId = window.setInterval(tick, 250);
    document.addEventListener('visibilitychange', handleTabReturn);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleTabReturn);
    };
  }, [
    isActive,
    finishStep,
    soundEnabled,
    configuredBreakMinutes,
    buildDraftSnapshot,
    saveTimerProgress,
  ]);

  // Wall-clock break countdown interval (continues across tab switches & syncs on return)
  useEffect(() => {
    if (!isBreakRunning || finishStep !== 'break') {
      breakEndTimestampRef.current = null;
      return;
    }

    if (breakEndTimestampRef.current === null) {
      breakEndTimestampRef.current = Date.now() + latestRef.current.breakSecondsRemaining * 1000;
    }

    const tickBreak = () => {
      if (breakEndTimestampRef.current === null) return;
      const remaining = Math.max(0, Math.ceil((breakEndTimestampRef.current - Date.now()) / 1000));
      if (remaining !== latestRef.current.breakSecondsRemaining) {
        setBreakSecondsRemaining(remaining);
      }
      if (remaining <= 0) {
        breakEndTimestampRef.current = null;
        setIsBreakRunning(false);
        setBreakSecondsRemaining(0);
        if (soundEnabled) {
          playChimeSound();
        }
      }
    };

    const handleBreakTabReturn = () => {
      if (!document.hidden) {
        tickBreak();
      }
    };

    const intervalId = window.setInterval(tickBreak, 250);
    document.addEventListener('visibilitychange', handleBreakTabReturn);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleBreakTabReturn);
    };
  }, [isBreakRunning, finishStep, soundEnabled]);

  // Save without pausing on tab switch; auto-pause & save ONLY when closing/reloading screen
  useEffect(() => {
    const handleVisibilitySave = () => {
      if (document.hidden) {
        const snap = latestRef.current;
        if (snap.isActive && snap.finishStep === 'active') {
          const remaining = computeCurrentFocusRemaining();
          saveTimerProgress(buildDraftSnapshot(true, remaining));
          hadDraftOnOpenRef.current = true;
        }
      }
    };

    const handlePageExit = () => {
      pauseAndPersist();
    };

    document.addEventListener('visibilitychange', handleVisibilitySave);
    window.addEventListener('pagehide', handlePageExit);
    window.addEventListener('beforeunload', handlePageExit);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilitySave);
      window.removeEventListener('pagehide', handlePageExit);
      window.removeEventListener('beforeunload', handlePageExit);
    };
  }, [buildDraftSnapshot, computeCurrentFocusRemaining, pauseAndPersist, saveTimerProgress]);

  // Live countdown in browser tab title
  useEffect(() => {
    const originalTitle = document.title;
    return () => {
      document.title = originalTitle;
    };
  }, []);

  useEffect(() => {
    if (finishStep === 'active') {
      if (isActive) {
        document.title = `${formatTimerClock(secondsRemaining)} · ${task.subjectName}`;
      } else if (secondsRemaining < totalSeconds) {
        document.title = `⏸ ${formatTimerClock(secondsRemaining)} · ${task.subjectName}`;
      } else {
        document.title = `${task.subjectName} · Foco`;
      }
    } else if (finishStep === 'break') {
      document.title = `☕ ${formatTimerClock(breakSecondsRemaining)} · Pausa`;
    } else {
      document.title = `Concluir · ${task.subjectName}`;
    }
  }, [
    finishStep,
    isActive,
    secondsRemaining,
    totalSeconds,
    breakSecondsRemaining,
    task.subjectName,
  ]);

  const handleStartFocus = () => {
    if (soundEnabled) {
      unlockAudioContext();
    }
    setIsEditingTime(false);
    const currentRem = latestRef.current.secondsRemaining;
    focusEndTimestampRef.current = Date.now() + currentRem * 1000;
    setIsActive(true);
    saveTimerProgress(buildDraftSnapshot(true, currentRem));
    hadDraftOnOpenRef.current = true;
  };

  const handlePauseFocus = () => {
    pauseAndPersist();
  };

  const handleResetTimer = () => {
    focusEndTimestampRef.current = null;
    setIsActive(false);
    setIsEditingTime(false);
    setSecondsRemaining(totalSeconds);
    setCapturedFocusMinutes(null);
    hadDraftOnOpenRef.current = false;
    clearTimerDraft(task.id);
  };

  const handleCloseModal = () => {
    stopChimeSound();
    const remaining = computeCurrentFocusRemaining();
    focusEndTimestampRef.current = null;
    breakEndTimestampRef.current = null;
    setIsActive(false);
    setIsBreakRunning(false);

    const detailsChanged =
      pareiEmValue !== (task.pareiEm || matchedSubject?.pareiEm || '') ||
      cadernoQuestoesValue !== (task.cadernoQuestoes || matchedSubject?.cadernoQuestoes || '') ||
      exercisesDone !== (task.exercisesDone || 0) ||
      exercisesCorrect !== (task.exercisesCorrect || 0) ||
      notes !== (task.notes || '');

    const hasProgress =
      remaining < totalSeconds ||
      totalSeconds !== defaultPlannedSeconds ||
      detailsChanged ||
      hadDraftOnOpenRef.current ||
      finishStep !== 'active';

    if (hasProgress) {
      saveTimerProgress(buildDraftSnapshot(false, remaining));
    } else {
      clearTimerDraft(task.id);
    }

    onClose();
  };

  const adjustMinutes = (deltaMinutes: number) => {
    const currentTotalMinutes = editHours * 60 + editMinutes;
    const nextTotalMinutes = Math.max(1, currentTotalMinutes + deltaMinutes);
    setEditHours(Math.floor(nextTotalMinutes / 60));
    setEditMinutes(nextTotalMinutes % 60);
  };

  const applyManualTimeEdit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const safeH = Math.max(0, Number(editHours) || 0);
    const safeM = Math.max(0, Math.min(59, Number(editMinutes) || 0));
    const totalMins = safeH * 60 + safeM;
    if (totalMins <= 0) return;

    const newSec = totalMins * 60;
    focusEndTimestampRef.current = null;
    setIsActive(false);
    setTotalSeconds(newSec);
    setSecondsRemaining(newSec);
    setIsEditingTime(false);

    if (hadDraftOnOpenRef.current || newSec !== defaultPlannedSeconds) {
      saveTimerProgress(buildDraftSnapshot(false, newSec, newSec));
      hadDraftOnOpenRef.current = true;
    }
  };

  const openTimeEditor = () => {
    const remaining = computeCurrentFocusRemaining();
    if (isActive) {
      pauseAndPersist();
    }
    setEditHours(Math.floor(remaining / 3600));
    setEditMinutes(Math.floor((remaining % 3600) / 60));
    setIsEditingTime(true);
  };

  const actualMinutes =
    capturedFocusMinutes ??
    Math.max(1, Math.round((totalSeconds - secondsRemaining) / 60));

  const handleOpenSummary = () => {
    const remaining = computeCurrentFocusRemaining();
    focusEndTimestampRef.current = null;
    setIsActive(false);
    setSecondsRemaining(remaining);
    setCapturedFocusMinutes(Math.max(1, Math.round((totalSeconds - remaining) / 60)));
    setBreakDurationMinutes(configuredBreakMinutes);
    saveTimerProgress(buildDraftSnapshot(false, remaining));
    hadDraftOnOpenRef.current = true;
    setFinishStep('summary');
  };

  const handleStartManualBreak = () => {
    if (soundEnabled) {
      unlockAudioContext();
    }
    stopChimeSound();
    const mins = Math.min(60, Math.max(1, breakDurationMinutes));
    const secs = mins * 60;
    setBreakTotalSeconds(secs);
    setBreakSecondsRemaining(secs);
    breakEndTimestampRef.current = Date.now() + secs * 1000;
    setIsBreakRunning(true);
    setFinishStep('break');
  };

  const handleConfirmCompletion = () => {
    stopChimeSound();
    if (task.subjectId) {
      if (pareiEmValue.trim()) {
        updateSubjectSpreadsheetField(task.subjectId, 'pareiEm', pareiEmValue.trim());
      }
      if (cadernoQuestoesValue.trim()) {
        updateSubjectSpreadsheetField(task.subjectId, 'cadernoQuestoes', cadernoQuestoesValue.trim());
      }
    }

    completeStudySession({
      taskId: task.id,
      durationMinutes: actualMinutes > 0 ? actualMinutes : Math.round(totalSeconds / 60),
      exercisesDone,
      exercisesCorrect: Math.min(exercisesDone, exercisesCorrect),
      notes: notes.trim()
        ? `${notes.trim()}\n[Parei em: ${pareiEmValue.trim() || 'N/A'}]`
        : pareiEmValue.trim()
        ? `[Parei em: ${pareiEmValue.trim()}]`
        : '',
      performanceRating: selectedRating,
    });
  };

  // Ring geometry
  const ringSize = 224;
  const strokeWidth = 8;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const focusRemainingFraction =
    totalSeconds > 0 ? Math.max(0, Math.min(1, secondsRemaining / totalSeconds)) : 1;
  const focusDashOffset = circumference * (1 - focusRemainingFraction);

  const breakRemainingFraction =
    breakTotalSeconds > 0
      ? Math.max(0, Math.min(1, breakSecondsRemaining / breakTotalSeconds))
      : 0;
  const breakDashOffset = circumference * (1 - breakRemainingFraction);

  const ringAccentColor = resolveRingColor(task.subjectColor);
  const plannedMinutesDisplay = Math.max(1, Math.round(totalSeconds / 60));
  const hasStarted = secondsRemaining < totalSeconds || Boolean(matchingDraft);

  const timerStatusLabel = isActive ? 'EM FOCO' : hasStarted ? 'PAUSADO' : 'PLANEJADO';

  // Single concise descriptive line (no automatic 3-step roteiro)
  const hasDistinctTopic =
    task.topicName &&
    task.topicName.trim().toLowerCase() !== task.subjectName.trim().toLowerCase();
  const singleLineSummary = hasDistinctTopic
    ? task.topicName
    : `${methodPreset.shortName} · Pausa ${configuredBreakMinutes} min`;

  const detailsFilledCount =
    (pareiEmValue.trim() ? 1 : 0) +
    (cadernoQuestoesValue.trim() ? 1 : 0) +
    (exercisesDone > 0 ? 1 : 0) +
    (notes.trim() ? 1 : 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/65 p-3 sm:p-5 backdrop-blur-sm">
      <div className="relative flex w-full max-w-md flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl transition-colors duration-200 dark:border-slate-800 dark:bg-[#0b1121] max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)]">
        {/* Minimal Pinned Header (Subject on left, Sound & Close X on right) */}
        <div className="flex shrink-0 items-center justify-between gap-2 px-5 pt-4 pb-2">
          <div className="flex min-w-0 items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: finishStep === 'break' ? '#10b981' : ringAccentColor }}
            />
            <span className="truncate font-bold text-stone-800 dark:text-slate-100">
              {finishStep === 'summary'
                ? 'Sessão finalizada'
                : finishStep === 'break'
                ? 'Pausa programada'
                : task.subjectName}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) {
                  unlockAudioContext();
                } else {
                  stopChimeSound();
                }
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
              title={soundEnabled ? 'Silenciar alarme de conclusão' : 'Ativar alarme de conclusão'}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={handleCloseModal}
              className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition"
              title="Pausar e fechar (seu tempo fica salvo)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-6 pt-1 sm:px-7">
          {/* STEP 1: MINIMALIST CIRCULAR FOCUS TIMER */}
          {finishStep === 'active' && (
            <div className="flex flex-col items-center text-center">
              {/* Type + 1 simple line */}
              <div className="space-y-1 max-w-xs">
                <p className="text-[11px] font-extrabold tracking-widest text-stone-500 dark:text-slate-400">
                  {TASK_TYPE_LABEL[task.type] || 'ESTUDO'}
                </p>
                <p className="text-sm font-bold text-stone-800 dark:text-slate-100 truncate">
                  {singleLineSummary}
                </p>
                {pareiEmValue && !showDetails && (
                  <p className="inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-cyan-400 max-w-full truncate">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{pareiEmValue}</span>
                  </p>
                )}
              </div>

              {/* Circular SVG Ring + Click-to-Edit Timer */}
              <div className="relative my-5 flex items-center justify-center">
                <svg
                  width={ringSize}
                  height={ringSize}
                  viewBox={`0 0 ${ringSize} ${ringSize}`}
                  className="-rotate-90 select-none"
                >
                  <circle
                    cx={ringSize / 2}
                    cy={ringSize / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-stone-200 dark:text-slate-800"
                  />
                  <circle
                    cx={ringSize / 2}
                    cy={ringSize / 2}
                    r={radius}
                    fill="none"
                    stroke={ringAccentColor}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={focusDashOffset}
                    className="transition-[stroke-dashoffset] duration-300 ease-out"
                  />
                </svg>

                {/* Center Content inside Ring */}
                <div className="absolute inset-0 flex flex-col items-center justify-center px-5">
                  {isEditingTime ? (
                    <form
                      onSubmit={applyManualTimeEdit}
                      className="flex flex-col items-center gap-2"
                    >
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="12"
                          value={editHours}
                          onChange={(e) => setEditHours(Math.max(0, Number(e.target.value) || 0))}
                          className="w-12 rounded-lg border border-stone-300 bg-stone-50 py-1 text-center font-mono text-xl font-black tabular-nums text-stone-900 outline-hidden focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                          aria-label="Horas"
                        />
                        <span className="font-mono text-lg font-black text-stone-400">:</span>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={editMinutes}
                          onChange={(e) =>
                            setEditMinutes(Math.max(0, Math.min(59, Number(e.target.value) || 0)))
                          }
                          className="w-12 rounded-lg border border-stone-300 bg-stone-50 py-1 text-center font-mono text-xl font-black tabular-nums text-stone-900 outline-hidden focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                          aria-label="Minutos"
                        />
                      </div>

                      <div className="flex items-center gap-1 text-[10px] font-bold tabular-nums">
                        <button
                          type="button"
                          onClick={() => adjustMinutes(-5)}
                          className="rounded-md border border-stone-200 px-1.5 py-0.5 text-stone-600 hover:bg-stone-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          -5m
                        </button>
                        <button
                          type="button"
                          onClick={() => adjustMinutes(5)}
                          className="rounded-md border border-stone-200 px-1.5 py-0.5 text-stone-600 hover:bg-stone-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          +5m
                        </button>
                        <button
                          type="button"
                          onClick={() => adjustMinutes(15)}
                          className="rounded-md border border-stone-200 px-1.5 py-0.5 text-stone-600 hover:bg-stone-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          +15m
                        </button>
                      </div>

                      <div className="flex items-center gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => setIsEditingTime(false)}
                          className="text-[11px] font-semibold text-stone-400 hover:text-stone-700 dark:hover:text-slate-200"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-indigo-700"
                        >
                          Aplicar
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={openTimeEditor}
                      className="group flex flex-col items-center rounded-2xl px-3 py-2 hover:bg-stone-100/70 dark:hover:bg-slate-800/40 transition"
                      title="Toque no tempo para ajustar"
                    >
                      <span className="font-mono tabular-nums text-4xl sm:text-[42px] font-black leading-none tracking-tight text-stone-900 dark:text-white">
                        {formatTimerClock(secondsRemaining)}
                      </span>
                      <span
                        className={`mt-2 text-[10px] font-bold tracking-[0.2em] transition-colors ${
                          isActive
                            ? 'text-indigo-600 dark:text-cyan-400'
                            : hasStarted
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-stone-400 group-hover:text-indigo-600 dark:text-slate-500 dark:group-hover:text-cyan-400'
                        }`}
                      >
                        {timerStatusLabel}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Subtle Status / Remaining Note */}
              <p className="text-xs font-medium text-stone-500 dark:text-slate-400 tabular-nums">
                {hasStarted
                  ? `${formatTimerClock(secondsRemaining)} restantes de ${plannedMinutesDisplay} min`
                  : `Toque no tempo para editar · ${plannedMinutesDisplay} min planejado`}
              </p>

              {/* Primary Action Controls */}
              <div className="mt-5 flex w-full items-center justify-center gap-2.5">
                {!hasStarted && !isActive ? (
                  <button
                    type="button"
                    onClick={handleStartFocus}
                    className="flex w-full max-w-[230px] items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-xs font-extrabold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition whitespace-nowrap shrink-0"
                  >
                    <Play className="h-3.5 w-3.5 fill-white" />
                    <span>Iniciar Sessão</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleResetTimer}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition shrink-0"
                      title="Reiniciar e descartar rascunho"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={isActive ? handlePauseFocus : handleStartFocus}
                      className={`flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-xs font-extrabold text-white shadow-sm active:scale-95 transition whitespace-nowrap shrink-0 ${
                        isActive
                          ? 'bg-amber-600 hover:bg-amber-700'
                          : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      {isActive ? (
                        <>
                          <Pause className="h-3.5 w-3.5 fill-white" />
                          <span>Pausar</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5 fill-white" />
                          <span>Continuar</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenSummary}
                      className="flex items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition whitespace-nowrap shrink-0"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Concluir</span>
                    </button>
                  </>
                )}
              </div>

              {/* Discreet Toggle for Optional Session Details */}
              <button
                type="button"
                onClick={() => setShowDetails((prev) => !prev)}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white transition"
              >
                <span>{showDetails ? 'Ocultar detalhes' : 'Detalhes'}</span>
                {detailsFilledCount > 0 && !showDetails && (
                  <span className="tabular-nums text-[11px] font-bold text-indigo-600 dark:text-cyan-400">
                    ({detailsFilledCount})
                  </span>
                )}
                {showDetails ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>

              {/* Collapsible Details Drawer (Hidden by Default) */}
              {showDetails && (
                <div className="mt-4 w-full border-t border-stone-200 pt-4 text-left dark:border-slate-800 space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="flex items-center gap-1.5 text-[11px] font-bold text-stone-600 dark:text-slate-300 mb-1">
                        <MapPin className="h-3 w-3 text-indigo-500 dark:text-cyan-400" />
                        <span>Onde parou (PAREI)</span>
                      </label>
                      <input
                        type="text"
                        value={pareiEmValue}
                        onChange={(e) => setPareiEmValue(e.target.value)}
                        placeholder="Ex: aula 1.6..."
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-900 outline-hidden focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 text-[11px] font-bold text-stone-600 dark:text-slate-300 mb-1">
                        <FileText className="h-3 w-3 text-indigo-500 dark:text-cyan-400" />
                        <span>Caderno de questões</span>
                      </label>
                      <input
                        type="text"
                        value={cadernoQuestoesValue}
                        onChange={(e) => setCadernoQuestoesValue(e.target.value)}
                        placeholder="Ex: questão 40..."
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-900 outline-hidden focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  {/* Exercise Counters */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50/70 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/60">
                      <span className="text-[11px] font-semibold text-stone-600 dark:text-slate-300">
                        Questões
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const nextDone = Math.max(0, exercisesDone - 1);
                            setExercisesDone(nextDone);
                            setExercisesCorrect((prev) => Math.min(nextDone, prev));
                          }}
                          className="rounded border border-stone-200 p-0.5 text-stone-500 hover:bg-white dark:border-slate-700 dark:text-slate-400"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold tabular-nums text-stone-900 dark:text-white">
                          {exercisesDone}
                        </span>
                        <button
                          type="button"
                          onClick={() => setExercisesDone(exercisesDone + 1)}
                          className="rounded border border-stone-200 p-0.5 text-stone-500 hover:bg-white dark:border-slate-700 dark:text-slate-400"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50/70 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/60">
                      <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                        Acertos
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setExercisesCorrect(Math.max(0, exercisesCorrect - 1))}
                          className="rounded border border-stone-200 p-0.5 text-stone-500 hover:bg-white dark:border-slate-700 dark:text-slate-400"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                          {exercisesCorrect}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setExercisesCorrect(Math.min(exercisesDone, exercisesCorrect + 1))
                          }
                          className="rounded border border-stone-200 p-0.5 text-stone-500 hover:bg-white dark:border-slate-700 dark:text-slate-400"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quick Notes */}
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 dark:text-slate-300 mb-1">
                      Nota rápida
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Anotação curta para revisão..."
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-xs text-stone-900 outline-hidden focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: UNIFIED 1-STEP COMPLETION SCREEN */}
          {finishStep === 'summary' && (
            <div className="py-2 space-y-4">
              <div className="text-center space-y-1">
                <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <p className="text-base font-black text-stone-900 dark:text-white tabular-nums">
                  {actualMinutes} min estudados em {task.subjectName}
                </p>
                <p className="text-xs text-stone-500 dark:text-slate-400">
                  Confira ou ajuste os dados antes de salvar.
                </p>
              </div>

              <div className="space-y-3 text-left">
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-stone-600 dark:text-slate-300 mb-1">
                    <MapPin className="h-3 w-3 text-indigo-500 dark:text-cyan-400" />
                    <span>Onde você parou (salva na planilha)</span>
                  </label>
                  <input
                    type="text"
                    value={pareiEmValue}
                    onChange={(e) => setPareiEmValue(e.target.value)}
                    placeholder="Ex: aula 1.6 - vértice da parábola..."
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-900 outline-hidden focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 dark:text-slate-300 mb-1">
                      Questões feitas
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={999}
                      value={exercisesDone}
                      onChange={(e) => {
                        const val = Math.max(0, Number(e.target.value) || 0);
                        setExercisesDone(val);
                        setExercisesCorrect((prev) => Math.min(val, prev));
                      }}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-bold tabular-nums text-stone-900 outline-hidden focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                      Acertos
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={exercisesDone}
                      value={exercisesCorrect}
                      onChange={(e) =>
                        setExercisesCorrect(
                          Math.min(exercisesDone, Math.max(0, Number(e.target.value) || 0))
                        )
                      }
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-bold tabular-nums text-emerald-700 outline-hidden focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-emerald-400"
                    />
                  </div>
                </div>

                <div>
                  <span className="block text-[11px] font-bold text-stone-600 dark:text-slate-300 mb-1.5">
                    Como foi o estudo?
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRating('dificil')}
                      className={`rounded-xl border px-2.5 py-2 text-center transition ${
                        selectedRating === 'dificil'
                          ? 'border-rose-400 bg-rose-50 dark:border-rose-700 dark:bg-rose-950/60 ring-2 ring-rose-400/25'
                          : 'border-stone-200 bg-white hover:bg-stone-50 dark:border-slate-800 dark:bg-slate-900'
                      }`}
                    >
                      <span className="block text-xs font-bold text-rose-700 dark:text-rose-300">
                        Difícil
                      </span>
                      <span className="block text-[10px] text-stone-500 dark:text-slate-400">
                        Revisar antes
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedRating('medio')}
                      className={`rounded-xl border px-2.5 py-2 text-center transition ${
                        selectedRating === 'medio'
                          ? 'border-amber-400 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/60 ring-2 ring-amber-400/25'
                          : 'border-stone-200 bg-white hover:bg-stone-50 dark:border-slate-800 dark:bg-slate-900'
                      }`}
                    >
                      <span className="block text-xs font-bold text-amber-700 dark:text-amber-300">
                        Médio
                      </span>
                      <span className="block text-[10px] text-stone-500 dark:text-slate-400">
                        Ritmo bom
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedRating('facil')}
                      className={`rounded-xl border px-2.5 py-2 text-center transition ${
                        selectedRating === 'facil'
                          ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/60 ring-2 ring-emerald-400/25'
                          : 'border-stone-200 bg-white hover:bg-stone-50 dark:border-slate-800 dark:bg-slate-900'
                      }`}
                    >
                      <span className="block text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        Fácil
                      </span>
                      <span className="block text-[10px] text-stone-500 dark:text-slate-400">
                        Dominado
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Optional Break Shortcut */}
              <button
                type="button"
                onClick={handleStartManualBreak}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-950/50 transition"
              >
                <Coffee className="h-3.5 w-3.5" />
                <span>Fazer pausa de {breakDurationMinutes} min antes</span>
              </button>

              {/* Final Footer Actions */}
              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setFinishStep('active')}
                  className="flex-1 rounded-full border border-stone-200 py-2.5 text-xs font-bold text-stone-600 hover:bg-stone-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCompletion}
                  className="flex-1 rounded-full bg-indigo-600 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition"
                >
                  Salvar e Fechar
                </button>
              </div>
            </div>
          )}

          {/* OPTIONAL STEP: GREEN CIRCULAR BREAK RING */}
          {finishStep === 'break' && (
            <div className="flex flex-col items-center text-center py-2">
              <p className="text-[11px] font-extrabold tracking-widest text-emerald-600 dark:text-emerald-400">
                {breakSecondsRemaining === 0 ? 'PAUSA CONCLUÍDA' : 'INTERVALO'}
              </p>

              <div className="relative my-5 flex items-center justify-center">
                <svg
                  width={ringSize}
                  height={ringSize}
                  viewBox={`0 0 ${ringSize} ${ringSize}`}
                  className="-rotate-90 select-none"
                >
                  <circle
                    cx={ringSize / 2}
                    cy={ringSize / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-emerald-100 dark:text-emerald-950/60"
                  />
                  <circle
                    cx={ringSize / 2}
                    cy={ringSize / 2}
                    r={radius}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={breakDashOffset}
                    className="transition-[stroke-dashoffset] duration-300 ease-out"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-mono tabular-nums text-4xl font-black leading-none tracking-tight text-emerald-700 dark:text-emerald-300">
                    {formatTimerClock(breakSecondsRemaining)}
                  </span>
                  <span className="mt-2 text-[10px] font-bold tracking-[0.2em] text-stone-400 dark:text-slate-500">
                    DESCANSO
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {breakSecondsRemaining > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (isBreakRunning) {
                        const rem =
                          breakEndTimestampRef.current !== null
                            ? Math.max(
                                0,
                                Math.ceil((breakEndTimestampRef.current - Date.now()) / 1000)
                              )
                            : breakSecondsRemaining;
                        breakEndTimestampRef.current = null;
                        setBreakSecondsRemaining(rem);
                        setIsBreakRunning(false);
                      } else {
                        breakEndTimestampRef.current = Date.now() + breakSecondsRemaining * 1000;
                        setIsBreakRunning(true);
                      }
                    }}
                    className="rounded-full border border-stone-200 bg-stone-50 px-5 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 transition"
                  >
                    {isBreakRunning ? 'Pausar pausa' : 'Retomar'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    breakEndTimestampRef.current = null;
                    setIsBreakRunning(false);
                    setFinishStep('summary');
                  }}
                  className="rounded-full bg-indigo-600 px-6 py-2.5 text-xs font-extrabold text-white hover:bg-indigo-700 transition"
                >
                  {breakSecondsRemaining === 0 ? 'Concluir sessão' : 'Voltar para concluir'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
