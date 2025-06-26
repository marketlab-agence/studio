import React from 'react';
import { cn } from '@/lib/utils';

type CodeBlockProps = {
  children: React.ReactNode;
  className?: string;
};

export function CodeBlock({ children, className }: CodeBlockProps) {
  return (
    <pre className={cn('bg-muted rounded-md p-4 overflow-x-auto', className)}>
      <code className="font-code text-sm text-foreground">{children}</code>
    </pre>
  );
}
