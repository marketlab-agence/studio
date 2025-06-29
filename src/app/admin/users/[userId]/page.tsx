
'use client';

import { MOCK_USERS, MockUser } from '@/lib/users';
import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Shield, CreditCard, Activity, FileText, AlertTriangle, Trash2, Loader2 } from 'lucide-react';
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

export default function ManageUserPage({ params }: { params: { userId: string } }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<MockUser['role'] | ''>('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user: authUser } = useAuth();
  const { overallProgress } = useTutorial();

  useEffect(() => {
    const userData = MOCK_USERS.find(u => u.id === params.userId);
    if (userData) {
      setUser(userData);
      setSelectedRole(userData.role);
    }
    setLoading(false);
  }, [params.userId]);

  const handleRoleSave = () => {
    if (!selectedRole || !user) return;
    setIsSaving(true);
    // Simulate API call to save the role
    setTimeout(() => {
        // In a real app, you would update the data source here.
        // For this mock, we can update the user object in state.
        setUser(prev => prev ? {...prev, role: selectedRole} : null);
        toast({
            title: "Rôle mis à jour",
            description: `Le rôle de ${user.name} est maintenant ${selectedRole}.`,
        });
        setIsSaving(false);
    }, 1000);
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
  
  // Use real progress for the logged-in user when viewing their own profile,
  // otherwise use a consistent mock value.
  const isViewingSelf = authUser?.email === user.email;
  const userProgress = isViewingSelf ? overallProgress : 17; // Using 17 to match dashboard for other users in this mock scenario.

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin?tab=users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la liste des utilisateurs
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
                <CardTitle className="flex items-center gap-2"><User/> Identité</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><p className="text-sm text-muted-foreground">Prénom</p><p className="font-medium">{user.name.split(' ')[0]}</p></div>
                    <div><p className="text-sm text-muted-foreground">Nom</p><p className="font-medium">{user.name.split(' ').slice(1).join(' ')}</p></div>
                    <div><p className="text-sm text-muted-foreground">Email</p><p className="font-medium">{user.email}</p></div>
                    <div><p className="text-sm text-muted-foreground">Mobile</p><p className="font-medium">{user.phone || 'Non renseigné'}</p></div>
                    <div><p className="text-sm text-muted-foreground">Statut</p><p className="font-medium">{user.status}</p></div>
                    <div><p className="text-sm text-muted-foreground">Inscrit le</p><p className="font-medium">{user.joined}</p></div>
                </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText /> Conformité & Gestion des Données</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Zone Sensible</AlertTitle>
                    <AlertDescription>Les actions de cette section sont irréversibles et doivent être effectuées avec prudence.</AlertDescription>
                </Alert>
                <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Actions RGPD</h4>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm">Exporter les données de l'utilisateur</Button>
                        <Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4"/> Anonymiser cet utilisateur</Button>
                    </div>
                </div>
                 <Separator />
                <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Vérifications Qualiopi / CPF (simulé)</h4>
                    <div className="flex items-center space-x-2">
                        <Switch id="cpf-switch" defaultChecked={user.id === 'usr_1'}/>
                        <Label htmlFor="cpf-switch">Dossier de financement CPF complet et vérifié</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <Switch id="qualiopi-switch" defaultChecked={user.id === 'usr_1' || user.id === 'usr_5'} />
                        <Label htmlFor="qualiopi-switch">Traçabilité Qualiopi assurée</Label>
                    </div>
                </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Shield/> Rôle & Abonnement</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="role-select" className="font-semibold text-sm">Rôle de l'utilisateur</Label>
                        <div className="flex items-center gap-2 mt-1">
                            <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as MockUser['role'])}>
                                <SelectTrigger id="role-select">
                                    <SelectValue placeholder="Sélectionner un rôle" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Super Admin">Super Admin</SelectItem>
                                    <SelectItem value="Admin">Administrateur</SelectItem>
                                    <SelectItem value="Modérateur">Modérateur</SelectItem>
                                    <SelectItem value="Utilisateur">Utilisateur</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button onClick={handleRoleSave} disabled={isSaving || selectedRole === user.role}>
                                {isSaving ? <Loader2 className="animate-spin" /> : 'Sauver'}
                            </Button>
                        </div>
                    </div>
                    <Separator/>
                    <div>
                        <p className="font-semibold mb-1 text-sm">Abonnement Actuel</p>
                        <Badge variant={user.plan === 'Premium' ? 'default' : 'secondary'}>{user.plan}</Badge>
                    </div>
                     <Button variant="outline" size="sm" className="w-full">Gérer l'abonnement</Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Activity/> Utilisation de la plateforme</CardTitle></CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div><p className="font-medium">Dernière activité</p><p className="text-muted-foreground">il y a 2 jours</p></div>
                    <Separator/>
                    <div>
                        <p className="font-medium mb-1">Progression du tutoriel</p>
                        <Progress value={userProgress} className="h-2"/>
                        <p className="text-xs text-muted-foreground mt-2">{Math.round(userProgress)}% complété</p>
                    </div>
                    <Button variant="link" size="sm" className="p-0 h-auto">Voir l'historique d'activité complet</Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
