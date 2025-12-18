'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Package, 
  CreditCard, 
  User, 
  HelpCircle,
  FileText,
  Download,
  Mail,
  MessageSquare,
  CheckCircle,
  Edit,
  Save,
  X,
  Crown,
  TrendingUp
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface Package {
  name: string;
  price: number;
  features: string[];
  badge?: string;
}

const PACKAGES: Record<string, Package> = {
  instapper: {
    name: 'INSTAPPER',
    price: 197,
    features: [
      '2 SEO artikelen/maand',
      '16 social media posts/maand',
      '4 faceless videos/maand',
      'Alle platforms die je verbindt',
      'Automatische posting',
    ],
  },
  starter: {
    name: 'STARTER',
    price: 297,
    features: [
      '1 Pillar + 2 Cluster artikelen/maand',
      '16 social media posts/maand',
      '4 faceless videos/maand',
      'Alle platforms die je verbindt',
      'Pillar-Cluster SEO strategie',
    ],
  },
  groei: {
    name: 'GROEI',
    price: 497,
    features: [
      '1 Pillar + 3 Cluster artikelen/maand',
      '24 social media posts/maand',
      '8 faceless videos/maand',
      'Alle platforms die je verbindt',
      'Premium SEO optimalisatie',
    ],
    badge: 'BESTSELLER',
  },
  dominant: {
    name: 'DOMINANT',
    price: 797,
    features: [
      '2 Pillar + 4 Cluster artikelen/maand',
      '40 social media posts/maand',
      '12 faceless videos/maand',
      'Alle platforms die je verbindt',
      'Maximale dominantie',
    ],
  },
};

