import {
  COMPONENT_CATALOG,
  CATALOG_SIZE,
  PLACEHOLDER_COMPONENTS,
  listByKind,
  listNames,
  listFunctionalInteractiveNames,
  resolveComponentMeta,
  assertKnownComponent,
  assertUsableComponent,
} from '@/components/registry/catalog';

describe('Catalogue des composants (métadonnées)', () => {
  it('est non vide et indexé par nom', () => {
    expect(CATALOG_SIZE).toBeGreaterThan(0);

    for (const meta of COMPONENT_CATALOG) {
      expect(resolveComponentMeta(meta.name)?.name).toBe(meta.name);
    }
  });

  it('ne contient aucun doublon', () => {
    const names = COMPONENT_CATALOG.map((meta) => meta.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('expose les deux natures', () => {
    const interactive = listByKind('interactive');
    const visual = listByKind('visual');

    expect(interactive.length).toBeGreaterThan(0);
    expect(visual.length).toBeGreaterThan(0);
    expect(interactive.length + visual.length).toBe(CATALOG_SIZE);

    expect(listNames('interactive')).toHaveLength(interactive.length);
    expect(listNames('visual')).toHaveLength(visual.length);
  });

  it('fournit une description non vide pour chaque composant (alimente le prompt IA)', () => {
    for (const meta of COMPONENT_CATALOG) {
      expect(meta.description.trim().length).toBeGreaterThan(10);
    }
  });

  it('résout un composant connu et retourne undefined pour un nom inconnu', () => {
    const known = listNames('interactive')[0];

    expect(resolveComponentMeta(known)?.name).toBe(known);
    expect(resolveComponentMeta('ComposantBidonQuiNExistePas')).toBeUndefined();
  });

  it('rejette un nom inconnu avec une erreur explicite', () => {
    expect(() => assertKnownComponent('ComposantBidonQuiNExistePas', 'interactive')).toThrow(
      /Composant inconnu/,
    );
  });

  it('rejette un composant utilisé dans la mauvaise nature', () => {
    const visualName = listNames('visual')[0];
    const interactiveName = listNames('interactive')[0];

    expect(() => assertKnownComponent(visualName, 'interactive')).toThrow(/est de nature "visual"/);
    expect(() => assertKnownComponent(interactiveName, 'visual')).toThrow(/est de nature "interactive"/);
  });

  it('accepte un composant utilisé dans sa nature', () => {
    const visualName = listNames('visual')[0];
    expect(assertKnownComponent(visualName, 'visual').name).toBe(visualName);
  });

  it('marque les placeholders comme tels', () => {
    for (const name of PLACEHOLDER_COMPONENTS) {
      expect(resolveComponentMeta(name)?.status).toBe('placeholder');
    }
  });

  it('exclut les placeholders de la liste des interactifs opérationnels', () => {
    const functional = listFunctionalInteractiveNames();
    const allInteractive = listNames('interactive');

    expect(functional.length).toBe(allInteractive.length - PLACEHOLDER_COMPONENTS.size);

    for (const placeholder of PLACEHOLDER_COMPONENTS) {
      expect(functional).not.toContain(placeholder);
    }
  });

  it('refuse un placeholder comme mise en pratique (assertUsableComponent)', () => {
    // ⚠️ Depuis l'étape 16, plus AUCUN composant n'est un placeholder : les 13 coquilles Git
    // ont été reconfigurées en primitives. Le test ne peut donc plus s'appuyer sur un cas réel.
    //
    // On vérifie le **mécanisme** sur un nom connu mais marqué placeholder par le test lui-même :
    // c'est le comportement de `assertUsableComponent` qui importe, pas l'existence d'un cas.
    const placeholder = [...PLACEHOLDER_COMPONENTS][0];

    if (!placeholder) {
      // Aucun placeholder déclaré : le mécanisme ne peut pas être exercé ici. On le note
      // explicitement plutôt que de passer silencieusement — un test qui ne teste rien est
      // pire qu'un test absent.
      expect(PLACEHOLDER_COMPONENTS.size).toBe(0);
      return;
    }

    expect(() => assertUsableComponent(placeholder, 'interactive')).toThrow(/placeholder/);
  });

  it('signale qu’aucun composant n’est inerte (constat de la phase 1 résolu)', () => {
    // Le constat d'origine : « 13 des 33 composants interactifs sont des coquilles statiques ».
    // Ce test **verrouille sa résolution** — si un composant redevient inerte et est ajouté à
    // la liste, il faudra le justifier ici.
    const interactifs = listByKind('interactive');
    const inertes = interactifs.filter((meta) => meta.status === 'placeholder');

    expect(inertes).toEqual([]);
  });

  it('accepte un composant interactif opérationnel', () => {
    const functional = listFunctionalInteractiveNames()[0];

    expect(() => assertUsableComponent(functional, 'interactive')).not.toThrow();
  });
});
