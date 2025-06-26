import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { GitCommitHorizontal } from 'lucide-react';

export function CommitTimeline() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Frise Chronologique des Commits</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative pl-6">
          <div className="absolute left-0 top-0 h-full w-0.5 bg-border -translate-x-1/2 ml-3"></div>
          <div className="relative mb-8">
            <div className="absolute -left-3 top-1 h-6 w-6 rounded-full bg-primary flex items-center justify-center ring-8 ring-background">
              <GitCommitHorizontal className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="pl-8">
              <p className="font-semibold">Commit initial</p>
              <p className="text-sm text-muted-foreground">il y a 2 heures par Vous</p>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -left-3 top-1 h-6 w-6 rounded-full bg-primary flex items-center justify-center ring-8 ring-background">
              <GitCommitHorizontal className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="pl-8">
              <p className="font-semibold">Ajout du README</p>
              <p className="text-sm text-muted-foreground">il y a 1 heure par Vous</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
