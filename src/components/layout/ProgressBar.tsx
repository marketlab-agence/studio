'use client';

import React from 'react';
import { Progress } from '@/components/ui/progress';

export function ProgressBar() {
  const [progress, setProgress] = React.useState(25);

  React.useEffect(() => {
    const timer = setTimeout(() => setProgress(45), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="p-4 w-full">
        <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-muted-foreground">Progression du Tutoriel</span>
            <span className="text-sm font-bold">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} />
    </div>
  );
}
