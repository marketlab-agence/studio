'use client';
import React, { createContext, useState, useContext, ReactNode } from 'react';

type UserProgressContextType = {
  completedSteps: Set<string>;
  completeStep: (stepId: string) => void;
};

const UserProgressContext = createContext<UserProgressContextType | undefined>(undefined);

export function UserProgressProvider({ children }: { children: ReactNode }) {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const completeStep = (stepId: string) => {
    setCompletedSteps(prev => new Set(prev).add(stepId));
  };

  return (
    <UserProgressContext.Provider value={{ completedSteps, completeStep }}>
      {children}
    </UserProgressContext.Provider>
  );
}

export function useUserProgress() {
  const context = useContext(UserProgressContext);
  if (context === undefined) {
    throw new Error('useUserProgress must be used within a UserProgressProvider');
  }
  return context;
}
