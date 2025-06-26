import React from 'react';
import { CodeBlock } from '@/components/ui/CodeBlock';

export function LessonContent() {
  return (
    <article className="prose dark:prose-invert max-w-none">
      <h2>Contenu de la Leçon</h2>
      <p>
        Le contrôle de version est un système qui enregistre les modifications apportées à un fichier ou à un ensemble de fichiers au fil du temps afin que vous puissiez rappeler des versions spécifiques plus tard.
      </p>
      <CodeBlock>
        {'git --version'}
      </CodeBlock>
      <p>
        Ceci est un exemple de texte de leçon expliquant un concept fondamental. Il peut inclure du texte, des images et des blocs de code pour illustrer les points.
      </p>
    </article>
  );
}
