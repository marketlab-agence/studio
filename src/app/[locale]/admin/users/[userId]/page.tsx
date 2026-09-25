
'use client';

import { notFound, useParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { Link } from '@/i18n/navigation';
import { ArrowLeft, User, Shield, Activity, FileText, AlertTriangle, Trash2, Loader2, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useTutorial } from '@/contexts/TutorialContext';
import { AppUser, planLabel } from '@/lib/users';
import { getAdminUserByIdAction, updateUserRoleAction } from '@/actions/adminActions';
import { useTranslations } from 'next-intl';


export default function ManageUserPage() {
  const params = useParams();
  const { userId } = params as { userId: string };
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<AppUser['role'] | ''>('');
  const [isSaving, startSaving] = useTransition();
  const { toast } = useToast();
  const { user: authUser } = useAuth();
  const { overallProgress } = useTutorial();
  const t = useTranslations('admin');
  const tc = useTranslations('common');

  useEffect(() => {
    async function loadUser() {
        setLoading(true);
        const userData = await getAdminUserByIdAction(userId);
        if (userData) {
          setUser(userData);
          setSelectedRole(userData.role);
        }
        setLoading(false);
    }
    loadUser();
  }, [userId]);

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

  const handleRoleSave = () => {
    if (!selectedRole || !user || selectedRole === user.role) return;

    startSaving(async () => {
        try {
            await updateUserRoleAction(user.id, selectedRole as AppUser['role']);
            setUser(prev => prev ? {...prev, role: selectedRole as AppUser['role']} : null);
            toast({
                title: t('userDetail.roleUpdatedTitle'),
                description: t('userDetail.roleUpdatedDescription', { name: user.name, role: roleLabels[selectedRole] || selectedRole }),
            });
        } catch(error) {
            toast({
                title: tc('errorTitle'),
                description: t('userDetail.roleUpdateErrorDescription'),
                variant: 'destructive',
            });
        }
    });
  };

  if (loading) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-64" />
            <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card><CardHeader><Skeleton className="h-6 w-40" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-6 w-40" /></CardHeader><CardContent><Skeleton className="h-32 w-full" /></CardContent></Card>
                </div>
                <div className="space-y-6">
                    <Card><CardHeader><Skeleton className="h-6 w-40" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-6 w-40" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>
                </div>
            </div>
        </div>
    );
  }

  if (!user) {
    return notFound();
  }
  
  const isViewingSelf = authUser?.email === user.email;
  const userProgress = isViewingSelf ? overallProgress : 17;

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('userDetail.backToList')}
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
        <Avatar className="h-16 w-16 mb-4 sm:mb-0">
          <AvatarFallback className="text-2xl">{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{user.name}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><User/> {t('userDetail.identityTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><p className="text-sm text-muted-foreground">{t('userDetail.firstName')}</p><p className="font-medium">{user.name.split(' ')[0]}</p></div>
                    <div><p className="text-sm text-muted-foreground">{t('userDetail.lastName')}</p><p className="font-medium">{user.name.split(' ').slice(1).join(' ')}</p></div>
                    <div><p className="text-sm text-muted-foreground">{t('userDetail.email')}</p><p className="font-medium">{user.email}</p></div>
                    <div><p className="text-sm text-muted-foreground">{t('userDetail.mobile')}</p><p className="font-medium">{user.phone || t('userDetail.notProvided')}</p></div>
                    <div><p className="text-sm text-muted-foreground">{t('userDetail.status')}</p><p className="font-medium">{statusLabels[user.status] || user.status}</p></div>
                    <div><p className="text-sm text-muted-foreground">{t('userDetail.joinedAt')}</p><p className="font-medium">{user.joined}</p></div>
                </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText /> {t('userDetail.complianceTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{t('userDetail.sensitiveTitle')}</AlertTitle>
                    <AlertDescription>{t('userDetail.sensitiveDescription')}</AlertDescription>
                </Alert>
                <div className="space-y-2">
                    <h4 className="font-semibold text-sm">{t('userDetail.gdprActionsTitle')}</h4>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm">{t('userDetail.exportData')}</Button>
                        <Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4"/> {t('userDetail.anonymize')}</Button>
                    </div>
                </div>
                 <Separator />
                <div className="space-y-2">
                    <h4 className="font-semibold text-sm">{t('userDetail.qualiopiTitle')}</h4>
                    <div className="flex items-center space-x-2">
                        <Switch id="cpf-switch" defaultChecked={user.id === 'usr_1'}/>
                        <Label htmlFor="cpf-switch">{t('userDetail.cpfLabel')}</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <Switch id="qualiopi-switch" defaultChecked={user.id === 'usr_1' || user.id === 'usr_5'} />
                        <Label htmlFor="qualiopi-switch">{t('userDetail.qualiopiLabel')}</Label>
                    </div>
                </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Shield/> {t('userDetail.roleSubscriptionTitle')}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="role-select" className="font-semibold text-sm">{t('userDetail.roleLabel')}</Label>
                        <div className="flex items-center gap-2 mt-1">
                            <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as AppUser['role'])}>
                                <SelectTrigger id="role-select">
                                    <SelectValue placeholder={t('userDetail.selectRole')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Super Admin">{t('userDetail.selectRoleSuperAdmin')}</SelectItem>
                                    <SelectItem value="Admin">{t('userDetail.selectRoleAdmin')}</SelectItem>
                                    <SelectItem value="Modérateur">{t('userDetail.selectRoleModerator')}</SelectItem>
                                    <SelectItem value="Utilisateur">{t('userDetail.selectRoleUser')}</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button onClick={handleRoleSave} disabled={isSaving || selectedRole === user.role}>
                                {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
                            </Button>
                        </div>
                    </div>
                    <Separator/>
                    <div>
                        <p className="font-semibold mb-1 text-sm">{t('userDetail.currentSubscription')}</p>
                        <Badge variant={user.planId === 'premium' ? 'default' : 'secondary'}>{planLabel(user.planId)}</Badge>
                    </div>
                     <Button variant="outline" size="sm" className="w-full">{t('userDetail.manageSubscription')}</Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Activity/> {t('userDetail.platformUsageTitle')}</CardTitle></CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div><p className="font-medium">{t('userDetail.lastActivity')}</p><p className="text-muted-foreground">{t('userDetail.twoDaysAgo')}</p></div>
                    <Separator/>
                    <div>
                        <p className="font-medium mb-1">{t('userDetail.tutorialProgress')}</p>
                        <Progress value={userProgress} className="h-2"/>
                        <p className="text-xs text-muted-foreground mt-2">{t('userDetail.completed', { percent: Math.round(userProgress) })}</p>
                    </div>
                    <Button variant="link" size="sm" className="p-0 h-auto">{t('userDetail.viewFullActivity')}</Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
