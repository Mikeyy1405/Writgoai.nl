import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';

export const metadata: Metadata = {
  title: 'Blog - WritGo | WordPress SEO Automatisering',
  description: 'Leer alles over WordPress SEO automatisering, AI content generatie en zoekmachine optimalisatie.',
};

interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  featured_image: string | null;
  published_at: string;
  views: number;
  focus_keyword: string | null;
}

export default async function BlogPage() {
  const supabase = createClient();

  // Fetch published articles
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, slug, title, excerpt, featured_image, published_at, views, focus_keyword')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching articles:', error);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Terug naar home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">WritGo Blog</h1>
          <p className="text-xl text-gray-600">
            Alles over WordPress SEO automatisering, AI content generatie en zoekmachine optimalisatie
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!articles || articles.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Binnenkort beschikbaar</h2>
            <p className="text-gray-600">
              We zijn hard aan het werk om waardevolle content voor je te creëren. Check binnenkort terug!
            </p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/blog/${article.slug}`}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
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
                  <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <svg className="w-16 h-16 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  {/* Keyword Badge */}
                  {article.focus_keyword && (
                    <span className="inline-block px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full mb-3">
                      {article.focus_keyword}
                    </span>
                  )}

                  {/* Title */}
                  <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {article.title}
                  </h2>

                  {/* Excerpt */}
                  {article.excerpt && (
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {article.excerpt}
                    </p>
                  )}

                  {/* Meta */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <time dateTime={article.published_at}>
                      {new Date(article.published_at).toLocaleDateString('nl-NL', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </time>
                    <span className="flex items-center">
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

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Klaar om jouw WordPress site te laten groeien?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Laat WritGo AI automatisch SEO-geoptimaliseerde content creëren en publiceren
          </p>
          <Link
            href="/auth/register"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Start Gratis →
          </Link>
        </div>
      </section>
    </div>
  );
}
