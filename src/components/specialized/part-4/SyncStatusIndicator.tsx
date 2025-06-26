import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function SyncStatusIndicator() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Indicateur de Statut de Synchronisation</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Contenu pour l'indicateur de statut de synchronisation (à jour, en avance, en retard).</p>
      </CardContent>
    </Card>
  );
}
