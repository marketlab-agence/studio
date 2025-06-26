'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GitPullRequest, Bug, GitCommitHorizontal, CheckCircle, Star } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const stats = [
    { title: "Pull Requests", value: 3, icon: GitPullRequest, color: "text-primary" },
    { title: "Issues résolues", value: 5, icon: Bug, color: "text-green-500" },
    { title: "Commits effectués", value: 12, icon: GitCommitHorizontal, color: "text-yellow-500" },
];

const skills = [
    "Créer un fork", "Cloner un dépôt", "Créer une branche de fonctionnalité",
    "Faire des commits", "Pousser vers un distant", "Ouvrir une Pull Request",
    "Participer à une revue de code"
];

const recentActivity = [
    { text: "PR #3 fusionnée : Ajout de la page de profil", time: "il y a 2 min" },
    { text: "Issue #5 fermée : Le bouton de connexion est maintenant cliquable", time: "il y a 15 min" },
    { text: "Commit e4f5g6 poussé vers `feature/profile-page`", time: "il y a 1h" },
];

export function ProjectDashboard() {
  return (
    <Card className="my-6 w-full">
      <CardHeader>
        <CardTitle>Tableau de Bord du Projet Final</CardTitle>
        <CardDescription>Un résumé de vos accomplissements durant le projet final simulé.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3">
            {stats.map((stat, index) => (
                 <motion.div
                    key={stat.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                 >
                    <Card className="bg-card/50 h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            <stat.icon className={`h-4 w-4 text-muted-foreground ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                        </CardContent>
                    </Card>
                 </motion.div>
            ))}
        </div>
        
        <Separator />
        
        <div className="grid md:grid-cols-2 gap-8">
            {/* Skills Mastered */}
            <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-400" />
                    Compétences Maîtrisées
                </h3>
                <ul className="space-y-3">
                    {skills.map((skill, index) => (
                        <motion.li 
                            key={skill}
                            className="flex items-center gap-3 text-sm"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + 0.05 * index }}
                        >
                            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                            <span className="text-muted-foreground">{skill}</span>
                        </motion.li>
                    ))}
                </ul>
            </div>
            
            {/* Recent Activity */}
            <div>
                <h3 className="text-lg font-semibold mb-4">Activité Récente</h3>
                <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                        <motion.div 
                            key={index}
                            className="flex items-start gap-3"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + 0.05 * (skills.length + index) }}
                        >
                            <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                            <div>
                                <p className="text-sm text-foreground">{activity.text}</p>
                                <p className="text-xs text-muted-foreground">{activity.time}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>

      </CardContent>
    </Card>
  );
}
