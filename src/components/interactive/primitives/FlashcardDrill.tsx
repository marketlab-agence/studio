'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, ThumbsDown, ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLessonTrace } from '@/hooks/useLessonTrace';
import { fusionnerLibelles, type ComponentConfig } from '@/lib/schemas/component-config';

/**
 * `FlashcardDrill` — primitive de **mémorisation active** (niveau Bloom : Connaître).
 *
 * ⚠️ **Primitive, pas composant de domaine.** Les cartes sont fournies en **données**.
 *
 * Source REWORK : `@docs/rework/exercices.md` — section **S1 (Découverte)**, qui ne donne pas
 * de barème aux trois activités de découverte (panorama d'outils, premiers prompts, CPA² en
 * pratique). C'est **le poste le plus sous-estimé** : ce sont les seules activités de niveau
 * « Connaître » du parcours, donc indispensables pour couvrir les 6 niveaux de Bloom.
 *
 * ⚠️ **L'apprenant s'auto-évalue** (« je savais » / « je ne savais pas »). Ce n'est pas un
 * contrôle : c'est le mécanisme de la répétition espacée. Le forcer à *saisir* une réponse
 * ajouterait de la friction sans valeur pédagogique pour une simple mémorisation.
 *
 * La trace enregistrée est donc **l'auto-évaluation**, pas une bonne réponse — et c'est
 * exactement ce que l'audit doit voir (indicateur 19 : effectivité du suivi).
 */

export interface Flashcard {
  id: string;
  /** Face avant : la question ou le terme. */
  front: string;
  /** Face arrière : la réponse ou la définition. */
  back: string;
}

export interface FlashcardDrillProps {
  title: string;
  description?: string;
  cards: Flashcard[];
  lessonId: string;
  /** Configuration de l'instance (libellés, données). Facultative. */
  config?: ComponentConfig;
}

export function FlashcardDrill({ title, description, cards, lessonId, config }: FlashcardDrillProps) {
  // ⚠️ Les libellés personnalisés priment, mot par mot ; sans configuration, les défauts restent.
  const libelles = fusionnerLibelles(
    { title: title ?? 'Cartes mémoire', description: description ?? '' },
    config?.labels,
  );

  // ⚠️ Repli `config?.data ?? props` : une instance sans données rend comme aujourd'hui.
  const donnees = config?.data as { cards?: Flashcard[] } | undefined;
  const cartes = donnees?.cards ?? cards;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  /** Cartes que l'apprenant a signalées comme non sues : c'est le résultat le plus utile. */
  const [notKnownIds, setNotKnownIds] = useState<Set<string>>(new Set());

  const { recordStep, recordDuration } = useLessonTrace({ lessonId, componentName: 'FlashcardDrill' });

  const card = cartes[currentIndex];
  const isFinished = currentIndex >= cartes.length;

  const progress = useMemo(
    () => ({ current: Math.min(currentIndex + 1, cartes.length), total: cartes.length }),
    [currentIndex, cartes.length],
  );

  const answer = useCallback(
    (known: boolean) => {
      if (!card) return;

      // ⚠️ La carte est enregistrée **avant** d'avancer : si l'apprenant quitte la page à cet
      // instant, la trace existe déjà (`keepalive` dans le hook).
      void recordStep({
        stepId: card.id,
        kind: 'ANSWER',
        // `PARTIAL` pour une carte non sue : ce n'est pas un échec — l'apprenant l'a
        // honnêtement reconnu, et c'est ainsi qu'il progressera.
        outcome: known ? 'SUCCESS' : 'PARTIAL',
        payload: { known },
      });

      if (!known) {
        setNotKnownIds((previous) => new Set(previous).add(card.id));
      }

      setRevealed(false);
      setCurrentIndex((index) => index + 1);

      if (currentIndex + 1 >= cartes.length) {
        void recordDuration();
      }
    },
    [card, recordStep, recordDuration, currentIndex, cartes.length],
  );

  const restart = useCallback(() => {
    setCurrentIndex(0);
    setRevealed(false);
    setNotKnownIds(new Set());
  }, []);

  if (cartes.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Aucune carte n’est définie.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-4">
          <span>{libelles.title}</span>
          {!isFinished && (
            <Badge variant="secondary">
              {progress.current}/{progress.total}
            </Badge>
          )}
        </CardTitle>
        {libelles.description && <CardDescription>{libelles.description}</CardDescription>}
      </CardHeader>

      <CardContent className="space-y-4">
        {!isFinished && card && (
          <>
            {/* La carte : on lit la question, on devine, PUIS on révèle. */}
            <div
              className={cn(
                'flex min-h-[120px] items-center justify-center rounded-md border p-6 text-center',
                revealed ? 'border-primary/30 bg-primary/5' : 'bg-muted/40',
              )}
            >
              <p className="text-base leading-relaxed" aria-live="polite">
                {revealed ? card.back : card.front}
              </p>
            </div>

            {!revealed ? (
              <Button className="w-full" onClick={() => setRevealed(true)}>
                Voir la réponse
              </Button>
            ) : (
              // ⚠️ On demande « savais-tu ? », pas « était-ce juste ? » : la carte n'est qu'un
              // support, et c'est la lucidité de l'apprenant qui fait progresser.
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Le savais-tu ?</p>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => answer(true)}>
                    <ThumbsUp className="mr-2 h-4 w-4" aria-hidden="true" />
                    Oui
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => answer(false)}>
                    <ThumbsDown className="mr-2 h-4 w-4" aria-hidden="true" />
                    Non, à revoir
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {isFinished && (
          <div className="space-y-2 rounded-md border border-primary/30 bg-primary/5 p-3">
            <p className="text-sm font-medium">
              Révision terminée : {cartes.length - notKnownIds.size} carte(s) sue(s) sur {cartes.length}.
            </p>

            {notKnownIds.size > 0 && (
              <div className="text-xs text-muted-foreground">
                À revoir :
                <ul className="mt-1 list-inside list-disc">
                  {cartes
                    .filter((candidate) => notKnownIds.has(candidate.id))
                    .map((candidate) => (
                      <li key={candidate.id}>{candidate.front}</li>
                    ))}
                </ul>
              </div>
            )}

            <Button variant="outline" size="sm" onClick={restart}>
              <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
              Revoir les cartes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
