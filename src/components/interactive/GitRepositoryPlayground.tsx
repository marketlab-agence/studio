import React from 'react';
import { FolderGit, File, Folder } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function GitRepositoryPlayground() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderGit className="h-5 w-5 text-primary" />
          Bac à Sable de Dépôt Git
        </CardTitle>
        <CardDescription>
          Visualisez et interagissez avec un système de fichiers de dépôt simulé.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 bg-muted rounded-md font-code text-sm">
        <ul className="space-y-1">
            <li className="flex items-center gap-2"><Folder className="h-4 w-4 text-yellow-400"/> .git/</li>
            <li className="flex items-center gap-2"><Folder className="h-4 w-4 text-yellow-400"/> src/</li>
            <li className="flex items-center gap-2 ml-4"><File className="h-4 w-4"/> index.js</li>
            <li className="flex items-center gap-2"><File className="h-4 w-4"/> package.json</li>
            <li className="flex items-center gap-2"><File className="h-4 w-4"/> README.md</li>
        </ul>
      </CardContent>
    </Card>
  );
}
