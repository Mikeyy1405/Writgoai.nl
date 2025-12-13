/**
 * WordPress REST API Service
 * Publishing blog posts to WordPress
 */

interface WordPressPublishParams {
  wordpressUrl: string;
  username: string;
  password: string;
  title: string;
  content: string;
  status?: 'publish' | 'draft' | 'pending';
  excerpt?: string;
  categories?: number[];
  tags?: string[];
}

interface WordPressPublishResult {
  id: number;
  link: string;
  status: string;
}

interface WordPressConnectionParams {
  wordpressUrl: string;
  username: string;
  password: string;
}

/**
 * Publish a blog post to WordPress
 */
export async function publishToWordPress(params: WordPressPublishParams): Promise<WordPressPublishResult> {
  try {
    // Validate inputs
    if (!params.wordpressUrl || !params.username || !params.password) {
      throw new Error('WordPress credentials are required');
    }

    if (!params.title || !params.content) {
      throw new Error('Title and content are required');
    }

    // Clean WordPress URL (remove trailing slash)
    const wpUrl = params.wordpressUrl.replace(/\/$/, '');
    
    // Create Basic Auth header
    const auth = Buffer.from(`${params.username}:${params.password}`).toString('base64');
    
    // Prepare post data
    const postData: any = {
      title: params.title,
      content: params.content,
      status: params.status || 'publish',
    };

    if (params.excerpt) {
      postData.excerpt = params.excerpt;
    }

    if (params.categories && params.categories.length > 0) {
      postData.categories = params.categories;
    }

    if (params.tags && params.tags.length > 0) {
      postData.tags = params.tags;
    }

    console.log('🔵 Publishing to WordPress:', {
      url: wpUrl,
      username: params.username,
      title: params.title
    });

    // Make API request
    const response = await fetch(`${wpUrl}/wp-json/wp/v2/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(postData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ WordPress API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`WordPress API error: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    console.log('✅ Published to WordPress:', {
      id: data.id,
      link: data.link
    });

    return {
      id: data.id,
      link: data.link,
      status: data.status
    };
  } catch (error) {
    console.error('❌ WordPress publishing error:', error);
    throw error;
  }
}

/**
 * Test WordPress connection
 */
export async function testWordPressConnection(params: WordPressConnectionParams): Promise<boolean> {
  try {
    if (!params.wordpressUrl || !params.username || !params.password) {
      return false;
    }

    // Clean WordPress URL
    const wpUrl = params.wordpressUrl.replace(/\/$/, '');
    
    // Create Basic Auth header
    const auth = Buffer.from(`${params.username}:${params.password}`).toString('base64');
    
    console.log('🔵 Testing WordPress connection:', {
      url: wpUrl,
      username: params.username
    });

    // Try to get current user
    const response = await fetch(`${wpUrl}/wp-json/wp/v2/users/me`, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ WordPress connection successful:', {
        id: data.id,
        name: data.name,
        capabilities: Object.keys(data.capabilities || {})
      });
      return true;
    } else {
      console.error('❌ WordPress connection failed:', {
        status: response.status,
        statusText: response.statusText
      });
      return false;
    }
  } catch (error) {
    console.error('❌ WordPress connection test error:', error);
    return false;
  }
}

/**
 * Update an existing WordPress post
 */
export async function updateWordPressPost(
  params: WordPressPublishParams & { postId: number }
): Promise<WordPressPublishResult> {
  try {
    if (!params.wordpressUrl || !params.username || !params.password) {
      throw new Error('WordPress credentials are required');
    }

    if (!params.postId) {
      throw new Error('Post ID is required for update');
    }

    // Clean WordPress URL
    const wpUrl = params.wordpressUrl.replace(/\/$/, '');
    
    // Create Basic Auth header
    const auth = Buffer.from(`${params.username}:${params.password}`).toString('base64');
    
    // Prepare post data
    const postData: any = {};

    if (params.title) postData.title = params.title;
    if (params.content) postData.content = params.content;
    if (params.status) postData.status = params.status;
    if (params.excerpt) postData.excerpt = params.excerpt;
    if (params.categories) postData.categories = params.categories;
    if (params.tags) postData.tags = params.tags;

    console.log('🔵 Updating WordPress post:', {
      url: wpUrl,
      postId: params.postId
    });

    // Make API request
    const response = await fetch(`${wpUrl}/wp-json/wp/v2/posts/${params.postId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(postData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`WordPress API error: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    console.log('✅ Updated WordPress post:', {
      id: data.id,
      link: data.link
    });

    return {
      id: data.id,
      link: data.link,
      status: data.status
    };
  } catch (error) {
    console.error('❌ WordPress update error:', error);
    throw error;
  }
}

/**
 * Delete a WordPress post
 */
export async function deleteWordPressPost(
  params: WordPressConnectionParams & { postId: number }
): Promise<boolean> {
  try {
    if (!params.wordpressUrl || !params.username || !params.password) {
      throw new Error('WordPress credentials are required');
    }

    if (!params.postId) {
      throw new Error('Post ID is required for deletion');
    }

    // Clean WordPress URL
    const wpUrl = params.wordpressUrl.replace(/\/$/, '');
    
    // Create Basic Auth header
    const auth = Buffer.from(`${params.username}:${params.password}`).toString('base64');

    console.log('🔵 Deleting WordPress post:', {
      url: wpUrl,
      postId: params.postId
    });

    // Make API request
    const response = await fetch(`${wpUrl}/wp-json/wp/v2/posts/${params.postId}?force=true`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`WordPress API error: ${response.statusText} - ${errorText}`);
    }

    console.log('✅ Deleted WordPress post:', params.postId);
    return true;
  } catch (error) {
    console.error('❌ WordPress deletion error:', error);
    return false;
  }
}
