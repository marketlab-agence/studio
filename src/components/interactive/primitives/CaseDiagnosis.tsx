'use client';

import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Lightbulb, Stethoscope } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLessonTrace } from '@/hooks/useLessonTrace';
import { fusionnerLibelles, type ComponentConfig } from '@/lib/schemas/component-config';

/**
 * `CaseDiagnosis` — primitive de **diagnostic** (niveau Bloom : Analyser).
 *
 * ⚠️ **Primitive, pas composant de domaine.** Elle présente une **situation** et des **causes
 * candidates** fournies en données. Elle ne sait rien du dépôt Git cassé, du workflow n8n
 * défaillant ou du dossier client bloqué.
 *
 * Source REWORK : `@docs/rework/exercices.md` — exercice 2 (analyser un public cible) et
 * exercice 12 (fiche réflexe SAVI), tous deux fondés sur l'analyse d'une **situation**.
 * Diagnostiquer est l'acte cognitif d'« Analyser » : décomposer pour identifier la cause.
 *
 * ⚠️ **Ce qui distingue cette primitive d'un quiz.** Un quiz demande « quelle est la cause ? ».
 * Ici, l'apprenant **sélectionne plusieurs indices** avant de conclure, puis **justifie**.
 * C'est la démarche qui est évaluée, pas seulement la réponse — et c'est ce qui en fait un
 * exercice d'**analyse** plutôt que de **connaissance**.
 */

export interface DiagnosticClue {
  id: string;
  /** Indice observable dans la situation. */
  label: string;
  /** Vrai si cet indice est effectivement pertinent pour le diagnostic. */
  relevant: boolean;
  /** Ce que cet indice révèle, affiché après validation. */
  significance?: string;
}

export interface DiagnosticCause {
  id: string;
  label: string;
}

export interface CaseDiagnosisProps {
  title: string;
  description?: string;
  /** Description de la situation à diagnostiquer. */
  situation: string;
  /** Indices observables : l'apprenant doit distinguer les pertinents. */
  clues: DiagnosticClue[];
  /** Causes candidates : une seule est la bonne. */
  causes: DiagnosticCause[];
  /** Identifiant de la cause correcte. */
  correctCauseId: string;
  lessonId: string;
  /** Instance de composant (`lesson_components.id`), pour attribuer la trace à l'occurrence. */
  lessonComponentId?: string;
  /** Configuration de l'instance (libellés, données). Facultative. */
  config?: ComponentConfig;
}