export default function AccountPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const defaultTab = searchParams?.get('tab') || 'package';
  
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [currentPackage, setCurrentPackage] = useState('groei');
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    company: 'Jan\'s Kappersalon',
    website: 'www.janskappersalon.nl',
    industry: 'Kappers & Beauty',
    location: 'Rotterdam',
  });

  const handleSaveProfile = () => {
    toast.success('Profiel bijgewerkt');
    setEditingProfile(false);
  };

  const handleCancelEdit = () => {
    setEditingProfile(false);
  };

  const packageInfo = PACKAGES[currentPackage as keyof typeof PACKAGES];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <User className="w-8 h-8 text-orange-500" />
          <h1 className="text-3xl font-bold text-white">
            Account Instellingen
          </h1>
        </div>
        <p className="text-gray-400">
          Beheer je pakket, betalingen en bedrijfsprofiel
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-gray-800 p-1 border border-gray-700">
          <TabsTrigger 
            value="package" 
            className="data-[state=active]:bg-gray-900 data-[state=active]:text-orange-400 text-gray-400"
          >
            <Package className="w-4 h-4 mr-2" />
            Pakket
          </TabsTrigger>
          <TabsTrigger 
            value="billing" 
            className="data-[state=active]:bg-gray-900 data-[state=active]:text-orange-400 text-gray-400"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Betaling
          </TabsTrigger>
          <TabsTrigger 
            value="profile" 
            className="data-[state=active]:bg-gray-900 data-[state=active]:text-orange-400 text-gray-400"
          >
            <User className="w-4 h-4 mr-2" />
            Bedrijfsprofiel
          </TabsTrigger>
          <TabsTrigger 
            value="support" 
            className="data-[state=active]:bg-gray-900 data-[state=active]:text-orange-400 text-gray-400"
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            Support
          </TabsTrigger>
        </TabsList>

        {/* Package Tab */}
        <TabsContent value="package" className="space-y-6">
          {/* Current Package */}
          <Card className="border-orange-500/30 bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Crown className="w-5 h-5 text-orange-500" />
                Je huidige pakket
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-2xl font-bold text-white">
                      {packageInfo.name}
                    </h3>
                    {packageInfo.badge && (
                      <span className="px-2 py-1 text-xs font-bold bg-orange-500 text-white rounded">
                        {packageInfo.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-3xl font-bold text-orange-400 mb-4">
                    €{packageInfo.price}
                    <span className="text-sm text-gray-400 font-normal">/maand</span>
                  </p>
                </div>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Upgrade
                </Button>
              </div>

              <div className="space-y-2">
                {packageInfo.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-400 mb-2">
                  Volgende betaling: <span className="text-white font-semibold">1 januari 2026</span>
                </p>
                <p className="text-sm text-gray-400">
                  Status: <span className="text-green-400 font-semibold">Actief</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* All Packages */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(PACKAGES).map(([key, pkg]) => (
              <Card 
                key={key}
                className={`border ${
                  key === currentPackage 
                    ? 'border-orange-500 bg-gray-800' 
                    : 'border-gray-700 bg-gray-800/50'
                } hover:border-orange-500/50 transition-all`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">{pkg.name}</h3>
                    {pkg.badge && (
                      <span className="px-2 py-1 text-xs font-bold bg-orange-500 text-white rounded">
                        {pkg.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-orange-400 mb-4">
                    €{pkg.price}
                    <span className="text-sm text-gray-400 font-normal">/maand</span>
                  </p>
                  <div className="space-y-2 mb-4">
                    {pkg.features.slice(0, 3).map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                  {key !== currentPackage && (
                    <Button 
                      variant="outline" 
                      className="w-full border-gray-700 text-gray-300 hover:border-orange-500 hover:text-orange-400"
                    >
                      Selecteer pakket
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          <Card className="border-gray-700 bg-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Betalingsgegevens</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-700">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-8 h-8 text-orange-500" />
                  <div>
                    <p className="font-semibold text-white">•••• •••• •••• 4242</p>
                    <p className="text-sm text-gray-400">Verloopt 12/2026</p>
                  </div>
                </div>
                <Button variant="outline" className="border-gray-700 text-gray-300">
                  <Edit className="w-4 h-4 mr-2" />
                  Wijzig
                </Button>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-white mb-3">Factuurgeschiedenis</h3>
                {[
                  { date: '1 dec 2025', amount: 497, status: 'Betaald' },
                  { date: '1 nov 2025', amount: 497, status: 'Betaald' },
                  { date: '1 okt 2025', amount: 497, status: 'Betaald' },
                ].map((invoice, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-900 rounded-lg border border-gray-700"
                  >
                    <div>
                      <p className="font-medium text-white">{invoice.date}</p>
                      <p className="text-sm text-gray-400">€{invoice.amount}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-green-400 font-semibold">
                        {invoice.status}
                      </span>
                      <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="border-gray-700 bg-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Bedrijfsprofiel</CardTitle>
                {!editingProfile ? (
                  <Button
                    onClick={() => setEditingProfile(true)}
                    variant="outline"
                    className="border-gray-700 text-gray-300 hover:border-orange-500 hover:text-orange-400"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Bewerken
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveProfile}
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Opslaan
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                      className="border-gray-700 text-gray-300"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-gray-300">Bedrijfsnaam</Label>
                  <Input
                    id="company"
                    value={profileData.company}
                    onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                    disabled={!editingProfile}
                    className="bg-gray-900 border-gray-700 text-white disabled:opacity-70"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website" className="text-gray-300">Website</Label>
                  <Input
                    id="website"
                    value={profileData.website}
                    onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                    disabled={!editingProfile}
                    className="bg-gray-900 border-gray-700 text-white disabled:opacity-70"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry" className="text-gray-300">Branche</Label>
                  <Input
                    id="industry"
                    value={profileData.industry}
                    onChange={(e) => setProfileData({ ...profileData, industry: e.target.value })}
                    disabled={!editingProfile}
                    className="bg-gray-900 border-gray-700 text-white disabled:opacity-70"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-gray-300">Locatie</Label>
                  <Input
                    id="location"
                    value={profileData.location}
                    onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                    disabled={!editingProfile}
                    className="bg-gray-900 border-gray-700 text-white disabled:opacity-70"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Support Tab */}
        <TabsContent value="support" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-gray-700 bg-gray-800 hover:border-orange-500/50 transition-all cursor-pointer">
              <CardContent className="p-6">
                <Mail className="w-12 h-12 text-orange-500 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Email Support
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  Stuur ons een email en we reageren binnen 24 uur
                </p>
                <Button 
                  variant="outline"
                  className="w-full border-gray-700 text-gray-300 hover:border-orange-500 hover:text-orange-400"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email sturen
                </Button>
              </CardContent>
            </Card>

            <Card className="border-gray-700 bg-gray-800 hover:border-orange-500/50 transition-all cursor-pointer">
              <CardContent className="p-6">
                <MessageSquare className="w-12 h-12 text-orange-500 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Live Chat
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  Chat direct met ons support team
                </p>
                <Button 
                  variant="outline"
                  className="w-full border-gray-700 text-gray-300 hover:border-orange-500 hover:text-orange-400"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Start chat
                </Button>
              </CardContent>
            </Card>

            <Card className="border-gray-700 bg-gray-800">
              <CardContent className="p-6">
                <FileText className="w-12 h-12 text-orange-500 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Documentatie
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  Bekijk onze kennisbank en handleidingen
                </p>
                <Button 
                  variant="outline"
                  className="w-full border-gray-700 text-gray-300 hover:border-orange-500 hover:text-orange-400"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Naar docs
                </Button>
              </CardContent>
            </Card>

            <Card className="border-gray-700 bg-gray-800">
              <CardContent className="p-6">
                <HelpCircle className="w-12 h-12 text-orange-500 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  FAQ
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  Veelgestelde vragen en antwoorden
                </p>
                <Button 
                  variant="outline"
                  className="w-full border-gray-700 text-gray-300 hover:border-orange-500 hover:text-orange-400"
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Bekijk FAQ
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
