import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { CreditCard, PlusCircle, ChevronRight } from 'lucide-react';
import { PLANS_DATA } from '@/lib/plans';

export const dynamic = 'force-dynamic';

export default function AdminSubscriptionsPage() {
  const plans = Object.entries(PLANS_DATA).map(([id, plan]) => ({ id, ...plan }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin" className="hover:text-primary">Admin</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-semibold text-foreground">Abonnements</span>
      </div>
        
      <div className="flex justify-between items-start">
         <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-2 rounded-lg">
                <CreditCard className="h-8 w-8 text-primary" />
            </div>
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Gestion des Abonnements</h1>
                <p className="text-muted-foreground">Gérez les plans d'abonnement de la plateforme.</p>
            </div>
        </div>
        <Button asChild>
          <Link href="/admin/subscriptions/create">
            <PlusCircle className="mr-2 h-4 w-4" /> Créer un Plan
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tous les plans</CardTitle>
          <CardDescription>
            Liste de tous les plans d'abonnement disponibles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom du Plan</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Période de facturation</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map(plan => (
                  <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell>{plan.price > 0 ? `${plan.price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR'})}` : 'Gratuit'}</TableCell>
                  <TableCell className="capitalize">{plan.billingPeriod === 'monthly' ? 'Mensuel' : plan.billingPeriod === 'yearly' ? 'Annuel' : 'Unique'}</TableCell>
                  <TableCell>
                    <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/subscriptions/create?plan=${plan.id}`}>Modifier</Link>
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
