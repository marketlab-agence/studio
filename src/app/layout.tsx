import type {Metadata} from 'next';
import { Toaster } from "@/components/ui/toaster"
import { TutorialProvider } from '@/contexts/TutorialContext';
import { AuthProvider } from '@/contexts/AuthContext';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Katalyst | Accélérez votre maîtrise des outils professionnels',
  description: 'Devenez un expert des outils DevOps & AI. Maîtrisez Jira, AWS, GitHub Actions et plus encore grâce à des simulations pratiques.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <head />
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
