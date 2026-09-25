import { getTranslations } from 'next-intl/server';
import { getSettingsProvider, getRequestScope } from '@/lib/providers';
import { getPool } from '@/lib/db/pool';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * Page de vérification de la pile (Walking Skeleton, phase 0.5).
 *
 * Elle prouve de bout en bout : rendu serveur (RSC) → provider → pool → PostgreSQL.
 * Elle n'est pas liée à la navigation publique et pourra devenir une page de
 * diagnostic interne.
 */
export const dynamic = 'force-dynamic';

async function getDatabaseVersion(): Promise<string> {
  const { rows } = await getPool().query<{ version: string }>('SELECT version() AS version');
  return rows[0]?.version?.split(',')[0] ?? 'inconnue';
}

export default async function HealthPage() {
  const t = await getTranslations('health');
  const scope = await getRequestScope();
  const settings = await getSettingsProvider().getSettings(scope);
  const databaseVersion = await getDatabaseVersion();

  return (
    <main className="container mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tighter mb-2">{t('title')}</h1>
      <p className="text-muted-foreground mb-8">
        {t('subtitle')}
      </p>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('database')}</CardTitle>
              <Badge variant="secondary">{t('connected')}</Badge>
            </div>
            <CardDescription>{databaseVersion}</CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('appSettings')}</CardTitle>
            {/*
              La phrase contient deux noms techniques (`SettingsProvider`, `settings`)
              qui ne se traduisent pas. Elle est donc découpée en trois segments
              autour d'eux, plutôt que d'être figée dans une seule clé — un
              traducteur peut ainsi déplacer les segments, mais jamais renommer les
              identifiants de code.
            */}
            <CardDescription>
              {t('settingsSourceBefore')} <code className="text-xs">SettingsProvider</code>{' '}
              {t('settingsSourceMiddle')}{' '}
              <code className="text-xs">settings</code>
              {t('settingsSourceAfter')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="text-muted-foreground font-medium">{t('instructor')}</dt>
              <dd>{settings.instructorName}</dd>
            </dl>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
