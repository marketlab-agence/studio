'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EyeOff, Eye } from 'lucide-react';

// Basic .gitignore matching logic (simplified for demo)
const isIgnored = (filepath: string, gitignoreContent: string): boolean => {
  const patterns = gitignoreContent.split('\n').filter(p => p.trim() !== '' && !p.startsWith('#'));
  return patterns.some(pattern => {
    // Escape special regex characters from the pattern
    let regexPattern = pattern
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape basic regex characters
        .replace(/\*\*/g, '.*') // Handle globstar for directories
        .replace(/\*/g, '[^/]*'); // Handle star for files/dirs within a path segment

    if (pattern.startsWith('/') && pattern.endsWith('/')) {
         // Pattern like /build/
        regexPattern = `^${regexPattern.slice(1, -1)}(/.*)?$`;
    } else if (pattern.startsWith('/')) {
        // Pattern like /file.log
        regexPattern = `^${regexPattern.slice(1)}`;
    } else if (pattern.endsWith('/')) {
        // Pattern like node_modules/
        regexPattern = `(^|/)${regexPattern.slice(0, -1)}(/|$)`;
    } else if (!pattern.includes('/')) {
        // Pattern like *.log
        regexPattern = `(^|/)${regexPattern}$`;
    }
    
    try {
        return new RegExp(regexPattern).test(filepath);
    } catch (e) {
        console.error("Invalid regex from gitignore pattern:", regexPattern, e);
        return false;
    }
  });
};

export function GitignoreTester() {
  const [gitignoreContent, setGitignoreContent] = useState('node_modules/\n*.log\n.env');
  const [testPath, setTestPath] = useState('node_modules/express/index.js');
  const [result, setResult] = useState<boolean | null>(null);

  const handleTest = () => {
    setResult(isIgnored(testPath, gitignoreContent));
  };
  
  React.useEffect(() => {
    // Initial test run
    handleTest();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="my-6">
      <CardHeader>
        <CardTitle>Simulateur de `.gitignore`</CardTitle>
        <CardDescription>Testez vos règles `.gitignore` pour voir si un chemin de fichier serait ignoré.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Contenu de `.gitignore`</label>
            <Textarea
              value={gitignoreContent}
              onChange={(e) => setGitignoreContent(e.target.value)}
              className="font-code h-32"
            />
          </div>
          <div>
            <label htmlFor="test-path" className="text-sm font-medium mb-1 block">Chemin du fichier à tester</label>
            <Input
              id="test-path"
              value={testPath}
              onChange={(e) => setTestPath(e.target.value)}
              className="font-code"
            />
            <Button onClick={handleTest} className="mt-2 w-full">Tester</Button>
            {result !== null && (
              <div className="mt-4 flex items-center gap-2 p-3 rounded-md bg-muted">
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
