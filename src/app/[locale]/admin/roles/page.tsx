'use client';

import { Link } from '@/i18n/navigation';
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
import { useTranslations } from 'next-intl';
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
    icon: Settings,
    granted: canManageSettings,
  },
  {
    id: 'members',
    icon: Users,
    granted: canManageMembers,
  },
  {
    id: 'content',
    icon: BookOpen,
    granted: canManageContent,
  },
] as const;

/** Rôles du schéma, du plus élevé au plus restreint. */
const ROLES = ['Super Admin', 'Propriétaire', 'Admin', 'Modérateur', 'Utilisateur'] as const;

export default function ManageRolesPage() {
  const { userRole } = useAuth();
  const t = useTranslations('admin');

  const capabilityLabels: Record<string, string> = {
    settings: t('roles.capSettings'),
    members: t('roles.capMembers'),
    content: t('roles.capContent'),
  };

  const roleLabels: Record<string, string> = {
    'Super Admin': t('roles.roleNameSuperAdmin'),
    'Propriétaire': t('roles.roleNameOwner'),
    'Admin': t('roles.roleNameAdmin'),
    'Modérateur': t('roles.roleNameModerator'),
    'Utilisateur': t('roles.roleNameUser'),
  };

  const roleDescriptions: Record<string, string> = {
    'Super Admin': t('roles.descSuperAdmin'),
    'Propriétaire': t('roles.descOwner'),
    'Admin': t('roles.descAdmin'),
    'Modérateur': t('roles.descModerator'),
    'Utilisateur': t('roles.descUser'),
  };

  const currentRoleLabel = userRole ? (roleLabels[userRole] ?? userRole) : t('roles.unknownRole');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin" aria-label={t('roles.backAria')}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{t('roles.title')}</h1>
          <p className="text-muted-foreground">
            {t('roles.subtitle')}{' '}
            <Badge variant="secondary">{currentRoleLabel}</Badge>
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            {t('roles.rightsTitle')}
          </CardTitle>
          <CardDescription>
            {t('roles.rightsDescriptionBefore')}<strong>{t('roles.rightsDescriptionStrong')}</strong>{t('roles.rightsDescriptionAfter')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('roles.columnPermission')}</TableHead>
                {ROLES.map((role) => (
                  <TableHead key={role} className="text-center">
                    {roleLabels[role] ?? role}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {CAPABILITIES.map((capability) => (
                <TableRow key={capability.id}>
                  <TableCell className="flex items-center gap-2">
                    <capability.icon className="h-4 w-4 text-muted-foreground" />
                    {capabilityLabels[capability.id]}
                  </TableCell>
                  {ROLES.map((role) => (
                    <TableCell key={role} className="text-center">
                      {capability.granted(role) ? (
                        <span className="text-primary" aria-label={t('roles.granted')}>
                          ✓
                        </span>
                      ) : (
                        <span className="text-muted-foreground" aria-label={t('roles.denied')}>
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
                  {t('roles.assignOwner')}
                </TableCell>
                {ROLES.map((role) => (
                  <TableCell key={role} className="text-center">
                    {canAssignRole(role, 'Propriétaire') ? (
                      <span className="text-primary" aria-label={t('roles.granted')}>
                        ✓
                      </span>
                    ) : (
                      <span className="text-muted-foreground" aria-label={t('roles.denied')}>
                        —
                      </span>
                    )}
                  </TableCell>
                ))}
              </TableRow>

              <TableRow>
                <TableCell className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  {t('roles.assignAdmin')}
                </TableCell>
                {ROLES.map((role) => (
                  <TableCell key={role} className="text-center">
                    {canAssignRole(role, 'Admin') ? (
                      <span className="text-primary" aria-label={t('roles.granted')}>
                        ✓
                      </span>
                    ) : (
                      <span className="text-muted-foreground" aria-label={t('roles.denied')}>
                        —
                      </span>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>

          <p className="mt-4 text-sm text-muted-foreground">
            {t('roles.superAdminNote')}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {ROLES.map((role) => (
          <Card key={role}>
            <CardHeader>
              <CardTitle className="text-lg">{roleLabels[role] ?? role}</CardTitle>
              <CardDescription>{roleDescriptions[role]}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
