import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { useToast } from '../../context/ToastContext';
import { Subject, SubjectDifficulty, KnowledgeLevel } from '../../types';
import { PresetSelector, WeeklyLoadLevel } from './PresetSelector';
import { findSuggestedTopicsForSubject } from '../../services/presetTopics';
import { formatRelativeDatePtBr, formatFullDatePtBr } from '../../lib/dateUtils';

interface SubjectsViewProps {
  forcePresetMode?: boolean;
  onClearForcePreset?: () => void;
  forceListSignal?: number;
  onSelectPresetForWizard: (presetId: string, weeklyLoad: WeeklyLoadLevel) => void;
}

export const SubjectsView: React.FC<SubjectsViewProps> = ({
  forcePresetMode = false,
  onClearForcePreset,
  forceListSignal = 0,
  onSelectPresetForWizard,
}) => {
  const {
    state,
    addSubject,
    updateSubject,
    toggleSubjectTopic,
    loadSuggestedTopicsForSubject,
    deleteSubject,
  } = useStudy();
  const { showToast } = useToast();
  const { subjects, reviews, profile } = state;

  const [viewMode, setViewMode] = useState<'presets' | 'list'>(() =>
    forcePresetMode || !profile.presetChosen || subjects.length === 0 ? 'presets' : 'list'
  );
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (forcePresetMode) {
      setViewMode('presets');
      onClearForcePreset?.();
    } else if (!profile.presetChosen && subjects.length === 0) {
      setViewMode('presets');
    }
  }, [forcePresetMode, onClearForcePreset, profile.presetChosen, subjects.length]);

  useEffect(() => {
    if (forceListSignal > 0) {
      setViewMode('list');
    }
  }, [forceListSignal]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null);

  // Form states for Add / Edit
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [weight, setWeight] = useState(4);
  const [difficulty, setDifficulty] = useState<SubjectDifficulty>('media');
  const [knowledgeLevel, setKnowledgeLevel] = useState<KnowledgeLevel>('intermediario');

  // Interactive Topics List (Cada um com botão de + e remoção)
  const [topicList, setTopicList] = useState<string[]>([]);
  const [newTopicInput, setNewTopicInput] = useState('');
  const [quickTopicInputs, setQuickTopicInputs] = useState<Record<string, string>>({});

  const colorPalette = [
    '#3b82f6', // blue
    '#6366f1', // indigo
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#10b981', // emerald
    '#06b6d4', // cyan
    '#f59e0b', // amber
    '#f97316', // orange
    '#ef4444', // red
  ];

  const handleOpenAdd = () => {
    setName('');
    setColor(colorPalette[subjects.length % colorPalette.length]);
    setWeight(4);
    setDifficulty('media');
    setKnowledgeLevel('intermediario');
    setTopicList([]);
    setNewTopicInput('');
    setEditingSubject(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (sub: Subject) => {
    setEditingSubject(sub);
    setName(sub.name);
    setColor(sub.color);
    setWeight(sub.weight);
    setDifficulty(sub.difficulty);
    setKnowledgeLevel(sub.knowledgeLevel);
    setTopicList(sub.topics.map((t) => t.name));
    setNewTopicInput('');
    setIsAddModalOpen(true);
  };

  const handleAddTopicToList = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newTopicInput.trim();
    if (!trimmed) return;
    setTopicList((prev) => [...prev, trimmed]);
    setNewTopicInput('');
  };

  const handleRemoveTopic = (indexToRemove: number) => {
    setTopicList((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleUpdateTopicName = (index: number, newName: string) => {
    setTopicList((prev) => {
      const copy = [...prev];
      copy[index] = newName;
      return copy;
    });
  };

  const handleSaveSubject = () => {
    if (!name.trim()) return;

    // Filter non-empty topics
    const cleanTopics = topicList.map((t) => t.trim()).filter(Boolean);

    if (editingSubject) {
      // Retain existing topics state if matched by name
      const updatedTopics = cleanTopics.map((tName, idx) => {
        const existing = editingSubject.topics.find((t) => t.name.toLowerCase() === tName.toLowerCase());
        return {
          id: existing?.id || `top-${editingSubject.id}-${idx + 1}`,
          name: tName,
          completed: existing?.completed || false,
          completedAt: existing?.completedAt,
          exercisesCount: existing?.exercisesCount,
          exercisesCorrect: existing?.exercisesCorrect,
        };
      });

      updateSubject({
        ...editingSubject,
        name: name.trim(),
        color,
        weight,
        difficulty,
        knowledgeLevel,
        topics: updatedTopics,
      });
      showToast(`Matéria "${name.trim()}" atualizada!`, 'success');
    } else {
      addSubject({
        name: name.trim(),
        color,
        weight,
        difficulty,
        knowledgeLevel,
        topics: cleanTopics,
      });
      showToast(`Matéria "${name.trim()}" adicionada!`, 'success');
    }

    setIsAddModalOpen(false);
  };

  const handleLoadSuggestedTopicsInModal = () => {
    const suggestions = findSuggestedTopicsForSubject(name);
    if (suggestions.length === 0) {
      showToast('Nenhuma sugestão encontrada para este nome. Adicione manualmente abaixo.', 'info');
      return;
    }
    const existingLower = new Set(topicList.map((t) => t.trim().toLowerCase()));
    const fresh = suggestions.filter((s) => !existingLower.has(s.toLowerCase()));
    if (fresh.length === 0) {
      showToast('Todos os tópicos sugeridos já estão na lista.', 'info');
      return;
    }
    setTopicList((prev) => [...prev, ...fresh]);
    showToast(`${fresh.length} tópicos sugeridos adicionados!`, 'success');
  };

  const handleQuickAddTopic = (sub: Subject) => {
    const trimmed = (quickTopicInputs[sub.id] || '').trim();
    if (!trimmed) return;

    const newTopic = {
      id: `top-${sub.id}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      name: trimmed,
      completed: false,
    };

    updateSubject({
      ...sub,
      topics: [...sub.topics, newTopic],
    });

    setQuickTopicInputs((prev) => ({ ...prev, [sub.id]: '' }));
    showToast(`Tópico "${trimmed}" adicionado!`, 'success');
  };

  if (viewMode === 'presets') {
    return (
      <PresetSelector
        initialLoad={profile.weeklyLoad || 'leve'}
        existingSubjectsCount={subjects.length}
        onSelectPreset={onSelectPresetForWizard}
        onBackToMySubjects={() => setViewMode('list')}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-xs dark:border-stone-800 dark:bg-stone-900 transition-colors">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <span>Matérias & Áreas de Estudo</span>
          </h2>
          <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
            Gerencie pesos, níveis de dificuldade e adicione tópicos facilmente com o botão de +
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('presets')}
            className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700 transition whitespace-nowrap shrink-0"
          >
            <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>Escolher Modelo (Presets)</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Matéria</span>
          </button>
        </div>
      </div>

      {/* Grid of Subject Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((sub) => {
          const completedTopicsCount = sub.topics.filter((t) => t.completed).length;
          const topicPercent =
            sub.topics.length > 0
              ? Math.round((completedTopicsCount / sub.topics.length) * 100)
              : 0;

          // Next scheduled review
          const nextRev = reviews.find(
            (r) => r.subjectId === sub.id && r.status === 'pendente'
          );

          // Exercise accuracy
          const accuracy =
            sub.totalExercisesDone > 0
              ? Math.round((sub.totalExercisesCorrect / sub.totalExercisesDone) * 100)
              : null;

          const isExpanded = expandedSubjectId === sub.id;

          return (
            <div
              key={sub.id}
              className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-5 shadow-xs transition hover:border-stone-300 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700"
            >
              <div>
                {/* Card Header with Color & Action buttons */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-4 w-4 rounded-lg shrink-0"
                      style={{ backgroundColor: sub.color }}
                    />
                    <div>
                      <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 leading-tight">
                        {sub.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`rounded-md px-2 py-0.2 text-[10px] font-bold ${
                            sub.difficulty === 'alta'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900/60'
                              : sub.difficulty === 'media'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900/60'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900/60'
                          }`}
                        >
                          Dif: {sub.difficulty}
                        </span>
                        <span className="text-[10px] font-semibold text-stone-400 dark:text-stone-500">
                          Peso: {sub.weight}/5
                        </span>
                        <span className="text-[10px] font-medium text-stone-500 dark:text-stone-400 capitalize">
                          • {sub.knowledgeLevel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(sub)}
                      className="p-1.5 text-stone-400 hover:text-stone-700 rounded-md hover:bg-stone-100 dark:text-stone-500 dark:hover:text-stone-200 dark:hover:bg-stone-800"
                      title="Editar matéria e tópicos"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    {confirmDeleteId === sub.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            deleteSubject(sub.id);
                            setConfirmDeleteId(null);
                            showToast(`Matéria "${sub.name}" removida.`, 'info');
                          }}
                          className="rounded-md bg-rose-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-rose-700"
                        >
                          Remover
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="rounded-md px-1.5 py-1 text-[10px] font-semibold text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(sub.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 rounded-md hover:bg-stone-100 dark:text-stone-500 dark:hover:text-rose-400 dark:hover:bg-stone-800"
                        title="Excluir matéria"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-stone-600 dark:text-stone-400">Progresso dos Conteúdos</span>
                    <span className="font-extrabold text-stone-900 dark:text-stone-100">{topicPercent}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${topicPercent}%`,
                        backgroundColor: sub.color,
                      }}
                    />
                  </div>
                  <span className="mt-1 block text-[11px] text-stone-400 dark:text-stone-500 tabular-nums">
                    {sub.topics.length === 0
                      ? 'Sem tópicos cadastrados ainda'
                      : `${completedTopicsCount} de ${sub.topics.length} tópicos concluídos`}
                  </span>
                </div>

                {/* Stats grid */}
                <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-stone-50 dark:bg-stone-800/60 p-3 text-xs">
                  <div>
                    <span className="text-stone-400 dark:text-stone-500 block text-[10px] font-bold uppercase">
                      Tempo Estudado
                    </span>
                    <span className="font-bold text-stone-800 dark:text-stone-200">
                      {Math.floor(sub.totalMinutesStudied / 60)}h {sub.totalMinutesStudied % 60}m
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 dark:text-stone-500 block text-[10px] font-bold uppercase">
                      Desempenho
                    </span>
                    <span className="font-bold text-stone-800 dark:text-stone-200">
                      {accuracy !== null ? `${accuracy}% acertos` : 'Sem dados'}
                    </span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-stone-200/60 dark:border-stone-700/60 flex items-center justify-between text-[11px]">
                    <span className="text-stone-500 dark:text-stone-400">Próxima Revisão:</span>
                    <span
                      title={nextRev ? formatFullDatePtBr(nextRev.dueDate) : undefined}
                      className="font-semibold text-indigo-700 dark:text-indigo-400 tabular-nums"
                    >
                      {nextRev ? formatRelativeDatePtBr(nextRev.dueDate) : 'Nenhuma pendente'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expand Topics Toggle */}
              <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setExpandedSubjectId(isExpanded ? null : sub.id)}
                  className="flex items-center justify-between w-full text-xs font-semibold text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200"
                >
                  <span>{isExpanded ? 'Ocultar Tópicos' : `Ver Tópicos (${sub.topics.length})`}</span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {isExpanded && (
                  <div className="mt-2.5 space-y-2">
                    {sub.topics.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-stone-200 dark:border-stone-700 px-3 py-2.5 text-center space-y-2">
                        <p className="text-[11px] text-stone-400 dark:text-stone-500">
                          Nenhum tópico cadastrado ainda.
                        </p>
                        {findSuggestedTopicsForSubject(sub.name).length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const suggestions = findSuggestedTopicsForSubject(sub.name);
                              const added = loadSuggestedTopicsForSubject(sub.id, suggestions);
                              if (added > 0) {
                                showToast(
                                  `${added} tópicos sugeridos carregados para ${sub.name}!`,
                                  'success'
                                );
                              }
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-cyan-300 dark:hover:bg-indigo-900/60 transition"
                          >
                            <Wand2 className="h-3.5 w-3.5" />
                            <span>Carregar tópicos sugeridos</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                        {sub.topics.map((top) => (
                          <button
                            key={top.id}
                            type="button"
                            onClick={() => {
                              const marked = toggleSubjectTopic(sub.id, top.id);
                              showToast(
                                marked
                                  ? `Tópico "${top.name}" concluído!`
                                  : `Tópico "${top.name}" reaberto.`,
                                marked ? 'success' : 'info'
                              );
                            }}
                            className={`w-full flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs text-left transition ${
                              top.completed
                                ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/60'
                                : 'bg-stone-50 text-stone-700 hover:bg-stone-100 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700/80'
                            }`}
                            title={
                              top.completed
                                ? 'Clique para marcar como pendente'
                                : 'Clique para marcar como concluído'
                            }
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                                  top.completed
                                    ? 'border-emerald-600 bg-emerald-600 text-white'
                                    : 'border-stone-300 bg-white dark:border-stone-600 dark:bg-stone-900'
                                }`}
                              >
                                {top.completed && <Check className="h-3 w-3" />}
                              </span>
                              <span
                                className={`truncate ${
                                  top.completed
                                    ? 'line-through text-stone-400 dark:text-stone-500'
                                    : 'font-medium'
                                }`}
                              >
                                {top.name}
                              </span>
                            </div>
                            <span className="text-[10px] font-semibold shrink-0 text-stone-400 dark:text-stone-500">
                              {top.completed ? 'Feito' : 'Marcar'}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-1.5 pt-1">
                      <input
                        type="text"
                        value={quickTopicInputs[sub.id] || ''}
                        onChange={(e) =>
                          setQuickTopicInputs((prev) => ({ ...prev, [sub.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleQuickAddTopic(sub);
                          }
                        }}
                        placeholder="Novo tópico..."
                        className="flex-1 min-w-0 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs text-stone-900 outline-hidden focus:border-indigo-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                      />
                      <button
                        type="button"
                        onClick={() => handleQuickAddTopic(sub)}
                        className="flex items-center justify-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition shrink-0"
                        title="Adicionar tópico rápido"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Adicionar</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal with + Button for Topics */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-stone-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl dark:border-stone-800 dark:bg-stone-900">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-300"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-extrabold text-stone-900 dark:text-stone-100 mb-4">
              {editingSubject ? 'Editar Matéria' : 'Nova Matéria'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                  Nome da Matéria
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Direito Constitucional, Matemática..."
                  className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm text-stone-900 outline-hidden focus:border-indigo-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:focus:border-indigo-400"
                />
              </div>

              {/* Color selector */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Cor da Disciplina
                </label>
                <div className="flex flex-wrap gap-2">
                  {colorPalette.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-7 w-7 rounded-full transition ${
                        color === c ? 'ring-3 ring-offset-2 ring-indigo-600 dark:ring-offset-stone-900 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Weight & Difficulty */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Importância / Peso (1 a 5)
                  </label>
                  <select
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm text-stone-900 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                  >
                    <option value={1}>1 - Baixo</option>
                    <option value={2}>2 - Normal</option>
                    <option value={3}>3 - Relevante</option>
                    <option value={4}>4 - Muito Importante</option>
                    <option value={5}>5 - Peso Máximo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Dificuldade Pessoal
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as SubjectDifficulty)}
                    className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm text-stone-900 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                  >
                    <option value="baixa">Baixa (Tenho facilidade)</option>
                    <option value="media">Média (Padrão)</option>
                    <option value="alta">Alta (Priorizar no cronograma)</option>
                  </select>
                </div>
              </div>

              {/* Knowledge Level */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                  Seu Nível Atual de Domínio
                </label>
                <select
                  value={knowledgeLevel}
                  onChange={(e) => setKnowledgeLevel(e.target.value as KnowledgeLevel)}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm text-stone-900 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                >
                  <option value="iniciante">Iniciante (Começando do zero)</option>
                  <option value="intermediario">Intermediário (Já estudei parte da matéria)</option>
                  <option value="avancado">Avançado (Focado em revisões e questões)</option>
                </select>
              </div>

              {/* Tópicos com Símbolo de + Individual */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                    Tópicos / Conteúdos ({topicList.length})
                  </label>
                  {findSuggestedTopicsForSubject(name).length > 0 ? (
                    <button
                      type="button"
                      onClick={handleLoadSuggestedTopicsInModal}
                      className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-cyan-400 dark:hover:text-cyan-300 transition"
                    >
                      <Wand2 className="h-3 w-3" />
                      <span>Carregar tópicos sugeridos</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-stone-400">Adicione com o botão +</span>
                  )}
                </div>

                {/* Input with (+) Button */}
                <div className="flex gap-2 mb-2.5">
                  <input
                    type="text"
                    value={newTopicInput}
                    onChange={(e) => setNewTopicInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTopicToList();
                      }
                    }}
                    placeholder="Digite um tópico e clique em Adicionar..."
                    className="flex-1 rounded-xl border border-stone-300 px-3.5 py-2 text-xs text-stone-900 outline-hidden focus:border-indigo-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddTopicToList()}
                    className="flex items-center justify-center gap-1 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 active:scale-95 transition"
                    title="Adicionar tópico"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Adicionar</span>
                  </button>
                </div>

                {/* Interactive list of added topics */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {topicList.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-stone-200 dark:border-stone-700 p-3 text-center text-xs text-stone-400">
                      Nenhum tópico adicionado ainda. Use o campo acima ou carregue tópicos sugeridos.
                    </div>
                  ) : (
                    topicList.map((topName, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 rounded-xl border border-stone-200 bg-stone-50/70 p-2 dark:border-stone-700 dark:bg-stone-800/60"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-stone-200 dark:bg-stone-700 text-[10px] font-bold text-stone-600 dark:text-stone-300">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={topName}
                            onChange={(e) => handleUpdateTopicName(idx, e.target.value)}
                            className="flex-1 bg-transparent text-xs font-medium text-stone-900 dark:text-stone-100 outline-hidden"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveTopic(idx)}
                          className="p-1 text-stone-400 hover:text-rose-600 rounded-md hover:bg-stone-200 dark:hover:bg-stone-700"
                          title="Remover este tópico"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 rounded-xl border border-stone-300 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveSubject}
                  className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700"
                >
                  Salvar Matéria
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
