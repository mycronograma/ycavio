import React, { useState, useEffect } from 'react';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Trash2,
  X,
  Plus,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { STUDY_PRESETS } from '../../services/storageService';
import {
  Subject,
  StudyProfileType,
  SubjectDifficulty,
  KnowledgeLevel,
  StudyMethodId,
} from '../../types';
import { addDays, getTodayStr } from '../../services/scheduleEngine';
import {
  STUDY_METHODS,
  FOCUS_PRESET_MINUTES,
  BREAK_PRESET_MINUTES,
  getStudyMethodPreset,
  formatMethodProportionLabel,
} from '../../services/studyMethods';
import { WeeklyLoadLevel } from '../subjects/PresetSelector';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted?: () => void;
  initialPresetId?: string | null;
  initialWeeklyLoad?: WeeklyLoadLevel;
}

interface DraftSubject {
  id: string;
  name: string;
  color: string;
  weight: number;
  difficulty: SubjectDifficulty;
  knowledgeLevel: KnowledgeLevel;
  topics: string[];
  moduleId?: string;
}

function getMinutesForLoad(load?: WeeklyLoadLevel): number {
  if (load === 'normal') return 240; // 4h
  if (load === 'intensivo') return 360; // 6h
  return 120; // 2h (leve)
}

function getDaysForLoad(load?: WeeklyLoadLevel): number[] {
  if (load === 'intensivo') return [1, 2, 3, 4, 5, 6]; // Seg-Sáb
  return [1, 2, 3, 4, 5]; // Seg-Sex
}

