'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Palette, Bell, Lock, Users, Globe } from 'lucide-react';
import Link from 'next/link';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="h-8 w-8 text-[#FF9933]" />
          Admin Instellingen
        </h1>
        <p className="text-muted-foreground mt-1">
          Beheer systeem instellingen en configuratie
        </p>
      </div>

      {/* Settings Categories */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Branding Settings */}
        <Link href="/admin/branding">
          <Card className="hover:border-[#FF9933]/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Palette className="h-5 w-5 text-purple-500" />
                </div>
                <CardTitle className="text-lg">Branding</CardTitle>
              </div>
              <CardDescription>
                Logo's, kleuren en merkidentiteit voor white-label klanten
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        {/* Platform Settings */}
        <Link href="/admin/platforms">
          <Card className="hover:border-[#FF9933]/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Globe className="h-5 w-5 text-blue-500" />
                </div>
                <CardTitle className="text-lg">Platforms</CardTitle>
              </div>
              <CardDescription>
                Social media platforms en API integraties beheren
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        {/* User Management */}
        <Link href="/admin/klanten">
          <Card className="hover:border-[#FF9933]/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Users className="h-5 w-5 text-green-500" />
                </div>
                <CardTitle className="text-lg">Gebruikersbeheer</CardTitle>
              </div>
              <CardDescription>
                Klanten, rechten en toegangsbeheer
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Coming Soon Features */}
      <Card>
        <CardHeader>
          <CardTitle>Binnenkort Beschikbaar</CardTitle>
          <CardDescription>
            Deze instellingen worden momenteel ontwikkeld
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="p-1.5 bg-yellow-500/10 rounded">
                  <Bell className="h-4 w-4 text-yellow-500" />
                </div>
                <div>
                  <div className="font-medium text-gray-200">Notificaties</div>
                  <div className="text-xs text-gray-500">Email alerts, webhooks, en real-time notificaties</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="p-1.5 bg-red-500/10 rounded">
                  <Lock className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <div className="font-medium text-gray-200">Beveiliging</div>
                  <div className="text-xs text-gray-500">2FA, IP whitelist, en audit logs</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="p-1.5 bg-[#FF9933]/10 rounded">
                  <Settings className="h-4 w-4 text-[#FF9933]" />
                </div>
                <div>
                  <div className="font-medium text-gray-200">Systeem Configuratie</div>
                  <div className="text-xs text-gray-500">API limiten, cache instellingen, en performance tuning</div>
                </div>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
