'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLessonTrace } from '@/hooks/useLessonTrace';
import { fusionnerLibelles, type ComponentConfig } from '@/lib/schemas/component-config';

/**
 * `SortingGame` — primitive de **classification** (niveau Bloom : Comprendre).
 *
 * ⚠️ **Primitive, pas composant de domaine.** Elle trie des éléments fournis en **données**
 * dans des catégories fournies en **données**. Elle ne sait rien des outils IA, des objections
 * commerciales ou des commandes Git — c'est ce qui la rend réutilisable.
 *
 * Source REWORK : `@docs/rework/exercices.md` — exercice 8 (appariement), famille
 * « Quiz / QCM ». Classer est l'acte cognitif de « Comprendre » : on ne restitue pas, on
 * **range** ce qu'on a saisi.
 *
 * Voir la table à 3 contraintes dans `@docs/katalyst/primitives-pedagogiques.md`.
 */

export interface SortingCategory {
  id: string;
  label: string;
  /** Explication affichée sous la catégorie — le moment pédagogique. */
  explanation?: string;
}

export interface SortingItem {
  id: string;
  label: string;
  /** Catégorie attendue. */
  categoryId: string;
  /** Motif affiché en cas d'erreur — guide sans donner la réponse. */
  hint?: string;
}

export interface SortingGameProps {
  title: string;
  description?: string;
  categories: SortingCategory[];
  items: SortingItem[];
  lessonId: string;
  /** Instance de composant (`lesson_components.id`), pour attribuer la trace à l'occurrence. */
  lessonComponentId?: string;
  /** Configuration de l'instance (libellés, données). Facultative. */
  config?: ComponentConfig;
}

/**
 * Placement d'un élément.
 * ⚠️ `correct` distingue un élément **bien classé** d'un élément **placé par erreur** : les
 * deux ne s'affichent pas au même endroit, sinon l'apprenant croirait ses erreurs validées.
 */
interface Placement {
  itemId: string;
  categoryId: string;
  correct: boolean;
}

