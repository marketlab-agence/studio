'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, PenLine, RotateCcw, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLessonTrace } from '@/hooks/useLessonTrace';
import { fusionnerLibelles, type ComponentConfig } from '@/lib/schemas/component-config';

/**
 * `DraftCoach` — primitive de **rédaction guidée** (niveau Bloom : Créer).
 *
 * ⚠️ **Primitive, pas composant de domaine.** Elle guide la rédaction d'un texte selon des
 * **critères** fournis en données, puis montre l'**écart** entre la première version et la
 * version révisée. Elle ne sait pas s'il s'agit d'un objectif pédagogique, d'un prompt ou
 * d'un email commercial.
 *
 * Source REWORK : `@docs/rework/exercices.md` — exercice 3 (objectif pédagogique en 3 étapes :
 * *prompt simple → affiner → imposer le format*). C'est **la structure même de cet exercice** :
 * écrire, recevoir un retour, réécrire. Et `@docs/rework/formats.md` §6 : le modèle
 * **adversarial** (Créatif propose / Critique évalue) poussé jusqu'à la révision.
 *
 * ⚠️ **Ce que cette primitive trace est remarquable** : l'**écart** entre l'avant et l'après.
 * C'est la mesure la plus directe de l'apprentissage — plus parlante qu'une note, et
 * directement opposable en audit (indicateur 19 : appropriation).
 *
 * ⚠️ **Le retour vient de critères, pas d'une IA en ligne.** Branché sur le studio IA
 * (phase 17), il pourra être généré ; en attendant, la **grille de critères** joue ce rôle
 * et reste vérifiable.
 */

export interface DraftCriterion {
  id: string;
  label: string;
  /** Ce qu'il faut vérifier dans le texte. */
  guidance: string;
  /** Motif court recherché dans le texte (facultatif) — rend le critère semi-automatique. */
  pattern?: string;
}

export interface DraftCoachProps {
  title: string;
  description?: string;
  /** Consigne de rédaction. */
  prompt: string;
  /** Exemple de réalisation — affiché comme repère, pas comme réponse. */
  example?: string;
  criteria: DraftCriterion[];
  /** Nombre minimal de caractères pour considérer le texte rédigé. */
  minLength?: number;
  lessonId: string;
  /** Configuration de l'instance (libellés, données). Facultative. */
  config?: ComponentConfig;
}

