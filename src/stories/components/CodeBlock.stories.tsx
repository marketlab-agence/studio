import type { Meta, StoryObj } from '@storybook/react';
import { CodeBlock } from '@/components/ui/CodeBlock';

const meta: Meta<typeof CodeBlock> = {
  title: 'Composants/UI/CodeBlock',
  component: CodeBlock,
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: 'text',
    }
  },
};

export default meta;
type Story = StoryObj<typeof CodeBlock>;

export const Default: Story = {
  args: {
    children: 'git commit -m "Ceci est un exemple de code"',
  },
  render: (args) => <div className="w-full max-w-md mx-auto"><CodeBlock {...args} /></div>,
};

export const MultiLine: Story = {
  args: {
    children: `
function helloWorld() {
  console.log("Bonjour, Monde !");
}
    `,
  },
  render: (args) => <div className="w-full max-w-md mx-auto"><CodeBlock {...args} /></div>,
};
