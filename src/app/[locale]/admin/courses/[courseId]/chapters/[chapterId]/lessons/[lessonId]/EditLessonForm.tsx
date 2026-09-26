
'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import {
  ChevronRight,
  Save,
  Pencil,
  Loader2,
  Sparkles,
  ChevronUp,
  ChevronDown,
  X,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Lesson, LessonComponent } from '@/types/tutorial.types';
import {
  updateLessonContentAction,
  generateLessonContentAction,
} from '@/actions/courseActions';
import {
  listFunctionalInteractiveNames,
  listNames,
  resolveComponentMeta,
} from '@/components/registry/catalog';
import {
  ajouterComposant,
  analyserDonneesJson,
  attendDesDonnees,
  changerNomComposant,
  deplacerComposant,
  modifierDonnees,
  modifierLibelle,
  renumeroter,
  retirerComposant,
  serialiserDonnees,
} from '@/lib/content/lesson-components';

interface EditLessonFormProps {
    initialLesson: Lesson;
    initialChapterTitle: string;
    courseId: string;
    chapterId: string;
}

/**
 * Noms proposés par le sélecteur, calculés une seule fois.
 *
 * ⚠️ **Interactifs fonctionnels + visuels**, jamais les placeholders : le créateur ne doit
 * pas pouvoir enregistrer une coquille statique comme mise en pratique. Pas de dédoublonnage
 * en revanche — le même composant peut être ajouté plusieurs fois.
 */
const NOMS_INTERACTIFS = listFunctionalInteractiveNames();
const NOMS_VISUELS = listNames('visual');

interface LigneComposantProps {
  composant: LessonComponent;
  index: number;
  total: number;
  onChangeNom: (nom: string) => void;
  onChangerLibelle: (cle: string, valeur: string) => void;
  onChangerDonnees: (data: unknown) => void;
  onDeplacer: (direction: 'haut' | 'bas') => void;
  onRetirer: () => void;
}

/**
 * Une instance de composant : son nom, sa place, ses libellés et ses données.
 *
 * ⚠️ **L'éditeur JSON est délibérément générique (v1).** Générer un formulaire Zod par
 * composant serait juste, mais coûteux et prématuré : le créateur édite les `labels` dans des
 * champs dédiés et les `data` en JSON, avec une erreur de parsing affichée en ligne. La
 * validation **serveur** reste l'arbitre (voir `updateLessonContentAction`).
 */
