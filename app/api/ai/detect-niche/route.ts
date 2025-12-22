import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { analyzeWithPerplexityJSON } from '@/lib/ai-client';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface NicheAnalysis {
  niche: string;
  sub_niches: string[];
  target_audience: string;
  content_style: string;
  strengths: string[];
  opportunities: string[];
  language: string;
  keywords: string[];
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { project_id } = body;

    if (!project_id) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    // Get project
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .eq('user_id', user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Use Perplexity Sonar Pro to analyze the website with real-time web access
    const analysisPrompt = `Analyseer de website ${project.website_url} grondig.

Bezoek de website en analyseer:
1. Wat is de EXACTE primaire niche? (bijv. "Yoga", "Fitness", "E-commerce", "Tandheelkunde")
2. Wat zijn de sub-niches of specialisaties?
3. Wie is de doelgroep?
4. Wat is de content stijl?
5. Wat zijn de sterke punten van de website?
6. Welke kansen zijn er voor verbetering?
7. In welke taal is de website?
8. Welke keywords zijn relevant voor deze website?

BELANGRIJK: Baseer je analyse op de DAADWERKELIJKE inhoud van de website, niet op aannames.
De niche moet SPECIFIEK zijn voor wat de website daadwerkelijk aanbiedt.

Antwoord in JSON formaat:
{
  "niche": "De exacte primaire niche (bijv. Yoga, Fitness, Software, Tandarts)",
  "sub_niches": ["sub-niche 1", "sub-niche 2", "sub-niche 3"],
  "target_audience": "Beschrijving van de doelgroep",
  "content_style": "Stijl van de content (professioneel, casual, technisch, etc.)",
  "strengths": ["sterkte 1", "sterkte 2"],
  "opportunities": ["kans 1", "kans 2", "kans 3"],
  "language": "nl of en",
  "keywords": ["keyword 1", "keyword 2", "keyword 3", "keyword 4", "keyword 5"]
}`;

    console.log('Analyzing website with Perplexity:', project.website_url);
    
    const analysis = await analyzeWithPerplexityJSON<NicheAnalysis>(analysisPrompt);
    
    console.log('Niche analysis result:', analysis);

    // Save analysis to project
    await supabase
      .from('projects')
      .update({
        niche: analysis.niche,
        niche_analysis: analysis,
      })
      .eq('id', project_id);

    // Log activity
    await supabase.from('activity_logs').insert({
      project_id,
      action: 'scan',
      message: `Niche detected: ${analysis.niche}`,
      details: analysis,
    });

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    console.error('Error detecting niche:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
