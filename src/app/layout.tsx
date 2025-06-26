import type {Metadata} from 'next';
import { Toaster } from "@/components/ui/toaster"
import { TutorialProvider } from '@/contexts/TutorialContext';
import { AuthProvider } from '@/contexts/AuthContext';
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
        <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Inter:wght@400;500;600;700&family=Source+Code+Pro:wght@400;500;600&display=swap" rel="stylesheet"></link>
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <TutorialProvider>
            <div className="flex min-h-screen w-full flex-col">
              <Header />
              {children}
            </div>
          </TutorialProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
