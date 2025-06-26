import React from 'react';
import { GitMerge } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function MergeSimulator() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitMerge className="h-5 w-5 text-primary" />
          Simulateur de Fusion
        </CardTitle>
        <CardDescription>
          Fusionnez des branches et visualisez le résultat.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-sm font-medium">Branche source</label>
                <Select defaultValue="feature-branch">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="feature-branch">feature-branch</SelectItem>
                        <SelectItem value="bug-fix">bug-fix</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Branche cible</label>
                <Select defaultValue="main">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="main">main</SelectItem>
                        <SelectItem value="develop">develop</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
        <Button>
          <GitMerge className="mr-2 h-4 w-4" />
          Simuler la fusion
        </Button>
      </CardContent>
    </Card>
  );
}
