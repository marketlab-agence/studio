
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from '@/i18n/navigation';
import { CreditCard, PlusCircle, ChevronRight } from 'lucide-react';
import { getPlansAction } from '@/actions/planActions';
import type { SubscriptionPlan } from '@/types/plans.types';
import { getFormatter } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export default async function AdminSubscriptionsPage() {
  const format = await getFormatter();
  const t = await getTranslations('admin');
  const plans = (await getPlansAction()) as SubscriptionPlan[];

  const billingLabels: Record<string, string> = {
    monthly: t('subscriptions.billingMonthly'),
    yearly: t('subscriptions.billingYearly'),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin" className="hover:text-primary">{t('breadcrumbAdmin')}</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-semibold text-foreground">{t('subscriptions.breadcrumb')}</span>
      </div>
        
      <div className="flex justify-between items-start">
         <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-2 rounded-lg">
                <CreditCard className="h-8 w-8 text-primary" />
            </div>
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('subscriptions.title')}</h1>
                <p className="text-muted-foreground">{t('subscriptions.subtitle')}</p>
            </div>
        </div>
        <Button asChild>
          <Link href="/admin/subscriptions/create">
            <PlusCircle className="mr-2 h-4 w-4" /> {t('subscriptions.create')}
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('subscriptions.allTitle')}</CardTitle>
          <CardDescription>
            {t('subscriptions.allDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('subscriptions.columnName')}</TableHead>
                <TableHead>{t('subscriptions.columnPrice')}</TableHead>
                <TableHead>{t('subscriptions.columnBillingPeriod')}</TableHead>
                <TableHead>{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map(plan => (
                  <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell>{plan.price > 0 ? format.number(plan.price, { style: 'currency', currency: 'EUR' }) : t('subscriptions.free')}</TableCell>
                  <TableCell className="capitalize">{billingLabels[plan.billingPeriod] || t('subscriptions.billingOnce')}</TableCell>
                  <TableCell>
                    <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/subscriptions/create?plan=${plan.id}`}>{t('edit')}</Link>
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
