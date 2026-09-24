
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateProfileRequest } from '@/lib/auth/client';

const accountFormSchema = z.object({
  firstName: z.string().min(2, { message: 'Le prénom doit contenir au moins 2 caractères.' }),
  lastName: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères.' }),
  email: z.string().email({ message: "L'adresse e-mail n'est pas valide." }),
  phone: z.string().optional(),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

export default function AccountPage() {
  const { user, loading, refreshSession } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form with default values
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    },
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Populate form with user data once available
  useEffect(() => {
    if (user) {
      const [firstName, ...lastNameParts] = (user.name || '').split(' ');
      const lastName = lastNameParts.join(' ');

      form.reset({
        firstName: firstName || '',
        lastName: lastName || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user, form]);

  async function onSubmit(data: AccountFormValues) {
    if (!user) return;
    setIsSaving(true);

    try {
        // Le nom et le téléphone sont enregistrés côté serveur. L'email n'est
        // **pas** modifiable ici : en changer exige de vérifier la nouvelle
        // adresse par un lien, sans quoi on pourrait s'approprier l'identité
        // d'un tiers ou verrouiller un compte par erreur.
        const result = await updateProfileRequest({
            name: `${data.firstName} ${data.lastName}`.trim(),
            phone: data.phone,
        });

        if (!result.ok) {
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: result.message,
            });
            return;
        }

        // L'état local est rechargé depuis le serveur, plutôt que corrigé à la
        // main : c'est la base qui fait foi.
        await refreshSession();

        toast({
            title: 'Profil mis à jour',
            description: 'Vos informations ont été sauvegardées avec succès.',
        });

        router.refresh();

    } catch (error) {
        console.error("Erreur de mise à jour du profil:", error);
        toast({
            variant: 'destructive',
            title: 'Erreur',
            description: 'La mise à jour de votre profil a échoué.',
        });
    } finally {
        setIsSaving(false);
    }
  }
  
  if (loading || !user) {
      return (
          <main className="flex-1 flex flex-col items-center justify-center p-4">
              <div className="flex items-center text-muted-foreground">
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  <span>Chargement du compte...</span>
              </div>
          </main>
      );
  }

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-lg">
                <User className="h-8 w-8 text-primary" />
            </div>
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Mon Compte</h1>
                <p className="text-muted-foreground">Gérez vos informations personnelles et de certificat.</p>
            </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informations Personnelles</CardTitle>
            <CardDescription>
              Ces informations seront utilisées pour la génération de votre certificat.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prénom</FormLabel>
                        <FormControl>
                          <Input placeholder="Votre prénom" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom</FormLabel>
                        <FormControl>
                          <Input placeholder="Votre nom" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Votre email" {...field} readOnly disabled />
                      </FormControl>
                       <FormDescription>
                        L'adresse e-mail ne peut pas être modifiée.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numéro de téléphone (facultatif)</FormLabel>
                      <FormControl>
                        <Input placeholder="+33 6 12 34 56 78" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sauvegarder les modifications
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
