'use client';

import Link from 'next/link';
import { ArrowLeft, Shield, Users, BookOpen, Settings, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import {
  canAssignRole,
  canManageContent,
  canManageMembers,
  canManageSettings,
} from '@/lib/auth/authorization';

/**
 * Rôles et permissions (T4.14, REQ-ORG-06).
 *
 * ⚠️ **Lecture seule, et volontairement.**
 *
 * Cette page présentait auparavant une matrice **éditable** avec un bouton
 * « Enregistrer » et un message de succès — alors que rien n'était persisté ni
 * appliqué (`// In a real app, this would be an API call`). Elle annonçait en
 * outre des rôles qui n'existaient pas en base (« Administrateur » au lieu de
 * « Admin » et « Propriétaire »).
 *
 * Une interface qui prétend modifier des permissions sans les modifier est pire
 * qu'une interface absente : un administrateur croirait avoir restreint un accès
 * qui reste ouvert.
 *
 * La matrice ci-dessous est donc **dérivée des règles réellement appliquées**
 * (`src/lib/auth/authorization.ts`), celles qui protègent les server actions et
 * les routes. Elle ne peut pas mentir : elle appelle les mêmes fonctions.
 *
 * Rendre ces permissions **configurables** est un choix de produit (quelles
 * permissions exposeraient un risque si on les accordait à tort ?) qui n'a pas
 * été tranché. En attendant, la page dit la vérité plutôt que de la simuler.
 */

const CAPABILITIES = [
  {
    id: 'settings',
    label: "Modifier les réglages de l'organisation",
    icon: Settings,
    granted: canManageSettings,
  },
  {
    id: 'members',
    label: 'Gérer les membres (inviter, révoquer)',
    icon: Users,
    granted: canManageMembers,
  },
  {
    id: 'content',
    label: 'Créer et modifier des formations',
    icon: BookOpen,
    granted: canManageContent,
  },
] as const;

/** Rôles du schéma, du plus élevé au plus restreint. */
const ROLES = ['Super Admin', 'Propriétaire', 'Admin', 'Modérateur', 'Utilisateur'] as const;

const ROLE_DESCRIPTIONS: Record<string, string> = {
  'Super Admin': 'Administration de la plateforme Katalyst elle-même. Jamais attribuable par une organisation.',
  Propriétaire: "Responsable de l'organisation. Peut tout y faire, y compris nommer d'autres administrateurs.",
  Admin: "Administre l'organisation. Ne peut pas nommer de Propriétaire ni d'autre Admin.",
  Modérateur: 'Gère le contenu pédagogique. Ne peut pas administrer les membres.',
  Utilisateur: 'Suit les formations. Aucun accès à l’administration.',
};

export default function ManageRolesPage() {
  const { userRole } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin" aria-label="Retour à l’administration">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Rôles et permissions</h1>
          <p className="text-muted-foreground">
            Référence des droits appliqués. Votre rôle actuel :{' '}
            <Badge variant="secondary">{userRole ?? 'inconnu'}</Badge>
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Droits appliqués
          </CardTitle>
          <CardDescription>
            Ces droits sont contrôlés <strong>côté serveur</strong>, dans chaque action et chaque
            route. Ils ne sont pas configurables pour l’instant : cette page les décrit, elle ne les
            modifie pas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Permission</TableHead>
                {ROLES.map((role) => (
                  <TableHead key={role} className="text-center">
                    {role}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {CAPABILITIES.map((capability) => (
                <TableRow key={capability.id}>
                  <TableCell className="flex items-center gap-2">
                    <capability.icon className="h-4 w-4 text-muted-foreground" />
                    {capability.label}
                  </TableCell>
                  {ROLES.map((role) => (
                    <TableCell key={role} className="text-center">
                      {capability.granted(role) ? (
                        <span className="text-primary" aria-label="accordé">
                          ✓
                        </span>
                      ) : (
                        <span className="text-muted-foreground" aria-label="refusé">
                          —
                        </span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}

              {/*
                L'attribution de rôle a sa propre règle : elle ne se résume pas à
                « peut gérer les membres ». On ne peut pas accorder un rôle
                supérieur au sien — sinon un Admin nommerait un Propriétaire et
                s'élèverait par personne interposée.
              */}
              <TableRow>
                <TableCell className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  Nommer un Propriétaire
                </TableCell>
                {ROLES.map((role) => (
                  <TableCell key={role} className="text-center">
                    {canAssignRole(role, 'Propriétaire') ? (
                      <span className="text-primary" aria-label="accordé">
                        ✓
                      </span>
                    ) : (
                      <span className="text-muted-foreground" aria-label="refusé">
                        —
                      </span>
                    )}
                  </TableCell>
                ))}
              </TableRow>

              <TableRow>
                <TableCell className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  Nommer un Admin
                </TableCell>
                {ROLES.map((role) => (
                  <TableCell key={role} className="text-center">
                    {canAssignRole(role, 'Admin') ? (
                      <span className="text-primary" aria-label="accordé">
                        ✓
                      </span>
                    ) : (
                      <span className="text-muted-foreground" aria-label="refusé">
                        —
                      </span>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>

          <p className="mt-4 text-sm text-muted-foreground">
            « Super Admin » n’est jamais attribuable depuis une organisation : c’est un rôle
            plateforme, et l’accorder à un client lui donnerait des droits sur l’ensemble du service.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {ROLES.map((role) => (
          <Card key={role}>
            <CardHeader>
              <CardTitle className="text-lg">{role}</CardTitle>
              <CardDescription>{ROLE_DESCRIPTIONS[role]}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
