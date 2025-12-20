/**
 * WordPress REST API Integration
 */

export interface WordPressPost {
  title: string;
  content: string;
  status?: 'draft' | 'publish';
  categories?: number[];
}

export async function publishToWordPress(
  wpUrl: string,
  wpUsername: string,
  wpPassword: string,
  post: WordPressPost
): Promise<{ success: boolean; postId?: number; url?: string; error?: string }> {
  try {
    const auth = Buffer.from(`${wpUsername}:${wpPassword}`).toString('base64');
    
    const response = await fetch(`${wpUrl}/wp-json/wp/v2/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: post.title,
        content: post.content,
        status: post.status || 'draft',
        categories: post.categories || [],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WordPress API error: ${error}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      postId: data.id,
      url: data.link,
    };
  } catch (error: any) {
    console.error('WordPress publish error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
