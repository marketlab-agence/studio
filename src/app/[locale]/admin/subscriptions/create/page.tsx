
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CreditCard, Save, Loader2, BookCopy, Star } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useRouter, useSearchParams } from 'next/navigation';
import { type SubscriptionPlan } from '@/types/plans.types';
import { getPlansAction, createOrUpdatePlanAction } from '@/actions/planActions';
import { getAdminCoursesAction } from '@/actions/adminActions';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslations } from 'next-intl';

type Course = {
  id: string;
  title: string;
  lessonsCount: number;
  status: 'Publié' | 'Brouillon' | 'Plan';
};

export default function CreatePlanPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan');
  const isEditing = !!planId;
  const t = useTranslations('admin');
  const tc = useTranslations('common');

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [planName, setPlanName] = useState('');
  const [price, setPrice] = useState('');
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [description, setDescription] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const coursesData = await getAdminCoursesAction();
        setAllCourses(coursesData.filter(c => c.status === 'Publié'));

        if (isEditing && planId) {
          const plans = await getPlansAction();
          const planData = plans.find(p => p.id === planId);
          if (planData) {
            setPlanName(planData.name);
            setPrice(planData.price.toString());
            setBillingPeriod(planData.billingPeriod);
            setDescription(planData.description);
            setFeatures(planData.features || []);
            setSelectedCourses(planData.courses || []);
          }
        }
      } catch (error) {
        console.error("Failed to load page data:", error);
        toast({ title: t('createPlan.loadErrorTitle'), description: t('createPlan.loadErrorDescription'), variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [planId, isEditing, toast, t]);

  const handleAddFeature = () => {
    setFeatures([...features, '']);
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = value;
    setFeatures(newFeatures);
  };
  
  const handleCourseSelectionChange = (courseId: string) => {
    setSelectedCourses(prev => 
        prev.includes(courseId) 
            ? prev.filter(id => id !== courseId)
            : [...prev, courseId]
    );
  };

  const handleSavePlan = async () => {
    setIsSaving(true);
    
    const planData: Omit<SubscriptionPlan, 'id'> = {
      name: planName,
      price: parseFloat(price) || 0,
      billingPeriod: billingPeriod as SubscriptionPlan['billingPeriod'],
      description,
      features: features.filter(f => f.trim() !== ''),
      courses: selectedCourses,
      cta: 'S\'inscrire', // Simplified CTA
      recommended: false, // You might want to add a switch for this
    };

    try {
        const savedPlan = await createOrUpdatePlanAction(planData, planId || undefined);
        toast({
            title: isEditing ? t('createPlan.updatedTitle') : t('createPlan.savedTitle'),
            description: t('createPlan.savedDescription', { name: savedPlan.name }),
        });
        if (!isEditing) {
            router.push(`/admin/subscriptions/create?plan=${savedPlan.id}`);
        }
    } catch(e) {
        toast({ title: tc('errorTitle'), description: t('createPlan.saveErrorDescription'), variant: 'destructive'});
    } finally {
        setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return <div>{t('createPlan.loading')}</div>;
  }

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <Button asChild variant="outline" size="sm">
            <Link href="/admin/subscriptions">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('createPlan.back')}
            </Link>
            </Button>
            <Button onClick={handleSavePlan} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isEditing ? t('createPlan.saveChanges') : t('createPlan.savePlan')}
            </Button>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-2 rounded-lg">
                <CreditCard className="h-8 w-8 text-primary" />
            </div>
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                    {isEditing && planName ? t('createPlan.editTitle', { name: planName }) : t('createPlan.createTitle')}
                </h1>
                <p className="text-muted-foreground">
                    {isEditing ? t('createPlan.editSubtitle') : t('createPlan.createSubtitle')}
                </p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('createPlan.detailsTitle')}</CardTitle>
                        <CardDescription>{t('createPlan.detailsDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="plan-name">{t('createPlan.nameLabel')}</Label>
                            <Input id="plan-name" placeholder={t('createPlan.namePlaceholder')} value={planName} onChange={e => setPlanName(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="plan-price">{t('createPlan.priceLabel')}</Label>
                                <Input id="plan-price" type="number" placeholder={t('createPlan.pricePlaceholder')} value={price} onChange={e => setPrice(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="billing-period">{t('createPlan.billingPeriodLabel')}</Label>
                                <Select value={billingPeriod} onValueChange={setBillingPeriod}>
                                    <SelectTrigger id="billing-period">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="monthly">{t('createPlan.billingMonthly')}</SelectItem>
                                        <SelectItem value="yearly">{t('createPlan.billingYearly')}</SelectItem>
                                        <SelectItem value="once">{t('createPlan.billingOnce')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="plan-description">{t('createPlan.descriptionLabel')}</Label>
                            <Textarea id="plan-description" placeholder={t('createPlan.descriptionPlaceholder')} value={description} onChange={e => setDescription(e.target.value)} />
                        </div>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Star /> {t('createPlan.featuresTitle')}</CardTitle>
                        <CardDescription>{t('createPlan.featuresDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <Input 
                                    value={feature} 
                                    onChange={(e) => handleFeatureChange(index, e.target.value)}
                                    placeholder={t('createPlan.featurePlaceholder')}
                                />
                            </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={handleAddFeature}>{t('createPlan.addFeature')}</Button>
                    </CardContent>
                </Card>
            </div>
            
            <div className="lg:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BookCopy /> {t('createPlan.includedCoursesTitle')}</CardTitle>
                        <CardDescription>{t('createPlan.includedCoursesDescription')}</CardDescription>
                    </CardHeader>
                     <CardContent>
                        <ScrollArea className="h-72">
                            <div className="space-y-2 p-2">
                                {allCourses.map(course => (
                                    <div key={course.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted">
                                        <Checkbox
                                            id={`course-${course.id}`}
                                            checked={selectedCourses.includes(course.id)}
                                            onCheckedChange={() => handleCourseSelectionChange(course.id)}
                                        />
                                        <label
                                            htmlFor={`course-${course.id}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            {course.title}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
