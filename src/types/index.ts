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

export interface SubjectTopic {
  id: string;
  name: string;
  completed: boolean;
  completedAt?: string;
  exercisesCount?: number;
  exercisesCorrect?: number;
}

export interface Subject {
  id: string;
  name: string;
  color: string; // Tailwind color class or hex
  iconName?: string;
  weight: number; // 1 to 5 (importance in target exam)
  difficulty: SubjectDifficulty; // baixa (1), media (1.5), alta (2)
  knowledgeLevel: KnowledgeLevel; // iniciante, intermediario, avancado
  topics: SubjectTopic[];
  totalMinutesStudied: number;
  lastStudiedAt?: string;
  nextReviewAt?: string;
  completedTasksCount: number;
  totalExercisesDone: number;
  totalExercisesCorrect: number;
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
  durationMinutes: number;
  date: string; // ISO or YYYY-MM-DD
  exercisesDone: number;
  exercisesCorrect: number;
  xpEarned: number;
  notes?: string;
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

export interface DailyGoal {
  targetMinutes: number;
  targetTasks: number;
  completedMinutes: number;
  completedTasks: number;
}

export interface UserProfile {
  name: string;
  email?: string;
  avatarSeed?: string;
  objective: string; // e.g. "ENEM Medicina", "Receita Federal", "Aprender Programação"
  targetExam?: string;
  examDate?: string; // YYYY-MM-DD
  profileType: StudyProfileType;
  dailyAvailableMinutes: number; // e.g. 120 (2h)
  availableDays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  preferredSessionLength: number; // 25, 45, 50, 60 min
  
  // Gamification stats
  xp: number;
  level: number;
  streakDays: number;
  lastActiveDate?: string; // YYYY-MM-DD
  freezeStreakCount: number;
  
  // Onboarding state
  onboardingCompleted: boolean;
  createdAt: string;
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
}
