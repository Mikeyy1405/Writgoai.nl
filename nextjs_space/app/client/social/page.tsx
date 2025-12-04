/**
 * Social Media Suite Overview
 * Main page for Social Media Suite
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, Calendar, Link as LinkIcon, Zap, TrendingUp, Users, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function SocialSuitePage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-orange-500/20 p-8">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-orange-500/20 border border-orange-500/30">
              <Share2 className="w-8 h-8 text-orange-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Social Media Suite</h1>
              <p className="text-gray-400">Beheer al je social media content op één plek</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <Share2 className="w-5 h-5 text-orange-500" />
                <span className="text-sm text-gray-400">Posts Gepland</span>
              </div>
              <p className="text-2xl font-bold text-white">0</p>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-400">Engagement</span>
              </div>
              <p className="text-2xl font-bold text-white">0%</p>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-gray-400">Volgers</span>
              </div>
              <p className="text-2xl font-bold text-white">0</p>
            </div>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl" />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Snelle Acties</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Post Generator */}
          <Card className="bg-gray-900 border-orange-500/20 hover:border-orange-500/40 transition-all cursor-pointer group">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-orange-500/20 group-hover:bg-orange-500/30 transition-colors">
                  <Share2 className="w-6 h-6 text-orange-500" />
                </div>
                <CardTitle className="text-white">Post Generator</CardTitle>
              </div>
              <CardDescription>
                Maak engaging social media posts met AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/client-portal/social-media">
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                  Maak Post
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Content Planner */}
          <Card className="bg-gray-900 border-orange-500/20 hover:border-orange-500/40 transition-all cursor-pointer group">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-orange-500/20 group-hover:bg-orange-500/30 transition-colors">
                  <Calendar className="w-6 h-6 text-orange-500" />
                </div>
                <CardTitle className="text-white">Content Planner</CardTitle>
              </div>
              <CardDescription>
                Plan en schedule je social media posts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/client-portal/content-library">
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                  Open Planner
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Autopilot Mode */}
          <Card className="bg-gray-900 border-orange-500/20 hover:border-orange-500/40 transition-all cursor-pointer group">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-orange-500/20 group-hover:bg-orange-500/30 transition-colors">
                  <Zap className="w-6 h-6 text-orange-500" />
                </div>
                <CardTitle className="text-white">Autopilot Mode</CardTitle>
              </div>
              <CardDescription>
                Automatisch posts genereren en publiceren
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/client-portal/social-media?mode=autopilot">
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                  Activeer Autopilot
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tools & Features */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Platform Koppelingen</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Platform Connections */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <LinkIcon className="w-6 h-6 text-orange-500" />
                <CardTitle className="text-white">Platform Koppelingen</CardTitle>
              </div>
              <CardDescription>
                Koppel je social media accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/client-portal/social-media?tab=connections">
                <Button variant="outline" className="w-full border-orange-500/30 text-orange-500 hover:bg-orange-500/10">
                  Beheer Koppelingen
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Analytics */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-orange-500" />
                <CardTitle className="text-white">Analytics</CardTitle>
              </div>
              <CardDescription>
                Bekijk je social media statistieken
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full border-orange-500/30 text-orange-500 hover:bg-orange-500/10" disabled>
                Binnenkort Beschikbaar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Recente Posts</h2>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <p className="text-gray-400 text-center py-8">
              Geen recente posts
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
