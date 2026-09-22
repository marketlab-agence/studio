'use server';

import { revalidatePath } from 'next/cache';
import type { AppUser } from '@/lib/users';
import type { AppSettings } from '@/types/settings.types';
import { getSettings, saveSettings } from '@/lib/settings';
import { getCourses } from '@/lib/courses';
import { getTutorials } from '@/lib/tutorials';
import { getUserProvider } from '@/lib/providers';
import { canAssignRole } from '@/lib/auth/authorization';
import {
  ForbiddenError,
  requireAdminViewer,
  requireMemberManager,
  requireSettingsManager,
} from '@/lib/auth/server';

/**
 * Server actions d'administration (T4.14, REQ-ORG-06).
 *
 * ⚠️ **Chaque action vérifie elle-même le rôle.** Une server action est un
 * **point d'entrée HTTP** : elle est joignable directement, sans passer par la
 * page qui l'affiche. Le `layout` admin ne vérifiait le rôle que **côté client**,
 * ce qui ne protégeait rien — n'importe quel utilisateur connecté pouvait appeler
 * `updateUserRoleAction` et s'octroyer les droits d'admin.
 *
 * Les rôles admis viennent de `@/lib/auth/authorization` : une seule source de
 * vérité, partagée avec les routes API.
 */

/**
 * Lit les réglages de l'organisation.
 *
 * **Non restreinte volontairement** : la page `/certificate` s'en sert pour
 * afficher le nom du formateur à un apprenant. Le nom du formateur n'est pas une
 * donnée confidentielle ; le réserver à l'administration casserait les
 * attestations.
 */
export async function getSettingsAction(): Promise<AppSettings> {
    return await getSettings();
}

/** Modifie les réglages de l'organisation. Réservé à l'administration. */
export async function updateSettingsAction(newSettings: AppSettings) {
    await requireSettingsManager();

    await saveSettings(newSettings);
    revalidatePath('/admin');
    revalidatePath('/certificate');
}

/** Liste les formations pour l'administration. */
export async function getAdminCoursesAction() {
    try {
        await requireAdminViewer();

        const courses = await getCourses();
        const tutorials = await getTutorials();

        const coursesData = courses.map(course => {
            const lessonsCount = tutorials.filter(t => t.courseId === course.id).reduce((acc, tutorial) => acc + (tutorial.lessons?.length || 0), 0);
            return {
                id: course.id,
                title: course.title,
                lessonsCount: lessonsCount,
                status: course.status || 'Brouillon',
            };
        });
        return coursesData;
    } catch(error) {
        // Un refus d'autorisation ne doit pas être avalé et transformé en
        // « aucune formation » : cela masquerait un problème de droits derrière
        // un écran vide, sans trace exploitable.
        if (error instanceof ForbiddenError) throw error;

        console.error("Failed to fetch admin courses:", error);
        return [];
    }
}

/** Liste les utilisateurs de l'organisation. */
export async function getAdminUsersAction(): Promise<AppUser[]> {
    try {
        const { scope } = await requireAdminViewer();
        return await getUserProvider().list(scope);
    } catch(error) {
        if (error instanceof ForbiddenError) throw error;

        console.error("Failed to fetch admin users:", error);
        return [];
    }
}

/** Détail d'un utilisateur de l'organisation. */
export async function getAdminUserByIdAction(userId: string): Promise<AppUser | null> {
    try {
        const { scope } = await requireAdminViewer();
        return await getUserProvider().getById(scope, userId);
    } catch (error) {
        if (error instanceof ForbiddenError) throw error;

        console.error("Failed to fetch user:", error);
        return null;
    }
}

/**
 * Change le rôle d'un utilisateur.
 *
 * Deux contrôles, et non un seul :
 *
 * 1. **gérer les membres** — un Modérateur ou un Utilisateur n'a rien à faire ici ;
 * 2. **attribuer ce rôle précis** — on ne peut pas accorder un rôle supérieur au
 *    sien. Sans cette seconde règle, un Admin pourrait nommer un Propriétaire et
 *    s'élever par personne interposée.
 */
export async function updateUserRoleAction(userId: string, role: AppUser['role']): Promise<void> {
    try {
        const { claims, scope } = await requireMemberManager();

        if (!canAssignRole(claims.role, role)) {
            throw new ForbiddenError(`Vous n’avez pas les droits pour attribuer le rôle « ${role} ».`);
        }

        // Se protéger soi-même d'une rétrogradation accidentelle : un
        // Propriétaire qui se retire ses droits laisserait l'organisation sans
        // administrateur.
        if (userId === claims.userId) {
            throw new ForbiddenError(
                'Vous ne pouvez pas modifier votre propre rôle. Demandez-le à un autre administrateur.',
            );
        }

        await getUserProvider().setRole(scope, userId, role);

        revalidatePath(`/admin/users/${userId}`);
        revalidatePath('/admin/users');
    } catch (error) {
        if (error instanceof ForbiddenError) throw error;

        console.error("Failed to update user role:", error);
        throw new Error("Could not update user role.");
    }
}
