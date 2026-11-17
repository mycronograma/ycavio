import React, { useState } from 'react';
import { X, Target, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { getTodayStr } from '../../services/scheduleEngine';

interface QuestionLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubjectId?: string;
}

export const QuestionLogModal: React.FC<QuestionLogModalProps> = ({
  isOpen,
  onClose,
  defaultSubjectId,
}) => {
  const { state, logQuestions } = useStudy();
  const { subjects } = state;

  const [subjectId, setSubjectId] = useState(defaultSubjectId || (subjects[0]?.id ?? ''));
  const [topicName, setTopicName] = useState('');
  const [totalQuestions, setTotalQuestions] = useState<number | ''>('');
  const [correctAnswers, setCorrectAnswers] = useState<number | ''>('');
  const [sessionType, setSessionType] = useState<'EXERCICIOS' | 'SIMULADO'>('EXERCICIOS');
  const [date, setDate] = useState(getTodayStr());
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const total = typeof totalQuestions === 'number' ? totalQuestions : 0;
  const correct = typeof correctAnswers === 'number' ? correctAnswers : 0;
  const accuracy = total > 0 ? Math.round((Math.min(correct, total) / total) * 100) : null;

  const selectedSubject = subjects.find((s) => s.id === subjectId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!subjectId) {
      setError('Selecione uma matéria.');
      return;
    }
    if (typeof totalQuestions !== 'number' || totalQuestions <= 0) {
      setError('Informe a quantidade de questões resolvidas (maior que zero).');
      return;
    }
    if (typeof correctAnswers !== 'number' || correctAnswers < 0) {
      setError('Informe a quantidade de acertos (zero ou mais).');
      return;
    }
    if (correctAnswers > totalQuestions) {
      setError('O número de acertos não pode ser maior que o total de questões!');
      return;
    }

    logQuestions({
      subjectId,
      topicName: topicName.trim() || undefined,
      totalQuestions,
      correctAnswers,
      date,
      sessionType,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl dark:border-stone-800 dark:bg-stone-900 transition-all max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-xl p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200 transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-stone-900 dark:text-stone-100">
              Caderno de Questões
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Registre questões resolvidas fora do cronômetro (sites de questões, apostilas, simulados)
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Matéria */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1.5">
              Disciplina
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm font-semibold text-stone-900 focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
              required
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tópico (Opcional) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1.5">
              Tópico / Assunto (Opcional)
            </label>
            <input
              type="text"
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              placeholder="Ex: Artigo 5º da CF, Crase, Geometria Espacial"
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
            />
          </div>

          {/* Tipo de Sessão */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1.5">
              Tipo de Resolução
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSessionType('EXERCICIOS')}
                className={`rounded-xl py-2 px-3 text-xs font-bold transition border ${
                  sessionType === 'EXERCICIOS'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-300'
                    : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400'
                }`}
              >
                Lista de Exercícios
              </button>
              <button
                type="button"
                onClick={() => setSessionType('SIMULADO')}
                className={`rounded-xl py-2 px-3 text-xs font-bold transition border ${
                  sessionType === 'SIMULADO'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-300'
                    : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400'
                }`}
              >
                Prova / Simulado
              </button>
            </div>
          </div>

          {/* Grid: Quantidade & Acertos */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1.5">
                Total de Questões
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={totalQuestions}
                onChange={(e) => setTotalQuestions(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Ex: 30"
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm font-bold text-stone-900 focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1.5">
                Acertos
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={correctAnswers}
                onChange={(e) => setCorrectAnswers(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Ex: 24"
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm font-bold text-stone-900 focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                required
              />
            </div>
          </div>

          {/* Real-time Accuracy Preview Badge */}
          {accuracy !== null && (
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-3.5 dark:border-stone-700/80 dark:bg-stone-800/60 flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-600 dark:text-stone-400">
                Aproveitamento Calculado:
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`text-lg font-black ${
                    accuracy >= 75
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : accuracy >= 50
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {accuracy}%
                </span>
                <span className="text-xs text-stone-400">
                  ({correct}/{total})
                </span>
              </div>
            </div>
          )}

          {/* Data */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1.5">
              Data de Realização
            </label>
            <input
              type="date"
              value={date}
              max={getTodayStr()}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2 text-sm text-stone-900 focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
            />
          </div>

          {/* Anotações de Erros */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1.5">
              Anotações / Pontos de Atenção (Opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Ex: Errei 2 questões por desatenção na pegadinha da banca FCC."
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2 text-xs text-stone-900 focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-stone-200 px-4 py-2.5 text-xs font-bold text-stone-600 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-400 dark:hover:bg-stone-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Salvar no Caderno de Questões</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
