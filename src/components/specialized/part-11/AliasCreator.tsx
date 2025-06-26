'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function AliasCreator() {
  const [alias, setAlias] = useState('st');
  const [command, setCommand] = useState('status');
  const [generatedCommand, setGeneratedCommand] = useState('');
  const { toast } = useToast();

  const handleGenerate = () => {
    if (!alias.trim() || !command.trim()) {
        toast({ title: 'Erreur', description: 'Veuillez remplir les deux champs.', variant: 'destructive'});
        return;
    }
    const fullCommand = `git config --global alias.${alias.trim()} "${command.trim()}"`;
    setGeneratedCommand(fullCommand);
  };
  
  const handleCopyToClipboard = () => {
    if (generatedCommand) {
        navigator.clipboard.writeText(generatedCommand);
        toast({ title: 'Copié !', description: 'La commande a été copiée dans le presse-papiers.'});
    }
  }

  return (
    <Card className="my-6">
      <CardHeader>
        <CardTitle>Assistant de Création d'Alias Git</CardTitle>
        <CardDescription>Créez des raccourcis pour vos commandes Git les plus utilisées.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4 items-end">
          <div>
            <label htmlFor="alias" className="text-sm font-medium">Alias (raccourci)</label>
            <Input id="alias" value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="ex: co" />
          </div>
          <div>
            <label htmlFor="command" className="text-sm font-medium">Commande Git complète</label>
            <Input id="command" value={command} onChange={(e) => setCommand(e.target.value)} placeholder="ex: checkout" />
          </div>
        </div>
        <Button onClick={handleGenerate} className="w-full">
            <Wand2 className="mr-2 h-4 w-4" />
            Générer la commande de l'alias
        </Button>
        {generatedCommand && (
          <div>
            <p className="text-sm font-medium mb-2">Copiez et exécutez cette commande dans votre terminal :</p>
            <CodeBlock className="flex justify-between items-center">
                <span>{generatedCommand}</span>
                <Button variant="ghost" size="sm" onClick={handleCopyToClipboard}>Copier</Button>
            </CodeBlock>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
