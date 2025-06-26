import React from 'react';
import { Lightbulb, History, GitCompare, ArrowLeftRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const concepts = [
    {
        icon: History,
        title: "Retour en Arrière",
        description: "Revenez facilement à n'importe quelle version précédente de votre projet si quelque chose ne va pas."
    },
    {
        icon: GitCompare,
        title: "Historique Complet",
        description: "Gardez une trace de chaque modification, qui l'a faite, et pourquoi elle a été faite."
    },
    {
        icon: ArrowLeftRight,
        title: "Comparaisons",
        description: "Visualisez exactement ce qui a changé entre deux versions d'un fichier, ligne par ligne."
    }
]

export function ConceptExplanation() {
  return (
    <div className="my-8">
        <h3 className="text-xl font-bold mb-4">Pourquoi le Versioning est Important ?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {concepts.map(concept => (
                <Card key={concept.title} className="bg-muted/50">
                    <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                        <div className="p-2 bg-primary/10 rounded-full">
                           <concept.icon className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-lg font-semibold">{concept.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{concept.description}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    </div>
  );
}
