export type StudyProfileType =
  | 'iniciante'
  | 'vestibulando'
  | 'concurseiro'
  | 'pouco_tempo'
  | 'desorganizado'
  | 'procrastinador'
  | 'multiplas_materias'
  | 'sem_cronograma';

export type SubjectDifficulty = 'baixa' | 'media' | 'alta';

export type KnowledgeLevel = 'iniciante' | 'intermediario' | 'avancado';

export type TaskType = 'teoria' | 'exercicios' | 'revisao' | 'simulado';

export type TaskStatus = 'pendente' | 'em_andamento' | 'concluida' | 'atrasada' | 'pulada';

export type StudyMethodId =
  | 'pomodoro'
  | 'blocos_50_10'
  | 'active_recall'
  | 'estudo_reverso'
  | 'intercalado'
  | 'feynman'
  | 'personalizado';

export interface SubjectTopic {
  id: string;
  name: string;
  completed: boolean;
  completedAt?: string;
  exercisesCount?: number;
  exercisesCorrect?: number;
}

/**
 * Subject Model enriched with spreadsheet fields (MATÉRIAS, PESO, CICLO, REVISÃO, CADERNO DE QUESTÕES, PAREI, MAT. CONCLUÍDA)
 */
export interface Subject {
  id: string;
  name: string;
  color: string; // Tailwind color class or hex
  iconName?: string;
  weight: number; // 1 to 5 (importance in target exam)
  difficulty: SubjectDifficulty; // baixa, media, alta
  knowledgeLevel: KnowledgeLevel; // iniciante, intermediario, avancado
  topics: SubjectTopic[];
  totalMinutesStudied: number;
  lastStudiedAt?: string;
  nextReviewAt?: string;
  completedTasksCount: number;
  totalExercisesDone: number;
  totalExercisesCorrect: number;

  // Campos específicos da Planilha de Estudos:
  ciclo: number; // Contador do ciclo atual
  revisaoNotes?: string; // Coluna "REVISÃO" (ex: "ortografia", "resumo const 1.1-1.2")
  cadernoQuestoes?: string; // Coluna "CADERNO DE QUESTÕES" (ex: "questão 40 - ortográfica", "questão 01")
  pareiEm?: string; // Coluna "PAREI" (ex: "aula 1.6 - morfologia", "aula 1.3")
  concluida?: boolean; // Coluna "MAT. CONCLUÍDA" (checkbox)
}

export interface Task {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  topicId?: string;
  topicName: string;
  type: TaskType;
  durationMinutes: number; // e.g. 30, 45, 50, 60
  date: string; // YYYY-MM-DD
  status: TaskStatus;
  priorityScore: number; // calculated priority
  objectives: string[];
  actualDurationMinutes?: number;
  exercisesDone?: number;
  exercisesCorrect?: number;
  notes?: string;
  completedAt?: string;
  isSpacedReview?: boolean;
  reviewStep?: number; // 1 (D+1), 2 (D+7), 3 (D+15), 4 (D+30)
  
  // Rastreamento de onde parou e caderno de questões na tarefa
  pareiEm?: string;
  cadernoQuestoes?: string;
  revisaoNotes?: string;
}

export interface ActiveTimerDraft {
  task: Task;
  totalSeconds: number;
  secondsRemaining: number;
  isRunning: boolean;
  pareiEm: string;
  cadernoQuestoes: string;
  exercisesDone: number;
  exercisesCorrect: number;
  notes: string;
  updatedAt: number;
}

export interface SpacedReview {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  topicName: string;
  step: number; // 1=D+1, 2=D+7, 3=D+15, 4=D+30
  dueDate: string; // YYYY-MM-DD
  status: 'pendente' | 'concluida' | 'adiada';
  lastStudiedDate: string;
  notes?: string;
}

export interface StudySession {
  id: string;
  taskId?: string;
  subjectId: string;
  subjectName: string;
  topicName: string;
  type: TaskType;
  durationMinutes: number; // minutes
  date: string; // ISO or YYYY-MM-DD
  exercisesDone: number;
  exercisesCorrect: number;
  xpEarned: number;
  notes?: string;
  pareiEm?: string;
  cadernoQuestoes?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'streak' | 'xp' | 'hours' | 'mastery' | 'reviews';
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
  xpReward: number;
}

export interface CustomDailyGoalItem {
  id: string;
  title: string;
  completed: boolean;
  recurringDaily: boolean;
  createdDate: string; // YYYY-MM-DD
}

export interface DailyGoal {
  targetMinutes: number;
  targetTasks: number;
  targetQuestions?: number;
  completedMinutes: number;
  completedTasks: number;
  lastResetDate?: string; // YYYY-MM-DD
  customGoals?: CustomDailyGoalItem[];
}

export interface UserProfile {
  name: string;
  email?: string;
  avatarSeed?: string;
  objective: string; // e.g. "ENEM Medicina", "Receita Federal", "Concurso Público"
  targetExam?: string;
  examDate?: string; // YYYY-MM-DD
  targetTotalHours?: number; // Total hours goal when user has no fixed exam date
  profileType: StudyProfileType;
  dailyAvailableMinutes: number; // e.g. 120 (2h)
  dailyMinutesByDay?: Partial<Record<number, number>>; // 0=Sun..6=Sat custom minutes per day
  availableDays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  preferredSessionLength: number; // 25, 35, 40, 45, 50, 60 min or custom
  preferredBreakLength?: number; // 5, 10, 15, 20 min or custom
  studyMethod?: StudyMethodId;

  // Gamification stats
  xp: number;
  level: number;
  streakDays: number;
  lastActiveDate?: string; // YYYY-MM-DD
  freezeStreakCount: number;

  // Global cycle counter for spreadsheet cycle logic
  globalCiclo?: number;

  // Onboarding state
  onboardingCompleted: boolean;
  presetChosen?: boolean;
  weeklyLoad?: 'leve' | 'normal' | 'intensivo';
  createdAt: string;
}

export interface QuestionLog {
  id: string;
  subjectId: string;
  subjectName?: string;
  topicName?: string;
  totalQuestions: number;
  correctAnswers: number;
  date: string; // YYYY-MM-DD
  sessionType: 'EXERCICIOS' | 'SIMULADO';
  notes?: string;
  createdAt: string;
}

export interface FixedCommitment {
  id: string;
  day: number; // 0=Dom, 1=Seg, ..., 6=Sab
  startTime: string; // "08:00"
  endTime: string; // "17:00"
  label: string; // "Trabalho", "Faculdade", "Academia", etc.
  color?: string;
}

export interface InAppNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'streak' | 'backlog' | 'review' | 'goal' | 'achievement' | 'system';
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  isLoggedIn: boolean;
  avatarSeed?: string;
  role?: string;
}

export interface AppState {
  profile: UserProfile;
  subjects: Subject[];
  tasks: Task[];
  reviews: SpacedReview[];
  sessions: StudySession[];
  achievements: Achievement[];
  dailyGoal: DailyGoal;
  lastScheduleGeneratedAt?: string;

  // New capabilities matching Nexora
  questionLogs?: QuestionLog[];
  fixedCommitments?: FixedCommitment[];
  notifications?: InAppNotification[];
  currentUser?: UserAccount;
}
