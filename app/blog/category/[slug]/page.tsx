import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';

interface CategoryPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const supabase = createClient();

  const { data: category } = await supabase
    .from('article_categories')
    .select('name, description')
    .eq('slug', params.slug)
    .single();

  if (!category) {
    return {
      title: 'Categorie niet gevonden - WritGo',
    };
  }

  return {
    title: `${category.name} - WritGo Blog`,
    description: category.description || `Lees alle artikelen over ${category.name}`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const supabase = createClient();

  // Fetch category
  const { data: category, error: categoryError } = await supabase
    .from('article_categories')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (categoryError || !category) {
    notFound();
  }

  // Fetch posts in this category
  const { data: postMappings } = await supabase
    .from('article_category_mapping')
    .select(`
      article_id,
      articles!inner(id, slug, title, excerpt, featured_image, published_at, views, focus_keyword, status)
    `)
    .eq('category_id', category.id);

  const articles = postMappings
    ?.map((m: any) => m.articles)
    .filter((a: any) => a && a.status === 'published')
    .sort((a: any, b: any) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/blog" className="text-orange-600 hover:text-orange-700 mb-4 inline-block">
            ← Terug naar blog
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">{category.name}</h1>
          {category.description && (
            <p className="text-xl text-gray-300">{category.description}</p>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {articles.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500/10 rounded-full mb-4">
              <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">Nog geen artikelen</h2>
            <p className="text-gray-300">
              Er zijn nog geen artikelen in deze categorie gepubliceerd.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article: any) => (
              <Link
                key={article.id}
                href={`/blog/${article.slug}`}
                className="bg-gray-900/50 border border-gray-800 rounded-lg hover:border-orange-500/50 transition-all overflow-hidden group"
              >
                {/* Featured Image */}
                {article.featured_image ? (
                  <div className="aspect-video bg-gray-200 overflow-hidden">
                    <img
                      src={article.featured_image}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                    <svg className="w-16 h-16 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  {/* Keyword Badge */}
                  {article.focus_keyword && (
                    <span className="inline-block px-3 py-1 text-xs font-medium text-orange-400 bg-orange-900/30 rounded-full mb-3">
                      {article.focus_keyword}
                    </span>
                  )}

                  {/* Title */}
                  <h2 className="text-xl font-semibold text-white mb-2 group-hover:text-orange-500 transition-colors line-clamp-2">
                    {article.title}
                  </h2>

                  {/* Excerpt */}
                  {article.excerpt && (
                    <p className="text-gray-300 line-clamp-3 mb-4">
                      {article.excerpt}
                    </p>
                  )}

                  {/* Meta */}
                  <div className="flex items-center text-sm text-gray-400">
                    <time dateTime={article.published_at}>
                      {new Date(article.published_at).toLocaleDateString('nl-NL', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </time>
                    <span className="flex items-center ml-4">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {article.views || 0}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
