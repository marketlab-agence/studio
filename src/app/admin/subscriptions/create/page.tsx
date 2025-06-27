
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CreditCard, PlusCircle, Save, Trash2, Loader2, BookCopy, List } from 'lucide-react';
import Link from 'next/link';

const availableCourses = [
  { id: 'git-github-tutorial', name: 'Git & GitHub : Le Guide Complet' },
  // Add other courses here as they become available
];

export default function CreatePlanPage() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  const [planName, setPlanName] = useState('');
  const [price, setPrice] = useState('');
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [description, setDescription] = useState('');
  const [features, setFeatures] = useState(['']);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  const handleAddFeature = () => {
    setFeatures([...features, '']);
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = value;
    setFeatures(newFeatures);
  };

  const handleRemoveFeature = (index: number) => {
    const newFeatures = features.filter((_, i) => i !== index);
    setFeatures(newFeatures);
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
    const planData = {
      name: planName,
      price: parseFloat(price),
      billingPeriod,
      description,
      features: features.filter(f => f.trim() !== ''),
      courses: selectedCourses,
    };
    
    // Simulate API call
    console.log('Saving new plan:', planData);
    setTimeout(() => {
        toast({
            title: 'Plan Sauvegardé (Simulation)',
            description: `Le nouveau plan "${planName}" a été créé.`,
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
                Sauvegarder le plan
            </Button>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-2 rounded-lg">
                <CreditCard className="h-8 w-8 text-primary" />
            </div>
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Créer un Nouveau Plan</h1>
                <p className="text-muted-foreground">Définissez les détails, fonctionnalités et accès de votre nouveau plan d'abonnement.</p>
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
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2"><List /> Fonctionnalités incluses</div>
                            <Button variant="outline" size="sm" onClick={handleAddFeature}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Ajouter
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <Input 
                                    placeholder="Décrire une fonctionnalité..."
                                    value={feature}
                                    onChange={(e) => handleFeatureChange(index, e.target.value)}
                                />
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveFeature(index)} disabled={features.length <= 1}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
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
