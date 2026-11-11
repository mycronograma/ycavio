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
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { StudyProfileType } from '../../types';
import { getLevelProgress } from '../../services/scheduleEngine';
import { useTheme, ThemeMode } from '../../context/ThemeContext';

interface ProfileViewProps {
  onOpenOnboarding: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onOpenOnboarding }) => {
  const {
    state,
    updateProfile,
    exportDataJSON,
    importDataJSON,
    resetAllData,
  } = useStudy();
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
  const [selectedDays, setSelectedDays] = useState<number[]>(profile.availableDays);
  const [profileType, setProfileType] = useState<StudyProfileType>(profile.profileType);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importError, setImportError] = useState(false);

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

  const toggleDay = (dayIndex: number) => {
    if (selectedDays.includes(dayIndex)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter((d) => d !== dayIndex));
      }
    } else {
      setSelectedDays([...selectedDays, dayIndex].sort());
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: name.trim() || 'Estudante',
      objective: objective.trim(),
      targetExam: targetExam.trim(),
      examDate: hasExamDate ? (examDate || undefined) : undefined,
      targetTotalHours: !hasExamDate ? targetTotalHours : undefined,
      dailyAvailableMinutes: dailyMinutes,
      preferredSessionLength: sessionLength,
      availableDays: selectedDays,
      profileType,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleExport = () => {
    const dataStr = exportDataJSON();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trilha-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
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
        setTimeout(() => setImportError(false), 3000);
      } else {
        alert('Dados importados com sucesso!');
      }
    };
    reader.readAsText(file);
  };

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

      {/* Theme Appearance Card */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs dark:border-stone-800 dark:bg-stone-900 space-y-4">
        <div>
          <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
            Aparência & Tema
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Escolha como o Trilha deve ser exibido. Suas preferências são salvas automaticamente no seu navegador.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
              theme === 'light'
                ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20 dark:bg-indigo-950/50'
                : 'border-stone-200 bg-stone-50/50 hover:bg-stone-100 dark:border-stone-800 dark:bg-stone-800/40 dark:hover:bg-stone-800'
            }`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
              <Sun className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-sm font-bold text-stone-900 dark:text-stone-100">
                Modo Claro
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400">
                Visual limpo e luminoso
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
              theme === 'dark'
                ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20 dark:border-indigo-500 dark:bg-indigo-950/50'
                : 'border-stone-200 bg-stone-50/50 hover:bg-stone-100 dark:border-stone-800 dark:bg-stone-800/40 dark:hover:bg-stone-800'
            }`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/60 dark:text-indigo-400">
              <Moon className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-sm font-bold text-stone-900 dark:text-stone-100">
                Modo Escuro
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400">
                Confortável para noites de estudo
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme('system')}
            className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
              theme === 'system'
                ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20 dark:border-indigo-500 dark:bg-indigo-950/50'
                : 'border-stone-200 bg-stone-50/50 hover:bg-stone-100 dark:border-stone-800 dark:bg-stone-800/40 dark:hover:bg-stone-800'
            }`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400">
              <Monitor className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-sm font-bold text-stone-900 dark:text-stone-100">
                Seguir Sistema
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400">
                Sincroniza com seu aparelho
              </span>
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
                Tempo Disponível por Dia
              </label>
              <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                {Math.floor(dailyMinutes / 60)}h {dailyMinutes % 60 > 0 ? `${dailyMinutes % 60}m` : ''}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[60, 90, 120, 180].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDailyMinutes(mins)}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    dailyMinutes === mins
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-750'
                  }`}
                >
                  {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
              Dias da Semana de Estudo
            </label>
            <div className="grid grid-cols-7 gap-1.5">
              {weekDays.map((d) => {
                const isChecked = selectedDays.includes(d.index);
                return (
                  <button
                    key={d.index}
                    type="button"
                    onClick={() => toggleDay(d.index)}
                    className={`flex flex-col items-center justify-center py-2.5 rounded-xl border text-xs font-bold transition ${
                      isChecked
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-600/20 dark:border-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-300 dark:ring-indigo-500/30'
                        : 'border-stone-200 text-stone-400 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-500 dark:hover:bg-stone-800'
                    }`}
                  >
                    <span>{d.label}</span>
                    <span className="text-[10px] mt-0.5">{isChecked ? '✓' : '—'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
              Duração Padrão do Bloco de Foco
            </label>
            <select
              value={sessionLength}
              onChange={(e) => setSessionLength(Number(e.target.value))}
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm text-stone-900 outline-hidden focus:border-indigo-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:focus:border-indigo-400"
            >
              <option value={25}>25 minutos (Pomodoro)</option>
              <option value={45}>45 minutos</option>
              <option value={50}>50 minutos (Recomendado)</option>
              <option value={60}>60 minutos (Aprofundado)</option>
            </select>
          </div>

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
          Seus dados são salvos com segurança de forma local e podem ser exportados a qualquer momento.
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

          <button
            type="button"
            onClick={() => {
              if (confirm('Tem certeza? Isso apagará todas as tarefas e matérias para você configurar do zero.')) {
                resetAllData();
                onOpenOnboarding();
              }
            }}
            className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/70"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Resetar Todos os Dados</span>
          </button>
        </div>

        {importError && (
          <div className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 mt-2">
            <AlertCircle className="h-4 w-4" />
            <span>Arquivo inválido. Certifique-se de que é um backup do Trilha.</span>
          </div>
        )}
      </div>
    </div>
  );
};
