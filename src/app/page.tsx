'use client';

import { Award, Bell, BookOpen, ChevronRight, GitCommitHorizontal, PlayCircle } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur sm:px-6">
        <div className="flex items-center gap-2">
          <GitCommitHorizontal className="h-7 w-7 text-primary" />
          <h1 className="text-xl font-bold tracking-tight">Git & GitHub Interactif</h1>
        </div>
        <nav className="mx-auto hidden items-center gap-6 text-sm font-medium md:flex">
          <a href="#" className="text-foreground/80 transition-colors hover:text-foreground">Accueil</a>
          <a href="#" className="text-foreground/80 transition-colors hover:text-foreground">Tutoriel</a>
          <a href="#" className="text-foreground/80 transition-colors hover:text-foreground">Exercices</a>
          <a href="#" className="text-foreground/80 transition-colors hover:text-foreground">Certificat</a>
        </nav>
        <div className="flex flex-1 items-center justify-end gap-4">
          <Button variant="ghost" size="icon" className="relative rounded-full">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
            </span>
          </Button>
          <div className="hidden items-center gap-3 lg:flex">
            <div className="w-24">
              <Progress value={5} className="h-2" />
            </div>
            <Badge variant="outline" className="border-yellow-400/50 text-yellow-400">Niveau Débutant</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground">U</AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium md:inline">Utilisateur</span>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="container mx-auto max-w-5xl px-4 py-20 text-center sm:py-28 md:py-32">
          <div className="mb-4 flex items-center justify-center gap-2 text-primary">
            <GitCommitHorizontal className="h-8 w-8" />
            <span className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Tutoriel Git & GitHub</span>
          </div>
          <p className="mx-auto max-w-3xl text-lg text-muted-foreground md:text-xl">
            Maîtrisez les fondamentaux du contrôle de version avec Git et GitHub à travers un parcours d'apprentissage interactif et progressif.
          </p>
        </section>

        <section className="container mx-auto max-w-6xl px-4 pb-20">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="transform-gpu transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20">
              <CardHeader className="flex-row items-center gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>5 Chapitres</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Un parcours structuré couvrant tous les aspects essentiels de Git et GitHub</p>
              </CardContent>
            </Card>
            <Card className="transform-gpu transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20">
              <CardHeader className="flex-row items-center gap-4">
                <div className="rounded-lg bg-accent/10 p-3">
                  <PlayCircle className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Interactif</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Simulations et exercices pratiques pour une meilleure compréhension</p>
              </CardContent>
            </Card>
            <Card className="transform-gpu transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20">
              <CardHeader className="flex-row items-center gap-4">
                <div className="rounded-lg bg-purple-400/10 p-3">
                  <Award className="h-6 w-6 text-purple-400" />
                </div>
                <CardTitle>Certification</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Obtenez votre certificat de complétion à la fin du parcours</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-4 pb-20">
            <div className="rounded-xl bg-gradient-to-r from-primary/80 via-primary to-indigo-600 p-8 text-primary-foreground md:p-12">
                <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
                    <div className="max-w-xl">
                        <h2 className="text-3xl font-bold tracking-tight">Prêt à commencer ?</h2>
                        <p className="mt-2 text-lg text-primary-foreground/80">
                            Démarrez votre apprentissage avec le Chapitre 1: Introduction aux concepts de base de Git et GitHub.
                        </p>
                    </div>
                    <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                        Commencer le tutoriel
                        <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                </div>
            </div>
        </section>
      </main>
    </div>
  );
}
