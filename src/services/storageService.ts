import { AppState, Subject, Achievement, UserProfile, StudyProfileType } from '../types';
import { getTodayStr, addDays, generateSmartSchedule } from './scheduleEngine';

const STORAGE_KEY = 'trilha_estudos_app_v1';

export interface PresetGoal {
  id: string;
  name: string;
  category: string;
  description: string;
  defaultExamOffsetDays: number;
  subjects: Array<{
    name: string;
    color: string;
    weight: number;
    difficulty: 'baixa' | 'media' | 'alta';
    knowledgeLevel: 'iniciante' | 'intermediario' | 'avancado';
    topics: string[];
  }>;
}

export const STUDY_PRESETS: PresetGoal[] = [
  {
    id: 'enem',
    name: 'ENEM & Vestibulares',
    category: 'Vestibular',
    description: 'Focado nas 4 áreas do conhecimento e Redação nota 1000',
    defaultExamOffsetDays: 120,
    subjects: [
      {
        name: 'Matemática & Suas Tecnologias',
        color: '#3b82f6', // blue
        weight: 5,
        difficulty: 'alta',
        knowledgeLevel: 'intermediario',
        topics: ['Funções & Gráficos', 'Geometria Espacial', 'Probabilidade & Estatística', 'Razão e Proporção', 'Trigonometria'],
      },
      {
        name: 'Redação',
        color: '#ec4899', // pink
        weight: 5,
        difficulty: 'alta',
        knowledgeLevel: 'intermediario',
        topics: ['Estrutura Dissertativa', 'Repertório Sociocultural', 'Proposta de Intervenção (5 Elementos)', 'Coesão & Conectivos'],
      },
      {
        name: 'Física',
        color: '#8b5cf6', // purple
        weight: 4,
        difficulty: 'alta',
        knowledgeLevel: 'iniciante',
        topics: ['Cinemática & Dinâmica', 'Circuitos Elétricos', 'Termodinâmica', 'Ondulatória & Óptica'],
      },
      {
        name: 'Biologia',
        color: '#10b981', // emerald
        weight: 4,
        difficulty: 'media',
        knowledgeLevel: 'intermediario',
        topics: ['Ecologia & Biomas', 'Genética Mendeliana', 'Citologia & Bioenergética', 'Fisiologia Humana'],
      },
      {
        name: 'História & Filosofia',
        color: '#f59e0b', // amber
        weight: 3,
        difficulty: 'media',
        knowledgeLevel: 'avancado',
        topics: ['Brasil Colônia e Império', 'Ditadura Militar', 'Filosofia Política & Iluminismo', 'Cidadania & Direitos'],
      },
      {
        name: 'Linguagens & Literatura',
        color: '#06b6d4', // cyan
        weight: 3,
        difficulty: 'baixa',
        knowledgeLevel: 'avancado',
        topics: ['Interpretação de Texto', 'Figuras de Linguagem', 'Gêneros Textuais', 'Modernismo Brasileiro'],
      },
    ],
  },
  {
    id: 'concurso_geral',
    name: 'Concursos Públicos (Geral / Fiscal)',
    category: 'Concurso',
    description: 'Estrutura padrão para carreiras administrativas, tribunais e fiscais',
    defaultExamOffsetDays: 90,
    subjects: [
      {
        name: 'Direito Constitucional',
        color: '#6366f1', // indigo
        weight: 5,
        difficulty: 'media',
        knowledgeLevel: 'intermediario',
        topics: ['Direitos e Garantias Fundamentais', 'Organização do Estado', 'Poder Executivo e Legislativo', 'Controle de Constitucionalidade'],
      },
      {
        name: 'Direito Administrativo',
        color: '#0ea5e9', // sky
        weight: 5,
        difficulty: 'alta',
        knowledgeLevel: 'intermediario',
        topics: ['Atos Administrativos', 'Licitações & Contratos (Lei 14.133)', 'Poderes Administrativos', 'Responsabilidade Civil do Estado'],
      },
      {
        name: 'Língua Portuguesa',
        color: '#10b981', // emerald
        weight: 5,
        difficulty: 'alta',
        knowledgeLevel: 'iniciante',
        topics: ['Sintaxe de Concordância e Regência', 'Pontuação e Crase', 'Interpretação e Tipologia', 'Ortografia e Acentuação'],
      },
      {
        name: 'Raciocínio Lógico & Mat.',
        color: '#f97316', // orange
        weight: 4,
        difficulty: 'alta',
        knowledgeLevel: 'iniciante',
        topics: ['Lógica de Proposições', 'Tabelas-Verdade & Equivalências', 'Análise Combinatória', 'Diagramas Lógicos'],
      },
      {
        name: 'Informática para Concursos',
        color: '#14b8a6', // teal
        weight: 3,
        difficulty: 'baixa',
        knowledgeLevel: 'intermediario',
        topics: ['Segurança da Informação & Malware', 'Redes & Computação em Nuvem', 'Suíte Office / LibreOffice', 'Sistemas Operacionais'],
      },
    ],
  },
  {
    id: 'oab',
    name: 'Exame de Ordem (OAB 1ª Fase)',
    category: 'Certificação',
    description: 'Disciplinas estratégicas com maior peso para garantir os 40 pontos',
    defaultExamOffsetDays: 75,
    subjects: [
      {
        name: 'Ética Profissional & Estatuto',
        color: '#ef4444', // red
        weight: 5,
        difficulty: 'baixa',
        knowledgeLevel: 'intermediario',
        topics: ['Direitos do Advogado', 'Infrações e Sanções Disciplinares', 'Honorários Advocatícios', 'Sociedade de Advogados'],
      },
      {
        name: 'Direito Civil & Processo Civil',
        color: '#3b82f6',
        weight: 5,
        difficulty: 'alta',
        knowledgeLevel: 'intermediario',
        topics: ['Contratos e Obrigações', 'Tutelas Provisórias', 'Recursos no CPC', 'Responsabilidade Civil'],
      },
      {
        name: 'Direito Penal & Processo Penal',
        color: '#8b5cf6',
        weight: 4,
        difficulty: 'media',
        knowledgeLevel: 'iniciante',
        topics: ['Teoria do Crime & Ilicitude', 'Prisão e Liberdade Provisória', 'Crimes Contra o Patrimônio', 'Ação Penal'],
      },
      {
        name: 'Direito do Trabalho & Processual',
        color: '#f59e0b',
        weight: 4,
        difficulty: 'media',
        knowledgeLevel: 'intermediario',
        topics: ['Rescisão do Contrato de Trabalho', 'Jornada e Horas Extras', 'Recursos Trabalhistas', 'Audiência Trabalhista'],
      },
      {
        name: 'Direito Constitucional',
        color: '#10b981',
        weight: 4,
        difficulty: 'media',
        knowledgeLevel: 'avancado',
        topics: ['Remédios Constitucionais', 'Ações de Controle Concentrado', 'Processo Legislativo'],
      },
    ],
  },
  {
    id: 'dev_tech',
    name: 'Tecnologia & Programação',
    category: 'Carreira Tech',
    description: 'Do básico a algoritmos, arquitetura e engenharia de software',
    defaultExamOffsetDays: 180,
    subjects: [
      {
        name: 'Estrutura de Dados & Algoritmos',
        color: '#6366f1',
        weight: 5,
        difficulty: 'alta',
        knowledgeLevel: 'iniciante',
        topics: ['Arrays, Pilhas e Filas', 'Árvores Binárias & Busca', 'Complexidade Big-O', 'Algoritmos de Ordenação'],
      },
      {
        name: 'Engenharia de Software & Bancos',
        color: '#0ea5e9',
        weight: 4,
        difficulty: 'media',
        knowledgeLevel: 'intermediario',
        topics: ['Modelagem Relacional & SQL', 'Design Patterns (GoF)', 'APIs RESTful & Clean Code', 'Git & CI/CD'],
      },
      {
        name: 'Frontend Moderno',
        color: '#10b981',
        weight: 4,
        difficulty: 'media',
        knowledgeLevel: 'intermediario',
        topics: ['React Hooks & Estado', 'TypeScript Avançado', 'Tailwind & UI Responsiva', 'Testes Automatizados'],
      },
      {
        name: 'Inglês Técnico',
        color: '#f59e0b',
        weight: 3,
        difficulty: 'baixa',
        knowledgeLevel: 'avancado',
        topics: ['Leitura de Documentação', 'Vocabulário de Arquitetura', 'Simulação de Entrevistas'],
      },
    ],
  },
];

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_step',
    title: 'Primeiro Passo',
    description: 'Conclua a sua primeira sessão de estudos no aplicativo',
    icon: 'Footprints',
    category: 'xp',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    xpReward: 100,
  },
  {
    id: 'streak_3',
    title: 'Fogo Sagrado (3 Dias)',
    description: 'Mantenha uma sequência de 3 dias consecutivos de estudo',
    icon: 'Flame',
    category: 'streak',
    unlocked: false,
    progress: 0,
    maxProgress: 3,
    xpReward: 250,
  },
  {
    id: 'streak_7',
    title: 'Hábito de Aço (7 Dias)',
    description: 'Complete 7 dias consecutivos com foco nos estudos',
    icon: 'ShieldCheck',
    category: 'streak',
    unlocked: false,
    progress: 0,
    maxProgress: 7,
    xpReward: 600,
  },
  {
    id: 'hours_5',
    title: 'Foco Produtivo (5 Horas)',
    description: 'Acumule 5 horas líquidas de estudo dedicado',
    icon: 'Clock',
    category: 'hours',
    unlocked: false,
    progress: 0,
    maxProgress: 300, // in minutes
    xpReward: 300,
  },
  {
    id: 'hours_20',
    title: 'Maratonista Intelectual',
    description: 'Acumule 20 horas líquidas de estudo no cronograma',
    icon: 'Award',
    category: 'hours',
    unlocked: false,
    progress: 0,
    maxProgress: 1200,
    xpReward: 1000,
  },
  {
    id: 'review_master',
    title: 'Mestre da Curva do Esquecimento',
    description: 'Conclua 5 revisões espaçadas programadas',
    icon: 'RotateCw',
    category: 'reviews',
    unlocked: false,
    progress: 0,
    maxProgress: 5,
    xpReward: 350,
  },
  {
    id: 'perfect_session',
    title: 'Mira Certeira',
    description: 'Realize uma sessão de exercícios com mais de 85% de acertos (mínimo 5 questões)',
    icon: 'Target',
    category: 'mastery',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    xpReward: 200,
  },
];

