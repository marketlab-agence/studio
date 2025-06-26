import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IssueTracker } from './IssueTracker';
import { GitPullRequest } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

function PullRequestList() {
    return (
        <ul className="space-y-2 border rounded-lg p-2">
            <li className="p-3 border-b rounded-lg flex justify-between items-center hover:bg-muted/50">
                <div>
                    <p className="font-semibold hover:text-primary cursor-pointer">feat: Add dark mode support</p>
                    <p className="text-sm text-muted-foreground">#101 opened 2 days ago by @sarah-dev</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="secondary">enhancement</Badge>
                    <Avatar className="h-6 w-6"><AvatarFallback>SD</AvatarFallback></Avatar>
                </div>
            </li>
            <li className="p-3 rounded-lg flex justify-between items-center hover:bg-muted/50">
                <div>
                    <p className="font-semibold hover:text-primary cursor-pointer">fix: Correct spelling mistakes in README</p>
                    <p className="text-sm text-muted-foreground">#98 opened 5 days ago by @mike-code</p>
                </div>
                 <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-green-500/20 text-green-400 border-transparent">✓ Checks passed</Badge>
                    <Avatar className="h-6 w-6"><AvatarFallback>MC</AvatarFallback></Avatar>
                </div>
            </li>
        </ul>
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