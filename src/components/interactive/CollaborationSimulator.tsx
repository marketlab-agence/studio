import React from 'react';
import { Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function CollaborationSimulator() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Simulateur de Collaboration
        </CardTitle>
        <CardDescription>
          Simulez un flux de travail collaboratif avec plusieurs contributeurs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="font-semibold">Contributeurs actifs :</p>
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                    <AvatarFallback>U1</AvatarFallback>
                </Avatar>
                <span>Utilisateur 1 (vous)</span>
            </div>
            <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                    <AvatarFallback>U2</AvatarFallback>
                </Avatar>
                <span>Utilisateur 2</span>
            </div>
        </div>
        <div className="flex gap-2">
            <Button variant="outline">Simuler un 'push' de l'Utilisateur 2</Button>
            <Button>Simuler un 'pull'</Button>
        </div>
      </CardContent>
    </Card>
  );
}
