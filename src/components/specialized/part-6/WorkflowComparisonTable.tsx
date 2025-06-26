
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, GitBranch, Minus } from 'lucide-react';

const workflows = [
  {
    name: 'GitFlow',
    description: 'Workflow très structuré avec des branches dédiées pour les fonctionnalités, les releases et les hotfixes.',
    bestFor: 'Projets avec un cycle de release planifié et plusieurs versions maintenues en parallèle.',
    pros: ['Forte isolation entre les développements', 'Processus de release clair et contrôlé', 'Idéal pour la maintenance des anciennes versions'],
    cons: ['Complexe à mettre en place et à suivre', 'Peut ralentir le cycle de développement', "Historique de commits complexe avec beaucoup de fusions"],
  },
  {
    name: 'GitHub Flow',
    description: 'Workflow plus simple où `main` est toujours déployable. Les features sont développées sur des branches et fusionnées via des Pull Requests.',
    bestFor: 'Projets web et applications avec déploiement continu.',
    pros: ['Simple et facile à comprendre', 'Favorise l\'intégration et le déploiement continus (CI/CD)', 'Historique linéaire et propre'],
    cons: ["Moins adapté pour gérer plusieurs versions en production", "Nécessite une bonne couverture de tests"],
  },
  {
    name: 'Trunk-Based Development',
    description: "Tous les développeurs travaillent sur une seule branche principale (`trunk` ou `main`). Les changements sont petits et intégrés fréquemment.",
    bestFor: 'Équipes expérimentées avec une forte culture de CI/CD et de tests automatisés.',
    pros: ['Intégration continue maximale', 'Feedback rapide', 'Pas de conflits de fusion complexes'],
    cons: ['Nécessite une discipline d\'équipe très élevée', 'Le `trunk` doit toujours être stable', 'Difficile à mettre en place sans une suite de tests robuste'],
  },
];

export function WorkflowComparisonTable() {
  return (
    <Card className="my-6">
      <CardHeader>
        <CardTitle>Tableau Comparatif des Workflows Git</CardTitle>
        <CardDescription>Comparez les approches populaires de gestion de branches pour choisir celle qui convient à votre projet.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Workflow</TableHead>
                <TableHead>Idéal Pour</TableHead>
                <TableHead>Avantages</TableHead>
                <TableHead>Inconvénients</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workflows.map((flow) => (
                <TableRow key={flow.name}>
                  <TableCell className="font-bold align-top">
                    <div className="flex items-center gap-2">
                        <GitBranch className="h-5 w-5 text-primary" />
                        <div>
                            {flow.name}
                            <p className="text-xs font-normal text-muted-foreground mt-1 max-w-xs">{flow.description}</p>
                        </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground align-top max-w-xs">{flow.bestFor}</TableCell>
                  <TableCell className="align-top">
                    <ul className="space-y-2">
                      {flow.pros.map(pro => <li key={pro} className="flex items-start gap-2 text-sm"><Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> {pro}</li>)}
                    </ul>
                  </TableCell>
                  <TableCell className="align-top">
                     <ul className="space-y-2">
                      {flow.cons.map(con => <li key={con} className="flex items-start gap-2 text-sm"><Minus className="h-4 w-4 text-destructive mt-0.5 shrink-0" /> {con}</li>)}
                    </ul>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
