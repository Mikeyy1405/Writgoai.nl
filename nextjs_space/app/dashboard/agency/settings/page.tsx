'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, User, Bell, Shield, Key } from 'lucide-react';

export default function AgencySettingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Instellingen
          </h1>
          <p className="text-gray-400 text-lg">
            Beheer je account en voorkeuren
          </p>
        </div>

        <div className="grid gap-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/20 text-orange-500">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-white">Profiel</CardTitle>
                  <CardDescription>Beheer je persoonlijke informatie</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">Profiel instellingen zijn beschikbaar in je account.</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-500">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-white">Notificaties</CardTitle>
                  <CardDescription>Beheer je notificatie voorkeuren</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">Notificatie instellingen komen binnenkort beschikbaar.</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20 text-green-500">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-white">Beveiliging</CardTitle>
                  <CardDescription>Beveilig je account</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">Beveiligingsinstellingen zijn beschikbaar in je account.</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20 text-purple-500">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-white">API Keys</CardTitle>
                  <CardDescription>Beheer je API toegang</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">API key management komt binnenkort beschikbaar.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
