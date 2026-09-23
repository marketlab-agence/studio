/**
 * @jest-environment node
 *
 * Déduction du domaine de contenu (migration 010, étape 12).
 *
 * ⚠️ **Un faux positif réel a motivé ces tests.** Au premier re-seed, la formation
 * « introduction-au-**marketing-diGITal** » a été classée **`git`** : le motif `/git/`
 * reconnaissait les lettres « git » à l'intérieur de « digital ». Le domaine conditionne le
 * filtrage des composants proposés à l'IA — une erreur ici prive une formation de ses
 * composants pertinents et lui en propose d'inadaptés.
 */
import { contentDomainFor } from '@/lib/content/course-domain';

describe('contentDomainFor — déduction depuis le slug', () => {
  describe('cas réels du catalogue', () => {
    const cas: [string, string | null][] = [
      ['git-github-tutorial', 'git'],
      ['le-closing-pour-debutants-de-prospect-a-client', 'vente'],
      ['introduction-au-marketing-digital', 'marketing'],
      ['ingenierie-des-prompts-pour-debutants', 'ia'],
      ['jira-de-zero-a-heros', 'gestion-projet'],
      ['automatisation-de-processus-informatique-pour-debutants-avec-n8n', 'automatisation'],
    ];

    it('classe correctement les 6 formations du catalogue', () => {
      for (const [id, attendu] of cas) {
        expect({ id, domain: contentDomainFor(id) }).toEqual({ id, domain: attendu });
      }
    });
  });

  describe('faux positifs — le motif ne doit pas reconnaître un mot à l’intérieur d’un autre', () => {
    it('ne classe PAS « marketing digital » en git', () => {
      // Le bug constaté : « diGITal » contient « git ».
      expect(contentDomainFor('introduction-au-marketing-digital')).toBe('marketing');
    });

    it('ne confond pas « digital » avec git, même seul', () => {
      expect(contentDomainFor('transformation-digitale')).toBeNull();
    });

    it('ne confond pas « légitime » avec un domaine', () => {
      // « légitimité » contient « git » — le mot entier doit être exigé.
      expect(contentDomainFor('la-legitimite-du-formateur')).toBeNull();
    });

    it('reconnaît « agile » comme mot entier', () => {
      expect(contentDomainFor('methode-agile')).toBe('gestion-projet');
    });

    it('ne reconnaît pas « agilite » (sans le « e ») comme « agile »', () => {
      // Le mot entier est exigé : « agilite » n'est pas « agile ». C'est le comportement
      // voulu — un radical tronqué produirait des faux positifs en série.
      expect(contentDomainFor('agilite-en-entreprise')).toBeNull();
    });
  });

  describe('priorité entre domaines', () => {
    it('privilégie le domaine le plus spécifique', () => {
      // Un titre mixte doit être classé par son sujet **principal**, pas par un mot
      // secondaire. « vente » passe avant « git ».
      expect(contentDomainFor('git-pour-les-commerciaux')).toBe('vente');
    });

    it('classe « workflow » en automatisation et non en git', () => {
      expect(contentDomainFor('git-workflow-avance')).toBe('automatisation');
    });
  });

  describe('absence de domaine', () => {
    it('retourne null quand rien ne s’impose', () => {
      // Sans domaine, aucun filtrage n'est appliqué : mieux vaut proposer trop que de
      // mal classer une formation.
      expect(contentDomainFor('ma-super-formation')).toBeNull();
      expect(contentDomainFor('')).toBeNull();
    });
  });

  describe('insensibilité à la casse', () => {
    it('traite les majuscules comme les minuscules', () => {
      expect(contentDomainFor('GIT-GITHUB-TUTORIAL')).toBe('git');
      expect(contentDomainFor('Le-Closing-Pour-Debutants')).toBe('vente');
    });
  });
});