export function SortingGame({ title, description, categories, items, lessonId, lessonComponentId, config }: SortingGameProps) {
  // ⚠️ Les libellés personnalisés priment, mot par mot ; sans configuration, les défauts restent.
  const libelles = fusionnerLibelles(
    { title: title ?? 'Tri par catégorie', description: description ?? '' },
    config?.labels,
  );

  // ⚠️ Repli `config?.data ?? props` : une instance sans données rend comme aujourd'hui.
  const donnees = config?.data as { categories?: SortingCategory[]; items?: SortingItem[] } | undefined;
  const categoriesEffectives = donnees?.categories ?? categories;
  const itemsEffectifs = donnees?.items ?? items;

  const [placements, setPlacements] = useState<Placement[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const { recordStep } = useLessonTrace({ lessonId, componentName: 'SortingGame', lessonComponentId });

  const placedIds = useMemo(() => new Set(placements.map((placement) => placement.itemId)), [placements]);
  const remaining = useMemo(() => itemsEffectifs.filter((item) => !placedIds.has(item.id)), [itemsEffectifs, placedIds]);
  const errors = useMemo(() => placements.filter((placement) => !placement.correct), [placements]);
  const correctCount = placements.length - errors.length;
  const isFinished = remaining.length === 0;

  const select = useCallback((itemId: string) => {
    setSelectedItemId((previous) => (previous === itemId ? null : itemId));
  }, []);

  const place = useCallback(
    (categoryId: string) => {
      if (!selectedItemId) return;

      const item = itemsEffectifs.find((candidate) => candidate.id === selectedItemId);
      if (!item) return;

      const correct = item.categoryId === categoryId;

      // ⚠️ Une erreur est **conservée**, jamais effacée : l'apprenant voit ce qu'il a raté, et
      // la trace l'enregistre. C'est l'information la plus utile à l'encadrant — *où* l'apprenant
      // se trompe. La corriger en silence la priverait de sa valeur pédagogique.
      setPlacements((previous) => [...previous, { itemId: item.id, categoryId, correct }]);

      void recordStep({
        stepId: item.id,
        kind: 'ANSWER',
        outcome: correct ? 'SUCCESS' : 'FAILURE',
        payload: { chosenCategory: categoryId, expectedCategory: item.categoryId },
      });

      setSelectedItemId(null);
    },
    [selectedItemId, itemsEffectifs, recordStep],
  );

  const restart = useCallback(() => {
    setPlacements([]);
    setSelectedItemId(null);
  }, []);

  if (itemsEffectifs.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Aucun élément à classer n’est défini.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-4">
          <span>{libelles.title}</span>
          <Badge variant={isFinished && errors.length === 0 ? 'default' : 'secondary'}>
            {correctCount}/{itemsEffectifs.length}
          </Badge>
        </CardTitle>
        {libelles.description && <CardDescription>{libelles.description}</CardDescription>}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">
            {isFinished
              ? 'Tous les éléments sont classés.'
              : 'Sélectionne un élément, puis la catégorie qui lui correspond.'}
          </p>

          {/* Éléments restants */}
          <div className="flex flex-wrap gap-2" role="group" aria-label="Éléments à classer">
            {remaining.map((item) => (
              <Button
                key={item.id}
                variant={selectedItemId === item.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => select(item.id)}
                aria-pressed={selectedItemId === item.id}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Catégories : chaque élément bien classé apparaît sous SA catégorie attendue. */}
        <div className="grid gap-3 sm:grid-cols-2">
          {categoriesEffectives.map((category) => {
            // Éléments attendus dans cette catégorie **et** correctement placés.
            const placedHere = placements.filter(
              (placement) =>
                placement.correct &&
                itemsEffectifs.find((item) => item.id === placement.itemId)?.categoryId === category.id,
            );

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => place(category.id)}
                disabled={!selectedItemId}
                className={cn(
                  'rounded-md border p-3 text-left transition-colors',
                  selectedItemId ? 'hover:border-primary hover:bg-accent' : 'opacity-60',
                )}
              >
                <span className="block text-sm font-medium">{category.label}</span>

                {placedHere.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {placedHere.map((placement) => (
                      <li key={placement.itemId} className="flex items-center gap-1.5 text-xs">
                        <CheckCircle2 className="h-3 w-3 text-primary" aria-hidden="true" />
                        {itemsEffectifs.find((item) => item.id === placement.itemId)?.label}
                      </li>
                    ))}
                  </ul>
                )}

                {category.explanation && (
                  <span className="mt-2 block text-xs text-muted-foreground">{category.explanation}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* ⚠️ Les erreurs sont affichées **à part de toute catégorie** : les ranger dans la
            catégorie choisie laisserait croire qu'elles y appartiennent. */}
        {errors.length > 0 && (
          <div className="space-y-1 rounded-md border border-destructive/30 bg-destructive/5 p-3">
            <p className="text-sm font-medium text-destructive">À revoir</p>
            {errors.map((placement) => {
              const item = itemsEffectifs.find((candidate) => candidate.id === placement.itemId);
              const chosen = categoriesEffectives.find((category) => category.id === placement.categoryId);

              return (
                <p key={placement.itemId} className="flex items-start gap-1.5 text-xs text-destructive">
                  <XCircle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                  <span>
                    « {item?.label} » n’appartient pas à « {chosen?.label} ».
                    {item?.hint && <span className="text-muted-foreground"> {item.hint}</span>}
                  </span>
                </p>
              );
            })}
          </div>
        )}

        {isFinished && (
          <div className="space-y-2 rounded-md border border-primary/30 bg-primary/5 p-3">
            <p className="text-sm font-medium">
              {errors.length === 0
                ? 'Classement complet et exact.'
                : `${correctCount} élément(s) sur ${itemsEffectifs.length} correctement classé(s).`}
            </p>
            <Button variant="outline" size="sm" onClick={restart}>
              <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
              Recommencer
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
