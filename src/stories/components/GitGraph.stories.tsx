import type { Meta, StoryObj } from '@storybook/react';
import { GitGraph } from '@/components/visualizations/GitGraph';

const meta: Meta<typeof GitGraph> = {
  title: 'Composants/Visualisations/GitGraph',
  component: GitGraph,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GitGraph>;

export const Default: Story = {
    render: (args) => <div className="w-full max-w-md mx-auto"><GitGraph {...args} /></div>,
};
