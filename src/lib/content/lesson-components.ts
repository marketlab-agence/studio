import { z } from 'zod';
import type { LessonComponent } from '@/types/tutorial.types';
import type { ComponentConfig } from '@/lib/schemas/component-config';
import { resolveComponentMeta, type ComponentMeta } from '@/components/registry/catalog';

/**
 * Opérations pures sur la **liste ordonnée** des composants d'une leçon.
 *
 * ⚠️ **Pourquoi un module à part.** Le formulaire d'édition et l'action d'enregistrement
 * doivent appliquer *les mêmes* règles : renumérotation continue, réordonnancement, ajout,
 * retrait, validation. Les isoler ici les rend **testables sans monter React** et évite que
 * le client et le serveur divergent (deux vérités pour une même opération).
 *
 * ⚠️ **Aucune dépendance React** : `catalog` ne contient que des métadonnées. Ce module est
 * donc utilisable côté serveur comme côté client.
 */

/**
 * Renumérote les positions en `0..N-1`, dans l'ordre du tableau.
 *
 * ⚠️ **Invariant central.** Laisser un trou (position 0 puis 2) ferait échouer la contrainte
 * d'unicité dès la prochaine insertion au même endroit, et l'ordre d'affichage dépend d'une
 * suite continue. Toute opération structurelle termine donc par cette renumérotation.
 */
export function renumeroter(composants: LessonComponent[]): LessonComponent[] {
  return composants.map((composant, index) => ({ ...composant, position: index }));
}

/**
 * Ajoute un composant en fin de liste.
 *
 * ⚠️ **Aucun dédoublonnage.** Le même composant peut légitimement apparaître plusieurs fois
 * (deux procédures, deux quiz) : c'est la `position` qui les distingue.
 */
export function ajouterComposant(
  composants: LessonComponent[],
  nom: string,
): LessonComponent[] {
  return renumeroter([...composants, { name: nom, position: composants.length, config: {} }]);
}

/** Retire le composant à `index`, puis renumérote. Hors bornes : liste inchangée. */
export function retirerComposant(
  composants: LessonComponent[],
  index: number,
): LessonComponent[] {
  if (index < 0 || index >= composants.length) return renumeroter(composants);

  const copie = [...composants];
  copie.splice(index, 1);
  return renumeroter(copie);
}

/**
 * Échange le composant `index` avec son voisin (`haut` = précédent, `bas` = suivant).
 * Aux extrémités, la liste est simplement renumérotée : on ne « boucle » pas.
 */
export function deplacerComposant(
  composants: LessonComponent[],
  index: number,
  direction: 'haut' | 'bas',
): LessonComponent[] {
  const cible = direction === 'haut' ? index - 1 : index + 1;
  if (index < 0 || index >= composants.length || cible < 0 || cible >= composants.length) {
    return renumeroter(composants);
  }

  const copie = [...composants];
  [copie[index], copie[cible]] = [copie[cible], copie[index]];
  return renumeroter(copie);
}

/** Remplace le nom du composant à `index`, **sans perdre sa configuration**. */
export function changerNomComposant(
  composants: LessonComponent[],
  index: number,
  nom: string,
): LessonComponent[] {
  return composants.map((composant, i) =>
    i === index ? { ...composant, name: nom } : composant,
  );
}

/**
 * Définit un libellé **d'instance** (`config.labels`).
 *
 * ⚠️ **Un libellé vidé est retiré**, pas stocké vide : le composant retombe alors sur son
 * libellé par défaut (voir `fusionnerLibelles`). Stocker `''` afficherait un titre vide.
 */
export function modifierLibelle(
  composants: LessonComponent[],
  index: number,
  cle: string,
  valeur: string,
): LessonComponent[] {
  return composants.map((composant, i) => {
    if (i !== index) return composant;

    const labels = { ...(composant.config?.labels ?? {}) };
    if (valeur.trim() === '') delete labels[cle];
    else labels[cle] = valeur;

    return { ...composant, config: { ...(composant.config ?? {}), labels } };
  });
}

/** Définit les données **d'instance** (`config.data`). */
export function modifierDonnees(
  composants: LessonComponent[],
  index: number,
  data: unknown,
): LessonComponent[] {
  return composants.map((composant, i) =>
    i === index ? { ...composant, config: { ...(composant.config ?? {}), data } } : composant,
  );
}

/** Sérialise `config.data` pour l'éditeur JSON. `undefined` → chaîne vide. */
export function serialiserDonnees(data: unknown): string {
  return data === undefined ? '' : JSON.stringify(data, null, 2);
}

export type ResultatAnalyseJson =
  | { valide: true; data: unknown }
  | { valide: false; message: string };

/**
 * Analyse le texte de l'éditeur JSON.
 *
 * ⚠️ **Un champ vide vaut « aucune donnée »**, pas une erreur : le créateur peut laisser le
 * composant sur ses valeurs par défaut. C'est ce qui rend la validation serveur permissive.
 */
export function analyserDonneesJson(texte: string): ResultatAnalyseJson {
  const brut = texte.trim();
  if (brut === '') return { valide: true, data: undefined };

  try {
    return { valide: true, data: JSON.parse(brut) };
  } catch (erreur) {
    return {
      valide: false,
      message: erreur instanceof Error ? erreur.message : String(erreur),
    };
  }
}

/**
 * Indique si le composant attend une **structure** de données (`config.data`).
 *
 * ⚠️ **On se fie au schéma, pas à un drapeau séparé** — le schéma reste l'unique source de
 * vérité. Un `z.object({})` (aucune donnée attendue) est un objet vide : rien à éditer. Dès
 * qu'il déclare des clés, même optionnelles, l'éditeur JSON est proposé.
 */
export function attendDesDonnees(meta: ComponentMeta): boolean {
  return meta.dataSchema instanceof z.ZodObject && Object.keys(meta.dataSchema.shape).length > 0;
}

export type ResultatValidation = { valide: true } | { valide: false; message: string };

/**
 * Valide la configuration d'une instance contre le schéma du catalogue.
 *
 * ⚠️ **La donnée absente est toujours valide.** Les schémas sont stricts : valider
 * `config.data ?? {}` rejetterait des leçons existantes sans données (beaucoup de
 * `AiHelper`). Or « pas de données » signifie « appliquer les défauts du composant ».
 * On ne valide donc **que si** `config.data` est fournie.
 *
 * ⚠️ **Un composant inconnu est refusé** : le catalogue est la seule source des noms
 * valides, et un nom orphelin ne pourrait pas être rendu.
 */
export function validerConfigurationComposant(
  nom: string,
  config?: ComponentConfig,
): ResultatValidation {
  const meta = resolveComponentMeta(nom);
  if (!meta) return { valide: false, message: `Composant inconnu : ${nom}` };

  if (config?.data === undefined) return { valide: true };

  const resultat = meta.dataSchema.safeParse(config.data);
  if (!resultat.success) {
    return {
      valide: false,
      message: `Configuration invalide pour ${nom} : ${resultat.error.message}`,
    };
  }

  return { valide: true };
}
