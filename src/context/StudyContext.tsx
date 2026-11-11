import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  AppState,
  Subject,
  Task,
  UserProfile,
  StudySession,
} from '../types';
import {
  loadStoredState,
  saveStoredState,
  resetAppToOnboarding,
  STUDY_PRESETS,
  INITIAL_ACHIEVEMENTS,
} from '../services/storageService';
import {
  generateSmartSchedule,
  calculateNextSpacedReview,
  getLevelForXP,
  getTodayStr,
  addDays,
} from '../services/scheduleEngine';

interface CompleteSessionParams {
  taskId?: string;
  durationMinutes: number;
  exercisesDone: number;
  exercisesCorrect: number;
  notes: string;
  performanceRating?: 'facil' | 'medio' | 'dificil';
}

interface StudyContextValue {
  state: AppState;
  activeStudyTask: Task | null;
  isStudyModalOpen: boolean;
  openStudyModal: (task: Task) => void;
  closeStudyModal: () => void;
  startStudySession: (task: Task) => void;
  completeStudySession: (params: CompleteSessionParams) => { xpEarned: number; newLevel: boolean; newLevelNum: number };
  skipTask: (taskId: string) => void;
  recalculateSchedule: () => void;
  addSubject: (newSub: {
    name: string;
    color: string;
    weight: number;
    difficulty: 'baixa' | 'media' | 'alta';
    knowledgeLevel: 'iniciante' | 'intermediario' | 'avancado';
    topics: string[];
  }) => void;
  updateSubject: (updatedSub: Subject) => void;
  deleteSubject: (subjectId: string) => void;
  updateSubjectSpreadsheetField: (subjectId: string, field: 'pareiEm' | 'revisaoNotes' | 'cadernoQuestoes' | 'ciclo' | 'concluida' | 'weight', value: any) => void;
  advanceAllCycles: () => void;
  applyPreset: (presetId: string) => void;
  completeSpacedReview: (reviewId: string, rating: 'facil' | 'medio' | 'dificil') => void;
  completeOnboarding: (profile: Partial<UserProfile>, subjects: Subject[]) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  resetAllData: () => void;
  exportDataJSON: () => string;
  importDataJSON: (jsonStr: string) => boolean;
  triggerCelebration: () => void;
}

const StudyContext = createContext<StudyContextValue | null>(null);

