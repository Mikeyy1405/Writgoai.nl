'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Globe, 
  Share2, 
  Video,
  FileText,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

export default function PublishHub() {
  const router = useRouter();

  const publishOptions = [
    {
      id: 'wordpress',
      title: 'WordPress',
      description: 'Publiceer direct naar je WordPress website',
      icon: <Globe className="w-8 h-8" />,
      href: '/client-portal/wordpress-content',
      status: 'active',
    },
    {
      id: 'social',
      title: 'Social Media',
      description: 'Plan en publiceer naar alle social platforms',
      icon: <Share2 className="w-8 h-8" />,
      href: '/client-portal/social-media',
      status: 'active',
    },
    {
      id: 'youtube',
      title: 'YouTube',
      description: 'Genereer en upload video content',
      icon: <Video className="w-8 h-8" />,
      href: '/client-portal/video',
      status: 'active',
    },
    {
      id: 'library',
      title: 'Content Library',
      description: 'Bekijk al je content op één plek',
      icon: <FileText className="w-8 h-8" />,
      href: '/client-portal/content-library',
      status: 'active',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Publiceren
          </h1>
          <p className="text-gray-400 text-lg">
            Deel je content met de wereld
          </p>
        </div>

        {/* Publishing Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {publishOptions.map((option) => (
            <Card
              key={option.id}
              className="bg-gray-800/50 border-gray-700 hover:border-orange-500/50 transition-all group"
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 text-orange-500 group-hover:from-orange-500 group-hover:to-orange-600 group-hover:text-white transition-all">
                    {option.icon}
                  </div>
                  {option.status === 'active' && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                </div>
                <CardTitle className="text-white text-xl mb-2">
                  {option.title}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {option.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => router.push(option.href)}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                >
                  Open {option.title}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-12 p-6 bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-2xl">
          <h3 className="text-xl font-semibold text-white mb-3">
            🚀 Snelle acties
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/client-portal/wordpress-content')}
              className="p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-all text-left"
            >
              <p className="text-white font-medium mb-1">WordPress Instellingen</p>
              <p className="text-gray-400 text-sm">Configureer je WordPress connectie</p>
            </button>
            <button
              onClick={() => router.push('/client-portal/social-media')}
              className="p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-all text-left"
            >
              <p className="text-white font-medium mb-1">Social Media Planning</p>
              <p className="text-gray-400 text-sm">Plan je social media posts</p>
            </button>
            <button
              onClick={() => router.push('/client-portal/content-library')}
              className="p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-all text-left"
            >
              <p className="text-white font-medium mb-1">Content Overzicht</p>
              <p className="text-gray-400 text-sm">Bekijk al je content</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
