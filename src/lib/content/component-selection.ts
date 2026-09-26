import {
  listByBloomLevel,
  listFunctionalInteractiveNamesForDomain,
  listNamesForDomain,
  type ComponentDomain,
} from '@/components/registry/catalog';
import type { BloomLevel } from '@/lib/content/bloom';

/**
 * Composants pédagogiques proposés à l'IA pour une leçon.
 *
 * ⚠️ **Module sans `'use server'`** : la sélection est ainsi une fonction pure testable,
 * sans tirer l'action serveur ni les composants React.
 *
 * Trois filtres, tous nécessaires :
 *
 * 1. **Placeholders exclus** — un composant dont l'interface existe sans interaction ne doit
 *    pas servir de « mise en pratique » : l'IA générerait des leçons pointant vers des coquilles.
 * 2. **Domaine filtré** (2026-09-23) — sans ce filtre, l'IA recevait le catalogue **entier** :
 *    sur une formation de vente, elle se voyait proposer `MergeSimulator`.
 * 3. **Niveau de Bloom** (2026-09-23) — les interactifs sont restreints à ceux qui couvrent le
 *    niveau visé. C'est un filtrage **par construction** : l'IA ne peut pas choisir hors niveau,
 *    au lieu d'être censée s'y tenir.
 *
 * ⚠️ **Seuls les INTERACTIFS sont filtrés par Bloom.** Les visuels sont illustratifs, sans
 * obligation de niveau : les filtrer les écarterait à tort de leçons pourtant éligibles.
 *
 * ⚠️ Domaine et niveau sont **optionnels** : sans eux, on ne filtre pas. Mieux vaut proposer
 * trop que priver l'IA de tout composant faute d'information.
 */
export function getRelevantComponents(
  domain: ComponentDomain | undefined,
  bloomLevel: BloomLevel | undefined,
): { interactive: string[]; visual: string[] } {
  const interactifs = bloomLevel
    ? listByBloomLevel('interactive', bloomLevel, domain)
        .filter((meta) => meta.status === 'functional')
        .map((meta) => meta.name)
    : listFunctionalInteractiveNamesForDomain(domain);

  return {
    interactive: interactifs,
    visual: listNamesForDomain('visual', domain),
  };
}
