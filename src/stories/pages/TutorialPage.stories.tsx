import type { Meta, StoryObj } from '@storybook/react';
import TutorialPage from '@/app/tutorial/page';

const meta: Meta<typeof TutorialPage> = {
  title: 'Pages/Page du Tutoriel',
  component: TutorialPage,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof TutorialPage>;

export const Default: Story = {
  args: {
    // Props pour la page si nécessaire
  },
};
