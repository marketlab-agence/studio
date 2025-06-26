'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BookmarkButton() {
  const [isBookmarked, setIsBookmarked] = useState(false);

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={() => setIsBookmarked(!isBookmarked)}
      aria-label="Mettre en favori"
    >
      <Bookmark className={cn(
        'h-5 w-5', 
        isBookmarked && 'fill-primary text-primary'
      )} />
    </Button>
  );
}
