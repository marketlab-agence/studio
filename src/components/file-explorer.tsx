import { Folder, FileText, FileCode } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';

const fileTree = [
  { name: '.git', type: 'folder', children: [{ name: 'config', type: 'file' }, { name: 'HEAD', type: 'file' }] },
  { name: 'src', type: 'folder', children: [{ name: 'app.js', type: 'code' }] },
  { name: 'public', type: 'folder', children: [{ name: 'index.html', type: 'code' }] },
  { name: '.gitignore', type: 'file' },
  { name: 'package.json', type: 'code' },
  { name: 'README.md', type: 'text' },
];

const ICONS = {
  folder: <Folder className="h-4 w-4 text-primary" />,
  file: <FileText className="h-4 w-4 text-muted-foreground" />,
  text: <FileText className="h-4 w-4 text-muted-foreground" />,
  code: <FileCode className="h-4 w-4 text-accent" />,
}

type FileNode = {
  name: string;
  type: 'folder' | 'file' | 'text' | 'code';
  children?: FileNode[];
};

function renderTree(nodes: FileNode[], level = 0) {
  return (
    <ul className="space-y-1">
      {nodes.map((node) => (
        <li key={node.name} style={{ paddingLeft: `${level * 1.5}rem` }}>
          <div className="flex items-center gap-2 rounded-md py-1 px-2 hover:bg-muted">
            {ICONS[node.type]}
            <span className="font-code text-sm">{node.name}</span>
          </div>
          {node.children && renderTree(node.children, level + 1)}
        </li>
      ))}
    </ul>
  );
}

export function FileTreeViewer() {
  return (
    <Card className="my-6">
        <CardHeader>
            <CardTitle>Explorateur de Fichiers</CardTitle>
            <CardDescription>Visualisez la structure de votre projet.</CardDescription>
        </CardHeader>
        <CardContent>
            {renderTree(fileTree)}
        </CardContent>
    </Card>
  );
}
