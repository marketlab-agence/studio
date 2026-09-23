'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Hammer, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLessonTrace } from '@/hooks/useLessonTrace';

/**
 * `BuilderCanvas` — primitive de **construction** (niveau Bloom : Créer).
 *
 * ⚠️ **Primitive, pas composant de domaine.** Elle construit un artefact à partir d'une
 * **structure de rubriques** fournie en données : un canevas de fiche programme, un plan de
 * slides, un flux d'étapes, une règle de jeu. Elle ne sait rien du sujet.
 *
 * Source REWORK : `@docs/rework/exercices.md` — exercices 1 (fiche programme 17 rubriques),
 * 4 (déroulé 6 colonnes), 11 (règle de jeu), 13 (system prompt 4 points). **Quatre des treize
 * exercices** produisent un document structuré : c'est la forme d'exercice la plus fréquente
 * de la méthode, donc la primitive la plus utile.
 *
 * ⚠️ **C'est le niveau le plus exigeant de la taxonomie.** L'apprenant ne choisit pas parmi
 * des options : il **produit**. La trace est donc sa production complète — ce qui rend
 * l'indicateur 19 (appropriation) particulièrement bien servi ici.
 */

export interface CanvasSection {
  id: string;
  /** Intitulé de la rubrique (« Public visé », « Objectifs », « Durée »…). */
  label: string;
  /** Ce qu'on attend dans cette rubrique — sans quoi l'apprenant devine. */
  prompt?: string;
  /** Texte d'exemple, affiché comme indication et non comme réponse. */
  placeholder?: string;
  /** Rubrique obligatoire pour valider le canevas. */
  required?: boolean;
}

export interface BuilderCanvasProps {
  title: string;
  description?: string;
  /** Rubriques du canevas, dans l'ordre d'un document réel. */
  sections: CanvasSection[];
  /**
   * Éléments répétables (lignes d'un tableau, étapes d'un déroulé).
   * `undefined` = canevas à rubriques fixes.
   */
  repeatable?: {
    /** Intitulé du bloc répétable (« Chapitre », « Slide », « Étape »…). */
    label: string;
    /** Nombre maximal d'occurrences (protection contre la saisie sans fin). */
    max?: number;
  };
  lessonId: string;
}

