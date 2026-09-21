'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

/**
 * Demande de réinitialisation de mot de passe (REQ-AUTH-06).
 *
 * **Premier point d'entrée des comptes repris de Firebase** : leurs mots de
 * passe n'ont pas pu être exportés, ils ne peuvent donc pas se connecter. Ce
 * formulaire est leur seule voie d'accès.
 *
 * Le message de confirmation est le même que l'adresse existe ou non : c'est le
 * serveur qui le décide, et cette page se contente de l'afficher.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload.message ?? 'La demande n’a pas pu aboutir. Réessayez.');
        return;
      }

      setMessage(payload.message);
    } catch {
      setError('Impossible de joindre le serveur. Vérifiez votre connexion.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          {/* Un vrai titre de niveau 1 : `CardTitle` produit un `div`, ce qui
              laisse la page sans structure de titres (WCAG 2.2 AA). */}
          <h1 className="text-2xl font-semibold leading-none tracking-tight">
            Mot de passe oublié
          </h1>
          <CardDescription>
            Indiquez votre adresse : nous vous enverrons un lien pour définir un nouveau mot de passe.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message ? (
            // `role="status"` : le message est annoncé par les lecteurs d'écran,
            // qui ne verraient sinon aucun changement après la soumission.
            <p role="status" className="text-sm text-muted-foreground">
              {message}
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Envoyer le lien'}
              </Button>
            </form>
          )}

          <div className="text-center text-sm">
            <Link href="/login" className="underline">
              Retour à la connexion
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