function LigneComposant({
  composant,
  index,
  total,
  onChangeNom,
  onChangerLibelle,
  onChangerDonnees,
  onDeplacer,
  onRetirer,
}: LigneComposantProps) {
  const t = useTranslations('admin');
  const meta = resolveComponentMeta(composant.name);

  const canonique = serialiserDonnees(composant.config?.data);
  const [texteDonnees, setTexteDonnees] = useState(canonique);
  const [erreurJson, setErreurJson] = useState<string | null>(null);
  const dernierEnvoye = useRef(canonique);

  /**
   * ⚠️ **Réaligne le champ quand la donnée change ailleurs** (génération IA, rechargement,
   * réordonnancement). On compare à la dernière valeur ÉMISE par ce champ : une frappe valide
   * remonte la donnée, `canonique` la reflète et on ne réécrit donc pas sous les doigts de
   * l'utilisateur. Une saisie invalide ne remonte pas : `canonique` reste stable, pas de boucle.
   */
  useEffect(() => {
    if (canonique !== dernierEnvoye.current) {
      setTexteDonnees(canonique);
      setErreurJson(null);
      dernierEnvoye.current = canonique;
    }
  }, [canonique]);

  const gererSaisieDonnees = (valeur: string) => {
    setTexteDonnees(valeur);
    const resultat = analyserDonneesJson(valeur);
    if (!resultat.valide) {
      setErreurJson(resultat.message);
      return;
    }
    setErreurJson(null);
    dernierEnvoye.current = serialiserDonnees(resultat.data);
    onChangerDonnees(resultat.data);
  };

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold">
          {t('editLesson.positionLabel', { position: index + 1 })}
        </span>
        <Select value={composant.name} onValueChange={onChangeNom}>
          <SelectTrigger className="w-full sm:w-72" aria-label={t('editLesson.componentName')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>{t('editLesson.interactiveGroup')}</SelectLabel>
              {NOMS_INTERACTIFS.map((nom) => (
                <SelectItem key={nom} value={nom}>
                  {nom}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>{t('editLesson.visualGroup')}</SelectLabel>
              {NOMS_VISUELS.map((nom) => (
                <SelectItem key={nom} value={nom}>
                  {nom}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={index === 0}
            onClick={() => onDeplacer('haut')}
            aria-label={t('editLesson.moveUp')}
            title={t('editLesson.moveUp')}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={index === total - 1}
            onClick={() => onDeplacer('bas')}
            aria-label={t('editLesson.moveDown')}
            title={t('editLesson.moveDown')}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onRetirer}
            aria-label={t('editLesson.remove')}
            title={t('editLesson.remove')}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!meta && (
        <p className="text-sm text-destructive">
          {t('editLesson.unknownComponent', { name: composant.name })}
        </p>
      )}

      {meta && Object.keys(meta.labelKeys).length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs uppercase text-muted-foreground">
            {t('editLesson.labelsTitle')}
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(meta.labelKeys).map(([cle, defaut]) => (
              <div key={cle} className="space-y-1">
                <Label htmlFor={`label-${index}-${cle}`} className="text-xs">
                  {cle}
                </Label>
                <Input
                  id={`label-${index}-${cle}`}
                  value={composant.config?.labels?.[cle] ?? defaut}
                  onChange={(e) => onChangerLibelle(cle, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {meta && attendDesDonnees(meta) && (
        <div className="space-y-2">
          <Label htmlFor={`data-${index}`}>{t('editLesson.dataTitle')}</Label>
          <Textarea
            id={`data-${index}`}
            value={texteDonnees}
            onChange={(e) => gererSaisieDonnees(e.target.value)}
            className="min-h-[120px] font-code"
            aria-invalid={erreurJson ? true : undefined}
          />
          {erreurJson ? (
            <p className="flex items-center gap-1 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {t('editLesson.invalidJson', { message: erreurJson })}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">{t('editLesson.dataHint')}</p>
          )}
        </div>
      )}
    </div>
  );
}

export function EditLessonForm({
    initialLesson,
    initialChapterTitle,
    courseId,
    chapterId,
}: EditLessonFormProps) {
  const { toast } = useToast();
  const t = useTranslations('admin');
  const tc = useTranslations('common');

  const [lesson, setLesson] = useState<Lesson>(initialLesson);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [nomAAjouter, setNomAAjouter] = useState('');

  /**
   * Applique une transformation **pure** à la liste des composants.
   *
   * ⚠️ Toute la logique (renumérotation, réordonnancement…) vit dans
   * `@/lib/content/lesson-components`, testée sans React. Ici, on ne fait que brancher
   * l'état React à ces fonctions.
   */
  const transformerComposants = (
    transformation: (composants: LessonComponent[]) => LessonComponent[],
  ) => {
    setLesson((prev) => ({
      ...prev,
      components: transformation(prev.components ?? []),
    }));
  };

  const getIndices = () => {
    const chapterIndexMatch = chapterId.match(/-ch(\d+)$/);
    const lessonIndexMatch = lesson.id.match(/-l(\d+)$/);

    if (!chapterIndexMatch || !lessonIndexMatch) {
        toast({ title: t('editLesson.invalidIdTitle'), description: t('editLesson.invalidIdDescription'), variant: 'destructive'});
        return null;
    }

    const chapterIndex = parseInt(chapterIndexMatch[1], 10) - 1;
    const lessonIndex = parseInt(lessonIndexMatch[1], 10) - 1;
    return { chapterIndex, lessonIndex };
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
        // ⚠️ La position n'est pas une donnée de confiance : on l'aligne sur l'ordre avant
        // l'envoi, comme le fera le serveur de son côté.
        const leconAEnregistrer: Lesson = { ...lesson, components: renumeroter(lesson.components ?? []) };
        await updateLessonContentAction(courseId, chapterId, leconAEnregistrer);
        toast({
            title: t('editLesson.savedTitle'),
            description: t('editLesson.savedDescription', { title: lesson.title }),
        });
    } catch (error) {
        console.error(error);
        toast({
            title: tc('errorTitle'),
            description: t('editLesson.saveErrorDescription'),
            variant: "destructive",
        });
    } finally {
        setIsSaving(false);
    }
  };

  const handleGenerateContent = async () => {
    const indices = getIndices();
    if (!indices) return;

    setIsGenerating(true);
    try {
      const { illustrativeContent, components } = await generateLessonContentAction(courseId, indices.chapterIndex, indices.lessonIndex);

      setLesson(prev => ({
          ...prev,
          content: illustrativeContent,
          // L'ordre renvoyé par l'IA devient l'ordre des positions persistées.
          components: components.map((composant, index) => ({
              name: composant.name,
              position: index,
              config: composant.config ?? {},
          })),
      }));

      toast({ title: t('editLesson.generatedTitle'), description: t('editLesson.generatedDescription') });
    } catch (error) {
        console.error(error);
        toast({
            title: t('editLesson.generateErrorTitle'),
            description: t('editLesson.generateErrorDescription'),
            variant: 'destructive',
        });
    } finally {
      setIsGenerating(false);
    }
  };

  const composants = lesson.components ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
        <Link href="/admin" className="hover:text-primary">{t('breadcrumbAdmin')}</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/admin/courses/${courseId}`} className="hover:text-primary">{t('editLesson.breadcrumbCourse')}</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/admin/courses/${courseId}/chapters/${chapterId}`} className="hover:text-primary max-w-xs truncate">{initialChapterTitle}</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-semibold text-foreground truncate max-w-xs">{lesson.title}</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-2 rounded-lg">
                <Pencil className="h-8 w-8 text-primary" />
            </div>
            <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('editLesson.title')}</h1>
            <p className="text-muted-foreground">{t('editLesson.chapterLabel', { title: initialChapterTitle })}</p>
            </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {t('editLesson.save')}
        </Button>
      </div>

      <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle>{t('editLesson.contentTitle')}</CardTitle>
                <Button variant="outline" onClick={handleGenerateContent} disabled={isGenerating}>
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    {t('editLesson.generate')}
                </Button>
            </div>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="space-y-2">
                <Label htmlFor="lessonTitle">{t('editLesson.lessonTitle')}</Label>
                <Input
                    id="lessonTitle"
                    value={lesson.title}
                    onChange={(e) => setLesson(prev => ({...prev, title: e.target.value}))}
                />
            </div>
             <div className="space-y-2">
                <Label htmlFor="lessonObjective">{t('editLesson.objective')}</Label>
                <Input
                    id="lessonObjective"
                    value={lesson.objective}
                    onChange={(e) => setLesson(prev => ({...prev, objective: e.target.value}))}
                />
            </div>
          <div className="space-y-2">
            <Label htmlFor="lessonContent">{t('editLesson.contentLabel')}</Label>
            <Textarea
              id="lessonContent"
              value={lesson.content}
              onChange={(e) => setLesson(prev => ({...prev, content: e.target.value}))}
              className="min-h-[400px] font-code"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>{t('editLesson.componentsTitle')}</CardTitle>
            <CardDescription>
                {t('editLesson.componentsDescription')}
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
                <Select value={nomAAjouter} onValueChange={setNomAAjouter}>
                    <SelectTrigger className="w-full sm:w-80" aria-label={t('editLesson.addComponent')}>
                        <SelectValue placeholder={t('editLesson.addComponent')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>{t('editLesson.interactiveGroup')}</SelectLabel>
                            {NOMS_INTERACTIFS.map((nom) => (
                                <SelectItem key={nom} value={nom}>
                                    {nom}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                        <SelectGroup>
                            <SelectLabel>{t('editLesson.visualGroup')}</SelectLabel>
                            {NOMS_VISUELS.map((nom) => (
                                <SelectItem key={nom} value={nom}>
                                    {nom}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
                <Button
                    type="button"
                    variant="outline"
                    disabled={!nomAAjouter}
                    onClick={() => {
                        transformerComposants((liste) => ajouterComposant(liste, nomAAjouter));
                        setNomAAjouter('');
                    }}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    {t('editLesson.add')}
                </Button>
            </div>

            {composants.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('editLesson.emptyComponents')}</p>
            ) : (
                <div className="space-y-4">
                    {composants.map((composant, index) => (
                        // ⚠️ Clé = index : l'état local du champ JSON se réaligne via l'effet
                        // de `LigneComposant` quand la donnée de la position change.
                        <LigneComposant
                            key={index}
                            composant={composant}
                            index={index}
                            total={composants.length}
                            onChangeNom={(nom) =>
                                transformerComposants((liste) => changerNomComposant(liste, index, nom))
                            }
                            onChangerLibelle={(cle, valeur) =>
                                transformerComposants((liste) => modifierLibelle(liste, index, cle, valeur))
                            }
                            onChangerDonnees={(data) =>
                                transformerComposants((liste) => modifierDonnees(liste, index, data))
                            }
                            onDeplacer={(direction) =>
                                transformerComposants((liste) => deplacerComposant(liste, index, direction))
                            }
                            onRetirer={() =>
                                transformerComposants((liste) => retirerComposant(liste, index))
                            }
                        />
                    ))}
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
