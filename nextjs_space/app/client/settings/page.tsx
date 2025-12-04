/**
 * Settings Suite Overview
 * Main page for Settings
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, User, Key, CreditCard, Bell, Lock, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SettingsSuitePage() {
  const [activeTab, setActiveTab] = useState('account');

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-orange-500/20 p-8">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-orange-500/20 border border-orange-500/30">
              <Settings className="w-8 h-8 text-orange-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Instellingen</h1>
              <p className="text-gray-400">Beheer je account, API keys en facturatie</p>
            </div>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl" />
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-gray-900 border border-gray-800">
          <TabsTrigger value="account" className="flex items-center gap-2 data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-500">
            <User className="h-4 w-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2 data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-500">
            <Key className="h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2 data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-500">
            <CreditCard className="h-4 w-4" />
            Billing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Account Informatie</CardTitle>
              <CardDescription>
                Beheer je persoonlijke informatie en voorkeuren
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Naam</label>
                  <input 
                    type="text" 
                    placeholder="Je naam"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Email</label>
                  <input 
                    type="email" 
                    placeholder="je@email.com"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <Lock className="w-5 h-5 text-orange-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Wachtwoord</p>
                  <p className="text-xs text-gray-400">Laatst gewijzigd 30 dagen geleden</p>
                </div>
                <Button variant="outline" className="border-orange-500/30 text-orange-500 hover:bg-orange-500/10">
                  Wijzigen
                </Button>
              </div>

              <div className="flex items-center gap-2 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <Bell className="w-5 h-5 text-orange-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Notificaties</p>
                  <p className="text-xs text-gray-400">Beheer je email notificatie voorkeuren</p>
                </div>
                <Button variant="outline" className="border-orange-500/30 text-orange-500 hover:bg-orange-500/10">
                  Configureren
                </Button>
              </div>

              <div className="pt-4 flex justify-end">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  Opslaan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">API Keys</CardTitle>
              <CardDescription>
                Beheer je API sleutels voor externe integraties
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-white">OpenAI API Key</p>
                    <p className="text-xs text-gray-400">Voor AI content generatie</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-500">
                    Actief
                  </span>
                </div>
                <input 
                  type="password" 
                  value="sk-••••••••••••••••"
                  disabled
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                />
              </div>

              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-white">WordPress API Key</p>
                    <p className="text-xs text-gray-400">Voor WordPress integratie</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-500/20 text-gray-400">
                    Niet ingesteld
                  </span>
                </div>
                <Button variant="outline" className="border-orange-500/30 text-orange-500 hover:bg-orange-500/10">
                  Toevoegen
                </Button>
              </div>

              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-white">Social Media API Keys</p>
                    <p className="text-xs text-gray-400">Voor social media posting</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-500/20 text-gray-400">
                    Niet ingesteld
                  </span>
                </div>
                <Button variant="outline" className="border-orange-500/30 text-orange-500 hover:bg-orange-500/10">
                  Toevoegen
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Facturatie & Credits</CardTitle>
              <CardDescription>
                Beheer je abonnement en bekijk je verbruik
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Plan */}
              <div className="p-6 bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-lg border border-orange-500/30">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-400">Huidig Plan</p>
                    <h3 className="text-2xl font-bold text-white">Pro Plan</h3>
                  </div>
                  <Button variant="outline" className="border-orange-500/30 text-orange-500 hover:bg-orange-500/10">
                    Upgrade
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Credits Over</p>
                    <p className="text-xl font-bold text-white">1,000</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Vernieuwt op</p>
                    <p className="text-xl font-bold text-white">1 Jan 2025</p>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-white">Betaalmethode</h4>
                <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-orange-500" />
                      <div>
                        <p className="text-sm font-medium text-white">•••• •••• •••• 4242</p>
                        <p className="text-xs text-gray-400">Verloopt 12/2025</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="border-orange-500/30 text-orange-500 hover:bg-orange-500/10">
                      Wijzigen
                    </Button>
                  </div>
                </div>
              </div>

              {/* Invoice History */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-white">Factuur Geschiedenis</h4>
                <div className="p-8 text-center text-gray-400">
                  Geen facturen beschikbaar
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
