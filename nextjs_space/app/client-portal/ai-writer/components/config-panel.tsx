'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Globe,
  Target,
  Key,
  MessageSquare,
  Link2,
  ShoppingBag,
  Settings2,
  Sparkles,
} from 'lucide-react';
import ProjectSelector, { Project } from '@/components/project-selector';

interface ExtendedProject extends Project {
  bolcomEnabled?: boolean;
}

interface ConfigPanelProps {
  config: AIWriterConfig;
  onChange: (config: AIWriterConfig) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export interface AIWriterConfig {
  // Basic
  contentType: string;
  topic: string;
  tone: string;
  wordCount: number;
  language: string;
  
  // Keywords & SEO
  keywords: string;
  secondaryKeywords: string;
  generateMetaDescription: boolean;
  
  // Audience & Instructions
  targetAudience: string;
  customInstructions: string;
  
  // Project Integration
  projectId: string | null;
  includeInternalLinks: boolean;
  internalLinksCount: number;
  includeBolProducts: boolean;
  bolProductsCount: number;
}

export default function ConfigPanel({
  config,
  onChange,
  onGenerate,
  isGenerating,
}: ConfigPanelProps) {
  const [selectedProject, setSelectedProject] = useState<ExtendedProject | null>(null);
  const [loadingProjectDetails, setLoadingProjectDetails] = useState(false);

  const handleProjectChange = async (projectId: string | null, project: Project | null) => {
    if (!projectId || !project) {
      setSelectedProject(null);
      onChange({ ...config, projectId: null });
      return;
    }

    // Fetch full project details including bolcomEnabled
    setLoadingProjectDetails(true);
    try {
      const response = await fetch(`/api/client/projects/${projectId}`);
      if (response.ok) {
        const fullProject = await response.json();
        setSelectedProject({
          ...project,
          bolcomEnabled: fullProject.bolcomEnabled || false,
        });
      } else {
        setSelectedProject({ ...project, bolcomEnabled: false });
      }
    } catch (error) {
      console.error('Error fetching project details:', error);
      setSelectedProject({ ...project, bolcomEnabled: false });
    } finally {
      setLoadingProjectDetails(false);
    }

    onChange({ ...config, projectId });
  };

  const updateConfig = (updates: Partial<AIWriterConfig>) => {
    onChange({ ...config, ...updates });
  };

  const wordCountPresets = [500, 1000, 1500, 2000, 2500, 3000];

  return (
    <div className="space-y-6">
      {/* Content Type */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#FF9933]" />
            Content Type
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contentType">Type</Label>
            <Select
              value={config.contentType}
              onValueChange={(value) => updateConfig({ contentType: value })}
            >
              <SelectTrigger id="contentType" className="bg-zinc-800 border-zinc-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="blog-artikel">Blog artikel</SelectItem>
                <SelectItem value="landingspagina">Landingspagina</SelectItem>
                <SelectItem value="product-beschrijving">Product beschrijving</SelectItem>
                <SelectItem value="about-us">About Us pagina</SelectItem>
                <SelectItem value="faq">FAQ pagina</SelectItem>
                <SelectItem value="service">Service pagina</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic">Onderwerp / Titel *</Label>
            <Input
              id="topic"
              value={config.topic}
              onChange={(e) => updateConfig({ topic: e.target.value })}
              placeholder="Bijv: De ultieme gids voor SEO in 2024"
              className="bg-zinc-800 border-zinc-700"
            />
          </div>
        </CardContent>
      </Card>

      {/* Writing Style */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#FF9933]" />
            Schrijfstijl
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tone">Toon</Label>
            <Select
              value={config.tone}
              onValueChange={(value) => updateConfig({ tone: value })}
            >
              <SelectTrigger id="tone" className="bg-zinc-800 border-zinc-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="professioneel">Professioneel</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
                <SelectItem value="vriendelijk">Vriendelijk</SelectItem>
                <SelectItem value="formeel">Formeel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Lengte: {config.wordCount} woorden</Label>
            <Slider
              value={[config.wordCount]}
              onValueChange={([value]) => updateConfig({ wordCount: value })}
              min={500}
              max={3000}
              step={100}
              className="py-4"
            />
            <div className="flex gap-2 flex-wrap">
              {wordCountPresets.map((preset) => (
                <Button
                  key={preset}
                  variant={config.wordCount === preset ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateConfig({ wordCount: preset })}
                  className={
                    config.wordCount === preset
                      ? 'bg-[#FF9933] hover:bg-[#FF9933]/90'
                      : 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700'
                  }
                >
                  {preset}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Taal</Label>
            <Select
              value={config.language}
              onValueChange={(value) => updateConfig({ language: value })}
            >
              <SelectTrigger id="language" className="bg-zinc-800 border-zinc-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="nl">🇳🇱 Nederlands</SelectItem>
                <SelectItem value="en">🇬🇧 Engels (English)</SelectItem>
                <SelectItem value="de">🇩🇪 Duits (Deutsch)</SelectItem>
                <SelectItem value="fr">🇫🇷 Frans (Français)</SelectItem>
                <SelectItem value="es">🇪🇸 Spaans (Español)</SelectItem>
                <SelectItem value="it">🇮🇹 Italiaans (Italiano)</SelectItem>
                <SelectItem value="pt">🇵🇹 Portugees (Português)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* SEO Configuration */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Key className="h-5 w-5 text-[#FF9933]" />
            SEO Configuratie
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="keywords">Primaire Keyword *</Label>
            <Input
              id="keywords"
              value={config.keywords}
              onChange={(e) => updateConfig({ keywords: e.target.value })}
              placeholder="Bijv: SEO tips"
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondaryKeywords">Secondary Keywords</Label>
            <Input
              id="secondaryKeywords"
              value={config.secondaryKeywords}
              onChange={(e) => updateConfig({ secondaryKeywords: e.target.value })}
              placeholder="Bijv: zoekmachine optimalisatie, Google ranking"
              className="bg-zinc-800 border-zinc-700"
            />
            <p className="text-xs text-zinc-500">Komma gescheiden</p>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="metaDesc" className="flex items-center gap-2">
              Meta description genereren
            </Label>
            <Switch
              id="metaDesc"
              checked={config.generateMetaDescription}
              onCheckedChange={(checked) => updateConfig({ generateMetaDescription: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Target Audience */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-[#FF9933]" />
            Doelgroep & Instructies
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="targetAudience">Doelgroep (optioneel)</Label>
            <Input
              id="targetAudience"
              value={config.targetAudience}
              onChange={(e) => updateConfig({ targetAudience: e.target.value })}
              placeholder="Bijv: Kleine bedrijven en ondernemers"
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customInstructions">Extra Instructies (optioneel)</Label>
            <Textarea
              id="customInstructions"
              value={config.customInstructions}
              onChange={(e) => updateConfig({ customInstructions: e.target.value })}
              placeholder="Bijv: Gebruik praktische voorbeelden en vermijd jargon"
              className="bg-zinc-800 border-zinc-700 min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Project Integration */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-[#FF9933]" />
            Project Integratie
          </CardTitle>
          <CardDescription>
            Selecteer een project voor tone-of-voice en extra features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Project (optioneel)</Label>
            <ProjectSelector
              value={config.projectId}
              onChange={handleProjectChange}
              autoSelectPrimary={false}
            />
          </div>

          {selectedProject && (
            <div className="space-y-4 p-4 bg-zinc-800 rounded-lg border border-zinc-700">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-[#FF9933]" />
                <div>
                  <p className="text-sm font-medium">{selectedProject.name}</p>
                  <p className="text-xs text-zinc-500">{selectedProject.websiteUrl}</p>
                </div>
              </div>

              {/* Internal Links */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="internalLinks" className="flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    Interne links toevoegen
                  </Label>
                  <Switch
                    id="internalLinks"
                    checked={config.includeInternalLinks}
                    onCheckedChange={(checked) =>
                      updateConfig({ includeInternalLinks: checked })
                    }
                  />
                </div>

                {config.includeInternalLinks && (
                  <div className="space-y-2 pl-6">
                    <Label htmlFor="linksCount">Aantal links (1-5)</Label>
                    <Select
                      value={config.internalLinksCount.toString()}
                      onValueChange={(value) =>
                        updateConfig({ internalLinksCount: parseInt(value) })
                      }
                    >
                      <SelectTrigger
                        id="linksCount"
                        className="bg-zinc-900 border-zinc-700"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <SelectItem key={n} value={n.toString()}>
                            {n} {n === 1 ? 'link' : 'links'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Bol.com Products */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="bolProducts" className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    Bol.com affiliate links
                    {!selectedProject.bolcomEnabled && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Niet geconfigureerd
                      </Badge>
                    )}
                  </Label>
                  <Switch
                    id="bolProducts"
                    checked={config.includeBolProducts}
                    onCheckedChange={(checked) => updateConfig({ includeBolProducts: checked })}
                    disabled={!selectedProject.bolcomEnabled}
                  />
                </div>

                {config.includeBolProducts && selectedProject.bolcomEnabled && (
                  <div className="space-y-2 pl-6">
                    <Label htmlFor="productsCount">Aantal producten (1-5)</Label>
                    <Select
                      value={config.bolProductsCount.toString()}
                      onValueChange={(value) =>
                        updateConfig({ bolProductsCount: parseInt(value) })
                      }
                    >
                      <SelectTrigger
                        id="productsCount"
                        className="bg-zinc-900 border-zinc-700"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <SelectItem key={n} value={n.toString()}>
                            {n} {n === 1 ? 'product' : 'producten'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate Button */}
      <Button
        onClick={onGenerate}
        disabled={isGenerating || !config.topic || !config.keywords}
        className="w-full bg-gradient-to-r from-[#FF9933] to-orange-600 hover:from-[#FF9933]/90 hover:to-orange-600/90 text-white font-semibold py-6"
        size="lg"
      >
        {isGenerating ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Genereren...
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5 mr-2" />
            Genereer Content
          </>
        )}
      </Button>
    </div>
  );
}
