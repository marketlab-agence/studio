import { ComponentConfigSchema, fusionnerLibelles } from '@/lib/schemas/component-config';
import { COMPONENT_CATALOG, COMPONENT_CATALOG_BY_NAME } from '@/components/registry/catalog';

/**
 * Vérifie le contrat de configuration et l'exhaustivité des schémas.
 *
 * ⚠️ **L'exigence centrale** : chaque composant du catalogue déclare un schéma
 * strict ET des libellés personnalisables. Décision utilisateur : « un schéma
 * strict pour tous les 34 composants comme les 12 ». Aucun composant ne doit
 * échapper à la validation.
 */
describe('contrat de configuration', () => {
  it('accepte une configuration vide', () => {
    expect(ComponentConfigSchema.safeParse({}).success).toBe(true);
  });

  it('refuse des libellés non textuels', () => {
    expect(ComponentConfigSchema.safeParse({ labels: { titre: 42 } }).success).toBe(false);
  });

  it('complète les libellés manquants par les valeurs par défaut', () => {
    const resultat = fusionnerLibelles({ a: 'A', b: 'B' }, { b: 'B modifié' });
    expect(resultat).toEqual({ a: 'A', b: 'B modifié' });
  });

  it('rend les libellés par défaut si aucune configuration n’est fournie', () => {
    expect(fusionnerLibelles({ a: 'A' }, undefined)).toEqual({ a: 'A' });
  });

  it('déclare des libellés personnalisables pour CHAQUE composant', () => {
    const sansLibelles = COMPONENT_CATALOG.filter(
      (meta) => Object.keys(meta.labelKeys).length === 0,
    ).map((meta) => meta.name);
    expect(sansLibelles).toEqual([]);
  });

  it('déclare un schéma de données pour CHAQUE composant', () => {
    const sansSchema = COMPONENT_CATALOG.filter((meta) => !meta.dataSchema).map((m) => m.name);
    expect(sansSchema).toEqual([]);
  });

  it('expose des libellés par défaut en français, non vides', () => {
    for (const meta of COMPONENT_CATALOG) {
      for (const [cle, valeur] of Object.entries(meta.labelKeys)) {
        if (typeof valeur !== 'string' || valeur.trim() === '') {
          throw new Error(`Libellé vide ou non textuel : ${meta.name}.${cle}`);
        }
      }
    }
    // Le parcours ci-dessus lève si un libellé est vide ; arriver ici est la preuve.
    expect(COMPONENT_CATALOG.length).toBeGreaterThan(0);
  });

  it('refuse une donnée qui ne respecte pas le schéma du composant', () => {
    const meta = COMPONENT_CATALOG_BY_NAME.MatchingPairs;
    // `pairs` vide : aucune paire à associer, l'exercice n'a pas de sens.
    expect(meta.dataSchema.safeParse({ pairs: [] }).success).toBe(false);
    expect(meta.dataSchema.safeParse({ pairs: [{ left: 'a', right: 'b' }] }).success).toBe(true);
  });

  it('indexe chaque composant par son nom', () => {
    expect(Object.keys(COMPONENT_CATALOG_BY_NAME).length).toBe(COMPONENT_CATALOG.length);
  });
});
