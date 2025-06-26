import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Terminal } from 'lucide-react';

export function GitCommandSimulator() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-primary"/>
            Simulateur de Commandes Git
        </CardTitle>
        <CardDescription>
            Entrez une commande Git ci-dessous pour voir son effet simulé.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input placeholder="git clone ..." className="font-code"/>
          <Button>Exécuter</Button>
        </div>
        <div className="mt-4 p-4 bg-muted rounded-md font-code text-sm min-h-[100px]">
          <span className="text-muted-foreground">$</span> sortie de la commande...
        </div>
      </CardContent>
    </Card>
  );
}
