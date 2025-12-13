import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import { FileText, Share2, Globe, Calendar, ExternalLink } from 'lucide-react';
import { prisma } from '@/lib/prisma-shim';

export default async function PublishedPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect('/client-login');
  }

  // Fetch published content
  const [publishedBlogs, publishedSocials] = await Promise.all([
    prisma.blogPost.findMany({
      where: { status: 'published' },
      orderBy: { publishedAt: 'desc' },
      take: 50,
    }),
    prisma.socialMediaPost.findMany({
      where: { status: 'published' },
      orderBy: { publishedAt: 'desc' },
      take: 50,
    }),
  ]);

  // Get project names
  const projectIds = [...new Set([
    ...publishedBlogs.map(b => b.projectId).filter(Boolean),
    ...publishedSocials.map(s => s.projectId).filter(Boolean),
  ])];
  
  const projects = await prisma.project.findMany({
    where: { id: { in: projectIds as string[] } },
  });
  
  const projectMap = Object.fromEntries(
    projects.map(p => [p.id, p])
  );

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gepubliceerde Content</h1>
        <p className="text-gray-600 mt-2">Overzicht van al je gepubliceerde blog posts en social media content</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Blog Posts</h3>
          </div>
          <p className="text-3xl font-bold text-blue-600">{publishedBlogs.length}</p>
          <p className="text-sm text-gray-600 mt-1">Gepubliceerd op WordPress</p>
        </div>

        <div className="bg-green-50 rounded-lg border border-green-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Share2 className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Social Posts</h3>
          </div>
          <p className="text-3xl font-bold text-green-600">{publishedSocials.length}</p>
          <p className="text-sm text-gray-600 mt-1">Gepubliceerd via Getlate</p>
        </div>
      </div>

      {/* Blog Posts Section */}
      {publishedBlogs.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Gepubliceerde Blog Posts
          </h2>
          <div className="space-y-3">
            {publishedBlogs.map((blog) => {
              const project = blog.projectId ? projectMap[blog.projectId] : null;
              
              return (
                <div key={blog.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{blog.title}</h3>
                    {blog.excerpt && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{blog.excerpt}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      {project && (
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {project.name}
                        </span>
                      )}
                      {blog.publishedAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(blog.publishedAt).toLocaleDateString('nl-NL')}
                        </span>
                      )}
                      {blog.focusKeyword && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                          {blog.focusKeyword}
                        </span>
                      )}
                    </div>
                  </div>
                  {blog.wordpressPostId && project?.wordpressUrl && (
                    <a
                      href={`${project.wordpressUrl}/?p=${blog.wordpressPostId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Bekijk
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Social Posts Section */}
      {publishedSocials.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-green-600" />
            Gepubliceerde Social Posts
          </h2>
          <div className="space-y-3">
            {publishedSocials.map((social) => {
              const project = social.projectId ? projectMap[social.projectId] : null;
              
              return (
                <div key={social.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <p className="text-gray-900 line-clamp-3">{social.content}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      {project && (
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {project.name}
                        </span>
                      )}
                      {social.publishedAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(social.publishedAt).toLocaleDateString('nl-NL')}
                        </span>
                      )}
                      {social.platforms && social.platforms.length > 0 && (
                        <div className="flex gap-1">
                          {social.platforms.map(platform => (
                            <span key={platform} className="px-2 py-0.5 bg-green-100 text-green-700 rounded capitalize">
                              {platform}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {social.getlatePostId && (
                    <div className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 bg-green-50 rounded-lg">
                      <ExternalLink className="w-4 h-4" />
                      Live
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {publishedBlogs.length === 0 && publishedSocials.length === 0 && (
        <div className="bg-white rounded-lg border p-12 text-center">
          <Share2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nog geen content gepubliceerd
          </h3>
          <p className="text-gray-600">
            Ga naar Content om je eerste blog post of social post te maken en te publiceren
          </p>
        </div>
      )}
    </div>
  );
}
