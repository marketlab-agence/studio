import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { CodeBlock } from '@/components/ui/CodeBlock';

const steps = [
    {
        title: "Étape 1 : Identifier le conflit",
        content: "Après une tentative de fusion (`git merge` ou `git pull`), Git vous avertira s'il y a un conflit. La commande `git status` vous montrera les fichiers qui sont en état de 'conflit de fusion' (unmerged paths).",
        code: `git status
> On branch main
> You have unmerged paths.
>   (fix conflicts and run "git commit")
>
> Unmerged paths:
>   (use "git add <file>..." to mark resolution)
>       both modified:   style.css`
    },
    {
        title: "Étape 2 : Ouvrir le(s) fichier(s) en conflit",
        content: "Ouvrez chaque fichier listé dans votre éditeur de code. Vous y trouverez les marqueurs de conflit insérés par Git.",
        code: `/* style.css */
<<<<<<< HEAD
  color: blue;
=======
  color: red;
>>>>>>> feature-branch`
    },
    {
        title: "Étape 3 : Résoudre le conflit",
        content: "C'est l'étape manuelle. Vous devez modifier le fichier pour ne garder que le code final souhaité. Supprimez les marqueurs de conflit (`<<<<<<<`, `=======`, `>>>>>>>`) ainsi que le code que vous ne voulez pas conserver. Par exemple, si vous voulez garder la couleur rouge :",
        code: `/* style.css */
  color: red;`
    },
    {
        title: "Étape 4 : Ajouter le fichier résolu au Staging",
        content: "Une fois que vous avez résolu le conflit dans un fichier et l'avez sauvegardé, vous devez informer Git que le conflit est résolu en utilisant la commande `git add`.",
        code: `git add style.css`
    },
    {
        title: "Étape 5 : Finaliser la fusion",
        content: "Lorsque tous les conflits sont résolus et que tous les fichiers concernés ont été 'stagés' avec `git add`, vous pouvez finaliser la fusion en créant un commit. Git propose souvent un message de commit par défaut, que vous pouvez utiliser.",
        code: `git commit
# Git ouvrira votre éditeur avec un message comme :
# Merge branch 'feature-branch'
#
# Conflicts:
#   style.css
#
# Vous pouvez simplement sauvegarder et fermer l'éditeur.`
    }
]

export function ResolutionGuide() {
  return (
    <Card className="my-6">
      <CardHeader>
        <CardTitle>Guide Pas-à-Pas de Résolution de Conflits</CardTitle>
        <CardDescription>
          Suivez ces étapes pour résoudre un conflit de fusion comme un pro.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
            {steps.map((step, index) => (
                 <AccordionItem value={`item-${index}`} key={index}>
                    <AccordionTrigger className="text-lg">{step.title}</AccordionTrigger>
                    <AccordionContent>
                        <p className="mb-4">{step.content}</p>
                        <CodeBlock>{step.code}</CodeBlock>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
