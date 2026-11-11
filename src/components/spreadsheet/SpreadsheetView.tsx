import React, { useState } from 'react';
import {
  Table2,
  Plus,
  Play,
  RotateCw,
  CheckCircle2,
  Circle,
  HelpCircle,
  Sparkles,
  Info,
  Edit2,
  Trash2,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { Subject, Task } from '../../types';

export const SpreadsheetView: React.FC = () => {
  const { state, updateSubjectSpreadsheetField, advanceAllCycles, startStudySession, addSubject, deleteSubject } = useStudy();
  const { subjects, profile } = state;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubParei, setNewSubParei] = useState('');
  const [newSubRevisao, setNewSubRevisao] = useState('');
  const [newSubCaderno, setNewSubCaderno] = useState('');
  const [newSubWeight, setNewSubWeight] = useState(4);

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;

    addSubject({
      name: newSubName.trim(),
      color: '#3b82f6',
      weight: newSubWeight,
      difficulty: 'media',
      knowledgeLevel: 'intermediario',
      topics: [newSubParei.trim() || 'Tópico Inicial'],
    });

    setIsAddModalOpen(false);
    setNewSubName('');
    setNewSubParei('');
    setNewSubRevisao('');
    setNewSubCaderno('');
  };

  const handleStudySubject = (sub: Subject) => {
    const virtualTask: Task = {
      id: `task-manual-${sub.id}-${Date.now()}`,
      subjectId: sub.id,
      subjectName: sub.name,
      subjectColor: sub.color,
      topicName: sub.pareiEm || 'Continuação do Edital',
      type: 'teoria',
      durationMinutes: profile.preferredSessionLength || 50,
      date: new Date().toISOString().slice(0, 10),
      status: 'pendente',
      priorityScore: 50,
      objectives: [
        `Estudar a partir de: ${sub.pareiEm || 'Início da disciplina'}`,
        sub.cadernoQuestoes ? `Resolver caderno: ${sub.cadernoQuestoes}` : 'Praticar com exercícios fixadores',
      ],
      pareiEm: sub.pareiEm,
      cadernoQuestoes: sub.cadernoQuestoes,
      revisaoNotes: sub.revisaoNotes,
    };

    startStudySession(virtualTask);
  };

  const completedCount = subjects.filter((s) => s.concluida).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-xs dark:border-stone-800 dark:bg-stone-900 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <Table2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-xl font-black tracking-tight text-stone-900 dark:text-stone-100">
              Ciclo de Estudos (Sua Planilha)
            </h2>
            <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 text-xs font-bold">
              Ciclo Atual: {profile.globalCiclo ?? 0}
            </span>
          </div>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            Você tem total autonomia: digite diretamente onde parou, anote o caderno de questões e os pontos de revisão.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Button to advance cycle */}
          <button
            type="button"
            onClick={() => {
              if (confirm('Avançar para o próximo ciclo de estudos em todas as matérias?')) {
                advanceAllCycles();
              }
            }}
            className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 shadow-xs dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200 dark:hover:bg-amber-900/60 transition"
            title="Avança o contador de ciclos e sinaliza para fazer a revisão"
          >
            <RotateCw className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <span>Virar Ciclo (+1)</span>
          </button>

          {/* Button to add subject */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 active:scale-95 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Adicionar Matéria</span>
          </button>
        </div>
      </div>

      {/* Regra de Ouro da Planilha Alert */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50/90 p-4 dark:border-amber-900/60 dark:bg-amber-950/40 shadow-xs">
        <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-950 dark:text-amber-200">
          <span className="font-extrabold block text-sm">
            💡 Regra da Planilha: Fazer revisão quando mudar o ciclo
          </span>
          Ao rodar o ciclo e virar para o próximo, revise os tópicos anotados na coluna <strong>REVISÃO</strong> antes de avançar nos novos pontos da matéria.
        </div>
      </div>

      {/* Main Interactive Spreadsheet Table */}
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs dark:border-stone-800 dark:bg-stone-900 transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#1b4d6b] text-white font-black tracking-wider uppercase text-[11px]">
                <th className="py-3.5 px-4 w-12 text-center">Ação</th>
                <th className="py-3.5 px-4 min-w-[200px]">MATÉRIAS</th>
                <th className="py-3.5 px-3 w-16 text-center">PESO</th>
                <th className="py-3.5 px-3 w-20 text-center">CICLO</th>
                <th className="py-3.5 px-4 min-w-[200px]">REVISÃO</th>
                <th className="py-3.5 px-4 min-w-[200px]">CADERNO DE QUESTÕES</th>
                <th className="py-3.5 px-4 min-w-[200px] bg-[#143c53]">PAREI (ONDE PAROU)</th>
                <th className="py-3.5 px-4 w-28 text-center bg-[#0e3043]">MAT. CONCLUÍDA</th>
                <th className="py-3.5 px-3 w-12 text-center">Excluir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {subjects.map((sub) => {
                return (
                  <tr
                    key={sub.id}
                    className={`transition-colors hover:bg-stone-50/80 dark:hover:bg-stone-800/40 ${
                      sub.concluida ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : ''
                    }`}
                  >
                    {/* Action: Start Studying */}
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleStudySubject(sub)}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-xs"
                        title={`Iniciar estudo de ${sub.name}`}
                      >
                        <Play className="h-3.5 w-3.5 fill-white ml-0.5" />
                      </button>
                    </td>

                    {/* Matéria Name */}
                    <td className="py-3 px-4 font-bold text-stone-900 dark:text-stone-100">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: sub.color || '#3b82f6' }}
                        />
                        <span className="text-sm font-extrabold">{sub.name}</span>
                      </div>
                    </td>

                    {/* Peso */}
                    <td className="py-3 px-3 text-center">
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={sub.weight ?? 1}
                        onChange={(e) =>
                          updateSubjectSpreadsheetField(sub.id, 'weight', Number(e.target.value))
                        }
                        className="w-12 rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 text-center font-bold text-stone-900 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 text-xs focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>

                    {/* Ciclo */}
                    <td className="py-3 px-3 text-center">
                      <input
                        type="number"
                        min="0"
                        value={sub.ciclo ?? 0}
                        onChange={(e) =>
                          updateSubjectSpreadsheetField(sub.id, 'ciclo', Number(e.target.value))
                        }
                        className="w-14 rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 text-center font-black text-rose-600 dark:text-rose-400 dark:border-stone-700 dark:bg-stone-800 text-xs focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>

                    {/* Revisão (editable input) */}
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={sub.revisaoNotes ?? ''}
                        placeholder="Ex: ortografia, resumo..."
                        onChange={(e) =>
                          updateSubjectSpreadsheetField(sub.id, 'revisaoNotes', e.target.value)
                        }
                        className="w-full rounded-lg border border-transparent bg-transparent hover:border-stone-200 hover:bg-stone-50/80 focus:border-indigo-500 focus:bg-white dark:hover:border-stone-700 dark:hover:bg-stone-800 dark:focus:bg-stone-850 px-2.5 py-1.5 text-xs text-stone-800 dark:text-stone-200 outline-hidden transition"
                      />
                    </td>

                    {/* Caderno de Questões (editable input) */}
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={sub.cadernoQuestoes ?? ''}
                        placeholder="Ex: questão 40 - ortográfica..."
                        onChange={(e) =>
                          updateSubjectSpreadsheetField(sub.id, 'cadernoQuestoes', e.target.value)
                        }
                        className="w-full rounded-lg border border-transparent bg-transparent hover:border-stone-200 hover:bg-stone-50/80 focus:border-indigo-500 focus:bg-white dark:hover:border-stone-700 dark:hover:bg-stone-800 dark:focus:bg-stone-850 px-2.5 py-1.5 text-xs text-stone-800 dark:text-stone-200 outline-hidden transition"
                      />
                    </td>

                    {/* PAREI (highlighted background) */}
                    <td className="py-3 px-4 bg-indigo-50/30 dark:bg-indigo-950/20">
                      <input
                        type="text"
                        value={sub.pareiEm ?? ''}
                        placeholder="Ex: aula 1.6 - morfologia..."
                        onChange={(e) =>
                          updateSubjectSpreadsheetField(sub.id, 'pareiEm', e.target.value)
                        }
                        className="w-full rounded-lg border border-indigo-200/80 bg-white dark:border-indigo-900/60 dark:bg-stone-800 px-3 py-1.5 text-xs font-semibold text-indigo-950 dark:text-indigo-200 focus:ring-2 focus:ring-indigo-500 outline-hidden shadow-2xs"
                      />
                    </td>

                    {/* Mat. Concluída Checkbox */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          updateSubjectSpreadsheetField(sub.id, 'concluida', !sub.concluida)
                        }
                        className={`inline-flex items-center justify-center h-6 w-6 rounded-md border transition ${
                          sub.concluida
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-stone-300 dark:border-stone-600 hover:border-stone-400'
                        }`}
                        title={sub.concluida ? 'Matéria marcada como concluída' : 'Marcar matéria como concluída'}
                      >
                        {sub.concluida && <CheckCircle2 className="h-4 w-4" />}
                      </button>
                    </td>

                    {/* Delete button */}
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Remover "${sub.name}" da planilha?`)) {
                            deleteSubject(sub.id);
                          }
                        }}
                        className="p-1.5 text-stone-400 hover:text-rose-600 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                        title="Remover matéria"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-stone-100 bg-stone-50/60 p-4 dark:border-stone-800 dark:bg-stone-900/60 text-xs text-stone-600 dark:text-stone-400">
          <div className="flex items-center gap-4">
            <span>Total de matérias: <strong>{subjects.length}</strong></span>
            <span>•</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
              {completedCount} concluídas
            </span>
          </div>
          <div className="text-[11px] text-stone-500 dark:text-stone-400">
            ✍️ Todas as alterações são salvas automaticamente no seu navegador.
          </div>
        </div>
      </div>

      {/* Add Subject Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-stone-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl dark:border-stone-800 dark:bg-stone-900">
            <h3 className="text-lg font-black text-stone-900 dark:text-stone-100 mb-4">
              Nova Linha na Planilha
            </h3>

            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1">
                  Nome da Matéria
                </label>
                <input
                  type="text"
                  required
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  placeholder="Ex: Direito Previdenciário, Raciocínio Lógico..."
                  className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm text-stone-900 outline-hidden focus:border-indigo-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1">
                  Onde Parou (PAREI)
                </label>
                <input
                  type="text"
                  value={newSubParei}
                  onChange={(e) => setNewSubParei(e.target.value)}
                  placeholder="Ex: Aula 1.4 - Exercícios..."
                  className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm text-stone-900 outline-hidden focus:border-indigo-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1">
                    Caderno de Questões
                  </label>
                  <input
                    type="text"
                    value={newSubCaderno}
                    onChange={(e) => setNewSubCaderno(e.target.value)}
                    placeholder="Ex: Questão 12..."
                    className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs text-stone-900 outline-hidden focus:border-indigo-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1">
                    Pontos de Revisão
                  </label>
                  <input
                    type="text"
                    value={newSubRevisao}
                    onChange={(e) => setNewSubRevisao(e.target.value)}
                    placeholder="Ex: Resumo 1.2..."
                    className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs text-stone-900 outline-hidden focus:border-indigo-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                  />
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
                  type="submit"
                  className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700"
                >
                  Adicionar à Planilha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
