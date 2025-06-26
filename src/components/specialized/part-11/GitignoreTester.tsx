'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { EyeOff, Eye } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

// Simplified .gitignore matching logic for the demo
const isIgnored = (filepath: string, gitignoreContent: string): boolean => {
  const patterns = gitignoreContent.split('\n').filter(p => p.trim() !== '' && !p.startsWith('#'));
  
  return patterns.some(pattern => {
    pattern = pattern.trim();
    
    // Rule for directories (e.g., "node_modules/")
    if (pattern.endsWith('/')) {
      const dir = pattern.slice(0, -1);
      return filepath.startsWith(dir + '/') || filepath === dir;
    }
    
    // Rule for wildcard extensions (e.g., "*.log")
    if (pattern.startsWith('*.')) {
      const ext = pattern.slice(1); // includes the dot
      return filepath.endsWith(ext);
    }
    
    // Rule for specific files (e.g., ".env") or files in any directory
    // This is a simplification. A real gitignore has more complex rules.
    return filepath.endsWith('/' + pattern) || filepath === pattern;
  });
};


export function GitignoreTester() {
  const [gitignoreContent, setGitignoreContent] = useState('node_modules/\n*.log\n.env');
  const [testPath, setTestPath] = useState('node_modules/express/index.js');
  const [result, setResult] = useState<boolean | null>(null);
  
  const debouncedGitignore = useDebounce(gitignoreContent, 300);
  const debouncedTestPath = useDebounce(testPath, 300);

  useEffect(() => {
    setResult(isIgnored(debouncedTestPath, debouncedGitignore));
  }, [debouncedTestPath, debouncedGitignore]);


  return (
    <Card className="my-6">
      <CardHeader>
        <CardTitle>Simulateur de `.gitignore`</CardTitle>
        <CardDescription>Testez vos règles `.gitignore` pour voir si un chemin de fichier serait ignoré. Le résultat se met à jour automatiquement.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Contenu de `.gitignore`</label>
            <Textarea
              value={gitignoreContent}
              onChange={(e) => setGitignoreContent(e.target.value)}
              className="font-code h-48"
            />
          </div>
          <div className="space-y-4">
            <div>
              <label htmlFor="test-path" className="text-sm font-medium mb-1 block">Chemin du fichier à tester</label>
              <Input
                id="test-path"
                value={testPath}
                onChange={(e) => setTestPath(e.target.value)}
                className="font-code"
              />
            </div>
            {result !== null && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-muted">
                {result ? <EyeOff className="h-5 w-5 text-red-400" /> : <Eye className="h-5 w-5 text-green-400" />}
                <p className="font-semibold">
                  Le fichier est {result ? 'ignoré' : 'suivi'}.
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
