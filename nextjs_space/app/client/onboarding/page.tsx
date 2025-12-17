
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Sparkles, Brain, Target, MessageSquare, Palette, Calendar, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ONBOARDING_STEPS = [
  {
    id: 1,
    title: 'Bedrijfsinformatie',
    description: 'Vertel ons over je bedrijf',
    icon: Target,
  },
  {
    id: 2,
    title: 'Content Strategie',
    description: 'Hoe wil je communiceren?',
    icon: MessageSquare,
  },
  {
    id: 3,
    title: 'Visuele Identiteit',
    description: 'Jouw unieke stijl',
    icon: Palette,
  },
  {
    id: 4,
    title: 'Planning',
    description: 'Wanneer publiceren we?',
    icon: Calendar,
  },
];

const IMAGE_STYLES = [
  { value: 'Modern Gradient Illustration', label: 'Modern Gradient Illustration' },
  { value: 'Minimal Line Art', label: 'Minimal Line Art' },
  { value: 'Editorial Photography', label: 'Editorial Photography' },
  { value: 'Playful 3D Render', label: 'Playful 3D Render' },
  { value: 'Bold Geometric Collage', label: 'Bold Geometric Collage' },
  { value: 'Organic Watercolor', label: 'Organic Watercolor' },
];

const PUBLISHING_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_LABELS: Record<string, string> = {
  Mon: 'Ma',
  Tue: 'Di',
  Wed: 'Wo',
  Thu: 'Do',
  Fri: 'Vr',
  Sat: 'Za',
  Sun: 'Zo',
};

