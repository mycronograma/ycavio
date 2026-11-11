import React, { useState } from 'react';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  BookOpen,
  Calendar,
  Clock,
  Target,
  Plus,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { STUDY_PRESETS } from '../../services/storageService';
import { Subject, StudyProfileType, SubjectDifficulty, KnowledgeLevel } from '../../types';
import { addDays, getTodayStr } from '../../services/scheduleEngine';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const { completeOnboarding } = useStudy();

  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // Step 1: Goal & Target
  const [name, setName] = useState('Lucas');
  const [selectedPresetId, setSelectedPresetId] = useState('enem');
  const [targetExam, setTargetExam] = useState('ENEM 2026');
  const [hasExamDate, setHasExamDate] = useState(true);
  const [examDate, setExamDate] = useState(addDays(getTodayStr(), 120));
  const [targetTotalHours, setTargetTotalHours] = useState(200);

  // Step 2: Time & Availability
  const [dailyMinutes, setDailyMinutes] = useState(120); // 2 hours
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Seg-Sex
  const [sessionLength, setSessionLength] = useState(50);
  const [profileType, setProfileType] = useState<StudyProfileType>('vestibulando');

  // Step 3: Subjects & Difficulties
  const currentPreset = STUDY_PRESETS.find((p) => p.id === selectedPresetId) || STUDY_PRESETS[0];

  const [subjectsList, setSubjectsList] = useState<Array<{
    id: string;
    name: string;
    color: string;
    weight: number;
    difficulty: SubjectDifficulty;
    knowledgeLevel: KnowledgeLevel;
    topics: string[];
  }>>(() =>
    currentPreset.subjects.map((s, idx) => ({
      id: `sub-${idx + 1}`,
      name: s.name,
      color: s.color,
      weight: s.weight,
      difficulty: s.difficulty,
      knowledgeLevel: s.knowledgeLevel,
      topics: s.topics,
    }))
  );

  const [newSubName, setNewSubName] = useState('');

  // Handle Preset selection
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = STUDY_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setTargetExam(preset.name);
      setExamDate(addDays(getTodayStr(), preset.defaultExamOffsetDays));
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
    }
  };

  const toggleDay = (dayIndex: number) => {
    if (selectedDays.includes(dayIndex)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter((d) => d !== dayIndex));
      }
    } else {
      setSelectedDays([...selectedDays, dayIndex].sort());
    }
  };

  const handleAddCustomSubject = () => {
    if (!newSubName.trim()) return;
    const colors = ['#6366f1', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
    const randomColor = colors[subjectsList.length % colors.length];

    setSubjectsList([
      ...subjectsList,
      {
        id: `sub-custom-${Date.now()}`,
        name: newSubName.trim(),
        color: randomColor,
        weight: 3,
        difficulty: 'media',
        knowledgeLevel: 'intermediario',
        topics: ['Fundamentos Gerais', 'Tópicos Principais', 'Exercícios de Fixação'],
      },
    ]);
    setNewSubName('');
  };

  const handleRemoveSubject = (id: string) => {
    if (subjectsList.length > 1) {
      setSubjectsList(subjectsList.filter((s) => s.id !== id));
    }
  };

  const updateSubjectField = (
    id: string,
    field: 'difficulty' | 'knowledgeLevel' | 'weight',
    value: unknown
  ) => {
    setSubjectsList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleFinish = () => {
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
    }));

    completeOnboarding(
      {
        name: name.trim() || 'Estudante',
        objective: targetExam || currentPreset.name,
        targetExam: targetExam || currentPreset.name,
        examDate: hasExamDate ? examDate : undefined,
        targetTotalHours: !hasExamDate ? targetTotalHours : undefined,
        profileType,
        dailyAvailableMinutes: dailyMinutes,
        availableDays: selectedDays,
        preferredSessionLength: sessionLength,
      },
      finalSubjects
    );

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-stone-900/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-6 shadow-2xl sm:p-8">
        {/* Progress Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            <span>Passo {step} de {totalSteps}</span>
            <span className="text-indigo-600 font-semibold">Configuração Inteligente</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* STEP 1: Goal & Target */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">Qual é o seu foco de estudos?</h2>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                Selecione uma base inicial para personalizarmos seu cronograma de maneira ideal.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Seu Nome
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Como prefere ser chamado?"
                className="w-full rounded-xl border border-stone-300 dark:border-stone-600 px-4 py-2.5 text-sm font-medium text-stone-900 dark:text-stone-100 outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
                Objetivo Principal
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {STUDY_PRESETS.map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset.id)}
                      className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20'
                          : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:border-stone-600 hover:bg-stone-50 dark:bg-stone-800'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-sm text-stone-900 dark:text-stone-100">{preset.name}</span>
                        {isSelected && <Check className="h-4 w-4 text-indigo-600" />}
                      </div>
                      <span className="mt-1 text-xs text-stone-500 dark:text-stone-400 line-clamp-2">
                        {preset.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Prova ou Concurso Específico
                </label>
                <input
                  type="text"
                  value={targetExam}
                  onChange={(e) => setTargetExam(e.target.value)}
                  placeholder="Ex: ENEM 2026, OAB, Receita Federal..."
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-600 px-4 py-2.5 text-sm text-stone-900 dark:text-stone-100 outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                    {hasExamDate ? 'Data da Prova' : 'Meta de Horas Totais'}
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
                    className="w-full rounded-xl border border-stone-300 dark:border-stone-600 px-4 py-2.5 text-sm text-stone-900 dark:text-stone-100 outline-hidden focus:border-indigo-600"
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
                      className="w-full rounded-xl border border-stone-300 dark:border-stone-600 px-4 py-2.5 text-sm text-stone-900 dark:text-stone-100 outline-hidden focus:border-indigo-600 font-bold"
                    />
                    <span className="text-xs font-bold text-stone-500 dark:text-stone-400 shrink-0">
                      horas no total
                    </span>
                  </div>
                )}
                {!hasExamDate && (
                  <span className="text-[11px] text-stone-400 dark:text-stone-500 mt-1 block">
                    💡 Você define a quantidade de horas que deseja cumprir no ciclo.
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Time & Availability */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">Sua Rotina de Estudos</h2>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                O cronograma será calibrado de acordo com seu tempo real para evitar sobrecarga.
              </p>
            </div>

            {/* Daily Minutes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                  Tempo disponível por dia
                </label>
                <span className="text-sm font-extrabold text-indigo-600">
                  {Math.floor(dailyMinutes / 60)}h {dailyMinutes % 60 > 0 ? `${dailyMinutes % 60}min` : ''}
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
                        : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                  </button>
                ))}
              </div>
            </div>

            {/* Available Days */}
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
                Dias da semana em que você estuda
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
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-600/20'
                          : 'border-stone-200 dark:border-stone-700 text-stone-400 hover:bg-stone-50 dark:bg-stone-800'
                      }`}
                    >
                      <span>{d.label}</span>
                      <span className="text-[10px] mt-0.5">{isChecked ? '✓' : '—'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Session Length & Profile Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Duração do Bloco de Foco
                </label>
                <select
                  value={sessionLength}
                  onChange={(e) => setSessionLength(Number(e.target.value))}
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-600 px-3.5 py-2.5 text-sm text-stone-900 dark:text-stone-100 outline-hidden focus:border-indigo-600"
                >
                  <option value={25}>25 minutos (Pomodoro Clássico)</option>
                  <option value={45}>45 minutos (Equilibrado)</option>
                  <option value={50}>50 minutos (Recomendado)</option>
                  <option value={60}>60 minutos (Aprofundado)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Seu Perfil Principal
                </label>
                <select
                  value={profileType}
                  onChange={(e) => setProfileType(e.target.value as StudyProfileType)}
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-600 px-3.5 py-2.5 text-sm text-stone-900 dark:text-stone-100 outline-hidden focus:border-indigo-600"
                >
                  <option value="iniciante">Estudante Iniciante</option>
                  <option value="vestibulando">Vestibulando / ENEM</option>
                  <option value="concurseiro">Concurseiro Dedicado</option>
                  <option value="pouco_tempo">Pouco Tempo Diário</option>
                  <option value="procrastinador">Procrastinador (Precisa de metas curtas)</option>
                  <option value="desorganizado">Precisa de ordem e disciplina</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Subjects & Difficulties */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">Matérias e Dificuldades</h2>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                Indique onde você tem maior dificuldade para o algoritmo priorizar com inteligência.
              </p>
            </div>

            {/* Subject List with Difficulty Controls */}
            <div className="max-h-72 overflow-y-auto pr-1 space-y-2.5">
              {subjectsList.map((sub) => (
                <div
                  key={sub.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/70 p-3"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="h-3.5 w-3.5 rounded-full ring-2 ring-stone-200"
                      style={{ backgroundColor: sub.color }}
                    />
                    <div>
                      <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">{sub.name}</h4>
                      <span className="text-[11px] text-stone-500 dark:text-stone-400">
                        {sub.topics.length} tópicos cadastrados
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Difficulty selector */}
                    <select
                      value={sub.difficulty}
                      onChange={(e) =>
                        updateSubjectField(sub.id, 'difficulty', e.target.value as SubjectDifficulty)
                      }
                      className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${
                        sub.difficulty === 'alta'
                          ? 'border-rose-300 bg-rose-50 text-rose-800'
                          : sub.difficulty === 'media'
                          ? 'border-amber-300 bg-amber-50 text-amber-800'
                          : 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      }`}
                    >
                      <option value="baixa">Dificuldade: Baixa</option>
                      <option value="media">Dificuldade: Média</option>
                      <option value="alta">Dificuldade: Alta (Mais peso)</option>
                    </select>

                    {/* Knowledge Level */}
                    <select
                      value={sub.knowledgeLevel}
                      onChange={(e) =>
                        updateSubjectField(sub.id, 'knowledgeLevel', e.target.value as KnowledgeLevel)
                      }
                      className="rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-2 py-1 text-xs text-stone-700 dark:text-stone-300"
                    >
                      <option value="iniciante">Nível: Iniciante</option>
                      <option value="intermediario">Nível: Intermediário</option>
                      <option value="avancado">Nível: Avançado</option>
                    </select>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveSubject(sub.id)}
                      className="p-1 text-stone-400 hover:text-rose-600"
                      title="Remover matéria"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Custom Subject */}
            <div className="flex gap-2 pt-2">
              <input
                type="text"
                value={newSubName}
                onChange={(e) => setNewSubName(e.target.value)}
                placeholder="Adicionar outra matéria..."
                className="flex-1 rounded-xl border border-stone-300 dark:border-stone-600 px-3.5 py-2 text-sm outline-hidden focus:border-indigo-600"
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomSubject()}
              />
              <button
                type="button"
                onClick={handleAddCustomSubject}
                className="flex items-center gap-1 rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold text-white hover:bg-stone-800"
              >
                <Plus className="h-4 w-4" />
                <span>Adicionar</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Ready to Generate */}
        {step === 4 && (
          <div className="space-y-6 text-center py-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 ring-8 ring-indigo-50">
              <Sparkles className="h-8 w-8 animate-bounce" />
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">Tudo Pronto para a Decolagem!</h2>
              <p className="mt-2 text-sm text-stone-600 dark:text-stone-400 max-w-md mx-auto">
                O algoritmo do <strong>Trilha</strong> vai calcular a distribuição balanceada de matérias,
                programar suas revisões espaçadas e entregar o seu cronograma personalizado.
              </p>
            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-3 gap-3 text-left">
              <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 p-3">
                <span className="block text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase">Matérias</span>
                <span className="text-base font-extrabold text-stone-900 dark:text-stone-100">
                  {subjectsList.length} ativas
                </span>
              </div>
              <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 p-3">
                <span className="block text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase">Tempo Diário</span>
                <span className="text-base font-extrabold text-stone-900 dark:text-stone-100">
                  {Math.floor(dailyMinutes / 60)}h {dailyMinutes % 60 > 0 ? `${dailyMinutes % 60}m` : ''}
                </span>
              </div>
              <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 p-3">
                <span className="block text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase">Dias de Estudo</span>
                <span className="text-base font-extrabold text-stone-900 dark:text-stone-100">
                  {selectedDays.length} dias/sem
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs font-semibold text-emerald-800">
              🎁 Bônus de boas-vindas: <strong>+100 XP</strong> liberados na criação da sua rotina!
            </div>
          </div>
        )}

        {/* Action Controls Footer */}
        <div className="mt-8 flex items-center justify-between border-t border-stone-200 dark:border-stone-700 pt-4">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 rounded-xl border border-stone-300 dark:border-stone-600 px-4 py-2.5 text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-100"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Voltar</span>
            </button>
          ) : (
            <div />
          )}

          {step < totalSteps ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 active:scale-95"
            >
              <span>Continuar</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-indigo-700 active:scale-95"
            >
              <Sparkles className="h-4 w-4" />
              <span>Gerar Meu Cronograma Inteligente</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
