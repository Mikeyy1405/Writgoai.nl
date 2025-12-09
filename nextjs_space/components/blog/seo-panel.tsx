'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Hash,
  Link as LinkIcon,
  Image as ImageIcon,
  FileText,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface SEOData {
  title: string;
  content: string;
  metaTitle?: string;
  metaDescription: string;
  focusKeyword: string;
  slug: string;
}

interface SEOCheck {
  score: number;
  message: string;
  status: 'good' | 'warning' | 'error';
  tip?: string;
}

interface SEOAnalysis {
  overallScore: number;
  titleLength: SEOCheck;
  titleHasKeyword: SEOCheck;
  metaDescriptionLength: SEOCheck;
  metaDescriptionHasKeyword: SEOCheck;
  keywordDensity: SEOCheck;
  keywordInFirstParagraph: SEOCheck;
  keywordInHeadings: SEOCheck;
  contentLength: SEOCheck;
  readabilityScore: SEOCheck;
  paragraphLength: SEOCheck;
  sentenceLength: SEOCheck;
  internalLinks: SEOCheck & { count: number };
  externalLinks: SEOCheck & { count: number };
  imagesHaveAlt: SEOCheck;
  improvements: string[];
}

interface SEOPanelProps {
  data: SEOData;
  onChange: (field: string, value: string) => void;
}

