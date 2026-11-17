import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  LogOut,
  Laptop,
  Loader2,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { BrandLogo } from '../common/BrandLogo';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const {
    state,
    isSupabaseEnabled,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOutUser,
  } = useStudy();

  const currentUser = state.currentUser || {
    id: '',
    name: state.profile.name || 'Visitante',
    email: '',
    isLoggedIn: false,
  };

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState(currentUser.email || '');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(currentUser.name || '');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isCloudAccount = currentUser.isLoggedIn && currentUser.id !== 'local-guest';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Por favor, digite um e-mail válido.');
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
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          setSuccessMsg('Login realizado com sucesso!');
          setTimeout(() => {
            setSuccessMsg(null);
            onClose();
          }, 1000);
        }
      } else {
        const res = await signUpWithEmail(email, password, name || email.split('@')[0]);
        if (res.error) {
          setErrorMsg(res.error);
        } else if (res.needsEmailConfirmation) {
          setSuccessMsg('Cadastro criado! Confirme o e-mail enviado e entre novamente.');
        } else {
          setSuccessMsg('Conta criada com sucesso!');
          setTimeout(() => {
            setSuccessMsg(null);
            onClose();
          }, 1000);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOutUser();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 sm:p-7 shadow-2xl dark:border-stone-800 dark:bg-stone-900 transition-all">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-xl p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {isCloudAccount ? (
          <div className="text-center py-2 space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <ShieldCheck className="h-7 w-7" />
            </div>

            <div>
              <h2 className="text-xl font-black text-stone-900 dark:text-stone-100">
                Minha Conta
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Seus estudos, planilha e revisões estão salvos automaticamente na sua conta.
              </p>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-800/50 text-left">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 font-extrabold text-white text-sm">
                  {(currentUser.name || currentUser.email || 'E').slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                    {currentUser.name || 'Estudante'}
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                    {currentUser.email}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                disabled={loading}
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50/70 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 transition"
              >
                <LogOut className="h-4 w-4" />
                <span>Sair da Conta</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition"
              >
                Continuar Estudando
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-center mb-5 flex flex-col items-center">
              <div className="mb-3">
                <BrandLogo iconOnly size="lg" />
              </div>
              <h2 className="text-xl font-black text-stone-900 dark:text-stone-100">
                {mode === 'login' ? 'Entrar no my cronograma' : 'Criar Conta'}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                {currentUser.id === 'local-guest'
                  ? 'Entre com sua conta para manter seus estudos salvos em qualquer dispositivo.'
                  : 'Acesse sua conta para manter seu cronograma sempre salvo.'}
              </p>
            </div>

            {currentUser.id === 'local-guest' && (
              <div className="mb-4 flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs dark:border-stone-800 dark:bg-stone-800/60">
                <span className="flex items-center gap-1.5 font-semibold text-stone-700 dark:text-stone-300">
                  <Laptop className="h-3.5 w-3.5 text-stone-500" />
                  Uso neste dispositivo
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="font-bold text-rose-600 hover:underline dark:text-rose-400"
                >
                  Trocar de conta
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-1 rounded-xl bg-stone-100 p-1 dark:bg-stone-800 mb-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`rounded-lg py-2 transition ${
                  mode === 'login'
                    ? 'bg-white text-stone-900 shadow-xs dark:bg-stone-900 dark:text-stone-100'
                    : 'text-stone-500 hover:text-stone-900 dark:text-stone-400'
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`rounded-lg py-2 transition ${
                  mode === 'register'
                    ? 'bg-white text-stone-900 shadow-xs dark:bg-stone-900 dark:text-stone-100'
                    : 'text-stone-500 hover:text-stone-900 dark:text-stone-400'
                }`}
              >
                Cadastrar
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Maria Clara"
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-3 text-sm text-stone-900 focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-3 text-sm text-stone-900 focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-3 text-sm text-stone-900 focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                    required
                  />
                </div>
              </div>

              {errorMsg && (
                <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                  {errorMsg}
                </p>
              )}

              {successMsg && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !isSupabaseEnabled}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Entrar' : 'Concluir Cadastro'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {isSupabaseEnabled && (
              <div className="mt-3">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void signInWithGoogle()}
                  className="w-full rounded-xl border border-stone-200 bg-white py-2 text-xs font-bold text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 transition"
                >
                  Entrar com Google
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
