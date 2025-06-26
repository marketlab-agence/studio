import type { Meta, StoryObj } from '@storybook/react';
import { BranchDiagram } from '@/components/visualizations/BranchDiagram';

const meta: Meta<typeof BranchDiagram> = {
  title: 'Composants/Visualisations/BranchDiagram',
  component: BranchDiagram,
  tags: ['autodocs'],
  argTypes: {
    // Définissez ici les contrôles de Storybook si nécessaire
  },
};

export default meta;
type Story = StoryObj<typeof BranchDiagram>;

export const Default: Story = {
  args: {
    // Les props par défaut pour votre composant
  },
  render: (args) => <div className="w-full max-w-md mx-auto"><BranchDiagram {...args} /></div>,
};
