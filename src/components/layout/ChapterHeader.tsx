import React from 'react';
import { BookMarked } from 'lucide-react';

export function ChapterHeader() {
  return (
    <header className="p-6 border-b border-border bg-card">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-md">
            <BookMarked className="h-6 w-6 text-primary" />
        </div>
        <div>
            <h1 className="text-2xl font-bold tracking-tight">1. Introduction to Git</h1>
            <p className="text-md text-muted-foreground mt-1">
              Learn the fundamentals of version control.
            </p>
        </div>
      </div>
    </header>
  );
}