export const StudyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => loadStoredState());
  const [activeStudyTask, setActiveStudyTask] = useState<Task | null>(null);
  const [isStudyModalOpen, setIsStudyModalOpen] = useState(false);

  // Sync with localStorage on state changes
  useEffect(() => {
    saveStoredState(state);
  }, [state]);

  const triggerCelebration = useCallback(() => {
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'],
      });
    } catch {
      // ignore in environments where canvas may not be available
    }
  }, []);

  const openStudyModal = useCallback((task: Task) => {
    setActiveStudyTask(task);
    setIsStudyModalOpen(true);
  }, []);

  const closeStudyModal = useCallback(() => {
    setIsStudyModalOpen(false);
    setActiveStudyTask(null);
  }, []);

  const startStudySession = useCallback((task: Task) => {
    // Mark task as in-progress if not yet completed
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === task.id ? { ...t, status: 'em_andamento' } : t)),
    }));
    openStudyModal(task);
  }, [openStudyModal]);

  const completeStudySession = useCallback((params: CompleteSessionParams) => {
    const todayStr = getTodayStr();
    let xpEarned = 50; // base reward
    // Bonus based on actual study duration (1 XP per minute)
    xpEarned += Math.max(10, Math.round(params.durationMinutes * 1.0));
    // Accuracy bonus: up to 35 XP if high accuracy
    if (params.exercisesDone > 0) {
      const accuracy = params.exercisesCorrect / params.exercisesDone;
      xpEarned += Math.round(accuracy * 35);
    }

    let newLevelReached = false;
    let finalLevel = 1;

    setState((prev) => {
      const oldXP = prev.profile.xp;
      const newXP = oldXP + xpEarned;
      const oldLevel = prev.profile.level;
      finalLevel = getLevelForXP(newXP);
      newLevelReached = finalLevel > oldLevel;

      // Streak check
      let newStreak = prev.profile.streakDays;
      if (prev.profile.lastActiveDate !== todayStr) {
        if (!prev.profile.lastActiveDate) {
          newStreak = 1;
        } else {
          const yesterdayStr = addDays(todayStr, -1);
          if (prev.profile.lastActiveDate === yesterdayStr) {
            newStreak += 1;
          } else {
            newStreak = 1;
          }
        }
      }

      // Update Task if taskId exists
      let targetSubjectId = activeStudyTask?.subjectId || prev.subjects[0]?.id || '';
      let targetTopicName = activeStudyTask?.topicName || 'Tópico de Estudo';
      let taskType = activeStudyTask?.type || 'teoria';

      const updatedTasks = prev.tasks.map((t) => {
        if (t.id === params.taskId || (activeStudyTask && t.id === activeStudyTask.id)) {
          targetSubjectId = t.subjectId;
          targetTopicName = t.topicName;
          taskType = t.type;
          return {
            ...t,
            status: 'concluida' as const,
            completedAt: new Date().toISOString(),
            actualDurationMinutes: params.durationMinutes,
            exercisesDone: params.exercisesDone,
            exercisesCorrect: params.exercisesCorrect,
            notes: params.notes,
          };
        }
        return t;
      });

      // Update Subject statistics
      const updatedSubjects = prev.subjects.map((sub) => {
        if (sub.id === targetSubjectId) {
          const updatedTopics = sub.topics.map((top) => {
            if (top.name.toLowerCase() === targetTopicName.toLowerCase()) {
              return {
                ...top,
                completed: true,
                completedAt: todayStr,
                exercisesCount: (top.exercisesCount || 0) + params.exercisesDone,
                exercisesCorrect: (top.exercisesCorrect || 0) + params.exercisesCorrect,
              };
            }
            return top;
          });

          return {
            ...sub,
            totalMinutesStudied: sub.totalMinutesStudied + params.durationMinutes,
            lastStudiedAt: todayStr,
            completedTasksCount: sub.completedTasksCount + 1,
            totalExercisesDone: sub.totalExercisesDone + params.exercisesDone,
            totalExercisesCorrect: sub.totalExercisesCorrect + params.exercisesCorrect,
            topics: updatedTopics,
          };
        }
        return sub;
      });

      // Spaced repetition creation
      const targetSub = updatedSubjects.find((s) => s.id === targetSubjectId);
      const newReview = targetSub
        ? calculateNextSpacedReview(
            targetSub,
            targetTopicName,
            activeStudyTask?.reviewStep || 0,
            todayStr,
            params.performanceRating
          )
        : null;

      const updatedReviews = newReview ? [...prev.reviews, newReview] : prev.reviews;

      // Create new StudySession record
      const newSession: StudySession = {
        id: `sess-${Date.now()}`,
        taskId: params.taskId || activeStudyTask?.id,
        subjectId: targetSubjectId,
        subjectName: targetSub?.name || 'Matéria',
        topicName: targetTopicName,
        type: taskType,
        durationMinutes: params.durationMinutes,
        date: todayStr,
        exercisesDone: params.exercisesDone,
        exercisesCorrect: params.exercisesCorrect,
        xpEarned,
        notes: params.notes,
      };

      // Daily goal update
      const updatedDailyGoal = {
        ...prev.dailyGoal,
        completedMinutes: prev.dailyGoal.completedMinutes + params.durationMinutes,
        completedTasks: prev.dailyGoal.completedTasks + 1,
      };

      // Achievements check
      const totalMinutesAll = updatedSubjects.reduce((acc, s) => acc + s.totalMinutesStudied, 0);
      const updatedAchievements = prev.achievements.map((ach) => {
        if (ach.unlocked) return ach;
        let progress = ach.progress;
        let unlocked = false;

        if (ach.id === 'first_step') {
          progress = 1;
          unlocked = true;
        } else if (ach.id === 'streak_3' && newStreak >= 3) {
          progress = 3;
          unlocked = true;
        } else if (ach.id === 'streak_7' && newStreak >= 7) {
          progress = 7;
          unlocked = true;
        } else if (ach.id === 'hours_5') {
          progress = totalMinutesAll;
          unlocked = totalMinutesAll >= 300;
        } else if (ach.id === 'hours_20') {
          progress = totalMinutesAll;
          unlocked = totalMinutesAll >= 1200;
        } else if (ach.id === 'perfect_session' && params.exercisesDone >= 5) {
          const acc = params.exercisesCorrect / params.exercisesDone;
          if (acc >= 0.85) {
            progress = 1;
            unlocked = true;
          }
        }

        return {
          ...ach,
          progress: Math.min(ach.maxProgress, progress),
          unlocked,
          unlockedAt: unlocked && !ach.unlocked ? todayStr : ach.unlockedAt,
        };
      });

      return {
        ...prev,
        profile: {
          ...prev.profile,
          xp: newXP,
          level: finalLevel,
          streakDays: newStreak,
          lastActiveDate: todayStr,
        },
        tasks: updatedTasks,
        subjects: updatedSubjects,
        reviews: updatedReviews,
        sessions: [newSession, ...prev.sessions],
        dailyGoal: updatedDailyGoal,
        achievements: updatedAchievements,
      };
    });

    triggerCelebration();
    closeStudyModal();

    return { xpEarned, newLevel: newLevelReached, newLevelNum: finalLevel };
  }, [activeStudyTask, closeStudyModal, triggerCelebration]);

  const skipTask = useCallback((taskId: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, status: 'pulada' as const } : t)),
    }));
  }, []);

  const recalculateSchedule = useCallback(() => {
    setState((prev) => {
      const regeneratedTasks = generateSmartSchedule(
        prev.profile,
        prev.subjects,
        prev.reviews,
        prev.tasks,
        7
      );
      return {
        ...prev,
        tasks: regeneratedTasks,
        lastScheduleGeneratedAt: new Date().toISOString(),
      };
    });
  }, []);

  const addSubject = useCallback((newSub: {
    name: string;
    color: string;
    weight: number;
    difficulty: 'baixa' | 'media' | 'alta';
    knowledgeLevel: 'iniciante' | 'intermediario' | 'avancado';
    topics: string[];
  }) => {
    setState((prev) => {
      const subId = `sub-${Date.now()}`;
      const createdSubject: Subject = {
        id: subId,
        name: newSub.name,
        color: newSub.color,
        weight: newSub.weight,
        difficulty: newSub.difficulty,
        knowledgeLevel: newSub.knowledgeLevel,
        topics: newSub.topics.map((tName, idx) => ({
          id: `top-${subId}-${idx + 1}`,
          name: tName,
          completed: false,
        })),
        totalMinutesStudied: 0,
        completedTasksCount: 0,
        totalExercisesDone: 0,
        totalExercisesCorrect: 0,
        ciclo: 0,
        revisaoNotes: '',
        cadernoQuestoes: '',
        pareiEm: '',
        concluida: false,
      };

      const updatedSubjects = [...prev.subjects, createdSubject];
      // Automatically re-generate schedule so the new subject is interleaved immediately
      const updatedTasks = generateSmartSchedule(
        prev.profile,
        updatedSubjects,
        prev.reviews,
        prev.tasks,
        7
      );

      return {
        ...prev,
        subjects: updatedSubjects,
        tasks: updatedTasks,
        lastScheduleGeneratedAt: new Date().toISOString(),
      };
    });
  }, []);

  const updateSubject = useCallback((updatedSub: Subject) => {
    setState((prev) => {
      const updatedSubjects = prev.subjects.map((s) => (s.id === updatedSub.id ? updatedSub : s));
      const updatedTasks = generateSmartSchedule(
        prev.profile,
        updatedSubjects,
        prev.reviews,
        prev.tasks,
        7
      );
      return {
        ...prev,
        subjects: updatedSubjects,
        tasks: updatedTasks,
      };
    });
  }, []);

  const updateSubjectSpreadsheetField = useCallback((subjectId: string, field: 'pareiEm' | 'revisaoNotes' | 'cadernoQuestoes' | 'ciclo' | 'concluida' | 'weight', value: any) => {
    setState((prev) => ({
      ...prev,
      subjects: prev.subjects.map((s) => (s.id === subjectId ? { ...s, [field]: value } : s)),
      tasks: prev.tasks.map((t) => (t.subjectId === subjectId && field === 'pareiEm' ? { ...t, pareiEm: value } : t)),
    }));
  }, []);

  const applyPreset = useCallback((presetId: string) => {
    // using STUDY_PRESETS imported
    const matched = STUDY_PRESETS.find((p: any) => p.id === presetId);
    if (!matched) return;

    setState((prev) => {
      const newSubjects: Subject[] = matched.subjects.map((s: any, idx: number) => ({
        id: `sub-${Date.now()}-${idx + 1}`,
        name: s.name,
        color: s.color,
        weight: s.weight,
        difficulty: s.difficulty,
        knowledgeLevel: s.knowledgeLevel,
        ciclo: 0,
        revisaoNotes: s.revisaoNotes || '',
        cadernoQuestoes: s.cadernoQuestoes || '',
        pareiEm: s.pareiEm || '',
        concluida: false,
        topics: s.topics.map((tName: string, tIdx: number) => ({
          id: `top-${idx + 1}-${tIdx + 1}`,
          name: tName,
          completed: false,
        })),
        totalMinutesStudied: 0,
        completedTasksCount: 0,
        totalExercisesDone: 0,
        totalExercisesCorrect: 0,
      }));

      const newTasks = generateSmartSchedule(prev.profile, newSubjects, [], [], 7);

      return {
        ...prev,
        subjects: newSubjects,
        tasks: newTasks,
        profile: {
          ...prev.profile,
          targetExam: matched.name,
        },
      };
    });
  }, []);

  const advanceAllCycles = useCallback(() => {
    setState((prev) => {
      const nextCiclo = (prev.profile.globalCiclo || 0) + 1;
      return {
        ...prev,
        profile: {
          ...prev.profile,
          globalCiclo: nextCiclo,
        },
        subjects: prev.subjects.map((s) => ({
          ...s,
          ciclo: (s.ciclo || 0) + 1,
        })),
      };
    });
  }, []);

  const deleteSubject = useCallback((subjectId: string) => {
    setState((prev) => {
      const filteredSubjects = prev.subjects.filter((s) => s.id !== subjectId);
      const filteredReviews = prev.reviews.filter((r) => r.subjectId !== subjectId);
      const filteredTasks = prev.tasks.filter((t) => t.subjectId !== subjectId);
      const updatedTasks = generateSmartSchedule(
        prev.profile,
        filteredSubjects,
        filteredReviews,
        filteredTasks,
        7
      );
      return {
        ...prev,
        subjects: filteredSubjects,
        reviews: filteredReviews,
        tasks: updatedTasks,
      };
    });
  }, []);

  const completeSpacedReview = useCallback((reviewId: string, rating: 'facil' | 'medio' | 'dificil') => {
    const todayStr = getTodayStr();
    setState((prev) => {
      const targetReview = prev.reviews.find((r) => r.id === reviewId);
      if (!targetReview) return prev;

      const sub = prev.subjects.find((s) => s.id === targetReview.subjectId);
      const nextReview = sub
        ? calculateNextSpacedReview(sub, targetReview.topicName, targetReview.step, todayStr, rating)
        : null;

      const updatedReviews = prev.reviews.map((r) =>
        r.id === reviewId ? { ...r, status: 'concluida' as const } : r
      );

      if (nextReview) {
        updatedReviews.push(nextReview);
      }

      // Award XP for spaced review (+40 XP)
      const newXP = prev.profile.xp + 40;
      const newLevel = getLevelForXP(newXP);

      return {
        ...prev,
        reviews: updatedReviews,
        profile: {
          ...prev.profile,
          xp: newXP,
          level: newLevel,
        },
      };
    });
    triggerCelebration();
  }, [triggerCelebration]);

  const completeOnboarding = useCallback((profileData: Partial<UserProfile>, subjects: Subject[]) => {
    const todayStr = getTodayStr();
    const finalProfile: UserProfile = {
      name: profileData.name || 'Estudante',
      objective: profileData.objective || 'Aprovação',
      targetExam: profileData.targetExam || '',
      examDate: profileData.examDate,
      profileType: profileData.profileType || 'iniciante',
      dailyAvailableMinutes: profileData.dailyAvailableMinutes || 120,
      availableDays: profileData.availableDays || [1, 2, 3, 4, 5],
      preferredSessionLength: profileData.preferredSessionLength || 50,
      xp: 100, // Welcome bonus
      level: 1,
      streakDays: 1,
      lastActiveDate: todayStr,
      freezeStreakCount: 1,
      onboardingCompleted: true,
      createdAt: todayStr,
    };

    const initialTasks = generateSmartSchedule(finalProfile, subjects, [], [], 7);

    setState({
      profile: finalProfile,
      subjects,
      tasks: initialTasks,
      reviews: [],
      sessions: [],
      achievements: INITIAL_ACHIEVEMENTS,
      dailyGoal: {
        targetMinutes: finalProfile.dailyAvailableMinutes,
        targetTasks: Math.max(1, Math.floor(finalProfile.dailyAvailableMinutes / finalProfile.preferredSessionLength)),
        completedMinutes: 0,
        completedTasks: 0,
      },
      lastScheduleGeneratedAt: new Date().toISOString(),
    });

    triggerCelebration();
  }, [triggerCelebration]);

  const updateProfile = useCallback((profileChanges: Partial<UserProfile>) => {
    setState((prev) => {
      const updatedProfile = { ...prev.profile, ...profileChanges };
      const updatedTasks = generateSmartSchedule(
        updatedProfile,
        prev.subjects,
        prev.reviews,
        prev.tasks,
        7
      );
      return {
        ...prev,
        profile: updatedProfile,
        tasks: updatedTasks,
      };
    });
  }, []);

  const resetAllData = useCallback(() => {
    const emptyState = resetAppToOnboarding();
    setState(emptyState);
  }, []);

  const exportDataJSON = useCallback(() => {
    return JSON.stringify(state, null, 2);
  }, [state]);

  const importDataJSON = useCallback((jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr) as AppState;
      if (parsed.profile && parsed.subjects && parsed.tasks) {
        setState(parsed);
        saveStoredState(parsed);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  return (
    <StudyContext.Provider
      value={{
        state,
        activeStudyTask,
        isStudyModalOpen,
        openStudyModal,
        closeStudyModal,
        startStudySession,
        completeStudySession,
        skipTask,
        recalculateSchedule,
        addSubject,
        updateSubject,
        deleteSubject,
        updateSubjectSpreadsheetField,
        advanceAllCycles,
        applyPreset,
        completeSpacedReview,
        completeOnboarding,
        updateProfile,
        resetAllData,
        exportDataJSON,
        importDataJSON,
        triggerCelebration,
      }}
    >
      {children}
    </StudyContext.Provider>
  );
};

export function useStudy(): StudyContextValue {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error('useStudy must be used within a StudyProvider');
  }
  return context;
}
