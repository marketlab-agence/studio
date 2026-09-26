'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLessonTrace } from '@/hooks/useLessonTrace';
import { fusionnerLibelles, type ComponentConfig } from '@/lib/schemas/component-config';

/**
 * `PeerReviewSimulator` — primitive d'**évaluation par critères** (niveau Bloom : Évaluer).
 *
 * ⚠️ **Primitive, pas composant de domaine.** Elle évalue une **production** fournie en données
 * selon des **critères** fournis en données. Elle ne sait pas s'il s'agit d'un quiz, d'une
 * présentation ou d'une fiche programme.
 *
 * Source REWORK : `@docs/rework/exercices.md` — exercice 10 (formulaire d'évaluation à chaud),
 * et `@docs/rework/formats.md` §6 : le modèle **adversarial** (Créatif propose / **Critique
 * note de 1 à 5**). C'est exactement ce que fait cette primitive — sauf que la note est portée
 * par des **critères explicites**, condition posée par l'indicateur 11 (*critères donnés avant
 * l'exercice*, exigence C.7).
 *
 * ⚠️ **« Peer review » simulée** : l'apprenant évalue une production **fournie**, pas celle
 * d'un camarade. C'est volontaire : cela rend l'exercice individuel, reproductible, et évite
 * de dépendre de la présence d'autres apprenants.
 */

export interface ReviewCriterion {
  id: string;
  label: string;
  /** Ce qu'il faut observer — sans quoi la note serait arbitraire. */
  guidance: string;
}

export interface PeerReviewSimulatorProps {
  title: string;
  description?: string;
  /** Production à évaluer (texte ou description). */
  workToReview: string;
  /** Auteur (fictif) de la production. */
  authorLabel?: string;
  criteria: ReviewCriterion[];
  /** Commentaire attendu à partir de cette longueur. */
  minCommentLength?: number;
  lessonId: string;
  /** Configuration de l'instance (libellés, données). Facultative. */
  config?: ComponentConfig;
}

/** Échelle de notation : 4 niveaux, du plus faible au plus fort. */
const SCALE = [1, 2, 3, 4] as const;

