/**
 * Website Content Suite Overview
 * Main page for Website Content Suite
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PenTool, Search, Map, Globe, Zap, TrendingUp, FileText, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function WebsiteSuitePage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-orange-500/20 p-8">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-orange-500/20 border border-orange-500/30">
              <Globe className="w-8 h-8 text-orange-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Website Content Suite</h1>
              <p className="text-gray-400">Beheer al je website content op één plek</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-orange-500" />
                <span className="text-sm text-gray-400">Totaal Blogs</span>
              </div>
              <p className="text-2xl font-bold text-white">0</p>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-400">SEO Score</span>
              </div>
              <p className="text-2xl font-bold text-white">0%</p>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-gray-400">Deze maand</span>
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
          {/* Blog Generator */}
          <Card className="bg-gray-900 border-orange-500/20 hover:border-orange-500/40 transition-all cursor-pointer group">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-orange-500/20 group-hover:bg-orange-500/30 transition-colors">
                  <PenTool className="w-6 h-6 text-orange-500" />
                </div>
                <CardTitle className="text-white">Blog Generator</CardTitle>
              </div>
              <CardDescription>
                Maak handmatig of met AI hoogwaardige blogs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/client-portal/blog-generator">
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                  Start Genereren
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* SEO & Zoekwoorden */}
          <Card className="bg-gray-900 border-orange-500/20 hover:border-orange-500/40 transition-all cursor-pointer group">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-orange-500/20 group-hover:bg-orange-500/30 transition-colors">
                  <Search className="w-6 h-6 text-orange-500" />
                </div>
                <CardTitle className="text-white">SEO & Zoekwoorden</CardTitle>
              </div>
              <CardDescription>
                Ontdek de beste zoekwoorden voor je niche
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/client-portal/zoekwoord-onderzoek">
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                  Start Onderzoek
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
                Laat AI automatisch blogs genereren en publiceren
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/client-portal/blog-generator?mode=autopilot">
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
        <h2 className="text-xl font-bold text-white mb-4">Tools & Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Topical Mapping */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Map className="w-6 h-6 text-orange-500" />
                <CardTitle className="text-white">Topical Mapping</CardTitle>
              </div>
              <CardDescription>
                Plan je content strategie met topical maps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/client-portal/site-planner">
                <Button variant="outline" className="w-full border-orange-500/30 text-orange-500 hover:bg-orange-500/10">
                  Open Site Planner
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* WordPress Sites */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Globe className="w-6 h-6 text-orange-500" />
                <CardTitle className="text-white">WordPress Sites</CardTitle>
              </div>
              <CardDescription>
                Beheer en publiceer naar je WordPress sites
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/content-hub">
                <Button variant="outline" className="w-full border-orange-500/30 text-orange-500 hover:bg-orange-500/10">
                  Beheer Sites
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Recente Activiteit</h2>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <p className="text-gray-400 text-center py-8">
              Geen recente activiteit
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
