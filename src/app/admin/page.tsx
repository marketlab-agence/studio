
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    BookCopy, DollarSign, LayoutDashboard, Users, Verified, Save, Loader2
} from 'lucide-react';
import { MOCK_USERS, PREMIUM_PLAN_PRICE_EUR } from '@/lib/users';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { getAdminCourses, getSettings, updateSettings } from '@/actions/adminActions';
import type { AppSettings } from '@/types/settings.types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';


export default function AdminDashboardPage() {
  const { user: authUser } = useAuth();
  const { toast } = useToast();

  const [stats, setStats] = useState({
    totalUsers: 0,
    premiumUsers: 0,
    monthlyRevenue: 0,
    activeUsers: 0,
    totalCourses: 0,
  });
  const [dataLoading, setDataLoading] = useState(true);

  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [instructorName, setInstructorName] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    async function loadAdminData() {
        setDataLoading(true);
        
        try {
            const coursesData = await getAdminCourses();
            const settingsData = await getSettings();
            setSettings(settingsData);
            setInstructorName(settingsData.instructorName || '');

            let initialUsers = [...MOCK_USERS];
            if (authUser && !initialUsers.some(u => u.email === authUser.email)) {
                const newUser = {
                    id: authUser.uid,
                    name: authUser.displayName || 'Nouvel Utilisateur',
                    email: authUser.email || '',
                    role: 'Utilisateur',
                    plan: 'Gratuit',
                    status: 'Actif',
                    joined: format(new Date(), 'yyyy-MM-dd'),
                    phone: authUser.phoneNumber || undefined,
                };
                initialUsers.push(newUser as any);
            }
            
            if (initialUsers.length > 0) {
                const totalUsers = initialUsers.length;
                const premiumUsers = initialUsers.filter(u => u.plan === 'Premium').length;
                const monthlyRevenue = premiumUsers * PREMIUM_PLAN_PRICE_EUR;
                const activeUsers = initialUsers.filter(u => u.status === 'Actif').length;
                
                setStats({
                    totalUsers,
                    premiumUsers,
                    monthlyRevenue,
                    activeUsers,
                    totalCourses: coursesData.length,
                });
            }
        } catch (error) {
            console.error("Failed to load admin data", error);
            toast({ title: 'Erreur', description: 'Impossible de charger les données du tableau de bord.', variant: 'destructive'});
        } finally {
            setDataLoading(false);
        }
    }
    loadAdminData();
  }, [authUser, toast]);
  
  const handleSaveSettings = async () => {
    if (!instructorName) return;
    setIsSavingSettings(true);
    try {
        await updateSettings({ instructorName });
        toast({ title: 'Paramètres sauvegardés !', description: 'Le nom de l\'instructeur a été mis à jour.' });
    } catch (e) {
        toast({ title: 'Erreur', description: 'La sauvegarde a échoué.', variant: 'destructive' });
    } finally {
        setIsSavingSettings(false);
    }
  };


  return (
    <>
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-2 rounded-lg">
            <LayoutDashboard className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Tableau de Bord</h1>
            <p className="text-muted-foreground">Vue d'ensemble de votre plateforme Katalyst.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {dataLoading ? (
                <>
                    {[...Array(4)].map((_, i) => (
                       <Card key={i}>
                           <CardHeader className="flex-row items-center justify-between pb-2">
                               <Skeleton className="h-5 w-24" />
                               <Skeleton className="h-4 w-4" />
                            </CardHeader>
                           <CardContent>
                               <Skeleton className="h-8 w-16" />
                               <Skeleton className="h-3 w-28 mt-2" />
                           </CardContent>
                       </Card>
                    ))}
                </>
            ) : (
                <>
                    <Card><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Utilisateurs Totals</CardTitle><Users className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalUsers}</div></CardContent></Card>
                    <Card><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Abonnés Premium</CardTitle><Verified className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{stats.premiumUsers}</div></CardContent></Card>
                    <Card><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Revenus (Mensuel)</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{stats.monthlyRevenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR'})}</div></CardContent></Card>
                    <Card><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Formations Actives</CardTitle><BookCopy className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalCourses}</div></CardContent></Card>
                </>
            )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader>
                    <CardTitle>Gestion des Formations</CardTitle>
                    <CardDescription>Accédez à la bibliothèque des formations pour créer, modifier et publier des cours.</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2">
                    <Button asChild><Link href="/admin/courses">Gérer les formations</Link></Button>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Gestion des Utilisateurs</CardTitle>
                    <CardDescription>Gérez les utilisateurs, leurs rôles et leurs abonnements.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Button disabled>Bientôt disponible</Button>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Paramètres</CardTitle>
                    <CardDescription>Gérez les paramètres globaux de la plateforme.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="instructorName">Nom de l'instructeur</Label>
                        <Input 
                            id="instructorName" 
                            value={instructorName} 
                            onChange={(e) => setInstructorName(e.target.value)}
                            disabled={dataLoading}
                         />
                    </div>
                    <Button onClick={handleSaveSettings} disabled={isSavingSettings || dataLoading || !instructorName}>
                        {isSavingSettings ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Sauvegarder
                    </Button>
                </CardContent>
            </Card>
        </div>
      </>
  );
}
