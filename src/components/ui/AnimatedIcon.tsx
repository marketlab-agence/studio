import React from 'react';
import { GitCommitHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

type AnimatedIconProps = {
  iconName: 'git' | 'github';
  className?: string;
};

// Pour l'instant, nous utilisons une icône statique.
// Cela peut être étendu pour utiliser des animations SVG ou Lottie.
export function AnimatedIcon({ iconName, className }: AnimatedIconProps) {
  if (iconName === 'github') {
    // Placeholder pour une icône GitHub
    return <span className={cn('font-bold', className)}>GH</span>;
  }
  return <GitCommitHorizontal className={cn('text-primary', className)} />;
}
