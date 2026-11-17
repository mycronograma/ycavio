import {
  Subject,
  Task,
  UserProfile,
  SpacedReview,
  TaskType,
  FixedCommitment,
  StudyMethodId,
} from '../types';
import { getStudyMethodPreset, StudyMethodPreset } from './studyMethods';

const AWAKE_MINUTES_PER_DAY = 16 * 60; // 16h úteis descontando 8h de sono

const WEEKDAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

export function calculateCommittedMinutesForDay(
  fixedCommitments: FixedCommitment[],
  dayOfWeek: number
): number {
  if (!fixedCommitments || fixedCommitments.length === 0) return 0;
  return fixedCommitments
    .filter((c) => c.day === dayOfWeek)
    .reduce((sum, c) => {
      const start = parseTimeToMinutes(c.startTime);
      const end = parseTimeToMinutes(c.endTime);
      const diff = end >= start ? end - start : 24 * 60 - start + end;
      return sum + Math.max(0, diff);
    }, 0);
}

export interface DailyCommitmentConflict {
  day: number;
  dayLabel: string;
  plannedMinutes: number;
  blockedMinutes: number;
  remainingAwakeMinutes: number;
}

export function getDailyCommitmentConflicts(
  profile: UserProfile,
  fixedCommitments: FixedCommitment[] = []
): DailyCommitmentConflict[] {
  if (!fixedCommitments || fixedCommitments.length === 0) return [];
  const conflicts: DailyCommitmentConflict[] = [];

  for (const day of profile.availableDays) {
    const blockedMinutes = calculateCommittedMinutesForDay(fixedCommitments, day);
    if (blockedMinutes <= 0) continue;
    const plannedMinutes = profile.dailyMinutesByDay?.[day] ?? profile.dailyAvailableMinutes;
    const remainingAwakeMinutes = Math.max(0, AWAKE_MINUTES_PER_DAY - blockedMinutes);
    if (plannedMinutes > remainingAwakeMinutes) {
      conflicts.push({
        day,
        dayLabel: WEEKDAY_NAMES[day] || `Dia ${day}`,
        plannedMinutes,
        blockedMinutes,
        remainingAwakeMinutes,
      });
    }
  }

  return conflicts;
}

// Helper to format Date as YYYY-MM-DD in local time
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

export function getTodayStr(): string {
  return formatDate(new Date());
}

/**
 * Calculates priority score for a subject based on:
 * - Weight (1-5)
 * - Difficulty (baixa: 1.0, media: 1.5, alta: 2.0)
 * - Current knowledge level (iniciante: 1.6, intermediario: 1.0, avancado: 0.7)
 * - Recent accuracy performance (<60%: +0.8 boost, <75%: +0.4 boost)
 * - Days since last studied (more days = higher urgency)
 * - Days remaining until exam (if exam is near, weight multiplies priority)
 * - Overdue study ratio
 */
