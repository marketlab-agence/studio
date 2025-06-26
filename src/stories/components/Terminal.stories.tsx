import type { Meta, StoryObj } from '@storybook/react';
import { Terminal } from '@/components/terminal';

const meta: Meta<typeof Terminal> = {
  title: 'Composants/Terminal',
  component: Terminal,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  }
};

export default meta;
type Story = StoryObj<typeof Terminal>;

export const Default: Story = {
  args: {
    context: "Bienvenue dans le terminal de démonstration !",
    initialCommand: "ls -la"
  },
};
