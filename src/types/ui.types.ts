export type Notification = {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'success' | 'warning' | 'error';
};

export type ModalState = {
  isOpen: boolean;
  content: React.ReactNode;
};