export function calculateSubjectPriority(
  subject: Subject,
  todayStr: string,
  examDate?: string
): number {
  const weightFactor = subject.weight * 1.2;

  const difficultyFactor =
    subject.difficulty === 'alta' ? 2.0 : subject.difficulty === 'media' ? 1.4 : 1.0;

  const knowledgeFactor =
    subject.knowledgeLevel === 'iniciante'
      ? 1.7
      : subject.knowledgeLevel === 'intermediario'
      ? 1.1
      : 0.8;

  // Performance factor based on exercise accuracy
  let performanceFactor = 1.0;
  if (subject.totalExercisesDone > 0) {
    const accuracy = subject.totalExercisesCorrect / subject.totalExercisesDone;
    if (accuracy < 0.6) {
      performanceFactor = 1.6; // needs reinforcement
    } else if (accuracy < 0.75) {
      performanceFactor = 1.3;
    } else {
      performanceFactor = 0.9;
    }
  }

  // Recency factor: how long ago was it studied?
  let recencyFactor = 1.0;
  if (subject.lastStudiedAt) {
    const daysSince = Math.floor(
      (new Date(todayStr).getTime() - new Date(subject.lastStudiedAt).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    if (daysSince >= 7) recencyFactor = 1.7;
    else if (daysSince >= 4) recencyFactor = 1.4;
    else if (daysSince <= 1) recencyFactor = 0.7; // studied recently, lower immediate priority for variety
  } else {
    recencyFactor = 1.5; // never studied yet
  }

  // Exam proximity boost
  let examProximityFactor = 1.0;
  if (examDate) {
    const daysToExam = Math.floor(
      (new Date(examDate).getTime() - new Date(todayStr).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    if (daysToExam > 0 && daysToExam <= 30) {
      // Under 30 days: heavily favor higher weight subjects
      examProximityFactor = 1 + (subject.weight / 5) * 0.8;
    } else if (daysToExam > 0 && daysToExam <= 60) {
      examProximityFactor = 1 + (subject.weight / 5) * 0.4;
    }
  }

  const priorityScore =
    weightFactor *
    difficultyFactor *
    knowledgeFactor *
    performanceFactor *
    recencyFactor *
    examProximityFactor;

  return Math.round(priorityScore * 10) / 10;
}

/**
 * Task objectives are kept empty by default unless explicitly entered by the user
 */
export function generateTaskObjectives(
  _type: TaskType,
  _topicName: string,
  _methodId?: StudyMethodId
): string[] {
  return [];
}

function selectTaskTypeByMethod(
  methodPreset: StudyMethodPreset,
  subject: Subject,
  slotOrderIndex: number
): TaskType {
  // Ajusta suavemente os pesos conforme nível de domínio quando não for método altamente direcionado
  let teoriaWeight = methodPreset.ratios.teoria;
  let exerciciosWeight = methodPreset.ratios.exercicios;
  const revisaoWeight = methodPreset.ratios.revisao;

  if (methodPreset.id !== 'estudo_reverso' && methodPreset.id !== 'feynman') {
    if (subject.knowledgeLevel === 'avancado') {
      const shift = Math.min(20, Math.floor(teoriaWeight / 2));
      teoriaWeight -= shift;
      exerciciosWeight += shift;
    } else if (subject.knowledgeLevel === 'iniciante') {
      const shift = Math.min(15, Math.floor(exerciciosWeight / 3));
      teoriaWeight += shift;
      exerciciosWeight -= shift;
    }
  }

  const total = Math.max(1, teoriaWeight + exerciciosWeight + revisaoWeight);
  // Passo determinístico distribuído (passo 37 mod 100 evita sequências idênticas repetitivas)
  const bucket = ((slotOrderIndex * 37 + subject.completedTasksCount * 29) % total);

  if (bucket < teoriaWeight) return 'teoria';
  if (bucket < teoriaWeight + exerciciosWeight) return 'exercicios';
  return 'revisao';
}

/**
 * Next topic selector for a subject: selects the first uncompleted topic,
 * or the one completed the longest time ago for cyclical review.
 */
export function selectNextTopicForSubject(subject: Subject): { id?: string; name: string } {
  if (!subject.topics || subject.topics.length === 0) {
    return { name: subject.pareiEm?.trim() || subject.name };
  }

  const uncompleted = subject.topics.find((t) => !t.completed);
  if (uncompleted) {
    return { id: uncompleted.id, name: uncompleted.name };
  }

  // All completed: pick the oldest completed
  const sorted = [...subject.topics].sort((a, b) => {
    const timeA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
    const timeB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
    return timeA - timeB;
  });

  return { id: sorted[0].id, name: `Aprofundamento: ${sorted[0].name}` };
}

/**
 * Core Smart Schedule Generator:
 * Generates tasks for the next N days (default 7-14 days).
 * Respects:
 * - Available days of the week (e.g. Mon, Wed, Fri)
 * - Daily available time (split into blocks matching preferredSessionLength)
 * - Spaced reviews due on that date
 * - Priority-based subject distribution with interleaved anti-fatigue balance
 */
export function generateSmartSchedule(
  profile: UserProfile,
  subjects: Subject[],
  existingReviews: SpacedReview[],
  existingTasks: Task[] = [],
  daysAhead: number = 7,
  fixedCommitments: FixedCommitment[] = []
): Task[] {
  if (subjects.length === 0) return [];

  const todayStr = getTodayStr();
  const today = new Date();

  // Keep tasks from the past or already completed today
  const preservedTasks = existingTasks.filter(
    (t) => t.date < todayStr || (t.date === todayStr && t.status === 'concluida')
  );

  // Identify any overdue pending tasks from yesterday or before to roll forward
  const overdueTasks = existingTasks.filter(
    (t) => t.date < todayStr && (t.status === 'pendente' || t.status === 'atrasada')
  );

  const newScheduleTasks: Task[] = [];
  const methodPreset = getStudyMethodPreset(profile.studyMethod);
  const sessionLength = Math.max(10, profile.preferredSessionLength || methodPreset.focusMinutes || 50);
  const minSlotMinutes = Math.min(25, sessionLength);
  const fallbackDailyTime = Math.max(sessionLength, profile.dailyAvailableMinutes || 120);

  // Sort subjects by initial priority score
  const prioritizedSubjects = subjects.map((sub) => ({
    subject: sub,
    priority: calculateSubjectPriority(sub, todayStr, profile.examDate),
  }));

  // Track subject frequencies to maintain healthy variety (anti-fatigue)
  const subjectStudyCount: Record<string, number> = {};
  subjects.forEach((s) => (subjectStudyCount[s.id] = 0));

  let lastSubjectIdUsed: string | null = null;
  let globalSlotCounter = 0;

  for (let i = 0; i < daysAhead; i++) {
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + i);
    const dateStr = formatDate(targetDate);
    const dayOfWeek = targetDate.getDay(); // 0 = Sun, 1 = Mon...

    // Check if user is available on this day
    const isAvailableDay = profile.availableDays.includes(dayOfWeek);
    if (!isAvailableDay) {
      continue;
    }

    const rawDayMinutes = profile.dailyMinutesByDay?.[dayOfWeek] ?? fallbackDailyTime;
    const blockedMinutes = calculateCommittedMinutesForDay(fixedCommitments, dayOfWeek);
    const netAwakeMinutes = Math.max(0, AWAKE_MINUTES_PER_DAY - blockedMinutes);
    const effectiveDayMinutes =
      blockedMinutes > 0 && netAwakeMinutes < rawDayMinutes
        ? Math.max(0, netAwakeMinutes)
        : rawDayMinutes;

    if (effectiveDayMinutes < minSlotMinutes) {
      continue;
    }

    const dailyTime = Math.max(sessionLength, effectiveDayMinutes);
    const slotsPerDay = Math.max(1, Math.floor(dailyTime / sessionLength));

    let remainingMinutesToday = dailyTime;
    let slotsAssigned = 0;

    // 1. First, check if there are spaced reviews scheduled for this exact date
    const reviewsForDate = existingReviews.filter(
      (r) => r.dueDate === dateStr && r.status === 'pendente'
    );

    for (const review of reviewsForDate) {
      if (slotsAssigned >= slotsPerDay) break;

      const matchedSub = subjects.find((s) => s.id === review.subjectId);
      const subColor = matchedSub ? matchedSub.color : review.subjectColor || 'bg-amber-500';
      const reviewDuration = Math.min(30, sessionLength);

      newScheduleTasks.push({
        id: `task-rev-${review.id}-${dateStr}`,
        subjectId: review.subjectId,
        subjectName: review.subjectName,
        subjectColor: subColor,
        topicName: review.topicName,
        type: 'revisao',
        durationMinutes: reviewDuration,
        date: dateStr,
        status: 'pendente',
        priorityScore: 99, // maximum priority for due spaced repetitions
        objectives: generateTaskObjectives('revisao', review.topicName, profile.studyMethod),
        isSpacedReview: true,
        reviewStep: review.step,
      });

      remainingMinutesToday -= reviewDuration;
      slotsAssigned++;
      lastSubjectIdUsed = review.subjectId;
      subjectStudyCount[review.subjectId] = (subjectStudyCount[review.subjectId] || 0) + 1;
    }

    // 2. If it's today and we have overdue tasks, roll the highest priority overdue forward
    if (i === 0 && overdueTasks.length > 0 && slotsAssigned < slotsPerDay) {
      for (const overdue of overdueTasks.slice(0, slotsPerDay - slotsAssigned)) {
        newScheduleTasks.push({
          ...overdue,
          id: `task-rolled-${overdue.id}-${dateStr}`,
          date: dateStr,
          status: 'pendente',
          priorityScore: overdue.priorityScore + 20, // boosted urgency
        });
        remainingMinutesToday -= overdue.durationMinutes;
        slotsAssigned++;
        lastSubjectIdUsed = overdue.subjectId;
      }
    }

    // 3. Fill remaining daily slots with priority-balanced regular study sessions
    const spreadPenalty = methodPreset.interleaveStrength === 'high' ? 3.5 : 2.5;
    const backToBackPenalty = methodPreset.interleaveStrength === 'high' ? 16 : 8;

    while (slotsAssigned < slotsPerDay && remainingMinutesToday >= minSlotMinutes) {
      // Re-rank subjects dynamically:
      // High initial priority + low recent allocation - penalty if just studied in previous slot
      const candidates = prioritizedSubjects
        .map((p) => {
          let dynamicScore = p.priority;
          const studyCount = subjectStudyCount[p.subject.id] || 0;
          dynamicScore -= studyCount * spreadPenalty;

          // Interleaving penalty: don't place same subject back-to-back unless user has only 1 subject
          if (subjects.length > 1 && p.subject.id === lastSubjectIdUsed) {
            dynamicScore -= backToBackPenalty;
          }

          return {
            subject: p.subject,
            score: dynamicScore,
          };
        })
        .sort((a, b) => b.score - a.score);

      const chosen = candidates[0].subject;
      const topicInfo = selectNextTopicForSubject(chosen);
      const taskType = selectTaskTypeByMethod(methodPreset, chosen, globalSlotCounter);
      const taskDuration = Math.min(sessionLength, remainingMinutesToday);

      newScheduleTasks.push({
        id: `task-gen-${chosen.id}-${dateStr}-${slotsAssigned}-${Math.random().toString(36).slice(2, 7)}`,
        subjectId: chosen.id,
        subjectName: chosen.name,
        subjectColor: chosen.color,
        topicId: topicInfo.id,
        topicName: topicInfo.name,
        type: taskType,
        durationMinutes: taskDuration,
        date: dateStr,
        status: 'pendente',
        priorityScore: Math.max(1, Math.round(candidates[0].score)),
        objectives: generateTaskObjectives(taskType, topicInfo.name, profile.studyMethod),
        pareiEm: chosen.pareiEm,
        cadernoQuestoes: chosen.cadernoQuestoes,
        revisaoNotes: chosen.revisaoNotes,
      });

      remainingMinutesToday -= taskDuration;
      slotsAssigned++;
      globalSlotCounter++;
      lastSubjectIdUsed = chosen.id;
      subjectStudyCount[chosen.id] = (subjectStudyCount[chosen.id] || 0) + 1;
    }
  }

  // Combine preserved and newly generated tasks
  // Deduplicate tasks by id just in case
  const taskMap = new Map<string, Task>();
  for (const t of [...preservedTasks, ...newScheduleTasks]) {
    taskMap.set(t.id, t);
  }
  return Array.from(taskMap.values());
}

/**
 * Calculates next Spaced Repetition dates according to the Ebbinghaus Curve:
 * Step 1: D+1 (Amanhã)
 * Step 2: D+7 (1 semana)
 * Step 3: D+15 (2 semanas)
 * Step 4: D+30 (1 mês)
 */
export function calculateNextSpacedReview(
  subject: Subject,
  topicName: string,
  currentStep: number = 0,
  studyDate: string = getTodayStr(),
  performanceRating?: 'facil' | 'medio' | 'dificil'
): SpacedReview {
  let nextStep = currentStep + 1;
  let intervalDays = 1;

  if (performanceRating === 'dificil') {
    // If student struggled, repeat review sooner
    intervalDays = 1;
    nextStep = Math.max(1, currentStep);
  } else if (performanceRating === 'facil') {
    // Accelerated spacing
    if (nextStep === 1) intervalDays = 2;
    else if (nextStep === 2) intervalDays = 10;
    else if (nextStep === 3) intervalDays = 21;
    else intervalDays = 45;
  } else {
    // Standard Leitner / Ebbinghaus intervals
    if (nextStep === 1) intervalDays = 1;
    else if (nextStep === 2) intervalDays = 7;
    else if (nextStep === 3) intervalDays = 15;
    else intervalDays = 30;
  }

  const dueDate = addDays(studyDate, intervalDays);

  return {
    id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    subjectId: subject.id,
    subjectName: subject.name,
    subjectColor: subject.color,
    topicName,
    step: nextStep,
    dueDate,
    status: 'pendente',
    lastStudiedDate: studyDate,
  };
}

/**
 * XP & Level progression calculations
 * Level formula: level = floor(sqrt(totalXP / 120)) + 1
 * Level 1: 0 XP
 * Level 2: 120 XP
 * Level 3: 480 XP
 * Level 4: 1080 XP
 * Level 5: 1920 XP
 */
export function getLevelForXP(xp: number): number {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 120)) + 1;
}

export function getXPRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.pow(level - 1, 2) * 120;
}

export function getLevelProgress(xp: number): {
  currentLevel: number;
  currentLevelXP: number;
  nextLevelXP: number;
  percent: number;
  title: string;
} {
  const currentLevel = getLevelForXP(xp);
  const currentLevelBaseXP = getXPRequiredForLevel(currentLevel);
  const nextLevelXP = getXPRequiredForLevel(currentLevel + 1);
  const xpInCurrentLevel = xp - currentLevelBaseXP;
  const xpNeeded = nextLevelXP - currentLevelBaseXP;
  const percent = Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / xpNeeded) * 100)));

  const rankTitles = [
    'Calouro Dedicado',
    'Aprendiz Constante',
    'Estudante Focado',
    'Estrategista de Estudos',
    'Dominador de Matérias',
    'Mente Disciplinada',
    'Polímata em Ascensão',
    'Mestre do Conhecimento',
    'Lenda Acadêmica',
  ];

  const title = rankTitles[Math.min(currentLevel - 1, rankTitles.length - 1)];

  return {
    currentLevel,
    currentLevelXP: xpInCurrentLevel,
    nextLevelXP: xpNeeded,
    percent,
    title,
  };
}
