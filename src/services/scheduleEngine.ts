import {
  Subject,
  Task,
  UserProfile,
  SpacedReview,
  TaskType,
  StudySession,
} from '../types';

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
 * Standard objectives for each task type to guide the student clearly
 */
export function generateTaskObjectives(type: TaskType, topicName: string): string[] {
  switch (type) {
    case 'teoria':
      return [
        `Compreender conceitos essenciais de ${topicName}`,
        'Elaborar resumo esquemático ou mapa mental com pontos-chave',
        'Identificar pegadinhas e regras principais',
      ];
    case 'exercicios':
      return [
        `Resolver bateria de 10 a 15 questões práticas sobre ${topicName}`,
        'Cronometrar tempo médio por questão',
        'Revisar gabarito comentado e catalogar dúvidas',
      ];
    case 'revisao':
      return [
        `Revisão Ativa: auto-explicação dos tópicos de ${topicName}`,
        'Revisar erros de questões anteriores',
        'Reforçar fórmulas, prazos ou definições críticas',
      ];
    case 'simulado':
      return [
        `Simulado focado com questões cronometradas`,
        'Avaliar índice de acerto por subtema',
        'Mapear pontos de fraqueza para ajuste imediato',
      ];
  }
}

/**
 * Next topic selector for a subject: selects the first uncompleted topic,
 * or the one completed the longest time ago for cyclical review.
 */
export function selectNextTopicForSubject(subject: Subject): { id?: string; name: string } {
  if (!subject.topics || subject.topics.length === 0) {
    return { name: `Fundamentos de ${subject.name}` };
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
  daysAhead: number = 7
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
  const sessionLength = Math.max(25, profile.preferredSessionLength || 50);
  const dailyTime = Math.max(sessionLength, profile.dailyAvailableMinutes || 120);
  const slotsPerDay = Math.max(1, Math.floor(dailyTime / sessionLength));

  // Sort subjects by initial priority score
  const prioritizedSubjects = subjects.map((sub) => ({
    subject: sub,
    priority: calculateSubjectPriority(sub, todayStr, profile.examDate),
  }));

  // Track subject frequencies to maintain healthy variety (anti-fatigue)
  const subjectStudyCount: Record<string, number> = {};
  subjects.forEach((s) => (subjectStudyCount[s.id] = 0));

  let lastSubjectIdUsed: string | null = null;

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

      newScheduleTasks.push({
        id: `task-rev-${review.id}-${dateStr}`,
        subjectId: review.subjectId,
        subjectName: review.subjectName,
        subjectColor: subColor,
        topicName: review.topicName,
        type: 'revisao',
        durationMinutes: Math.min(30, sessionLength),
        date: dateStr,
        status: 'pendente',
        priorityScore: 99, // maximum priority for due spaced repetitions
        objectives: generateTaskObjectives('revisao', review.topicName),
        isSpacedReview: true,
        reviewStep: review.step,
      });

      remainingMinutesToday -= Math.min(30, sessionLength);
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
    while (slotsAssigned < slotsPerDay && remainingMinutesToday >= 25) {
      // Re-rank subjects dynamically:
      // High initial priority + low recent allocation - penalty if just studied in previous slot
      const candidates = prioritizedSubjects
        .map((p) => {
          let dynamicScore = p.priority;
          const studyCount = subjectStudyCount[p.subject.id] || 0;
          dynamicScore -= studyCount * 2.5; // balance spread

          // Interleaving penalty: don't place same subject back-to-back unless user has only 1 subject
          if (subjects.length > 1 && p.subject.id === lastSubjectIdUsed) {
            dynamicScore -= 8;
          }

          return {
            subject: p.subject,
            score: dynamicScore,
          };
        })
        .sort((a, b) => b.score - a.score);

      const chosen = candidates[0].subject;
      const topicInfo = selectNextTopicForSubject(chosen);

      // Decide type: beginner/high difficulty gets more theory + exercises, advanced gets practice
      let taskType: TaskType = 'teoria';
      if (chosen.knowledgeLevel === 'avancado') {
        taskType = 'exercicios';
      } else if (chosen.completedTasksCount % 2 === 1) {
        taskType = 'exercicios';
      }

      const taskDuration = Math.min(sessionLength, remainingMinutesToday);

      newScheduleTasks.push({
        id: `task-gen-${chosen.id}-${dateStr}-${slotsAssigned}`,
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
        objectives: generateTaskObjectives(taskType, topicInfo.name),
      });

      remainingMinutesToday -= taskDuration;
      slotsAssigned++;
      lastSubjectIdUsed = chosen.id;
      subjectStudyCount[chosen.id] = (subjectStudyCount[chosen.id] || 0) + 1;
    }
  }

  // Combine preserved and newly generated tasks
  return [...preservedTasks, ...newScheduleTasks];
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