export function createDefaultState(): AppState {
  const todayStr = getTodayStr();
  const defaultPreset = STUDY_PRESETS[0]; // ENEM
  const examDate = addDays(todayStr, defaultPreset.defaultExamOffsetDays);

  const profile: UserProfile = {
    name: 'Estudante Focado',
    objective: defaultPreset.name,
    targetExam: 'ENEM 2026',
    examDate: examDate,
    profileType: 'vestibulando',
    dailyAvailableMinutes: 120, // 2h/day
    availableDays: [1, 2, 3, 4, 5], // Seg a Sex
    preferredSessionLength: 50,
    xp: 220,
    level: 2,
    streakDays: 1,
    lastActiveDate: todayStr,
    freezeStreakCount: 1,
    onboardingCompleted: true,
    createdAt: todayStr,
  };

  const subjects: Subject[] = defaultPreset.subjects.map((s, idx) => ({
    id: `sub-${idx + 1}`,
    name: s.name,
    color: s.color,
    weight: s.weight,
    difficulty: s.difficulty,
    knowledgeLevel: s.knowledgeLevel,
    topics: s.topics.map((tName, tIdx) => ({
      id: `top-${idx + 1}-${tIdx + 1}`,
      name: tName,
      completed: tIdx === 0 && idx === 0, // 1 sample topic completed
      completedAt: tIdx === 0 && idx === 0 ? todayStr : undefined,
      exercisesCount: tIdx === 0 && idx === 0 ? 10 : 0,
      exercisesCorrect: tIdx === 0 && idx === 0 ? 8 : 0,
    })),
    totalMinutesStudied: idx === 0 ? 50 : 0,
    lastStudiedAt: idx === 0 ? todayStr : undefined,
    completedTasksCount: idx === 0 ? 1 : 0,
    totalExercisesDone: idx === 0 ? 10 : 0,
    totalExercisesCorrect: idx === 0 ? 8 : 0,
  }));

  const reviews = [
    {
      id: 'rev-sample-1',
      subjectId: 'sub-1',
      subjectName: 'Matemática & Suas Tecnologias',
      subjectColor: '#3b82f6',
      topicName: 'Funções & Gráficos',
      step: 1,
      dueDate: addDays(todayStr, 1),
      status: 'pendente' as const,
      lastStudiedDate: todayStr,
    },
  ];

  const tasks = generateSmartSchedule(profile, subjects, reviews, [], 7);

  // Set the first task of today as completed to provide a clean realistic state
  const todayTasks = tasks.filter((t) => t.date === todayStr);
  if (todayTasks.length > 0) {
    todayTasks[0].status = 'concluida';
    todayTasks[0].completedAt = new Date().toISOString();
    todayTasks[0].actualDurationMinutes = 50;
    todayTasks[0].exercisesDone = 10;
    todayTasks[0].exercisesCorrect = 8;
  }

  const sessions = [
    {
      id: 'sess-init-1',
      subjectId: 'sub-1',
      subjectName: 'Matemática & Suas Tecnologias',
      topicName: 'Funções & Gráficos',
      type: 'teoria' as const,
      durationMinutes: 50,
      date: todayStr,
      exercisesDone: 10,
      exercisesCorrect: 8,
      xpEarned: 110,
      notes: 'Entendi bem o vértice da parábola e raízes da função quadrática.',
    },
  ];

  return {
    profile,
    subjects,
    tasks,
    reviews,
    sessions,
    achievements: INITIAL_ACHIEVEMENTS.map((a) =>
      a.id === 'first_step' ? { ...a, unlocked: true, progress: 1, unlockedAt: todayStr } : a
    ),
    dailyGoal: {
      targetMinutes: 100,
      targetTasks: 2,
      completedMinutes: 50,
      completedTasks: 1,
    },
    lastScheduleGeneratedAt: new Date().toISOString(),
  };
}

