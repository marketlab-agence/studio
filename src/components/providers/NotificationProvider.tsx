'use client';
import React, { createContext, useContext, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

type NotificationContextType = {
  showNotification: (options: { title: string, description: string }) => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  const showNotification = (options: { title: string, description: string }) => {
    toast({
      title: options.title,
      description: options.description,
    });
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
