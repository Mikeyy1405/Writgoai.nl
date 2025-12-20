import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper to analyze GSC data and generate insights
const analyzeGSCData = async (supabase: any, project_id: string, articles: any[]) => {
  const insights: any[] = [];

  // Get recent GSC data
  const { data: gscData } = await supabase
    .from('gsc_data')
    .select('*')
    .eq('project_id', project_id)
    .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('impressions', { ascending: false });

  if (!gscData || gscData.length === 0) return insights;

  for (const query of gscData.slice(0, 20)) {
    // Link Magnet: High position + high impressions
    if (query.position <= 3 && query.impressions > 1000) {
      const match = articles.find(a => 
        a.title.toLowerCase().includes(query.query.toLowerCase()) || 
        a.content.toLowerCase().includes(query.query.toLowerCase())
      );
      
      if (match) {
        insights.push({
          project_id,
          article_id: match.id,
          insight_type: 'link_magnet',
          priority: 9.5,
          query: query.query,
          suggested_action: 'internal_linking',
          status: 'pending',
        });
      }
    }

    // Low CTR: Good position but poor click-through
    if (query.position <= 10 && query.ctr < 3.0 && query.impressions > 100) {
      const match = articles.find(a => 
        a.title.toLowerCase().includes(query.query.toLowerCase()) || 
        a.content.toLowerCase().includes(query.query.toLowerCase())
      );
      
      if (match) {
        insights.push({
          project_id,
          article_id: match.id,
          insight_type: 'low_ctr',
          priority: 8 + (query.impressions / 10000),
          query: query.query,
          suggested_action: 'meta_optimization',
          status: 'pending',
        });
      }
    }

    // Striking Distance: Position 11-30 with potential
    if (query.position > 10 && query.position <= 30 && query.impressions > 50) {
      const match = articles.find(a => 
        a.title.toLowerCase().includes(query.query.toLowerCase()) || 
        a.content.toLowerCase().includes(query.query.toLowerCase())
      );
      
      if (match) {
        insights.push({
          project_id,
          article_id: match.id,
          insight_type: 'striking_distance',
          priority: 7 + (query.impressions / 5000),
          query: query.query,
          suggested_action: 'content_expansion',
          status: 'pending',
        });
      } else {
        // Content gap - no matching article
        insights.push({
          project_id,
          insight_type: 'content_gap',
          priority: 9,
          query: query.query,
          suggested_action: 'create_new',
          status: 'pending',
        });
      }
    }
  }

  return insights.sort((a, b) => b.priority - a.priority);
};

// Log helper
const addLog = async (supabase: any, project_id: string, action: string, message: string, details?: any) => {
  await supabase.from('activity_logs').insert({
    project_id,
    action,
    message,
    details,
  });
};

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

    // Get project with config
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .eq('user_id', user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const { data: config } = await supabase
      .from('autopilot_config')
      .select('*')
      .eq('project_id', project_id)
      .single();

    if (!config) {
      return NextResponse.json({ error: 'AutoPilot not configured' }, { status: 400 });
    }

    await addLog(supabase, project_id, 'scan', `Starting AutoPilot cycle for ${project.name}`);

    // Get existing articles
    const { data: articles } = await supabase
      .from('articles')
      .select('*')
      .eq('project_id', project_id)
      .order('created_at', { ascending: false });

    // Analyze GSC data and generate insights
    const insights = await analyzeGSCData(supabase, project_id, articles || []);

    // Save insights to database
    if (insights.length > 0) {
      await supabase.from('performance_insights').insert(insights);
      await addLog(supabase, project_id, 'plan', `Generated ${insights.length} performance insights`);
    }

    // Determine strategy
    let strategy = 'create_new';
    let selectedInsight = null;

    if (insights.length > 0) {
      selectedInsight = insights[0];
      strategy = selectedInsight.suggested_action;
    } else {
      // Fallback strategy based on config
      const rand = Math.random();
      if (articles?.length === 0) {
        strategy = 'create_new';
      } else if (config.content_strategy === 'aggressive') {
        strategy = rand < 0.6 ? 'create_new' : 'content_expansion';
      } else if (config.content_strategy === 'conservative') {
        strategy = rand < 0.3 ? 'create_new' : 'meta_optimization';
      } else {
        strategy = rand < 0.4 ? 'create_new' : 'content_expansion';
      }
    }

    await addLog(supabase, project_id, 'plan', `Selected strategy: ${strategy.replace('_', ' ').toUpperCase()}`);

    // Execute strategy
    switch (strategy) {
      case 'create_new':
        await handleCreateNew(supabase, project, selectedInsight);
        break;
      case 'content_expansion':
        if (selectedInsight?.article_id) {
          await handleContentExpansion(supabase, project, selectedInsight);
        }
        break;
      case 'meta_optimization':
        if (selectedInsight?.article_id) {
          await handleMetaOptimization(supabase, project, selectedInsight);
        }
        break;
    }

    // Update config
    await supabase
      .from('autopilot_config')
      .update({
        last_run: new Date().toISOString(),
      })
      .eq('project_id', project_id);

    await addLog(supabase, project_id, 'scan', 'AutoPilot cycle completed successfully');

    return NextResponse.json({ success: true, strategy, insights: insights.length });
  } catch (error: any) {
    console.error('Error running autopilot:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleCreateNew(supabase: any, project: any, insight: any) {
  const topic = insight?.query || `SEO tips for ${project.name}`;
  
  await addLog(supabase, project.id, 'generate', `Generating new article: "${topic}"`);

  // Generate content with AI
  const prompt = `Write a comprehensive, SEO-optimized blog article about: "${topic}"

Requirements:
- Tone: professional
- Length: approximately 1000 words
- Include an engaging introduction
- Use headers (H2, H3) to structure the content
- Include practical tips and actionable advice
- Write in Dutch language
- Make it SEO-friendly with natural keyword usage
- End with a strong conclusion

Format the output as HTML with proper heading tags.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      { role: 'system', content: 'You are an expert SEO content writer who creates engaging, well-structured blog articles in Dutch.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 4000,
  });

  const content = completion.choices[0].message.content || '';

  // Generate title
  const titleCompletion = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      { role: 'system', content: 'You are an expert at writing catchy, SEO-optimized blog titles in Dutch. Respond with only the title.' },
      { role: 'user', content: `Create a catchy title for: "${topic}"` },
    ],
    temperature: 0.8,
    max_tokens: 100,
  });

  const title = titleCompletion.choices[0].message.content?.trim() || topic;

  // Save article
  const { data: article } = await supabase
    .from('articles')
    .insert({
      project_id: project.id,
      title,
      content,
      status: 'draft',
    })
    .select()
    .single();

  // Auto-publish if configured
  if (article) {
    await addLog(supabase, project.id, 'publish', `Article created: "${title}"`);
    
    // Publish to WordPress
    try {
      const wpResponse = await fetch(`${project.wp_url}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + Buffer.from(`${project.wp_username}:${project.wp_password}`).toString('base64'),
        },
        body: JSON.stringify({
          title,
          content,
          status: 'publish',
        }),
      });

      if (wpResponse.ok) {
        await supabase
          .from('articles')
          .update({
            status: 'published',
            published_at: new Date().toISOString(),
          })
          .eq('id', article.id);

        await addLog(supabase, project.id, 'publish', `Published to WordPress: "${title}"`);
      }
    } catch (error) {
      await addLog(supabase, project.id, 'error', `Failed to publish: ${error}`);
    }
  }
}

