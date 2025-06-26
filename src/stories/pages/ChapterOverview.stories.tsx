import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

// Ce composant n'existe pas encore, nous créons un placeholder pour la story.
const ChapterOverviewPlaceholder = () => (
  <div className="p-8">
    <h1 className="text-4xl font-bold mb-4">Aperçu du Chapitre</h1>
    <p className="text-muted-foreground mb-8">Ceci est une page de démonstration pour un aperçu de chapitre.</p>
    <div className="grid gap-4 md:grid-cols-2">
        <Card><CardHeader><CardTitle>Leçon 1</CardTitle></CardHeader><CardContent>Contenu...</CardContent></Card>
        <Card><CardHeader><CardTitle>Leçon 2</CardTitle></CardHeader><CardContent>Contenu...</CardContent></Card>
        <Card><CardHeader><CardTitle>Exercice</CardTitle></CardHeader><CardContent>Contenu...</CardContent></Card>
        <Card><CardHeader><CardTitle>Quiz</CardTitle></CardHeader><CardContent>Contenu...</CardContent></Card>
    </div>
  </div>
);

const meta: Meta<typeof ChapterOverviewPlaceholder> = {
  title: 'Pages/Aperçu du Chapitre',
  component: ChapterOverviewPlaceholder,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof ChapterOverviewPlaceholder>;

export const Default: Story = {};
