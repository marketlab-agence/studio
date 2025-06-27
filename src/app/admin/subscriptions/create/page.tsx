
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CreditCard, Save, Loader2, BookCopy, Star } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PLANS_DATA, ALL_FEATURES, type FeaturePermission } from '@/lib/plans';

const availableCourses = [
  { id: 'git-github-tutorial', name: 'Git & GitHub : Le Guide Complet' },
  // Add other courses here as they become available
];

export default function CreatePlanPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan');
  const isEditing = !!planId;

  const [isSaving, setIsSaving] = useState(false);
  
  const [planName, setPlanName] = useState('');
  const [price, setPrice] = useState('');
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<FeaturePermission[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  useEffect(() => {
    if (isEditing && planId && PLANS_DATA[planId]) {
      const planData = PLANS_DATA[planId];
      setPlanName(planData.name);
      setPrice(planData.price.toString());
      setBillingPeriod(planData.billingPeriod);
      setDescription(planData.description);
      setSelectedPermissions(planData.permissions);
      setSelectedCourses(planData.courses);
    }
  }, [planId, isEditing]);

  const handlePermissionChange = (permissionId: FeaturePermission) => {
    setSelectedPermissions(prev => 
        prev.includes(permissionId) 
            ? prev.filter(id => id !== permissionId)
            : [...prev, permissionId]
    );
  };
  
  const handleCourseSelectionChange = (courseId: string) => {
    setSelectedCourses(prev => 
        prev.includes(courseId) 
            ? prev.filter(id => id !== courseId)
            : [...prev, courseId]
    );
  };

  const handleSavePlan = () => {
    setIsSaving(true);
    const derivedFeatures = ALL_FEATURES
        .filter(feature => selectedPermissions.includes(feature.id))
        .map(feature => feature.label);
    
    const planData = {
      name: planName,
      price: parseFloat(price),
      billingPeriod,
      description,
      features: derivedFeatures,
      courses: selectedCourses,
      permissions: selectedPermissions,
    };
    
    // Simulate API call
    console.log('Saving plan:', planData);
    setTimeout(() => {
        toast({
            title: isEditing ? 'Plan Modifié (Simulation)' : 'Plan Sauvegardé (Simulation)',
            description: `Le plan "${planName}" a été ${isEditing ? 'modifié' : 'créé'}.`,
        });
        setIsSaving(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <Button asChild variant="outline" size="sm">
            <Link href="/admin?tab=subscriptions">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour aux abonnements
            </Link>
            </Button>
            <Button onClick={handleSavePlan} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isEditing ? 'Sauvegarder les modifications' : 'Sauvegarder le plan'}
            </Button>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-2 rounded-lg">
                <CreditCard className="h-8 w-8 text-primary" />
            </div>
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                    {isEditing && planName ? `Modifier le Plan : ${planName}` : 'Créer un Nouveau Plan'}
                </h1>
                <p className="text-muted-foreground">
                    {isEditing ? 'Mettez à jour les détails de ce plan.' : 'Définissez les détails, fonctionnalités et accès de votre nouveau plan.'}
                </p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Détails du Plan</CardTitle>
                        <CardDescription>Informations de base qui seront affichées aux utilisateurs.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="plan-name">Nom du plan</Label>
                            <Input id="plan-name" placeholder="Ex: Premium Plus" value={planName} onChange={e => setPlanName(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="plan-price">Prix (EUR)</Label>
                                <Input id="plan-price" type="number" placeholder="Ex: 19.99" value={price} onChange={e => setPrice(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="billing-period">Période de facturation</Label>
                                <Select value={billingPeriod} onValueChange={setBillingPeriod}>
                                    <SelectTrigger id="billing-period">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="monthly">Mensuel</SelectItem>
                                        <SelectItem value="yearly">Annuel</SelectItem>
                                        <SelectItem value="once">Paiement unique</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="plan-description">Description courte</Label>
                            <Textarea id="plan-description" placeholder="Une phrase d'accroche pour décrire le plan." value={description} onChange={e => setDescription(e.target.value)} />
                        </div>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Star /> Fonctionnalités</CardTitle>
                        <CardDescription>Cochez les fonctionnalités qui seront disponibles dans ce plan.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 grid grid-cols-1 sm:grid-cols-2">
                        {ALL_FEATURES.map(feature => (
                            <div key={feature.id} className="flex items-center space-x-2">
                                <Checkbox 
                                    id={feature.id} 
                                    onCheckedChange={() => handlePermissionChange(feature.id)}
                                    checked={selectedPermissions.includes(feature.id)}
                                />
                                <Label htmlFor={feature.id} className="cursor-pointer">{feature.label}</Label>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
            
            <div className="lg:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BookCopy /> Formations Incluses</CardTitle>
                        <CardDescription>Sélectionnez les formations accessibles avec ce plan.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {availableCourses.map(course => (
                            <div key={course.id} className="flex items-center space-x-2">
                                <Checkbox 
                                    id={course.id} 
                                    onCheckedChange={() => handleCourseSelectionChange(course.id)}
                                    checked={selectedCourses.includes(course.id)}
                                />
                                <Label htmlFor={course.id} className="cursor-pointer">{course.name}</Label>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
