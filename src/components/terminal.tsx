'use client';

import { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, Bot, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTutorial } from '@/contexts/TutorialContext';

type TerminalProps = {
  initialCommand?: string;
};

export function Terminal({ initialCommand }: TerminalProps) {
  const { commandHistory, runCommandInTerminal, isTerminalLoading } = useTutorial();
  const [command, setCommand] = useState(initialCommand || '');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [commandHistory]);
  
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!command || isTerminalLoading) return;

    await runCommandInTerminal(command);
    setCommand('');
    
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const renderHistoryItem = (item: any, index: number) => {
    switch (item.type) {
      case 'command':
        return (
          <div key={index} className="flex items-center gap-2">
            <span className="text-accent font-bold">$</span>
            <p className="font-code text-primary-foreground">{item.content}</p>
          </div>
        );
      case 'output':
        return <pre key={index} className="font-code text-sm text-muted-foreground whitespace-pre-wrap">{item.content}</pre>;
      case 'ai':
        return (
          <Card key={index} className="bg-card/50 my-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Bot className="h-4 w-4 text-accent" />
                Explication de l'IA
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
        <h2 className="font-semibold">Terminal Simulé</h2>
      </div>
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {commandHistory.map(renderHistoryItem)}
          {isTerminalLoading && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-accent" />
              <span className="text-sm text-muted-foreground">L'IA réfléchit...</span>
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
            placeholder="Tapez une commande git et appuyez sur Entrée..."
            className="flex-1 bg-background font-code"
            disabled={isTerminalLoading}
            aria-label="Entrée de commande Git"
          />
          <Button type="submit" size="icon" disabled={isTerminalLoading || !command} aria-label="Envoyer la commande">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
