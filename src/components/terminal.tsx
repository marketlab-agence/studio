
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Terminal as TerminalIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';

type TerminalProps = {
  context?: string;
  initialCommand?: string;
};

export function Terminal({ context, initialCommand }: TerminalProps) {
  const [history, setHistory] = useState<string[]>(context ? [context] : []);
  const [input, setInput] = useState(initialCommand || '');
  const endOfHistoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfHistoryRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCommand = (command: string) => {
    const newHistory = [...history, `$ ${command}`];
    let output = '';

    if (command.trim() === 'clear') {
      setHistory([]);
      return;
    }

    switch (command.trim().split(' ')[0]) {
      case 'help':
        output = 'Available commands: help, clear, echo, ls';
        break;
      case 'echo':
        output = command.substring(5);
        break;
      case 'ls':
        output = 'README.md  node_modules/  package.json  src/';
        break;
      default:
        output = `command not found: ${command}`;
    }

    newHistory.push(output);
    setHistory(newHistory);
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      handleCommand(input);
      setInput('');
    }
  };

  return (
    <Card className="font-code w-full h-full flex flex-col bg-black text-white rounded-lg overflow-hidden">
      <CardHeader className="flex-row items-center gap-2 border-b border-gray-700 p-3 bg-gray-900/50">
        <TerminalIcon className="h-4 w-4" />
        <CardTitle className="text-sm font-normal">Terminal</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-y-auto">
        <ScrollArea className="h-full">
            <div className="p-4">
                {history.map((line, index) => (
                <div key={index} className={cn(line.startsWith('$') ? 'text-gray-400' : 'text-white')}>
                    <span className="select-none">{line.startsWith('$') ? '$ ' : ''}</span>
                    {line.startsWith('$') ? line.substring(2) : line}
                </div>
                ))}
                <form onSubmit={handleInputSubmit} className="flex gap-2 items-center">
                <span className="text-gray-400">$</span>
                <Input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 bg-transparent border-none p-0 h-auto text-white focus:ring-0 focus-visible:ring-offset-0 focus-visible:ring-0 shadow-none"
                    autoFocus
                    spellCheck="false"
                />
                </form>
                <div ref={endOfHistoryRef} />
            </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