export default function ClientOnboardingPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Step 1: Bedrijfsinformatie
    websiteName: '',
    websiteUrl: '',
    blogUrl: '',
    companyDescription: '',
    targetAudience: '',
    problemStatement: '',
    solutionStatement: '',
    uniqueFeatures: '',
    youtubeChannelUrl: '',
    
    // Step 2: Content Strategie
    contentStyle: [] as string[],
    contentLanguage: 'Dutch',
    toneOfVoice: '',
    customBlogInstructions: '',
    
    // Step 3: Visuele Identiteit
    imageSize: '1536x1024',
    imageStyle: '',
    brandAccentColor: '',
    customImageInstructions: '',
    
    // Step 4: Planning & Buffer
    bufferEmail: '',
    bufferPassword: '',
    autopilotEnabled: false,
    publishingDays: [] as string[],
    publishingTime: '09:00',
    postsPerDay: 1,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/client-login');
    }
  }, [status, router]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStyleToggle = (style: string) => {
    setFormData(prev => ({
      ...prev,
      contentStyle: prev.contentStyle.includes(style)
        ? prev.contentStyle.filter(s => s !== style)
        : [...prev.contentStyle, style]
    }));
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      publishingDays: prev.publishingDays.includes(day)
        ? prev.publishingDays.filter(d => d !== day)
        : [...prev.publishingDays, day]
    }));
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const uniqueFeaturesArray = formData.uniqueFeatures
        .split('\n')
        .filter(f => f.trim())
        .map(f => f.trim());

      const profileData = {
        ...formData,
        uniqueFeatures: uniqueFeaturesArray,
      };

      const response = await fetch('/api/client/ai-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) throw new Error('Failed to save profile');

      toast.success('✨ Je AI-profiel is opgeslagen!');
      router.push('/client/dashboard');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Er ging iets mis bij het opslaan');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-[#FF6B35]/10 rounded-full">
            <Brain className="h-5 w-5 text-[#FF6B35]" />
            <span className="text-sm font-medium text-[#FF6B35]">AI-Powered Content Automation</span>
          </div>
          <h1 className="text-4xl font-bold text-[#0B3C5D] mb-2">
            Welkom bij WritgoAI
          </h1>
          <p className="text-lg text-gray-600">
            Laten we jouw unieke AI-profiel opbouwen voor volledig gepersonaliseerde content
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {ONBOARDING_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                        isCompleted
                          ? 'bg-green-500 border-green-500 text-white'
                          : isActive
                          ? 'bg-[#FF6B35] border-[#FF6B35] text-white'
                          : 'bg-slate-900 border-slate-600 text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-6 w-6" />
                      ) : (
                        <Icon className="h-6 w-6" />
                      )}
                    </div>
                    <p className={`mt-2 text-xs font-medium text-center ${isActive ? 'text-[#FF6B35]' : 'text-gray-500'}`}>
                      {step.title}
                    </p>
                  </div>
                  {index < ONBOARDING_STEPS.length - 1 && (
                    <div className={`h-0.5 mt-6 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#0B3C5D]">
              <Sparkles className="h-5 w-5 text-[#FF6B35]" />
              {ONBOARDING_STEPS[currentStep - 1].title}
            </CardTitle>
            <CardDescription>
              {ONBOARDING_STEPS[currentStep - 1].description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Bedrijfsinformatie */}
            {currentStep === 1 && (
              <>
                <div>
                  <Label htmlFor="websiteName">Website Naam *</Label>
                  <Input
                    id="websiteName"
                    placeholder="bijv. WritgoAI.nl"
                    value={formData.websiteName}
                    onChange={(e) => handleInputChange('websiteName', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="websiteUrl">Website URL *</Label>
                  <Input
                    id="websiteUrl"
                    placeholder="https://WritgoAI.nl"
                    value={formData.websiteUrl}
                    onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="blogUrl">Blog URL (optioneel)</Label>
                  <Input
                    id="blogUrl"
                    placeholder="https://WritgoAI.nl/blog"
                    value={formData.blogUrl}
                    onChange={(e) => handleInputChange('blogUrl', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="companyDescription">Bedrijfsomschrijving *</Label>
                  <Textarea
                    id="companyDescription"
                    placeholder="Vertel over je bedrijf, wat jullie doen en voor wie..."
                    rows={4}
                    value={formData.companyDescription}
                    onChange={(e) => handleInputChange('companyDescription', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="targetAudience">Doelgroep *</Label>
                  <Textarea
                    id="targetAudience"
                    placeholder="Wie zijn je klanten? Ondernemers, ZZP'ers, bedrijven?"
                    rows={3}
                    value={formData.targetAudience}
                    onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="problemStatement">Welk probleem los je op? *</Label>
                  <Textarea
                    id="problemStatement"
                    placeholder="Welk probleem hebben je klanten waar jij de oplossing voor biedt?"
                    rows={3}
                    value={formData.problemStatement}
                    onChange={(e) => handleInputChange('problemStatement', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="solutionStatement">Jouw oplossing *</Label>
                  <Textarea
                    id="solutionStatement"
                    placeholder="Hoe lost jouw bedrijf dit probleem op?"
                    rows={3}
                    value={formData.solutionStatement}
                    onChange={(e) => handleInputChange('solutionStatement', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="uniqueFeatures">Unieke Features (één per regel)</Label>
                  <Textarea
                    id="uniqueFeatures"
                    placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                    rows={5}
                    value={formData.uniqueFeatures}
                    onChange={(e) => handleInputChange('uniqueFeatures', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="youtubeChannelUrl">YouTube Kanaal URL (optioneel)</Label>
                  <Input
                    id="youtubeChannelUrl"
                    placeholder="https://youtube.com/@yourchannelhere"
                    value={formData.youtubeChannelUrl}
                    onChange={(e) => handleInputChange('youtubeChannelUrl', e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Step 2: Content Strategie */}
            {currentStep === 2 && (
              <>
                <div>
                  <Label>Content Stijl (meerdere mogelijk)</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                    {['Conversational', 'Informative', 'Professional'].map(style => (
                      <div
                        key={style}
                        onClick={() => handleStyleToggle(style)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.contentStyle.includes(style)
                            ? 'border-[#FF6B35] bg-[#FF6B35]/5'
                            : 'border-slate-600 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            formData.contentStyle.includes(style)
                              ? 'border-[#FF6B35] bg-[#FF6B35]'
                              : 'border-slate-600'
                          }`}>
                            {formData.contentStyle.includes(style) && (
                              <CheckCircle2 className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <span className="font-medium">{style}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="contentLanguage">Content Taal</Label>
                  <Input
                    id="contentLanguage"
                    value={formData.contentLanguage}
                    onChange={(e) => handleInputChange('contentLanguage', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="toneOfVoice">Tone of Voice</Label>
                  <Textarea
                    id="toneOfVoice"
                    placeholder="Bijv: Vriendelijk en toegankelijk, gebruik 'je/jij', informeel maar professioneel..."
                    rows={3}
                    value={formData.toneOfVoice}
                    onChange={(e) => handleInputChange('toneOfVoice', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="customBlogInstructions">Custom Blog Instructies (optioneel)</Label>
                  <Textarea
                    id="customBlogInstructions"
                    placeholder="Specifieke instructies voor de AI bij het genereren van blogs..."
                    rows={5}
                    value={formData.customBlogInstructions}
                    onChange={(e) => handleInputChange('customBlogInstructions', e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tip: Vermeld hier specifieke woorden die vermeden moeten worden, gewenste zinslengte, etc.
                  </p>
                </div>
              </>
            )}

            {/* Step 3: Visuele Identiteit */}
            {currentStep === 3 && (
              <>
                <div>
                  <Label>Afbeelding Formaat</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                    {[
                      { value: '1536x1024', label: 'Landscape (1536x1024)' },
                      { value: '1024x1024', label: 'Square (1024x1024)' },
                      { value: '1024x1536', label: 'Portrait (1024x1536)' },
                    ].map(size => (
                      <div
                        key={size.value}
                        onClick={() => handleInputChange('imageSize', size.value)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.imageSize === size.value
                            ? 'border-[#FF6B35] bg-[#FF6B35]/5'
                            : 'border-slate-600 hover:border-gray-400'
                        }`}
                      >
                        <span className="font-medium text-sm">{size.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Afbeelding Stijl (optioneel)</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                    {IMAGE_STYLES.map(style => (
                      <div
                        key={style.value}
                        onClick={() => handleInputChange('imageStyle', 
                          formData.imageStyle === style.value ? '' : style.value
                        )}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.imageStyle === style.value
                            ? 'border-[#FF6B35] bg-[#FF6B35]/5'
                            : 'border-slate-600 hover:border-gray-400'
                        }`}
                      >
                        <span className="font-medium text-sm">{style.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="brandAccentColor">Merk Accent Kleur</Label>
                  <Input
                    id="brandAccentColor"
                    placeholder="bijv. #FF6B35 of orange"
                    value={formData.brandAccentColor}
                    onChange={(e) => handleInputChange('brandAccentColor', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="customImageInstructions">Custom Image Instructies (optioneel)</Label>
                  <Textarea
                    id="customImageInstructions"
                    placeholder="Specifieke instructies voor AI image generator..."
                    rows={3}
                    value={formData.customImageInstructions}
                    onChange={(e) => handleInputChange('customImageInstructions', e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Step 4: Planning */}
            {currentStep === 4 && (
              <>
                {/* Buffer.com Setup */}
                <div className="space-y-4 p-6 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg border-2 border-orange-200">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 bg-gradient-to-br from-[#FF6B35] to-[#F7931E] rounded-lg flex items-center justify-center shrink-0">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-[#0B3C5D] mb-1">Social Media Accounts Vereist via Buffer.com</h4>
                      <p className="text-sm text-slate-300 mb-3">
                        <strong>Belangrijk:</strong> Wij publiceren de content <u>op de social media accounts die jij beschikbaar stelt via Buffer.com</u>. 
                        Je verbindt jouw eigen Facebook, Instagram, LinkedIn, Twitter/X, etc. met je Buffer account.
                      </p>
                      <p className="text-sm text-slate-300 mb-3">
                        Heb je nog geen Buffer account? 
                        <a href="https://buffer.com" target="_blank" rel="noopener noreferrer" className="text-[#FF6B35] hover:underline ml-1 font-medium">
                          Maak hier gratis een account aan →
                        </a>
                      </p>
                      <div className="bg-slate-900/70 p-3 rounded border border-orange-200 space-y-2">
                        <p className="text-xs text-gray-600">
                          <strong>✅ Wat moet je doen:</strong>
                        </p>
                        <ol className="text-xs text-slate-300 list-decimal list-inside space-y-1 ml-2">
                          <li>Maak een gratis Buffer.com account aan (als je die nog niet hebt)</li>
                          <li>Verbind jouw social media accounts (Instagram, Facebook, LinkedIn, etc.) met Buffer</li>
                          <li>Vul hieronder je Buffer.com inloggegevens in</li>
                          <li>Wij zorgen voor de AI-gegenereerde content en publiceren automatisch op jouw verbonden accounts</li>
                        </ol>
                        <p className="text-xs text-gray-600 mt-2">
                          <strong>💡 Let op:</strong> 3 sociale kanalen zijn gratis bij Buffer. Extra kanalen kosten extra (je beheert dit zelf via Buffer.com)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label htmlFor="bufferEmail" className="text-[#0B3C5D]">
                        Buffer.com Email *
                      </Label>
                      <Input
                        id="bufferEmail"
                        type="email"
                        placeholder="je@email.com"
                        value={formData.bufferEmail}
                        onChange={(e) => handleInputChange('bufferEmail', e.target.value)}
                        className="bg-slate-900"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="bufferPassword" className="text-[#0B3C5D]">
                        Buffer.com Wachtwoord *
                      </Label>
                      <Input
                        id="bufferPassword"
                        type="password"
                        placeholder="••••••••"
                        value={formData.bufferPassword}
                        onChange={(e) => handleInputChange('bufferPassword', e.target.value)}
                        className="bg-slate-900"
                        required
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        We bewaren dit veilig en versleuteld
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Checkbox
                    id="autopilot"
                    checked={formData.autopilotEnabled}
                    onCheckedChange={(checked) => handleInputChange('autopilotEnabled', checked)}
                  />
                  <Label htmlFor="autopilot" className="cursor-pointer text-sm">
                    <span className="font-semibold text-blue-700">Autopilot Mode Inschakelen</span>
                    <p className="text-xs text-blue-700 mt-1">
                      Laat de AI automatisch content genereren en publiceren volgens jouw schema
                    </p>
                  </Label>
                </div>

                {formData.autopilotEnabled && (
                  <>
                    <div>
                      <Label>Publicatie Dagen</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {PUBLISHING_DAYS.map(day => (
                          <div
                            key={day}
                            onClick={() => handleDayToggle(day)}
                            className={`px-4 py-2 rounded-lg border-2 cursor-pointer transition-all ${
                              formData.publishingDays.includes(day)
                                ? 'border-[#FF6B35] bg-[#FF6B35] text-white'
                                : 'border-slate-600 hover:border-gray-400'
                            }`}
                          >
                            {DAY_LABELS[day]}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="publishingTime">Publicatie Tijd</Label>
                      <Input
                        id="publishingTime"
                        type="time"
                        value={formData.publishingTime}
                        onChange={(e) => handleInputChange('publishingTime', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="postsPerDay">Posts Per Dag</Label>
                      <Input
                        id="postsPerDay"
                        type="number"
                        min="1"
                        max="10"
                        value={formData.postsPerDay}
                        onChange={(e) => handleInputChange('postsPerDay', parseInt(e.target.value))}
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1 || loading}
              >
                Vorige
              </Button>
              
              {currentStep < 4 ? (
                <Button
                  onClick={handleNext}
                  className="bg-[#FF6B35] hover:bg-[#FF6B35]/90"
                >
                  Volgende
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Opslaan...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Afronden
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
