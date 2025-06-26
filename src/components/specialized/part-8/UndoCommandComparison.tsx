import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';

const commands = [
  {
    command: 'git reset',
    useCase: "Annuler des commits locaux (privés) qui n'ont pas encore été partagés.",
    safety: 'Dangereux (si partagé)',
    safetyIcon: AlertTriangle,
    safetyColor: 'text-destructive',
    description: "Déplace le pointeur de la branche (HEAD) vers un commit antérieur, réécrivant ainsi l'historique. Les options `--soft`, `--mixed`, et `--hard` contrôlent ce qu'il advient des modifications dans la zone de staging et le répertoire de travail.",
  },
  {
    command: 'git revert',
    useCase: "Annuler un commit qui a déjà été partagé sur une branche distante.",
    safety: 'Sûr',
    safetyIcon: CheckCircle,
    safetyColor: 'text-green-500',
    description: "Crée un NOUVEAU commit qui applique les changements inverses du commit spécifié. Cela n'efface pas l'historique, ce qui en fait la méthode la plus sûre pour annuler des changements sur des branches publiques.",
  },
  {
    command: 'git restore',
    useCase: "Commande moderne et plus claire pour annuler les modifications de fichiers (remplace `checkout -- <file>`).",
    safety: 'Attention',
    safetyIcon: HelpCircle,
    safetyColor: 'text-yellow-500',
    description: "Similaire à `checkout -- <file>`, `restore` est utilisé pour annuler les modifications. `git restore <file>` annule les modifications dans le répertoire de travail, et `git restore --staged <file>` retire un fichier de la zone de staging.",
  },
];

export function UndoCommandComparison() {
  return (
    <Card className="my-6">
      <CardHeader>
        <CardTitle>Comparaison des Commandes d'Annulation</CardTitle>
        <CardDescription>
          Git offre plusieurs façons de revenir en arrière. Choisir la bonne commande est crucial.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Commande</TableHead>
                <TableHead>Quand l'utiliser ?</TableHead>
                <TableHead>Niveau de sécurité</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commands.map((cmd) => (
                <TableRow key={cmd.command}>
                  <TableCell className="font-mono font-bold align-top">
                    {cmd.command}
                  </TableCell>
                  <TableCell className="text-sm align-top max-w-xs">{cmd.useCase}</TableCell>
                   <TableCell className="align-top">
                    <div className={`flex items-center gap-2 font-semibold ${cmd.safetyColor}`}>
                        <cmd.safetyIcon className="h-4 w-4" />
                        <span>{cmd.safety}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground align-top">{cmd.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
