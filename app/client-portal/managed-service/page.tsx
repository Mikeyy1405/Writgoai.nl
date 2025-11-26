
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sparkles,
  FileText,
  Share2,
  CheckCircle2,
  Loader2,
  Crown,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ManagedServiceSubscription {
  id: string;
  status: string;
  monthlyPrice: number;
  contentPiecesPerMonth: number;
  socialPostsPerWeek: number;
  platforms: string[];
  language: string;
  lastContentGeneratedAt?: string;
  lastSocialGeneratedAt?: string;
  createdAt: string;
  project?: {
    id: string;
    name: string;
  };
}

interface Project {
  id: string;
  name: string;
}

const platformOptions = [
  { value: 'facebook', label: 'Facebook', icon: '📘' },
  { value: 'instagram', label: 'Instagram', icon: '📷' },
  { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { value: 'twitter', label: 'Twitter/X', icon: '🐦' },
];

export default function ManagedServicePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [subscription, setSubscription] =
    useState<ManagedServiceSubscription | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Setup form
  const [projectId, setProjectId] = useState('');
  const [contentPiecesPerMonth, setContentPiecesPerMonth] = useState(8);
  const [socialPostsPerWeek, setSocialPostsPerWeek] = useState(5);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [language, setLanguage] = useState('NL');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/client-login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchSubscription();
      fetchProjects();
    }
  }, [session]);

  const fetchSubscription = async () => {
    try {
      const res = await fetch('/api/client/managed-service');
      if (res.ok) {
        const data = await res.json();
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/client/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleSubscribe = async () => {
    if (!projectId) {
      toast({
        title: 'Project vereist',
        description: 'Selecteer een project voor je managed service',
        variant: 'destructive',
      });
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast({
        title: 'Platforms vereist',
        description: 'Selecteer minimaal één social media platform',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/client/managed-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          contentPiecesPerMonth,
          socialPostsPerWeek,
          platforms: selectedPlatforms,
          language,
        }),
      });

      if (res.ok) {
        toast({
          title: 'Abonnement geactiveerd!',
          description:
            'Je Managed Service AI is nu actief. We beginnen direct met content genereren.',
        });
        setShowSetupDialog(false);
        fetchSubscription();
      } else {
        throw new Error('Failed to subscribe');
      }
    } catch (error) {
      toast({
        title: 'Fout',
        description: 'Kon abonnement niet activeren',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Weet je zeker dat je je abonnement wilt opzeggen?')) {
      return;
    }

    try {
      const res = await fetch('/api/client/managed-service', {
        method: 'DELETE',
      });

      if (res.ok) {
        toast({
          title: 'Abonnement opgezegd',
          description: 'Je Managed Service AI is stopgezet',
        });
        fetchSubscription();
      }
    } catch (error) {
      toast({
        title: 'Fout',
        description: 'Kon abonnement niet opzeggen',
        variant: 'destructive',
      });
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <Crown className="h-8 w-8 text-orange-500" />
        <div>
          <h1 className="text-3xl font-bold text-white">
            Managed Service AI
          </h1>
          <p className="text-gray-400 mt-1">
            Volledig automatische content & social media voor €199/maand
          </p>
        </div>
      </div>

      {!subscription || subscription.status === 'cancelled' ? (
        <>
          {/* Pricing Card */}
          <Card className="bg-gradient-to-br from-orange-500/20 to-purple-500/20 border-orange-500 p-8 mb-8">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-full mb-4">
                <Sparkles className="h-5 w-5" />
                <span className="font-semibold">Premium Service</span>
              </div>
              
              <h2 className="text-4xl font-bold text-white mb-2">
                €199<span className="text-xl text-gray-400">/maand</span>
              </h2>
              
              <p className="text-gray-300 mb-8">
                Wij zorgen voor ALLES - jij hoeft niets te doen
              </p>

              <div className="grid md:grid-cols-2 gap-6 text-left mb-8">
                <div className="bg-gray-800/50 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="h-6 w-6 text-orange-500" />
                    <h3 className="text-xl font-semibold text-white">
                      Content Generatie
                    </h3>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">
                        8 SEO-geoptimaliseerde blogs per maand
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">
                        Automatisch publice ren op WordPress
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">
                        AI-gegenereerde afbeeldingen
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">
                        Interne linking & affiliate links
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Share2 className="h-6 w-6 text-orange-500" />
                    <h3 className="text-xl font-semibold text-white">
                      Social Media
                    </h3>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">
                        5 professionele posts per week
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">
                        Facebook, Instagram, LinkedIn, X
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">
                        Automatisch plannen & posten
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">
                        Meertalig (NL/EN/DE/FR/ES)
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              <Button
                onClick={() => setShowSetupDialog(true)}
                size="lg"
                className="bg-orange-500 hover:bg-orange-600 text-lg px-8 py-6"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Start Managed Service
              </Button>
            </div>
          </Card>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-gray-800 border-gray-700 p-6">
              <Calendar className="h-12 w-12 text-orange-500 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Altijd Actuele Content
              </h3>
              <p className="text-gray-400 text-sm">
                Wij zorgen voor een constante stroom van frisse, relevante
                content op je website en social media.
              </p>
            </Card>

            <Card className="bg-gray-800 border-gray-700 p-6">
              <TrendingUp className="h-12 w-12 text-orange-500 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                SEO Geoptimaliseerd
              </h3>
              <p className="text-gray-400 text-sm">
                Alle content is geoptimaliseerd voor zoekmachines, met
                keywords, internal linking en meta data.
              </p>
            </Card>

            <Card className="bg-gray-800 border-gray-700 p-6">
              <Sparkles className="h-12 w-12 text-orange-500 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Volledig Automatisch
              </h3>
              <p className="text-gray-400 text-sm">
                Onze AI neemt alles over - van content ideeën tot publicatie.
                Jij hoeft niets te doen.
              </p>
            </Card>
          </div>
        </>
      ) : (
        <>
          {/* Active Subscription */}
          <Card className="bg-gray-800 border-gray-700 p-8 mb-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <Badge className="bg-green-500 text-white mb-2">
                  Actief
                </Badge>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Je Managed Service is Actief
                </h2>
                <p className="text-gray-400">
                  Wij zorgen automatisch voor al je content & social media
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white mb-1">
                  €{subscription.monthlyPrice.toFixed(2)}
                </div>
                <p className="text-sm text-gray-400">per maand</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-900 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-3">
                  Content Generatie
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Blogs per maand:</span>
                    <span className="text-white font-semibold">
                      {subscription.contentPiecesPerMonth}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Laatste generatie:</span>
                    <span className="text-white">
                      {subscription.lastContentGeneratedAt
                        ? new Date(
                            subscription.lastContentGeneratedAt
                          ).toLocaleDateString('nl-NL')
                        : 'Nog niet gegenereerd'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-3">
                  Social Media
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Posts per week:</span>
                    <span className="text-white font-semibold">
                      {subscription.socialPostsPerWeek}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Platforms:</span>
                    <span className="text-white">
                      {subscription.platforms.join(', ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Laatste post:</span>
                    <span className="text-white">
                      {subscription.lastSocialGeneratedAt
                        ? new Date(
                            subscription.lastSocialGeneratedAt
                          ).toLocaleDateString('nl-NL')
                        : 'Nog niet gegenereerd'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={handleCancelSubscription}
                className="border-gray-700"
              >
                Abonnement Opzeggen
              </Button>
            </div>
          </Card>
        </>
      )}

      {/* Setup Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Managed Service AI Instellen</DialogTitle>
            <DialogDescription className="text-gray-400">
              Configureer je automatische content & social media service
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="project">Project *</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="bg-gray-900 border-gray-700">
                  <SelectValue placeholder="Selecteer een project" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700 z-[9999]">
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contentPieces">Blogs per maand</Label>
                <Select
                  value={contentPiecesPerMonth.toString()}
                  onValueChange={(v) => setContentPiecesPerMonth(parseInt(v))}
                >
                  <SelectTrigger className="bg-gray-900 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700 z-[9999]">
                    {[4, 8, 12, 16].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n} blogs
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="socialPosts">Social posts per week</Label>
                <Select
                  value={socialPostsPerWeek.toString()}
                  onValueChange={(v) => setSocialPostsPerWeek(parseInt(v))}
                >
                  <SelectTrigger className="bg-gray-900 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700 z-[9999]">
                    {[3, 5, 7].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n} posts
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Social Media Platforms *</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {platformOptions.map((platform) => (
                  <div
                    key={platform.value}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={platform.value}
                      checked={selectedPlatforms.includes(platform.value)}
                      onCheckedChange={() =>
                        handleTogglePlatform(platform.value)
                      }
                    />
                    <Label
                      htmlFor={platform.value}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <span>{platform.icon}</span>
                      {platform.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="language">Taal</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="bg-gray-900 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700 z-[9999]">
                  <SelectItem value="NL">🇳🇱 Nederlands</SelectItem>
                  <SelectItem value="EN">🇺🇸 English</SelectItem>
                  <SelectItem value="DE">🇩🇪 Deutsch</SelectItem>
                  <SelectItem value="FR">🇫🇷 Français</SelectItem>
                  <SelectItem value="ES">🇪🇸 Español</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-orange-500/10 border border-orange-500 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold">Totaal per maand:</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Inclusief alles - geen verrassingen
                  </p>
                </div>
                <div className="text-3xl font-bold text-orange-500">
                  €199,00
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSetupDialog(false)}
              className="border-gray-700"
            >
              Annuleren
            </Button>
            <Button
              onClick={handleSubscribe}
              disabled={submitting}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Bezig...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Activeer Service
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
