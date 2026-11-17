import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  Layers,
  RotateCw,
  Shield,
  Table2,
  Target,
  TrendingUp,
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { ThemeToggle } from '../common/ThemeToggle';

interface HowItWorksPageProps {
  onBackToLogin: () => void;
  onStartRegister: (planLabel?: string) => void;
}

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Como funciona o início zerado quando crio minha conta?',
    answer:
      'Ao entrar pela primeira vez, você começa com 0 matérias, 0 XP e 0 dias seguidos. Em seguida escolhe um preset (ENEM, Medicina, Concursos ou Personalizado) e informa seus horários reais em H:M no questionário de 4 passos.',
  },
  {
    question: 'O que acontece se eu trabalhar ou tiver faculdade em alguns horários?',
    answer:
      'Na Grade Fixa você marca seus compromissos semanais (trabalho, aulas, deslocamento). O sistema calcula os minutos bloqueados por dia da semana e gera blocos de estudo apenas no tempo líquido livre.',
  },
  {
    question: 'Como a planilha de ciclo funciona no dia a dia?',
    answer:
      'Cada matéria fica em uma linha editável com Peso, Ciclo atual, Revisão, Caderno de Questões e Onde Parei. Quando concluir todas as matérias da rodada, você avança o ciclo com um clique e mantém o histórico organizado.',
  },
  {
    question: 'Posso usar tanto no computador quanto no celular?',
    answer:
      'Sim. Seu progresso fica salvo na sua conta e pode ser acessado pelo navegador no computador, tablet ou celular com layout adaptado para cada tela.',
  },
];

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({
  onBackToLogin,
  onStartRegister,
}) => {
  const [billingCycle, setBillingCycle] = useState<'mensal' | 'anual'>('anual');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const essentialPrice = billingCycle === 'anual' ? '19,90' : '29,90';
  const completePrice = billingCycle === 'anual' ? '27,90' : '39,90';

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 dark:bg-[#040714] dark:text-slate-100 transition-colors duration-200">
      {/* Top Bar Contract: Brand — Anchor Nav Links — Theme + Primary Action */}
      <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800/80 dark:bg-[#040714]/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6">
          <button
            type="button"
            onClick={onBackToLogin}
            className="text-left focus:outline-hidden whitespace-nowrap shrink-0"
          >
            <BrandLogo size="sm" showSubtitle={false} />
          </button>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600 dark:text-slate-300">
            <a
              href="#como-funciona"
              className="hover:text-stone-950 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Como funciona
            </a>
            <a
              href="#recursos"
              className="hover:text-stone-950 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Recursos
            </a>
            <a
              href="#planos"
              className="hover:text-stone-950 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Planos
            </a>
            <a
              href="#duvidas"
              className="hover:text-stone-950 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Dúvidas
            </a>
          </nav>

          <div className="flex items-center gap-2.5 shrink-0">
            <ThemeToggle />
            <button
              type="button"
              onClick={onBackToLogin}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Entrar</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Hero Proposition */}
        <section className="py-14 sm:py-20 border-b border-stone-200/80 dark:border-slate-800/70">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600 dark:text-cyan-400">
                Método prático de estudo diário
              </p>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-stone-900 dark:text-white leading-[1.08]">
                Estude com clareza,{' '}
                <span className="bg-linear-to-r from-sky-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent">
                  rotina real em H:M
                </span>{' '}
                e controle total do edital.
              </h1>
              <p className="text-base sm:text-lg text-stone-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                O my cronograma transforma suas horas disponíveis da semana em blocos equilibrados por peso de matéria, controla seus ciclos na planilha e agenda revisões automáticas sem planilhas complicadas.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => onStartRegister('Plano Completo')}
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-md transition hover:opacity-95 whitespace-nowrap shrink-0"
                  style={{
                    background: 'linear-gradient(90deg, #0ea5e9 0%, #6366f1 52%, #9333ea 100%)',
                  }}
                >
                  <span>Começar agora</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <a
                  href="#planos"
                  className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-5 py-3 text-sm font-bold text-stone-800 hover:bg-stone-100 dark:border-slate-700 dark:bg-[#0b1121] dark:text-slate-200 dark:hover:bg-slate-800/80 transition whitespace-nowrap shrink-0"
                >
                  Ver planos de assinatura
                </a>
              </div>
            </div>

            {/* Concrete UI Snapshot Preview */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-stone-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0b1121] space-y-5">
                <div className="flex items-center justify-between border-b border-stone-100 dark:border-slate-800 pb-3">
                  <div>
                    <p className="text-xs font-semibold text-stone-500 dark:text-slate-400">
                      Rotina semanal configurada
                    </p>
                    <p className="text-lg font-extrabold text-stone-900 dark:text-white tabular-nums">
                      18h 30m livres / semana
                    </p>
                  </div>
                  <Clock className="h-5 w-5 text-indigo-500 dark:text-cyan-400" />
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between rounded-xl bg-stone-50 px-3.5 py-2.5 dark:bg-slate-900/70">
                    <span className="font-semibold text-stone-800 dark:text-slate-200">
                      Seg a Sex • Meta diária
                    </span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-cyan-400 tabular-nums">
                      02:30 / dia
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-stone-50 px-3.5 py-2.5 dark:bg-slate-900/70">
                    <span className="font-semibold text-stone-800 dark:text-slate-200">
                      Sábado • Simulado + Revisão
                    </span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-cyan-400 tabular-nums">
                      06:00 / dia
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-stone-50 px-3.5 py-2.5 dark:bg-slate-900/70">
                    <span className="font-semibold text-stone-800 dark:text-slate-200">
                      Ciclos automáticos de revisão
                    </span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      D+1 · D+7 · D+15 · D+30
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 1: 3-Step Workflow */}
        <section id="como-funciona" className="py-14 sm:py-16 border-b border-stone-200/80 dark:border-slate-800/70">
          <div className="max-w-2xl space-y-2 mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600 dark:text-cyan-400">
              Passo a passo simples
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 dark:text-white">
              Do zero ao seu cronograma em menos de 3 minutos
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-stone-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0b1121] space-y-3">
              <span className="font-mono text-xs font-bold text-indigo-600 dark:text-cyan-400">
                01. ESCOLHA SEU OBJETIVO
              </span>
              <h3 className="text-lg font-bold text-stone-900 dark:text-white">
                Preset pronto ou do zero
              </h3>
              <p className="text-sm text-stone-600 dark:text-slate-400 leading-relaxed">
                Comece com tudo zerado e selecione ENEM, Medicina, Concursos ou crie suas próprias matérias com tópicos individuais.
              </p>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0b1121] space-y-3">
              <span className="font-mono text-xs font-bold text-indigo-600 dark:text-cyan-400">
                02. ROTINA REAL EM H:M
              </span>
              <h3 className="text-lg font-bold text-stone-900 dark:text-white">
                Seu tempo por dia da semana
              </h3>
              <p className="text-sm text-stone-600 dark:text-slate-400 leading-relaxed">
                Informe exatamente quantas horas e minutos (H:M) tem de domingo a sábado e bloqueie sua Grade Fixa de trabalho ou aulas.
              </p>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0b1121] space-y-3">
              <span className="font-mono text-xs font-bold text-indigo-600 dark:text-cyan-400">
                03. EXECUTE E EVOLUA
              </span>
              <h3 className="text-lg font-bold text-stone-900 dark:text-white">
                Planilha, cronômetro e revisões
              </h3>
              <p className="text-sm text-stone-600 dark:text-slate-400 leading-relaxed">
                Anote onde parou direto na planilha, dispare o cronômetro de foco flexível e deixe as revisões D+1/D+7/D+15/D+30 no piloto automático.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Asymmetric Bento Capabilities */}
        <section id="recursos" className="py-14 sm:py-16 border-b border-stone-200/80 dark:border-slate-800/70">
          <div className="max-w-2xl space-y-2 mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600 dark:text-cyan-400">
              Tudo em um só lugar
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 dark:text-white">
              Feito para manter constância até o dia da prova
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 rounded-2xl border border-stone-200 bg-white p-6 sm:p-7 dark:border-slate-800 dark:bg-[#0b1121] space-y-3">
              <Table2 className="h-5 w-5 text-indigo-600 dark:text-cyan-400" />
              <h3 className="text-xl font-bold text-stone-900 dark:text-white">
                Planilha de Ciclo Editável na Hora
              </h3>
              <p className="text-sm text-stone-600 dark:text-slate-400 leading-relaxed">
                Visualize todas as suas disciplinas em uma tabela clara: ajuste o peso de prioridade, registre a aula exata onde parou, o caderno de questões e vire o ciclo completo com um clique sem perder o histórico.
              </p>
              <div className="pt-2 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-stone-500 dark:text-slate-400">
                <span>• Edição inline instantânea</span>
                <span>• Início direto de bloco pelo botão Estudar</span>
                <span>• Controle de conclusão por matéria</span>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-2xl border border-stone-200 bg-white p-6 sm:p-7 dark:border-slate-800 dark:bg-[#0b1121] space-y-3">
              <Shield className="h-5 w-5 text-indigo-600 dark:text-cyan-400" />
              <h3 className="text-xl font-bold text-stone-900 dark:text-white">
                Grade Fixa + Tempo Líquido
              </h3>
              <p className="text-sm text-stone-600 dark:text-slate-400 leading-relaxed">
                Cadastre trabalho, faculdade ou academia. O algoritmo deduz os horários bloqueados e alerta se sua meta diária ultrapassar o tempo livre real.
              </p>
            </div>

            <div className="lg:col-span-5 rounded-2xl border border-stone-200 bg-white p-6 sm:p-7 dark:border-slate-800 dark:bg-[#0b1121] space-y-3">
              <RotateCw className="h-5 w-5 text-indigo-600 dark:text-cyan-400" />
              <h3 className="text-xl font-bold text-stone-900 dark:text-white">
                Repetição Espaçada Automática
              </h3>
              <p className="text-sm text-stone-600 dark:text-slate-400 leading-relaxed">
                Cada estudo concluído programa revisões em 1, 7, 15 e 30 dias para evitar que o conteúdo estudado caia no esquecimento.
              </p>
            </div>

            <div className="lg:col-span-7 rounded-2xl border border-stone-200 bg-white p-6 sm:p-7 dark:border-slate-800 dark:bg-[#0b1121] space-y-3">
              <div className="flex items-center gap-4">
                <Target className="h-5 w-5 text-indigo-600 dark:text-cyan-400" />
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 dark:text-white">
                Caderno de Questões, Mapa de Calor e Projeção de Edital
              </h3>
              <p className="text-sm text-stone-600 dark:text-slate-400 leading-relaxed">
                Registre acertos por sessão, enxergue suas matérias mais fortes e as que precisam de reforço, acompanhe sua sequência diária e veja a estimativa de ritmo até a data da prova.
              </p>
              <div className="pt-2 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-stone-500 dark:text-slate-400">
                <span>• Cronômetro flexível HH:MM</span>
                <span>• Níveis, XP e Conquistas reais</span>
                <span>• Backup e exportação JSON</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Subscription Plans */}
        <section id="planos" className="py-14 sm:py-16 border-b border-stone-200/80 dark:border-slate-800/70">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600 dark:text-cyan-400">
                Planos de assinatura
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 dark:text-white">
                Escolha o plano ideal para sua preparação
              </h2>
            </div>

            {/* Segmented Billing Toggle */}
            <div className="inline-flex items-center gap-1 rounded-xl border border-stone-200 bg-stone-100 p-1 text-xs font-bold dark:border-slate-800 dark:bg-[#0b1121] self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setBillingCycle('mensal')}
                className={`rounded-lg px-3.5 py-2 transition whitespace-nowrap ${
                  billingCycle === 'mensal'
                    ? 'bg-white text-stone-900 shadow-2xs dark:bg-slate-800 dark:text-white'
                    : 'text-stone-600 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Mensal
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('anual')}
                className={`rounded-lg px-3.5 py-2 transition whitespace-nowrap ${
                  billingCycle === 'anual'
                    ? 'bg-white text-stone-900 shadow-2xs dark:bg-slate-800 dark:text-white'
                    : 'text-stone-600 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Anual (30% off)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Essencial */}
            <div className="rounded-2xl border border-stone-200 bg-white p-7 dark:border-slate-800 dark:bg-[#0b1121] flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-extrabold text-stone-900 dark:text-white">
                    Plano Essencial
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                    Para quem quer organizar matérias e cronograma semanal com clareza
                  </p>
                </div>

                <div className="flex items-baseline gap-1.5 tabular-nums">
                  <span className="text-sm font-bold text-stone-500 dark:text-slate-400">R$</span>
                  <span className="text-4xl font-black text-stone-900 dark:text-white">
                    {essentialPrice}
                  </span>
                  <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">
                    / mês {billingCycle === 'anual' ? 'no plano anual' : ''}
                  </span>
                </div>

                <ul className="space-y-2.5 text-sm text-stone-600 dark:text-slate-300 pt-2 border-t border-stone-100 dark:border-slate-800">
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Presets completos (ENEM, Medicina, Concursos) + Personalizado</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Planilha editável com ciclo, peso e onde parou</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Rotina diária em H:M e cronômetro flexível</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Acesso salvo na nuvem em todos os dispositivos</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() =>
                  onStartRegister(`Plano Essencial (${billingCycle})`)
                }
                className="w-full rounded-xl border border-stone-300 bg-stone-50 py-3 text-xs font-bold text-stone-900 hover:bg-stone-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800 transition"
              >
                Começar no Essencial
              </button>
            </div>

            {/* Completo */}
            <div className="rounded-2xl border border-indigo-500/60 bg-white p-7 dark:border-indigo-500/50 dark:bg-[#0d152b] flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-extrabold text-stone-900 dark:text-white">
                      Plano Completo
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                      Para preparação intensiva com revisões automáticas e análise completa
                    </p>
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-cyan-400 whitespace-nowrap">
                    Mais escolhido
                  </span>
                </div>

                <div className="flex items-baseline gap-1.5 tabular-nums">
                  <span className="text-sm font-bold text-stone-500 dark:text-slate-400">R$</span>
                  <span className="text-4xl font-black text-stone-900 dark:text-white">
                    {completePrice}
                  </span>
                  <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">
                    / mês {billingCycle === 'anual' ? 'no plano anual' : ''}
                  </span>
                </div>

                <ul className="space-y-2.5 text-sm text-stone-600 dark:text-slate-300 pt-2 border-t border-stone-100 dark:border-slate-800">
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-cyan-500 shrink-0 mt-0.5" />
                    <span>Tudo do Plano Essencial sem limites de matérias</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-cyan-500 shrink-0 mt-0.5" />
                    <span>Grade Fixa inteligente com detecção de conflito de horários</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-cyan-500 shrink-0 mt-0.5" />
                    <span>Revisão espaçada automática (D+1, D+7, D+15, D+30)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-cyan-500 shrink-0 mt-0.5" />
                    <span>Caderno de questões, mapa de calor, projeção e conquistas</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() =>
                  onStartRegister(`Plano Completo (${billingCycle})`)
                }
                className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold text-white shadow-md transition hover:opacity-95"
                style={{
                  background: 'linear-gradient(90deg, #0ea5e9 0%, #6366f1 52%, #9333ea 100%)',
                }}
              >
                <span>Assinar Plano Completo</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Section 4: FAQ */}
        <section id="duvidas" className="py-14 sm:py-16">
          <div className="max-w-3xl mx-auto">
            <div className="text-center space-y-2 mb-8">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600 dark:text-cyan-400">
                Dúvidas frequentes
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 dark:text-white">
                Perguntas sobre o funcionamento
              </h2>
            </div>

            <div className="divide-y divide-stone-200 dark:divide-slate-800 rounded-2xl border border-stone-200 bg-white dark:border-slate-800 dark:bg-[#0b1121]">
              {FAQ_ITEMS.map((item, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div key={item.question}>
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left text-sm font-bold text-stone-900 dark:text-white hover:bg-stone-50 dark:hover:bg-slate-900/40 transition"
                    >
                      <span>{item.question}</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-stone-400 transition-transform ${
                          isOpen ? 'rotate-180 text-indigo-500' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-5 text-sm text-stone-600 dark:text-slate-400 leading-relaxed">
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-stone-200 dark:border-slate-800/80 py-8">
        <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 text-xs text-stone-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" showSubtitle={false} />
            <span>·</span>
            <span>Estudo Inteligente</span>
          </div>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={onBackToLogin}
              className="font-semibold hover:text-stone-900 dark:hover:text-white transition"
            >
              Voltar para o login
            </button>
            <button
              type="button"
              onClick={() => onStartRegister('Plano Completo')}
              className="font-bold text-indigo-600 dark:text-cyan-400 hover:underline"
            >
              Criar cadastro
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
