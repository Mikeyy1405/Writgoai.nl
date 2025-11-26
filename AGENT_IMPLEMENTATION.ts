
/**
 * WritgoAI Agent Implementation
 * 
 * Een vereenvoudigde versie van DeepAgent specifiek voor content generation
 */

import OpenAI from 'openai';

// Types
interface Tool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
  execute: (params: any) => Promise<any>;
}

interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: any[];
  tool_call_id?: string;
}

interface AgentConfig {
  maxIterations?: number;
  timeout?: number;
  model?: string;
}

/**
 * Main Agent Class
 */
export class WritgoAgent {
  private openai: OpenAI;
  private tools: Map<string, Tool>;
  private conversationHistory: Message[];
  private config: AgentConfig;
  
  constructor(config: AgentConfig = {}) {
    this.openai = new OpenAI({
      apiKey: process.env.AIML_API_KEY,
      baseURL: 'https://api.aimlapi.com/v1'
    });
    
    this.tools = new Map();
    this.conversationHistory = [];
    this.config = {
      maxIterations: config.maxIterations || 10,
      timeout: config.timeout || 300000, // 5 min
      model: config.model || 'gpt-4o'
    };
    
    this.registerTools();
  }
  
  /**
   * Register all available tools
   */
  private registerTools() {
    // Tool 1: Web Research
    this.tools.set('web_research', {
      name: 'web_research',
      description: 'Search the web for information on a topic. Returns relevant articles, facts, and insights.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query'
          },
          numResults: {
            type: 'number',
            description: 'Number of results to return (default: 5)'
          }
        },
        required: ['query']
      },
      execute: async (params) => {
        return await this.webResearch(params.query, params.numResults || 5);
      }
    });
    
    // Tool 2: Generate Blog Article
    this.tools.set('generate_blog_article', {
      name: 'generate_blog_article',
      description: 'Generate a professional SEO-optimized blog article with 1000+ words',
      parameters: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'The main topic/title of the blog'
          },
          keywords: {
            type: 'array',
            items: { type: 'string' },
            description: 'SEO keywords to include'
          },
          targetAudience: {
            type: 'string',
            description: 'Description of the target audience'
          },
          researchContext: {
            type: 'string',
            description: 'Research context from web_research tool (optional)'
          }
        },
        required: ['topic', 'keywords']
      },
      execute: async (params) => {
        return await this.generateBlog(params);
      }
    });
    
    // Tool 3: Generate Social Media Post
    this.tools.set('generate_social_post', {
      name: 'generate_social_post',
      description: 'Generate engaging social media content for Instagram, LinkedIn, etc.',
      parameters: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'The topic of the social post'
          },
          platform: {
            type: 'string',
            enum: ['instagram', 'linkedin', 'facebook', 'twitter'],
            description: 'Target social media platform'
          },
          tone: {
            type: 'string',
            description: 'Tone of voice (e.g., professional, casual, inspiring)'
          }
        },
        required: ['topic', 'platform']
      },
      execute: async (params) => {
        return await this.generateSocialPost(params);
      }
    });
    
    // Tool 4: Get Client Info
    this.tools.set('get_client_info', {
      name: 'get_client_info',
      description: 'Retrieve client information including website, target audience, brand voice, and preferences',
      parameters: {
        type: 'object',
        properties: {
          clientId: {
            type: 'string',
            description: 'The client ID'
          }
        },
        required: ['clientId']
      },
      execute: async (params) => {
        return await this.getClientInfo(params.clientId);
      }
    });
    
    // Tool 5: Publish to WordPress
    this.tools.set('publish_to_wordpress', {
      name: 'publish_to_wordpress',
      description: 'Publish content to a WordPress website',
      parameters: {
        type: 'object',
        properties: {
          clientId: {
            type: 'string',
            description: 'The client ID'
          },
          title: {
            type: 'string',
            description: 'Post title'
          },
          content: {
            type: 'string',
            description: 'HTML content'
          },
          status: {
            type: 'string',
            enum: ['draft', 'publish'],
            description: 'Publication status'
          }
        },
        required: ['clientId', 'title', 'content']
      },
      execute: async (params) => {
        return await this.publishToWordPress(params);
      }
    });
  }
  
  /**
   * Main agent execution loop
   */
  async executeTask(userPrompt: string, systemPrompt?: string): Promise<string> {
    // Initialize conversation with system prompt
    if (systemPrompt) {
      this.conversationHistory.push({
        role: 'system',
        content: systemPrompt
      });
    } else {
      this.conversationHistory.push({
        role: 'system',
        content: `Je bent een intelligente content marketing agent voor WritgoAI. 
Je hebt toegang tot verschillende tools om content te genereren, web research te doen, en content te publiceren.
Gebruik je tools slim en efficiënt om de taak uit te voeren.`
      });
    }
    
    // Add user prompt
    this.conversationHistory.push({
      role: 'user',
      content: userPrompt
    });
    
    let iterations = 0;
    const startTime = Date.now();
    
    while (iterations < this.config.maxIterations!) {
      // Check timeout
      if (Date.now() - startTime > this.config.timeout!) {
        throw new Error('Agent timeout: Maximum execution time exceeded');
      }
      
      console.log(`\n🤖 Agent Iteration ${iterations + 1}/${this.config.maxIterations}`);
      
      // Call LLM with function calling
      const response = await this.openai.chat.completions.create({
        model: this.config.model!,
        messages: this.conversationHistory as any,
        tools: this.getToolDefinitions(),
        tool_choice: 'auto',
        temperature: 0.7
      });
      
      const message = response.choices[0].message;
      
      // Add assistant message to history
      this.conversationHistory.push({
        role: 'assistant',
        content: message.content || '',
        tool_calls: message.tool_calls
      });
      
      // No tool calls? Task is complete!
      if (!message.tool_calls || message.tool_calls.length === 0) {
        console.log('✅ Agent task complete (no more tool calls)');
        return message.content || 'Task completed';
      }
      
      // Execute all tool calls
      for (const toolCall of message.tool_calls) {
        const toolName = toolCall.function.name;
        const tool = this.tools.get(toolName);
        
        if (!tool) {
          console.error(`❌ Unknown tool: ${toolName}`);
          this.conversationHistory.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify({ error: `Unknown tool: ${toolName}` })
          });
          continue;
        }
        
        console.log(`🔧 Executing tool: ${toolName}`);
        
        try {
          const params = JSON.parse(toolCall.function.arguments);
          const result = await tool.execute(params);
          
          console.log(`✅ Tool ${toolName} completed`);
          
          // Add tool result to conversation
          this.conversationHistory.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result)
          });
        } catch (error) {
          console.error(`❌ Tool ${toolName} error:`, error);
          this.conversationHistory.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify({ 
              error: error instanceof Error ? error.message : 'Unknown error' 
            })
          });
        }
      }
      
      iterations++;
    }
    
    throw new Error('Agent max iterations reached');
  }
  
  /**
   * Get tool definitions for OpenAI function calling
   */
  private getToolDefinitions() {
    return Array.from(this.tools.values()).map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }
    }));
  }
  
  /**
   * Tool Implementation: Web Research
   */
  private async webResearch(query: string, numResults: number) {
    // TODO: Implement Tavily or Brave Search API
    // For now, return mock data
    return {
      query,
      results: [
        {
          title: 'Example Result 1',
          url: 'https://example.com/1',
          snippet: 'Relevant information about ' + query
        }
      ]
    };
  }
  
  /**
   * Tool Implementation: Generate Blog
   */
  private async generateBlog(params: any) {
    // Use existing blog generation logic
    const { generateHTMLBlogArticle } = await import('./professional-content-generator');
    
    // Create mock day object
    const day = {
      day: 1,
      date: new Date().toISOString(),
      theme: params.topic,
      mainKeyword: params.keywords[0],
      blog: {
        title: params.topic,
        description: params.researchContext || `Een artikel over ${params.topic}`,
        keywords: params.keywords
      }
    };
    
    // Mock client
    const client = {
      targetAudience: params.targetAudience || 'General audience',
      brandVoice: 'Professional and friendly'
    };
    
    return await generateHTMLBlogArticle(day, client);
  }
  
  /**
   * Tool Implementation: Generate Social Post
   */
  private async generateSocialPost(params: any) {
    const prompt = `Create an engaging ${params.platform} post about: ${params.topic}
Tone: ${params.tone || 'professional'}
Include relevant hashtags and a call-to-action.`;
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8
    });
    
    return {
      platform: params.platform,
      content: response.choices[0].message.content,
      topic: params.topic
    };
  }
  
  /**
   * Tool Implementation: Get Client Info
   */
  private async getClientInfo(clientId: string) {
    // Use Prisma to get client info
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    });
    
    return client;
  }
  
  /**
   * Tool Implementation: Publish to WordPress
   */
  private async publishToWordPress(params: any) {
    // Use existing WordPress publisher
    const { publishToWordPress } = await import('./wordpress-publisher');
    
    return await publishToWordPress(
      params.clientId,
      params.title,
      params.content,
      params.status || 'draft'
    );
  }
}

/**
 * Usage Example:
 * 
 * const agent = new WritgoAgent();
 * 
 * const result = await agent.executeTask(`
 *   Genereer een blog artikel over "AI in Marketing" voor client abc123.
 *   Doe eerst web research, genereer dan het artikel, en publiceer het als draft.
 * `);
 */
