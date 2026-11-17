import { AppState, Subject, Achievement, UserProfile, UserAccount, DailyGoal, StudySession, Task, ActiveTimerDraft } from '../types';
import { getTodayStr } from './scheduleEngine';
import { isValidStudyMethodId } from './studyMethods';

export interface PresetModule {
  id: string;
  name: string;
  description: string;
  subjects: Array<{
    name: string;
    color: string;
    weight: number;
    difficulty: 'baixa' | 'media' | 'alta';
    knowledgeLevel: 'iniciante' | 'intermediario' | 'avancado';
    topics: string[];
  }>;
}

export interface PresetGoal {
  id: string;
  name: string;
  category: string;
  description: string;
  defaultExamOffsetDays: number;
  weeklyHoursByLoad: {
    leve: string;
    normal: string;
    intensivo: string;
  };
  subjects: Array<{
    name: string;
    color: string;
    weight: number;
    difficulty: 'baixa' | 'media' | 'alta';
    knowledgeLevel: 'iniciante' | 'intermediario' | 'avancado';
    topics: string[];
  }>;
  modules?: PresetModule[];
}

export const STUDY_PRESETS: PresetGoal[] = [
  {
    id: 'enem',
    name: 'ENEM',
    category: 'Vestibular',
    description: 'Todas as disciplinas das 4 áreas oficiais do ENEM e Redação, com idiomas e complementares opcionais',
    defaultExamOffsetDays: 120,
    weeklyHoursByLoad: {
      leve: '17:30/sem',
      normal: '25:00/sem',
      intensivo: '36:00/sem',
    },
    subjects: [
      {
        name: 'Matemática',
        color: '#3b82f6',
        weight: 5,
        difficulty: 'alta',
        knowledgeLevel: 'intermediario',
        topics: [],
      },
      {
        name: 'Redação',
        color: '#ec4899',
        weight: 5,
        difficulty: 'alta',
        knowledgeLevel: 'intermediario',
        topics: [],
      },
      {
        name: 'Língua Portuguesa',
        color: '#6366f1',
        weight: 4,
        difficulty: 'media',
        knowledgeLevel: 'intermediario',
        topics: [],
      },
      {
        name: 'Literatura',
        color: '#f43f5e',
        weight: 3,
        difficulty: 'baixa',
        knowledgeLevel: 'intermediario',
        topics: [],
      },
      {
        name: 'Artes',
        color: '#d946ef',
        weight: 2,
        difficulty: 'baixa',
        knowledgeLevel: 'intermediario',
        topics: [],
      },
      {
        name: 'Física',
        color: '#8b5cf6',
        weight: 4,
        difficulty: 'alta',
        knowledgeLevel: 'iniciante',
        topics: [],
      },
      {
        name: 'Química',
        color: '#06b6d4',
        weight: 4,
        difficulty: 'alta',
        knowledgeLevel: 'iniciante',
        topics: [],
      },
      {
        name: 'Biologia',
        color: '#10b981',
        weight: 4,
        difficulty: 'media',
        knowledgeLevel: 'intermediario',
        topics: [],
      },
      {
        name: 'História',
        color: '#f59e0b',
        weight: 3,
        difficulty: 'media',
        knowledgeLevel: 'intermediario',
        topics: [],
      },
      {
        name: 'Geografia',
        color: '#14b8a6',
        weight: 3,
        difficulty: 'media',
        knowledgeLevel: 'intermediario',
        topics: [],
      },
      {
        name: 'Filosofia',
        color: '#a855f7',
        weight: 3,
        difficulty: 'baixa',
        knowledgeLevel: 'intermediario',
        topics: [],
      },
      {
        name: 'Sociologia',
        color: '#7c3aed',
        weight: 3,
        difficulty: 'baixa',
        knowledgeLevel: 'intermediario',
        topics: [],
      },
    ],
    modules: [
      {
        id: 'mod_enem_ingles',
        name: 'Idioma: Inglês',
        description: '5 questões de Língua Inglesa na prova de Linguagens',
        subjects: [
          {
            name: 'Inglês',
            color: '#0ea5e9',
            weight: 2,
            difficulty: 'baixa',
            knowledgeLevel: 'intermediario',
            topics: [],
          },
        ],
      },
      {
        id: 'mod_enem_espanhol',
        name: 'Idioma: Espanhol',
        description: '5 questões de Língua Espanhola na prova de Linguagens',
        subjects: [
          {
            name: 'Espanhol',
            color: '#f97316',
            weight: 2,
            difficulty: 'baixa',
            knowledgeLevel: 'intermediario',
            topics: [],
          },
        ],
      },
      {
        id: 'mod_enem_ed_fisica',
        name: 'Educação Física & TICs',
        description: 'Cultura corporal, esportes e tecnologias da comunicação',
        subjects: [
          {
            name: 'Educação Física & TICs',
            color: '#22c55e',
            weight: 2,
            difficulty: 'baixa',
            knowledgeLevel: 'avancado',
            topics: [],
          },
        ],
      },
      {
        id: 'mod_enem_atualidades',
        name: 'Atualidades & Repertório',
        description: 'Eixos temáticos atuais para Redação e Ciências Humanas',
        subjects: [
          {
            name: 'Atualidades & Repertório',
            color: '#eab308',
            weight: 2,
            difficulty: 'baixa',
            knowledgeLevel: 'intermediario',
            topics: [],
          },
        ],
      },
    ],
  },
  {
    id: 'medicina',
    name: 'Medicina',
    category: 'Vestibular',
    description: 'Grade completa para alta nota de corte em Medicina, com Natureza e Redação em peso máximo + opcionais',
    defaultExamOffsetDays: 150,
    weeklyHoursByLoad: {
      leve: '23:30/sem',
      normal: '32:00/sem',
      intensivo: '44:00/sem',
    },
    subjects: [
      {
        name: 'Biologia (Foco Med)',
        color: '#10b981',
        weight: 5,
        difficulty: 'alta',
        knowledgeLevel: 'intermediario',
        topics: [],
      },
      {
        name: 'Química (Foco Med)',
        color: '#06b6d4',
        weight: 5,
        difficulty: 'alta',
        knowledgeLevel: 'intermediario',
        topics: [],
      },
      {
        name: 'Física',
        color: '#8b5cf6',
        weight: 5,
        difficulty: 'alta',
        knowledgeLevel: 'iniciante',
        topics: [],
      },
      {
        name: 'Matemática',
        color: '#3b82f6',
        weight: 5,
        difficulty: 'alta',
        knowledgeLevel: 'intermediario',
        topics: [],
      },
      {
        name: 'Redação Nota 1000',
        color: '#ec4899',
        weight: 5,
        difficulty: 'alta',
        knowledgeLevel: 'intermediario',
        topics: [],
      },
      {
        name: 'Português & Interpretação',
        color: '#6366f1',
        weight: 3,
        difficulty: 'media',
        knowledgeLevel: 'intermediario',
        topics: [],
      },
      {
        name: 'Literatura',
        color: '#f43f5e',
        weight: 3,
        difficulty: 'media',
        knowledgeLevel: 'intermediario',
        topics: [],
      },
      {
        name: 'História',
        color: '#f59e0b',
        weight: 3,
        difficulty: 'baixa',
        knowledgeLevel: 'intermediario',
        topics: [],
      },
      {
        name: 'Geografia',
        color: '#14b8a6',
        weight: 3,
        difficulty: 'baixa',
        knowledgeLevel: 'intermediario',
        topics: [],
      },
      {
        name: 'Filosofia',
        color: '#a855f7',
        weight: 2,
        difficulty: 'baixa',
        knowledgeLevel: 'intermediario',
        topics: [],
      },
      {
        name: 'Sociologia',
        color: '#7c3aed',
        weight: 2,
        difficulty: 'baixa',
        knowledgeLevel: 'intermediario',
        topics: [],
      },
      {
        name: 'Artes',
        color: '#d946ef',
        weight: 2,
        difficulty: 'baixa',
        knowledgeLevel: 'intermediario',
        topics: [],
      },
    ],
    modules: [
      {
        id: 'mod_med_ingles',
        name: 'Idioma: Inglês',
        description: 'Interpretação de textos em inglês para vestibulares e ENEM',
        subjects: [
          {
            name: 'Inglês',
            color: '#0ea5e9',
            weight: 2,
            difficulty: 'baixa',
            knowledgeLevel: 'intermediario',
            topics: [],
          },
        ],
      },
      {
        id: 'mod_med_espanhol',
        name: 'Idioma: Espanhol',
        description: 'Opção de língua espanhola para prova de Linguagens',
        subjects: [
          {
            name: 'Espanhol',
            color: '#f97316',
            weight: 2,
            difficulty: 'baixa',
            knowledgeLevel: 'intermediario',
            topics: [],
          },
        ],
      },
      {
        id: 'mod_med_2fase',
        name: '2ª Fase Discursiva & Obras',
        description: 'Treino discursivo (Bio/Quím/Fís) e obras literárias obrigatórias',
        subjects: [
          {
            name: 'Questões Discursivas (Natureza)',
            color: '#e11d48',
            weight: 4,
            difficulty: 'alta',
            knowledgeLevel: 'intermediario',
            topics: [],
          },
          {
            name: 'Obras Literárias Obrigatórias',
            color: '#fb7185',
            weight: 3,
            difficulty: 'media',
            knowledgeLevel: 'intermediario',
            topics: [],
          },
        ],
      },
      {
        id: 'mod_med_saude',
        name: 'Atualidades em Saúde & SUS',
        description: 'Bioética, epidemiologia e saúde coletiva para redação e discursivas',
        subjects: [
          {
            name: 'Atualidades em Saúde & SUS',
            color: '#059669',
            weight: 2,
            difficulty: 'baixa',
            knowledgeLevel: 'intermediario',
            topics: [],
          },
        ],
      },
    ],
  },
  {
    id: 'concurso_geral',
    name: 'Concursos Públicos',
    category: 'Concurso',
    description: 'Base comum obrigatória de concursos + 8 módulos opcionais por carreira (DF, Federal, Tribunais, Fiscal, Policial, Bancária, INSS e Educação)',
    defaultExamOffsetDays: 90,
    weeklyHoursByLoad: {
      leve: '21:30/sem',
      normal: '28:00/sem',
      intensivo: '38:00/sem',
    },
    subjects: [
      {
        name: 'Língua Portuguesa',
        color: '#10b981',
        weight: 5,
        difficulty: 'alta',
        knowledgeLevel: 'intermediario',
        topics: [],
      },
      {
        name: 'Direito Constitucional',
        color: '#6366f1',
        weight: 5,
        difficulty: 'media',
        knowledgeLevel: 'intermediario',
        topics: [],
      },
      {
        name: 'Direito Administrativo',
        color: '#0ea5e9',
        weight: 5,
        difficulty: 'alta',
        knowledgeLevel: 'intermediario',
        topics: [],
      },
      {
        name: 'Raciocínio Lógico',
        color: '#f97316',
        weight: 4,
        difficulty: 'alta',
        knowledgeLevel: 'iniciante',
        topics: [],
      },
      {
        name: 'Matemática',
        color: '#fb923c',
        weight: 3,
        difficulty: 'media',
        knowledgeLevel: 'iniciante',
        topics: [],
      },
      {
        name: 'Informática para Concursos',
        color: '#14b8a6',
        weight: 3,
        difficulty: 'baixa',
        knowledgeLevel: 'intermediario',
        topics: [],
      },
      {
        name: 'Ética no Serviço Público',
        color: '#a855f7',
        weight: 2,
        difficulty: 'baixa',
        knowledgeLevel: 'intermediario',
        topics: [],
      },
      {
        name: 'Atualidades & Redação Oficial',
        color: '#8b5cf6',
        weight: 3,
        difficulty: 'baixa',
        knowledgeLevel: 'intermediario',
        topics: [],
      },
    ],
    modules: [
      {
        id: 'mod_df',
        name: 'Distrito Federal (DF)',
        description: 'LODF, LC 840/2011 e Conhecimentos sobre o DF (RIDE)',
        subjects: [
          {
            name: 'Lei Orgânica do DF (LODF)',
            color: '#ec4899',
            weight: 4,
            difficulty: 'media',
            knowledgeLevel: 'iniciante',
            topics: [],
          },
          {
            name: 'Regime Jurídico (LC 840/2011)',
            color: '#f43f5e',
            weight: 4,
            difficulty: 'alta',
            knowledgeLevel: 'iniciante',
            topics: [],
          },
          {
            name: 'Conhecimentos sobre o DF (RIDE)',
            color: '#f59e0b',
            weight: 3,
            difficulty: 'baixa',
            knowledgeLevel: 'intermediario',
            topics: [],
          },
        ],
      },
      {
        id: 'mod_federal',
        name: 'Executivo Federal',
        description: 'Lei 8.112/90 e Administração Pública & Políticas Públicas',
        subjects: [
          {
            name: 'Lei 8.112/90 (Regime Jurídico Federal)',
            color: '#4f46e5',
            weight: 4,
            difficulty: 'media',
            knowledgeLevel: 'iniciante',
            topics: [],
          },
          {
            name: 'Administração Pública & Políticas Públicas',
            color: '#0284c7',
            weight: 4,
            difficulty: 'media',
            knowledgeLevel: 'intermediario',
            topics: [],
          },
        ],
      },
      {
        id: 'mod_tribunais',
        name: 'Tribunais & Jurídica',
        description: 'Civil, Processual Civil, Penal, Processual Penal e Eleitoral',
        subjects: [
          {
            name: 'Direito Civil',
            color: '#3b82f6',
            weight: 4,
            difficulty: 'alta',
            knowledgeLevel: 'intermediario',
            topics: [],
          },
          {
            name: 'Direito Processual Civil',
            color: '#2563eb',
            weight: 4,
            difficulty: 'alta',
            knowledgeLevel: 'intermediario',
            topics: [],
          },
          {
            name: 'Direito Penal',
            color: '#8b5cf6',
            weight: 4,
            difficulty: 'media',
            knowledgeLevel: 'intermediario',
            topics: [],
          },
          {
            name: 'Direito Processual Penal',
            color: '#7c3aed',
            weight: 4,
            difficulty: 'media',
            knowledgeLevel: 'intermediario',
            topics: [],
          },
          {
            name: 'Direito Eleitoral',
            color: '#06b6d4',
            weight: 3,
            difficulty: 'media',
            knowledgeLevel: 'iniciante',
            topics: [],
          },
        ],
      },
      {
        id: 'mod_fiscal',
        name: 'Área Fiscal & Controle',
        description: 'Tributário, Contabilidade Geral, AFO/Financeiro e Auditoria',
        subjects: [
          {
            name: 'Direito Tributário',
            color: '#0ea5e9',
            weight: 5,
            difficulty: 'alta',
            knowledgeLevel: 'iniciante',
            topics: [],
          },
          {
            name: 'Contabilidade Geral & Avançada',
            color: '#10b981',
            weight: 5,
            difficulty: 'alta',
            knowledgeLevel: 'iniciante',
            topics: [],
          },
          {
            name: 'AFO & Direito Financeiro',
            color: '#059669',
            weight: 4,
            difficulty: 'alta',
            knowledgeLevel: 'iniciante',
            topics: [],
          },
          {
            name: 'Auditoria Governamental e Privada',
            color: '#0d9488',
            weight: 4,
            difficulty: 'alta',
            knowledgeLevel: 'iniciante',
            topics: [],
          },
        ],
      },
      {
        id: 'mod_policial',
        name: 'Carreiras Policiais',
        description: 'Legislação Penal Especial, Medicina Legal, Contabilidade, Estatística e CTB',
        subjects: [
          {
            name: 'Legislação Penal Especial',
            color: '#ef4444',
            weight: 5,
            difficulty: 'media',
            knowledgeLevel: 'intermediario',
            topics: [],
          },
          {
            name: 'Medicina Legal & Criminalística',
            color: '#dc2626',
            weight: 3,
            difficulty: 'media',
            knowledgeLevel: 'iniciante',
            topics: [],
          },
          {
            name: 'Contabilidade para Polícia',
            color: '#16a34a',
            weight: 4,
            difficulty: 'alta',
            knowledgeLevel: 'iniciante',
            topics: [],
          },
          {
            name: 'Estatística',
            color: '#ea580c',
            weight: 4,
            difficulty: 'alta',
            knowledgeLevel: 'iniciante',
            topics: [],
          },
          {
            name: 'Legislação de Trânsito (CTB)',
            color: '#d97706',
            weight: 4,
            difficulty: 'media',
            knowledgeLevel: 'intermediario',
            topics: [],
          },
        ],
      },
      {
        id: 'mod_bancaria',
        name: 'Carreira Bancária',
        description: 'Conhecimentos Bancários, Matemática Financeira, Vendas e Mercado',
        subjects: [
          {
            name: 'Conhecimentos Bancários',
            color: '#0ea5e9',
            weight: 5,
            difficulty: 'media',
            knowledgeLevel: 'iniciante',
            topics: [],
          },
          {
            name: 'Matemática Financeira',
            color: '#f97316',
            weight: 4,
            difficulty: 'alta',
            knowledgeLevel: 'iniciante',
            topics: [],
          },
          {
            name: 'Vendas & Negociação',
            color: '#ec4899',
            weight: 4,
            difficulty: 'baixa',
            knowledgeLevel: 'intermediario',
            topics: [],
          },
          {
            name: 'Atualidades do Mercado Financeiro',
            color: '#8b5cf6',
            weight: 3,
            difficulty: 'baixa',
            knowledgeLevel: 'intermediario',
            topics: [],
          },
        ],
      },
      {
        id: 'mod_inss',
        name: 'INSS & Seguridade Social',
        description: 'Direito Previdenciário e custeio/benefícios da Seguridade',
        subjects: [
          {
            name: 'Direito Previdenciário & Seguridade',
            color: '#06b6d4',
            weight: 5,
            difficulty: 'alta',
            knowledgeLevel: 'iniciante',
            topics: [],
          },
        ],
      },
      {
        id: 'mod_educacao',
        name: 'Educação & Pedagogia',
        description: 'LDB, Didática, BNCC e Estatuto da Criança e do Adolescente',
        subjects: [
          {
            name: 'LDB & Legislação Educacional',
            color: '#10b981',
            weight: 5,
            difficulty: 'media',
            knowledgeLevel: 'intermediario',
            topics: [],
          },
          {
            name: 'Didática, Currículo & BNCC',
            color: '#6366f1',
            weight: 4,
            difficulty: 'media',
            knowledgeLevel: 'intermediario',
            topics: [],
          },
          {
            name: 'ECA (Estatuto da Criança e Adolescente)',
            color: '#f59e0b',
            weight: 3,
            difficulty: 'baixa',
            knowledgeLevel: 'intermediario',
            topics: [],
          },
        ],
      },
    ],
  },
  {
    id: 'personalizado',
    name: 'Personalizado',
    category: 'Livre',
    description: 'Crie suas próprias disciplinas e tópicos do zero com total controle',
    defaultExamOffsetDays: 90,
    weeklyHoursByLoad: {
      leve: 'Livre',
      normal: 'Livre',
      intensivo: 'Livre',
    },
    subjects: [],
  },
  {
    id: 'oab',
    name: 'Exame de Ordem (OAB 1ª Fase)',
    category: 'Certificação',
    description: 'Núcleo obrigatório principal da FGV + 3 módulos opcionais que completam todas as 20 disciplinas oficiais',
    defaultExamOffsetDays: 75,
    weeklyHoursByLoad: {
      leve: '16:00/sem',
      normal: '24:00/sem',
      intensivo: '34:00/sem',
    },
    subjects: [
      {
        name: 'Ética Profissional & Estatuto da OAB',
        color: '#ef4444',
        weight: 5,
        difficulty: 'baixa',
        knowledgeLevel: 'intermediario',
        topics: [],
      },
      {
        name: 'Direito Constitucional',
        color: '#10b981',
        weight: 5,
        difficulty: 'media',
        knowledgeLevel: 'intermediario',
        topics: [],
      },
      {
        name: 'Direito Administrativo',
        color: '#0ea5e9',
        weight: 5,
        difficulty: 'media',
        knowledgeLevel: 'intermediario',
        topics: [],
      },
      {
        name: 'Direito Civil',
        color: '#3b82f6',
        weight: 5,
        difficulty: 'alta',
        knowledgeLevel: 'intermediario',
        topics: [],
      },
      {
        name: 'Processo Civil',
        color: '#2563eb',
        weight: 5,
        difficulty: 'alta',
        knowledgeLevel: 'intermediario',
        topics: [],
      },
      {
        name: 'Direito Penal',
        color: '#8b5cf6',
        weight: 4,
        difficulty: 'media',
        knowledgeLevel: 'iniciante',
        topics: [],
      },
      {
        name: 'Processo Penal',
        color: '#7c3aed',
        weight: 4,
        difficulty: 'media',
        knowledgeLevel: 'iniciante',
        topics: [],
      },
      {
        name: 'Direito do Trabalho',
        color: '#f59e0b',
        weight: 4,
        difficulty: 'media',
        knowledgeLevel: 'intermediario',
        topics: [],
      },
      {
        name: 'Processo do Trabalho',
        color: '#d97706',
        weight: 4,
        difficulty: 'media',
        knowledgeLevel: 'intermediario',
        topics: [],
      },
      {
        name: 'Direito Tributário',
        color: '#06b6d4',
        weight: 4,
        difficulty: 'alta',
        knowledgeLevel: 'iniciante',
        topics: [],
      },
      {
        name: 'Direito Empresarial',
        color: '#14b8a6',
        weight: 3,
        difficulty: 'alta',
        knowledgeLevel: 'iniciante',
        topics: [],
      },
    ],
    modules: [
      {
        id: 'mod_oab_humanos_filo',
        name: 'Humanos, Internacional & Filosofia',
        description: 'Direitos Humanos, Direito Internacional e Filosofia do Direito',
        subjects: [
          {
            name: 'Direitos Humanos',
            color: '#ec4899',
            weight: 3,
            difficulty: 'baixa',
            knowledgeLevel: 'intermediario',
            topics: [],
          },
          {
            name: 'Direito Internacional',
            color: '#6366f1',
            weight: 2,
            difficulty: 'media',
            knowledgeLevel: 'iniciante',
            topics: [],
          },
          {
            name: 'Filosofia do Direito',
            color: '#a855f7',
            weight: 2,
            difficulty: 'baixa',
            knowledgeLevel: 'intermediario',
            topics: [],
          },
        ],
      },
      {
        id: 'mod_oab_difusos',
        name: 'Estatutos & Direitos Difusos',
        description: 'Consumidor, ECA e Direito Ambiental (alto retorno em tiro curto)',
        subjects: [
          {
            name: 'Direito do Consumidor',
            color: '#f97316',
            weight: 3,
            difficulty: 'baixa',
            knowledgeLevel: 'intermediario',
            topics: [],
          },
          {
            name: 'Estatuto da Criança e do Adolescente (ECA)',
            color: '#22c55e',
            weight: 3,
            difficulty: 'baixa',
            knowledgeLevel: 'intermediario',
            topics: [],
          },
          {
            name: 'Direito Ambiental',
            color: '#16a34a',
            weight: 2,
            difficulty: 'baixa',
            knowledgeLevel: 'intermediario',
            topics: [],
          },
        ],
      },
      {
        id: 'mod_oab_novas',
        name: 'Novas Disciplinas OAB (FGV)',
        description: 'Direito Eleitoral, Previdenciário e Financeiro',
        subjects: [
          {
            name: 'Direito Eleitoral',
            color: '#0284c7',
            weight: 2,
            difficulty: 'media',
            knowledgeLevel: 'iniciante',
            topics: [],
          },
          {
            name: 'Direito Previdenciário',
            color: '#0d9488',
            weight: 2,
            difficulty: 'media',
            knowledgeLevel: 'iniciante',
            topics: [],
          },
          {
            name: 'Direito Financeiro',
            color: '#ca8a04',
            weight: 2,
            difficulty: 'media',
            knowledgeLevel: 'iniciante',
            topics: [],
          },
        ],
      },
    ],
  },
  {
    id: 'dev_tech',
    name: 'Tecnologia & Programação',
    category: 'Carreira Tech',
    description: 'Base completa de engenharia de software + 4 trilhas opcionais (Cloud, Dados/IA, Mobile e Cibersegurança)',
    defaultExamOffsetDays: 180,
    weeklyHoursByLoad: {
      leve: '12:00/sem',
      normal: '20:00/sem',
      intensivo: '30:00/sem',
    },
    subjects: [
      {
        name: 'Lógica de Programação & Fundamentos',
        color: '#3b82f6',
        weight: 5,
        difficulty: 'media',
        knowledgeLevel: 'iniciante',
        topics: [],
      },
      {
        name: 'Estrutura de Dados & Algoritmos',
        color: '#6366f1',
        weight: 5,
        difficulty: 'alta',
        knowledgeLevel: 'iniciante',
        topics: [],
      },
      {
        name: 'Banco de Dados & SQL',
        color: '#0ea5e9',
        weight: 5,
        difficulty: 'media',
        knowledgeLevel: 'intermediario',
        topics: [],
      },
      {
        name: 'Backend & APIs',
        color: '#8b5cf6',
        weight: 5,
        difficulty: 'media',
        knowledgeLevel: 'intermediario',
        topics: [],
      },
      {
        name: 'Frontend & Web Moderna',
        color: '#10b981',
        weight: 4,
        difficulty: 'media',
        knowledgeLevel: 'intermediario',
        topics: [],
      },
      {
        name: 'Engenharia de Software & Testes (QA)',
        color: '#06b6d4',
        weight: 4,
        difficulty: 'media',
        knowledgeLevel: 'intermediario',
        topics: [],
      },
      {
        name: 'Git, Linux & Redes',
        color: '#14b8a6',
        weight: 3,
        difficulty: 'baixa',
        knowledgeLevel: 'intermediario',
        topics: [],
      },
      {
        name: 'Inglês Técnico',
        color: '#f59e0b',
        weight: 3,
        difficulty: 'baixa',
        knowledgeLevel: 'intermediario',
        topics: [],
      },
    ],
    modules: [
      {
        id: 'mod_tech_cloud',
        name: 'Cloud, Docker & DevOps',
        description: 'Containers, Kubernetes, infraestrutura em nuvem e CI/CD',
        subjects: [
          {
            name: 'Docker, Containers & Kubernetes',
            color: '#0284c7',
            weight: 4,
            difficulty: 'alta',
            knowledgeLevel: 'iniciante',
            topics: [],
          },
          {
            name: 'Cloud Computing & CI/CD',
            color: '#4f46e5',
            weight: 4,
            difficulty: 'media',
            knowledgeLevel: 'iniciante',
            topics: [],
          },
        ],
      },
      {
        id: 'mod_tech_dados_ia',
        name: 'Dados, Python & IA',
        description: 'Python para análise de dados, Machine Learning e IA aplicada',
        subjects: [
          {
            name: 'Python para Ciência de Dados',
            color: '#16a34a',
            weight: 4,
            difficulty: 'media',
            knowledgeLevel: 'iniciante',
            topics: [],
          },
          {
            name: 'Machine Learning & IA Aplicada',
            color: '#a855f7',
            weight: 4,
            difficulty: 'alta',
            knowledgeLevel: 'iniciante',
            topics: [],
          },
        ],
      },
      {
        id: 'mod_tech_mobile',
        name: 'Desenvolvimento Mobile',
        description: 'Aplicativos iOS/Android com React Native, Flutter ou nativo',
        subjects: [
          {
            name: 'Desenvolvimento Mobile',
            color: '#ec4899',
            weight: 4,
            difficulty: 'media',
            knowledgeLevel: 'iniciante',
            topics: [],
          },
        ],
      },
      {
        id: 'mod_tech_sec',
        name: 'Cibersegurança',
        description: 'Segurança de aplicações web, autenticação e redes',
        subjects: [
          {
            name: 'Segurança de Aplicações & Redes',
            color: '#ef4444',
            weight: 4,
            difficulty: 'alta',
            knowledgeLevel: 'iniciante',
            topics: [],
          },
        ],
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

const STORAGE_PREFIX = 'trilha_estudos_v2';
const LAST_LOCAL_SESSION_KEY = `${STORAGE_PREFIX}_local_active`;

export function getStorageKeyForUser(userId?: string): string {
  const safeId = userId && userId.trim() ? userId.trim() : 'guest';
  return `${STORAGE_PREFIX}_${safeId}`;
}

export function hasActiveLocalGuestSession(): boolean {
  try {
    return localStorage.getItem(LAST_LOCAL_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function setActiveLocalGuestSession(active: boolean): void {
  try {
    if (active) {
      localStorage.setItem(LAST_LOCAL_SESSION_KEY, '1');
    } else {
      localStorage.removeItem(LAST_LOCAL_SESSION_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export function rolloverDailyGoalIfNeeded(
  dailyGoal: Partial<DailyGoal> | undefined,
  todayStr: string,
  sessions: StudySession[] = [],
  tasks: Task[] = [],
  fallbackTargetMinutes = 120,
  fallbackTargetTasks = 2
): DailyGoal {
  const safeMinutesTarget =
    typeof dailyGoal?.targetMinutes === 'number' && dailyGoal.targetMinutes >= 15
      ? Math.round(dailyGoal.targetMinutes)
      : fallbackTargetMinutes;
  const safeTasksTarget =
    typeof dailyGoal?.targetTasks === 'number' && dailyGoal.targetTasks >= 1
      ? Math.round(dailyGoal.targetTasks)
      : fallbackTargetTasks;
  const safeQuestionsTarget =
    typeof dailyGoal?.targetQuestions === 'number' && dailyGoal.targetQuestions >= 1
      ? Math.round(dailyGoal.targetQuestions)
      : 30;

  const rawCustomGoals = Array.isArray(dailyGoal?.customGoals) ? dailyGoal.customGoals : [];
  const needsReset = dailyGoal?.lastResetDate !== todayStr;

  const nextCustomGoals = needsReset
    ? rawCustomGoals
        .filter((item) => item && typeof item.title === 'string' && (item.recurringDaily || item.createdDate === todayStr))
        .map((item) => ({
          ...item,
          completed: item.createdDate === todayStr ? Boolean(item.completed) : false,
        }))
    : rawCustomGoals;

  const completedMinutesToday = sessions
    .filter((s) => typeof s.date === 'string' && s.date.slice(0, 10) === todayStr)
    .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

  const completedTasksToday = tasks.filter(
    (t) => t.date === todayStr && t.status === 'concluida'
  ).length;

  return {
    targetMinutes: safeMinutesTarget,
    targetTasks: safeTasksTarget,
    targetQuestions: safeQuestionsTarget,
    completedMinutes:
      sessions.length > 0 || needsReset
        ? completedMinutesToday
        : typeof dailyGoal?.completedMinutes === 'number'
        ? dailyGoal.completedMinutes
        : 0,
    completedTasks:
      tasks.length > 0 || needsReset
        ? completedTasksToday
        : typeof dailyGoal?.completedTasks === 'number'
        ? dailyGoal.completedTasks
        : 0,
    lastResetDate: todayStr,
    customGoals: nextCustomGoals,
  };
}

export function createDefaultState(userOverride?: UserAccount): AppState {
  const todayStr = getTodayStr();
  const isLogged = Boolean(userOverride?.isLoggedIn);

  const profile: UserProfile = {
    name: userOverride?.name || '',
    email: userOverride?.email || '',
    avatarSeed: userOverride?.avatarSeed,
    objective: '',
    targetExam: '',
    profileType: 'iniciante',
    dailyAvailableMinutes: 120,
    dailyMinutesByDay: {
      1: 120,
      2: 120,
      3: 120,
      4: 120,
      5: 120,
    },
    availableDays: [1, 2, 3, 4, 5],
    preferredSessionLength: 50,
    preferredBreakLength: 10,
    studyMethod: 'blocos_50_10',
    xp: 0,
    level: 1,
    streakDays: 0,
    freezeStreakCount: 1,
    onboardingCompleted: false,
    presetChosen: false,
    weeklyLoad: 'leve',
    createdAt: todayStr,
  };

  return {
    profile,
    subjects: [],
    tasks: [],
    reviews: [],
    sessions: [],
    achievements: INITIAL_ACHIEVEMENTS.map((a) => ({ ...a })),
    dailyGoal: {
      targetMinutes: 120,
      targetTasks: 2,
      targetQuestions: 30,
      completedMinutes: 0,
      completedTasks: 0,
      lastResetDate: todayStr,
      customGoals: [],
    },
    questionLogs: [],
    fixedCommitments: [],
    notifications: [],
    currentUser: userOverride || {
      id: '',
      name: '',
      email: '',
      isLoggedIn: isLogged,
    },
  };
}

export function normalizeAppState(
  raw: Omit<Partial<AppState>, 'profile'> & { profile?: Partial<UserProfile> },
  userOverride?: UserAccount
): AppState {
  const base = createDefaultState(userOverride);
  const parsed = raw || {};

  const seenIds = new Set<string>();
  const tasks = Array.isArray(parsed.tasks)
    ? parsed.tasks.map((task, idx) => {
        if (seenIds.has(task.id)) {
          const uniqueId = `${task.id}-dup-${idx}-${Math.random().toString(36).slice(2, 6)}`;
          return { ...task, id: uniqueId };
        }
        seenIds.add(task.id);
        return task;
      })
    : [];

  const subjects: Subject[] = Array.isArray(parsed.subjects)
    ? parsed.subjects.map((sub: any) => ({
        ...sub,
        ciclo: sub.ciclo !== undefined ? sub.ciclo : 0,
        revisaoNotes: sub.revisaoNotes || '',
        cadernoQuestoes: sub.cadernoQuestoes || '',
        pareiEm: sub.pareiEm || '',
        concluida: Boolean(sub.concluida),
        topics: Array.isArray(sub.topics) ? sub.topics : [],
      }))
    : [];

  const profile: UserProfile = {
    ...base.profile,
    ...(parsed.profile || {}),
    preferredSessionLength:
      typeof parsed.profile?.preferredSessionLength === 'number' &&
      parsed.profile.preferredSessionLength >= 10
        ? Math.min(240, Math.round(parsed.profile.preferredSessionLength))
        : base.profile.preferredSessionLength,
    preferredBreakLength:
      typeof parsed.profile?.preferredBreakLength === 'number' &&
      parsed.profile.preferredBreakLength >= 1
        ? Math.min(60, Math.round(parsed.profile.preferredBreakLength))
        : base.profile.preferredBreakLength,
    studyMethod: isValidStudyMethodId(parsed.profile?.studyMethod)
      ? parsed.profile.studyMethod
      : base.profile.studyMethod,
    xp: typeof parsed.profile?.xp === 'number' ? parsed.profile.xp : 0,
    level: typeof parsed.profile?.level === 'number' ? parsed.profile.level : 1,
    streakDays: typeof parsed.profile?.streakDays === 'number' ? parsed.profile.streakDays : 0,
    availableDays:
      Array.isArray(parsed.profile?.availableDays) && parsed.profile.availableDays.length > 0
        ? parsed.profile.availableDays
        : base.profile.availableDays,
  };

  const todayStr = getTodayStr();
  const sessions = Array.isArray(parsed.sessions) ? parsed.sessions : [];

  return {
    profile,
    subjects,
    tasks,
    reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [],
    sessions,
    achievements:
      Array.isArray(parsed.achievements) && parsed.achievements.length > 0
        ? parsed.achievements
        : base.achievements,
    dailyGoal: rolloverDailyGoalIfNeeded(
      parsed.dailyGoal,
      todayStr,
      sessions,
      tasks,
      base.dailyGoal.targetMinutes,
      base.dailyGoal.targetTasks
    ),
    lastScheduleGeneratedAt: parsed.lastScheduleGeneratedAt,
    questionLogs: Array.isArray(parsed.questionLogs) ? parsed.questionLogs : [],
    fixedCommitments: Array.isArray(parsed.fixedCommitments) ? parsed.fixedCommitments : [],
    notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
    currentUser: userOverride || parsed.currentUser || base.currentUser,
  };
}

export function loadStoredState(userId?: string): AppState {
  try {
    if (!userId && !hasActiveLocalGuestSession()) {
      return createDefaultState();
    }

    const storageKey = getStorageKeyForUser(userId || 'local-guest');
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return createDefaultState(
        userId === 'local-guest'
          ? {
              id: 'local-guest',
              name: 'Estudante Local',
              email: '',
              isLoggedIn: true,
              role: 'Modo Local',
            }
          : undefined
      );
    }
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return normalizeAppState(parsed);
  } catch (err) {
    console.warn('Error loading from localStorage, using zeroed state', err);
    return createDefaultState();
  }
}

export function saveStoredState(state: AppState, userId?: string): void {
  try {
    const resolvedId = userId || state.currentUser?.id;
    if (!resolvedId) return;
    localStorage.setItem(getStorageKeyForUser(resolvedId), JSON.stringify(state));
  } catch (err) {
    console.error('Failed to persist to localStorage', err);
  }
}

export function getActiveTimerDraftKey(userId?: string): string {
  return `${getStorageKeyForUser(userId || 'local-guest')}_active_timer`;
}

export function loadActiveTimerDraft(userId?: string): ActiveTimerDraft | null {
  try {
    if (!userId && !hasActiveLocalGuestSession()) {
      return null;
    }
    const raw = localStorage.getItem(getActiveTimerDraftKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ActiveTimerDraft>;
    if (!parsed || !parsed.task || typeof parsed.secondsRemaining !== 'number' || typeof parsed.totalSeconds !== 'number') {
      return null;
    }
    return {
      task: parsed.task,
      totalSeconds: Math.max(60, parsed.totalSeconds),
      secondsRemaining: Math.max(0, Math.min(parsed.totalSeconds, parsed.secondsRemaining)),
      // Always restore as paused when returning after closing tab/app
      isRunning: false,
      pareiEm: typeof parsed.pareiEm === 'string' ? parsed.pareiEm : '',
      cadernoQuestoes: typeof parsed.cadernoQuestoes === 'string' ? parsed.cadernoQuestoes : '',
      exercisesDone: typeof parsed.exercisesDone === 'number' ? Math.max(0, parsed.exercisesDone) : 0,
      exercisesCorrect: typeof parsed.exercisesCorrect === 'number' ? Math.max(0, parsed.exercisesCorrect) : 0,
      notes: typeof parsed.notes === 'string' ? parsed.notes : '',
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export function saveActiveTimerDraft(draft: ActiveTimerDraft | null, userId?: string): void {
  try {
    const key = getActiveTimerDraftKey(userId);
    if (!draft) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(draft));
    }
  } catch (err) {
    console.error('Failed to persist active timer draft', err);
  }
}

export function resetAppToOnboarding(preserveUser?: UserAccount): AppState {
  const emptyState = createDefaultState(
    preserveUser?.isLoggedIn
      ? preserveUser
      : undefined
  );
  if (preserveUser?.id) {
    saveStoredState(emptyState, preserveUser.id);
    saveActiveTimerDraft(null, preserveUser.id);
  }
  return emptyState;
}
