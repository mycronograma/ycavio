import { AppState, Subject, Achievement, UserProfile, UserAccount, DailyGoal, StudySession, Task, ActiveTimerDraft, InAppNotification } from '../types';
import { addDays, getTodayStr } from './scheduleEngine';
import { isValidStudyMethodId } from './studyMethods';
import { findSuggestedTopicsForSubject } from './presetTopics';

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

const RAW_STUDY_PRESETS: PresetGoal[] = [
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
        topics: [
          'Razão, Proporção e Porcentagem',
          'Funções do 1º e 2º Grau',
          'Função Exponencial e Logarítmica',
          'Geometria Plana (Áreas e Triângulos)',
          'Geometria Espacial (Prismas, Cilindros e Esferas)',
          'Trigonometria Básica e Ciclo Trigonométrico',
          'Análise Combinatória e Probabilidade',
          'Estatística (Média, Mediana, Moda e Gráficos)',
        ],
      },
      {
        name: 'Redação',
        color: '#ec4899',
        weight: 5,
        difficulty: 'alta',
        knowledgeLevel: 'intermediario',
        topics: [
          'Competência 1 e 2: Norma Culta e Repertório',
          'Competência 3 e 4: Projeto de Texto e Coesão',
          'Competência 5: Proposta de Intervenção Completa',
          'Introdução com Contextualização e Tese',
          'Desenvolvimento: Argumentação e Causa-Consequência',
          'Eixo Social: Desigualdade, Educação e Saúde',
          'Eixo Tecnológico, Ambiental e Cidadania',
        ],
      },
      {
        name: 'Língua Portuguesa',
        color: '#6366f1',
        weight: 4,
        difficulty: 'media',
        knowledgeLevel: 'intermediario',
        topics: [
          'Interpretação e Compreensão Textual',
          'Gêneros e Tipos Textuais',
          'Morfologia e Classes de Palavras',
          'Sintaxe do Período Simples e Composto',
          'Concordância Verbal e Nominal',
          'Regência Verbal, Nominal e Crase',
          'Pontuação e Semântica (Coesão e Coerência)',
          'Variação Linguística e Funções da Linguagem',
        ],
      },
      {
        name: 'Literatura',
        color: '#f43f5e',
        weight: 3,
        difficulty: 'baixa',
        knowledgeLevel: 'intermediario',
        topics: [
          'Quinhentismo, Barroco e Arcadismo',
          'Romantismo (Poesia e Prosa)',
          'Realismo, Naturalismo e Machado de Assis',
          'Parnasianismo e Simbolismo',
          'Pré-Modernismo Brasileiro',
          'Modernismo (1ª, 2ª e 3ª Gerações)',
          'Literatura Contemporânea e Poesia Social',
        ],
      },
      {
        name: 'Artes',
        color: '#d946ef',
        weight: 2,
        difficulty: 'baixa',
        knowledgeLevel: 'intermediario',
        topics: [
          'Arte na Antiguidade e Renascimento',
          'Vanguardas Europeias (Cubismo, Surrealismo, Futurismo)',
          'Modernismo Brasileiro e Semana de 22',
          'Arte Contemporânea, Instalações e Performance',
          'Música, Teatro e Cinema Brasileiro',
          'Patrimônio Cultural Material e Imaterial',
        ],
      },
      {
        name: 'Física',
        color: '#8b5cf6',
        weight: 4,
        difficulty: 'alta',
        knowledgeLevel: 'iniciante',
        topics: [
          'Cinemática Escalar e Vetorial',
          'Leis de Newton, Atrito e Dinâmica',
          'Trabalho, Energia e Conservação',
          'Termologia, Calorimetria e Termodinâmica',
          'Óptica Geométrica (Reflexão, Refração e Lentes)',
          'Ondulatória e Acústica',
          'Eletrostática e Eletrodinâmica (Circuitos)',
          'Eletromagnetismo e Indução',
        ],
      },
      {
        name: 'Química',
        color: '#06b6d4',
        weight: 4,
        difficulty: 'alta',
        knowledgeLevel: 'iniciante',
        topics: [
          'Estrutura Atômica e Tabela Periódica',
          'Ligações Químicas e Polaridade',
          'Funções Inorgânicas (Ácidos, Bases, Sais e Óxidos)',
          'Estequiometria e Leis Ponderais',
          'Soluções, Concentração e Diluição',
          'Termoquímica e Cinética Química',
          'Equilíbrio Químico, pH e Eletroquímica',
          'Química Orgânica (Funções, Isomeria e Reações)',
        ],
      },
      {
        name: 'Biologia',
        color: '#10b981',
        weight: 4,
        difficulty: 'media',
        knowledgeLevel: 'intermediario',
        topics: [
          'Citologia: Organelas e Membrana Plasmática',
          'Metabolismo Energético (Fotossíntese e Respiração)',
          'Divisão Celular (Mitose e Meiose) e DNA',
          'Genética Mendeliana e Biotecnologia',
          'Ecologia, Ciclos Biogeoquímicos e Impactos Ambientais',
          'Evolução e Origem da Vida',
          'Fisiologia Humana (Digestório, Circulatório e Nervoso)',
          'Microbiologia, Parasitologia e Imunologia',
        ],
      },
      {
        name: 'História',
        color: '#f59e0b',
        weight: 3,
        difficulty: 'media',
        knowledgeLevel: 'intermediario',
        topics: [
          'Antiguidade Clássica (Grécia e Roma)',
          'Idade Média, Feudalismo e Expansão Marítima',
          'Brasil Colônia (Economia Açucareira, Mineração e Revoltas)',
          'Revolução Industrial e Revolução Francesa',
          'Brasil Império (1º e 2º Reinado, Abolição)',
          'República Velha e Era Vargas',
          'Ditadura Militar e Redemocratização no Brasil',
          'Guerras Mundiais e Guerra Fria',
        ],
      },
      {
        name: 'Geografia',
        color: '#14b8a6',
        weight: 3,
        difficulty: 'media',
        knowledgeLevel: 'intermediario',
        topics: [
          'Cartografia, Fusos Horários e Geotecnologias',
          'Geomorfologia, Clima e Biomas Brasileiros',
          'Hidrografia e Recursos Hídricos',
          'Demografia e Urbanização Brasileira',
          'Espaço Agrário e Questão Fundiária',
          'Industrialização, Fontes de Energia e Transportes',
          'Globalização e Blocos Econômicos',
          'Geopolítica Contemporânea e Conflitos',
        ],
      },
      {
        name: 'Filosofia',
        color: '#a855f7',
        weight: 3,
        difficulty: 'baixa',
        knowledgeLevel: 'intermediario',
        topics: [
          'Filosofia Antiga: Pré-Socráticos, Sócrates, Platão e Aristóteles',
          'Filosofia Medieval (Patrística e Escolástica)',
          'Racionalismo (Descartes) e Empirismo (Locke e Hume)',
          'Iluminismo e Contratualismo (Hobbes, Locke, Rousseau)',
          'Ética Kantiana e Imperativo Categórico',
          'Filosofia Contemporânea (Nietzsche, Sartre, Foucault, Habermas)',
        ],
      },
      {
        name: 'Sociologia',
        color: '#7c3aed',
        weight: 3,
        difficulty: 'baixa',
        knowledgeLevel: 'intermediario',
        topics: [
          'Clássicos: Durkheim, Max Weber e Karl Marx',
          'Cultura, Indústria Cultural e Escola de Frankfurt',
          'Estratificação, Desigualdade Social e Trabalho',
          'Cidadania, Direitos Humanos e Movimentos Sociais',
          'Estado, Poder, Democracia e Participação Política',
          'Questões Étnico-Raciais, Gênero e Violência Urbana',
        ],
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
            topics: [
              'Estratégias de Leitura (Skimming e Scanning)',
              'Cognatos, Falsos Cognatos e Conectivos',
              'Tempos Verbais e Voz Passiva na Leitura',
              'Interpretação de Charges, Tirinhas e Infográficos',
              'Leitura de Artigos Científicos e Reportagens',
              'Vocabulário Contextual e Referência Pronominal',
            ],
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
            topics: [
              'Falsos Amigos (Heterossemânticos) Mais Cobrados',
              'Interpretação Textual e Inferência de Sentido',
              'Conectivos e Marcadores Discursivos',
              'Tempos Verbais no Contexto Jornalístico',
              'Cultura Hispânica, Crônicas e Cartuns',
              'Pronomes, Preposições e Expressões Idiomáticas',
            ],
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
            topics: [
              'Corpo, Saúde e Qualidade de Vida',
              'Esportes, Práticas Corporais e Lazer',
              'Padrões Estéticos e Mídia Contemporânea',
              'Tecnologias da Informação e Inclusão Digital',
              'Redes Sociais, Fake News e Cultura Digital',
            ],
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
            topics: [
              'Inteligência Artificial, Ética Digital e Trabalho',
              'Crise Climática, Transição Energética e Amazônia',
              'Envelhecimento Populacional e Previdência',
              'Saúde Mental e Desafios na Educação Brasileira',
              'Desigualdade Socioeconômica e Segurança Alimentar',
              'Geopolítica Atual e Organismos Multilaterais',
            ],
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
        topics: [
          'Bioquímica Celular e Enzimas',
          'Citologia, Transporte em Membrana e Bioenergética',
          'Biologia Molecular: Transcrição, Tradução e Biotecnologia',
          'Genética Clássica, Linkage e Herança Sexual',
          'Fisiologia Humana Completa (Endócrino, Renal, Imune)',
          'Parasitologia Médica e Doenças Virais/Bacterianas',
          'Botânica e Fisiologia Vegetal',
          'Ecologia Populacional e Relações Ecológicas',
        ],
      },
      {
        name: 'Química (Foco Med)',
        color: '#06b6d4',
        weight: 5,
        difficulty: 'alta',
        knowledgeLevel: 'intermediario',
        topics: [
          'Estequiometria Avançada e Pureza/Rendimento',
          'Soluções, Titulação e Propriedades Coligativas',
          'Termoquímica, Entalpia e Lei de Hess',
          'Cinética Química e Equilíbrio Químico (Kc/Kp)',
          'Equilíbrio Iônico, pH, pOH e Tampão',
          'Eletroquímica (Pilhas, Eletrólise e Corrosão)',
          'Química Orgânica: Isomeria Espacial e Reações',
          'Bioquímica: Polímeros, Carboidratos e Proteínas',
        ],
      },
      {
        name: 'Física',
        color: '#8b5cf6',
        weight: 5,
        difficulty: 'alta',
        knowledgeLevel: 'iniciante',
        topics: [
          'Cinemática Escalar e Vetorial',
          'Leis de Newton, Atrito e Dinâmica',
          'Trabalho, Energia e Conservação',
          'Termologia, Calorimetria e Termodinâmica',
          'Óptica Geométrica (Reflexão, Refração e Lentes)',
          'Ondulatória e Acústica',
          'Eletrostática e Eletrodinâmica (Circuitos)',
          'Eletromagnetismo e Indução',
        ],
      },
      {
        name: 'Matemática',
        color: '#3b82f6',
        weight: 5,
        difficulty: 'alta',
        knowledgeLevel: 'intermediario',
        topics: [
          'Razão, Proporção e Porcentagem',
          'Funções do 1º e 2º Grau',
          'Função Exponencial e Logarítmica',
          'Geometria Plana (Áreas e Triângulos)',
          'Geometria Espacial (Prismas, Cilindros e Esferas)',
          'Trigonometria Básica e Ciclo Trigonométrico',
          'Análise Combinatória e Probabilidade',
          'Estatística (Média, Mediana, Moda e Gráficos)',
        ],
      },
      {
        name: 'Redação Nota 1000',
        color: '#ec4899',
        weight: 5,
        difficulty: 'alta',
        knowledgeLevel: 'intermediario',
        topics: [
          'Estrutura Dissertativa e Projeto de Texto',
          'Repertório Sociocultural Produtivo',
          'Coesão Interparágrafos e Conectivos',
          'Argumentação por Evidência e Exemplificação',
          'Proposta de Intervenção (5 Elementos Obrigatórios)',
          'Temas de Saúde Pública, Bioética e Tecnologia',
        ],
      },
      {
        name: 'Português & Interpretação',
        color: '#6366f1',
        weight: 3,
        difficulty: 'media',
        knowledgeLevel: 'intermediario',
        topics: [
          'Interpretação de Textos Complexos e Inferência',
          'Figuras de Linguagem e Recursos Expressivos',
          'Coesão Referencial, Sequencial e Conectivos',
          'Variação Linguística e Norma Padrão',
          'Sintaxe, Concordância e Regência Aplicadas',
          'Intertextualidade e Ironia',
        ],
      },
      {
        name: 'Literatura',
        color: '#f43f5e',
        weight: 3,
        difficulty: 'media',
        knowledgeLevel: 'intermediario',
        topics: [
          'Quinhentismo, Barroco e Arcadismo',
          'Romantismo (Poesia e Prosa)',
          'Realismo, Naturalismo e Machado de Assis',
          'Parnasianismo e Simbolismo',
          'Pré-Modernismo Brasileiro',
          'Modernismo (1ª, 2ª e 3ª Gerações)',
          'Literatura Contemporânea e Poesia Social',
        ],
      },
      {
        name: 'História',
        color: '#f59e0b',
        weight: 3,
        difficulty: 'baixa',
        knowledgeLevel: 'intermediario',
        topics: [
          'Antiguidade Clássica (Grécia e Roma)',
          'Idade Média, Feudalismo e Expansão Marítima',
          'Brasil Colônia (Economia Açucareira, Mineração e Revoltas)',
          'Revolução Industrial e Revolução Francesa',
          'Brasil Império (1º e 2º Reinado, Abolição)',
          'República Velha e Era Vargas',
          'Ditadura Militar e Redemocratização no Brasil',
          'Guerras Mundiais e Guerra Fria',
        ],
      },
      {
        name: 'Geografia',
        color: '#14b8a6',
        weight: 3,
        difficulty: 'baixa',
        knowledgeLevel: 'intermediario',
        topics: [
          'Cartografia, Fusos Horários e Geotecnologias',
          'Geomorfologia, Clima e Biomas Brasileiros',
          'Hidrografia e Recursos Hídricos',
          'Demografia e Urbanização Brasileira',
          'Espaço Agrário e Questão Fundiária',
          'Industrialização, Fontes de Energia e Transportes',
          'Globalização e Blocos Econômicos',
          'Geopolítica Contemporânea e Conflitos',
        ],
      },
      {
        name: 'Filosofia',
        color: '#a855f7',
        weight: 2,
        difficulty: 'baixa',
        knowledgeLevel: 'intermediario',
        topics: [
          'Filosofia Antiga: Pré-Socráticos, Sócrates, Platão e Aristóteles',
          'Filosofia Medieval (Patrística e Escolástica)',
          'Racionalismo (Descartes) e Empirismo (Locke e Hume)',
          'Iluminismo e Contratualismo (Hobbes, Locke, Rousseau)',
          'Ética Kantiana e Imperativo Categórico',
          'Filosofia Contemporânea (Nietzsche, Sartre, Foucault, Habermas)',
        ],
      },
      {
        name: 'Sociologia',
        color: '#7c3aed',
        weight: 2,
        difficulty: 'baixa',
        knowledgeLevel: 'intermediario',
        topics: [
          'Clássicos: Durkheim, Max Weber e Karl Marx',
          'Cultura, Indústria Cultural e Escola de Frankfurt',
          'Estratificação, Desigualdade Social e Trabalho',
          'Cidadania, Direitos Humanos e Movimentos Sociais',
          'Estado, Poder, Democracia e Participação Política',
          'Questões Étnico-Raciais, Gênero e Violência Urbana',
        ],
      },
      {
        name: 'Artes',
        color: '#d946ef',
        weight: 2,
        difficulty: 'baixa',
        knowledgeLevel: 'intermediario',
        topics: [
          'Arte na Antiguidade e Renascimento',
          'Vanguardas Europeias (Cubismo, Surrealismo, Futurismo)',
          'Modernismo Brasileiro e Semana de 22',
          'Arte Contemporânea, Instalações e Performance',
          'Música, Teatro e Cinema Brasileiro',
          'Patrimônio Cultural Material e Imaterial',
        ],
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
            topics: [
              'Estratégias de Leitura (Skimming e Scanning)',
              'Cognatos, Falsos Cognatos e Conectivos',
              'Tempos Verbais e Voz Passiva na Leitura',
              'Interpretação de Charges, Tirinhas e Infográficos',
              'Leitura de Artigos Científicos e Reportagens',
              'Vocabulário Contextual e Referência Pronominal',
            ],
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
            topics: [
              'Falsos Amigos (Heterossemânticos) Mais Cobrados',
              'Interpretação Textual e Inferência de Sentido',
              'Conectivos e Marcadores Discursivos',
              'Tempos Verbais no Contexto Jornalístico',
              'Cultura Hispânica, Crônicas e Cartuns',
              'Pronomes, Preposições e Expressões Idiomáticas',
            ],
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
            topics: [
              'Biologia Discursiva: Fisiologia e Genética',
              'Química Discursiva: Cálculos Estequiométricos e Equilíbrio',
              'Física Discursiva: Mecânica, Gráficos e Circuitos',
              'Estruturação de Resposta Objetiva e Unidades de Medida',
              'Interpretação de Experimentos Científicos',
            ],
          },
          {
            name: 'Obras Literárias Obrigatórias',
            color: '#fb7185',
            weight: 3,
            difficulty: 'media',
            knowledgeLevel: 'intermediario',
            topics: [
              'Análise de Enredo, Narrador e Tempo',
              'Personagens Centrais e Conflitos Psicológicos',
              'Contexto Histórico-Social de Cada Obra',
              'Estilo de Época e Recursos de Linguagem',
              'Comparação Temática Entre as Obras da Lista',
            ],
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
            topics: [
              'Princípios e Diretrizes do SUS (Universalidade, Equidade)',
              'Epidemiologia, Vacinação e Doenças Emergentes',
              'Bioética: Eutanásia, Pesquisa Clínica e Sigilo Médico',
              'Atenção Primária e Saúde Coletiva no Brasil',
              'Impactos da Tecnologia e Telemedicina no Atendimento',
            ],
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
        topics: [
          'Interpretação e Compreensão Textual',
          'Gêneros e Tipos Textuais',
          'Morfologia e Classes de Palavras',
          'Sintaxe do Período Simples e Composto',
          'Concordância Verbal e Nominal',
          'Regência Verbal, Nominal e Crase',
          'Pontuação e Semântica (Coesão e Coerência)',
          'Variação Linguística e Funções da Linguagem',
        ],
      },
      {
        name: 'Direito Constitucional',
        color: '#6366f1',
        weight: 5,
        difficulty: 'media',
        knowledgeLevel: 'intermediario',
        topics: [
          'Princípios Fundamentais (Art. 1º ao 4º da CF)',
          'Direitos e Garantias Fundamentais (Art. 5º)',
          'Direitos Sociais, Nacionalidade e Direitos Políticos',
          'Organização do Estado e Repartição de Competências',
          'Poder Legislativo e Processo Legislativo',
          'Poder Executivo e Poder Judiciário',
          'Controle de Constitucionalidade',
          'Administração Pública na CF (Art. 37 ao 41)',
        ],
      },
      {
        name: 'Direito Administrativo',
        color: '#0ea5e9',
        weight: 5,
        difficulty: 'alta',
        knowledgeLevel: 'intermediario',
        topics: [
          'Princípios da Administração Pública (LIMPE e Implícitos)',
          'Organização Administrativa (Direta, Indireta e Agências)',
          'Poderes Administrativos e Abuso de Poder',
          'Atos Administrativos (Requisitos, Atributos e Extinção)',
          'Licitações e Contratos (Lei 14.133/2021)',
          'Agentes Públicos e Responsabilidade Civil do Estado',
          'Improbidade Administrativa (Lei 8.429/92 atualizada)',
          'Controle da Administração e Processo Administrativo',
        ],
      },
      {
        name: 'Raciocínio Lógico',
        color: '#f97316',
        weight: 4,
        difficulty: 'alta',
        knowledgeLevel: 'iniciante',
        topics: [
          'Proposições Lógicas e Conectivos (Tabela-Verdade)',
          'Equivalências Lógicas e Leis de De Morgan',
          'Negação de Proposições Compostas e Quantificadores',
          'Argumentação Lógica e Dedução',
          'Diagramas Lógicos (Silogismos e Conjuntos)',
          'Análise Combinatória e Probabilidade Básica',
          'Verdades, Mentiras e Associação Lógica',
        ],
      },
      {
        name: 'Matemática',
        color: '#fb923c',
        weight: 3,
        difficulty: 'media',
        knowledgeLevel: 'iniciante',
        topics: [
          'Razão, Proporção e Porcentagem',
          'Funções do 1º e 2º Grau',
          'Função Exponencial e Logarítmica',
          'Geometria Plana (Áreas e Triângulos)',
          'Geometria Espacial (Prismas, Cilindros e Esferas)',
          'Trigonometria Básica e Ciclo Trigonométrico',
          'Análise Combinatória e Probabilidade',
          'Estatística (Média, Mediana, Moda e Gráficos)',
        ],
      },
      {
        name: 'Informática para Concursos',
        color: '#14b8a6',
        weight: 3,
        difficulty: 'baixa',
        knowledgeLevel: 'intermediario',
        topics: [
          'Sistemas Operacionais (Windows 10/11 e Linux)',
          'Pacote Office e LibreOffice (Word/Writer, Excel/Calc)',
          'Redes de Computadores, Protocolos e Navegadores',
          'Segurança da Informação (Malware, Phishing, Criptografia)',
          'Computação em Nuvem, Backup e Ferramentas Colaborativas',
          'Correio Eletrônico e Certificação Digital',
        ],
      },
      {
        name: 'Ética no Serviço Público',
        color: '#a855f7',
        weight: 2,
        difficulty: 'baixa',
        knowledgeLevel: 'intermediario',
        topics: [
          'Código de Ética Profissional (Decreto 1.171/1994)',
          'Deveres e Vedações do Servidor Público',
          'Comissão de Ética e Processo Ético',
          'Decreto 6.029/2007 (Sistema de Gestão da Ética)',
          'Lei de Conflito de Interesses (Lei 12.813/2013)',
        ],
      },
      {
        name: 'Atualidades & Redação Oficial',
        color: '#8b5cf6',
        weight: 3,
        difficulty: 'baixa',
        knowledgeLevel: 'intermediario',
        topics: [
          'Manual de Redação da Presidência (Padrão Ofício)',
          'Atributos da Redação Oficial (Impessoalidade, Clareza, Concisão)',
          'Pronomes de Tratamento e Vocativos',
          'Temas Políticos, Econômicos e Sociais Nacionais',
          'Relações Internacionais e Geopolítica Atual',
          'Sustentabilidade, Ciência e Tecnologia no Brasil',
        ],
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
            topics: [
              'Fundamentos, Competências do DF e Regiões Administrativas',
              'Organização dos Poderes no DF (CLDF e Governador)',
              'Servidores Públicos do Distrito Federal na LODF',
              'Ordem Social, Educação, Saúde e Segurança Pública no DF',
              'Ordem Econômica, Financeira e Tributária do DF',
            ],
          },
          {
            name: 'Regime Jurídico (LC 840/2011)',
            color: '#f43f5e',
            weight: 4,
            difficulty: 'alta',
            knowledgeLevel: 'iniciante',
            topics: [
              'Provimento, Nomeação, Posse, Exercício e Estágio Probatório',
              'Vacância, Remoção, Redistribuição e Substituição',
              'Direitos, Vantagens, Férias, Licenças e Afastamentos',
              'Regime Disciplinar: Deveres, Proibições e Acumulação',
              'Infrações, Sanções Disciplinares e Prescrição',
              'Sindicância e Processo Administrativo Disciplinar (PAD)',
            ],
          },
          {
            name: 'Conhecimentos sobre o DF (RIDE)',
            color: '#f59e0b',
            weight: 3,
            difficulty: 'baixa',
            knowledgeLevel: 'intermediario',
            topics: [
              'Formação Histórica de Brasília e Plano Piloto',
              'Geografia, Clima (Cerrado) e Bacias Hidrográficas do DF',
              'Estrutura da Região Integrada de Desenvolvimento (RIDE-DF)',
              'Aspectos Socioeconômicos, Demografia e Urbanização do DF',
              'Atualidades Políticas e Culturais do Distrito Federal',
            ],
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
            topics: [
              'Disposições Preliminares, Provimento e Vacância',
              'Remoção, Redistribuição e Substituição',
              'Vencimento, Remuneração, Vantagens e Indenizações',
              'Férias, Licenças, Afastamentos e Concessões',
              'Regime Disciplinar (Deveres, Proibições e Penalidades)',
              'Sindicância e Processo Administrativo Disciplinar',
            ],
          },
          {
            name: 'Administração Pública & Políticas Públicas',
            color: '#0284c7',
            weight: 4,
            difficulty: 'media',
            knowledgeLevel: 'intermediario',
            topics: [
              'Modelos de Administração (Patrimonialista, Burocrática, Gerencial)',
              'Governança, Governabilidade e Accountability',
              'Ciclo de Políticas Públicas (Formação, Implementação, Avaliação)',
              'Planejamento Estratégico, PPA, LDO e LOA',
              'Gestão de Pessoas, Liderança e Desempenho no Setor Público',
            ],
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
            topics: [
              'LINDB e Parte Geral: Pessoas Naturais e Jurídicas',
              'Fatos, Atos e Negócios Jurídicos (Validade e Defeitos)',
              'Prescrição e Decadência',
              'Direito das Obrigações e Modalidades',
              'Contratos em Espécie e Teoria Geral dos Contratos',
              'Responsabilidade Civil',
              'Direito das Coisas (Posse, Propriedade e Direitos Reais)',
              'Direito de Família e Sucessões',
            ],
          },
          {
            name: 'Direito Processual Civil',
            color: '#2563eb',
            weight: 4,
            difficulty: 'alta',
            knowledgeLevel: 'intermediario',
            topics: [
              'Normas Fundamentais, Jurisdição e Competência',
              'Sujeitos do Processo, Litisconsórcio e Intervenção de Terceiros',
              'Atos Processuais, Prazos e Tutelas Provisórias',
              'Procedimento Comum: Petição Inicial, Contestação e Provas',
              'Sentença, Coisa Julgada e Cumprimento de Sentença',
              'Execução e Procedimentos Especiais',
              'Recursos no CPC (Apelação, Agravo, REsp e RE)',
            ],
          },
          {
            name: 'Direito Penal',
            color: '#8b5cf6',
            weight: 4,
            difficulty: 'media',
            knowledgeLevel: 'intermediario',
            topics: [
              'Princípios Penais e Aplicação da Lei Penal',
              'Teoria do Crime: Fato Típico, Ilicitude e Culpabilidade',
              'Tentativa, Desistência Voluntária e Erro de Tipo/Proibição',
              'Concurso de Pessoas e Concurso de Crimes',
              'Teoria da Pena, Dosimetria e Extinção da Punibilidade',
              'Crimes contra a Pessoa e contra o Patrimônio',
              'Crimes contra a Administração Pública',
            ],
          },
          {
            name: 'Direito Processual Penal',
            color: '#7c3aed',
            weight: 4,
            difficulty: 'media',
            knowledgeLevel: 'intermediario',
            topics: [
              'Princípios e Sistemas Processuais Penais',
              'Inquérito Policial e Ação Penal',
              'Competência e Questões Incidentes',
              'Provas no Processo Penal e Nulidades',
              'Prisão em Flagrante, Preventiva, Temporária e Liberdade Provisória',
              'Procedimentos Comum, Sumário e Tribunal do Júri',
              'Recursos em Processo Penal e Habeas Corpus',
            ],
          },
          {
            name: 'Direito Eleitoral',
            color: '#06b6d4',
            weight: 3,
            difficulty: 'media',
            knowledgeLevel: 'iniciante',
            topics: [
              'Organização da Justiça Eleitoral e Competência',
              'Alistamento Eleitoral, Domicílio e Direitos Políticos',
              'Elegibilidade e Inelegibilidades (LC 64/90)',
              'Partidos Políticos, Coligações e Federações',
              'Registro de Candidatura, Propaganda Eleitoral e Financiamento',
              'Ações Eleitorais e Crimes Eleitorais',
            ],
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
            topics: [
              'Sistema Tributário Nacional e Princípios Constitucionais',
              'Imunidades Tributárias e Competência Tributária',
              'Espécies Tributárias (Impostos, Taxas, Contribuições)',
              'Obrigação Tributária, Fato Gerador e Responsabilidade',
              'Crédito Tributário: Lançamento, Suspensão, Extinção e Exclusão',
              'Garantias, Privilégios e Administração Tributária',
              'Impostos em Espécie (ICMS, ISS, IR, IPI, IPTU, ITCMD)',
            ],
          },
          {
            name: 'Contabilidade Geral & Avançada',
            color: '#10b981',
            weight: 5,
            difficulty: 'alta',
            knowledgeLevel: 'iniciante',
            topics: [
              'Patrimônio, Equação Fundamental e Contas Contábeis',
              'Escrituração, Método das Partidas Dobradas e Razonetes',
              'Balanço Patrimonial (CPC 26) e Classificação',
              'Demonstração do Resultado do Exercício (DRE)',
              'DFC (Fluxo de Caixa) e DVA',
              'Operações com Mercadorias, Estoques e Tributos',
              'Depreciação, Amortização, Provisões e CPCs Essenciais',
            ],
          },
          {
            name: 'AFO & Direito Financeiro',
            color: '#059669',
            weight: 4,
            difficulty: 'alta',
            knowledgeLevel: 'iniciante',
            topics: [
              'Orçamento Público: Conceito e Princípios Orçamentários',
              'Ciclo Orçamentário e Instrumentos (PPA, LDO, LOA)',
              'Créditos Adicionais (Suplementares, Especiais e Extraordinários)',
              'Receita Pública: Classificação e Estágios',
              'Despesa Pública: Classificação e Estágios (Empenho, Liquidação, Pagamento)',
              'Lei de Responsabilidade Fiscal (LC 101/2000)',
            ],
          },
          {
            name: 'Auditoria Governamental e Privada',
            color: '#0d9488',
            weight: 4,
            difficulty: 'alta',
            knowledgeLevel: 'iniciante',
            topics: [
              'Conceito, Objetivos e Normas de Auditoria (NBC TA)',
              'Independência, Ceticismo Profissional e Risco de Auditoria',
              'Planejamento, Materialidade e Amostragem Estatística',
              'Evidência de Auditoria e Testes Substantivos/de Controle',
              'Relatório do Auditor Independente (Tipos de Opinião)',
              'Auditoria Governamental (NBASP / Controle Interno e Externo)',
            ],
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
            topics: [
              'Lei de Drogas (Lei 11.343/2006)',
              'Estatuto do Desarmamento (Lei 10.826/2003)',
              'Lei de Crimes Hediondos (Lei 8.072/1990)',
              'Organizações Criminosas (Lei 12.850/2013)',
              'Abuso de Autoridade (Lei 13.869/2019)',
              'Lei Maria da Penha (Lei 11.340/2006) e Tortura',
              'Interceptação Telefônica e Lavagem de Capitais',
            ],
          },
          {
            name: 'Medicina Legal & Criminalística',
            color: '#dc2626',
            weight: 3,
            difficulty: 'media',
            knowledgeLevel: 'iniciante',
            topics: [
              'Tanatologia Forense e Cronotanatognose',
              'Traumatologia Forense (Lesões Contusas, Cortantes e Perfurocontusas)',
              'Asfixiologia Forense',
              'Sexologia Forense e Imputabilidade Penal',
              'Toxicologia e Cadeia de Custódia de Vestígios',
            ],
          },
          {
            name: 'Contabilidade para Polícia',
            color: '#16a34a',
            weight: 4,
            difficulty: 'alta',
            knowledgeLevel: 'iniciante',
            topics: [
              'Equação Patrimonial e Balanço Patrimonial',
              'Contas Patrimoniais vs Contas de Resultado (DRE)',
              'Regime de Competência vs Regime de Caixa',
              'Fluxo de Caixa, Conciliação e Indícios de Fraude',
              'Análise de Demonstrações Contábeis Básica',
            ],
          },
          {
            name: 'Estatística',
            color: '#ea580c',
            weight: 4,
            difficulty: 'alta',
            knowledgeLevel: 'iniciante',
            topics: [
              'Estatística Descritiva: Média, Mediana, Moda e Quartis',
              'Medidas de Dispersão (Variância e Desvio Padrão)',
              'Probabilidade Condicional e Teorema de Bayes',
              'Variáveis Aleatórias e Distribuições (Binomial, Normal, Poisson)',
              'Amostragem, Estimação e Intervalo de Confiança',
              'Testes de Hipóteses e Regressão Linear',
            ],
          },
          {
            name: 'Legislação de Trânsito (CTB)',
            color: '#d97706',
            weight: 4,
            difficulty: 'media',
            knowledgeLevel: 'intermediario',
            topics: [
              'Sistema Nacional de Trânsito e Competências',
              'Normas Gerais de Circulação e Conduta',
              'Sinalização de Trânsito e Engenharia de Tráfego',
              'Habilitação (CNH, Categorias e Pontuação)',
              'Infrações, Penalidades e Medidas Administrativas',
              'Crimes de Trânsito e Resoluções do CONTRAN',
            ],
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
            topics: [
              'Sistema Financeiro Nacional (CMN, BACEN e CVM)',
              'Bancos Comerciais, Múltiplos, Caixas e Cooperativas',
              'Mercado Monetário, de Crédito, de Capitais e Cambial',
              'Produtos Bancários (CDB, LCI/LCA, Fundos, Seguros e Previdência)',
              'Pix, Open Finance, Drex e Garantias do SFN (FGC)',
              'Prevenção à Lavagem de Dinheiro (PLD/FT) e Compliance',
            ],
          },
          {
            name: 'Matemática Financeira',
            color: '#f97316',
            weight: 4,
            difficulty: 'alta',
            knowledgeLevel: 'iniciante',
            topics: [
              'Porcentagem, Juros Simples e Desconto Simples',
              'Juros Compostos e Taxas Equivalentes/Efetivas',
              'Séries de Pagamentos Uniformes (Valor Presente e Futuro)',
              'Sistemas de Amortização: Tabela Price e SAC',
              'Análise de Investimentos (VPL e TIR)',
            ],
          },
          {
            name: 'Vendas & Negociação',
            color: '#ec4899',
            weight: 4,
            difficulty: 'baixa',
            knowledgeLevel: 'intermediario',
            topics: [
              'Marketing de Serviços e Relacionamento (CRM)',
              'Etapas da Venda Consultiva e Gatilhos de Decisão',
              'Atendimento ao Cliente, Escuta Ativa e Pós-Venda',
              'Gestão de Objeções e Técnicas de Fechamento',
              'Código de Defesa do Consumidor Aplicado ao Setor Bancário',
            ],
          },
          {
            name: 'Atualidades do Mercado Financeiro',
            color: '#8b5cf6',
            weight: 3,
            difficulty: 'baixa',
            knowledgeLevel: 'intermediario',
            topics: [
              'Bancos Digitais, Fintechs e Competição Bancária',
              'Sistema de Pagamentos Instantâneos (Pix) e Open Finance',
              'Criptoativos, Tokenização e Moeda Digital (Drex)',
              'Política Monetária (Selic, COPOM e Inflação)',
              'Finanças Sustentáveis (ESG) e Segurança Cibernética',
            ],
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
            topics: [
              'Conceito, Princípios Constitucionais e Organização da Seguridade',
              'Segurados Obrigatórios, Facultativos e Dependentes (RGPS)',
              'Inscrição, Filiação e Manutenção da Qualidade de Segurado',
              'Custeio da Seguridade Social e Salário de Contribuição',
              'Aposentadorias, Auxílios, Salário-Maternidade e Pensão por Morte',
              'Carência, Cálculo de Benefícios e BPC/LOAS',
            ],
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
            topics: [
              'Princípios e Fins da Educação Nacional (LDB - Lei 9.394/96)',
              'Organização da Educação Básica e Gestão Democrática',
              'Modalidades: Educação Infantil, EJA, Especial e Profissional',
              'Plano Nacional de Educação (PNE) e Financiamento (FUNDEB)',
              'Diretrizes Curriculares Nacionais Gerais',
            ],
          },
          {
            name: 'Didática, Currículo & BNCC',
            color: '#6366f1',
            weight: 4,
            difficulty: 'media',
            knowledgeLevel: 'intermediario',
            topics: [
              'Tendências Pedagógicas Brasileiras',
              'Planejamento Escolar, PPP e Plano de Aula',
              'Avaliação da Aprendizagem (Diagnóstica, Formativa, Somativa)',
              'Competências Gerais e Estrutura da BNCC',
              'Teorias da Aprendizagem (Piaget, Vygotsky, Wallon, Ausubel)',
            ],
          },
          {
            name: 'ECA (Estatuto da Criança e Adolescente)',
            color: '#f59e0b',
            weight: 3,
            difficulty: 'baixa',
            knowledgeLevel: 'intermediario',
            topics: [
              'Princípios da Proteção Integral e Direitos Fundamentais',
              'Direito à Educação, Cultura, Esporte e Lazer',
              'Direito à Profissionalização e Proteção no Trabalho',
              'Medidas de Proteção e Medidas Socioeducativas',
              'Conselho Tutelar e Atos Infracionais',
            ],
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
        topics: [
          'Atividade da Advocacia, Atos Privativos e Incompatibilidades',
          'Direitos e Prerrogativas dos Advogados (Art. 6º e 7º)',
          'Inscrição na OAB, Sociedade de Advogados e Advogado Empregado',
          'Honorários Advocatícios (Convencionados, Arbitrados e Sucumbência)',
          'Infrações e Sanções Disciplinares',
          'Código de Ética: Publicidade, Sigilo Profissional e Órgãos da OAB',
        ],
      },
      {
        name: 'Direito Constitucional',
        color: '#10b981',
        weight: 5,
        difficulty: 'media',
        knowledgeLevel: 'intermediario',
        topics: [
          'Princípios Fundamentais (Art. 1º ao 4º da CF)',
          'Direitos e Garantias Fundamentais (Art. 5º)',
          'Direitos Sociais, Nacionalidade e Direitos Políticos',
          'Organização do Estado e Repartição de Competências',
          'Poder Legislativo e Processo Legislativo',
          'Poder Executivo e Poder Judiciário',
          'Controle de Constitucionalidade',
          'Administração Pública na CF (Art. 37 ao 41)',
        ],
      },
      {
        name: 'Direito Administrativo',
        color: '#0ea5e9',
        weight: 5,
        difficulty: 'media',
        knowledgeLevel: 'intermediario',
        topics: [
          'Princípios da Administração Pública (LIMPE e Implícitos)',
          'Organização Administrativa (Direta, Indireta e Agências)',
          'Poderes Administrativos e Abuso de Poder',
          'Atos Administrativos (Requisitos, Atributos e Extinção)',
          'Licitações e Contratos (Lei 14.133/2021)',
          'Agentes Públicos e Responsabilidade Civil do Estado',
          'Improbidade Administrativa (Lei 8.429/92 atualizada)',
          'Controle da Administração e Processo Administrativo',
        ],
      },
      {
        name: 'Direito Civil',
        color: '#3b82f6',
        weight: 5,
        difficulty: 'alta',
        knowledgeLevel: 'intermediario',
        topics: [
          'LINDB e Parte Geral: Pessoas Naturais e Jurídicas',
          'Fatos, Atos e Negócios Jurídicos (Validade e Defeitos)',
          'Prescrição e Decadência',
          'Direito das Obrigações e Modalidades',
          'Contratos em Espécie e Teoria Geral dos Contratos',
          'Responsabilidade Civil',
          'Direito das Coisas (Posse, Propriedade e Direitos Reais)',
          'Direito de Família e Sucessões',
        ],
      },
      {
        name: 'Processo Civil',
        color: '#2563eb',
        weight: 5,
        difficulty: 'alta',
        knowledgeLevel: 'intermediario',
        topics: [
          'Normas Fundamentais, Jurisdição e Competência',
          'Litisconsórcio, Intervenção de Terceiros e Tutelas Provisórias',
          'Procedimento Comum, Resposta do Réu e Audiências',
          'Provas, Sentença e Coisa Julgada',
          'Cumprimento de Sentença e Processo de Execução',
          'Teoria Geral dos Recursos, Apelação e Agravos',
          'Recursos aos Tribunais Superiores',
        ],
      },
      {
        name: 'Direito Penal',
        color: '#8b5cf6',
        weight: 4,
        difficulty: 'media',
        knowledgeLevel: 'iniciante',
        topics: [
          'Princípios Penais e Aplicação da Lei Penal',
          'Teoria do Crime: Fato Típico, Ilicitude e Culpabilidade',
          'Tentativa, Desistência Voluntária e Erro de Tipo/Proibição',
          'Concurso de Pessoas e Concurso de Crimes',
          'Teoria da Pena, Dosimetria e Extinção da Punibilidade',
          'Crimes contra a Pessoa e contra o Patrimônio',
          'Crimes contra a Administração Pública',
        ],
      },
      {
        name: 'Processo Penal',
        color: '#7c3aed',
        weight: 4,
        difficulty: 'media',
        knowledgeLevel: 'iniciante',
        topics: [
          'Princípios, Inquérito Policial e Ação Penal',
          'Competência, Provas e Cadeia de Custódia',
          'Prisões Cautelares e Medidas Alternativas',
          'Procedimento Comum, Júri e Nulidades',
          'Sentença Penal e Recursos (Apelação, RESE, Embargos)',
          'Execução Penal e Ações Autônomas de Impugnação',
        ],
      },
      {
        name: 'Direito do Trabalho',
        color: '#f59e0b',
        weight: 4,
        difficulty: 'media',
        knowledgeLevel: 'intermediario',
        topics: [
          'Princípios, Fontes e Relação de Emprego vs Relação de Trabalho',
          'Contrato Individual de Trabalho e Alteração Contratual',
          'Duração do Trabalho, Horas Extras, Intervalos e Férias',
          'Remuneração, Salário, Adicionais e Equiparação Salarial',
          'Suspensão e Interrupção do Contrato de Trabalho',
          'Extinção do Contrato, Verbas Rescisórias e Estabilidades',
          'Direito Coletivo, Sindicatos e Negociação Coletiva',
        ],
      },
      {
        name: 'Processo do Trabalho',
        color: '#d97706',
        weight: 4,
        difficulty: 'media',
        knowledgeLevel: 'intermediario',
        topics: [
          'Organização e Competência da Justiça do Trabalho',
          'Atos, Prazos e Custas Processuais Trabalhistas',
          'Ritos: Ordinário, Sumaríssimo e Inquérito Judicial',
          'Audiência Trabalhista, Resposta do Réu e Provas',
          'Sentença e Recursos Trabalhistas (RO, RR, Agravos)',
          'Liquidação e Execução Trabalhista',
        ],
      },
      {
        name: 'Direito Tributário',
        color: '#06b6d4',
        weight: 4,
        difficulty: 'alta',
        knowledgeLevel: 'iniciante',
        topics: [
          'Sistema Tributário Nacional e Princípios Constitucionais',
          'Imunidades Tributárias e Competência Tributária',
          'Espécies Tributárias (Impostos, Taxas, Contribuições)',
          'Obrigação Tributária, Fato Gerador e Responsabilidade',
          'Crédito Tributário: Lançamento, Suspensão, Extinção e Exclusão',
          'Garantias, Privilégios e Administração Tributária',
          'Impostos em Espécie (ICMS, ISS, IR, IPI, IPTU, ITCMD)',
        ],
      },
      {
        name: 'Direito Empresarial',
        color: '#14b8a6',
        weight: 3,
        difficulty: 'alta',
        knowledgeLevel: 'iniciante',
        topics: [
          'Teoria da Empresa, Empresário Individual e MEI',
          'Sociedades Limitadas (LTDA) e Sociedades Anônimas (S/A)',
          'Títulos de Crédito (Letra de Câmbio, Nota Promissória, Cheque, Duplicata)',
          'Falência e Recuperação Judicial e Extrajudicial',
          'Contratos Empresariais e Propriedade Industrial',
        ],
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
            topics: [
              'Teoria Geral, Características e Gerações dos Direitos Humanos',
              'Sistema Global (ONU): DUDH, Pactos de 1966',
              'Sistema Interamericano: Pacto de San José e Corte IDH',
              'Incorporação dos Tratados Internacionais no Brasil (EC 45/2004)',
              'Grupos Vulneráveis e Políticas Internacionais de Proteção',
            ],
          },
          {
            name: 'Direito Internacional',
            color: '#6366f1',
            weight: 2,
            difficulty: 'media',
            knowledgeLevel: 'iniciante',
            topics: [
              'Fontes do Direito Internacional Público e Tratados',
              'Nacionalidade, Condição Jurídica do Estrangeiro e Extradição',
              'Imunidade de Jurisdição e Execução dos Estados',
              'Direito Internacional Privado: Regras de Conexão na LINDB',
              'Homologação de Sentença Estrangeira e Cooperação Jurídica',
            ],
          },
          {
            name: 'Filosofia do Direito',
            color: '#a855f7',
            weight: 2,
            difficulty: 'baixa',
            knowledgeLevel: 'intermediario',
            topics: [
              'Jusnaturalismo Antigo, Medieval e Racionalista',
              'Positivismo Jurídico: Hans Kelsen e Herbert Hart',
              'Pós-Positivismo e Neoconstitucionalismo (Dworkin e Alexy)',
              'Teorias da Justiça (John Rawls e Aristóteles)',
              'Hermenêutica Jurídica e Argumentação',
            ],
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
            topics: [
              'Conceitos de Consumidor, Fornecedor, Produto e Serviço',
              'Direitos Básicos e Inversão do Ônus da Prova',
              'Responsabilidade pelo Fato e pelo Vício do Produto/Serviço',
              'Práticas Comerciais Abusivas, Cobrança e Publicidade',
              'Proteção Contratual, Cláusulas Abusivas e Direito de Arrependimento',
            ],
          },
          {
            name: 'Estatuto da Criança e do Adolescente (ECA)',
            color: '#22c55e',
            weight: 3,
            difficulty: 'baixa',
            knowledgeLevel: 'intermediario',
            topics: [
              'Proteção Integral, Direitos Fundamentais e Convivência Familiar',
              'Guarda, Tutela, Adoção e Destituição do Poder Familiar',
              'Autorização para Viagem e Prevenção',
              'Ato Infracional e Medidas Socioeducativas',
              'Conselho Tutelar e Infrações Administrativas/Crimes',
            ],
          },
          {
            name: 'Direito Ambiental',
            color: '#16a34a',
            weight: 2,
            difficulty: 'baixa',
            knowledgeLevel: 'intermediario',
            topics: [
              'Princípios Ambientais (Poluidor-Pagador, Precaução, Prevenção)',
              'Competências Constitucionais Ambientais',
              'Política Nacional do Meio Ambiente e Licenciamento (EIA/RIMA)',
              'SNUC (Unidades de Conservação) e Código Florestal (APP e RL)',
              'Responsabilidade Civil, Administrativa e Penal Ambiental',
            ],
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
            topics: [
              'Organização da Justiça Eleitoral e Competência',
              'Alistamento Eleitoral, Domicílio e Direitos Políticos',
              'Elegibilidade e Inelegibilidades (LC 64/90)',
              'Partidos Políticos, Coligações e Federações',
              'Registro de Candidatura, Propaganda Eleitoral e Financiamento',
              'Ações Eleitorais e Crimes Eleitorais',
            ],
          },
          {
            name: 'Direito Previdenciário',
            color: '#0d9488',
            weight: 2,
            difficulty: 'media',
            knowledgeLevel: 'iniciante',
            topics: [
              'Princípios da Seguridade Social na Constituição',
              'Segurados, Dependentes e Manutenção da Qualidade',
              'Benefícios do RGPS (Aposentadorias, Auxílios e Pensão)',
              'Custeio Previdenciário e Regimes Próprios (RPPS)',
            ],
          },
          {
            name: 'Direito Financeiro',
            color: '#ca8a04',
            weight: 2,
            difficulty: 'media',
            knowledgeLevel: 'iniciante',
            topics: [
              'Princípios Orçamentários e Ciclo Orçamentário (PPA, LDO, LOA)',
              'Receitas, Despesas Públicas e Empenho',
              'Créditos Adicionais e Precatórios',
              'Lei de Responsabilidade Fiscal e Controle Financeiro',
            ],
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
        topics: [
          'Variáveis, Tipos de Dados e Operadores',
          'Estruturas Condicionais (if/else, switch)',
          'Laços de Repetição (for, while, do-while)',
          'Funções, Escopo e Recursividade',
          'Arrays, Matrizes e Manipulação de Strings',
          'Programação Orientada a Objetos (Classes, Herança, Polimorfismo)',
        ],
      },
      {
        name: 'Estrutura de Dados & Algoritmos',
        color: '#6366f1',
        weight: 5,
        difficulty: 'alta',
        knowledgeLevel: 'iniciante',
        topics: [
          'Complexidade Assintótica (Notação Big-O)',
          'Listas Encadeadas, Pilhas e Filas',
          'Tabelas Hash (HashMap) e Conjuntos',
          'Árvores Binárias, BST e Heaps',
          'Algoritmos de Ordenação e Busca Binária',
          'Grafos (BFS, DFS e Menor Caminho) e Programação Dinâmica',
        ],
      },
      {
        name: 'Banco de Dados & SQL',
        color: '#0ea5e9',
        weight: 5,
        difficulty: 'media',
        knowledgeLevel: 'intermediario',
        topics: [
          'Modelagem Relacional (DER, Chaves Primária e Estrangeira)',
          'Normalização (1FN, 2FN, 3FN)',
          'Consultas SQL: SELECT, WHERE, ORDER BY e Agregações',
          'JOINs (INNER, LEFT, RIGHT) e Subqueries',
          'Índices, Transações (ACID) e Otimização de Queries',
          'NoSQL: Conceitos de Documentos, Chave-Valor e Cache (Redis)',
        ],
      },
      {
        name: 'Backend & APIs',
        color: '#8b5cf6',
        weight: 5,
        difficulty: 'media',
        knowledgeLevel: 'intermediario',
        topics: [
          'Protocolo HTTP, Métodos, Status Codes e Headers',
          'Arquitetura REST, Versionamento e Boas Práticas',
          'Autenticação e Autorização (JWT, OAuth 2.0, Sessões)',
          'Validação de Dados, Tratamento de Erros e Logging',
          'Arquitetura em Camadas, Clean Architecture e Padrões',
          'Mensageria, Filas Assíncronas e WebSockets',
        ],
      },
      {
        name: 'Frontend & Web Moderna',
        color: '#10b981',
        weight: 4,
        difficulty: 'media',
        knowledgeLevel: 'intermediario',
        topics: [
          'HTML5 Semântico e Acessibilidade (WCAG / ARIA)',
          'CSS Moderno: Flexbox, Grid e Design Responsivo',
          'JavaScript Moderno (ES6+, Promises, Async/Await, DOM)',
          'TypeScript: Tipagem Estática, Generics e Interfaces',
          'React: Componentes, Hooks, Estado e Ciclo de Vida',
          'Gerenciamento de Estado, Roteamento e Performance Web',
        ],
      },
      {
        name: 'Engenharia de Software & Testes (QA)',
        color: '#06b6d4',
        weight: 4,
        difficulty: 'media',
        knowledgeLevel: 'intermediario',
        topics: [
          'Metodologias Ágeis (Scrum, Kanban) e Estimativas',
          'Princípios SOLID, Clean Code e Refatoração',
          'Pirâmide de Testes: Unitários, Integração e E2E',
          'TDD, Mocks, Stubs e Cobertura de Código',
          'Code Review, Documentação Técnica e Observabilidade',
        ],
      },
      {
        name: 'Git, Linux & Redes',
        color: '#14b8a6',
        weight: 3,
        difficulty: 'baixa',
        knowledgeLevel: 'intermediario',
        topics: [
          'Git Essencial: Commit, Branch, Merge, Rebase e Pull Requests',
          'Terminal Linux, Permissões, Processos e Shell Script',
          'Modelo OSI/TCP-IP, DNS, HTTP/HTTPS e TLS',
          'Portas, Firewalls, Proxy Reverso e Balanceamento de Carga',
        ],
      },
      {
        name: 'Inglês Técnico',
        color: '#f59e0b',
        weight: 3,
        difficulty: 'baixa',
        knowledgeLevel: 'intermediario',
        topics: [
          'Leitura de Documentação Oficial e RFCs',
          'Vocabulário de Erros, Logs e Stack Traces',
          'Escrita de Commits, Issues e Pull Requests em Inglês',
          'Compreensão de Palestras e Vídeos Técnicos',
        ],
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
            topics: [
              'Arquitetura de Containers vs Máquinas Virtuais',
              'Dockerfile, Imagens, Camadas e Multi-Stage Builds',
              'Docker Compose para Ambientes Multi-Serviço',
              'Redes e Volumes Persistentes no Docker',
              'Kubernetes: Pods, Deployments, Services e Ingress',
            ],
          },
          {
            name: 'Cloud Computing & CI/CD',
            color: '#4f46e5',
            weight: 4,
            difficulty: 'media',
            knowledgeLevel: 'iniciante',
            topics: [
              'Conceitos IaaS, PaaS, SaaS e Regiões/Zonas',
              'Serviços Core em Cloud (Compute, Storage, IAM, VPC)',
              'Pipelines de CI/CD (GitHub Actions / Testes Automatizados)',
              'Infraestrutura como Código (Terraform) e Monitoramento',
            ],
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
            topics: [
              'Estruturas Python, List Comprehensions e Ambientes Virtuais',
              'NumPy: Vetorização e Operações Matriciais',
              'Pandas: DataFrames, Limpeza e Agregação de Dados',
              'Visualização Exploratória (Matplotlib e Seaborn)',
              'Estatística Aplicada e Análise Exploratória (EDA)',
            ],
          },
          {
            name: 'Machine Learning & IA Aplicada',
            color: '#a855f7',
            weight: 4,
            difficulty: 'alta',
            knowledgeLevel: 'iniciante',
            topics: [
              'Aprendizado Supervisionado vs Não Supervisionado',
              'Pré-processamento, Split Treino/Teste e Validação Cruzada',
              'Regressão, Classificação e Métricas (F1, ROC-AUC)',
              'Árvores de Decisão, Random Forest e Gradient Boosting',
              'Fundamentos de Redes Neurais, LLMs e Embeddings/RAG',
            ],
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
            topics: [
              'Fundamentos Mobile: Ciclo de Vida e UI Nativa/Híbrida',
              'Navegação entre Telas (Stack, Tabs e Deep Linking)',
              'Consumo de APIs, Cache Offline e Armazenamento Local',
              'Permissões, Câmera, Notificações Push e Geolocalização',
              'Build, Assinatura e Publicação nas Lojas (App Store/Play Store)',
            ],
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
            topics: [
              'OWASP Top 10: SQL Injection, XSS, CSRF e Broken Access',
              'Armazenamento Seguro de Senhas (Hashing, Salt, Argon2)',
              'Segurança em APIs, CORS, Rate Limiting e Gestão de Segredos',
              'Criptografia Simétrica/Assimétrica e Certificados TLS',
              'Análise de Vulnerabilidades e Boas Práticas DevSecOps',
            ],
          },
        ],
      },
    ],
  },
];

