import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  AppState,
  Subject,
  Task,
  SpacedReview,
  UserProfile,
  StudySession,
  QuestionLog,
  FixedCommitment,
  InAppNotification,
  UserAccount,
  CustomDailyGoalItem,
  ActiveTimerDraft,
} from '../types';
import {
  createDefaultState,
  loadStoredState,
  normalizeAppState,
  saveStoredState,
  resetAppToOnboarding,
  setActiveLocalGuestSession,
  rolloverDailyGoalIfNeeded,
  loadActiveTimerDraft,
  saveActiveTimerDraft,
  pruneSessions,
  pruneNotifications,
  STUDY_PRESETS,
} from '../services/storageService';
import {
  generateSmartSchedule,
  extendScheduleToHorizon,
  resolveScheduleHorizonDays,
  resolveScheduleEndDate,
  calculateNextSpacedReview,
  getLevelForXP,
  getTodayStr,
  addDays,
  formatDate,
  selectNextTopicForSubject,
  calculateCommittedMinutesForDay,
} from '../services/scheduleEngine';
import {
  supabase,
  isSupabaseConfigured,
  fetchUserWorkspace,
  syncUserWorkspace,
  translateSupabaseError,
} from '../lib/supabase';

interface CompleteSessionParams {
  taskId?: string;
  durationMinutes: number;
  exercisesDone: number;
  exercisesCorrect: number;
  notes: string;
  performanceRating?: 'facil' | 'medio' | 'dificil';
}

export type CloudSyncStatus = 'local' | 'syncing' | 'synced' | 'error';

interface StudyContextValue {
  state: AppState;
  activeStudyTask: Task | null;
  activeTimerDraft: ActiveTimerDraft | null;
  isStudyModalOpen: boolean;
  authChecking: boolean;
  isSupabaseEnabled: boolean;
  cloudSyncStatus: CloudSyncStatus;
  openStudyModal: (task: Task) => void;
  closeStudyModal: () => void;
  startStudySession: (task: Task) => void;
  resumePausedTimer: () => void;
  saveTimerProgress: (draft: ActiveTimerDraft) => void;
  clearTimerDraft: (taskId?: string) => void;
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
  toggleSubjectTopic: (subjectId: string, topicId: string) => boolean;
  loadSuggestedTopicsForSubject: (subjectId: string, topicNames: string[]) => number;
  reorderSubjects: (fromIndex: number, toIndex: number) => void;
  deleteSubject: (subjectId: string) => void;
  updateSubjectSpreadsheetField: (
    subjectId: string,
    field: 'pareiEm' | 'revisaoNotes' | 'cadernoQuestoes' | 'ciclo' | 'concluida' | 'weight',
    value: any
  ) => void;
  advanceAllCycles: () => void;
  applyPreset: (presetId: string) => void;
  completeSpacedReview: (reviewId: string, rating: 'facil' | 'medio' | 'dificil') => void;
  completeOnboarding: (profile: Partial<UserProfile>, subjects: Subject[]) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  useStreakFreeze: () => { ok: boolean; message: string; remaining: number };
  resetAllData: () => void;
  exportDataJSON: () => string;
  importDataJSON: (jsonStr: string) => boolean;
  triggerCelebration: () => void;
  logQuestions: (payload: {
    subjectId: string;
    topicName?: string;
    totalQuestions: number;
    correctAnswers: number;
    date: string;
    sessionType: 'EXERCICIOS' | 'SIMULADO';
    notes?: string;
  }) => void;
  rescheduleBacklog: () => { rescheduledCount: number };
  saveFixedCommitments: (commitments: FixedCommitment[]) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearAllNotifications: () => void;
  updateDailyGoalTargets: (targets: {
    targetMinutes?: number;
    targetQuestions?: number;
    targetTasks?: number;
  }) => void;
  addCustomDailyGoal: (title: string, recurringDaily: boolean) => void;
  toggleCustomDailyGoal: (id: string) => void;
  updateCustomDailyGoalTitle: (id: string, title: string) => void;
  deleteCustomDailyGoal: (id: string) => void;
  resetTodayCustomChecklist: () => void;
  loginUser: (email: string, name?: string) => void;
  logoutUser: () => void;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithEmail: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ error?: string; needsEmailConfirmation?: boolean }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  continueOfflineMode: (name?: string) => void;
  signOutUser: () => Promise<void>;
}

const StudyContext = createContext<StudyContextValue | null>(null);

