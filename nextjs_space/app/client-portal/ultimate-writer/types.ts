export interface UltimateWriterConfig {
  contentType: string;
  topic: string;
  language: 'nl' | 'en';
  tone: string;
  wordCount: number;
  projectId?: string;
  primaryKeyword: string;
  secondaryKeywords: string;
  generateLSI: boolean;
  generateMetaDescription: boolean;
  webResearch: boolean;
  serpAnalysis: boolean;
  includeTableOfContents: boolean;
  includeFAQ: boolean;
  includeImages: boolean;
  imageCount: number;
  includeInternalLinks: boolean;
  internalLinksCount: number;
  includeBolProducts: boolean;
  bolProductCount: number;
}
