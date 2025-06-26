'use client';

import { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, Bot, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { explainCommand } from '@/app/actions';

type HistoryItem = {
  id: number;
  type: 'command' | 'output' | 'ai';
  content: string;
};

type TerminalProps = {
  context: string;
  initialCommand?: string;
};

export function Terminal({ context, initialCommand }: TerminalProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [command, setCommand] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialCommand) {
      setCommand(initialCommand);
    }
  }, [initialCommand]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [history]);
  
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!command || isLoading) return;

    setIsLoading(true);

    const newCommand: HistoryItem = { id: Date.now(), type: 'command', content: command };
    setHistory((prev) => [...prev, newCommand]);
    
    try {
      const result = await explainCommand(command, context);
      const newOutput: HistoryItem[] = [];

      if (result.output) {
        newOutput.push({ id: Date.now() + 1, type: 'output', content: result.output });
      }
      if (result.explanation) {
        newOutput.push({ id: Date.now() + 2, type: 'ai', content: result.explanation });
      }
      setHistory((prev) => [...prev, ...newOutput]);

    } catch (error) {
      console.error(error);
      const errorOutput: HistoryItem = {
        id: Date.now() + 1,
        type: 'output',
        content: 'An error occurred while explaining the command.',
      };
      setHistory((prev) => [...prev, errorOutput]);
    }

    setCommand('');
    setIsLoading(false);
    
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const renderHistoryItem = (item: HistoryItem) => {
    switch (item.type) {
      case 'command':
        return (
          <div className="flex items-center gap-2">
            <span className="text-accent font-bold">$</span>
            <p className="font-code text-primary-foreground">{item.content}</p>
          </div>
        );
      case 'output':
        return <pre className="font-code text-sm text-muted-foreground whitespace-pre-wrap">{item.content}</pre>;
      case 'ai':
        return (
          <Card className="bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Bot className="h-4 w-4 text-accent" />
                AI Explanation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{item.content}</p>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="flex h-12 items-center border-b px-4">
        <TerminalIcon className="mr-2 h-5 w-5" />
        <h2 className="font-semibold">Simulated Terminal</h2>
      </div>
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {history.map(renderHistoryItem)}
          {isLoading && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-accent" />
              <span className="text-sm text-muted-foreground">AI is thinking...</span>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <span className="font-code text-lg text-accent">$</span>
          <Input
            ref={inputRef}
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Type a git command and press Enter..."
            className="flex-1 bg-background font-code"
            disabled={isLoading}
            aria-label="Git command input"
          />
          <Button type="submit" size="icon" disabled={isLoading || !command} aria-label="Submit command">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
