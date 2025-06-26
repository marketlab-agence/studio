import React from 'react';
import { Stethoscope } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function GitDoctorTool() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-primary" />
          Outil Git Doctor
        </CardTitle>
        <CardDescription>
          Diagnostiquez et réparez les problèmes courants de Git.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="problem-select" className="text-sm font-medium">Quel est votre problème ?</label>
          <Select>
            <SelectTrigger id="problem-select">
              <SelectValue placeholder="Sélectionnez un problème..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lost-commit">J'ai perdu un commit</SelectItem>
              <SelectItem value="bad-commit">J'ai fait un mauvais commit</SelectItem>
              <SelectItem value="detached-head">Je suis en état 'detached HEAD'</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button>
          <Stethoscope className="mr-2 h-4 w-4" />
          Diagnostiquer
        </Button>
      </CardContent>
    </Card>
  );
}
