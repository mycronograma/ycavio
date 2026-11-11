import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { StudyProvider, useStudy } from './context/StudyContext';
import { Navbar } from './components/layout/Navbar';
import { NavigationTabs, TabType } from './components/layout/NavigationTabs';
import { TodayDashboard } from './components/dashboard/TodayDashboard';
import { ScheduleView } from './components/schedule/ScheduleView';
import { SubjectsView } from './components/subjects/SubjectsView';
import { ReviewsView } from './components/reviews/ReviewsView';
import { ProgressView } from './components/progress/ProgressView';
import { AchievementsView } from './components/gamification/AchievementsView';
import { ProfileView } from './components/profile/ProfileView';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { ActiveStudyModal } from './components/study/ActiveStudyModal';

const MainAppContent: React.FC = () => {
  const { state, activeStudyTask, isStudyModalOpen, closeStudyModal } = useStudy();
  const [currentTab, setCurrentTab] = useState<TabType>('hoje');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(
    !state.profile.onboardingCompleted
  );

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100 font-sans flex flex-col antialiased selection:bg-indigo-500 selection:text-white pb-20 md:pb-8 transition-colors duration-200">
      {/* Top Header Navbar */}
      <Navbar
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onOpenAchievements={() => setCurrentTab('conquistas')}
      />

      {/* Navigation Pills */}
      <NavigationTabs
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
      />

      {/* Main Viewport Container */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {currentTab === 'hoje' && (
          <TodayDashboard
            onNavigateToSchedule={() => setCurrentTab('cronograma')}
            onNavigateToReviews={() => setCurrentTab('revisoes')}
            onNavigateToSubjects={() => setCurrentTab('materias')}
          />
        )}

        {currentTab === 'cronograma' && <ScheduleView />}

        {currentTab === 'materias' && <SubjectsView />}

        {currentTab === 'revisoes' && <ReviewsView />}

        {currentTab === 'progresso' && <ProgressView />}

        {currentTab === 'conquistas' && <AchievementsView />}

        {currentTab === 'perfil' && (
          <ProfileView onOpenOnboarding={() => setIsOnboardingOpen(true)} />
        )}
      </main>

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />

      {/* Active Focus Study Timer Modal */}
      {isStudyModalOpen && activeStudyTask && (
        <ActiveStudyModal
          task={activeStudyTask}
          onClose={closeStudyModal}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <StudyProvider>
        <MainAppContent />
      </StudyProvider>
    </ThemeProvider>
  );
}
