export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { WordPressClient } from '@/lib/content-hub/wordpress-client';

// Helper functie voor client en project validatie
async function validateClientAndProject(email: string, projectId: string) {
  const client = await prisma.client.findUnique({
    where: { email },
  });

  if (!client) {
    return { error: 'Client niet gevonden', status: 404 };
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      clientId: client.id,
    },
  });

  if (!project) {
    return { error: 'Project niet gevonden', status: 404 };
  }

  return { client, project };
}

// GET - Haal WordPress instellingen op
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const validation = await validateClientAndProject(session.user.email, params.id);
    if ('error' in validation) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const { project } = validation;

    // Check for ContentHubSite
    const contentHub = await prisma.contentHubSite.findFirst({
      where: {
        projectId: params.id,
      },
    });

    return NextResponse.json({
      siteUrl: project.wordpressUrl || null,
      username: project.wordpressUsername || null,
      hasPassword: !!project.wordpressPassword,
      category: project.wordpressCategory || null,
      autoPublish: project.wordpressAutoPublish || false,
      isConnected: !!project.wordpressUrl && !!project.wordpressUsername && !!project.wordpressPassword,
      contentHubId: contentHub?.id || null,
    });

  } catch (error: any) {
    console.error('Error fetching WordPress settings:', error);
    return NextResponse.json(
      { error: 'Fout bij ophalen WordPress instellingen' },
      { status: 500 }
    );
  }
}

// PUT - Update WordPress instellingen
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const validation = await validateClientAndProject(session.user.email, params.id);
    if ('error' in validation) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const data = await req.json();
    
    // Update WordPress instellingen
    const updatedProject = await prisma.project.update({
      where: { id: params.id },
      data: {
        wordpressUrl: data.wordpressUrl || null,
        wordpressUsername: data.wordpressUsername || null,
        wordpressPassword: data.wordpressPassword || null,
        wordpressCategory: data.wordpressCategory || null,
        wordpressAutoPublish: data.wordpressAutoPublish || false,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'WordPress instellingen opgeslagen',
      project: {
        id: updatedProject.id,
        siteUrl: updatedProject.wordpressUrl,
        username: updatedProject.wordpressUsername,
        hasPassword: !!updatedProject.wordpressPassword,
        category: updatedProject.wordpressCategory,
        autoPublish: updatedProject.wordpressAutoPublish,
      },
    });

  } catch (error: any) {
    console.error('Error saving WordPress settings:', error);
    return NextResponse.json(
      { error: 'Fout bij opslaan WordPress instellingen' },
      { status: 500 }
    );
  }
}

// POST - WordPress actions (test, create-hub)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const action = searchParams.get('action');

    if (!action || !['test', 'create-hub'].includes(action)) {
      return NextResponse.json(
        { error: 'Ongeldige action. Kies: test, create-hub' },
        { status: 400 }
      );
    }

    const validation = await validateClientAndProject(session.user.email, params.id);
    if ('error' in validation) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const { client, project } = validation;

    if (action === 'test') {
      return await handleTestConnection(req, project);
    } else if (action === 'create-hub') {
      return await handleCreateContentHub(client, project);
    }

    return NextResponse.json({ error: 'Onbekende action' }, { status: 400 });

  } catch (error: any) {
    console.error('Error in WordPress action:', error);
    return NextResponse.json(
      { error: 'Fout bij uitvoeren WordPress actie' },
      { status: 500 }
    );
  }
}

// DELETE - Verwijder WordPress instellingen
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const validation = await validateClientAndProject(session.user.email, params.id);
    if ('error' in validation) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    // Verwijder WordPress instellingen
    await prisma.project.update({
      where: { id: params.id },
      data: {
        wordpressUrl: null,
        wordpressUsername: null,
        wordpressPassword: null,
        wordpressCategory: null,
        wordpressAutoPublish: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'WordPress instellingen verwijderd',
    });

  } catch (error: any) {
    console.error('Error deleting WordPress settings:', error);
    return NextResponse.json(
      { error: 'Fout bij verwijderen WordPress instellingen' },
      { status: 500 }
    );
  }
}

// Helper: Test WordPress connection
async function handleTestConnection(req: NextRequest, project: any) {
  const data = await req.json();
  const { wordpressUrl, wordpressUsername, wordpressPassword } = data;

  if (!wordpressUrl || !wordpressUsername || !wordpressPassword) {
    return NextResponse.json(
      { error: 'Alle velden zijn verplicht' },
      { status: 400 }
    );
  }

  // Normalize WordPress URL
  const normalizedUrl = wordpressUrl.replace(/\/$/, '');

  // Test connection by getting site info
  const authHeader = Buffer.from(
    `${wordpressUsername}:${wordpressPassword}`
  ).toString('base64');

  try {
    const testResponse = await fetch(`${normalizedUrl}/wp-json/wp/v2/users/me`, {
      headers: {
        Authorization: `Basic ${authHeader}`,
      },
    });

    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      console.error('WordPress test failed:', errorText);
      
      if (testResponse.status === 401) {
        return NextResponse.json(
          { error: 'Ongeldige gebruikersnaam of wachtwoord' },
          { status: 400 }
        );
      }
      
      if (testResponse.status === 404) {
        return NextResponse.json(
          { error: 'WordPress API niet gevonden. Controleer de URL.' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Kan geen verbinding maken met WordPress' },
        { status: 400 }
      );
    }

    const userData = await testResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Verbinding succesvol!',
      user: {
        id: userData.id,
        name: userData.name,
        roles: userData.roles,
      },
    });

  } catch (error: any) {
    console.error('Error testing WordPress connection:', error);
    
    if (error.message?.includes('fetch')) {
      return NextResponse.json(
        { error: 'Kan geen verbinding maken met WordPress URL. Controleer de URL en probeer opnieuw.' },
        { status: 400 }
      );
    }

    throw error;
  }
}

// Helper: Create ContentHub site
async function handleCreateContentHub(client: any, project: any) {
  // Verify WordPress is configured
  if (!project.wordpressUrl || !project.wordpressUsername || !project.wordpressPassword) {
    return NextResponse.json({ 
      error: 'WordPress is niet volledig geconfigureerd voor dit project' 
    }, { status: 400 });
  }

  // Check if ContentHubSite already exists for this project
  const existingSite = await prisma.contentHubSite.findFirst({
    where: {
      projectId: project.id,
    },
  });

  if (existingSite) {
    return NextResponse.json({ 
      success: true,
      site: existingSite,
      message: 'ContentHubSite bestaat al',
    });
  }

  // Test WordPress connection
  const wpClient = new WordPressClient({
    siteUrl: project.wordpressUrl,
    username: project.wordpressUsername,
    applicationPassword: project.wordpressPassword,
  });

  const testResult = await wpClient.testConnection();

  if (!testResult.success) {
    return NextResponse.json(
      { 
        success: false,
        error: `WordPress verbinding mislukt: ${testResult.message}`,
      },
      { status: 400 }
    );
  }

  // Get existing pages count
  let existingPages = 0;
  try {
    const posts = await wpClient.getPosts({ per_page: 1 });
    existingPages = posts.total;
  } catch (error) {
    console.error('Failed to get posts count:', error);
  }

  // Create ContentHubSite
  const site = await prisma.contentHubSite.create({
    data: {
      wordpressUrl: project.wordpressUrl,
      clientId: client.id,
      projectId: project.id,
      isConnected: true,
      existingPages,
      totalArticles: 0,
      completedArticles: 0,
      niche: project.niche || null,
    },
  });

  return NextResponse.json({
    success: true,
    site,
    message: 'Content Hub succesvol aangemaakt',
  });
}
