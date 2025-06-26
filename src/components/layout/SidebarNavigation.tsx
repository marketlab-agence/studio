import React from 'react';
import { BookOpen } from 'lucide-react';

export function SidebarNavigation() {
  return (
    <nav className="p-4 h-full">
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-bold">Tutorial Chapters</h2>
      </div>
      <ul className="space-y-2">
        <li>
          <a href="#" className="block p-2 rounded-md bg-muted font-semibold">
            1. Introduction to Git
          </a>
          <ul className="pl-4 mt-2 space-y-1 text-sm">
            <li><a href="#" className="block p-2 rounded-md hover:bg-muted/50">What is Git?</a></li>
            <li><a href="#" className="block p-2 rounded-md hover:bg-muted/50">Installation</a></li>
          </ul>
        </li>
        <li>
          <a href="#" className="block p-2 rounded-md hover:bg-muted/50 font-semibold">
            2. Basic Commands
          </a>
        </li>
        <li>
          <a href="#" className="block p-2 rounded-md hover:bg-muted/50 font-semibold">
            3. Branching
          </a>
        </li>
      </ul>
    </nav>
  );
}
