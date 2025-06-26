import React from 'react';
import { ChevronRight } from 'lucide-react';

export function BreadcrumbNavigation() {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-2 text-sm text-muted-foreground">
        <li>
          <a href="#" className="transition-colors hover:text-foreground">
            Git Tutorial
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
            What is Git?
          </span>
        </li>
      </ol>
    </nav>
  );
}
