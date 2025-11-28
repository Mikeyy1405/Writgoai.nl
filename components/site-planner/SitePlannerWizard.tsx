'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, 
  Wand2, 
  Target, 
  Users, 
  Globe, 
  Check,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import type { SitePlan } from '@/types/database';

interface SitePlannerWizardProps {
  projectId: string;
  projectName: string;
  websiteUrl: string;
  existingKeywords?: string[];
  existingTargetAudience?: string;
  existingNiche?: string;
  onComplete: (sitePlan: SitePlan) => void;
  onCancel?: () => void;
}

type WizardStep = 'keywords' | 'audience' | 'settings' | 'generating' | 'complete';

export function SitePlannerWizard({
  projectId,
  projectName,
  websiteUrl,
  existingKeywords = [],
  existingTargetAudience = '',
  existingNiche = '',
  onComplete,
  onCancel,
}: SitePlannerWizardProps) {
  const [step, setStep] = useState<WizardStep>('keywords');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Form state
  const [keywords, setKeywords] = useState<string[]>(existingKeywords);
  const [keywordInput, setKeywordInput] = useState('');
  const [targetAudience, setTargetAudience] = useState(existingTargetAudience);
  const [language, setLanguage] = useState('NL');
  const [niche, setNiche] = useState(existingNiche);

  const steps: { id: WizardStep; title: string; description: string }[] = [
    { id: 'keywords', title: 'Keywords', description: 'Definieer je belangrijkste zoekwoorden' },
    { id: 'audience', title: 'Doelgroep', description: 'Beschrijf je ideale klant' },
    { id: 'settings', title: 'Instellingen', description: 'Kies taal en opties' },
    { id: 'generating', title: 'Genereren', description: 'AI genereert je content strategie' },
    { id: 'complete', title: 'Klaar', description: 'Je content plan is gereed' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === step);

  // Add keyword
  const handleAddKeyword = () => {
    const keyword = keywordInput.trim().toLowerCase();
    if (keyword && !keywords.includes(keyword)) {
      setKeywords([...keywords, keyword]);
      setKeywordInput('');
    }
  };

  // Remove keyword
  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword));
  };

  // Navigate steps
  const goToNextStep = () => {
    const stepOrder: WizardStep[] = ['keywords', 'audience', 'settings', 'generating'];
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex < stepOrder.length - 1) {
      setStep(stepOrder[currentIndex + 1]);
    }
  };

  const goToPrevStep = () => {
    const stepOrder: WizardStep[] = ['keywords', 'audience', 'settings'];
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex > 0) {
      setStep(stepOrder[currentIndex - 1]);
    }
  };

  // Generate site plan
  const handleGenerate = async () => {
    setStep('generating');
    setIsGenerating(true);
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 1000);

    try {
      const response = await fetch(`/api/projects/${projectId}/site-planner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords,
          targetAudience,
          language,
          forceRegenerate: true,
        }),
      });

      clearInterval(progressInterval);

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          toast.error(`Niet genoeg credits. Benodigd: ${data.required || 50}`);
          setStep('settings');
          return;
        }
        throw new Error(data.error || 'Failed to generate site plan');
      }

      setProgress(100);
      setStep('complete');
      toast.success(`Site plan gegenereerd! ${data.articleIdeasCount} artikel ideeën aangemaakt.`);
      onComplete(data.sitePlan);

    } catch (error) {
      console.error('Error generating site plan:', error);
      toast.error('Fout bij genereren van site plan');
      setStep('settings');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Wand2 className="h-5 w-5 text-primary" />
          <CardTitle>Site Planner</CardTitle>
        </div>
        <CardDescription>
          Genereer een complete content strategie voor {projectName}
        </CardDescription>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mt-4">
          {steps.slice(0, -1).map((s, index) => (
            <div key={s.id} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index < currentStepIndex
                    ? 'bg-primary text-primary-foreground'
                    : index === currentStepIndex
                    ? 'bg-primary text-primary-foreground ring-2 ring-offset-2 ring-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {index < currentStepIndex ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              {index < steps.length - 2 && (
                <div
                  className={`w-12 h-0.5 ${
                    index < currentStepIndex ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {/* Step: Keywords */}
        {step === 'keywords' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Target className="h-4 w-4" />
              <span>Voeg minimaal 3 belangrijke zoekwoorden toe</span>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Voer een keyword in..."
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
              />
              <Button onClick={handleAddKeyword} type="button">
                Toevoegen
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 min-h-[100px] p-4 border rounded-lg bg-muted/30">
              {keywords.length === 0 ? (
                <span className="text-sm text-muted-foreground">
                  Nog geen keywords toegevoegd
                </span>
              ) : (
                keywords.map((keyword) => (
                  <Badge
                    key={keyword}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleRemoveKeyword(keyword)}
                  >
                    {keyword} ×
                  </Badge>
                ))
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Klik op een keyword om te verwijderen
            </p>
          </div>
        )}

        {/* Step: Target Audience */}
        {step === 'audience' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Users className="h-4 w-4" />
              <span>Beschrijf je doelgroep voor betere content suggesties</span>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="niche">Niche / Branche</Label>
                <Input
                  id="niche"
                  placeholder="bijv. E-commerce, SaaS, Gezondheid..."
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="targetAudience">Doelgroep Beschrijving</Label>
                <Textarea
                  id="targetAudience"
                  placeholder="Beschrijf je ideale klant: leeftijd, interesses, problemen die ze willen oplossen..."
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step: Settings */}
        {step === 'settings' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Globe className="h-4 w-4" />
              <span>Laatste instellingen voor je content plan</span>
            </div>

            <div>
              <Label htmlFor="language">Taal</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NL">Nederlands</SelectItem>
                  <SelectItem value="EN">English</SelectItem>
                  <SelectItem value="DE">Deutsch</SelectItem>
                  <SelectItem value="FR">Français</SelectItem>
                  <SelectItem value="ES">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-muted/30 p-4 rounded-lg space-y-2">
              <h4 className="font-medium">Samenvatting</h4>
              <ul className="text-sm space-y-1">
                <li>• <strong>Website:</strong> {websiteUrl}</li>
                <li>• <strong>Keywords:</strong> {keywords.length} zoekwoorden</li>
                <li>• <strong>Niche:</strong> {niche || 'Niet opgegeven'}</li>
                <li>• <strong>Taal:</strong> {language}</li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-amber-800">
                <Sparkles className="h-4 w-4" />
                <span className="font-medium">50 credits</span>
              </div>
              <p className="text-sm text-amber-700 mt-1">
                Het genereren van een site plan kost 50 credits
              </p>
            </div>
          </div>
        )}

        {/* Step: Generating */}
        {step === 'generating' && (
          <div className="space-y-6 py-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center">
                <h3 className="font-medium">Content strategie wordt gegenereerd...</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Dit kan 1-2 minuten duren
                </p>
              </div>
            </div>
            <Progress value={progress} className="w-full" />
            <p className="text-center text-sm text-muted-foreground">
              {progress < 30 && 'Analyseren van keywords...'}
              {progress >= 30 && progress < 60 && 'Genereren van pillar pages...'}
              {progress >= 60 && progress < 90 && 'Creëren van blog ideeën...'}
              {progress >= 90 && 'Afronden...'}
            </p>
          </div>
        )}

        {/* Step: Complete */}
        {step === 'complete' && (
          <div className="space-y-4 py-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-center">
                <h3 className="font-medium text-lg">Content Plan Gereed!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Je content strategie is succesvol gegenereerd
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        {step !== 'generating' && step !== 'complete' && (
          <>
            <Button
              variant="outline"
              onClick={step === 'keywords' ? onCancel : goToPrevStep}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {step === 'keywords' ? 'Annuleren' : 'Vorige'}
            </Button>

            {step === 'settings' ? (
              <Button onClick={handleGenerate} disabled={keywords.length < 1}>
                <Wand2 className="mr-2 h-4 w-4" />
                Genereer Plan
              </Button>
            ) : (
              <Button onClick={goToNextStep}>
                Volgende
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </>
        )}

        {step === 'complete' && (
          <Button onClick={() => onComplete(null as unknown as SitePlan)} className="w-full">
            Bekijk Content Planner
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
