'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const rules = [
  { id: 'length', text: 'Le sujet ne doit pas dépasser 50 caractères.', test: (subject: string) => subject.length > 0 && subject.length <= 50 },
  { id: 'capitalize', text: 'Le sujet doit commencer par une majuscule.', test: (subject: string) => subject.length > 0 && subject.charAt(0) === subject.charAt(0).toUpperCase() },
  { id: 'no-period', text: 'Le sujet ne doit pas se terminer par un point.', test: (subject: string) => !subject.endsWith('.') },
];

export function CommitMessageLinter() {
  const [message, setMessage] = useState('feat: Ajout du linter de message de commit');
  const [subject, setSubject] = useState('');

  useEffect(() => {
    const firstLine = message.split('\n')[0];
    setSubject(firstLine);
  }, [message]);

  return (
    <Card className="my-6">
      <CardHeader>
        <CardTitle>Linter de Messages de Commit</CardTitle>
        <CardDescription>Écrivez de meilleurs messages de commit en suivant les bonnes pratiques.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="font-code min-h-[120px]"
          placeholder="Écrivez votre message de commit ici..."
        />
        <div>
          <h4 className="font-semibold text-sm mb-2">Analyse du sujet :</h4>
          <ul className="space-y-2">
            {rules.map(rule => {
              const isValid = rule.test(subject);
              return (
                <li key={rule.id} className={cn("flex items-center gap-2 text-sm", isValid ? 'text-green-400' : 'text-muted-foreground')}>
                  {isValid ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  <span>{rule.text}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