export const StudyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => loadStoredState());
  const [activeStudyTask, setActiveStudyTask] = useState<Task | null>(null);
  const [activeTimerDraft, setActiveTimerDraft] = useState<ActiveTimerDraft | null>(() => {
    const initial = loadStoredState();
    if (!initial.currentUser?.isLoggedIn) return null;
    return loadActiveTimerDraft(initial.currentUser.id);
  });
  const [isStudyModalOpen, setIsStudyModalOpen] = useState(false);
  const [authChecking, setAuthChecking] = useState<boolean>(isSupabaseConfigured);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>(
    isSupabaseConfigured ? 'synced' : 'local'
  );

  const activeUserIdRef = useRef<string | undefined>(state.currentUser?.id);
  activeUserIdRef.current = state.currentUser?.id;

  const hasHydratedCloudRef = useRef<boolean>(false);
  const hydratedUserIdRef = useRef<string | null>(null);
  const lastSyncedSignatureRef = useRef<string | null>(null);
  const syncTimeoutRef = useRef<number | null>(null);

  // Sync persisted active timer draft whenever user logs in, switches account, or logs out
  useEffect(() => {
    if (!state.currentUser?.isLoggedIn || !state.currentUser.id) {
      setActiveTimerDraft(null);
      return;
    }
    setActiveTimerDraft(loadActiveTimerDraft(state.currentUser.id));
  }, [state.currentUser?.isLoggedIn, state.currentUser?.id]);

  const buildSyncSignature = useCallback((appState: AppState): string => {
    return JSON.stringify({
      profile: appState.profile,
      subjects: appState.subjects,
      tasks: appState.tasks,
      reviews: appState.reviews,
      sessions: appState.sessions,
      achievements: appState.achievements,
      dailyGoal: appState.dailyGoal,
      questionLogs: appState.questionLogs || [],
      fixedCommitments: appState.fixedCommitments || [],
      notifications: appState.notifications || [],
      lastScheduleGeneratedAt: appState.lastScheduleGeneratedAt || null,
    });
  }, []);

  const hydrateFromSupabaseUser = useCallback(
    async (user: { id: string; email?: string; user_metadata?: Record<string, any> }) => {
      if (hydratedUserIdRef.current === user.id && hasHydratedCloudRef.current) {
        return;
      }

      const displayName =
        (user.user_metadata?.name as string) ||
        (user.user_metadata?.full_name as string) ||
        user.email?.split('@')[0] ||
        'Estudante';

      const userAccount: UserAccount = {
        id: user.id,
        name: displayName,
        email: user.email || '',
        isLoggedIn: true,
        role: 'Conta Pessoal',
      };

      hasHydratedCloudRef.current = false;

      try {
        const cloud = await fetchUserWorkspace(user.id);
        const localFallback = loadStoredState(user.id);

        if (cloud?.workspaceRow) {
          const w = cloud.workspaceRow;
          const p = cloud.profileRow;
          const hydrated = normalizeAppState(
            {
              profile: {
                ...(w.profile_settings || {}),
                name: (w.profile_settings?.name as string) || p?.name || displayName,
                email: user.email || p?.email || '',
                presetChosen: p?.preset_chosen ?? Boolean(w.profile_settings?.presetChosen),
                onboardingCompleted:
                  p?.onboarding_completed ?? Boolean(w.profile_settings?.onboardingCompleted),
              },
              subjects: w.subjects || [],
              tasks: w.tasks || [],
              reviews: w.reviews || [],
              sessions: w.sessions || [],
              achievements: w.achievements || [],
              dailyGoal: w.daily_goal as AppState['dailyGoal'],
              questionLogs: w.question_logs || [],
              fixedCommitments: w.fixed_commitments || [],
              notifications: w.notifications || [],
              lastScheduleGeneratedAt: w.last_schedule_generated_at || undefined,
            },
            userAccount
          );
          lastSyncedSignatureRef.current = buildSyncSignature(hydrated);
          setState(hydrated);
          saveStoredState(hydrated, user.id);
        } else if (localFallback.subjects.length > 0 || localFallback.profile.presetChosen) {
          const mergedLocal: AppState = {
            ...localFallback,
            currentUser: userAccount,
            profile: {
              ...localFallback.profile,
              name: localFallback.profile.name || displayName,
              email: user.email || localFallback.profile.email || '',
            },
          };
          setState(mergedLocal);
          await syncUserWorkspace(user.id, mergedLocal);
          lastSyncedSignatureRef.current = buildSyncSignature(mergedLocal);
        } else {
          const cleanZeroed = createDefaultState(userAccount);
          lastSyncedSignatureRef.current = buildSyncSignature(cleanZeroed);
          setState(cleanZeroed);
          saveStoredState(cleanZeroed, user.id);
        }

        hydratedUserIdRef.current = user.id;
        setCloudSyncStatus('synced');
      } catch (err) {
        console.warn('Erro ao buscar workspace na nuvem, usando cache local do usuário', err);
        const localCache = loadStoredState(user.id);
        const fallbackState =
          localCache.currentUser?.id === user.id
            ? { ...localCache, currentUser: userAccount }
            : createDefaultState(userAccount);
        lastSyncedSignatureRef.current = buildSyncSignature(fallbackState);
        hydratedUserIdRef.current = user.id;
        setState(fallbackState);
        setCloudSyncStatus('error');
      } finally {
        hasHydratedCloudRef.current = true;
      }
    },
    [buildSyncSignature]
  );

  // Monitor Supabase Auth state
  useEffect(() => {
    if (!supabase) {
      setAuthChecking(false);
      return;
    }

    let isMounted = true;

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!isMounted) return;
        if (data.session?.user) {
          setActiveLocalGuestSession(false);
          await hydrateFromSupabaseUser(data.session.user);
        } else {
          hasHydratedCloudRef.current = false;
          hydratedUserIdRef.current = null;
        }
      })
      .finally(() => {
        if (isMounted) setAuthChecking(false);
      });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      if (event === 'SIGNED_IN' && session?.user) {
        setActiveLocalGuestSession(false);
        await hydrateFromSupabaseUser(session.user);
        setAuthChecking(false);
      } else if (event === 'SIGNED_OUT') {
        hasHydratedCloudRef.current = false;
        hydratedUserIdRef.current = null;
        lastSyncedSignatureRef.current = null;
        setActiveLocalGuestSession(false);
        setState(createDefaultState());
        setAuthChecking(false);
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [hydrateFromSupabaseUser]);

  // Automatic daily rollover across midnight or when returning to an open tab on a new day
  useEffect(() => {
    const checkDayRollover = () => {
      const todayStr = getTodayStr();
      setState((prev) => {
        if (prev.dailyGoal?.lastResetDate === todayStr) {
          return prev;
        }
        return {
          ...prev,
          dailyGoal: rolloverDailyGoalIfNeeded(
            prev.dailyGoal,
            todayStr,
            prev.sessions,
            prev.tasks,
            prev.dailyGoal?.targetMinutes || prev.profile.dailyAvailableMinutes || 120,
            prev.dailyGoal?.targetTasks || 2
          ),
        };
      });
    };

    checkDayRollover();
    const intervalId = window.setInterval(checkDayRollover, 60 * 1000);
    window.addEventListener('focus', checkDayRollover);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', checkDayRollover);
    };
  }, []);

  // Automatically extend schedule forward up to chosen examDate / target horizon if needed
  useEffect(() => {
    if (!state.profile.onboardingCompleted || state.subjects.length === 0) return;
    const todayStr = getTodayStr();
    const horizon = resolveScheduleEndDate(state.profile, todayStr);
    const futureTasks = state.tasks.filter((t) => t.date >= todayStr);
    const latestFutureDate = futureTasks.reduce(
      (max, t) => (t.date > max ? t.date : max),
      todayStr
    );

    if (futureTasks.length === 0 || latestFutureDate < addDays(horizon.generatedEndDate, -2)) {
      setState((prev) => {
        if (!prev.profile.onboardingCompleted || prev.subjects.length === 0) return prev;
        const extended = extendScheduleToHorizon(
          prev.profile,
          prev.subjects,
          prev.reviews,
          prev.tasks,
          prev.fixedCommitments || []
        );
        if (extended.length === prev.tasks.length) return prev;
        return {
          ...prev,
          tasks: extended,
          lastScheduleGeneratedAt: new Date().toISOString(),
        };
      });
    }
  }, [
    state.profile.onboardingCompleted,
    state.profile.examDate,
    state.profile.targetTotalHours,
    state.subjects.length,
    state.tasks,
    state.profile,
  ]);

  // Persist locally (user-scoped) and debounced diff-checked sync to cloud
  useEffect(() => {
    if (state.currentUser?.isLoggedIn && state.currentUser.id) {
      saveStoredState(state, state.currentUser.id);
    }

    if (
      !supabase ||
      !state.currentUser?.isLoggedIn ||
      !state.currentUser.id ||
      state.currentUser.id === 'local-guest' ||
      !hasHydratedCloudRef.current
    ) {
      return;
    }

    const currentSignature = buildSyncSignature(state);
    if (currentSignature === lastSyncedSignatureRef.current) {
      return;
    }

    const userId = state.currentUser.id;
    setCloudSyncStatus('syncing');

    if (syncTimeoutRef.current) {
      window.clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = window.setTimeout(async () => {
      try {
        await syncUserWorkspace(userId, state);
        lastSyncedSignatureRef.current = currentSignature;
        setCloudSyncStatus('synced');
      } catch (err) {
        console.warn('Falha ao sincronizar workspace na nuvem:', err);
        setCloudSyncStatus('error');
      }
    }, 2500);

    return () => {
      if (syncTimeoutRef.current) {
        window.clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [state, buildSyncSignature]);

  const triggerCelebration = useCallback(() => {
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'],
      });
    } catch {
      // ignore in headless environments
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

  const saveTimerProgress = useCallback((draft: ActiveTimerDraft) => {
    saveActiveTimerDraft(draft, activeUserIdRef.current);
    setActiveTimerDraft(draft);
  }, []);

  const clearTimerDraft = useCallback((taskId?: string) => {
    const existingDraft = loadActiveTimerDraft(activeUserIdRef.current);
    if (!taskId || (existingDraft && existingDraft.task.id === taskId)) {
      saveActiveTimerDraft(null, activeUserIdRef.current);
      setActiveTimerDraft(null);
    }
    if (taskId) {
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId && t.status === 'em_andamento' ? { ...t, status: 'pendente' } : t
        ),
      }));
    }
  }, []);

  const startStudySession = useCallback(
    (task: Task) => {
      const currentDraft = loadActiveTimerDraft(activeUserIdRef.current);
      if (currentDraft && currentDraft.task.id === task.id) {
        setState((prev) => ({
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === task.id && t.status === 'pendente' ? { ...t, status: 'em_andamento' } : t
          ),
        }));
        openStudyModal(currentDraft.task);
        return;
      }

      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === task.id ? { ...t, status: 'em_andamento' } : t)),
      }));
      openStudyModal(task);
    },
    [openStudyModal]
  );

  const resumePausedTimer = useCallback(() => {
    const draft = activeTimerDraft || loadActiveTimerDraft(activeUserIdRef.current);
    if (!draft) return;
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === draft.task.id && t.status === 'pendente' ? { ...t, status: 'em_andamento' } : t
      ),
    }));
    openStudyModal(draft.task);
  }, [activeTimerDraft, openStudyModal]);

  const completeStudySession = useCallback(
    (params: CompleteSessionParams) => {
      const todayStr = getTodayStr();
      let xpEarned = 50;
      xpEarned += Math.max(10, Math.round(params.durationMinutes * 1.0));
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

        const rolledDailyGoal = rolloverDailyGoalIfNeeded(
          prev.dailyGoal,
          todayStr,
          prev.sessions,
          updatedTasks
        );

        const updatedDailyGoal = {
          ...rolledDailyGoal,
          completedMinutes: rolledDailyGoal.completedMinutes + params.durationMinutes,
          completedTasks: rolledDailyGoal.completedTasks + 1,
          lastResetDate: todayStr,
        };

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
          sessions: pruneSessions([newSession, ...prev.sessions], todayStr),
          dailyGoal: updatedDailyGoal,
          achievements: updatedAchievements,
        };
      });

      saveActiveTimerDraft(null, activeUserIdRef.current);
      setActiveTimerDraft(null);
      triggerCelebration();
      closeStudyModal();

      return { xpEarned, newLevel: newLevelReached, newLevelNum: finalLevel };
    },
    [activeStudyTask, closeStudyModal, triggerCelebration]
  );

  const skipTask = useCallback((taskId: string) => {
    const existingDraft = loadActiveTimerDraft(activeUserIdRef.current);
    if (existingDraft && existingDraft.task.id === taskId) {
      saveActiveTimerDraft(null, activeUserIdRef.current);
      setActiveTimerDraft(null);
    }
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, status: 'pulada' as const } : t)),
    }));
  }, []);

  const mergeProtectedSchedule = useCallback(
    (
      profile: UserProfile,
      subjects: Subject[],
      reviews: SpacedReview[],
      currentTasks: Task[],
      fixedCommitments: FixedCommitment[]
    ): Task[] => {
      const activeDraftTaskId = loadActiveTimerDraft(activeUserIdRef.current)?.task.id;
      const todayStr = getTodayStr();
      const protectedTasks = currentTasks.filter(
        (t) =>
          t.status === 'concluida' ||
          t.status === 'pulada' ||
          t.status === 'em_andamento' ||
          (activeDraftTaskId && t.id === activeDraftTaskId)
      );
      const generated = generateSmartSchedule(
        profile,
        subjects,
        reviews,
        currentTasks,
        resolveScheduleHorizonDays(profile, todayStr),
        fixedCommitments
      );
      const taskMap = new Map<string, Task>();
      for (const t of generated) {
        taskMap.set(t.id, t);
      }
      for (const t of protectedTasks) {
        if (t.date >= todayStr || t.status === 'em_andamento' || (activeDraftTaskId && t.id === activeDraftTaskId)) {
          taskMap.set(t.id, t);
        }
      }
      return Array.from(taskMap.values());
    },
    []
  );

  const recalculateSchedule = useCallback(() => {
    setState((prev) => {
      const regeneratedTasks = mergeProtectedSchedule(
        prev.profile,
        prev.subjects,
        prev.reviews,
        prev.tasks,
        prev.fixedCommitments || []
      );
      return {
        ...prev,
        tasks: regeneratedTasks,
        lastScheduleGeneratedAt: new Date().toISOString(),
      };
    });
  }, [mergeProtectedSchedule]);

  const addSubject = useCallback(
    (newSub: {
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
        const updatedTasks = mergeProtectedSchedule(
          prev.profile,
          updatedSubjects,
          prev.reviews,
          prev.tasks,
          prev.fixedCommitments || []
        );

        return {
          ...prev,
          profile: {
            ...prev.profile,
            presetChosen: true,
            onboardingCompleted: true,
          },
          subjects: updatedSubjects,
          tasks: updatedTasks,
          lastScheduleGeneratedAt: new Date().toISOString(),
        };
      });
    },
    [mergeProtectedSchedule]
  );

  const updateSubject = useCallback(
    (updatedSub: Subject) => {
      setState((prev) => {
        const prevSub = prev.subjects.find((s) => s.id === updatedSub.id);
        const updatedSubjects = prev.subjects.map((s) => (s.id === updatedSub.id ? updatedSub : s));

        const nextTopic = selectNextTopicForSubject(updatedSub);
        const completedTopicNames = new Set(
          updatedSub.topics.filter((t) => t.completed).map((t) => t.name.toLowerCase())
        );

        const patchedTasks = prev.tasks.map((t) => {
          if (t.subjectId !== updatedSub.id) return t;
          const isPending = t.status === 'pendente' || t.status === 'atrasada';
          const topicCompleted =
            isPending && !t.isSpacedReview && completedTopicNames.has(t.topicName.toLowerCase());

          return {
            ...t,
            subjectName: updatedSub.name,
            subjectColor: updatedSub.color,
            pareiEm: updatedSub.pareiEm,
            ...(topicCompleted
              ? {
                  topicId: nextTopic.id,
                  topicName: nextTopic.name,
                }
              : {}),
          };
        });

        const patchedReviews = prev.reviews.map((r) =>
          r.subjectId === updatedSub.id
            ? { ...r, subjectName: updatedSub.name, subjectColor: updatedSub.color }
            : r
        );

        const schedulingFactorsChanged =
          !prevSub ||
          prevSub.weight !== updatedSub.weight ||
          prevSub.difficulty !== updatedSub.difficulty ||
          prevSub.knowledgeLevel !== updatedSub.knowledgeLevel ||
          prevSub.concluida !== updatedSub.concluida;

        const updatedTasks = schedulingFactorsChanged
          ? mergeProtectedSchedule(
              prev.profile,
              updatedSubjects,
              patchedReviews,
              patchedTasks,
              prev.fixedCommitments || []
            )
          : patchedTasks;

        return {
          ...prev,
          subjects: updatedSubjects,
          reviews: patchedReviews,
          tasks: updatedTasks,
        };
      });
    },
    [mergeProtectedSchedule]
  );

  const toggleSubjectTopic = useCallback((subjectId: string, topicId: string): boolean => {
    const todayStr = getTodayStr();
    const targetSub = state.subjects.find((s) => s.id === subjectId);
    const targetTopic = targetSub?.topics.find((t) => t.id === topicId);
    const nextCompleted = targetTopic ? !targetTopic.completed : true;

    setState((prev) => {
      let modifiedSub: Subject | null = null;
      let toggledTopicName = '';

      const updatedSubjects = prev.subjects.map((sub) => {
        if (sub.id !== subjectId) return sub;
        const updatedTopics = sub.topics.map((top) => {
          if (top.id !== topicId) return top;
          toggledTopicName = top.name;
          const willComplete = !top.completed;
          return {
            ...top,
            completed: willComplete,
            completedAt: willComplete ? todayStr : undefined,
          };
        });
        modifiedSub = { ...sub, topics: updatedTopics };
        return modifiedSub;
      });

      if (!modifiedSub) return prev;
      const nextTopic = selectNextTopicForSubject(modifiedSub);
      const updatedTasks = prev.tasks.map((t) => {
        if (
          t.subjectId === subjectId &&
          (t.status === 'pendente' || t.status === 'atrasada') &&
          !t.isSpacedReview &&
          nextCompleted &&
          (t.topicId === topicId || t.topicName.toLowerCase() === toggledTopicName.toLowerCase())
        ) {
          return {
            ...t,
            topicId: nextTopic.id,
            topicName: nextTopic.name,
          };
        }
        return t;
      });

      return {
        ...prev,
        subjects: updatedSubjects,
        tasks: updatedTasks,
      };
    });

    return nextCompleted;
  }, [state.subjects]);

  const loadSuggestedTopicsForSubject = useCallback(
    (subjectId: string, topicNames: string[]): number => {
      const cleanIncoming = topicNames.map((t) => t.trim()).filter(Boolean);
      if (cleanIncoming.length === 0) return 0;

      const existingSub = state.subjects.find((s) => s.id === subjectId);
      if (!existingSub) return 0;

      const existingSet = new Set(existingSub.topics.map((t) => t.name.toLowerCase()));
      const newNames = cleanIncoming.filter((name) => !existingSet.has(name.toLowerCase()));
      if (newNames.length === 0) return 0;

      setState((prev) => {
        const stamp = Date.now();
        let updatedSubjectRef: Subject | null = null;

        const updatedSubjects = prev.subjects.map((sub) => {
          if (sub.id !== subjectId) return sub;
          const existingLower = new Set(sub.topics.map((t) => t.name.toLowerCase()));
          const additions = cleanIncoming
            .filter((name) => !existingLower.has(name.toLowerCase()))
            .map((name, idx) => ({
              id: `top-${sub.id}-${stamp}-${idx + 1}`,
              name,
              completed: false,
            }));

          updatedSubjectRef = {
            ...sub,
            topics: [...sub.topics, ...additions],
          };
          return updatedSubjectRef;
        });

        const nextTopic = updatedSubjectRef ? selectNextTopicForSubject(updatedSubjectRef) : null;
        const updatedTasks = prev.tasks.map((t) => {
          if (
            nextTopic &&
            t.subjectId === subjectId &&
            (t.status === 'pendente' || t.status === 'atrasada') &&
            !t.isSpacedReview &&
            !t.topicId &&
            t.topicName.toLowerCase() === (updatedSubjectRef?.name || '').toLowerCase()
          ) {
            return {
              ...t,
              topicId: nextTopic.id,
              topicName: nextTopic.name,
            };
          }
          return t;
        });

        return {
          ...prev,
          subjects: updatedSubjects,
          tasks: updatedTasks,
        };
      });

      return newNames.length;
    },
    [state.subjects]
  );

  const reorderSubjects = useCallback((fromIndex: number, toIndex: number) => {
    setState((prev) => {
      const list = [...prev.subjects];
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= list.length ||
        toIndex >= list.length ||
        fromIndex === toIndex
      ) {
        return prev;
      }
      const [moved] = list.splice(fromIndex, 1);
      list.splice(toIndex, 0, moved);
      return {
        ...prev,
        subjects: list,
      };
    });
  }, []);

  const updateSubjectSpreadsheetField = useCallback(
    (
      subjectId: string,
      field: 'pareiEm' | 'revisaoNotes' | 'cadernoQuestoes' | 'ciclo' | 'concluida' | 'weight',
      value: any
    ) => {
      setState((prev) => ({
        ...prev,
        subjects: prev.subjects.map((s) => (s.id === subjectId ? { ...s, [field]: value } : s)),
        tasks: prev.tasks.map((t) =>
          t.subjectId === subjectId && field === 'pareiEm' ? { ...t, pareiEm: value } : t
        ),
      }));
    },
    []
  );

  const applyPreset = useCallback((presetId: string) => {
    const matched = STUDY_PRESETS.find((p) => p.id === presetId);
    if (!matched) return;

    setState((prev) => {
      const newSubjects: Subject[] = matched.subjects.map((s, idx) => ({
        id: `sub-${Date.now()}-${idx + 1}`,
        name: s.name,
        color: s.color,
        weight: s.weight,
        difficulty: s.difficulty,
        knowledgeLevel: s.knowledgeLevel,
        ciclo: 0,
        revisaoNotes: '',
        cadernoQuestoes: '',
        pareiEm: '',
        concluida: false,
        topics: s.topics.map((tName, tIdx) => ({
          id: `top-${idx + 1}-${tIdx + 1}`,
          name: tName,
          completed: false,
        })),
        totalMinutesStudied: 0,
        completedTasksCount: 0,
        totalExercisesDone: 0,
        totalExercisesCorrect: 0,
      }));

      const newTasks = generateSmartSchedule(
        prev.profile,
        newSubjects,
        [],
        [],
        resolveScheduleHorizonDays(prev.profile),
        prev.fixedCommitments || []
      );

      return {
        ...prev,
        subjects: newSubjects,
        tasks: newTasks,
        profile: {
          ...prev.profile,
          targetExam: matched.name,
          presetChosen: true,
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

  const deleteSubject = useCallback(
    (subjectId: string) => {
      const existingDraft = loadActiveTimerDraft(activeUserIdRef.current);
      if (existingDraft && existingDraft.task.subjectId === subjectId) {
        saveActiveTimerDraft(null, activeUserIdRef.current);
        setActiveTimerDraft(null);
      }
      setState((prev) => {
        const filteredSubjects = prev.subjects.filter((s) => s.id !== subjectId);
        const filteredReviews = prev.reviews.filter((r) => r.subjectId !== subjectId);
        const filteredTasks = prev.tasks.filter((t) => t.subjectId !== subjectId);
        const updatedTasks = mergeProtectedSchedule(
          prev.profile,
          filteredSubjects,
          filteredReviews,
          filteredTasks,
          prev.fixedCommitments || []
        );
        return {
          ...prev,
          subjects: filteredSubjects,
          reviews: filteredReviews,
          tasks: updatedTasks,
        };
      });
    },
    [mergeProtectedSchedule]
  );

  const completeSpacedReview = useCallback(
    (reviewId: string, rating: 'facil' | 'medio' | 'dificil') => {
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
    },
    [triggerCelebration]
  );

  const completeOnboarding = useCallback(
    (profileData: Partial<UserProfile>, subjects: Subject[]) => {
      const todayStr = getTodayStr();
      setState((prev) => {
        const todayDow = new Date().getDay();
        const preservedXP = prev.profile.xp || 0;
        const preservedStreak = prev.profile.streakDays || 0;

        const finalProfile: UserProfile = {
          name: profileData.name || prev.profile.name || prev.currentUser?.name || 'Estudante',
          email: profileData.email || prev.profile.email || prev.currentUser?.email,
          objective: profileData.objective || 'Aprovação',
          targetExam: profileData.targetExam || '',
          examDate: profileData.examDate,
          targetTotalHours: profileData.targetTotalHours,
          profileType: profileData.profileType || 'iniciante',
          dailyAvailableMinutes: profileData.dailyAvailableMinutes || 120,
          dailyMinutesByDay: profileData.dailyMinutesByDay ?? prev.profile.dailyMinutesByDay,
          availableDays: profileData.availableDays || [1, 2, 3, 4, 5],
          preferredSessionLength: profileData.preferredSessionLength || 50,
          preferredBreakLength: profileData.preferredBreakLength ?? 10,
          studyMethod: profileData.studyMethod || 'blocos_50_10',
          xp: preservedXP,
          level: getLevelForXP(preservedXP),
          streakDays: preservedStreak,
          lastActiveDate: prev.profile.lastActiveDate,
          freezeStreakCount: prev.profile.freezeStreakCount ?? 1,
          onboardingCompleted: true,
          presetChosen: true,
          weeklyLoad: profileData.weeklyLoad || prev.profile.weeklyLoad || 'leve',
          createdAt: prev.profile.createdAt || todayStr,
        };

        const todayTargetMinutes =
          finalProfile.dailyMinutesByDay?.[todayDow] ?? finalProfile.dailyAvailableMinutes;

        const initialTasks = generateSmartSchedule(
          finalProfile,
          subjects,
          prev.reviews,
          [],
          resolveScheduleHorizonDays(finalProfile, todayStr),
          prev.fixedCommitments || []
        );

        const rolledPrevGoal = rolloverDailyGoalIfNeeded(
          prev.dailyGoal,
          todayStr,
          prev.sessions,
          initialTasks,
          todayTargetMinutes,
          Math.max(1, Math.floor(todayTargetMinutes / finalProfile.preferredSessionLength))
        );

        return {
          ...prev,
          profile: finalProfile,
          subjects,
          tasks: initialTasks,
          dailyGoal: {
            ...rolledPrevGoal,
            targetMinutes: todayTargetMinutes,
            targetTasks: Math.max(1, Math.floor(todayTargetMinutes / finalProfile.preferredSessionLength)),
            lastResetDate: todayStr,
          },
          lastScheduleGeneratedAt: new Date().toISOString(),
        };
      });

      saveActiveTimerDraft(null, activeUserIdRef.current);
      setActiveTimerDraft(null);
      triggerCelebration();
    },
    [triggerCelebration]
  );

  const updateProfile = useCallback(
    (profileChanges: Partial<UserProfile>) => {
      setState((prev) => {
        const updatedProfile = { ...prev.profile, ...profileChanges };
        const todayDow = new Date().getDay();
        const todayTargetMinutes =
          updatedProfile.dailyMinutesByDay?.[todayDow] ?? updatedProfile.dailyAvailableMinutes;
        const updatedTasks = mergeProtectedSchedule(
          updatedProfile,
          prev.subjects,
          prev.reviews,
          prev.tasks,
          prev.fixedCommitments || []
        );
        return {
          ...prev,
          profile: updatedProfile,
          tasks: updatedTasks,
          dailyGoal: {
            ...prev.dailyGoal,
            targetMinutes: todayTargetMinutes,
            targetTasks: Math.max(1, Math.floor(todayTargetMinutes / updatedProfile.preferredSessionLength)),
          },
        };
      });
    },
    [mergeProtectedSchedule]
  );

  const resetAllData = useCallback(() => {
    setActiveTimerDraft(null);
    setIsStudyModalOpen(false);
    setActiveStudyTask(null);
    setState((prev) => resetAppToOnboarding(prev.currentUser));
  }, []);

  const exportDataJSON = useCallback(() => {
    return JSON.stringify(state, null, 2);
  }, [state]);

  const importDataJSON = useCallback((jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr) as AppState;
      if (parsed.profile && parsed.subjects && parsed.tasks) {
        setState((prev) => {
          const merged = normalizeAppState(parsed, prev.currentUser);
          saveStoredState(merged, prev.currentUser?.id);
          return merged;
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const logQuestions = useCallback(
    (payload: {
      subjectId: string;
      topicName?: string;
      totalQuestions: number;
      correctAnswers: number;
      date: string;
      sessionType: 'EXERCICIOS' | 'SIMULADO';
      notes?: string;
    }) => {
      setState((prev) => {
        const subject = prev.subjects.find((s) => s.id === payload.subjectId);
        const subjectName = subject ? subject.name : 'Geral';

        const newLog: QuestionLog = {
          id: `qlog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          subjectId: payload.subjectId,
          subjectName,
          topicName: payload.topicName,
          totalQuestions: payload.totalQuestions,
          correctAnswers: payload.correctAnswers,
          date: payload.date,
          sessionType: payload.sessionType,
          notes: payload.notes,
          createdAt: new Date().toISOString(),
        };

        const xpBonus = Math.round(payload.totalQuestions * 2 + payload.correctAnswers * 3);
        const newXP = prev.profile.xp + xpBonus;
        const newLevel = getLevelForXP(newXP);

        const updatedSubjects = prev.subjects.map((sub) => {
          if (sub.id === payload.subjectId) {
            const newDone = sub.totalExercisesDone + payload.totalQuestions;
            const newCorrect = sub.totalExercisesCorrect + payload.correctAnswers;
            const cadernoStr = sub.cadernoQuestoes
              ? `${sub.cadernoQuestoes} | +${payload.totalQuestions}q (${payload.correctAnswers}/${payload.totalQuestions})`
              : `${payload.totalQuestions}q (${payload.correctAnswers}/${payload.totalQuestions} acertos)`;
            return {
              ...sub,
              totalExercisesDone: newDone,
              totalExercisesCorrect: newCorrect,
              cadernoQuestoes: cadernoStr,
            };
          }
          return sub;
        });

        const newNotif: InAppNotification = {
          id: `notif-qlog-${Date.now()}`,
          title: 'Questões registradas! 🎯',
          message: `${payload.totalQuestions} questões de ${subjectName} adicionadas com sucesso (+${xpBonus} XP).`,
          date: payload.date,
          read: false,
          type: 'goal',
        };

        return {
          ...prev,
          subjects: updatedSubjects,
          questionLogs: [newLog, ...(prev.questionLogs || [])],
          notifications: pruneNotifications([newNotif, ...(prev.notifications || [])], getTodayStr()),
          profile: {
            ...prev.profile,
            xp: newXP,
            level: newLevel,
          },
        };
      });
      triggerCelebration();
    },
    [triggerCelebration]
  );

  const rescheduleBacklog = useCallback(() => {
    const todayStr = getTodayStr();
    const snapshotOverdue = state.tasks.filter(
      (t) => t.date < todayStr && t.status !== 'concluida' && t.status !== 'pulada'
    );
    const rescheduledCount = snapshotOverdue.length;

    setState((prev) => {
      const overdueTasks = prev.tasks
        .filter((t) => t.date < todayStr && t.status !== 'concluida' && t.status !== 'pulada')
        .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
      if (overdueTasks.length === 0) return prev;

      const availableDays =
        prev.profile.availableDays.length > 0 ? prev.profile.availableDays : [1, 2, 3, 4, 5];

      const nonOverdueTasks = prev.tasks.filter(
        (t) => !(t.date < todayStr && t.status !== 'concluida' && t.status !== 'pulada')
      );

      // Track already committed minutes & tasks per date from today onward
      const minutesUsedByDate: Record<string, number> = {};
      const taskCountByDate: Record<string, number> = {};
      for (const task of nonOverdueTasks) {
        if (task.date >= todayStr && task.status !== 'pulada') {
          minutesUsedByDate[task.date] = (minutesUsedByDate[task.date] || 0) + (task.durationMinutes || 0);
          taskCountByDate[task.date] = (taskCountByDate[task.date] || 0) + 1;
        }
      }

      const getDayCapacity = (dow: number): number => {
        const rawMinutes = prev.profile.dailyMinutesByDay?.[dow] ?? prev.profile.dailyAvailableMinutes ?? 120;
        const blocked = calculateCommittedMinutesForDay(prev.fixedCommitments || [], dow);
        const netAwake = Math.max(0, 16 * 60 - blocked);
        return blocked > 0 && netAwake < rawMinutes ? Math.max(0, netAwake) : Math.max(30, rawMinutes);
      };

      const movedTasks: Task[] = overdueTasks.map((task) => {
        const duration = Math.max(15, task.durationMinutes || 50);
        let chosenDate = todayStr;

        const maxOffset = Math.max(180, resolveScheduleHorizonDays(prev.profile, todayStr));
        for (let offset = 0; offset < maxOffset; offset++) {
          const d = new Date();
          d.setDate(d.getDate() + offset);
          const dow = d.getDay();
          if (!availableDays.includes(dow)) continue;

          const dateStr = formatDate(d);
          const cap = getDayCapacity(dow);
          const used = minutesUsedByDate[dateStr] || 0;
          const count = taskCountByDate[dateStr] || 0;
          const remaining = Math.max(0, cap - used);

          if (remaining >= duration || count === 0) {
            chosenDate = dateStr;
            minutesUsedByDate[dateStr] = used + duration;
            taskCountByDate[dateStr] = count + 1;
            break;
          }
        }

        return {
          ...task,
          date: chosenDate,
          status: 'pendente' as const,
        };
      });

      const newNotif: InAppNotification = {
        id: `notif-backlog-${Date.now()}`,
        title: 'Atrasos Reagendados ⚡',
        message: `${overdueTasks.length} tarefas pendentes foram redistribuídas respeitando seu limite diário.`,
        date: todayStr,
        read: false,
        type: 'backlog',
      };

      return {
        ...prev,
        tasks: [...nonOverdueTasks, ...movedTasks],
        notifications: pruneNotifications([newNotif, ...(prev.notifications || [])], todayStr),
      };
    });

    return { rescheduledCount };
  }, [state.tasks]);

  const useStreakFreeze = useCallback(() => {
    const todayStr = getTodayStr();
    const available = state.profile.freezeStreakCount ?? 0;

    if (available <= 0) {
      return {
        ok: false,
        message: 'Você não possui escudos de sequência disponíveis no momento.',
        remaining: 0,
      };
    }

    if ((state.profile.streakDays || 0) <= 0) {
      return {
        ok: false,
        message: 'Conclua 1 sessão para iniciar sua sequência antes de ativar o escudo.',
        remaining: available,
      };
    }

    if (state.profile.lastActiveDate === todayStr) {
      return {
        ok: false,
        message: 'Sua sequência de hoje já está garantida!',
        remaining: available,
      };
    }

    const nextRemaining = Math.max(0, available - 1);
    setState((prev) => {
      const currentFreeze = prev.profile.freezeStreakCount ?? 0;
      if (currentFreeze <= 0 || prev.profile.lastActiveDate === todayStr || (prev.profile.streakDays || 0) <= 0) {
        return prev;
      }
      const remainingAfter = Math.max(0, currentFreeze - 1);
      const freezeNotif: InAppNotification = {
        id: `notif-freeze-${Date.now()}`,
        title: 'Escudo de Sequência Ativado 🛡️',
        message: `Sua sequência de ${prev.profile.streakDays} dias foi protegida hoje. Restam ${remainingAfter} escudos.`,
        date: todayStr,
        read: false,
        type: 'streak',
      };
      return {
        ...prev,
        profile: {
          ...prev.profile,
          freezeStreakCount: remainingAfter,
          lastActiveDate: todayStr,
        },
        notifications: pruneNotifications([freezeNotif, ...(prev.notifications || [])], todayStr),
      };
    });

    return {
      ok: true,
      message: `Sequência de ${state.profile.streakDays} dias protegida hoje! Restam ${nextRemaining} escudos.`,
      remaining: nextRemaining,
    };
  }, [state.profile.freezeStreakCount, state.profile.lastActiveDate, state.profile.streakDays]);

  const saveFixedCommitments = useCallback((commitments: FixedCommitment[]) => {
    setState((prev) => ({
      ...prev,
      fixedCommitments: commitments,
    }));
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: (prev.notifications || []).map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setState((prev) => ({
      ...prev,
      notifications: (prev.notifications || []).map((n) => ({ ...n, read: true })),
    }));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setState((prev) => ({
      ...prev,
      notifications: [],
    }));
  }, []);

  const continueOfflineMode = useCallback((name?: string) => {
    setActiveLocalGuestSession(true);
    hasHydratedCloudRef.current = false;
    setCloudSyncStatus('local');
    const existing = loadStoredState('local-guest');
    const account: UserAccount = {
      id: 'local-guest',
      name: name?.trim() || existing.profile.name || 'Estudante',
      email: '',
      isLoggedIn: true,
      role: 'Modo Local',
    };
    const nextState: AppState = {
      ...existing,
      currentUser: account,
      profile: {
        ...existing.profile,
        name: name?.trim() || existing.profile.name || 'Estudante',
      },
    };
    saveStoredState(nextState, 'local-guest');
    setState(nextState);
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string): Promise<{ error?: string }> => {
      if (!supabase) {
        return { error: 'Serviço de login temporariamente indisponível. Tente novamente em instantes.' };
      }
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        return { error: translateSupabaseError(error.message) };
      }
      if (data.user) {
        await hydrateFromSupabaseUser(data.user);
      }
      return {};
    },
    [hydrateFromSupabaseUser]
  );

  const signUpWithEmail = useCallback(
    async (
      email: string,
      password: string,
      name: string
    ): Promise<{ error?: string; needsEmailConfirmation?: boolean }> => {
      if (!supabase) {
        return { error: 'Serviço de cadastro temporariamente indisponível. Tente novamente em instantes.' };
      }
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { name: name.trim() },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) {
        return { error: translateSupabaseError(error.message) };
      }
      if (data.user && data.session) {
        await hydrateFromSupabaseUser(data.user);
        return {};
      }
      return { needsEmailConfirmation: true };
    },
    [hydrateFromSupabaseUser]
  );

  const signInWithGoogle = useCallback(async (): Promise<{ error?: string }> => {
    if (!supabase) {
      return { error: 'Serviço de login temporariamente indisponível.' };
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      return { error: translateSupabaseError(error.message) };
    }
    return {};
  }, []);

  const signOutUser = useCallback(async () => {
    hasHydratedCloudRef.current = false;
    setActiveLocalGuestSession(false);
    setActiveTimerDraft(null);
    setIsStudyModalOpen(false);
    setActiveStudyTask(null);
    if (supabase) {
      await supabase.auth.signOut();
    }
    setState(createDefaultState());
  }, []);

  const updateDailyGoalTargets = useCallback(
    (targets: { targetMinutes?: number; targetQuestions?: number; targetTasks?: number }) => {
      const todayStr = getTodayStr();
      setState((prev) => {
        const current = rolloverDailyGoalIfNeeded(
          prev.dailyGoal,
          todayStr,
          prev.sessions,
          prev.tasks
        );
        return {
          ...prev,
          dailyGoal: {
            ...current,
            targetMinutes:
              typeof targets.targetMinutes === 'number'
                ? Math.min(960, Math.max(15, Math.round(targets.targetMinutes)))
                : current.targetMinutes,
            targetQuestions:
              typeof targets.targetQuestions === 'number'
                ? Math.min(500, Math.max(1, Math.round(targets.targetQuestions)))
                : current.targetQuestions ?? 30,
            targetTasks:
              typeof targets.targetTasks === 'number'
                ? Math.min(30, Math.max(1, Math.round(targets.targetTasks)))
                : current.targetTasks,
            lastResetDate: todayStr,
          },
        };
      });
    },
    []
  );

  const addCustomDailyGoal = useCallback((title: string, recurringDaily: boolean) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const todayStr = getTodayStr();
    const newItem: CustomDailyGoalItem = {
      id: `dgoal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: trimmed,
      completed: false,
      recurringDaily,
      createdDate: todayStr,
    };

    setState((prev) => {
      const current = rolloverDailyGoalIfNeeded(
        prev.dailyGoal,
        todayStr,
        prev.sessions,
        prev.tasks
      );
      return {
        ...prev,
        dailyGoal: {
          ...current,
          customGoals: [newItem, ...(current.customGoals || [])],
          lastResetDate: todayStr,
        },
      };
    });
  }, []);

  const toggleCustomDailyGoal = useCallback((id: string) => {
    const todayStr = getTodayStr();
    setState((prev) => {
      const current = rolloverDailyGoalIfNeeded(
        prev.dailyGoal,
        todayStr,
        prev.sessions,
        prev.tasks
      );
      return {
        ...prev,
        dailyGoal: {
          ...current,
          customGoals: (current.customGoals || []).map((item) =>
            item.id === id ? { ...item, completed: !item.completed } : item
          ),
          lastResetDate: todayStr,
        },
      };
    });
  }, []);

  const updateCustomDailyGoalTitle = useCallback((id: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const todayStr = getTodayStr();
    setState((prev) => {
      const current = rolloverDailyGoalIfNeeded(
        prev.dailyGoal,
        todayStr,
        prev.sessions,
        prev.tasks
      );
      return {
        ...prev,
        dailyGoal: {
          ...current,
          customGoals: (current.customGoals || []).map((item) =>
            item.id === id ? { ...item, title: trimmed } : item
          ),
          lastResetDate: todayStr,
        },
      };
    });
  }, []);

  const deleteCustomDailyGoal = useCallback((id: string) => {
    const todayStr = getTodayStr();
    setState((prev) => {
      const current = rolloverDailyGoalIfNeeded(
        prev.dailyGoal,
        todayStr,
        prev.sessions,
        prev.tasks
      );
      return {
        ...prev,
        dailyGoal: {
          ...current,
          customGoals: (current.customGoals || []).filter((item) => item.id !== id),
          lastResetDate: todayStr,
        },
      };
    });
  }, []);

  const resetTodayCustomChecklist = useCallback(() => {
    const todayStr = getTodayStr();
    setState((prev) => {
      const current = rolloverDailyGoalIfNeeded(
        prev.dailyGoal,
        todayStr,
        prev.sessions,
        prev.tasks
      );
      return {
        ...prev,
        dailyGoal: {
          ...current,
          customGoals: (current.customGoals || []).map((item) => ({
            ...item,
            completed: false,
          })),
          lastResetDate: todayStr,
        },
      };
    });
  }, []);

  const loginUser = useCallback(
    (email: string, name?: string) => {
      continueOfflineMode(name || email.split('@')[0]);
    },
    [continueOfflineMode]
  );

  const logoutUser = useCallback(() => {
    void signOutUser();
  }, [signOutUser]);

  return (
    <StudyContext.Provider
      value={{
        state,
        activeStudyTask,
        activeTimerDraft,
        isStudyModalOpen,
        authChecking,
        isSupabaseEnabled: isSupabaseConfigured,
        cloudSyncStatus,
        openStudyModal,
        closeStudyModal,
        startStudySession,
        resumePausedTimer,
        saveTimerProgress,
        clearTimerDraft,
        completeStudySession,
        skipTask,
        recalculateSchedule,
        addSubject,
        updateSubject,
        toggleSubjectTopic,
        loadSuggestedTopicsForSubject,
        reorderSubjects,
        deleteSubject,
        updateSubjectSpreadsheetField,
        advanceAllCycles,
        applyPreset,
        completeSpacedReview,
        completeOnboarding,
        updateProfile,
        useStreakFreeze,
        resetAllData,
        exportDataJSON,
        importDataJSON,
        triggerCelebration,
        logQuestions,
        rescheduleBacklog,
        saveFixedCommitments,
        markNotificationRead,
        markAllNotificationsRead,
        clearAllNotifications,
        updateDailyGoalTargets,
        addCustomDailyGoal,
        toggleCustomDailyGoal,
        updateCustomDailyGoalTitle,
        deleteCustomDailyGoal,
        resetTodayCustomChecklist,
        loginUser,
        logoutUser,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        continueOfflineMode,
        signOutUser,
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
