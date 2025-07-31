/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FieldErrors } from 'react-hook-form'; // Import FieldErrors
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase'; // Expecting this to resolve to src/lib/firebase.ts
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input'; // Expecting this to resolve to src/components/ui/input.tsx
import { Button } from '@/components/ui/button'; // Expecting this to resolve to src/components/ui/button.tsx
import { Checkbox } from '@/components/ui/checkbox'; // Expecting this to resolve to src/components/ui/checkbox.tsx
import { Label } from '@/components/ui/label'; // Expecting this to resolve to src/components/ui/label.tsx
import Link from 'next/link';

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
        try {
            // Using non-null assertion (!) for debugging. 
            // Ensure Firebase environment variables are set for proper initialization.
            const userCredential = await createUserWithEmailAndPassword(auth!, email, password);
            // Consider updating displayName here after creation if needed, 
            // though Firebase createUserWithEmailAndPassword doesn't take displayName directly
            // await updateProfile(userCredential.user, { displayName: displayName });
            
            toast({ title: "Inscription réussie !", description: "Votre compte a été créé avec succès." });
            router.push('/'); // Redirect to home or a welcome page
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
            // Set a form error for a general message or specific field
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
            // You can choose to toast the first error or iterate through all of them
            const firstErrorKey = Object.keys(errors)[0] as keyof SignupFormValues; // Explicitly type the key
            const errorMessage = errors[firstErrorKey]?.message;
            if (errorMessage) {
                toast({
                    variant: "destructive",
                    title: "Erreur de validation",
                    description: errorMessage,
                });
            }
        }
    }, [errors, toast]); // Depend on errors object and toast function


    return (
        <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Créer un compte</h2>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
                    <div className="-space-y-px rounded-md shadow-sm">
                         <div>
                            <Label htmlFor="displayName" className="sr-only">Nom à afficher</Label>
                            <Input
                                id="displayName"
                                type="text"
                                autoComplete="name"
                                required
                                className="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                                placeholder="Nom à afficher"
                                {...register('displayName')}
                                // Removed duplicate name attribute
                            />
                            {errors.displayName && <p className="mt-2 text-sm text-red-600">{errors.displayName.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="email-address" className="sr-only">Adresse email</Label>
                            <Input
                                id="email-address"
                                type="email"
                                autoComplete="email"
                                required
                                className="relative block w-full appearance-none rounded-none border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                                placeholder="Adresse email"
                                {...register('email')}
                                // Removed duplicate name attribute
                            />
                             {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="password" className="sr-only">Mot de passe</Label>
                            <Input
                                id="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                className="relative block w-full appearance-none rounded-none rounded-b-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                                placeholder="Mot de passe"
                                {...register('password')}
                                // Removed duplicate name attribute
                            />
                            {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>}
                        </div>
                    </div>

                    <div className="flex items-center">
                         <Checkbox
                            id="acceptTerms"
                            {...register('acceptTerms')}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <Label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                            J'accepte les <Link href="/terms" className="underline">termes et conditions</Link>.
                        </Label>
                         {errors.acceptTerms && <p className="mt-2 text-sm text-red-600">{errors.acceptTerms.message}</p>}
                    </div>

                    <div>
                        <Button
                            type="submit"
                            className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Création...' : 'Créer un compte'}
                        </Button>
                    </div>
                </form>
                 <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                    Déjà un compte ? {' '}
                    <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                        Connectez-vous
                    </Link>
                </div>
            </div>
        </div>
    );

    