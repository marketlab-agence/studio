import React from 'react';
import { ChevronRight } from 'lucide-react';

export function BreadcrumbNavigation() {
  return (
    <nav aria-label="Fil d'Ariane">
      <ol className="flex items-center gap-2 text-sm text-muted-foreground">
        <li>
          <a href="#" className="transition-colors hover:text-foreground">
            Tutoriel Git
          </a>
        </li>
        <li>
          <ChevronRight className="h-4 w-4" />
        </li>
        <li>
          <a href="#" className="transition-colors hover:text-foreground">
            Introduction
          </a>
        </li>
        <li>
          <ChevronRight className="h-4 w-4" />
        </li>
        <li>
          <span className="font-medium text-foreground">
            Qu'est-ce que Git ?
          </span>
        </li>
      </ol>
    </nav>
  );
}
