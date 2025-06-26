import { Folder, FileText, FileCode, File as FileIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useTutorial } from '@/contexts/TutorialContext';
import { FileNode as FileNodeType } from '@/types/git.types';
import { cn } from '@/lib/utils';


const ICONS = {
  folder: <Folder className="h-4 w-4 text-primary" />,
  file: <FileIcon className="h-4 w-4 text-muted-foreground" />,
  text: <FileText className="h-4 w-4 text-muted-foreground" />,
  code: <FileCode className="h-4 w-4 text-accent" />,
}

function renderTree(nodes: FileNodeType[], level = 0) {
  return (
    <ul className="space-y-1">
      {nodes.map((node) => (
        <li key={node.path} style={{ paddingLeft: `${level * 1.5}rem` }}>
          <div className={cn(
            "flex items-center gap-2 rounded-md py-1 px-2 hover:bg-muted",
            node.status === 'untracked' && 'text-yellow-400',
            node.status === 'staged' && 'text-green-400',
          )}>
            {node.type === 'folder' ? ICONS.folder : ICONS.file}
            <span className="font-code text-sm">{node.path}</span>
          </div>
          {node.children && renderTree(node.children, level + 1)}
        </li>
      ))}
    </ul>
  );
}

export function FileTreeViewer() {
  const { filesystem } = useTutorial();

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="p-2 pt-0">
        <CardTitle className="text-base">Arborescence des Fichiers</CardTitle>
      </CardHeader>
      <CardContent className="p-2 bg-muted rounded-md min-h-[150px]">
        {filesystem.length > 0 ? renderTree(filesystem) : (
          <p className="text-sm text-muted-foreground text-center py-10">Le système de fichiers est vide.</p>
        )}
      </CardContent>
    </Card>
  );
}
