import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { StudyProvider, useStudy } from './context/StudyContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, NavSection } from './components/layout/Sidebar';
import { SpreadsheetView } from './components/spreadsheet/SpreadsheetView';
import { DailyGoalsView } from './components/goals/DailyGoalsView';
import { ScheduleHubView } from './components/schedule/ScheduleHubView';
import { SubjectsView } from './components/subjects/SubjectsView';
import { ProgressHubView, ProgressSubTab } from './components/progress/ProgressHubView';
import { ProfileView } from './components/profile/ProfileView';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { ActiveStudyModal } from './components/study/ActiveStudyModal';
import { AuthWelcomeScreen } from './components/auth/AuthWelcomeScreen';
import { HowItWorksPage } from './components/marketing/HowItWorksPage';
import { BrandLogo } from './components/common/BrandLogo';
import { WeeklyLoadLevel } from './components/subjects/PresetSelector';

const MainAppContent: React.FC = () => {
  const { state, authChecking, activeStudyTask, isStudyModalOpen, closeStudyModal } =
    useStudy();
  const isLoggedIn = Boolean(state.currentUser?.isLoggedIn);
  const needsPresetInitialization =
    !state.profile.presetChosen && state.subjects.length === 0;

  // Pre-auth navigation ('login' <-> 'how_it_works') synced with URL hash
  const [preAuthView, setPreAuthView] = useState<'login' | 'how_it_works'>(() =>
    typeof window !== 'undefined' && window.location.hash === '#como-funciona'
      ? 'how_it_works'
      : 'login'
  );
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');
  const [selectedPlanLabel, setSelectedPlanLabel] = useState<string | null>(null);

  const [currentTab, setCurrentTab] = useState<NavSection>(() =>
    needsPresetInitialization ? 'materias' : 'metas'
  );
  const [progressSubTab, setProgressSubTab] = useState<ProgressSubTab>('evolucao');
  const [progressSubTabSignal, setProgressSubTabSignal] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [selectedPresetForWizard, setSelectedPresetForWizard] = useState<string | null>(
    null
  );
  const [selectedLoadForWizard, setSelectedLoadForWizard] = useState<WeeklyLoadLevel>(
    state.profile.weeklyLoad || 'leve'
  );
  const [forceSubjectsPresetMode, setForceSubjectsPresetMode] = useState(false);
  const [forceSubjectsListSignal, setForceSubjectsListSignal] = useState(0);

  const prevUserIdRef = useRef<string | undefined>(state.currentUser?.id);

  // Sync browser back/forward navigation with #como-funciona
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#como-funciona') {
        setPreAuthView('how_it_works');
      } else {
        setPreAuthView('login');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const openHowItWorks = () => {
    setPreAuthView('how_it_works');
    if (window.location.hash !== '#como-funciona') {
      window.location.hash = 'como-funciona';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const returnToLogin = (mode: 'login' | 'register' = 'login', planLabel?: string) => {
    setAuthInitialMode(mode);
    if (planLabel) {
      setSelectedPlanLabel(planLabel);
    }
    setPreAuthView('login');
    if (window.location.hash === '#como-funciona') {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Route cleanly on login / account switch / cloud hydration
  useEffect(() => {
    if (!isLoggedIn) {
      prevUserIdRef.current = undefined;
      return;
    }

    const userChanged = prevUserIdRef.current !== state.currentUser?.id;
    prevUserIdRef.current = state.currentUser?.id;

    if (userChanged) {
      if (!state.profile.presetChosen && state.subjects.length === 0) {
        setForceSubjectsPresetMode(true);
        setCurrentTab('materias');
      } else {
        setForceSubjectsPresetMode(false);
        setCurrentTab('metas');
      }
    }
  }, [isLoggedIn, state.currentUser?.id, state.profile.presetChosen, state.subjects.length]);

  const handleOpenPresetsScreen = () => {
    setForceSubjectsPresetMode(true);
    setCurrentTab('materias');
  };

  const handleSelectPresetForWizard = (presetId: string, weeklyLoad: WeeklyLoadLevel) => {
    setSelectedPresetForWizard(presetId);
    setSelectedLoadForWizard(weeklyLoad);
    setIsOnboardingOpen(true);
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-stone-50 text-stone-900 dark:bg-[#040714] dark:text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <BrandLogo size="lg" />
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-500 dark:text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-600 dark:text-cyan-400" />
            <span>Carregando sua conta...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    if (preAuthView === 'how_it_works') {
      return (
        <HowItWorksPage
          onBackToLogin={() => returnToLogin('login')}
          onStartRegister={(planLabel) => returnToLogin('register', planLabel)}
        />
      );
    }

    return (
      <AuthWelcomeScreen
        onOpenHowItWorks={openHowItWorks}
        initialMode={authInitialMode}
        selectedPlanLabel={selectedPlanLabel}
        onClearSelectedPlan={() => setSelectedPlanLabel(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 dark:bg-[#040714] dark:text-slate-100 font-sans flex antialiased selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* Collapsible Left Sidebar + Mobile Bottom Nav */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'progresso') {
            setProgressSubTab('evolucao');
            setProgressSubTabSignal((s) => s + 1);
          }
          setCurrentTab(tab);
        }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
      />

      {/* Right Main Column */}
      <div className="flex flex-1 flex-col min-w-0 pb-20 md:pb-8">
        <Navbar
          currentTab={currentTab}
          onOpenAchievements={() => {
            setProgressSubTab('conquistas');
            setProgressSubTabSignal((s) => s + 1);
            setCurrentTab('progresso');
          }}
          onOpenProfile={() => setCurrentTab('perfil')}
        />

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {currentTab === 'metas' && (
            <DailyGoalsView
              onNavigateToSchedule={() => {
                setCurrentTab('cronograma');
              }}
              onNavigateToReviews={() => {
                setProgressSubTab('revisoes');
                setProgressSubTabSignal((s) => s + 1);
                setCurrentTab('progresso');
              }}
              onNavigateToSubjects={handleOpenPresetsScreen}
            />
          )}

          {currentTab === 'cronograma' && (
            <ScheduleHubView onNavigateToSubjects={handleOpenPresetsScreen} />
          )}

          {currentTab === 'materias' && (
            <SubjectsView
              forcePresetMode={forceSubjectsPresetMode}
              onClearForcePreset={() => setForceSubjectsPresetMode(false)}
              forceListSignal={forceSubjectsListSignal}
              onSelectPresetForWizard={handleSelectPresetForWizard}
            />
          )}

          {currentTab === 'planilha' && (
            <SpreadsheetView onOpenPresets={handleOpenPresetsScreen} />
          )}

          {currentTab === 'progresso' && (
            <ProgressHubView
              initialSubTab={progressSubTab}
              subTabSignal={progressSubTabSignal}
              onNavigateToSubjects={handleOpenPresetsScreen}
            />
          )}

          {currentTab === 'perfil' && (
            <ProfileView onOpenOnboarding={handleOpenPresetsScreen} />
          )}
        </main>
      </div>

      {/* Onboarding Modal (Launched after choosing a preset) */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onCompleted={() => {
          setForceSubjectsListSignal((prev) => prev + 1);
          setCurrentTab('metas');
        }}
        initialPresetId={selectedPresetForWizard}
        initialWeeklyLoad={selectedLoadForWizard}
      />

      {/* Active Focus Study Timer Modal */}
      {isStudyModalOpen && activeStudyTask && (
        <ActiveStudyModal task={activeStudyTask} onClose={closeStudyModal} />
      )}
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <StudyProvider>
          <MainAppContent />
        </StudyProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
