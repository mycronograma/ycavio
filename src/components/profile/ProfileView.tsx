import React, { useState } from 'react';
import {
  UserCheck,
  Save,
  Clock,
  Calendar,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  Flame,
  Award,
  Check,
  AlertCircle,
  Sun,
  Moon,
  Monitor,
  Shield,
  ShieldCheck,
  KeyRound,
  Zap,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { useToast } from '../../context/ToastContext';
import { StudyProfileType, StudyMethodId } from '../../types';
import { getLevelProgress, getTodayStr } from '../../services/scheduleEngine';
import { StudyMethodPreset } from '../../services/studyMethods';
import { StudyMethodSelector } from '../common/StudyMethodSelector';
import { useTheme } from '../../context/ThemeContext';
import { FixedScheduleModal } from '../schedule/FixedScheduleModal';
import { LoginModal } from '../auth/LoginModal';

interface ProfileViewProps {
  onOpenOnboarding: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onOpenOnboarding }) => {
  const {
    state,
    updateProfile,
    useStreakFreeze,
    exportDataJSON,
    importDataJSON,
    resetAllData,
  } = useStudy();
  const { showToast } = useToast();
  const { profile } = state;
  const { theme, setTheme } = useTheme();

  const [name, setName] = useState(profile.name);
  const [objective, setObjective] = useState(profile.objective);
  const [targetExam, setTargetExam] = useState(profile.targetExam || '');
  const [hasExamDate, setHasExamDate] = useState(!!profile.examDate);
  const [examDate, setExamDate] = useState(profile.examDate || '');
  const [targetTotalHours, setTargetTotalHours] = useState(profile.targetTotalHours || 200);
  const [dailyMinutes, setDailyMinutes] = useState(profile.dailyAvailableMinutes);
  const [sessionLength, setSessionLength] = useState(profile.preferredSessionLength);
  const [breakLength, setBreakLength] = useState(profile.preferredBreakLength ?? 10);
  const [studyMethod, setStudyMethod] = useState<StudyMethodId>(
    profile.studyMethod || 'blocos_50_10'
  );
  const [selectedDays, setSelectedDays] = useState<number[]>(profile.availableDays);

  const formatMinutesToHM = (totalMins: number): string => {
    const safe = Math.max(0, Math.round(totalMins));
    const h = Math.floor(safe / 60);
    const m = safe % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const parseHMInput = (raw: string, finalize = false): number | null => {
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
  };

  const buildInitialDayMap = () => {
    const map: Record<number, number> = {};
    for (let i = 0; i < 7; i++) {
      map[i] = profile.dailyMinutesByDay?.[i] ?? profile.dailyAvailableMinutes ?? 120;
    }
    return map;
  };

  const [dailyMinutesByDay, setDailyMinutesByDay] = useState<Record<number, number>>(
    buildInitialDayMap
  );
  const [dayHoursInputs, setDayHoursInputs] = useState<Record<number, string>>(() => {
    const initial = buildInitialDayMap();
    return {
      0: formatMinutesToHM(initial[0]),
      1: formatMinutesToHM(initial[1]),
      2: formatMinutesToHM(initial[2]),
      3: formatMinutesToHM(initial[3]),
      4: formatMinutesToHM(initial[4]),
      5: formatMinutesToHM(initial[5]),
      6: formatMinutesToHM(initial[6]),
    };
  });

  const [profileType, setProfileType] = useState<StudyProfileType>(profile.profileType);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importError, setImportError] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const [isFixedModalOpen, setIsFixedModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const levelProgress = getLevelProgress(profile.xp);

  const weekDays = [
    { label: 'Dom', index: 0 },
    { label: 'Seg', index: 1 },
    { label: 'Ter', index: 2 },
    { label: 'Qua', index: 3 },
    { label: 'Qui', index: 4 },
    { label: 'Sex', index: 5 },
    { label: 'Sáb', index: 6 },
  ];

  const applyBaseMinutesToAllDays = (mins: number) => {
    const safeMins = Math.min(960, Math.max(15, mins));
    const map: Record<number, number> = {};
    const inputs: Record<number, string> = {};
    for (let i = 0; i < 7; i++) {
      map[i] = safeMins;
      inputs[i] = formatMinutesToHM(safeMins);
    }
    setDailyMinutes(safeMins);
    setDailyMinutesByDay(map);
    setDayHoursInputs(inputs);
  };

  const handleDayHoursChange = (dayIndex: number, rawValue: string) => {
    const sanitized = rawValue.replace(/[^\d:]/g, '').slice(0, 5);
    setDayHoursInputs((prev) => ({ ...prev, [dayIndex]: sanitized }));
    const parsed = parseHMInput(sanitized, false);
    if (parsed !== null) {
      setDailyMinutesByDay((prev) => ({ ...prev, [dayIndex]: parsed }));
    }
  };

  const handleDayHoursBlur = (dayIndex: number) => {
    const parsed = parseHMInput(dayHoursInputs[dayIndex] || '', true);
    const finalMins = parsed ?? dailyMinutesByDay[dayIndex] ?? dailyMinutes;
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

  const weeklyTotalMinutes = selectedDays.reduce(
    (sum, d) => sum + (dailyMinutesByDay[d] ?? dailyMinutes),
    0
  );
  const weeklyHoursFormatted = formatMinutesToHM(weeklyTotalMinutes);
  const allActiveMatchBase = selectedDays.every(
    (d) => (dailyMinutesByDay[d] ?? dailyMinutes) === dailyMinutes
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const activeMap: Partial<Record<number, number>> = {};
    let totalActive = 0;
    selectedDays.forEach((d) => {
      const m = Math.max(15, dailyMinutesByDay[d] ?? dailyMinutes);
      activeMap[d] = m;
      totalActive += m;
    });
    const avgDailyMinutes = Math.max(
      15,
      Math.round(totalActive / Math.max(1, selectedDays.length))
    );
    setDailyMinutes(avgDailyMinutes);

    updateProfile({
      name: name.trim() || 'Estudante',
      objective: objective.trim(),
      targetExam: targetExam.trim(),
      examDate: hasExamDate ? (examDate || undefined) : undefined,
      targetTotalHours: !hasExamDate ? targetTotalHours : undefined,
      dailyAvailableMinutes: avgDailyMinutes,
      dailyMinutesByDay: activeMap,
      preferredSessionLength: sessionLength,
      preferredBreakLength: breakLength,
      studyMethod,
      availableDays: selectedDays,
      profileType,
    });
    setSaveSuccess(true);
    showToast('Configurações salvas e cronograma atualizado!', 'success');
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleExport = () => {
    const dataStr = exportDataJSON();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `my-cronograma-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Backup exportado em JSON!', 'success');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importDataJSON(content);
      if (!success) {
        setImportError(true);
        showToast('Arquivo de backup inválido.', 'error');
        setTimeout(() => setImportError(false), 3000);
      } else {
        setImportSuccess(true);
        showToast('Backup restaurado com sucesso!', 'success');
        setTimeout(() => setImportSuccess(false), 3000);
      }
    };
    reader.readAsText(file);
  };

  const handleUseStreakFreeze = () => {
    const res = useStreakFreeze();
    showToast(res.message, res.ok ? 'success' : 'info');
  };

  const todayStr = getTodayStr();
  const freezeAvailable = profile.freezeStreakCount ?? 0;
  const isProtectedToday = profile.lastActiveDate === todayStr;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-xs dark:border-stone-800 dark:bg-stone-900 transition-colors">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <span>Perfil & Configuração de Rotina</span>
          </h2>
          <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
            Ajuste seus horários, data da prova e configurações de inteligência
          </p>
        </div>

        {/* Level summary pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700 dark:text-stone-300 bg-stone-50 dark:bg-stone-800 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700">
            <Award className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>Nível {levelProgress.currentLevel} ({profile.xp} XP)</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-900/50">
            <Flame className="h-4 w-4 fill-amber-500 text-amber-500" />
            <span>{profile.streakDays} dias</span>
          </div>
        </div>
      </div>

      {/* Streak Freeze (Proteção de Sequência) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-xs dark:border-stone-800 dark:bg-stone-900">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
                Escudo de Sequência (Streak Freeze)
              </h3>
              <span className="text-xs font-bold text-indigo-600 dark:text-cyan-400 tabular-nums">
                {freezeAvailable} {freezeAvailable === 1 ? 'disponível' : 'disponíveis'}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
              Não consegue estudar hoje? Use um escudo para proteger sua sequência de{' '}
              <strong className="text-stone-700 dark:text-stone-200 tabular-nums">
                {profile.streakDays} {profile.streakDays === 1 ? 'dia' : 'dias'}
              </strong>{' '}
              sem perder o ritmo.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleUseStreakFreeze}
          disabled={freezeAvailable <= 0 || isProtectedToday || (profile.streakDays || 0) <= 0}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 disabled:opacity-50 disabled:pointer-events-none dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200 dark:hover:bg-amber-900/60 transition whitespace-nowrap shrink-0"
        >
          <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span>
            {isProtectedToday
              ? 'Garantido hoje'
              : freezeAvailable > 0
              ? 'Ativar Escudo Hoje'
              : 'Sem escudos'}
          </span>
        </button>
      </div>

      {/* Theme Appearance Card */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs dark:border-stone-800 dark:bg-stone-900 space-y-4">
        <div>
          <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
            Aparência & Tema
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Escolha entre o estilo Gamer, Minimalista ou siga automaticamente as cores do seu sistema.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* 1. Gamer (Claro / Escuro) */}
          {(() => {
            const isGamerActive = theme === 'neon' || theme === 'neon-light';
            return (
              <div
                onClick={() => {
                  if (!isGamerActive) {
                    setTheme(theme === 'light' ? 'neon-light' : 'neon');
                  }
                }}
                className={`flex flex-col justify-between gap-3 rounded-2xl border p-4 text-left transition cursor-pointer ${
                  isGamerActive
                    ? 'border-cyan-500 bg-cyan-50/70 ring-2 ring-cyan-400/25 dark:border-cyan-400 dark:bg-cyan-950/35'
                    : 'border-stone-200 bg-stone-50/50 hover:bg-stone-100 dark:border-stone-800 dark:bg-stone-800/40 dark:hover:bg-stone-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600 border border-cyan-300/60 dark:bg-cyan-500/15 dark:text-cyan-400 dark:border-cyan-400/30">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-stone-900 dark:text-stone-100">
                      Gamer Neon
                    </span>
                    <span className="text-xs text-stone-500 dark:text-stone-400">
                      Bordas e brilho ciano/roxo
                    </span>
                  </div>
                </div>

                <div
                  className="grid grid-cols-2 gap-1.5 rounded-xl bg-stone-200/70 p-1 dark:bg-stone-900/80"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => setTheme('neon-light')}
                    className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition ${
                      theme === 'neon-light'
                        ? 'bg-white text-cyan-700 shadow-xs ring-1 ring-cyan-400/60'
                        : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200'
                    }`}
                  >
                    <Sun className="h-3.5 w-3.5" />
                    <span>Claro</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('neon')}
                    className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition ${
                      theme === 'neon'
                        ? 'bg-stone-950 text-cyan-300 shadow-xs ring-1 ring-cyan-400/60'
                        : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200'
                    }`}
                  >
                    <Moon className="h-3.5 w-3.5" />
                    <span>Escuro</span>
                  </button>
                </div>
              </div>
            );
          })()}

          {/* 2. Minimalista (Claro / Escuro) */}
          {(() => {
            const isMinimalActive = theme === 'light' || theme === 'dark';
            return (
              <div
                onClick={() => {
                  if (!isMinimalActive) {
                    setTheme(theme === 'neon-light' ? 'light' : 'dark');
                  }
                }}
                className={`flex flex-col justify-between gap-3 rounded-2xl border p-4 text-left transition cursor-pointer ${
                  isMinimalActive
                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20 dark:border-indigo-500 dark:bg-indigo-950/50'
                    : 'border-stone-200 bg-stone-50/50 hover:bg-stone-100 dark:border-stone-800 dark:bg-stone-800/40 dark:hover:bg-stone-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/60 dark:text-indigo-400">
                    {theme === 'light' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-stone-900 dark:text-stone-100">
                      Minimalista
                    </span>
                    <span className="text-xs text-stone-500 dark:text-stone-400">
                      Visual limpo tradicional
                    </span>
                  </div>
                </div>

                <div
                  className="grid grid-cols-2 gap-1.5 rounded-xl bg-stone-200/70 p-1 dark:bg-stone-900/80"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition ${
                      theme === 'light'
                        ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-indigo-500/40'
                        : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200'
                    }`}
                  >
                    <Sun className="h-3.5 w-3.5" />
                    <span>Claro</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition ${
                      theme === 'dark'
                        ? 'bg-stone-900 text-indigo-300 shadow-xs ring-1 ring-indigo-500/50'
                        : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200'
                    }`}
                  >
                    <Moon className="h-3.5 w-3.5" />
                    <span>Escuro</span>
                  </button>
                </div>
              </div>
            );
          })()}

          {/* 3. Sistema */}
          <button
            type="button"
            onClick={() => setTheme('system')}
            className={`flex flex-col justify-between gap-3 rounded-2xl border p-4 text-left transition ${
              theme === 'system'
                ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20 dark:border-indigo-500 dark:bg-indigo-950/50'
                : 'border-stone-200 bg-stone-50/50 hover:bg-stone-100 dark:border-stone-800 dark:bg-stone-800/40 dark:hover:bg-stone-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400">
                <Monitor className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-sm font-bold text-stone-900 dark:text-stone-100">
                  Sistema
                </span>
                <span className="text-xs text-stone-500 dark:text-stone-400">
                  Sincroniza com seu aparelho
                </span>
              </div>
            </div>

            <div
              className={`flex items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-bold transition ${
                theme === 'system'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-stone-200/70 text-stone-600 dark:bg-stone-900/80 dark:text-stone-400'
              }`}
            >
              {theme === 'system' ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Ativo</span>
                </>
              ) : (
                <span>Seguir automático</span>
              )}
            </div>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Student Profile Info */}
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs space-y-4 dark:border-stone-800 dark:bg-stone-900">
          <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
            Informações do Estudante
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Nome
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm text-stone-900 outline-hidden focus:border-indigo-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:focus:border-indigo-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Perfil de Estudo
              </label>
              <select
                value={profileType}
                onChange={(e) => setProfileType(e.target.value as StudyProfileType)}
                className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm text-stone-900 outline-hidden focus:border-indigo-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
              >
                <option value="iniciante">Estudante Iniciante</option>
                <option value="vestibulando">Vestibulando / ENEM</option>
                <option value="concurseiro">Concurseiro</option>
                <option value="pouco_tempo">Pouco Tempo</option>
                <option value="procrastinador">Procrastinador (Foco curto)</option>
                <option value="desorganizado">Precisa de rotina disciplinada</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Prova ou Foco Principal
              </label>
              <input
                type="text"
                value={targetExam}
                onChange={(e) => setTargetExam(e.target.value)}
                placeholder="Ex: ENEM 2026, Receita Federal, OAB..."
                className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm text-stone-900 outline-hidden focus:border-indigo-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:focus:border-indigo-400"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                  {hasExamDate ? 'Data Prevista da Prova' : 'Meta de Horas Totais'}
                </label>
                <label className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={hasExamDate}
                    onChange={(e) => setHasExamDate(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  Tenho data
                </label>
              </div>
              {hasExamDate ? (
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm text-stone-900 outline-hidden focus:border-indigo-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:focus:border-indigo-400"
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
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm text-stone-900 outline-hidden focus:border-indigo-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 font-bold"
                  />
                  <span className="text-xs font-bold text-stone-500 dark:text-stone-400 shrink-0">
                    horas totais
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Routine & Schedule Settings */}
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs space-y-5 dark:border-stone-800 dark:bg-stone-900">
          <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
            Rotina & Disponibilidade
          </h3>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                Tempo Padrão por Dia (Aplicar a todos)
              </label>
              <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums">
                Total: {weeklyHoursFormatted}/sem
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[60, 90, 120, 180, 240].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => applyBaseMinutesToAllDays(mins)}
                  className={`py-2 rounded-xl text-xs font-bold tabular-nums border transition ${
                    allActiveMatchBase && dailyMinutes === mins
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-750'
                  }`}
                >
                  {formatMinutesToHM(mins)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                Horas por Dia da Semana (H:M)
              </label>
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                Clique no dia para ativar/folga
              </span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {weekDays.map((d) => {
                const isChecked = selectedDays.includes(d.index);
                return (
                  <div
                    key={d.index}
                    className={`flex flex-col rounded-xl border overflow-hidden transition ${
                      isChecked
                        ? 'border-indigo-600 bg-indigo-50/40 dark:border-indigo-500 dark:bg-indigo-950/30'
                        : 'border-stone-200 bg-stone-50 opacity-75 dark:border-stone-800 dark:bg-stone-900/50'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleDay(d.index)}
                      className={`flex items-center justify-center gap-1 py-1.5 text-xs transition ${
                        isChecked
                          ? 'bg-indigo-600 text-white font-extrabold'
                          : 'bg-stone-100 text-stone-500 font-semibold hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700'
                      }`}
                    >
                      <span>{d.label}</span>
                      <span className="text-[10px]">{isChecked ? '✓' : '—'}</span>
                    </button>

                    <div className="p-1.5 flex items-center justify-center">
                      {isChecked ? (
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={5}
                          placeholder="02:00"
                          aria-label={`Tempo disponível em ${d.label} (H:M)`}
                          value={dayHoursInputs[d.index] ?? '02:00'}
                          onChange={(e) => handleDayHoursChange(d.index, e.target.value)}
                          onBlur={() => handleDayHoursBlur(d.index)}
                          className="w-full min-w-0 rounded-lg border border-stone-300 bg-white px-1.5 py-1 text-center text-xs font-extrabold text-stone-900 tabular-nums outline-hidden focus:border-indigo-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleDay(d.index)}
                          className="w-full py-1 text-center text-[11px] font-medium text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300"
                        >
                          Folga
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <StudyMethodSelector
            studyMethod={studyMethod}
            focusMinutes={sessionLength}
            breakMinutes={breakLength}
            onChangeMethod={(methodId, preset: StudyMethodPreset) => {
              setStudyMethod(methodId);
              if (methodId !== 'personalizado') {
                setSessionLength(preset.focusMinutes);
                setBreakLength(preset.breakMinutes);
              }
            }}
            onChangeFocusMinutes={setSessionLength}
            onChangeBreakMinutes={setBreakLength}
          />

          <div className="pt-2 flex items-center justify-between">
            {saveSuccess ? (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <Check className="h-4 w-4" />
                Configurações salvas e cronograma recalculado!
              </span>
            ) : (
              <div />
            )}

            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition"
            >
              <Save className="h-4 w-4" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </div>
      </form>

      {/* Data Management & Onboarding Reset */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs space-y-4 dark:border-stone-800 dark:bg-stone-900">
        <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
          Gerenciamento de Dados & Backup
        </h3>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Seus dados ficam salvos automaticamente na sua conta e também podem ser exportados ou restaurados via arquivo JSON.
        </p>

        <div className="flex flex-wrap gap-3 pt-1">
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-50 shadow-xs dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-750"
          >
            <Download className="h-4 w-4" />
            <span>Exportar Backup (JSON)</span>
          </button>

          <label className="flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-50 shadow-xs cursor-pointer dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-750">
            <Upload className="h-4 w-4" />
            <span>Restaurar Backup</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={onOpenOnboarding}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-950/70"
          >
            <Sparkles className="h-4 w-4" />
            <span>Refazer Onboarding Inicial</span>
          </button>

          {confirmReset ? (
            <div className="flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs dark:border-rose-900/60 dark:bg-rose-950/50">
              <span className="font-bold text-rose-800 dark:text-rose-200">
                Zerar matérias, XP e dias?
              </span>
              <button
                type="button"
                onClick={() => {
                  resetAllData();
                  setConfirmReset(false);
                  showToast('Dados resetados. Vamos recomeçar!', 'info');
                  onOpenOnboarding();
                }}
                className="rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-rose-700"
              >
                Confirmar
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="rounded-lg px-2 py-1 text-[11px] font-semibold text-stone-600 hover:bg-stone-200 dark:text-stone-300 dark:hover:bg-stone-800"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/70"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Resetar Todos os Dados</span>
            </button>
          )}
        </div>

        {importSuccess && (
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            <Check className="h-4 w-4" />
            <span>Backup importado e restaurado com sucesso!</span>
          </div>
        )}

        {importError && (
          <div className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 mt-2">
            <AlertCircle className="h-4 w-4" />
            <span>Arquivo inválido. Certifique-se de que é um backup do my cronograma.</span>
          </div>
        )}
      </div>

      {/* Account & Fixed Schedule Card */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs space-y-4 dark:border-stone-800 dark:bg-stone-900">
        <div>
          <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <span>Minha Conta &amp; Grade Fixa</span>
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Gerencie sua conta de acesso e bloqueie horários fixos de trabalho ou faculdade
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setIsFixedModalOpen(true)}
            className="flex flex-col items-start gap-1 rounded-xl border border-stone-200 bg-stone-50 p-4 text-left hover:bg-stone-100 dark:border-stone-800 dark:bg-stone-800/60 transition"
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-extrabold text-xs text-stone-900 dark:text-stone-100">Grade Fixa</span>
              <Shield className="h-4 w-4 text-indigo-500" />
            </div>
            <span className="text-[11px] text-stone-500 dark:text-stone-400">Bloquear trabalho / faculdade</span>
          </button>

          <button
            type="button"
            onClick={() => setIsLoginModalOpen(true)}
            className="flex flex-col items-start gap-1 rounded-xl border border-stone-200 bg-stone-50 p-4 text-left hover:bg-stone-100 dark:border-stone-800 dark:bg-stone-800/60 transition"
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-extrabold text-xs text-stone-900 dark:text-stone-100">Minha Conta</span>
              <KeyRound className="h-4 w-4 text-indigo-500" />
            </div>
            <span className="text-[11px] text-stone-500 dark:text-stone-400">Dados de acesso e sessão</span>
          </button>
        </div>
      </div>

      <FixedScheduleModal
        isOpen={isFixedModalOpen}
        onClose={() => setIsFixedModalOpen(false)}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
};