function formatMinutesToHM(totalMins: number): string {
  const safe = Math.max(0, Math.round(totalMins));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function parseHMInput(raw: string, finalize = false): number | null {
  const clean = raw.replace(/[^\d:]/g, '').trim();
  if (!clean) return null;

  if (clean.includes(':')) {
    const [hStr, mStr = ''] = clean.split(':');
    if (!finalize && mStr.length < 2) return null;
    const h = parseInt(hStr || '0', 10);
    const paddedM = mStr.length === 1 ? `${mStr}0` : mStr;
    const m = parseInt(paddedM || '0', 10);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    const clampedM = Math.min(59, Math.max(0, m));
    const total = h * 60 + clampedM;
    if (total <= 0) return null;
    return Math.min(960, Math.max(15, total));
  }

  if (clean.length >= 3) {
    if (!finalize) return null;
    const h = parseInt(clean.slice(0, -2), 10);
    const m = Math.min(59, parseInt(clean.slice(-2), 10));
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    const total = h * 60 + m;
    return total > 0 ? Math.min(960, Math.max(15, total)) : null;
  }

  const h = parseInt(clean, 10);
  if (Number.isNaN(h) || h <= 0) return null;
  return Math.min(960, Math.max(15, h * 60));
}

function buildDayMap(mins: number): Record<number, number> {
  return { 0: mins, 1: mins, 2: mins, 3: mins, 4: mins, 5: mins, 6: mins };
}

function buildDayInputMap(dayMap: Record<number, number>): Record<number, string> {
  return {
    0: formatMinutesToHM(dayMap[0] ?? 120),
    1: formatMinutesToHM(dayMap[1] ?? 120),
    2: formatMinutesToHM(dayMap[2] ?? 120),
    3: formatMinutesToHM(dayMap[3] ?? 120),
    4: formatMinutesToHM(dayMap[4] ?? 120),
    5: formatMinutesToHM(dayMap[5] ?? 120),
    6: formatMinutesToHM(dayMap[6] ?? 120),
  };
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onCompleted,
  initialPresetId,
  initialWeeklyLoad = 'leve' as WeeklyLoadLevel,
}) => {
  const { state, completeOnboarding } = useStudy();

  const [step, setStep] = useState(1);
  const totalSteps = 7;

  const [selectedPresetId, setSelectedPresetId] = useState(initialPresetId || 'enem');
  const [weeklyLoad, setWeeklyLoad] = useState<WeeklyLoadLevel>(initialWeeklyLoad);
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);

  // Step 1: Content Level
  const [contentLevel, setContentLevel] = useState<KnowledgeLevel>('intermediario');

  // Step 2: Goal & Date
  const [targetExam, setTargetExam] = useState('ENEM');
  const [hasExamDate, setHasExamDate] = useState(true);
  const [examDate, setExamDate] = useState(addDays(getTodayStr(), 120));
  const [targetTotalHours, setTargetTotalHours] = useState(200);

  // Step 3: Availability (Days & H:M)
  const initialMins = getMinutesForLoad(initialWeeklyLoad);
  const [dailyMinutes, setDailyMinutes] = useState(initialMins);
  const [selectedDays, setSelectedDays] = useState<number[]>(getDaysForLoad(initialWeeklyLoad));
  const [dailyMinutesByDay, setDailyMinutesByDay] = useState<Record<number, number>>(() =>
    buildDayMap(initialMins)
  );
  const [dayHoursInputs, setDayHoursInputs] = useState<Record<number, string>>(() =>
    buildDayInputMap(buildDayMap(initialMins))
  );

  // Step 4 & 5: Study Method, Block Focus, Break Duration & Profile Type
  const [studyMethod, setStudyMethod] = useState<StudyMethodId>('blocos_50_10');
  const [sessionLength, setSessionLength] = useState(50);
  const [breakLength, setBreakLength] = useState(10);
  const [focusInputStr, setFocusInputStr] = useState('50');
  const [breakInputStr, setBreakInputStr] = useState('10');
  const [profileType, setProfileType] = useState<StudyProfileType>('vestibulando');

  // Step 6: Subjects
  const [subjectsList, setSubjectsList] = useState<DraftSubject[]>([]);
  const [newSubName, setNewSubName] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const currentPreset = STUDY_PRESETS.find((p) => p.id === selectedPresetId) || STUDY_PRESETS[0];

  useEffect(() => {
    setFocusInputStr(String(sessionLength));
  }, [sessionLength]);

  useEffect(() => {
    setBreakInputStr(String(breakLength));
  }, [breakLength]);

  // Sync modal state whenever opened with a selected preset & load
  useEffect(() => {
    if (!isOpen) return;

    const presetId = initialPresetId || 'enem';
    const preset = STUDY_PRESETS.find((p) => p.id === presetId) || STUDY_PRESETS[0];
    const load: WeeklyLoadLevel = initialWeeklyLoad || 'leve';
    const loadMins = getMinutesForLoad(load);
    const dayMap = buildDayMap(loadMins);

    setStep(1);
    setValidationError(null);
    setSelectedPresetId(preset.id);
    setWeeklyLoad(load);
    setSelectedModuleIds([]);
    setTargetExam(preset.id === 'personalizado' ? 'Meu Cronograma Personalizado' : preset.name);
    setExamDate(addDays(getTodayStr(), preset.defaultExamOffsetDays));
    setDailyMinutes(loadMins);
    setSelectedDays(getDaysForLoad(load));
    setDailyMinutesByDay(dayMap);
    setDayHoursInputs(buildDayInputMap(dayMap));

    const currentMethod = state.profile.studyMethod || 'blocos_50_10';
    const methodDefaults = getStudyMethodPreset(currentMethod);
    const initialFocus = state.profile.preferredSessionLength || methodDefaults.focusMinutes;
    const initialBreak = state.profile.preferredBreakLength ?? methodDefaults.breakMinutes;

    setStudyMethod(currentMethod);
    setSessionLength(initialFocus);
    setBreakLength(initialBreak);
    setFocusInputStr(String(initialFocus));
    setBreakInputStr(String(initialBreak));
    setProfileType(
      preset.id === 'concurso_geral' || preset.id === 'oab' ? 'concurseiro' : 'vestibulando'
    );

    setSubjectsList(
      preset.subjects.map((s, idx) => ({
        id: `sub-${Date.now()}-${idx + 1}`,
        name: s.name,
        color: s.color,
        weight: s.weight,
        difficulty: s.difficulty,
        knowledgeLevel: s.knowledgeLevel,
        topics: s.topics,
      }))
    );
  }, [
    isOpen,
    initialPresetId,
    initialWeeklyLoad,
    state.profile.studyMethod,
    state.profile.preferredSessionLength,
    state.profile.preferredBreakLength,
  ]);

  const handleToggleModule = (modId: string) => {
    const mod = currentPreset.modules?.find((m) => m.id === modId);
    if (!mod) return;

    const isSelected = selectedModuleIds.includes(modId);
    if (isSelected) {
      setSelectedModuleIds((prev) => prev.filter((id) => id !== modId));
      setSubjectsList((prev) => prev.filter((s) => s.moduleId !== modId));
    } else {
      setSelectedModuleIds((prev) => [...prev, modId]);
      const added: DraftSubject[] = mod.subjects.map((s, idx) => ({
        id: `sub-mod-${modId}-${Date.now()}-${idx}`,
        name: s.name,
        color: s.color,
        weight: s.weight,
        difficulty: s.difficulty,
        knowledgeLevel: contentLevel,
        topics: s.topics,
        moduleId: modId,
      }));
      setSubjectsList((prev) => [...prev, ...added]);
    }
  };

  const handleToggleAllModules = () => {
    const modules = currentPreset.modules || [];
    if (modules.length === 0) return;

    const allSelected = modules.every((m) => selectedModuleIds.includes(m.id));
    if (allSelected) {
      setSelectedModuleIds([]);
      setSubjectsList((prev) => prev.filter((s) => !s.moduleId));
    } else {
      const missingModules = modules.filter((m) => !selectedModuleIds.includes(m.id));
      const newIds = modules.map((m) => m.id);
      const stamp = Date.now();
      const added: DraftSubject[] = missingModules.flatMap((mod, mIdx) =>
        mod.subjects.map((s, sIdx) => ({
          id: `sub-mod-${mod.id}-${stamp}-${mIdx}-${sIdx}`,
          name: s.name,
          color: s.color,
          weight: s.weight,
          difficulty: s.difficulty,
          knowledgeLevel: contentLevel,
          topics: s.topics,
          moduleId: mod.id,
        }))
      );
      setSelectedModuleIds(newIds);
      setSubjectsList((prev) => [...prev, ...added]);
    }
  };

  const applyBaseMinutesToAllDays = (mins: number) => {
    const safeMins = Math.min(960, Math.max(15, mins));
    const map = buildDayMap(safeMins);
    setDailyMinutes(safeMins);
    setDailyMinutesByDay(map);
    setDayHoursInputs(buildDayInputMap(map));
    setValidationError(null);
  };

  const handleDayHoursChange = (dayIndex: number, rawValue: string) => {
    const sanitized = rawValue.replace(/[^\d:]/g, '').slice(0, 5);
    setDayHoursInputs((prev) => ({ ...prev, [dayIndex]: sanitized }));
    const parsedMins = parseHMInput(sanitized, false);
    if (parsedMins !== null) {
      setDailyMinutesByDay((prev) => ({ ...prev, [dayIndex]: parsedMins }));
      setValidationError(null);
    }
  };

  const handleDayHoursBlur = (dayIndex: number) => {
    const parsedMins = parseHMInput(dayHoursInputs[dayIndex] || '', true);
    const finalMins = parsedMins ?? dailyMinutesByDay[dayIndex] ?? dailyMinutes;
    setDailyMinutesByDay((prev) => ({ ...prev, [dayIndex]: finalMins }));
    setDayHoursInputs((prev) => ({ ...prev, [dayIndex]: formatMinutesToHM(finalMins) }));
  };

  const toggleDay = (dayIndex: number) => {
    if (selectedDays.includes(dayIndex)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter((d) => d !== dayIndex));
      }
    } else {
      setSelectedDays([...selectedDays, dayIndex].sort());
      if (!dailyMinutesByDay[dayIndex]) {
        const fallback = Math.max(15, dailyMinutes);
        setDailyMinutesByDay((prev) => ({ ...prev, [dayIndex]: fallback }));
        setDayHoursInputs((prev) => ({ ...prev, [dayIndex]: formatMinutesToHM(fallback) }));
      }
    }
  };

  const handleFocusInputChange = (raw: string) => {
    const clean = raw.replace(/\D/g, '').slice(0, 3);
    setFocusInputStr(clean);
    if (clean !== '') {
      const parsed = parseInt(clean, 10);
      if (!Number.isNaN(parsed) && parsed >= 10) {
        setSessionLength(Math.min(240, parsed));
      }
    }
  };

  const handleFocusInputBlur = () => {
    const parsed = parseInt(focusInputStr, 10);
    const finalVal = Number.isNaN(parsed) ? sessionLength : Math.min(240, Math.max(10, parsed));
    setSessionLength(finalVal);
    setFocusInputStr(String(finalVal));
  };

  const handleBreakInputChange = (raw: string) => {
    const clean = raw.replace(/\D/g, '').slice(0, 2);
    setBreakInputStr(clean);
    if (clean !== '') {
      const parsed = parseInt(clean, 10);
      if (!Number.isNaN(parsed) && parsed >= 1) {
        setBreakLength(Math.min(60, parsed));
      }
    }
  };

  const handleBreakInputBlur = () => {
    const parsed = parseInt(breakInputStr, 10);
    const finalVal = Number.isNaN(parsed) ? breakLength : Math.min(60, Math.max(1, parsed));
    setBreakLength(finalVal);
    setBreakInputStr(String(finalVal));
  };

  const updateSubjectField = (
    id: string,
    field: 'weight' | 'difficulty' | 'knowledgeLevel',
    value: any
  ) => {
    setSubjectsList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleRemoveSubject = (id: string) => {
    setSubjectsList((prev) => prev.filter((s) => s.id !== id));
  };

  const handleAddCustomSubject = () => {
    if (!newSubName.trim()) return;
    const colors = ['#6366f1', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
    const randomColor = colors[subjectsList.length % colors.length];

    setSubjectsList((prev) => [
      ...prev,
      {
        id: `sub-custom-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        name: newSubName.trim(),
        color: randomColor,
        weight: 3,
        difficulty: 'media',
        knowledgeLevel: contentLevel,
        topics: [],
      },
    ]);
    setNewSubName('');
    setValidationError(null);
  };

  const handleNextStep = () => {
    if (step === 3) {
      const hasValidDays = selectedDays.every(
        (d) => (dailyMinutesByDay[d] ?? dailyMinutes) >= 15
      );
      if (!hasValidDays) {
        setValidationError('Defina pelo menos 00:15 em cada dia ativo (ex.: 02:00 ou 01:30).');
        return;
      }
    }
    if (step === 6 && subjectsList.length === 0) {
      setValidationError('Adicione pelo menos 1 matéria para gerar seu cronograma.');
      return;
    }
    setValidationError(null);
    setStep((s) => Math.min(totalSteps, s + 1));
  };

  const handleFinish = () => {
    if (subjectsList.length === 0) {
      setValidationError('Adicione pelo menos 1 matéria antes de gerar o cronograma.');
      setStep(6);
      return;
    }

    const finalSubjects: Subject[] = subjectsList.map((s) => ({
      id: s.id,
      name: s.name,
      color: s.color,
      weight: s.weight,
      difficulty: s.difficulty,
      knowledgeLevel: s.knowledgeLevel,
      topics: s.topics.map((tName, tIdx) => ({
        id: `top-${s.id}-${tIdx + 1}`,
        name: tName,
        completed: false,
      })),
      totalMinutesStudied: 0,
      completedTasksCount: 0,
      totalExercisesDone: 0,
      totalExercisesCorrect: 0,
      ciclo: 0,
      revisaoNotes: '',
      cadernoQuestoes: '',
      pareiEm: '',
      concluida: false,
    }));

    const activeDayMap: Partial<Record<number, number>> = {};
    let totalActiveMins = 0;
    selectedDays.forEach((d) => {
      const mins = Math.max(15, dailyMinutesByDay[d] ?? dailyMinutes);
      activeDayMap[d] = mins;
      totalActiveMins += mins;
    });
    const avgDailyMinutes = Math.max(
      15,
      Math.round(totalActiveMins / Math.max(1, selectedDays.length))
    );

    completeOnboarding(
      {
        name: state.profile.name || state.currentUser?.name || 'Estudante',
        objective: currentPreset.name,
        targetExam: targetExam.trim() || currentPreset.name,
        examDate: hasExamDate ? examDate : undefined,
        targetTotalHours: !hasExamDate ? targetTotalHours : undefined,
        profileType,
        dailyAvailableMinutes: avgDailyMinutes,
        dailyMinutesByDay: activeDayMap,
        availableDays: selectedDays,
        preferredSessionLength: sessionLength,
        preferredBreakLength: breakLength,
        studyMethod,
        weeklyLoad,
        presetChosen: true,
      },
      finalSubjects
    );

    onCompleted?.();
    onClose();
  };

  if (!isOpen) return null;

  const weekDays = [
    { label: 'Dom', index: 0 },
    { label: 'Seg', index: 1 },
    { label: 'Ter', index: 2 },
    { label: 'Qua', index: 3 },
    { label: 'Qui', index: 4 },
    { label: 'Sex', index: 5 },
    { label: 'Sáb', index: 6 },
  ];

  const weeklyTotalMinutes = selectedDays.reduce(
    (sum, d) => sum + (dailyMinutesByDay[d] ?? dailyMinutes),
    0
  );
  const weeklyHoursFormatted = formatMinutesToHM(weeklyTotalMinutes);
  const avgDayMinutes = Math.round(weeklyTotalMinutes / Math.max(1, selectedDays.length));
  const formattedAvgDailyTime = formatMinutesToHM(avgDayMinutes);
  const allActiveMatchBase = selectedDays.every(
    (d) => (dailyMinutesByDay[d] ?? dailyMinutes) === dailyMinutes
  );

  const selectedMethodPreset = getStudyMethodPreset(studyMethod);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-3 sm:p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-2xl dark:border-slate-800/90 dark:bg-[#0b1121] dark:text-slate-100 overflow-hidden my-auto">
        {/* Minimalist Header (matching reference screenshot) */}
        <div className="flex items-center justify-between px-6 sm:px-7 pt-5 pb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="block text-[11px] font-bold tracking-wider uppercase text-indigo-600 dark:text-indigo-400">
                PASSO {step} DE {totalSteps}
              </span>
              <span className="block text-sm font-black uppercase tracking-wide text-slate-900 dark:text-white truncate">
                {currentPreset.name}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800/70 dark:hover:text-slate-200 transition"
            title="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Thin Full-Bleed Progress Hairline */}
        <div className="h-[2px] w-full bg-slate-200 dark:bg-slate-800/90 shrink-0">
          <div
            className="h-full bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500 transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {/* Step Content Area */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-7 py-6">
          {/* STEP 1: Content Level (Clean vertical radio cards) */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Qual seu nível no conteúdo?
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Isso muda o ritmo do começo: quem está começando leva mais teoria no início.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    id: 'iniciante' as const,
                    title: 'Começando agora',
                    desc: 'Nunca estudei esse conteúdo ou faz muito tempo.',
                  },
                  {
                    id: 'intermediario' as const,
                    title: 'Já sei o básico',
                    desc: 'Estudei antes, mas ainda travo em bastante coisa.',
                  },
                  {
                    id: 'avancado' as const,
                    title: 'Domino a maior parte',
                    desc: 'Só quero manter o ritmo e revisar o que falta.',
                  },
                ].map((lvl) => {
                  const isSelected = contentLevel === lvl.id;
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => {
                        setContentLevel(lvl.id);
                        setSubjectsList((prev) =>
                          prev.map((s) => ({ ...s, knowledgeLevel: lvl.id }))
                        );
                      }}
                      className={`w-full flex items-center justify-between gap-4 rounded-2xl border p-4 text-left transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/35 ring-1 ring-indigo-500/70'
                          : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <span className="block text-sm font-bold text-slate-900 dark:text-white">
                          {lvl.title}
                        </span>
                        <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                          {lvl.desc}
                        </span>
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Goal, Exam Date / Hours & Optional Modules */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Qual é a sua meta?
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Personalize seu objetivo e defina quando quer estar preparado.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Prova ou objetivo
                  </label>
                  <input
                    type="text"
                    value={targetExam}
                    onChange={(e) => setTargetExam(e.target.value)}
                    placeholder="Ex: ENEM 2026, Concurso DF..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-hidden focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {hasExamDate ? 'Data da prova' : 'Meta de horas totais'}
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasExamDate}
                        onChange={(e) => setHasExamDate(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      Tenho data definida
                    </label>
                  </div>

                  {hasExamDate ? (
                    <input
                      type="date"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-hidden focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="10"
                        max="5000"
                        step="10"
                        value={targetTotalHours}
                        onChange={(e) => setTargetTotalHours(Math.max(1, Number(e.target.value)))}
                        placeholder="Ex: 200"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-bold text-slate-900 outline-hidden focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100 tabular-nums"
                      />
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                        horas totais
                      </span>
                    </div>
                  )}
                </div>

                {/* Optional Modules across structured presets */}
                {currentPreset.modules && currentPreset.modules.length > 0 && (
                  <div className="pt-1">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Módulos e matérias opcionais
                      </label>
                      <button
                        type="button"
                        onClick={handleToggleAllModules}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition whitespace-nowrap"
                      >
                        {currentPreset.modules.every((m) => selectedModuleIds.includes(m.id))
                          ? 'Desmarcar opcionais'
                          : 'Selecionar todas opcionais'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                      {currentPreset.modules.map((mod) => {
                        const isChecked = selectedModuleIds.includes(mod.id);
                        return (
                          <button
                            key={mod.id}
                            type="button"
                            onClick={() => handleToggleModule(mod.id)}
                            className={`flex items-start gap-2.5 rounded-xl border p-2.5 text-left transition ${
                              isChecked
                                ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/35'
                                : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-slate-700'
                            }`}
                          >
                            <div
                              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                isChecked
                                  ? 'border-indigo-500 bg-indigo-600 text-white'
                                  : 'border-slate-400 dark:border-slate-600'
                              }`}
                            >
                              {isChecked && <Check className="h-3 w-3" />}
                            </div>
                            <div className="min-w-0">
                              <span className="block text-xs font-bold text-slate-900 dark:text-slate-100">
                                {mod.name}
                              </span>
                              <span className="block text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                                {mod.description}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Daily Time & Weekdays */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Quando e quanto você estuda?
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Escolha seu tempo diário ou personalize cada dia da semana.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Tempo padrão por dia
                  </span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                    {allActiveMatchBase ? formattedAvgDailyTime : `Média ${formattedAvgDailyTime}/dia`}
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {[
                    { label: '01:00', mins: 60 },
                    { label: '01:30', mins: 90 },
                    { label: '02:00', mins: 120 },
                    { label: '03:00', mins: 180 },
                    { label: '04:00', mins: 240 },
                  ].map((item) => {
                    const isSelected = allActiveMatchBase && dailyMinutes === item.mins;
                    return (
                      <button
                        key={item.mins}
                        type="button"
                        onClick={() => applyBaseMinutesToAllDays(item.mins)}
                        className={`py-2.5 rounded-xl text-xs font-bold tabular-nums border transition ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-600 text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Dias ativos (H:M)
                  </span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                    {weeklyHoursFormatted}/sem
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  {weekDays.map((d) => {
                    const isChecked = selectedDays.includes(d.index);
                    return (
                      <div
                        key={d.index}
                        className={`flex flex-col rounded-xl border overflow-hidden transition ${
                          isChecked
                            ? 'border-indigo-500/80 bg-indigo-50/40 dark:bg-indigo-950/20'
                            : 'border-slate-200 bg-slate-50 opacity-70 dark:border-slate-800 dark:bg-slate-900/40'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleDay(d.index)}
                          className={`flex items-center justify-center gap-1 py-1.5 text-xs transition ${
                            isChecked
                              ? 'bg-indigo-600 text-white font-bold'
                              : 'bg-slate-100 text-slate-500 font-medium dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          <span>{d.label}</span>
                        </button>

                        <div className="p-1.5 flex items-center justify-center">
                          {isChecked ? (
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={5}
                              placeholder="02:00"
                              aria-label={`Tempo de estudo em ${d.label} (H:M)`}
                              value={dayHoursInputs[d.index] ?? '02:00'}
                              onChange={(e) => handleDayHoursChange(d.index, e.target.value)}
                              onBlur={() => handleDayHoursBlur(d.index)}
                              className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-1 py-1 text-center text-xs font-bold text-slate-900 tabular-nums outline-hidden focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => toggleDay(d.index)}
                              className="w-full py-1 text-center text-[11px] text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                            >
                              Folga
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {validationError && (
                  <p className="mt-2 text-xs font-semibold text-rose-500">
                    {validationError}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Study Method Picker ("Como você gosta de estudar?") */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Como você gosta de estudar?
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  O método ajusta foco, intervalo e proporção entre teoria, questões e revisão.
                </p>
              </div>

              <div className="space-y-2.5 max-h-[370px] overflow-y-auto pr-1">
                {STUDY_METHODS.map((method) => {
                  const isSelected = studyMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => {
                        setStudyMethod(method.id);
                        if (method.id !== 'personalizado') {
                          setSessionLength(method.focusMinutes);
                          setBreakLength(method.breakMinutes);
                        }
                      }}
                      className={`w-full flex items-center justify-between gap-4 rounded-2xl border p-3.5 text-left transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/35 ring-1 ring-indigo-500/70'
                          : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {method.name}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-snug">
                          {method.shortDesc}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 tabular-nums">
                          <span>
                            {method.id === 'personalizado'
                              ? 'Tempo livre'
                              : `${method.focusMinutes}m foco · ${method.breakMinutes}m pausa`}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{formatMethodProportionLabel(method)}</span>
                        </div>
                      </div>

                      {isSelected && (
                        <Check className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: Block Duration, Break Duration & Profile */}
          {step === 5 && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Duração do bloco e intervalo
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Sugestão do método {selectedMethodPreset.shortName}, ajustável em minutos.
                </p>
              </div>

              {/* Focus Block */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Bloco de foco
                  </span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                    {sessionLength} min
                  </span>
                </div>

                <div className="grid grid-cols-6 gap-1.5">
                  {FOCUS_PRESET_MINUTES.map((mins) => {
                    const selected = sessionLength === mins;
                    return (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setSessionLength(mins)}
                        className={`rounded-xl py-2 text-xs font-bold tabular-nums border transition ${
                          selected
                            ? 'border-indigo-500 bg-indigo-600 text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300'
                        }`}
                      >
                        {mins}m
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Ou defina outro tempo (min)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={focusInputStr}
                      aria-label="Duração do bloco de foco em minutos"
                      onChange={(e) => handleFocusInputChange(e.target.value)}
                      onBlur={handleFocusInputBlur}
                      className="w-20 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-center text-xs font-bold text-slate-900 tabular-nums outline-hidden focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100"
                    />
                    <span className="text-xs text-slate-500 dark:text-slate-400">min</span>
                  </div>
                </div>
              </div>

              {/* Break Duration (5 to 20 min + free input) */}
              <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Duração do intervalo
                  </span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {breakLength} min
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {BREAK_PRESET_MINUTES.map((mins) => {
                    const selected = breakLength === mins;
                    return (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setBreakLength(mins)}
                        className={`rounded-xl py-2 text-xs font-bold tabular-nums border transition ${
                          selected
                            ? 'border-emerald-500 bg-emerald-600 text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300'
                        }`}
                      >
                        {mins} min
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Campo livre em minutos
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={breakInputStr}
                      aria-label="Duração do intervalo em minutos"
                      onChange={(e) => handleBreakInputChange(e.target.value)}
                      onBlur={handleBreakInputBlur}
                      className="w-20 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-center text-xs font-bold text-slate-900 tabular-nums outline-hidden focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100"
                    />
                    <span className="text-xs text-slate-500 dark:text-slate-400">min</span>
                  </div>
                </div>
              </div>

              {/* Study Profile Select */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Seu perfil principal
                </label>
                <select
                  value={profileType}
                  onChange={(e) => setProfileType(e.target.value as StudyProfileType)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-hidden focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100"
                >
                  <option value="vestibulando">Vestibulando / ENEM</option>
                  <option value="concurseiro">Concurseiro Dedicado</option>
                  <option value="iniciante">Estudante Iniciante</option>
                  <option value="pouco_tempo">Pouco Tempo Diário</option>
                  <option value="procrastinador">Procrastinador (Metas Curtas)</option>
                  <option value="desorganizado">Precisa de Ordem e Disciplina</option>
                </select>
              </div>
            </div>
          )}

          {/* STEP 6: Subjects & Weights */}
          {step === 6 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {selectedPresetId === 'personalizado'
                    ? 'Monte suas disciplinas'
                    : 'Disciplinas e pesos'}
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  {selectedPresetId === 'personalizado'
                    ? 'Adicione as matérias do seu estudo e escolha o peso de cada uma.'
                    : 'Ajuste pesos (1–5), remova ou adicione matérias. Você cadastra os tópicos depois em Matérias.'}
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  placeholder="Adicionar nova matéria..."
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 outline-hidden focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomSubject();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddCustomSubject}
                  className="flex items-center gap-1 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Adicionar</span>
                </button>
              </div>

              {validationError && (
                <p className="text-xs font-semibold text-rose-500">{validationError}</p>
              )}

              {subjectsList.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  Nenhuma matéria adicionada ainda. Digite acima para incluir.
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                  {subjectsList.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900/40"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: sub.color }}
                        />
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {sub.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={sub.weight}
                          onChange={(e) =>
                            updateSubjectField(sub.id, 'weight', Number(e.target.value))
                          }
                          className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-bold text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-indigo-300"
                          title="Peso da matéria na prova"
                        >
                          <option value={5}>Peso 5</option>
                          <option value={4}>Peso 4</option>
                          <option value={3}>Peso 3</option>
                          <option value={2}>Peso 2</option>
                          <option value={1}>Peso 1</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => handleRemoveSubject(sub.id)}
                          className="p-1 text-slate-400 hover:text-rose-500 transition"
                          title="Remover matéria"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 7: Final Clean Review */}
          {step === 7 && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Tudo pronto para começar!
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Revise os detalhes da sua rotina antes de gerar o cronograma.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 divide-y divide-slate-200 text-xs dark:border-slate-800 dark:bg-slate-900/40 dark:divide-slate-800/80">
                <div className="flex items-center justify-between p-3.5">
                  <span className="text-slate-500 dark:text-slate-400">Objetivo</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {targetExam || currentPreset.name}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5">
                  <span className="text-slate-500 dark:text-slate-400">Carga semanal</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                    {weeklyHoursFormatted} em {selectedDays.length} dias
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5">
                  <span className="text-slate-500 dark:text-slate-400">Forma de estudo</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedMethodPreset.shortName}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5">
                  <span className="text-slate-500 dark:text-slate-400">Bloco e intervalo</span>
                  <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                    {sessionLength} min foco · {breakLength} min pausa
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5">
                  <span className="text-slate-500 dark:text-slate-400">Disciplinas</span>
                  <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                    {subjectsList.length} matérias
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Clean Minimal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 px-6 sm:px-7 py-4 dark:border-slate-800/80 shrink-0">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => {
                setValidationError(null);
                setStep(step - 1);
              }}
              className="flex items-center gap-1 py-2 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Voltar</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="py-2 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition"
            >
              Cancelar
            </button>
          )}

          {step < totalSteps ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-600 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-indigo-500/25 hover:brightness-110 active:scale-95 transition whitespace-nowrap"
            >
              <span>Continuar</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-600 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-indigo-500/25 hover:brightness-110 active:scale-95 transition whitespace-nowrap"
            >
              <Sparkles className="h-4 w-4" />
              <span>Gerar Meu Cronograma</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