function normalizeTopicLookup(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Returns standardized syllabus topics for a given subject name (and optional preset ID:
 * 'enem', 'medicina', 'concurso_geral', 'oab', 'dev_tech').
 */
export function getPresetTopics(subjectName: string, presetId?: string): string[] {
  const normalizedTarget = normalizeTopicLookup(subjectName);

  if (presetId) {
    const targetPreset = RAW_STUDY_PRESETS.find((preset) => preset.id === presetId);
    if (targetPreset) {
      const presetSubjects = [
        ...targetPreset.subjects,
        ...(targetPreset.modules?.flatMap((mod) => mod.subjects) || []),
      ];
      const exactMatch = presetSubjects.find((sub) => sub.name === subjectName);
      if (exactMatch && exactMatch.topics.length > 0) {
        return [...exactMatch.topics];
      }
      if (normalizedTarget) {
        const normalizedMatch = presetSubjects.find(
          (sub) => normalizeTopicLookup(sub.name) === normalizedTarget
        );
        if (normalizedMatch && normalizedMatch.topics.length > 0) {
          return [...normalizedMatch.topics];
        }
      }
    }
  }

  const exactPresetSubject = RAW_STUDY_PRESETS.flatMap((preset) => [
    ...preset.subjects,
    ...(preset.modules?.flatMap((mod) => mod.subjects) || []),
  ]).find((sub) => sub.name === subjectName && sub.topics.length > 0);
  if (exactPresetSubject) {
    return [...exactPresetSubject.topics];
  }

  const fromBank = findSuggestedTopicsForSubject(subjectName);
  if (fromBank.length > 0) {
    return [...fromBank];
  }

  if (normalizedTarget) {
    for (const preset of RAW_STUDY_PRESETS) {
      const presetSubjects = [
        ...preset.subjects,
        ...(preset.modules?.flatMap((mod) => mod.subjects) || []),
      ];
      const match = presetSubjects.find(
        (sub) => normalizeTopicLookup(sub.name) === normalizedTarget && sub.topics.length > 0
      );
      if (match) {
        return [...match.topics];
      }
    }
  }

  return [];
}

function ensureNonEmptyPresetTopics(subjectName: string, topics: string[], presetId?: string): string[] {
  const clean = topics.map((t) => t.trim()).filter(Boolean);
  if (clean.length > 0) return clean;
  const standardized = getPresetTopics(subjectName, presetId);
  if (standardized.length > 0) return standardized;
  return [
    `Fundamentos de ${subjectName}`,
    `Teoria Principal de ${subjectName}`,
    `Exercícios e Aplicação de ${subjectName}`,
    `Revisão Geral de ${subjectName}`,
  ];
}

export const STUDY_PRESETS: PresetGoal[] = RAW_STUDY_PRESETS.map((preset) => ({
  ...preset,
  subjects: preset.subjects.map((sub) => ({
    ...sub,
    topics: ensureNonEmptyPresetTopics(sub.name, sub.topics, preset.id),
  })),
  modules: preset.modules?.map((mod) => ({
    ...mod,
    subjects: mod.subjects.map((sub) => ({
      ...sub,
      topics: ensureNonEmptyPresetTopics(sub.name, sub.topics, preset.id),
    })),
  })),
}));

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
  const sessions = pruneSessions(
    Array.isArray(parsed.sessions) ? parsed.sessions : [],
    todayStr
  );
  const notifications = pruneNotifications(
    Array.isArray(parsed.notifications) ? parsed.notifications : [],
    todayStr
  );

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
    notifications,
    currentUser: userOverride || parsed.currentUser || base.currentUser,
  };
}

export function pruneSessions(
  sessions: StudySession[],
  todayStr: string = getTodayStr()
): StudySession[] {
  if (!Array.isArray(sessions) || sessions.length === 0) return [];
  const cutoffDate = addDays(todayStr, -180);
  const filtered = sessions.filter((s) => {
    if (!s || typeof s.date !== 'string') return false;
    return s.date.slice(0, 10) >= cutoffDate;
  });
  return filtered.slice(0, 400);
}

export function pruneNotifications(
  notifications: InAppNotification[],
  todayStr: string = getTodayStr()
): InAppNotification[] {
  if (!Array.isArray(notifications) || notifications.length === 0) return [];
  const cutoffDate = addDays(todayStr, -30);
  const filtered = notifications.filter((n) => {
    if (!n || typeof n.date !== 'string') return false;
    return n.date.slice(0, 10) >= cutoffDate;
  });
  return filtered.slice(0, 60);
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
