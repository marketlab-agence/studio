'use client';

import { useToast } from "@/hooks/use-toast";

type NotificationOptions = {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
};

/**
 * Hook pour afficher des notifications (toasts).
 */
export function useNotifications() {
    const { toast } = useToast();

    const showNotification = (options: NotificationOptions) => {
        toast({
            title: options.title,
            description: options.description,
            variant: options.variant,
        });
    };

    return { showNotification };
}