export function loadStoredState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const defaultState = createDefaultState();
      saveStoredState(defaultState);
      return defaultState;
    }
    const parsed = JSON.parse(raw) as AppState;
    // Basic schema check
    if (!parsed.profile || !parsed.subjects || !parsed.tasks) {
      const fallback = createDefaultState();
      saveStoredState(fallback);
      return fallback;
    }
    return parsed;
  } catch (err) {
    console.warn('Error loading from localStorage, using fresh state', err);
    return createDefaultState();
  }
}

export function saveStoredState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to persist to localStorage', err);
  }
}

export function resetAppToOnboarding(): AppState {
  const todayStr = getTodayStr();
  const freshProfile: UserProfile = {
    name: '',
    objective: '',
    targetExam: '',
    profileType: 'iniciante',
    dailyAvailableMinutes: 120,
    availableDays: [1, 2, 3, 4, 5],
    preferredSessionLength: 50,
    xp: 0,
    level: 1,
    streakDays: 0,
    freezeStreakCount: 1,
    onboardingCompleted: false,
    createdAt: todayStr,
  };

  const emptyState: AppState = {
    profile: freshProfile,
    subjects: [],
    tasks: [],
    reviews: [],
    sessions: [],
    achievements: INITIAL_ACHIEVEMENTS,
    dailyGoal: {
      targetMinutes: 100,
      targetTasks: 2,
      completedMinutes: 0,
      completedTasks: 0,
    },
  };

  saveStoredState(emptyState);
  return emptyState;
}