export function BuilderCanvas({
  title,
  description,
  sections,
  repeatable,
  lessonId,
}: BuilderCanvasProps) {
  /** Réponses aux rubriques fixes. */
  const [values, setValues] = useState<Record<string, string>>({});
  /** Éléments répétables : chaque entrée porte ses propres rubriques. */
  const [rows, setRows] = useState<Record<string, string>[]>(repeatable ? [{}] : []);
  const [validated, setValidated] = useState(false);

  const { recordProduction, recordStep } = useLessonTrace({ lessonId, componentName: 'BuilderCanvas' });

  const requiredSections = useMemo(() => sections.filter((section) => section.required), [sections]);

  const filledRequired = useMemo(
    () =>
      requiredSections.filter((section) => (values[section.id] ?? '').trim().length > 0).length,
    [requiredSections, values],
  );

  const filledTotal = useMemo(
    () => sections.filter((section) => (values[section.id] ?? '').trim().length > 0).length,
    [sections, values],
  );

  // Pour un canevas répétable, il faut au moins une ligne renseignée.
  const rowsOk = !repeatable || rows.some((row) => Object.values(row).some((value) => value.trim().length > 0));
  const canValidate =
    filledRequired === requiredSections.length && rowsOk && requiredSections.length + (repeatable ? 1 : 0) > 0;

  const validate = useCallback(() => {
    // La **production complète** est enregistrée : c'est elle, la trace d'appropriation.
    void recordProduction({
      sections: values,
      rows: repeatable ? rows : undefined,
      filledSections: filledTotal,
      totalSections: sections.length,
    });

    void recordStep({
      stepId: 'canvas',
      kind: 'ANSWER',
      outcome: canValidate ? 'SUCCESS' : 'PARTIAL',
      payload: { filledSections: filledTotal, totalSections: sections.length },
    });

    setValidated(true);
  }, [values, rows, repeatable, filledTotal, sections.length, canValidate, recordProduction, recordStep]);

  const restart = useCallback(() => {
    setValues({});
    setRows(repeatable ? [{}] : []);
    setValidated(false);
  }, [repeatable]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2">
            <Hammer className="h-5 w-5 text-primary" aria-hidden="true" />
            {title}
          </span>
          <Badge variant={validated && canValidate ? 'default' : 'secondary'}>
            {filledTotal}/{sections.length}
          </Badge>
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Rubriques fixes */}
        <div className="space-y-4">
          {sections.map((section) => {
            const value = values[section.id] ?? '';
            const filled = value.trim().length > 0;

            return (
              <div key={section.id} className="space-y-1.5">
                <Label htmlFor={`canvas-${section.id}`} className="flex items-center gap-2 text-sm font-medium">
                  {section.label}
                  {section.required && (
                    <span className="text-xs text-muted-foreground" title="Rubrique obligatoire">
                      (obligatoire)
                    </span>
                  )}
                  {filled && <CheckCircle2 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />}
                </Label>

                {section.prompt && (
                  <p className="text-xs text-muted-foreground">{section.prompt}</p>
                )}

                {/* ⚠️ Le champ s'adapte à la longueur attendue : un intitulé tient sur une ligne,
                    une description non. Imposer un `Textarea` partout alourdirait la saisie. */}
                {(section.prompt?.length ?? 0) > 80 ? (
                  <Textarea
                    id={`canvas-${section.id}`}
                    value={value}
                    onChange={(event) => setValues((previous) => ({ ...previous, [section.id]: event.target.value }))}
                    placeholder={section.placeholder}
                    rows={3}
                    disabled={validated}
                  />
                ) : (
                  <Input
                    id={`canvas-${section.id}`}
                    value={value}
                    onChange={(event) => setValues((previous) => ({ ...previous, [section.id]: event.target.value }))}
                    placeholder={section.placeholder}
                    disabled={validated}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Bloc répétable */}
        {repeatable && (
          <div className="space-y-3 rounded-md border p-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                {repeatable.label}s ({rows.length}
                {repeatable.max ? ` / ${repeatable.max}` : ''})
              </Label>

              {!validated && (!repeatable.max || rows.length < repeatable.max) && (
                <Button variant="outline" size="sm" onClick={() => setRows((previous) => [...previous, {}])}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                  Ajouter
                </Button>
              )}
            </div>

            {rows.map((row, rowIndex) => (
              <div key={rowIndex} className="space-y-2 rounded border bg-muted/30 p-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    {repeatable.label} {rowIndex + 1}
                  </span>
                  {!validated && rows.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRows((previous) => previous.filter((_, index) => index !== rowIndex))}
                      aria-label={`Supprimer ${repeatable.label} ${rowIndex + 1}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  )}
                </div>

                {/* Chaque ligne reprend des rubriques courtes : titre + précision. */}
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    value={row.title ?? ''}
                    onChange={(event) =>
                      setRows((previous) =>
                        previous.map((candidate, index) =>
                          index === rowIndex ? { ...candidate, title: event.target.value } : candidate,
                        ),
                      )
                    }
                    placeholder="Titre"
                    disabled={validated}
                    aria-label={`${repeatable.label} ${rowIndex + 1} — titre`}
                  />
                  <Input
                    value={row.detail ?? ''}
                    onChange={(event) =>
                      setRows((previous) =>
                        previous.map((candidate, index) =>
                          index === rowIndex ? { ...candidate, detail: event.target.value } : candidate,
                        ),
                      )
                    }
                    placeholder="Précision"
                    disabled={validated}
                    aria-label={`${repeatable.label} ${rowIndex + 1} — précision`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Progression vers la validation */}
        {!validated && (
          <div className="space-y-2">
            <p className={cn('text-xs', canValidate ? 'text-primary' : 'text-muted-foreground')}>
              {canValidate
                ? 'Le canevas est complet : tu peux le valider.'
                : `Encore ${requiredSections.length - filledRequired} rubrique(s) obligatoire(s) à renseigner.`}
            </p>
            <Button onClick={validate} disabled={!canValidate}>
              Valider le canevas
            </Button>
          </div>
        )}

        {validated && (
          <div className="space-y-3 rounded-md border border-primary/30 bg-primary/5 p-4">
            <p className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
              Canevas enregistré ({filledTotal}/{sections.length} rubriques renseignées).
            </p>
            <p className="text-xs text-muted-foreground">
              Ta production est conservée : elle constitue la trace de ton travail.
            </p>
            <Button variant="outline" size="sm" onClick={restart}>
              <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
              Reprendre le canevas
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
