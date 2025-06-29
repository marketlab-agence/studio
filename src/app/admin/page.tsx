
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
    BookCopy, CreditCard, DollarSign, LayoutDashboard, LineChart, PlusCircle, Search, Settings, Users, Verified, Users2
} from 'lucide-react';
import { MOCK_USERS, PREMIUM_PLAN_PRICE_EUR, type MockUser } from '@/lib/users';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { PLANS_DATA } from '@/lib/plans';
import { getAdminCourses } from '@/actions/adminActions';


export default function AdminDashboardPage() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'dashboard';
  const { user: authUser } = useAuth();

  const [stats, setStats] = useState({
    totalUsers: 0,
    premiumUsers: 0,
    monthlyRevenue: 0,
    activeUsers: 0,
  });
  const [dataLoading, setDataLoading] = useState(true);
  
  const [allUsers, setAllUsers] = useState<MockUser[]>([]);
  const [displayedUsers, setDisplayedUsers] = useState<MockUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [allCourses, setAllCourses] = useState<any[]>([]);

  const handleSearch = () => {
    const lowercasedQuery = searchQuery.toLowerCase().trim();
    if (!lowercasedQuery) {
        setDisplayedUsers(allUsers);
        return;
    }
    const filtered = allUsers.filter(user => 
        user.name.toLowerCase().includes(lowercasedQuery) ||
        user.email.toLowerCase().includes(lowercasedQuery) ||
        (user.phone && user.phone.toLowerCase().includes(lowercasedQuery))
    );
    setDisplayedUsers(filtered);
  };

  useEffect(() => {
    if (searchQuery.trim() === '') {
        setDisplayedUsers(allUsers);
    }
  }, [searchQuery, allUsers]);

  useEffect(() => {
    async function loadAdminData() {
        setDataLoading(true);
        
        const coursesData = await getAdminCourses();
        setAllCourses(coursesData);

        let initialUsers = [...MOCK_USERS];
        if (authUser && !initialUsers.some(u => u.email === authUser.email)) {
            const newUser: MockUser = {
                id: authUser.uid,
                name: authUser.displayName || 'Nouvel Utilisateur',
                email: authUser.email || '',
                role: 'Utilisateur',
                plan: 'Gratuit',
                status: 'Actif',
                joined: format(new Date(), 'yyyy-MM-dd'),
                phone: authUser.phoneNumber || undefined,
            };
            initialUsers.push(newUser);
        }
        setAllUsers(initialUsers);
        setDisplayedUsers(initialUsers);

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
            });
        }
        
        setDataLoading(false);
    }
    loadAdminData();
  }, [authUser, searchParams]);

  const freePlan = PLANS_DATA.free;
  const premiumPlan = PLANS_DATA.premium;

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

        <Tabs defaultValue={defaultTab}>
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
                        <Card><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Taux d'Activité</CardTitle><LineChart className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalUsers > 0 ? `${((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}%` : 'N/A'}</div></CardContent></Card>
                    </>
                )}
            </div>
            {/* Add charts or recent activity here */}
          </TabsContent>

          <TabsContent value="courses" className="space-y-4 pt-4">
            <Card>
                <CardHeader>
                    <CardTitle>Bibliothèque des formations</CardTitle>
                    <CardDescription>Gérez toutes les formations de la plateforme, ajoutez-en de nouvelles ou modifiez les existantes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Vous avez actuellement {allCourses.length} formations dans votre bibliothèque.</p>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <Button asChild variant="outline">
                        <Link href="/admin/create-course">
                            <PlusCircle className="mr-2 h-4 w-4" /> Créer une Formation
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/admin/courses">
                            Gérer les formations
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4 pt-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex flex-col sm:flex-row gap-2">
                    <Input 
                        placeholder="Rechercher un utilisateur..." 
                        className="w-full sm:max-w-xs"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                    />
                    <Button variant="outline" className="w-full sm:w-auto" onClick={handleSearch}>
                        <Search className="mr-2 h-4 w-4"/>Rechercher
                    </Button>
                </div>
                <Button asChild variant="outline" className="w-full md:w-auto">
                    <Link href="/admin/roles">
                        <Users2 className="mr-2 h-4 w-4" /> Gérer les Rôles
                    </Link>
                </Button>
            </div>
             <Card>
                <CardHeader><CardTitle>Gestion des utilisateurs</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Prénom</TableHead>
                                <TableHead>Nom</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Mobile</TableHead>
                                <TableHead>Rôle</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Inscrit le</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {displayedUsers.map(u => {
                                const [firstName, ...lastNameParts] = u.name.split(' ');
                                const lastName = lastNameParts.join(' ');
                                
                                const roleVariant = {
                                    'Super Admin': 'destructive',
                                    'Admin': 'default',
                                    'Modérateur': 'secondary',
                                    'Utilisateur': 'outline',
                                }[u.role] as "default" | "secondary" | "outline" | "destructive" | null | undefined;
                                
                                return (
                                <TableRow key={u.id}>
                                    <TableCell className="font-medium">{firstName}</TableCell>
                                    <TableCell className="font-medium">{lastName}</TableCell>
                                    <TableCell>{u.email}</TableCell>
                                    <TableCell>{u.phone || 'N/A'}</TableCell>
                                    <TableCell><Badge variant={roleVariant}>{u.role}</Badge></TableCell>
                                    <TableCell><Badge variant={u.plan === 'Premium' ? 'default' : 'secondary'}>{u.plan}</Badge></TableCell>
                                    <TableCell>{u.status}</TableCell>
                                    <TableCell>{u.joined}</TableCell>
                                    <TableCell>
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={`/admin/users/${u.id}`}>Gérer</Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-6 pt-4">
            <div className="flex justify-end">
                <Button asChild>
                    <Link href="/admin/subscriptions/create">
                        <PlusCircle className="mr-2 h-4 w-4" /> Créer un Plan
                    </Link>
                </Button>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                           <div>
                                <CardTitle>{freePlan.name}</CardTitle>
                                <CardDescription>{freePlan.description}</CardDescription>
                           </div>
                            <div className="text-right">
                                <p className="text-3xl font-bold">{freePlan.price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR'})}</p>
                                <p className="text-xs text-muted-foreground">/ mois</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                       <p className="text-sm font-medium">Fonctionnalités incluses:</p>
                       <ul className="list-disc pl-5 text-sm text-muted-foreground">
                           {freePlan.features.map((feature, i) => <li key={i}>{feature}</li>)}
                       </ul>
                    </CardContent>
                    <CardFooter>
                        <Button asChild variant="outline">
                            <Link href={`/admin/subscriptions/create?plan=free`}>Gérer le plan</Link>
                        </Button>
                    </CardFooter>
                </Card>
                 <Card className="border-primary">
                    <CardHeader>
                         <div className="flex justify-between items-start">
                            <div>
                                <CardTitle>{premiumPlan.name}</CardTitle>
                                <CardDescription>{premiumPlan.description}</CardDescription>
                            </div>
                             <div className="text-right">
                                <p className="text-3xl font-bold">{premiumPlan.price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR'})}</p>
                                <p className="text-xs text-muted-foreground">/ mois</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                       <p className="text-sm font-medium">Fonctionnalités incluses:</p>
                       <ul className="list-disc pl-5 text-sm text-muted-foreground">
                           {premiumPlan.features.map((feature, i) => <li key={i}>{feature}</li>)}
                       </ul>
                    </CardContent>
                    <CardFooter>
                        <Button asChild>
                            <Link href={`/admin/subscriptions/create?plan=premium`}>Gérer le plan</Link>
                        </Button>
                    </CardFooter>
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
