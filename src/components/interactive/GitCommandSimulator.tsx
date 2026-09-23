'use client';

import { StepByStepRunner, type ProcedureStep } from './primitives/StepByStepRunner';

/**
 * `GitCommandSimulator` — **configuration Git de la primitive `StepByStepRunner`**.
 *
 * ⚠️ **Ce composant a été réécrit, pas réparé.** Il était un *placeholder* : un champ de
 * saisie, un bouton « Exécuter » **sans `onClick`**, et une zone de sortie affichant
 * « sortie de la commande… ». Aucune interaction, donc **aucune trace** — l'indicateur 19 du
 * RNQ (effectivité du suivi) n'était pas satisfait.
 *
 * Le réparer aurait produit un composant Git de plus, définitivement lié à Git. Le réécrire
 * comme **configuration** produit un socle réutilisable : le jour où l'on ajoute n8n, Docker
 * ou un outil métier, il suffit d'**une nouvelle procédure**, pas d'un nouveau composant.
 *
 * ⚠️ **Test de validité du socle** (étape 14). Si `StepByStepRunner` ne peut pas produire ce
 * composant, c'est le **socle** qui est à revoir — pas ce fichier.
 *
 * Voir `@docs/katalyst/primitives-pedagogiques.md` §4 (table des reconfigurations).
 */

interface GitCommandSimulatorProps {
  /** Identifiant de la leçon — nécessaire à la trace d'interaction. */
  lessonId?: string;
}

/**
 * Procédure de référence : les commandes Git essentielles, dans l'ordre où on les apprend.
 *
 * ⚠️ Ces étapes sont **des données**, pas du code. Un formateur pourra les adapter (autre
 * dépôt, autre scénario) sans qu'on touche au composant — c'est la règle d'admissibilité de
 * `@docs/rework/exercices.md` : *« adapter le sujet, garder la structure »*.
 */
const GIT_COMMANDS_PROCEDURE: ProcedureStep[] = [
  {
    id: 'clone',
    instruction: 'Cloner un dépôt distant dans un nouveau dossier',
    expected: 'git clone',
    hint: 'La commande commence par « git cl… » — elle crée une copie locale du dépôt.',
    explanation:
      '`git clone` copie le dépôt distant **et tout son historique** : tu travailles ainsi sur une copie complète, sans risque pour l’original.',
  },
  {
    id: 'status',
    instruction: 'Vérifier l’état du dépôt (fichiers modifiés, indexés)',
    expected: 'git status',
    hint: 'C’est la commande la plus utilisée : elle indique où en est ton travail.',
    explanation:
      '`git status` est le **tableau de bord** de Git. En cas de doute, c’est toujours la première commande à exécuter.',
  },
  {
    id: 'add',
    instruction: 'Ajouter un fichier modifié à la zone de staging',
    expected: 'git add',
    hint: '« add » signifie « ajouter à l’index » — la file d’attente du prochain commit.',
    explanation:
      '`git add` place une modification dans la **zone de staging**. C’est cette étape intermédiaire qui te permet de choisir précisément ce que tu commites.',
  },
  {
    id: 'commit',
    instruction: 'Enregistrer les modifications indexées avec un message',
    expected: 'git commit',
    hint: 'Cette commande crée un point de sauvegarde dans l’historique.',
    explanation:
      '`git commit` enregistre un **instantané permanent**. Chaque commit est identifié de façon unique, ce qui rend tout l’historique consultable et réversible.',
  },
  {
    id: 'push',
    instruction: 'Envoyer les commits locaux vers le dépôt distant',
    expected: 'git push',
    hint: '« push » = pousser : envoyer son travail aux autres.',
    explanation:
      '`git push` publie tes commits. Avant lui, ton travail n’existe **que sur ta machine** — c’est pourquoi on commit souvent et on pousse régulièrement.',
  },
];

export function GitCommandSimulator({ lessonId = 'unknown' }: GitCommandSimulatorProps) {
  return (
    <StepByStepRunner
      lessonId={lessonId}
      title="Commandes Git essentielles"
      description="Exécute la procédure dans l’ordre. Chaque étape est validée avant de passer à la suivante : les commandes que tu maîtrises sont ainsi distinguées de celles que tu découvres."
      steps={GIT_COMMANDS_PROCEDURE}
      completionMessage="Les cinq commandes essentielles de Git sont maîtrisées."
    />
  );
}
