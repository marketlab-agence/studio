import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function UndoCommandComparison() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparaison des Commandes d'Annulation</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Contenu pour comparer `reset`, `revert`, et `checkout`.</p>
      </CardContent>
    </Card>
  );
}
