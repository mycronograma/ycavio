import React, { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  BookOpen,
  X,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { ThemeToggle } from '../common/ThemeToggle';
import { BrandLogo } from '../common/BrandLogo';

interface AuthWelcomeScreenProps {
  onOpenHowItWorks: () => void;
  initialMode?: 'login' | 'register';
  selectedPlanLabel?: string | null;
  onClearSelectedPlan?: () => void;
}

export const AuthWelcomeScreen: React.FC<AuthWelcomeScreenProps> = ({
  onOpenHowItWorks,
  initialMode = 'login',
  selectedPlanLabel = null,
  onClearSelectedPlan,
}) => {
  const {
    isSupabaseEnabled,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    continueOfflineMode,
  } = useStudy();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (mode === 'register' && name.trim().length < 2) {
      setErrorMsg('Digite seu nome completo para criar a conta.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Informe um e-mail válido.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await signInWithEmail(email, password);
        if (res.error) setErrorMsg(res.error);
      } else {
        const res = await signUpWithEmail(email, password, name);
        if (res.error) {
          setErrorMsg(res.error);
        } else if (res.needsEmailConfirmation) {
          setInfoMsg(
            'Conta criada! Verifique sua caixa de entrada para confirmar o e-mail e depois faça login.'
          );
          setMode('login');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await signInWithGoogle();
      if (res.error) setErrorMsg(res.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-stone-50 text-stone-900 dark:bg-[#040714] dark:text-slate-100 flex flex-col lg:flex-row overflow-hidden transition-colors duration-200">
      {/* Top-right Theme Toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <ThemeToggle />
      </div>

      {/* Left Column — Deep Gradient Atmospheric Brand Showcase (matches reference) */}
      <section className="relative flex w-full lg:w-1/2 flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24 bg-linear-to-br from-indigo-50 via-stone-50 to-purple-50 dark:from-[#040714] dark:via-[#070b1e] dark:to-[#1a0b38] border-b lg:border-b-0 lg:border-r border-stone-200/70 dark:border-slate-800/60">
        {/* Subtle atmospheric radial glow */}
        <div
          className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full opacity-25 dark:opacity-35 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)',
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto w-full max-w-md space-y-7">
          <BrandLogo size="lg" showSubtitle={false} />

          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.08] text-stone-900 dark:text-white">
              Estude de forma{' '}
              <span className="block bg-linear-to-r from-sky-400 via-indigo-400 to-violet-500 bg-clip-text text-transparent">
                inteligente
              </span>
            </h1>
            <p className="text-sm sm:text-base text-stone-600 dark:text-slate-400 leading-relaxed max-w-sm">
              Cronogramas calibrados com sua rotina em H:M, planilha interativa e revisões automáticas para maximizar seu aprendizado.
            </p>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={onOpenHowItWorks}
              className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white/90 px-4 py-2.5 text-xs font-bold text-stone-800 shadow-2xs hover:bg-white hover:border-indigo-400 dark:border-slate-700/90 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-violet-500/70 dark:hover:bg-slate-900 transition whitespace-nowrap shrink-0"
            >
              <BookOpen className="h-4 w-4 text-indigo-600 dark:text-cyan-400" />
              <span>Como funciona o app e planos</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Right Column — Clean Centered Auth Card */}
      <section className="relative flex w-full lg:w-1/2 flex-col items-center justify-center px-5 py-12 sm:px-10 bg-stone-50 dark:bg-[#040714]">
        <div className="w-full max-w-[400px] space-y-6">
          <div className="rounded-2xl border border-stone-200 bg-white p-7 sm:p-8 shadow-xs dark:border-slate-800/90 dark:bg-[#090e1d]">
            {/* Card Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-extrabold tracking-tight text-stone-900 dark:text-white">
                {mode === 'login' ? 'Bem-vindo de volta!' : 'Criar cadastro'}
              </h2>
              <p className="mt-1 text-xs text-stone-500 dark:text-slate-400">
                {mode === 'login'
                  ? 'Entre para continuar seus estudos'
                  : 'Comece do zero e organize sua semana em H:M'}
              </p>

              {mode === 'register' && selectedPlanLabel && (
                <div className="mt-3 flex items-center justify-center gap-2 text-xs font-semibold text-indigo-700 dark:text-cyan-300">
                  <span>Selecionado: {selectedPlanLabel}</span>
                  {onClearSelectedPlan && (
                    <button
                      type="button"
                      onClick={onClearSelectedPlan}
                      className="text-stone-400 hover:text-stone-600 dark:hover:text-slate-200"
                      title="Remover seleção"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Google Sign-In */}
            {isSupabaseEnabled && (
              <>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-stone-200 bg-stone-50 py-2.5 text-xs font-bold text-stone-800 hover:bg-stone-100 dark:border-slate-700/90 dark:bg-[#0d1428] dark:text-slate-100 dark:hover:bg-slate-800/90 transition"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                    />
                  </svg>
                  <span>Continuar com Google</span>
                </button>

                <div className="my-5 flex items-center gap-3 text-[11px] text-stone-400 dark:text-slate-500">
                  <div className="h-px flex-1 bg-stone-200 dark:bg-slate-800" />
                  <span>ou</span>
                  <div className="h-px flex-1 bg-stone-200 dark:bg-slate-800" />
                </div>
              </>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-slate-300 mb-1.5">
                    Nome
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 h-4 w-4 text-stone-400 dark:text-slate-500" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome completo"
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-slate-700/90 dark:bg-[#0d1428] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-cyan-400"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-slate-300 mb-1.5">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-stone-400 dark:text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-slate-700/90 dark:bg-[#0d1428] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-cyan-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-slate-300 mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-stone-400 dark:text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-10 text-sm text-stone-900 placeholder:text-stone-400 focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-slate-700/90 dark:bg-[#0d1428] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-cyan-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-2.5 p-0.5 text-stone-400 hover:text-stone-700 dark:text-slate-500 dark:hover:text-slate-300 transition"
                    title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                  {errorMsg}
                </div>
              )}

              {infoMsg && (
                <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{infoMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !isSupabaseEnabled}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white shadow-md hover:opacity-95 active:scale-[0.99] disabled:opacity-50 transition"
                style={{
                  background: 'linear-gradient(90deg, #0ea5e9 0%, #6366f1 52%, #9333ea 100%)',
                }}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Entrar' : 'Criar cadastro'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Switch Login / Register */}
            <div className="mt-5 text-center text-xs text-stone-500 dark:text-slate-400">
              {mode === 'login' ? (
                <>
                  Não tem conta?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setErrorMsg(null);
                      setInfoMsg(null);
                    }}
                    className="font-bold text-sky-600 hover:underline dark:text-sky-400"
                  >
                    Criar cadastro
                  </button>
                </>
              ) : (
                <>
                  Já tem uma conta?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMsg(null);
                      setInfoMsg(null);
                    }}
                    className="font-bold text-sky-600 hover:underline dark:text-sky-400"
                  >
                    Entrar
                  </button>
                </>
              )}
            </div>

            {/* Discrete Local Test Link */}
            <div className="mt-4 pt-3.5 border-t border-stone-100 dark:border-slate-800/80 text-center">
              <button
                type="button"
                onClick={() => continueOfflineMode(name.trim() || undefined)}
                className="text-[11px] font-medium text-stone-400 hover:text-stone-700 dark:text-slate-500 dark:hover:text-slate-300 transition underline-offset-2 hover:underline"
              >
                Testar neste dispositivo sem conta
              </button>
            </div>
          </div>

          {/* Legal Links Footer */}
          <p className="text-center text-[11px] text-stone-400 dark:text-slate-500 leading-relaxed px-4">
            Ao continuar, você concorda com nossos{' '}
            <button
              type="button"
              onClick={() => setLegalModal('terms')}
              className="font-semibold text-sky-600 hover:underline dark:text-sky-400"
            >
              Termos de Uso
            </button>{' '}
            e{' '}
            <button
              type="button"
              onClick={() => setLegalModal('privacy')}
              className="font-semibold text-sky-600 hover:underline dark:text-sky-400"
            >
              Política de Privacidade
            </button>
            .
          </p>
        </div>
      </section>

      {/* Terms / Privacy Modal */}
      {legalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#0b1121]">
            <button
              type="button"
              onClick={() => setLegalModal(null)}
              className="absolute top-4 right-4 rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-lg font-extrabold text-stone-900 dark:text-white mb-2">
              {legalModal === 'terms' ? 'Termos de Uso' : 'Política de Privacidade'}
            </h3>
            <div className="space-y-3 text-xs text-stone-600 dark:text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              {legalModal === 'terms' ? (
                <>
                  <p>
                    O <strong>my cronograma</strong> oferece organização pessoal de estudos por meio de planilha de ciclos, metas semanais em H:M, grade fixa e revisões espaçadas.
                  </p>
                  <p>
                    Cada assinatura concede acesso individual à conta para gerenciar suas disciplinas, sessões de foco e progresso. Você pode exportar seus dados em JSON ou cancelar sua assinatura a qualquer momento.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Respeitamos sua privacidade. Armazenamos apenas os dados necessários para autenticação (nome e e-mail) e o conteúdo do seu planejamento de estudos (matérias, horários e revisões).
                  </p>
                  <p>
                    Seus registros são isolados por conta e nunca são compartilhados ou vendidos a terceiros. Você pode solicitar a exclusão da conta ou exportar seus dados quando desejar.
                  </p>
                </>
              )}
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
