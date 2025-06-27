'use client';

import Link from 'next/link';
import { ArrowLeft, Shield, Users, BookOpen, Settings, Eye, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const allPermissions = [
  { id: 'manage-users', label: "Gérer les utilisateurs et leurs rôles", icon: Users },
  { id: 'manage-courses', label: "Créer et modifier des formations", icon: BookOpen },
  { id: 'manage-billing', label: "Gérer les abonnements et la facturation", icon: Settings },
  { id: 'view-analytics', label: "Voir toutes les statistiques", icon: Eye },
];

const rolePermissions: Record<string, string[]> = {
  Administrateur: ['manage-users', 'manage-courses', 'manage-billing', 'view-analytics'],
  Modérateur: ['manage-users', 'manage-courses'],
  Utilisateur: [],
};

const RoleCard = ({ role, description }: { role: string; description: string }) => {
  const permissions = rolePermissions[role];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{role}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <h4 className="font-semibold text-sm">Permissions accordées :</h4>
        {allPermissions.map(permission => (
          <div key={permission.id} className="flex items-center space-x-2">
            <Checkbox id={`${role}-${permission.id}`} checked={permissions.includes(permission.id)} disabled />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor={`${role}-${permission.id}`} className="flex items-center gap-2 cursor-not-allowed text-muted-foreground has-[:checked]:text-foreground">
                <permission.icon className="h-4 w-4" />
                {permission.label}
              </Label>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};


export default function ManageRolesPage() {
  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin?tab=users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour au panneau d'administration
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="bg-primary/10 p-2 rounded-lg">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Gestion des Rôles</h1>
          <p className="text-muted-foreground">Définissez les permissions pour chaque rôle sur la plateforme.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <RoleCard role="Administrateur" description="Accès total à toutes les fonctionnalités d'administration." />
        <RoleCard role="Modérateur" description="Peut gérer les utilisateurs et le contenu des formations." />
        <RoleCard role="Utilisateur" description="Rôle par défaut sans accès à l'administration." />
      </div>
    </div>
  );
}
