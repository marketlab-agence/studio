import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function NavigationControls() {
  return (
    <div className="flex justify-between items-center p-4 border-t">
      <Button variant="outline">
        <ChevronLeft className="mr-2 h-4 w-4" />
        Précédent
      </Button>
      <Button>
        Suivant
        <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