export function SEOPanel({ data, onChange }: SEOPanelProps) {
  const [analysis, setAnalysis] = useState<SEOAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timer = setTimeout(() => {
      if (data.title && data.content) {
        analyzeContent();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [data.title, data.content, data.metaDescription, data.focusKeyword, data.slug, data.metaTitle]);

  const analyzeContent = () => {
    setAnalyzing(true);
    
    const analysis = performAdvancedSEOAnalysis(data);
    setAnalysis(analysis);
    
    setAnalyzing(false);
  };

  const performAdvancedSEOAnalysis = (data: SEOData): SEOAnalysis => {
    const { countKeywordOccurrences, calculateFleschScore, stripHtmlTags } = require('@/lib/blog-utils');
    
    const title = data.metaTitle || data.title;
    const content = data.content;
    const keyword = data.focusKeyword.toLowerCase();
    const metaDesc = data.metaDescription;
    
    // Extract text from HTML
    // Note: stripHtmlTags is a basic implementation. For user-generated HTML,
    // consider using a proper HTML sanitizer library.
    const textContent = stripHtmlTags(content, Number.MAX_SAFE_INTEGER);
    const words = textContent.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    
    // Calculate individual scores
    const checks: any = {};
    let totalScore = 0;
    let checkCount = 0;

    // Title Length
    const titleLen = title.length;
    if (titleLen >= 50 && titleLen <= 60) {
      checks.titleLength = { score: 100, message: 'Perfecte titel lengte', status: 'good', tip: 'Je titel heeft de ideale lengte voor SEO.' };
    } else if (titleLen >= 30 && titleLen < 50) {
      checks.titleLength = { score: 70, message: 'Titel is iets kort', status: 'warning', tip: 'Probeer je titel uit te breiden naar 50-60 karakters voor optimaal resultaat.' };
    } else if (titleLen > 60 && titleLen <= 70) {
      checks.titleLength = { score: 70, message: 'Titel is iets lang', status: 'warning', tip: 'Verkort je titel naar 50-60 karakters voor beste weergave in zoekresultaten.' };
    } else {
      checks.titleLength = { score: 30, message: titleLen < 30 ? 'Titel is te kort' : 'Titel is te lang', status: 'error', tip: 'Zorg dat je titel tussen 50-60 karakters lang is.' };
    }
    totalScore += checks.titleLength.score;
    checkCount++;

    // Title Has Keyword
    if (keyword && title.toLowerCase().includes(keyword)) {
      checks.titleHasKeyword = { score: 100, message: 'Focus keyword in titel ✓', status: 'good', tip: 'Perfect! Je focus keyword staat in de titel.' };
    } else if (keyword) {
      checks.titleHasKeyword = { score: 0, message: 'Focus keyword ontbreekt in titel', status: 'error', tip: `Voeg "${data.focusKeyword}" toe aan je titel voor betere SEO.` };
    } else {
      checks.titleHasKeyword = { score: 50, message: 'Geen focus keyword ingesteld', status: 'warning', tip: 'Stel een focus keyword in voor betere SEO analyse.' };
    }
    totalScore += checks.titleHasKeyword.score;
    checkCount++;

    // Meta Description Length
    const metaLen = metaDesc.length;
    if (metaLen >= 140 && metaLen <= 160) {
      checks.metaDescriptionLength = { score: 100, message: 'Perfecte meta description lengte', status: 'good', tip: 'Je meta description heeft de ideale lengte.' };
    } else if (metaLen >= 120 && metaLen < 140) {
      checks.metaDescriptionLength = { score: 70, message: 'Meta description is iets kort', status: 'warning', tip: 'Probeer je meta description uit te breiden naar 140-160 karakters.' };
    } else if (metaLen > 160 && metaLen <= 180) {
      checks.metaDescriptionLength = { score: 70, message: 'Meta description is iets lang', status: 'warning', tip: 'Verkort je meta description naar 140-160 karakters.' };
    } else {
      checks.metaDescriptionLength = { score: 30, message: metaLen < 120 ? 'Meta description is te kort' : 'Meta description is te lang', status: 'error', tip: 'Zorg dat je meta description tussen 140-160 karakters lang is.' };
    }
    totalScore += checks.metaDescriptionLength.score;
    checkCount++;

    // Meta Description Has Keyword
    if (keyword && metaDesc.toLowerCase().includes(keyword)) {
      checks.metaDescriptionHasKeyword = { score: 100, message: 'Focus keyword in meta description ✓', status: 'good', tip: 'Perfect! Je focus keyword staat in de meta description.' };
    } else if (keyword) {
      checks.metaDescriptionHasKeyword = { score: 0, message: 'Focus keyword ontbreekt in meta description', status: 'error', tip: `Voeg "${data.focusKeyword}" toe aan je meta description.` };
    } else {
      checks.metaDescriptionHasKeyword = { score: 50, message: 'Geen focus keyword ingesteld', status: 'warning' };
    }
    totalScore += checks.metaDescriptionHasKeyword.score;
    checkCount++;

    // Keyword Density
    if (keyword) {
      const keywordCount = countKeywordOccurrences(textContent, keyword);
      const density = (keywordCount / wordCount) * 100;
      
      if (density >= 0.5 && density <= 2.5) {
        checks.keywordDensity = { score: 100, message: `Keyword dichtheid perfect (${density.toFixed(1)}%)`, status: 'good', tip: 'Je keyword dichtheid is ideaal voor SEO.' };
      } else if (density < 0.5) {
        checks.keywordDensity = { score: 60, message: `Keyword dichtheid laag (${density.toFixed(1)}%)`, status: 'warning', tip: 'Gebruik je focus keyword vaker in de content (streef naar 0.5-2.5%).' };
      } else {
        checks.keywordDensity = { score: 40, message: `Keyword stuffing risico (${density.toFixed(1)}%)`, status: 'error', tip: 'Te veel keyword gebruik kan schadelijk zijn. Verlaag naar 0.5-2.5%.' };
      }
    } else {
      checks.keywordDensity = { score: 50, message: 'Geen focus keyword ingesteld', status: 'warning' };
    }
    totalScore += checks.keywordDensity.score;
    checkCount++;

    // Keyword in First Paragraph
    const firstParagraph = textContent.substring(0, 300).toLowerCase();
    if (keyword && firstParagraph.includes(keyword)) {
      checks.keywordInFirstParagraph = { score: 100, message: 'Focus keyword in eerste alinea ✓', status: 'good', tip: 'Perfect! Je focus keyword staat vroeg in de content.' };
    } else if (keyword) {
      checks.keywordInFirstParagraph = { score: 0, message: 'Focus keyword ontbreekt in eerste alinea', status: 'error', tip: 'Gebruik je focus keyword in de eerste 300 woorden.' };
    } else {
      checks.keywordInFirstParagraph = { score: 50, message: 'Geen focus keyword ingesteld', status: 'warning' };
    }
    totalScore += checks.keywordInFirstParagraph.score;
    checkCount++;

    // Keyword in Headings
    const headings = content.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/gi) || [];
    const headingsText = headings.join(' ').toLowerCase();
    if (keyword && headingsText.includes(keyword)) {
      checks.keywordInHeadings = { score: 100, message: 'Focus keyword in headings ✓', status: 'good', tip: 'Je focus keyword staat in je koppen.' };
    } else if (keyword) {
      checks.keywordInHeadings = { score: 50, message: 'Focus keyword ontbreekt in headings', status: 'warning', tip: 'Voeg je focus keyword toe aan minimaal één heading.' };
    } else {
      checks.keywordInHeadings = { score: 50, message: 'Geen focus keyword ingesteld', status: 'warning' };
    }
    totalScore += checks.keywordInHeadings.score;
    checkCount++;

    // Content Length
    if (wordCount >= 1000) {
      checks.contentLength = { score: 100, message: `Uitstekende content lengte (${wordCount} woorden)`, status: 'good', tip: 'Je artikel heeft voldoende diepgang voor goede SEO.' };
    } else if (wordCount >= 500) {
      checks.contentLength = { score: 70, message: `Goede content lengte (${wordCount} woorden)`, status: 'warning', tip: 'Probeer je artikel uit te breiden naar 1000+ woorden voor betere rankings.' };
    } else if (wordCount >= 300) {
      checks.contentLength = { score: 40, message: `Content is kort (${wordCount} woorden)`, status: 'warning', tip: 'Breidt je artikel uit naar minimaal 500 woorden.' };
    } else {
      checks.contentLength = { score: 20, message: `Content is te kort (${wordCount} woorden)`, status: 'error', tip: 'Je artikel is te kort. Streef naar minimaal 300 woorden.' };
    }
    totalScore += checks.contentLength.score;
    checkCount++;

    // Readability Score (Flesch Reading Ease)
    // Note: This algorithm is calibrated for English. For Dutch content, the scores
    // may be somewhat inaccurate but still provide useful relative guidance.
    const fleschScore = calculateFleschScore(textContent);
    
    if (fleschScore >= 60) {
      checks.readabilityScore = { score: 100, message: `Goed leesbaar (score: ${Math.round(fleschScore)})`, status: 'good', tip: 'Je content is makkelijk te lezen voor de meeste mensen. Let op: score is gebaseerd op Engels algoritme.' };
    } else if (fleschScore >= 50) {
      checks.readabilityScore = { score: 70, message: `Redelijk leesbaar (score: ${Math.round(fleschScore)})`, status: 'warning', tip: 'Gebruik kortere zinnen en simplere woorden voor betere leesbaarheid.' };
    } else {
      checks.readabilityScore = { score: 40, message: `Moeilijk leesbaar (score: ${Math.round(fleschScore)})`, status: 'error', tip: 'Je content is complex. Maak zinnen korter en gebruik eenvoudiger taal.' };
    }
    totalScore += checks.readabilityScore.score;
    checkCount++;

    // Paragraph Length
    const paragraphs = content.split(/<\/p>/gi).filter(p => p.trim().length > 0);
    const longParagraphs = paragraphs.filter(p => {
      const pWords = p.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean);
      return pWords.length > 150;
    });
    
    if (longParagraphs.length === 0) {
      checks.paragraphLength = { score: 100, message: 'Alinea lengtes zijn goed', status: 'good', tip: 'Je alineas hebben een goede lengte voor leesbaarheid.' };
    } else if (longParagraphs.length <= 2) {
      checks.paragraphLength = { score: 70, message: `${longParagraphs.length} lange alinea(s) gevonden`, status: 'warning', tip: 'Splits lange alineas op in kleinere stukken (max 150 woorden).' };
    } else {
      checks.paragraphLength = { score: 40, message: `${longParagraphs.length} lange alinea(s) gevonden`, status: 'error', tip: 'Te veel lange alineas maken je content moeilijk leesbaar. Splits ze op.' };
    }
    totalScore += checks.paragraphLength.score;
    checkCount++;

    // Sentence Length
    const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const longSentences = sentences.filter(s => s.split(/\s+/).length > 20);
    if (longSentences.length === 0) {
      checks.sentenceLength = { score: 100, message: 'Zin lengtes zijn goed', status: 'good', tip: 'Je zinnen zijn kort en krachtig.' };
    } else if (longSentences.length <= 3) {
      checks.sentenceLength = { score: 70, message: `${longSentences.length} lange zin(nen) gevonden`, status: 'warning', tip: 'Splits enkele lange zinnen op voor betere leesbaarheid (max 20 woorden).' };
    } else {
      checks.sentenceLength = { score: 40, message: `${longSentences.length} lange zin(nen) gevonden`, status: 'error', tip: 'Te veel lange zinnen. Splits ze op in kortere, duidelijkere zinnen.' };
    }
    totalScore += checks.sentenceLength.score;
    checkCount++;

    // Internal Links
    const links = content.match(/<a\s+[^>]*href=["']([^"']*)["'][^>]*>/gi) || [];
    const internalLinksCount = links.filter(link => 
      link.includes('href="/"') || link.includes("href='/'") || 
      link.includes('href="/') || link.includes("href='/") ||
      link.includes('writgo.nl')
    ).length;
    
    if (internalLinksCount >= 3) {
      checks.internalLinks = { score: 100, message: `${internalLinksCount} interne links`, status: 'good', count: internalLinksCount, tip: 'Goede interne link structuur helpt bezoekers en SEO.' };
    } else if (internalLinksCount >= 1) {
      checks.internalLinks = { score: 60, message: `${internalLinksCount} interne link(s)`, status: 'warning', count: internalLinksCount, tip: 'Voeg meer interne links toe naar gerelateerde content (streef naar 3+).' };
    } else {
      checks.internalLinks = { score: 0, message: 'Geen interne links', status: 'error', count: 0, tip: 'Voeg interne links toe naar andere paginas op je website.' };
    }
    totalScore += checks.internalLinks.score;
    checkCount++;

    // External Links
    const externalLinksCount = links.filter(link => 
      link.includes('http') && !link.includes('writgo.nl')
    ).length;
    
    if (externalLinksCount >= 2) {
      checks.externalLinks = { score: 100, message: `${externalLinksCount} externe links`, status: 'good', count: externalLinksCount, tip: 'Externe links naar gezaghebbende bronnen verhogen je geloofwaardigheid.' };
    } else if (externalLinksCount === 1) {
      checks.externalLinks = { score: 70, message: `${externalLinksCount} externe link`, status: 'warning', count: externalLinksCount, tip: 'Voeg nog een externe link toe naar een betrouwbare bron.' };
    } else {
      checks.externalLinks = { score: 50, message: 'Geen externe links', status: 'warning', count: 0, tip: 'Voeg externe links toe naar gezaghebbende bronnen om je content te onderbouwen.' };
    }
    totalScore += checks.externalLinks.score;
    checkCount++;

    // Images Have Alt Text
    const images = content.match(/<img[^>]*>/gi) || [];
    const imagesWithoutAlt = images.filter(img => !img.includes('alt=') || img.includes('alt=""') || img.includes("alt=''")).length;
    
    if (images.length === 0) {
      checks.imagesHaveAlt = { score: 50, message: 'Geen afbeeldingen', status: 'warning', tip: 'Voeg afbeeldingen toe om je content visueel aantrekkelijker te maken.' };
    } else if (imagesWithoutAlt === 0) {
      checks.imagesHaveAlt = { score: 100, message: `Alle ${images.length} afbeelding(en) hebben alt text ✓`, status: 'good', tip: 'Perfect! Alle afbeeldingen zijn toegankelijk en SEO-vriendelijk.' };
    } else {
      checks.imagesHaveAlt = { score: 30, message: `${imagesWithoutAlt} van ${images.length} afbeelding(en) mist alt text`, status: 'error', tip: 'Voeg beschrijvende alt text toe aan alle afbeeldingen voor betere toegankelijkheid en SEO.' };
    }
    totalScore += checks.imagesHaveAlt.score;
    checkCount++;

    // Calculate overall score
    const overallScore = Math.round(totalScore / checkCount);

    // Generate improvements list
    const improvements: string[] = [];
    Object.entries(checks).forEach(([key, check]: [string, any]) => {
      if (check.status === 'error' && check.tip) {
        improvements.push(check.tip);
      }
    });

    return {
      overallScore,
      ...checks,
      improvements,
    };
  };



  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: 'Uitstekend', className: 'bg-green-500/20 text-green-400 border-green-500/50' };
    if (score >= 50) return { label: 'Goed', className: 'bg-orange-500/20 text-orange-400 border-orange-500/50' };
    return { label: 'Verbeteren', className: 'bg-red-500/20 text-red-400 border-red-500/50' };
  };

  const getCheckIcon = (status: string) => {
    if (status === 'good') return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (status === 'warning') return <AlertCircle className="w-4 h-4 text-orange-500" />;
    return <AlertCircle className="w-4 h-4 text-red-500" />;
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const SEOCheckItem = ({ check, label, section }: { check: SEOCheck; label: string; section: string }) => {
    const isExpanded = expandedSections.has(section);
    
    return (
      <div className="border border-gray-700 rounded-lg p-3 bg-gray-800/30">
        <button
          onClick={() => toggleSection(section)}
          className="w-full flex items-start justify-between text-left hover:bg-gray-700/30 rounded p-1 -m-1 transition-colors"
        >
          <div className="flex items-start gap-2 flex-1">
            {getCheckIcon(check.status)}
            <div className="flex-1">
              <div className="font-medium text-sm text-white">{label}</div>
              <div className={`text-xs ${check.status === 'good' ? 'text-green-400' : check.status === 'warning' ? 'text-orange-400' : 'text-red-400'}`}>
                {check.message}
              </div>
            </div>
          </div>
          {check.tip && (
            isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>
        {check.tip && isExpanded && (
          <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-300 pl-6">
            <Info className="w-3 h-3 inline mr-1 text-blue-400" />
            {check.tip}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Focus Keyword Input */}
      <Card className="p-4 bg-gray-800/50 border-gray-700">
        <Label className="flex items-center gap-2 text-white mb-2">
          <Hash className="w-4 h-4 text-orange-500" />
          Focus Keyword
        </Label>
        <Input
          value={data.focusKeyword}
          onChange={(e) => onChange('focusKeyword', e.target.value)}
          placeholder="Voer je primaire zoekwoord in"
          className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
        />
        <p className="text-xs text-gray-400 mt-2">
          Het woord of de zin waar je voor wilt ranken in zoekmachines
        </p>
      </Card>

      {/* SEO Score Overview */}
      <Card className="p-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2 text-white">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            SEO Score
          </h3>
          {analyzing && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent" />
          )}
        </div>

        {analysis && (
          <>
            <div className="text-center mb-6">
              <div className={`text-6xl font-bold ${getScoreColor(analysis.overallScore)} mb-2`}>
                {analysis.overallScore}
              </div>
              <Badge className={getScoreBadge(analysis.overallScore).className}>
                {getScoreBadge(analysis.overallScore).label}
              </Badge>
              <Progress value={analysis.overallScore} className="h-3 mt-4" />
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-300">
                <FileText className="w-4 h-4 text-orange-500" />
                <span>{analysis.contentLength.message.match(/\d+/)?.[0] || '0'} woorden</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Eye className="w-4 h-4 text-orange-500" />
                <span>~{Math.ceil((parseInt(analysis.contentLength.message.match(/\d+/)?.[0] || '0')) / 200)} min lezen</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <LinkIcon className="w-4 h-4 text-orange-500" />
                <span>{analysis.internalLinks.count} interne</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <LinkIcon className="w-4 h-4 text-orange-500" />
                <span>{analysis.externalLinks.count} externe</span>
              </div>
            </div>
          </>
        )}

        {!analysis && !analyzing && (
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-400">
              Vul titel en content in voor SEO analyse
            </p>
          </div>
        )}
      </Card>

      {/* SEO Checks */}
      {analysis && (
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-orange-500" />
            SEO Checklist
          </h4>
          <div className="space-y-2">
            <SEOCheckItem check={analysis.titleLength} label="Titel lengte" section="titleLength" />
            <SEOCheckItem check={analysis.titleHasKeyword} label="Keyword in titel" section="titleKeyword" />
            <SEOCheckItem check={analysis.metaDescriptionLength} label="Meta description lengte" section="metaLength" />
            <SEOCheckItem check={analysis.metaDescriptionHasKeyword} label="Keyword in meta description" section="metaKeyword" />
            <SEOCheckItem check={analysis.contentLength} label="Content lengte" section="contentLength" />
            <SEOCheckItem check={analysis.keywordDensity} label="Keyword dichtheid" section="keywordDensity" />
            <SEOCheckItem check={analysis.keywordInFirstParagraph} label="Keyword in eerste alinea" section="firstPara" />
            <SEOCheckItem check={analysis.keywordInHeadings} label="Keyword in headings" section="headings" />
            <SEOCheckItem check={analysis.readabilityScore} label="Leesbaarheid" section="readability" />
            <SEOCheckItem check={analysis.paragraphLength} label="Alinea lengtes" section="paragraphs" />
            <SEOCheckItem check={analysis.sentenceLength} label="Zin lengtes" section="sentences" />
            <SEOCheckItem check={analysis.internalLinks} label="Interne links" section="internal" />
            <SEOCheckItem check={analysis.externalLinks} label="Externe links" section="external" />
            <SEOCheckItem check={analysis.imagesHaveAlt} label="Afbeelding alt text" section="images" />
          </div>
        </Card>
      )}

      {/* Priority Improvements */}
      {analysis && analysis.improvements.length > 0 && (
        <Card className="p-4 bg-red-500/10 border-red-500/30">
          <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Prioriteit Verbeteringen
          </h4>
          <ul className="space-y-2">
            {analysis.improvements.slice(0, 3).map((improvement, index) => (
              <li key={index} className="flex gap-2 text-sm text-gray-300">
                <span className="text-red-500 font-bold">•</span>
                <span>{improvement}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Meta Fields */}
      <Card className="p-4 bg-gray-800/50 border-gray-700">
        <h4 className="font-semibold mb-4 text-white">SEO Meta Data</h4>
        <div className="space-y-4">
          <div>
            <Label className="flex items-center justify-between text-gray-300 mb-2">
              <span>Meta Title</span>
              <span className="text-xs text-gray-500">
                {(data.metaTitle || data.title)?.length || 0}/60
              </span>
            </Label>
            <Input
              value={data.metaTitle || data.title}
              onChange={(e) => onChange('metaTitle', e.target.value)}
              placeholder={data.title || 'SEO vriendelijke titel'}
              maxLength={60}
              className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          <div>
            <Label className="flex items-center justify-between text-gray-300 mb-2">
              <span>Meta Description</span>
              <span className="text-xs text-gray-500">
                {data.metaDescription?.length || 0}/160
              </span>
            </Label>
            <Textarea
              value={data.metaDescription}
              onChange={(e) => onChange('metaDescription', e.target.value)}
              placeholder="Korte beschrijving voor zoekmachines (140-160 karakters)"
              rows={3}
              maxLength={160}
              className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          <div>
            <Label className="flex items-center gap-2 text-gray-300 mb-2">
              <LinkIcon className="w-4 h-4 text-orange-500" />
              URL Slug
            </Label>
            <Input
              value={data.slug}
              onChange={(e) =>
                onChange(
                  'slug',
                  e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
                )
              }
              placeholder="url-vriendelijke-slug"
              className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              URL: https://writgo.nl/{data.slug || 'your-slug'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
