
import { getAdminUsersAction } from '@/actions/adminActions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Link } from '@/i18n/navigation';
import { Users, ChevronRight, Shield } from 'lucide-react';
import { planLabel } from '@/lib/users';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export default async function AdminUsersListPage() {
  const t = await getTranslations('admin');
  const users = await getAdminUsersAction();

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

  const roleLabels: { [key: string]: string } = {
    'Super Admin': t('roles.roleNameSuperAdmin'),
    'Propriétaire': t('roles.roleNameOwner'),
    'Admin': t('roles.roleNameAdmin'),
    'Modérateur': t('roles.roleNameModerator'),
    'Utilisateur': t('roles.roleNameUser'),
  };

  const statusLabels: { [key: string]: string } = {
    'Actif': t('users.statusActive'),
    'Inactif': t('users.statusInactive'),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin" className="hover:text-primary">{t('breadcrumbAdmin')}</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-semibold text-foreground">{t('users.breadcrumb')}</span>
      </div>
        
      <div className="flex justify-between items-start">
         <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-2 rounded-lg">
                <Users className="h-8 w-8 text-primary" />
            </div>
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('users.title')}</h1>
                <p className="text-muted-foreground">{t('users.subtitle')}</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
                <Link href="/admin/subscriptions">
                    {t('dashboard.manageSubscriptionsButton')}
                </Link>
            </Button>
            <Button variant="outline" asChild>
                <Link href="/admin/roles">
                    <Shield className="mr-2 h-4 w-4" />
                    {t('users.manageRoles')}
                </Link>
            </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('users.allTitle')}</CardTitle>
          <CardDescription>
            {t('users.allDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('users.columnName')}</TableHead>
                <TableHead>{t('users.columnEmail')}</TableHead>
                <TableHead>{t('users.columnRole')}</TableHead>
                <TableHead>{t('users.columnSubscription')}</TableHead>
                <TableHead>{t('users.columnStatus')}</TableHead>
                <TableHead>{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                  <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell><Badge variant={roleBadgeVariants[user.role] || 'outline'}>{roleLabels[user.role] || user.role}</Badge></TableCell>
                  <TableCell><Badge variant={user.planId === 'premium' ? 'secondary' : 'outline'}>{planLabel(user.planId)}</Badge></TableCell>
                  <TableCell><Badge variant={statusBadgeVariants[user.status]}>{statusLabels[user.status] || user.status}</Badge></TableCell>
                  <TableCell>
                    <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/users/${user.id}`}>{t('users.manage')}</Link>
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
