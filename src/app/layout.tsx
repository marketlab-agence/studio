import type {Metadata} from 'next';
import { Toaster } from "@/components/ui/toaster"
import { TutorialProvider } from '@/contexts/TutorialContext';
import { AuthProvider } from '@/contexts/AuthContext';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Git Explorer | Formations Interactives pour Outils Professionnels',
  description: 'Maîtrisez Jira, AWS, Trello, et plus encore, grâce à des simulations pratiques. La compétence par la pratique.',
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
              <Footer />
            </div>
          </TutorialProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
