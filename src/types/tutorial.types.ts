export interface Tutorial {
  id: string;
  title: string;
  description: string;
  steps: Step[];
}

export interface Step {
  id: string;
  title: string;
  content: string;
  command?: string;
  explanation?: string;
}

export interface UserProgress {
  completedSteps: Set<string>;
  currentStepId: string | null;
}
