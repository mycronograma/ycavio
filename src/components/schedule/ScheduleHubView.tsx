import React, { useState } from 'react';
import { ScheduleView } from './ScheduleView';
import { FixedScheduleModal } from './FixedScheduleModal';

interface ScheduleHubViewProps {
  onNavigateToSubjects: () => void;
}

export const ScheduleHubView: React.FC<ScheduleHubViewProps> = ({
  onNavigateToSubjects,
}) => {
  const [isFixedScheduleOpen, setIsFixedScheduleOpen] = useState(false);

  return (
    <>
      <ScheduleView
        onNavigateToSubjects={onNavigateToSubjects}
        onOpenFixedSchedule={() => setIsFixedScheduleOpen(true)}
      />

      <FixedScheduleModal
        isOpen={isFixedScheduleOpen}
        onClose={() => setIsFixedScheduleOpen(false)}
      />
    </>
  );
};
