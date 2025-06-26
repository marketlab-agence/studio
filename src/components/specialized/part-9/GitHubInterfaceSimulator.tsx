'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IssueTracker } from './IssueTracker';
import { GitPullRequest, MessageSquare, PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const initialPRs = [
  { id: 101, title: 'feat: Add dark mode support', status: 'Open', author: 'sarah-dev', comments: 3, labels: ['enhancement'] },
  { id: 98, title: 'fix: Correct spelling mistakes in README', status: 'Open', author: 'mike-code', comments: 0, labels: ['documentation', 'approved'] },
  { id: 95, title: 'refactor: Simplify logic in API controller', status: 'Merged', author: 'alex-dev', comments: 1, labels: [] },
];

type PullRequest = typeof initialPRs[0];

const labelColors: Record<string, string> = {
    enhancement: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    documentation: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    approved: 'bg-green-500/20 text-green-400 border-green-500/30',
};

function PullRequestList() {
    const [pullRequests, setPullRequests] = useState(initialPRs);
    const [open, setOpen] = useState(false);

    const handleCreatePR = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const title = formData.get('title') as string;

        if (title) {
            const newPR: PullRequest = {
                id: Math.floor(Math.random() * 50) + 102,
                title,
                status: 'Open',
                author: 'vous',
                comments: 0,
                labels: [],
            };
            setPullRequests([newPR, ...pullRequests]);
            e.currentTarget.reset();
            setOpen(false);
        }
    }
    return (
        <div>
            <div className="flex justify-end mb-4">
                 <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                         <Button size="sm">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            New Pull Request
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Ouvrir une nouvelle Pull Request</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreatePR} id="new-pr-form" className="space-y-4">
                             <Input name="title" placeholder="Titre" required/>
                             <Textarea name="description" placeholder="Laissez un commentaire pour décrire vos changements..." />
                             <DialogClose asChild>
                                <Button type="submit" form="new-pr-form" className="w-full">Créer la Pull Request</Button>
                             </DialogClose>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            <ul className="space-y-2 border rounded-lg p-2">
                {pullRequests.map(pr => (
                    <li key={pr.id} className="p-3 border-b last:border-b-0 rounded-lg flex justify-between items-center hover:bg-muted/50">
                        <div className="flex items-start gap-3">
                            <GitPullRequest className={`h-5 w-5 mt-0.5 ${pr.status === 'Merged' ? 'text-purple-500' : 'text-green-500'}`} />
                            <div>
                                <p className="font-semibold hover:text-primary cursor-pointer">{pr.title}</p>
                                <p className="text-sm text-muted-foreground">#{pr.id} ouvert par @{pr.author}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                {pr.labels.map(label => (
                                    <Badge key={label} variant="outline" className={labelColors[label] || ''}>
                                        {label}
                                    </Badge>
                                ))}
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Avatar className="h-6 w-6"><AvatarFallback>{pr.author.substring(0,2).toUpperCase()}</AvatarFallback></Avatar>
                                {pr.comments > 0 && (
                                    <div className="flex items-center gap-1">
                                        <MessageSquare className="h-4 w-4" />
                                        <span>{pr.comments}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export function GitHubInterfaceSimulator() {
  return (
    <Card className="my-6">
      <CardHeader>
        <CardTitle>Simulateur d'Interface GitHub</CardTitle>
        <CardDescription>Explorez les fonctionnalités clés de GitHub comme les Issues et les Pull Requests.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="issues" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="issues">Issues</TabsTrigger>
                <TabsTrigger value="pull-requests">Pull Requests</TabsTrigger>
            </TabsList>
            <TabsContent value="issues" className="mt-4">
                <IssueTracker />
            </TabsContent>
            <TabsContent value="pull-requests" className="mt-4">
                <PullRequestList />
            </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
