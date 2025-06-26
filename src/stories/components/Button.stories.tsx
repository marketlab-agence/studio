import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@/components/ui/button';
import { GitCommitHorizontal } from 'lucide-react';

const meta: Meta<typeof Button> = {
  title: 'Composants/UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: {
      control: { type: 'select' },
      options: ['default', 'sm', 'lg', 'icon'],
    },
    children: {
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    children: 'Bouton par Défaut',
    variant: 'default',
    size: 'default',
  },
};

export const Destructive: Story = {
  args: {
    children: 'Bouton Destructif',
    variant: 'destructive',
  },
};

export const Outline: Story = {
  args: {
    children: 'Bouton Contours',
    variant: 'outline',
  },
};

export const WithIcon: Story = {
    args: {
        children: 'Commit',
        variant: 'default',
        size: 'default',
    },
    render: (args) => (
        <Button {...args}>
            <GitCommitHorizontal className="mr-2 h-4 w-4" />
            {args.children}
        </Button>
    )
};

export const IconOnly: Story = {
    args: {
        variant: 'outline',
        size: 'icon',
    },
    render: (args) => (
        <Button {...args}>
            <GitCommitHorizontal />
        </Button>
    )
};
