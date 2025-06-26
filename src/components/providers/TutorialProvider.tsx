'use client';
import React, { createContext, useState, useContext, ReactNode } from 'react';

type TutorialContextType = {
  progress: number;
  updateProgress: (newProgress: number) => void;
};

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState(0);

  const updateProgress = (newProgress: number) => {
    setProgress(newProgress);
  };

  return (
    <TutorialContext.Provider value={{ progress, updateProgress }}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
}
