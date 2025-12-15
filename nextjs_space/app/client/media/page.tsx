/**
 * Video & Afbeelding Suite Overview
 * Main page for Media Suite
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, Image, Library, Zap, Film, Camera, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function MediaSuitePage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-orange-500/20 p-8">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-orange-500/20 border border-orange-500/30">
              <Video className="w-8 h-8 text-orange-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Video & Afbeelding Suite</h1>
              <p className="text-gray-400">Creëer professionele video's en afbeeldingen met AI</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <Video className="w-5 h-5 text-orange-500" />
                <span className="text-sm text-gray-400">Video's Gemaakt</span>
              </div>
              <p className="text-2xl font-bold text-white">0</p>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <Image className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-400">Afbeeldingen</span>
              </div>
              <p className="text-2xl font-bold text-white">0</p>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-gray-400">Views</span>
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
          {/* Video Generator */}
          <Card className="bg-gray-900 border-orange-500/20 hover:border-orange-500/40 transition-all cursor-pointer group">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-orange-500/20 group-hover:bg-orange-500/30 transition-colors">
                  <Video className="w-6 h-6 text-orange-500" />
                </div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-white">Video Generator</CardTitle>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-500">
                    Pro
                  </span>
                </div>
              </div>
              <CardDescription>
                Maak professionele video's met AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/client-portal/video">
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                  Start Video Maken
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Afbeelding Generator */}
          <Card className="bg-gray-900 border-orange-500/20 hover:border-orange-500/40 transition-all cursor-pointer group">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-orange-500/20 group-hover:bg-orange-500/30 transition-colors">
                  <Image className="w-6 h-6 text-orange-500" />
                </div>
                <CardTitle className="text-white">Afbeelding Generator</CardTitle>
              </div>
              <CardDescription>
                Genereer unieke afbeeldingen met AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/client-portal/image-specialist">
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                  Genereer Afbeelding
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
                Automatisch media genereren en publiceren
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/client-portal/video?mode=autopilot">
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
        <h2 className="text-xl font-bold text-white mb-4">Media Library</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Video Library */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Film className="w-6 h-6 text-orange-500" />
                <CardTitle className="text-white">Video Library</CardTitle>
              </div>
              <CardDescription>
                Beheer al je gegenereerde video's
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/client-portal/content-library?type=video">
                <Button variant="outline" className="w-full border-orange-500/30 text-orange-500 hover:bg-orange-500/10">
                  Bekijk Video's
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Image Library */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Camera className="w-6 h-6 text-orange-500" />
                <CardTitle className="text-white">Afbeelding Library</CardTitle>
              </div>
              <CardDescription>
                Beheer al je gegenereerde afbeeldingen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/client-portal/content-library?type=image">
                <Button variant="outline" className="w-full border-orange-500/30 text-orange-500 hover:bg-orange-500/10">
                  Bekijk Afbeeldingen
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Recente Media</h2>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <p className="text-gray-400 text-center py-8">
              Geen recente media
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
