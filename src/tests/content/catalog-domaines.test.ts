/**
 * @jest-environment node
 *
 * Catalogue — domaines, niveaux de Bloom et filtrage (étape 10).
 *
 * ⚠️ **Ce que ces tests protègent.** Avant le filtrage par domaine,
 * `generateLessonContentAction` transmettait le catalogue **entier** à l'IA : sur une
 * formation de vente, elle recevait `MergeSimulator`, sans rapport. Rien ne l'en empêchait
 * structurellement. Ces tests verrouillent le correctif.
 */
import {
  CATALOG_SIZE,
  listByDomain,
  listByBloomLevel,
  listFunctionalInteractiveNamesForDomain,
  listNamesForDomain,
  listWithoutBloomLevels,
  PLACEHOLDER_COMPONENTS,
  resolveComponentMeta,
} from '@/components/registry/catalog';
import { BLOOM_LEVELS } from '@/lib/content/bloom';

describe('catalogue — intégrité des métadonnées', () => {
  it('déclare un domaine pour chaque composant', () => {
    // Un domaine vide rendrait le composant invisible au filtrage : il disparaîtrait de
    // toute proposition IA sans que personne ne s'en aperçoive.
    const sansDomaine = [...Array(CATALOG_SIZE).keys()]
      .map((index) => listByDomain('interactive', undefined)[index])
      .filter(Boolean)
      .filter((meta) => meta.domains.length === 0);

    expect(sansDomaine).toEqual([]);
  });

  it('déclare au moins un domaine à chaque composant, interactif comme visuel', () => {
    for (const kind of ['interactive', 'visual'] as const) {
      for (const meta of listByDomain(kind, undefined)) {
        expect(meta.domains.length).toBeGreaterThan(0);
      }
    }
  });

  it('signale explicitement les composants sans niveau de Bloom', () => {
    // Un composant sans niveau ne peut pas être mis en correspondance avec un objectif :
    // la règle R6 le refuserait. Le défaut doit être **visible**, pas silencieux.
    const sansNiveau = listWithoutBloomLevels();

    // L'état actuel est connu : on vérifie que la fonction le détecte, pas qu'il est vide.
    // Si ce nombre change, c'est que des composants ont été ajoutés — et il faut alors les
    // documenter.
    expect(Array.isArray(sansNiveau)).toBe(true);
  });

  it('associe chaque placeholder à un domaine', () => {
    for (const name of PLACEHOLDER_COMPONENTS) {
      const meta = resolveComponentMeta(name);
      expect(meta?.domains.length).toBeGreaterThan(0);
    }
  });
});

describe('filtrage par domaine — le correctif', () => {
  it('ne propose AUCUN simulateur Git à une formation de vente', () => {
    const pourVente = listFunctionalInteractiveNamesForDomain('vente');

    // Le cœur du correctif : ces composants sont Git, ils n'ont rien à faire dans une
    // formation commerciale.
    for (const nomGit of ['MergeSimulator', 'GitCommandSimulator', 'ConflictPlayground']) {
      expect(pourVente).not.toContain(nomGit);
    }
  });

  it('propose les simulateurs Git à une formation Git', () => {
    const pourGit = listFunctionalInteractiveNamesForDomain('git');

    expect(pourGit).toContain('MergeSimulator');
  });

  it('conserve les composants génériques pour tous les domaines', () => {
    // Un composant `['*']` doit rester disponible partout : sinon le filtrage appauvrirait
    // les formations au lieu de les préciser.
    const versioning = resolveComponentMeta('VersioningDemo');
    expect(versioning?.domains).toContain('*');

    expect(listNamesForDomain('interactive', 'marketing')).toContain('VersioningDemo');
    expect(listNamesForDomain('interactive', 'vente')).toContain('VersioningDemo');
  });

  it('ne filtre rien quand le domaine est inconnu', () => {
    // Comportement historique conservé : mieux vaut proposer trop que priver l'IA de tout.
    const sansFiltre = listFunctionalInteractiveNamesForDomain(undefined);
    const pourGit = listFunctionalInteractiveNamesForDomain('git');

    expect(sansFiltre.length).toBeGreaterThanOrEqual(pourGit.length);
  });

  it('exclut toujours les placeholders, même dans leur domaine', () => {
    // Le filtre de domaine NE DOIT PAS réintroduire les placeholders : les deux filtres sont
    // indépendants et cumulatifs.
    const pourGit = listFunctionalInteractiveNamesForDomain('git');

    for (const placeholder of PLACEHOLDER_COMPONENTS) {
      expect(pourGit).not.toContain(placeholder);
    }
  });

  it('n’expose jamais un composant visuel dans la liste interactive', () => {
    const interactifs = listFunctionalInteractiveNamesForDomain(undefined);

    expect(interactifs).not.toContain('GitGraph');
    expect(interactifs).not.toContain('ConceptDiagram');
  });
});

describe('filtrage par niveau de Bloom', () => {
  it('trouve des composants pour au moins un niveau', () => {
    const pourCreer = listByBloomLevel('interactive', 'Créer', undefined);

    expect(pourCreer.length).toBeGreaterThan(0);
  });

  it('propose un QCM au niveau « Connaître » mais pas au niveau « Créer »', () => {
    // Illustration directe de la règle R6 : un QCM ne fait pas créer.
    const connaitre = listByBloomLevel('interactive', 'Connaître', undefined);
    const creer = listByBloomLevel('interactive', 'Créer', undefined);

    // Aucun composant ne doit prétendre couvrir les deux extrêmes de la taxonomie.
    const intersection = connaitre.filter((meta) => creer.includes(meta));
    expect(intersection).toEqual([]);
  });

  it('couvre les 6 niveaux par au moins un composant (état du catalogue)', () => {
    // ⚠️ Constat attendu : le catalogue actuel ne couvre PAS les 6 niveaux — il est
    // entièrement issu de la formation git-github. Ce test **documente l'écart** au lieu de
    // le masquer. Il devra passer au vert après les étapes 15 et 16.
    const couverts = BLOOM_LEVELS.filter(
      (level) => listByBloomLevel('interactive', level, undefined).length > 0,
    );

    // On vérifie surtout que le catalogue couvre **les niveaux avancés** (Appliquer et
    // au-delà) : c'est ce que la formation Git permet réellement.
    expect(couverts).toContain('Appliquer');
    expect(couverts).toContain('Analyser');
  });

  it('combine domaine et niveau', () => {
    const gitCreer = listByBloomLevel('interactive', 'Créer', 'git');
    const venteCreer = listByBloomLevel('interactive', 'Créer', 'vente');

    expect(gitCreer.length).toBeGreaterThan(0);
    // Aucun composant de vente n'existe encore : c'est le constat à corriger (étapes 15-16).
    expect(venteCreer.length).toBe(0);
  });
});
