/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { doc, setDoc } from 'firebase/firestore';

const signupSchema = z.object({
    email: z.string().email({
        message: "Veuillez entrer une adresse email valide.",
    }),
    password: z.string().min(6, {
        message: "Le mot de passe doit contenir au moins 6 caractères.",
    }),
    displayName: z.string().min(2, {
      message: "Le nom à afficher doit contenir au moins 2 caractères."
    }),
    acceptTerms: z.boolean().refine(val => val === true, {
      message: "Vous devez accepter les termes et conditions."
    }),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, handleSubmit, formState: { errors }, setError } = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
    });

    const { toast } = useToast();

    const onSubmit = async ({ email, password, displayName }: SignupFormValues) => {
        setIsSubmitting(true);
        if (!auth || !db) return;
        
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, { displayName: displayName });

            const userDocRef = doc(db, 'users', userCredential.user.uid);
            await setDoc(userDocRef, {
                id: userCredential.user.uid,
                name: displayName,
                email: email,
                plan: 'Gratuit',
                status: 'Actif',
                role: 'Utilisateur',
                joined: new Date().toISOString().split('T')[0],
            });
            
            toast({ title: "Inscription réussie !", description: "Votre compte a été créé avec succès." });
            router.push('/dashboard');
        } catch (error: any) {
            console.error(error);
            let errorMessage = "Une erreur est survenue lors de l'inscription.";
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = "Cette adresse email est déjà utilisée.";
            } else if (error.code === 'auth/weak-password') {
                 errorMessage = "Le mot de passe est trop faible.";
            } else if (error.code === 'auth/invalid-email') {
                 errorMessage = "L'adresse email n'est pas valide.";
            }
             setError('email', { type: 'manual', message: errorMessage });

            toast({
                variant: 'destructive',
                title: "Erreur d'inscription",
                description: errorMessage,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

     // Add a useEffect to show validation errors from Zod after first render/submit attempt
     useEffect(() => {
        if (Object.keys(errors).length > 0) {
            const firstErrorKey = Object.keys(errors)[0] as keyof SignupFormValues;
            const errorMessage = errors[firstErrorKey]?.message;
            if (errorMessage) {
                toast({
                    variant: "destructive",
                    title: "Erreur de validation",
                    description: errorMessage,
                });
            }
        }
    }, [errors, toast]);


    return (
        <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground">Créer un compte</h2>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
                    <div className="rounded-md shadow-sm space-y-4">
                         <div>
                            <Label htmlFor="displayName">Nom à afficher</Label>
                            <Input
                                id="displayName"
                                type="text"
                                autoComplete="name"
                                required
                                placeholder="Votre nom complet"
                                {...register('displayName')}
                            />
                            {errors.displayName && <p className="mt-2 text-sm text-red-600">{errors.displayName.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="email-address">Adresse email</Label>
                            <Input
                                id="email-address"
                                type="email"
                                autoComplete="email"
                                required
                                placeholder="Adresse email"
                                {...register('email')}
                            />
                             {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="password">Mot de passe</Label>
                            <Input
                                id="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                placeholder="Mot de passe (6 caractères min.)"
                                {...register('password')}
                            />
                            {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>}
                        </div>
                    </div>

                    <div className="flex items-center">
                         <Checkbox
                            id="acceptTerms"
                            {...register('acceptTerms')}
                        />
                        <Label htmlFor="acceptTerms" className="ml-2 block text-sm text-muted-foreground">
                            J'accepte les <Link href="/terms" className="underline hover:text-primary">termes et conditions</Link>.
                        </Label>
                    </div>
                     {errors.acceptTerms && <p className="text-sm text-red-600">{errors.acceptTerms.message}</p>}

                    <div>
                        <Button
                            type="submit"
                            className="group relative flex w-full justify-center"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Création...' : 'Créer un compte'}
                        </Button>
                    </div>
                </form>
                 <div className="text-center text-sm text-muted-foreground">
                    Déjà un compte ? {' '}
                    <Link href="/login" className="font-medium text-primary hover:underline">
                        Connectez-vous
                    </Link>
                </div>
            </div>
        </div>
    );
}
