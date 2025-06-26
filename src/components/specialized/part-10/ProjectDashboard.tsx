import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GitPullRequest, Bug, FileText, CheckCircle } from 'lucide-react';

const stats = [
    { title: "Pull Requests fusionnées", value: "3", icon: GitPullRequest, color: "text-primary" },
    { title: "Issues résolues", value: "5", icon: Bug, color: "text-green-500" },
    { title: "Commits effectués", value: "12", icon: FileText, color: "text-yellow-500" },
    { title: "Compétences acquises", value: "Toutes !", icon: CheckCircle, color: "text-blue-500" },
]

export function ProjectDashboard() {
  return (
    <Card className="my-6">
      <CardHeader>
        <CardTitle>Tableau de Bord du Projet Final</CardTitle>
        <CardDescription>Un résumé de vos accomplissements durant le projet final simulé.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map(stat => (
                 <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                        <stat.icon className={`h-4 w-4 text-muted-foreground ${stat.color}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                    </CardContent>
                </Card>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
