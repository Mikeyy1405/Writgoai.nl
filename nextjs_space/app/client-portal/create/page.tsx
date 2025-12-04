'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Share2, 
  Video, 
  Mail, 
  ShoppingBag, 
  Newspaper,
  Search,
  Target,
  Calendar,
  ArrowRight
} from 'lucide-react';

interface ContentType {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  credits: string;
  href: string;
  category: 'content' | 'marketing' | 'tools';
  popular?: boolean;
}

export default function ContentCreationHub() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const contentTypes: ContentType[] = [
    {
      id: 'blog',
      title: 'Blog Artikel',
      description: 'Complete SEO-geoptimaliseerde artikelen van 1500+ woorden',
      icon: <FileText className="w-8 h-8" />,
      credits: '70 credits',
      href: '/client-portal/blog-generator',
      category: 'content',
      popular: true,
    },
    {
      id: 'social',
      title: 'Social Media Post',
      description: 'Posts voor Instagram, LinkedIn, Facebook, Twitter/X',
      icon: <Share2 className="w-8 h-8" />,
      credits: '20 credits',
      href: '/client-portal/social-media',
      category: 'marketing',
      popular: true,
    },
    {
      id: 'video',
      title: 'Video Script',
      description: "Professionele scripts voor YouTube, Reels en TikTok",
      icon: <Video className="w-8 h-8" />,
      credits: '120 credits',
      href: '/client-portal/video-generator',
      category: 'content',
      popular: true,
    },
    {
      id: 'email',
      title: 'Email Nieuwsbrief',
      description: 'Boeiende nieuwsbrieven en email sequences',
      icon: <Mail className="w-8 h-8" />,
      credits: '30 credits',
      href: '/client-portal/email-marketing',
      category: 'marketing',
    },
    {
      id: 'product',
      title: 'Product Review',
      description: 'Diepgaande product reviews en vergelijkingen',
      icon: <ShoppingBag className="w-8 h-8" />,
      credits: '70 credits',
      href: '/client-portal/product-review-generator',
      category: 'content',
    },
    {
      id: 'news',
      title: 'Nieuwsartikel',
      description: 'Actuele nieuwsartikelen en persberichten',
      icon: <Newspaper className="w-8 h-8" />,
      credits: '60 credits',
      href: '/client-portal/news-article-generator',
      category: 'content',
    },
    {
      id: 'keyword',
      title: 'Keyword Research',
      description: 'Ontdek waar je moet scoren voor SEO',
      icon: <Search className="w-8 h-8" />,
      credits: '40 credits',
      href: '/client-portal/keyword-research',
      category: 'tools',
    },
    {
      id: 'strategy',
      title: 'Content Planner',
      description: 'Plan weken vooruit met AI strategie',
      icon: <Calendar className="w-8 h-8" />,
      credits: '40 credits',
      href: '/client-portal/content-planner',
      category: 'tools',
    },
    {
      id: 'linkbuilding',
      title: 'Link Building',
      description: 'Versterk je autoriteit met backlinks',
      icon: <Target className="w-8 h-8" />,
      credits: '50 credits',
      href: '/client-portal/linkbuilding',
      category: 'tools',
    },
  ];

  const categories = [
    { id: 'all', label: 'Alles' },
    { id: 'content', label: 'Content' },
    { id: 'marketing', label: 'Marketing' },
    { id: 'tools', label: 'Tools' },
  ];

  const filteredContent = selectedCategory === 'all' 
    ? contentTypes 
    : contentTypes.filter(item => item.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Wat wil je maken?
          </h1>
          <p className="text-gray-400 text-lg">
            Kies een content type om te starten
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                selectedCategory === category.id
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-800 border border-gray-700'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Content Type Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContent.map((item) => (
            <Card
              key={item.id}
              onClick={() => router.push(item.href)}
              className="bg-gray-800/50 border-gray-700 hover:border-orange-500/50 transition-all cursor-pointer hover:scale-105 hover:shadow-xl hover:shadow-orange-500/20 group"
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 text-orange-500 group-hover:from-orange-500 group-hover:to-orange-600 group-hover:text-white transition-all">
                    {item.icon}
                  </div>
                  {item.popular && (
                    <Badge className="bg-orange-500 text-white border-0">
                      Populair
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-white text-xl mb-2">
                  {item.title}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {item.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-orange-500 border-orange-500/30">
                    {item.credits}
                  </Badge>
                  <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Tips */}
        <div className="mt-12 p-6 bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-2xl">
          <h3 className="text-xl font-semibold text-white mb-3">
            💡 Snelle tips
          </h3>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-1">•</span>
              <span>Start met <strong>Keyword Research</strong> om te weten waar je op moet focussen</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-1">•</span>
              <span>Gebruik de <strong>Content Planner</strong> om weken vooruit te plannen</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-1">•</span>
              <span>Maak eerst je blog, hergebruik daarna voor <strong>Social Media</strong></span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
