import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const meta: Meta<typeof Card> = {
  title: 'Composants/UI/Card',
  component: Card,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: (args) => (
    <Card {...args} className="w-[350px]">
      <CardHeader>
        <CardTitle>Titre de la Carte</CardTitle>
        <CardDescription>Description de la carte, donne plus de contexte.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Contenu principal de la carte. Peut contenir n'importe quel élément React.</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Annuler</Button>
        <Button>Déployer</Button>
      </CardFooter>
    </Card>
  ),
};
