
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
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
    AlertCircle, BookCopy, CreditCard, DollarSign, LayoutDashboard, LineChart, Loader2, PlusCircle, Search, Settings, Users, Verified
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TUTORIALS } from '@/lib/tutorials';

// Placeholder data - replace with actual data from your backend
const users = [
  { id: 'usr_1', name: 'Alice Martin', email: 'alice.m@example.com', plan: 'Premium', status: 'Actif', joined: '2023-01-15' },
  { id: 'usr_2', name: 'Bob Durand', email: 'bob.d@example.com', plan: 'Gratuit', status: 'Actif', joined: '2023-02-20' },
  { id: 'usr_3', name: 'Carla Dubois', email: 'carla.d@example.com', plan: 'Premium', status: 'Inactif', joined: '2023-03-10' },
  { id: 'usr_4', name: 'David Petit', email: 'david.p@example.com', plan: 'Gratuit', status: 'Actif', joined: '2023-04-05' },
];

// This is a placeholder for a real admin check.
// In a real application, you'd use custom claims with Firebase Auth.
const ADMIN_EMAIL = 'admin@katalyst.com';


export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user || user.email !== ADMIN_EMAIL) {
        router.push('/login'); // Or a generic 403 Forbidden page
      } else {
        setIsAdmin(true);
      }
    }
  }, [user, loading, router]);

  if (loading || !isAdmin) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="flex items-center text-muted-foreground">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          <span>Vérification des accès...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Zone Administrateur</AlertTitle>
            <AlertDescription>
                Vous êtes dans la zone d'administration. Les modifications ici peuvent affecter l'ensemble de l'application.
            </AlertDescription>
        </Alert>

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
                <Card><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Utilisateurs Totals</CardTitle><Users className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">1,254</div></CardContent></Card>
                <Card><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Abonnés Premium</CardTitle><Verified className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">+234</div></CardContent></Card>
                <Card><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Revenus (Mensuel)</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">4,890.50€</div></CardContent></Card>
                <Card><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Taux d'Activité</CardTitle><LineChart className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">+15.2%</div></CardContent></Card>
            </div>
            {/* Add charts or recent activity here */}
          </TabsContent>

          <TabsContent value="courses" className="space-y-4 pt-4">
            <div className="flex justify-end">
                <Button><PlusCircle className="mr-2 h-4 w-4" /> Ajouter une Formation</Button>
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
                            {users.map(u => (
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
      </div>
    </main>
  );
}
