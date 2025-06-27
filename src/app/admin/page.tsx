'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
    BookCopy, CreditCard, DollarSign, LayoutDashboard, LineChart, PlusCircle, Search, Settings, Users, Verified
} from 'lucide-react';
import { TUTORIALS } from '@/lib/tutorials';
import { MOCK_USERS, PREMIUM_PLAN_PRICE_EUR } from '@/lib/users';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';


export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    premiumUsers: 0,
    monthlyRevenue: 0,
    activeUsers: 0,
  });
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching data
    setDataLoading(true);
    setTimeout(() => {
        if (MOCK_USERS.length > 0) {
            const totalUsers = MOCK_USERS.length;
            const premiumUsers = MOCK_USERS.filter(u => u.plan === 'Premium').length;
            const monthlyRevenue = premiumUsers * PREMIUM_PLAN_PRICE_EUR;
            const activeUsers = MOCK_USERS.filter(u => u.status === 'Actif').length;
            
            setStats({
                totalUsers,
                premiumUsers,
                monthlyRevenue,
                activeUsers,
            });
        }
        setDataLoading(false);
    }, 800); // 0.8s delay to simulate network
  }, []);

  return (
    <>
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-2 rounded-lg">
            <LayoutDashboard className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Panneau d'Administration</h1>
            <p className="text-muted-foreground">Gérez votre plateforme Katalyst.</p>
          </div>
        </div>

        <Tabs defaultValue="dashboard">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5">
            <TabsTrigger value="dashboard">Tableau de Bord</TabsTrigger>
            <TabsTrigger value="courses">Formations</TabsTrigger>
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="subscriptions">Abonnements</TabsTrigger>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4 pt-4">
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
                        <Card><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Utilisateurs Actifs</CardTitle><LineChart className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{stats.activeUsers}</div><p className="text-xs text-muted-foreground">{stats.totalUsers > 0 ? `${((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}% du total` : 'N/A'}</p></CardContent></Card>
                    </>
                )}
            </div>
            {/* Add charts or recent activity here */}
          </TabsContent>

          <TabsContent value="courses" className="space-y-4 pt-4">
            <div className="flex justify-end">
                <Button asChild>
                    <Link href="/admin/create-course">
                        <PlusCircle className="mr-2 h-4 w-4" /> Créer une Formation
                    </Link>
                </Button>
            </div>
            <Card>
                <CardHeader><CardTitle>Bibliothèque des formations</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Titre</TableHead>
                                <TableHead>Nombre de leçons</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {TUTORIALS.map(t => (
                                <TableRow key={t.id}>
                                    <TableCell className="font-medium">{t.title}</TableCell>
                                    <TableCell>{t.lessons.length}</TableCell>
                                    <TableCell><Badge>Publié</Badge></TableCell>
                                    <TableCell><Button variant="outline" size="sm">Modifier</Button></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4 pt-4">
            <div className="flex items-center gap-2">
                <Input placeholder="Rechercher un utilisateur..." className="max-w-sm"/>
                <Button variant="outline"><Search className="mr-2 h-4 w-4"/>Rechercher</Button>
            </div>
             <Card>
                <CardHeader><CardTitle>Gestion des utilisateurs</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nom</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Inscrit le</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {MOCK_USERS.map(u => (
                                <TableRow key={u.id}>
                                    <TableCell className="font-medium">{u.name}</TableCell>
                                    <TableCell>{u.email}</TableCell>
                                    <TableCell><Badge variant={u.plan === 'Premium' ? 'default' : 'secondary'}>{u.plan}</Badge></TableCell>
                                    <TableCell>{u.status}</TableCell>
                                    <TableCell>{u.joined}</TableCell>
                                    <TableCell><Button variant="outline" size="sm">Gérer</Button></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-4 pt-4">
            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Formule Gratuite</CardTitle>
                        <CardDescription>Accès limité à la plateforme.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                       <p className="text-sm font-medium">Fonctionnalités incluses:</p>
                       <ul className="list-disc pl-5 text-sm text-muted-foreground">
                           <li>Accès au premier chapitre de chaque formation</li>
                           <li>Quiz de fin de chapitre</li>
                       </ul>
                    </CardContent>
                    <CardFooter><Button variant="outline">Gérer le plan</Button></CardFooter>
                </Card>
                 <Card className="border-primary">
                    <CardHeader>
                        <CardTitle>Formule Premium</CardTitle>
                        <CardDescription>Accès complet et fonctionnalités avancées.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                       <p className="text-sm font-medium">Fonctionnalités incluses:</p>
                       <ul className="list-disc pl-5 text-sm text-muted-foreground">
                           <li>Accès à toutes les formations</li>
                           <li>Playground avec IA pour conseils et astuces</li>
                           <li>Intégration GitHub pour commandes en live</li>
                           <li>Certificat de réussite</li>
                       </ul>
                    </CardContent>
                    <CardFooter><Button>Gérer le plan</Button></CardFooter>
                </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 pt-4">
            <Card>
                <CardHeader><CardTitle>Intégrations de Paiement</CardTitle><CardDescription>Connectez Stripe ou PayPal pour gérer les abonnements.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <p className="font-medium">Stripe</p>
                        <Button>Connecter</Button>
                    </div>
                     <div className="flex items-center justify-between p-4 border rounded-lg">
                        <p className="font-medium">PayPal</p>
                        <Button variant="outline">Connecter</Button>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Paramètres de Notification</CardTitle><CardDescription>Configurez les emails envoyés aux utilisateurs (Qualiopi, etc.).</CardDescription></CardHeader>
                <CardContent>
                    <Button>Configurer les modèles d'email</Button>
                </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </>
  );
}
