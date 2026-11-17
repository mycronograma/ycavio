import { StudyMethodId, TaskType, UserProfile } from '../types';

export interface StudyMethodPreset {
  id: StudyMethodId;
  name: string;
  shortName: string;
  badge: string;
  focusMinutes: number;
  breakMinutes: number;
  ratios: {
    teoria: number;
    exercicios: number;
    revisao: number;
  };
  shortDesc: string;
  sessionTip: string;
  interleaveStrength: 'normal' | 'high';
}

export const FOCUS_PRESET_MINUTES = [25, 35, 40, 45, 50, 60];
export const BREAK_PRESET_MINUTES = [5, 10, 15, 20];

export const STUDY_METHODS: StudyMethodPreset[] = [
  {
    id: 'blocos_50_10',
    name: 'Blocos 50/10 (Foco Sustentado)',
    shortName: 'Blocos 50/10',
    badge: 'Recomendado',
    focusMinutes: 50,
    breakMinutes: 10,
    ratios: { teoria: 60, exercicios: 40, revisao: 0 },
    shortDesc: 'Sessões consistentes de 50 min com pausa de 10 min para evitar exaustão mental.',
    sessionTip: 'Mantenha atenção contínua no tópico até o fim e use os 10 min de intervalo para alongar e hidratar.',
    interleaveStrength: 'normal',
  },
  {
    id: 'pomodoro',
    name: 'Técnica Pomodoro',
    shortName: 'Pomodoro',
    badge: 'Anti-procrastinação',
    focusMinutes: 25,
    breakMinutes: 5,
    ratios: { teoria: 50, exercicios: 50, revisao: 0 },
    shortDesc: 'Ciclos curtos e dinâmicos (25/5) ideais para vencer a inércia e manter ritmo ágil.',
    sessionTip: 'Foque em uma micro-entrega clara neste bloco de 25 min; a cada 4 ciclos, permita-se uma pausa maior.',
    interleaveStrength: 'normal',
  },
  {
    id: 'active_recall',
    name: 'Active Recall (Recordação Ativa)',
    shortName: 'Active Recall',
    badge: 'Alta Retenção',
    focusMinutes: 45,
    breakMinutes: 10,
    ratios: { teoria: 40, exercicios: 35, revisao: 25 },
    shortDesc: 'Prioriza fechar o material, lembrar sem consulta e testar a memória ativamente.',
    sessionTip: 'Nos últimos minutos do bloco, feche o material e anote no rascunho tudo o que lembrar sem olhar.',
    interleaveStrength: 'normal',
  },
  {
    id: 'estudo_reverso',
    name: 'Estudo Reverso (Questões Primeiro)',
    shortName: 'Estudo Reverso',
    badge: 'Foco em Prova',
    focusMinutes: 40,
    breakMinutes: 10,
    ratios: { teoria: 25, exercicios: 75, revisao: 0 },
    shortDesc: 'Comece resolvendo questões para mapear lacunas e estudar apenas a teoria necessária.',
    sessionTip: 'Resolva a bateria de questões primeiro e volte à teoria apenas nos pontos de dúvida ou erro.',
    interleaveStrength: 'normal',
  },
  {
    id: 'intercalado',
    name: 'Ciclo Intercalado (Interleaving)',
    shortName: 'Intercalado',
    badge: 'Multimatérias',
    focusMinutes: 35,
    breakMinutes: 5,
    ratios: { teoria: 50, exercicios: 50, revisao: 0 },
    shortDesc: 'Alterna matérias diferentes a cada bloco para evitar tédio e melhorar a discriminação.',
    sessionTip: 'Conclua a meta desta disciplina e use o intervalo para limpar a mente antes de trocar de matéria.',
    interleaveStrength: 'high',
  },
  {
    id: 'feynman',
    name: 'Técnica Feynman (Aprofundamento)',
    shortName: 'Técnica Feynman',
    badge: 'Domínio Profundo',
    focusMinutes: 60,
    breakMinutes: 15,
    ratios: { teoria: 65, exercicios: 35, revisao: 0 },
    shortDesc: 'Blocos profundos com autoexplicação em linguagem simples para zerar pontos cegos.',
    sessionTip: 'Ao finalizar o tópico, explique os conceitos com suas próprias palavras como se ensinasse a um iniciante.',
    interleaveStrength: 'normal',
  },
  {
    id: 'personalizado',
    name: 'Personalizado (Livre)',
    shortName: 'Personalizado',
    badge: 'Sob Medida',
    focusMinutes: 50,
    breakMinutes: 10,
    ratios: { teoria: 50, exercicios: 50, revisao: 0 },
    shortDesc: 'Defina livremente os minutos de foco e pausa conforme sua rotina do dia.',
    sessionTip: 'Siga o ritmo que definiu para este bloco e aproveite o intervalo configurado ao concluir.',
    interleaveStrength: 'normal',
  },
];

export function isValidStudyMethodId(id: unknown): id is StudyMethodId {
  return typeof id === 'string' && STUDY_METHODS.some((m) => m.id === id);
}

export function getStudyMethodPreset(methodId?: StudyMethodId | string): StudyMethodPreset {
  return STUDY_METHODS.find((m) => m.id === methodId) || STUDY_METHODS[0];
}

export function resolveFocusMinutes(profile?: Partial<UserProfile>): number {
  const methodPreset = getStudyMethodPreset(profile?.studyMethod);
  const raw = profile?.preferredSessionLength ?? methodPreset.focusMinutes;
  return Math.min(240, Math.max(10, Math.round(raw || 50)));
}

export function resolveBreakMinutes(profile?: Partial<UserProfile>): number {
  const methodPreset = getStudyMethodPreset(profile?.studyMethod);
  const raw = profile?.preferredBreakLength ?? methodPreset.breakMinutes;
  return Math.min(60, Math.max(1, Math.round(raw || 10)));
}

export function formatMethodProportionLabel(preset: StudyMethodPreset): string {
  const parts = [`${preset.ratios.teoria}% Teoria`, `${preset.ratios.exercicios}% Questões`];
  if (preset.ratios.revisao > 0) {
    parts.push(`${preset.ratios.revisao}% Revisão`);
  }
  return parts.join(' • ');
}
