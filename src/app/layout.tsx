import type {Metadata} from 'next';
import { Toaster } from "@/components/ui/toaster"
import { TutorialProvider } from '@/contexts/TutorialContext';
import './globals.css';
import { Header } from '@/components/layout/Header';

export const metadata: Metadata = {
  title: 'Git & GitHub Interactif',
  description: 'Un tutoriel interactif sur Git et GitHub.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"></link>
        <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;500;600&display=swap" rel="stylesheet"></link>
      </head>
      <body className="font-body antialiased">
        <TutorialProvider>
          <div className="flex min-h-screen w-full flex-col">
            <Header />
            {children}
          </div>
        </TutorialProvider>
        <Toaster />
      </body>
    </html>
  );
}
