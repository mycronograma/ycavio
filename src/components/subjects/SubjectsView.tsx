import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Clock,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Flame,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  ListPlus,
  Table2,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { Subject, SubjectDifficulty, KnowledgeLevel } from '../../types';

export const SubjectsView: React.FC = () => {
  const { state, addSubject, updateSubject, deleteSubject } = useStudy();
  const { subjects, reviews } = state;

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
    setTopicList(['Introdução e Teoria Inicial', 'Exercícios Práticos']);
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
        topics: updatedTopics.length > 0 ? updatedTopics : editingSubject.topics,
      });
    } else {
      addSubject({
        name: name.trim(),
        color,
        weight,
        difficulty,
        knowledgeLevel,
        topics: cleanTopics.length > 0 ? cleanTopics : ['Introdução aos Conceitos', 'Tópicos Centrais', 'Exercícios Práticos'],
      });
    }

    setIsAddModalOpen(false);
  };

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

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Nova Matéria</span>
        </button>
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
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Tem certeza que deseja remover a matéria "${sub.name}"?`)) {
                          deleteSubject(sub.id);
                        }
                      }}
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded-md hover:bg-stone-100 dark:text-stone-500 dark:hover:text-rose-400 dark:hover:bg-stone-800"
                      title="Excluir matéria"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
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
                  <span className="mt-1 block text-[11px] text-stone-400 dark:text-stone-500">
                    {completedTopicsCount} de {sub.topics.length} tópicos concluídos
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
                    <span className="font-semibold text-indigo-700 dark:text-indigo-400">
                      {nextRev ? `Em ${nextRev.dueDate}` : 'Nenhuma pendente'}
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
                  <div className="mt-2.5 space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {sub.topics.map((top) => (
                      <div
                        key={top.id}
                        className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs ${
                          top.completed
                            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-stone-50 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                        }`}
                      >
                        <span className={`truncate ${top.completed ? 'line-through text-stone-400 dark:text-stone-500' : 'font-medium'}`}>
                          {top.name}
                        </span>
                        {top.completed ? (
                          <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        ) : (
                          <span className="text-[10px] text-stone-400 dark:text-stone-500">Pendente</span>
                        )}
                      </div>
                    ))}
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                    Tópicos / Conteúdos ({topicList.length})
                  </label>
                  <span className="text-[10px] text-stone-400">Adicione com o símbolo de +</span>
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
                    placeholder="Digite um tópico e clique no +..."
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
                      Nenhum tópico adicionado ainda. Use o campo acima para adicionar.
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