export function CaseDiagnosis({
  title,
  description,
  situation,
  clues,
  causes,
  correctCauseId,
  lessonId,
  lessonComponentId,
  config,
}: CaseDiagnosisProps) {
  // ⚠️ Les libellés personnalisés priment, mot par mot ; sans configuration, les défauts restent.
  const libelles = fusionnerLibelles(
    { title: title ?? 'Diagnostic de cas', description: description ?? '' },
    config?.labels,
  );

  // ⚠️ Repli `config?.data ?? props` : une instance sans données rend comme aujourd'hui.
  const donnees = config?.data as
    | { situation?: string; clues?: DiagnosticClue[]; causes?: DiagnosticCause[]; correctCauseId?: string }
    | undefined;
  const situationEffective = donnees?.situation ?? situation;
  const indices = donnees?.clues ?? clues;
  const causesEffectives = donnees?.causes ?? causes;
  const causeCorrecteId = donnees?.correctCauseId ?? correctCauseId;

  const [selectedClueIds, setSelectedClueIds] = useState<Set<string>>(new Set());
  const [selectedCauseId, setSelectedCauseId] = useState<string | null>(null);
  const [justification, setJustification] = useState('');
  const [validated, setValidated] = useState(false);

  const { recordStep } = useLessonTrace({ lessonId, componentName: 'CaseDiagnosis', lessonComponentId });

  const toggleClue = useCallback((clueId: string) => {
    setSelectedClueIds((previous) => {
      const next = new Set(previous);
      if (next.has(clueId)) next.delete(clueId);
      else next.add(clueId);
      return next;
    });
  }, []);

  const validate = useCallback(() => {
    if (!selectedCauseId) return;

    const causeCorrect = selectedCauseId === causeCorrecteId;
    const relevantClues = indices.filter((clue) => clue.relevant).map((clue) => clue.id);
    const chosenRelevant = [...selectedClueIds].filter((id) => relevantClues.includes(id));
    const irrelevantChosen = [...selectedClueIds].filter((id) => !relevantClues.includes(id));

    // ⚠️ Deux dimensions, tracées séparément : la **conclusion** (la cause) et la **démarche**
    // (les indices retenus). Un apprenant peut trouver la bonne cause en s'appuyant sur de
    // mauvais indices — c'est une information précieuse pour l'encadrant, qu'un simple
    // « juste/faux » masquerait.
    void recordStep({
      stepId: 'diagnosis',
      kind: 'ANSWER',
      outcome: causeCorrect ? 'SUCCESS' : 'FAILURE',
      payload: {
        selectedCause: selectedCauseId,
        correctCause: causeCorrecteId,
        relevantCluesChosen: chosenRelevant.length,
        relevantCluesTotal: relevantClues.length,
        irrelevantCluesChosen: irrelevantChosen.length,
        justificationLength: justification.trim().length,
      },
    });

    setValidated(true);
  }, [selectedCauseId, causeCorrecteId, indices, selectedClueIds, justification, recordStep]);

  const restart = useCallback(() => {
    setSelectedClueIds(new Set());
    setSelectedCauseId(null);
    setJustification('');
    setValidated(false);
  }, []);

  const causeCorrect = validated && selectedCauseId === causeCorrecteId;
  const relevantClues = indices.filter((clue) => clue.relevant);
  const chosenRelevantCount = [...selectedClueIds].filter((id) => relevantClues.some((clue) => clue.id === id)).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-primary" aria-hidden="true" />
          {libelles.title}
        </CardTitle>
        {libelles.description && <CardDescription>{libelles.description}</CardDescription>}
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Situation */}
        <div className="rounded-md border bg-muted/40 p-4">
          <p className="text-sm font-medium">Situation</p>
          <p className="mt-1 text-sm leading-relaxed">{situationEffective}</p>
        </div>

        {/* Indices — l'apprenant trie le pertinent du bruit. */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Quels indices retiens-tu ? ({selectedClueIds.size} sélectionné(s))
          </Label>
          <p className="text-xs text-muted-foreground">
            Tous les éléments ne sont pas pertinents : un diagnostic repose sur ce qu’on choisit d’observer.
          </p>

          <div className="space-y-1.5" role="group" aria-label="Indices observables">
            {indices.map((clue) => {
              const selected = selectedClueIds.has(clue.id);
              return (
                <button
                  key={clue.id}
                  type="button"
                  onClick={() => !validated && toggleClue(clue.id)}
                  disabled={validated}
                  aria-pressed={selected}
                  className={cn(
                    'flex w-full items-start gap-2 rounded-md border p-2 text-left text-sm transition-colors',
                    selected && 'border-primary bg-primary/5',
                    !validated && 'hover:border-primary/60',
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px]',
                      selected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground',
                    )}
                    aria-hidden="true"
                  >
                    {selected ? '✓' : ''}
                  </span>
                  <span className="min-w-0 flex-1">
                    {clue.label}
                    {/* Le sens de l'indice n'est révélé qu'après validation : sinon, le simple
                        affichage donnerait la réponse. */}
                    {validated && clue.significance && (
                      <span
                        className={cn(
                          'mt-1 block text-xs',
                          clue.relevant ? 'text-muted-foreground' : 'text-destructive',
                        )}
                      >
                        {clue.relevant ? clue.significance : `Peu pertinent ici : ${clue.significance}`}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Causes candidates */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Quelle est la cause la plus probable ?</Label>

          <div className="space-y-1.5" role="radiogroup" aria-label="Causes candidates">
            {causesEffectives.map((cause) => {
              const selected = selectedCauseId === cause.id;
              const isCorrect = cause.id === causeCorrecteId;

              return (
                <button
                  key={cause.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => !validated && setSelectedCauseId(cause.id)}
                  disabled={validated}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md border p-2 text-left text-sm transition-colors',
                    selected && 'border-primary bg-primary/5',
                    validated && isCorrect && 'border-primary bg-primary/10',
                    validated && selected && !isCorrect && 'border-destructive bg-destructive/5',
                    !validated && 'hover:border-primary/60',
                  )}
                >
                  {validated && isCorrect && (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  )}
                  {cause.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Justification — c'est la démarche d'analyse, donc l'essentiel. */}
        {!validated && (
          <div className="space-y-2">
            <Label htmlFor="diagnosis-justification" className="text-sm font-medium">
              Justifie ton diagnostic
            </Label>
            <Textarea
              id="diagnosis-justification"
              value={justification}
              onChange={(event) => setJustification(event.target.value)}
              placeholder="Appuie-toi sur les indices que tu as retenus…"
              rows={3}
            />
          </div>
        )}

        {!validated ? (
          <Button onClick={validate} disabled={!selectedCauseId}>
            Valider le diagnostic
          </Button>
        ) : (
          <div className="space-y-3 rounded-md border border-primary/30 bg-primary/5 p-4">
            <p className="flex items-center gap-2 text-sm font-medium">
              {causeCorrect ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                  Diagnostic exact.
                </>
              ) : (
                <>
                  <Lightbulb className="h-4 w-4 text-primary" aria-hidden="true" />
                  Diagnostic à revoir.
                </>
              )}
            </p>

            {/* Retour sur la **démarche**, pas seulement sur la conclusion. */}
            <p className="text-xs text-muted-foreground">
              Indices pertinents retenus : {chosenRelevantCount}/{relevantClues.length}.
              {chosenRelevantCount < relevantClues.length &&
                ' Certains indices utiles ont été écartés.'}
              {selectedClueIds.size > chosenRelevantCount &&
                ' Des éléments peu pertinents ont été retenus — un bon diagnostic écarte aussi les leurres.'}
            </p>

            <Button variant="outline" size="sm" onClick={restart}>
              Refaire le diagnostic
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
