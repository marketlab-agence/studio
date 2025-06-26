import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

export function AnimatedFlow() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Flux Animé (ex: Push)</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-around p-8">
        <div className="text-center">
          <p className="font-semibold">Local</p>
          <div className="mt-2 h-16 w-16 bg-muted rounded-md flex items-center justify-center">Repo</div>
        </div>
        <ArrowRight className="h-8 w-8 text-primary animate-pulse" />
        <div className="text-center">
          <p className="font-semibold">Distant</p>
          <div className="mt-2 h-16 w-16 bg-muted rounded-md flex items-center justify-center">Origin</div>
        </div>
      </CardContent>
    </Card>
  );
}
