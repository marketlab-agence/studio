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
  const scope = await getRequestScope();
  const settings = await getSettingsProvider().getSettings(scope);
  const databaseVersion = await getDatabaseVersion();

  return (
    <main className="container mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tighter mb-2">Diagnostic de la plateforme</h1>
      <p className="text-muted-foreground mb-8">
        Vérification de la chaîne serveur → provider → PostgreSQL.
      </p>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Base de données</CardTitle>
              <Badge variant="secondary">Connectée</Badge>
            </div>
            <CardDescription>{databaseVersion}</CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Paramètres applicatifs</CardTitle>
            <CardDescription>
              Lus via <code className="text-xs">SettingsProvider</code> (table{' '}
              <code className="text-xs">settings</code>).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="text-muted-foreground font-medium">Formateur</dt>
              <dd>{settings.instructorName}</dd>
            </dl>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