export function DraftCoach({
  title,
  description,
  prompt,
  example,
  criteria,
  minLength = 80,
  lessonId,
  config,
}: DraftCoachProps) {
  // ⚠️ Les libellés personnalisés priment, mot par mot ; sans configuration, les défauts restent.
  const libelles = fusionnerLibelles(
    { title: title ?? 'Rédaction guidée', description: description ?? '' },
    config?.labels,
  );

  // ⚠️ Repli `config?.data ?? props` : une instance sans données rend comme aujourd'hui.
  const donnees = config?.data as { prompt?: string; example?: string; criteria?: DraftCriterion[] } | undefined;
  const consigne = donnees?.prompt ?? prompt;
  const exemple = donnees?.example ?? example;
  const criteres = donnees?.criteria ?? criteria;

  const [draft, setDraft] = useState('');
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  /** Critères que l'apprenant déclare avoir traités, après relecture. */
  const [addressed, setAddressed] = useState<Set<string>>(new Set());
  const [revision, setRevision] = useState('');
  const [validated, setValidated] = useState(false);

  const { recordProduction, recordStep } = useLessonTrace({ lessonId, componentName: 'DraftCoach' });

  const draftLongEnough = draft.trim().length >= minLength;
  const revisionLongEnough = revision.trim().length >= minLength;

  /**
   * Vérification **semi-automatique** des critères : un motif fourni est cherché dans le texte.
   * ⚠️ Sert d'**indice de relecture**, jamais de notation : un texte peut satisfaire un critère
   * sans contenir le motif attendu.
   */
  const patternHits = useMemo(() => {
    const source = `${draft}\n${revision}`.toLowerCase();
    return Object.fromEntries(
      criteres
        .filter((criterion) => criterion.pattern)
        .map((criterion) => [criterion.id, source.includes((criterion.pattern ?? '').toLowerCase())]),
    );
  }, [draft, revision, criteres]);

  /** Différence de longueur : un indicateur simple et honnête de l'effort de révision. */
  const lengthDelta = revision.trim().length - draft.trim().length;

  const submitDraft = useCallback(() => {
    void recordStep({
      stepId: 'draft',
      kind: 'FREE_TEXT',
      outcome: 'PARTIAL',
      payload: { length: draft.trim().length },
    });
    setFeedbackOpen(true);
  }, [draft, recordStep]);

  const validate = useCallback(() => {
    // ⚠️ **L'écart avant/après est la donnée la plus précieuse de cette primitive.** Elle
    // montre que l'apprenant a **révisé**, pas seulement écrit — c'est l'appropriation même.
    void recordProduction({
      draft,
      revision,
      draftLength: draft.trim().length,
      revisionLength: revision.trim().length,
      lengthDelta,
      criteriaAddressed: [...addressed],
      criteriaTotal: criteres.length,
    });

    void recordStep({
      stepId: 'revision',
      kind: 'REVISION',
      outcome: revisionLongEnough && addressed.size > 0 ? 'SUCCESS' : 'PARTIAL',
      payload: { criteriaAddressed: addressed.size, criteriaTotal: criteres.length },
    });

    setValidated(true);
  }, [draft, revision, lengthDelta, addressed, criteres.length, revisionLongEnough, recordProduction, recordStep]);

  const restart = useCallback(() => {
    setDraft('');
    setFeedbackOpen(false);
    setAddressed(new Set());
    setRevision('');
    setValidated(false);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2">
            <PenLine className="h-5 w-5 text-primary" aria-hidden="true" />
            {libelles.title}
          </span>
          {draftLongEnough && (
            <Badge variant={validated ? 'default' : 'secondary'}>
              {addressed.size}/{criteres.length} critère(s)
            </Badge>
          )}
        </CardTitle>
        {libelles.description && <CardDescription>{libelles.description}</CardDescription>}
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Consigne */}
        <div className="rounded-md border bg-muted/40 p-4">
          <p className="text-sm font-medium">Consigne</p>
          <p className="mt-1 text-sm leading-relaxed">{consigne}</p>
          {exemple && (
            <p className="mt-2 border-t pt-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Exemple de repère :</span> {exemple}
            </p>
          )}
        </div>

        {/* Première version */}
        <div className="space-y-2">
          <Label htmlFor="draft-first" className="text-sm font-medium">
            Ta première version
          </Label>
          <Textarea
            id="draft-first"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Écris librement, sans chercher la perfection : c’est la révision qui compte."
            rows={5}
            // ⚠️ La première version **reste modifiable** tant qu'on n'a pas demandé de retour :
            // l'apprenant doit pouvoir se corriger avant même la relecture.
            disabled={feedbackOpen}
            aria-describedby="draft-length"
          />
          <p id="draft-length" className="text-xs text-muted-foreground">
            {draft.trim().length} caractère(s) — {minLength} minimum.
          </p>
        </div>

        {!feedbackOpen && (
          <Button onClick={submitDraft} disabled={!draftLongEnough}>
            Demander une relecture
          </Button>
        )}

        {/* Grille de relecture — le « retour » au sens REWORK */}
        {feedbackOpen && (
          <div className="space-y-4 rounded-md border border-primary/30 bg-primary/5 p-4">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
              Relis ton texte au regard de ces critères
            </p>

            <ul className="space-y-2">
              {criteres.map((criterion) => {
                const hit = patternHits[criterion.id];
                const isAddressed = addressed.has(criterion.id);

                return (
                  <li key={criterion.id} className="space-y-1">
                    <button
                      type="button"
                      onClick={() =>
                        !validated &&
                        setAddressed((previous) => {
                          const next = new Set(previous);
                          if (next.has(criterion.id)) next.delete(criterion.id);
                          else next.add(criterion.id);
                          return next;
                        })
                      }
                      disabled={validated}
                      aria-pressed={isAddressed}
                      className={cn(
                        'flex w-full items-start gap-2 rounded border p-2 text-left text-sm transition-colors',
                        isAddressed && 'border-primary bg-primary/10',
                        !validated && 'hover:border-primary/60',
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px]',
                          isAddressed ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground',
                        )}
                        aria-hidden="true"
                      >
                        {isAddressed ? '✓' : ''}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="font-medium">{criterion.label}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">{criterion.guidance}</span>
                        {/* Indice de détection : signale, ne juge pas. */}
                        {criterion.pattern && (
                          <span className={cn('mt-1 block text-xs', hit ? 'text-primary' : 'text-muted-foreground')}>
                            {hit
                              ? 'Élément repéré dans ton texte.'
                              : 'Non repéré — à vérifier, ou à formuler autrement.'}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Version révisée */}
        {feedbackOpen && (
          <>
            <div className="space-y-2">
              <Label htmlFor="draft-revision" className="text-sm font-medium">
                Ta version révisée
              </Label>
              <p className="text-xs text-muted-foreground">
                Réécris en tenant compte des critères. C’est cet écart entre tes deux versions qui
                montre ce que tu as appris.
              </p>
              <Textarea
                id="draft-revision"
                value={revision}
                onChange={(event) => setRevision(event.target.value)}
                placeholder="Réécris ici…"
                rows={5}
                disabled={validated}
                aria-describedby="revision-length"
              />
              <p id="revision-length" className="text-xs text-muted-foreground">
                {revision.trim().length} caractère(s) — {minLength} minimum.
              </p>
            </div>

            {!validated && (
              <Button onClick={validate} disabled={!revisionLongEnough || addressed.size === 0}>
                Valider ma version révisée
              </Button>
            )}
          </>
        )}

        {validated && (
          <div className="space-y-3 rounded-md border border-primary/30 bg-primary/5 p-4">
            <p className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
              Révision enregistrée.
            </p>

            {/* L'écart entre les deux versions est présenté à l'apprenant : c'est sa progression
                rendue visible. */}
            <p className="text-xs text-muted-foreground">
              {lengthDelta > 0
                ? `Ta version révisée compte ${lengthDelta} caractère(s) de plus — tu as enrichi ton texte.`
                : lengthDelta < 0
                  ? `Ta version révisée compte ${Math.abs(lengthDelta)} caractère(s) de moins — tu l’as resserré.`
                  : 'La longueur est restée la même : le contenu, lui, a évolué.'}
              {' '}
              {addressed.size}/{criteres.length} critère(s) traité(s).
            </p>

            <Button variant="outline" size="sm" onClick={restart}>
              <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
              Recommencer l’exercice
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
