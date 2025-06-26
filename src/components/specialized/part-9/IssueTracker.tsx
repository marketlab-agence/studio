'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Tag, User, PlusCircle, GitPullRequest } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const initialIssues = [
  { id: 123, title: 'Bug: The login button is not clickable on Firefox', status: 'Open', labels: ['bug', 'high-priority'], assignee: 'alex-dev' },
  { id: 122, title: 'Feature: Implement dark mode toggle in settings', status: 'Open', labels: ['enhancement', 'good first issue'], assignee: 'sarah-dev' },
  { id: 120, title: 'Docs: Update contribution guidelines', status: 'Closed', labels: ['documentation'], assignee: 'alex-dev' },
];

type Issue = typeof initialIssues[0];

const labelColors: Record<string, string> = {
    bug: 'bg-red-500/20 text-red-400 border-red-500/30',
    'high-priority': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    enhancement: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'good first issue': 'bg-green-500/20 text-green-400 border-green-500/30',
    documentation: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    triage: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
}

export function IssueTracker() {
    const [issues, setIssues] = useState(initialIssues);
    const [open, setOpen] = useState(false);

    const handleCreateIssue = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const title = formData.get('title') as string;
        
        if (title) {
            const newIssue: Issue = {
                id: Math.floor(Math.random() * 100) + 130,
                title,
                status: 'Open',
                labels: ['triage'],
                assignee: ''
            };
            setIssues([newIssue, ...issues]);
            e.currentTarget.reset();
            setOpen(false);
        }
    }

  return (
    <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="flex flex-row justify-between items-center p-0 mb-4">
            <div/>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                     <Button size="sm">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Issue
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Créer une nouvelle issue</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateIssue} id="new-issue-form" className="space-y-4">
                         <Input name="title" placeholder="Titre" required/>
                         <Textarea name="description" placeholder="Laissez un commentaire..." />
                         <DialogClose asChild>
                            <Button type="submit" form="new-issue-form" className="w-full">Soumettre la nouvelle issue</Button>
                         </DialogClose>
                    </form>
                </DialogContent>
            </Dialog>
        </CardHeader>
      <CardContent className="p-0">
        <div className="border rounded-lg">
            {issues.map((issue, index) => (
                <div key={issue.id} className={`flex items-center justify-between p-3 ${index < issues.length - 1 ? 'border-b' : ''}`}>
                    <div className="flex items-start gap-3">
                        {issue.status === 'Open' ? <AlertCircle className="h-5 w-5 text-green-500 mt-0.5" /> : <CheckCircle className="h-5 w-5 text-purple-500 mt-0.5" />}
                        <div>
                            <p className="font-semibold hover:text-primary cursor-pointer">{issue.title}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <span>#{issue.id}</span>
                                <span>ouvert par user</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {issue.labels.map(label => (
                             <Badge key={label} variant="outline" className={labelColors[label] || ''}>
                                {label}
                            </Badge>
                        ))}
                         {issue.assignee && <User className="h-4 w-4 text-muted-foreground" title={`Assigné à ${issue.assignee}`} />}
                    </div>
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}