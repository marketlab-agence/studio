import type { Meta, StoryObj } from '@storybook/react';
import { CommitTimeline } from '@/components/visualizations/CommitTimeline';

const meta: Meta<typeof CommitTimeline> = {
  title: 'Composants/Visualisations/CommitTimeline',
  component: CommitTimeline,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CommitTimeline>;

export const Default: Story = {
    render: (args) => <div className="w-full max-w-md mx-auto"><CommitTimeline {...args} /></div>,
};