export function PeerReviewSimulator({
  title,
  description,
  workToReview,
  authorLabel = 'Production à évaluer',
  criteria,
  minCommentLength = 60,
  lessonId,
  config,
}: PeerReviewSimulatorProps) {
  // ⚠️ Les libellés personnalisés priment, mot par mot ; sans configuration, les défauts restent.
  const libelles = fusionnerLibelles(
    { title: title ?? 'Revue par les pairs', description: description ?? '', authorLabel },
    config?.labels,
  );

  // ⚠️ Repli `config?.data ?? props` : une instance sans données rend comme aujourd'hui.
  const donnees = config?.data as { workToReview?: string; criteria?: ReviewCriterion[] } | undefined;
  const production = donnees?.workToReview ?? workToReview;
  const criteres = donnees?.criteria ?? criteria;

  const [scores, setScores] = useState<Record<string, number>>({});
  const [metCriteria, setMetCriteria] = useState<Set<string>>(new Set());
  const [comment, setComment] = useState('');
  const [validated, setValidated] = useState(false);

  const { recordStep, recordProduction } = useLessonTrace({ lessonId, componentName: 'PeerReviewSimulator' });

  const scoredCount = useMemo(
    () => criteres.filter((criterion) => scores[criterion.id] !== undefined).length,
    [criteres, scores],
  );

  const commentOk = comment.trim().length >= minCommentLength;
  const canValidate = scoredCount === criteres.length && commentOk;

  /** Moyenne des notes — un indicateur de synthèse, pas une note finale. */
  const average = useMemo(() => {
    const values = criteres.map((criterion) => scores[criterion.id]).filter((value) => value !== undefined);
    if (values.length === 0) return 0;
    return values.reduce((total, value) => total + value, 0) / values.length;
  }, [criteres, scores]);

  const validate = useCallback(() => {
    // La production de l'apprenant (notes + commentaire) **est** la trace : c'est son
    // évaluation qui est conservée, pas la production évaluée.
    void recordProduction({
      scores,
      average: Number(average.toFixed(2)),
      criteriaMet: [...metCriteria],
      commentLength: comment.trim().length,
      comment,
    });

    void recordStep({
      stepId: 'review',
      kind: 'ANSWER',
      outcome: scoredCount === criteres.length && commentOk ? 'SUCCESS' : 'PARTIAL',
      payload: { criteriaScored: scoredCount, criteriaTotal: criteres.length },
    });

    setValidated(true);
  }, [scores, average, metCriteria, comment, scoredCount, criteres.length, commentOk, recordProduction, recordStep]);

  const restart = useCallback(() => {
    setScores({});
    setMetCriteria(new Set());
    setComment('');
    setValidated(false);
  }, []);

  if (criteres.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Aucun critère d’évaluation n’est défini.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            {libelles.title}
          </span>
          {validated && <Badge variant="secondary">{average.toFixed(1)}/4</Badge>}
        </CardTitle>
        {libelles.description && <CardDescription>{libelles.description}</CardDescription>}
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Production à évaluer */}
        <div className="rounded-md border bg-muted/40 p-4">
          <p className="text-sm font-medium">{libelles.authorLabel}</p>
          {/* `whitespace-pre-wrap` : les retours à la ligne de la production sont signifiants. */}
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{production}</p>
        </div>

        {/* ⚠️ Les critères sont donnés **avant** l'exercice — exigence de l'indicateur 11
            (« critères donnés avant l'exercice ») : noter sans grille explicite serait arbitraire. */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Évalue selon chaque critère</Label>
            <span className="text-xs text-muted-foreground">
              {scoredCount}/{criteres.length} critère(s) noté(s)
            </span>
          </div>

          {criteres.map((criterion) => (
            <div key={criterion.id} className="space-y-2 rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">{criterion.label}</p>
                <p className="text-xs text-muted-foreground">{criterion.guidance}</p>
              </div>

              {/* Échelle de notation */}
              <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={`Note pour : ${criterion.label}`}>
                {SCALE.map((value) => {
                  const selected = scores[criterion.id] === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => !validated && setScores((previous) => ({ ...previous, [criterion.id]: value }))}
                      disabled={validated}
                      className={cn(
                        'h-8 w-8 rounded-md border text-sm transition-colors',
                        selected ? 'border-primary bg-primary text-primary-foreground' : 'hover:border-primary/60',
                      )}
                      aria-label={`${value} sur 4`}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>

              {/* Critère « atteint » : le retour doit être actionnable, pas seulement chiffré. */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`met-${criterion.id}`}
                  checked={metCriteria.has(criterion.id)}
                  disabled={validated}
                  onCheckedChange={(value) =>
                    setMetCriteria((previous) => {
                      const next = new Set(previous);
                      if (value === true) next.add(criterion.id);
                      else next.delete(criterion.id);
                      return next;
                    })
                  }
                />
                <Label htmlFor={`met-${criterion.id}`} className="text-xs text-muted-foreground">
                  Ce critère est satisfait
                </Label>
              </div>
            </div>
          ))}
        </div>

        {/* Commentaire : le retour écrit, cœur de l'évaluation. */}
        <div className="space-y-2">
          <Label htmlFor="review-comment" className="text-sm font-medium">
            Rédige ton retour
          </Label>
          <Textarea
            id="review-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Points forts, points à améliorer, et pourquoi…"
            rows={4}
            disabled={validated}
          />
          <p className="text-xs text-muted-foreground">
            {validated
              ? `${comment.trim().length} caractère(s) enregistré(s).`
              : `Au moins ${minCommentLength} caractères. Un retour utile explique **pourquoi**, pas seulement **combien**.`}
          </p>
        </div>

        {!validated ? (
          <Button onClick={validate} disabled={!canValidate}>
            Valider l’évaluation
          </Button>
        ) : (
          <div className="space-y-3 rounded-md border border-primary/30 bg-primary/5 p-4">
            <p className="text-sm font-medium">
              Évaluation enregistrée — moyenne : {average.toFixed(1)}/4
            </p>
            <p className="text-xs text-muted-foreground">
              {metCriteria.size}/{criteres.length} critère(s) marqué(s) comme satisfait(s).
            </p>
            <Button variant="outline" size="sm" onClick={restart}>
              <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
              Refaire l’évaluation
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
