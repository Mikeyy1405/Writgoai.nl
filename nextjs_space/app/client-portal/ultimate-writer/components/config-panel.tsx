'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Globe,
  Search,
  Key,
  Image,
  ShoppingBag,
  Link2,
  Settings2,
  Sparkles,
} from 'lucide-react';
import ProjectSelector from '@/components/project-selector';
import TopicSuggestions from './topic-suggestions';
import type { UltimateWriterConfig } from '../types';

interface ConfigPanelProps {
  config: UltimateWriterConfig;
  onChange: (config: UltimateWriterConfig) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export default function ConfigPanel({
  config,
  onChange,
  onGenerate,
  isGenerating,
}: ConfigPanelProps) {
  const updateConfig = (updates: Partial<UltimateWriterConfig>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800 sticky top-6">
      <CardHeader className="border-b border-zinc-800">
        <CardTitle className="text-white flex items-center gap-2">
          <Settings2 className="w-5 h-5" />
          Configuratie
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
        <Tabs defaultValue="basis" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4 bg-zinc-800">
            <TabsTrigger value="basis" className="text-xs">Basis</TabsTrigger>
            <TabsTrigger value="seo" className="text-xs">SEO</TabsTrigger>
            <TabsTrigger value="advanced" className="text-xs">Advanced</TabsTrigger>
          </TabsList>

          {/* BASIS TAB */}
          <TabsContent value="basis" className="space-y-4">
            {/* Content Type */}
            <div className="space-y-2">
              <Label className="text-zinc-300 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Content Type
              </Label>
              <Select
                value={config.contentType}
                onValueChange={(value) => updateConfig({ contentType: value })}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="blog-artikel">Blog Artikel</SelectItem>
                  <SelectItem value="landingspagina">Landingspagina</SelectItem>
                  <SelectItem value="product-review">Product Review</SelectItem>
                  <SelectItem value="vergelijkingsartikel">Vergelijkingsartikel</SelectItem>
                  <SelectItem value="how-to-guide">How-to Guide</SelectItem>
                  <SelectItem value="nieuws-artikel">Nieuws Artikel</SelectItem>
                  <SelectItem value="pillar-page">Pillar Page</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Topic */}
            <div className="space-y-2">
              <Label className="text-zinc-300">Onderwerp *</Label>
              <Textarea
                value={config.topic}
                onChange={(e) => updateConfig({ topic: e.target.value })}
                placeholder="Bijvoorbeeld: De voordelen van elektrische auto's"
                className="bg-zinc-800 border-zinc-700 text-white min-h-[80px]"
              />
              
              {/* AI Topic Suggestions */}
              <TopicSuggestions
                onSelect={(topic) => updateConfig({ topic })}
                language={config.language}
              />
            </div>

            {/* Language & Tone */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-zinc-300 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Taal
                </Label>
                <Select
                  value={config.language}
                  onValueChange={(value: 'nl' | 'en') => updateConfig({ language: value })}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="nl">Nederlands</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Tone</Label>
                <Select
                  value={config.tone}
                  onValueChange={(value) => updateConfig({ tone: value })}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="professioneel">Professioneel</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="vriendelijk">Vriendelijk</SelectItem>
                    <SelectItem value="formeel">Formeel</SelectItem>
                    <SelectItem value="overtuigend">Overtuigend</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Word Count */}
            <div className="space-y-2">
              <Label className="text-zinc-300">
                Woordenaantal: {config.wordCount}
              </Label>
              <Slider
                value={[config.wordCount]}
                onValueChange={([value]) => updateConfig({ wordCount: value })}
                min={500}
                max={5000}
                step={100}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-zinc-500">
                <span>500</span>
                <span>5000</span>
              </div>
            </div>

            {/* Project Selector */}
            <div className="space-y-2">
              <Label className="text-zinc-300">Project (optioneel)</Label>
              <ProjectSelector
                value={config.projectId || ''}
                onChange={(projectId) => updateConfig({ projectId })}
              />
            </div>
          </TabsContent>

          {/* SEO TAB */}
          <TabsContent value="seo" className="space-y-4">
            {/* Primary Keyword */}
            <div className="space-y-2">
              <Label className="text-zinc-300 flex items-center gap-2">
                <Key className="w-4 h-4" />
                Primaire Keyword *
              </Label>
              <Input
                value={config.primaryKeyword}
                onChange={(e) => updateConfig({ primaryKeyword: e.target.value })}
                placeholder="Bijvoorbeeld: elektrische auto"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            {/* Secondary Keywords */}
            <div className="space-y-2">
              <Label className="text-zinc-300">
                Secundaire Keywords (comma separated)
              </Label>
              <Textarea
                value={config.secondaryKeywords}
                onChange={(e) => updateConfig({ secondaryKeywords: e.target.value })}
                placeholder="elektrische voertuigen, EV, laadpaal"
                className="bg-zinc-800 border-zinc-700 text-white min-h-[60px]"
              />
            </div>

            {/* LSI Keywords */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-zinc-300">LSI Keywords Genereren</Label>
                <p className="text-xs text-zinc-500">
                  Automatisch verwante zoektermen toevoegen
                </p>
              </div>
              <Switch
                checked={config.generateLSI}
                onCheckedChange={(checked) => updateConfig({ generateLSI: checked })}
              />
            </div>

            {/* Meta Description */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-zinc-300">Meta Description</Label>
                <p className="text-xs text-zinc-500">
                  Automatisch SEO meta description genereren
                </p>
              </div>
              <Switch
                checked={config.generateMetaDescription}
                onCheckedChange={(checked) => updateConfig({ generateMetaDescription: checked })}
              />
            </div>

            {/* Web Research */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-zinc-300 flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Web Research
                </Label>
                <p className="text-xs text-zinc-500">
                  Actuele informatie van het web
                </p>
              </div>
              <Switch
                checked={config.webResearch}
                onCheckedChange={(checked) => updateConfig({ webResearch: checked })}
              />
            </div>

            {/* SERP Analysis */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-zinc-300">SERP Analyse</Label>
                <p className="text-xs text-zinc-500">
                  Analyseer top 10 resultaten
                </p>
              </div>
              <Switch
                checked={config.serpAnalysis}
                onCheckedChange={(checked) => updateConfig({ serpAnalysis: checked })}
              />
            </div>
          </TabsContent>

          {/* ADVANCED TAB */}
          <TabsContent value="advanced" className="space-y-4">
            {/* Table of Contents */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-zinc-300">Inhoudsopgave (TOC)</Label>
                <p className="text-xs text-zinc-500">
                  Automatische inhoudsopgave
                </p>
              </div>
              <Switch
                checked={config.includeTableOfContents}
                onCheckedChange={(checked) => updateConfig({ includeTableOfContents: checked })}
              />
            </div>

            {/* FAQ Section */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-zinc-300">FAQ Sectie</Label>
                <p className="text-xs text-zinc-500">
                  Met People Also Ask vragen
                </p>
              </div>
              <Switch
                checked={config.includeFAQ}
                onCheckedChange={(checked) => updateConfig({ includeFAQ: checked })}
              />
            </div>

            {/* Images */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-zinc-300 flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  Afbeeldingen
                </Label>
                <Switch
                  checked={config.includeImages}
                  onCheckedChange={(checked) => updateConfig({ includeImages: checked })}
                />
              </div>
              {config.includeImages && (
                <div className="space-y-2 ml-6">
                  <Label className="text-zinc-400 text-sm">
                    Aantal: {config.imageCount}
                  </Label>
                  <Slider
                    value={[config.imageCount]}
                    onValueChange={([value]) => updateConfig({ imageCount: value })}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            {/* Internal Links */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-zinc-300 flex items-center gap-2">
                  <Link2 className="w-4 h-4" />
                  Interne Links
                </Label>
                <Switch
                  checked={config.includeInternalLinks}
                  onCheckedChange={(checked) => updateConfig({ includeInternalLinks: checked })}
                />
              </div>
              {config.includeInternalLinks && (
                <div className="space-y-2 ml-6">
                  <Label className="text-zinc-400 text-sm">
                    Aantal: {config.internalLinksCount}
                  </Label>
                  <Slider
                    value={[config.internalLinksCount]}
                    onValueChange={([value]) => updateConfig({ internalLinksCount: value })}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            {/* Bol.com Products */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-zinc-300 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  Bol.com Producten
                </Label>
                <Switch
                  checked={config.includeBolProducts}
                  onCheckedChange={(checked) => updateConfig({ includeBolProducts: checked })}
                />
              </div>
              {config.includeBolProducts && (
                <div className="space-y-2 ml-6">
                  <Label className="text-zinc-400 text-sm">
                    Aantal: {config.bolProductCount}
                  </Label>
                  <Slider
                    value={[config.bolProductCount]}
                    onValueChange={([value]) => updateConfig({ bolProductCount: value })}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Generate Button */}
        <Button
          onClick={onGenerate}
          disabled={isGenerating}
          className="w-full mt-6 bg-gradient-to-r from-[#ff6b35] to-[#ff8c5a] hover:from-[#ff5520] hover:to-[#ff7740] text-white font-semibold h-12"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Genereren...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Genereer Content
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