async function handleContentExpansion(supabase: any, project: any, insight: any) {
  const { data: article } = await supabase
    .from('articles')
    .select('*')
    .eq('id', insight.article_id)
    .single();

  if (!article) return;

  await addLog(supabase, project.id, 'update', `Expanding content for: "${article.title}"`);

  // Generate expanded content
  const prompt = `Expand and improve this article section about "${insight.query}":

Original Article: ${article.title}

Add a new comprehensive section (300-500 words) that covers "${insight.query}" in depth. Make it engaging and SEO-optimized. Write in Dutch. Format as HTML.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      { role: 'system', content: 'You are an expert SEO content writer.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  const expansion = completion.choices[0].message.content || '';
  const updatedContent = article.content + '\n\n' + expansion;

  // Update article
  await supabase
    .from('articles')
    .update({ content: updatedContent })
    .eq('id', article.id);

  // Update on WordPress if published
  if (article.status === 'published') {
    try {
      const wpListResponse = await fetch(`${project.wp_url}/posts?search=${encodeURIComponent(article.title)}&per_page=1`, {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${project.wp_username}:${project.wp_password}`).toString('base64'),
        },
      });

      if (wpListResponse.ok) {
        const wpPosts = await wpListResponse.json();
        if (wpPosts.length > 0) {
          await fetch(`${project.wp_url}/posts/${wpPosts[0].id}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Basic ' + Buffer.from(`${project.wp_username}:${project.wp_password}`).toString('base64'),
            },
            body: JSON.stringify({ content: updatedContent }),
          });

          await addLog(supabase, project.id, 'update', `Updated on WordPress: "${article.title}"`);
        }
      }
    } catch (error) {
      await addLog(supabase, project.id, 'error', `Failed to update WordPress: ${error}`);
    }
  }

  // Mark insight as applied
  await supabase
    .from('performance_insights')
    .update({
      status: 'applied',
      applied_at: new Date().toISOString(),
    })
    .eq('id', insight.id);
}

async function handleMetaOptimization(supabase: any, project: any, insight: any) {
  const { data: article } = await supabase
    .from('articles')
    .select('*')
    .eq('id', insight.article_id)
    .single();

  if (!article) return;

  await addLog(supabase, project.id, 'optimize', `Optimizing meta for: "${article.title}"`);

  // Generate optimized title
  const prompt = `Create an optimized, click-worthy title for this article that ranks for "${insight.query}":

Current title: ${article.title}

Requirements:
- Include the keyword "${insight.query}" naturally
- Make it compelling and click-worthy
- Keep it under 60 characters
- Write in Dutch
- Respond with only the new title`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      { role: 'system', content: 'You are an expert at writing SEO-optimized, click-worthy titles.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.8,
    max_tokens: 100,
  });

  const newTitle = completion.choices[0].message.content?.trim() || article.title;

  // Update article
  await supabase
    .from('articles')
    .update({ title: newTitle })
    .eq('id', article.id);

  await addLog(supabase, project.id, 'optimize', `Optimized title: "${newTitle}"`);

  // Mark insight as applied
  await supabase
    .from('performance_insights')
    .update({
      status: 'applied',
      applied_at: new Date().toISOString(),
    })
    .eq('id', insight.id);
}
