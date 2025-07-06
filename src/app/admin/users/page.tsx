import { getAdminUsers } from '@/actions/adminActions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Users, ChevronRight, Shield } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminUsersListPage() {
  const users = await getAdminUsers();
  
  const roleBadgeVariants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
    'Super Admin': 'destructive',
    'Admin': 'default',
    'Modérateur': 'secondary',
    'Utilisateur': 'outline',
  };

  const statusBadgeVariants: { [key: string]: "default" | "outline" } = {
    'Actif': 'default',
    'Inactif': 'outline',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin" className="hover:text-primary">Admin</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-semibold text-foreground">Utilisateurs</span>
      </div>
        
      <div className="flex justify-between items-start">
         <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-2 rounded-lg">
                <Users className="h-8 w-8 text-primary" />
            </div>
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Gestion des Utilisateurs</h1>
                <p className="text-muted-foreground">Gérez tous les utilisateurs de la plateforme.</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
                <Link href="/admin/subscriptions/create">
                    Gérer les abonnements
                </Link>
            </Button>
            <Button variant="outline" asChild>
                <Link href="/admin/roles">
                    <Shield className="mr-2 h-4 w-4" />
                    Gérer les rôles
                </Link>
            </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tous les utilisateurs</CardTitle>
          <CardDescription>
            Liste de tous les utilisateurs inscrits sur la plateforme.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Abonnement</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                  <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell><Badge variant={roleBadgeVariants[user.role] || 'outline'}>{user.role}</Badge></TableCell>
                  <TableCell><Badge variant={user.plan === 'Premium' ? 'secondary' : 'outline'}>{user.plan}</Badge></TableCell>
                  <TableCell><Badge variant={statusBadgeVariants[user.status]}>{user.status}</Badge></TableCell>
                  <TableCell>
                    <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/users/${user.id}`}>Gérer</Link>
                    </Button>
                  </TableCell>
                  </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
