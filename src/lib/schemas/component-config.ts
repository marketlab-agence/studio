import { z } from 'zod';

/**
 * Configuration d'une **instance** de composant pédagogique.
 *
 * ⚠️ **Pourquoi `labels` séparé de `data`.** Les libellés sont de la **copie**
 * (titre, consignes, boutons) : ils changent avec la langue de la formation. Les
 * données sont la **matière** (étapes, cartes, paires) : elles changent avec le
 * sujet. Les mélanger rendrait impossible de dire ce qui est personnalisable.
 *
 * ⚠️ **`{}` est une configuration valide.** Un composant sans configuration rend
 * exactement comme avant — c'est ce qui rend la migration sans régression.
 */
export const ComponentConfigSchema = z.object({
  labels: z.record(z.string()).optional(),
  data: z.unknown().optional(),
});

export type ComponentConfig = z.infer<typeof ComponentConfigSchema>;

/**
 * Fusionne les libellés fournis par-dessus les valeurs par défaut du composant.
 *
 * ⚠️ Un libellé **absent** de la configuration garde la valeur par défaut : on ne
 * remplace pas tout le bloc, on le complète. Sinon, personnaliser un seul mot
 * obligerait à redonner les dix autres — et une omission produirait un libellé vide.
 */
export function fusionnerLibelles(
  defauts: Record<string, string>,
  fournis: Record<string, string> | undefined,
): Record<string, string> {
  return { ...defauts, ...(fournis ?? {}) };
}
