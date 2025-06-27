'use client';

import Link from 'next/link';
import { ArrowLeft, Shield, Users, BookOpen, Settings, Eye, ShieldCheck, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { MOCK_USERS } from '@/lib/users';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const allPermissions = [
  { id: 'manage-platform', label: "Gérer les paramètres critiques de la plateforme", icon: ShieldCheck },
  { id: 'manage-roles', label: "Gérer les rôles et les permissions", icon: Shield },
  { id: 'manage-billing', label: "Gérer les abonnements et la facturation", icon: Settings },
  { id: 'manage-users', label: "Gérer les utilisateurs", icon: Users },
  { id: 'manage-courses', label: "Créer et modifier des formations", icon: BookOpen },
  { id: 'view-analytics', label: "Voir toutes les statistiques", icon: Eye },
];

const initialRolePermissions: Record<string, string[]> = {
  'Super Admin': ['manage-platform', 'manage-roles', 'manage-billing', 'manage-users', 'manage-courses', 'view-analytics'],
  'Administrateur': ['manage-billing', 'manage-users', 'manage-courses', 'view-analytics'],
  'Modérateur': ['manage-users', 'manage-courses'],
  'Utilisateur': [],
};

const RoleCard = ({ 
    role, 
    description,
    permissions,
    isSuperAdmin,
    onPermissionChange,
 }: { 
    role: string; 
    description: string;
    permissions: string[];
    isSuperAdmin: boolean;
    onPermissionChange: (role: string, permissionId: string, checked: boolean) => void;
 }) => {
  
  const canModify = isSuperAdmin && role !== 'Super Admin';

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
            <Checkbox 
                id={`${role}-${permission.id}`} 
                checked={permissions.includes(permission.id)} 
                disabled={!canModify} 
                onCheckedChange={(checked) => onPermissionChange(role, permission.id, !!checked)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label 
                htmlFor={`${role}-${permission.id}`} 
                className={cn(
                    "flex items-center gap-2 text-muted-foreground",
                    canModify ? 'cursor-pointer' : 'cursor-not-allowed',
                    permissions.includes(permission.id) && "text-foreground"
                )}
              >
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
    const { user } = useAuth();
    const { toast } = useToast();
    const currentUserData = user ? MOCK_USERS.find(u => u.email === user.email) : null;
    const isSuperAdmin = currentUserData?.role === 'Super Admin';
    
    const [permissions, setPermissions] = useState(initialRolePermissions);
    const [isSaving, setIsSaving] = useState(false);

    const handlePermissionChange = (role: string, permissionId: string, checked: boolean) => {
        setPermissions(prev => {
            const newPermissionsForRole = checked
                ? [...prev[role], permissionId]
                : prev[role].filter(id => id !== permissionId);
            return { ...prev, [role]: newPermissionsForRole };
        });
    };
    
    const handleSaveChanges = () => {
        setIsSaving(true);
        // In a real app, this would be an API call.
        // For now, we just simulate it.
        console.log('Saving new permissions:', permissions);
        setTimeout(() => {
            toast({
                title: 'Permissions sauvegardées',
                description: 'Les rôles et permissions ont été mis à jour (simulation).',
            });
            setIsSaving(false);
        }, 1000);
    };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin?tab=users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour au panneau d'administration
          </Link>
        </Button>
        {isSuperAdmin && (
            <Button onClick={handleSaveChanges} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Sauvegarder les modifications
            </Button>
        )}
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        <RoleCard 
            role="Super Admin" 
            description="Contrôle total, y compris les paramètres critiques et les rôles." 
            permissions={permissions['Super Admin']}
            isSuperAdmin={isSuperAdmin}
            onPermissionChange={handlePermissionChange}
        />
        <RoleCard 
            role="Administrateur" 
            description="Accès à la plupart des fonctionnalités de gestion." 
            permissions={permissions['Administrateur']}
            isSuperAdmin={isSuperAdmin}
            onPermissionChange={handlePermissionChange}
        />
        <RoleCard 
            role="Modérateur" 
            description="Peut gérer les utilisateurs et le contenu des formations." 
            permissions={permissions['Modérateur']}
            isSuperAdmin={isSuperAdmin}
            onPermissionChange={handlePermissionChange}
        />
        <RoleCard 
            role="Utilisateur" 
            description="Rôle par défaut sans accès à l'administration." 
            permissions={permissions['Utilisateur']}
            isSuperAdmin={isSuperAdmin}
            onPermissionChange={handlePermissionChange}
        />
      </div>
    </div>
  );
}
