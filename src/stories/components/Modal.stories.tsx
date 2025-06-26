import type { Meta, StoryObj } from '@storybook/react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { DialogClose } from '@/components/ui/dialog';

const meta: Meta<typeof Modal> = {
  title: 'Composants/UI/Modal',
  component: Modal,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  args: {
    trigger: <Button>Ouvrir la Modale</Button>,
    title: 'Titre de la Modale',
    description: 'Ceci est la description de la modale. Elle peut être omise.',
    children: <p>Ceci est le contenu principal de la modale. Vous pouvez y mettre ce que vous voulez.</p>,
    footer: (
        <>
            <DialogClose asChild>
                <Button variant="outline">Fermer</Button>
            </DialogClose>
            <Button>Accepter</Button>
        </>
    )
  },
};
