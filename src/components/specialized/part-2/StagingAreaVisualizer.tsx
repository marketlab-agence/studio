import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { File, GitCommitHorizontal, Inbox, Server } from 'lucide-react';

const workingDirectoryFiles = [
    { path: 'index.html', status: 'modified' },
    { path: 'styles.css', status: 'untracked' },
];
const stagedFiles = [
    { path: 'README.md', status: 'staged' },
];
const committedFiles = [
    { path: 'package.json', status: 'committed' },
];

const FileItem = ({ name, status }: { name: string; status: string }) => (
    <div className={cn(
      "flex items-center gap-2 p-2 rounded-md text-sm",
      status === 'untracked' && 'bg-yellow-500/10 text-yellow-300',
      status === 'modified' && 'bg-blue-500/10 text-blue-300',
      status === 'staged' && 'bg-green-500/10 text-green-300',
      status === 'committed' && 'bg-gray-500/10 text-gray-400'
    )}>
      <File className="h-4 w-4" />
      <span>{name}</span>
    </div>
  );

export function StagingAreaVisualizer() {
  return (
    <Card className="my-6 bg-transparent border-border/50">
      <CardHeader>
        <CardTitle>Visualiseur des 3 zones</CardTitle>
        <CardDescription>
          Observez comment les fichiers se déplacent entre le répertoire de travail, la zone de staging et le dépôt.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="rounded-lg border border-dashed border-border p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2"><Inbox className="h-5 w-5 text-yellow-400" />Répertoire de travail</h3>
            <div className="space-y-2 min-h-[50px]">
              {workingDirectoryFiles.length > 0 
                ? workingDirectoryFiles.map(f => <FileItem key={f.path} name={f.path} status={f.status} />)
                : <p className="text-xs text-muted-foreground p-2">Aucun fichier modifié ou non suivi.</p>
              }
            </div>
          </div>
          
          <div className="rounded-lg border border-dashed border-border p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2"><Server className="h-5 w-5 text-green-400" />Zone de Staging</h3>
             <div className="space-y-2 min-h-[50px]">
              {stagedFiles.length > 0 
                ? stagedFiles.map(f => <FileItem key={f.path} name={f.path} status={f.status}/>)
                : <p className="text-xs text-muted-foreground p-2">Aucun fichier préparé pour le commit.</p>
              }
            </div>
          </div>

          <div className="rounded-lg border border-dashed border-border p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2"><GitCommitHorizontal className="h-5 w-5 text-primary" />Dépôt (.git)</h3>
            <div className="space-y-2 min-h-[50px]">
              {committedFiles.length > 0 
                ? committedFiles.map(f => <FileItem key={f.path} name={f.path} status={f.status}/>)
                : <p className="text-xs text-muted-foreground p-2">Aucun fichier validé.</p>
              }
            </div>
          </div>
          
        </div>
      </CardContent>
    </Card>
  );
}
