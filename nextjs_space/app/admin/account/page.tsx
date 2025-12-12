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
  ChevronRight,
  Mail,
  MessageSquare,
  CheckCircle,
  Edit,
  Save,
  X
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
  const [toneOfVoice, setToneOfVoice] = useState({
    style: 'Vriendelijk en professioneel',
    audience: 'Mannen 25-45 jaar',
    keywords: 'modern, stijlvol, Rotterdam',
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-700 mb-2">
          ⚙️ Account Instellingen
        </h1>
        <p className="text-gray-600">
          Beheer je pakket, betalingen en bedrijfsprofiel
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-gray-100 p-1">
          <TabsTrigger value="package" className="data-[state=active]:bg-white">
            <Package className="w-4 h-4 mr-2" />
            Pakket
          </TabsTrigger>
          <TabsTrigger value="billing" className="data-[state=active]:bg-white">
            <CreditCard className="w-4 h-4 mr-2" />
            Betaling
          </TabsTrigger>
          <TabsTrigger value="profile" className="data-[state=active]:bg-white">
            <User className="w-4 h-4 mr-2" />
            Bedrijfsprofiel
          </TabsTrigger>
          <TabsTrigger value="support" className="data-[state=active]:bg-white">
            <HelpCircle className="w-4 h-4 mr-2" />
            Support
          </TabsTrigger>
        </TabsList>

        {/* Package Tab */}
        <TabsContent value="package" className="space-y-6">
          {/* Current Package */}
          <Card>
            <CardHeader>
              <CardTitle>Huidig Pakket</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold text-gray-700">
                      📦 {packageInfo.name} PAKKET
                    </h3>
                    {packageInfo.badge && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-[#FF9933] to-[#FFAD33] text-white">
                        {packageInfo.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-3xl font-bold text-[#FF9933] mb-4">
                    €{packageInfo.price} <span className="text-lg text-gray-500 font-normal">per maand</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {packageInfo.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Volgende betaling:</span>
                  <span className="font-semibold text-gray-700">1 januari 2026</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button className="bg-gradient-to-r from-[#FF9933] to-[#FFAD33] hover:opacity-90">
                  Upgrade naar DOMINANT
                </Button>
                <Button variant="outline" className="border-gray-300">
                  Downgrade
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* All Packages */}
          <div>
            <h3 className="text-xl font-bold text-gray-700 mb-4">Andere Pakketten</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(PACKAGES).map(([key, pkg]) => (
                <Card key={key} className={`border-2 ${key === currentPackage ? 'border-[#FF9933]' : 'border-gray-200'} hover:border-[#FF9933] transition-colors`}>
                  <CardContent className="p-6">
                    <div className="text-center mb-4">
                      {pkg.badge && (
                        <span className="inline-block px-2 py-1 rounded-full text-xs font-bold bg-[#FF9933]/20 text-[#FF9933] mb-2">
                          {pkg.badge}
                        </span>
                      )}
                      <h4 className="font-bold text-lg text-gray-700 mb-2">{pkg.name}</h4>
                      <div className="text-2xl font-bold text-gray-700">
                        €{pkg.price}
                      </div>
                      <div className="text-xs text-gray-500">per maand</div>
                    </div>
                    <div className="space-y-2 text-sm">
                      {pkg.features.slice(0, 3).map((feature, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                          <span className="text-gray-600">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle>Betaalmethode</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                    iD
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">iDEAL via Moneybird</div>
                    <div className="text-sm text-gray-500">Laatst gebruikt: 1 december 2025</div>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="border-gray-300">
                  Wijzig
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Invoices */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Facturen</span>
                <Button variant="outline" size="sm" className="border-gray-300">
                  <Download className="w-4 h-4 mr-2" />
                  Download alle
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { date: 'Dec 2025', amount: 497, status: 'paid' },
                  { date: 'Nov 2025', amount: 497, status: 'paid' },
                  { date: 'Okt 2025', amount: 197, status: 'paid' },
                ].map((invoice, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-[#FF9933]/50 hover:bg-gray-50 transition-all">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-700">{invoice.date}</div>
                        <div className="text-sm text-gray-500">€{invoice.amount}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        ✅ Betaald
                      </span>
                      <Button variant="ghost" size="sm">
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
          {/* Company Profile */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Bedrijfsprofiel</CardTitle>
              {!editingProfile ? (
                <Button onClick={() => setEditingProfile(true)} variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Bewerk
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={handleSaveProfile} size="sm" className="bg-green-600 hover:bg-green-700">
                    <Save className="w-4 h-4 mr-2" />
                    Opslaan
                  </Button>
                  <Button onClick={handleCancelEdit} variant="outline" size="sm">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="company">Bedrijfsnaam</Label>
                <Input
                  id="company"
                  value={profileData.company}
                  onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                  disabled={!editingProfile}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={profileData.website}
                  onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                  disabled={!editingProfile}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="industry">Branche</Label>
                <Input
                  id="industry"
                  value={profileData.industry}
                  onChange={(e) => setProfileData({ ...profileData, industry: e.target.value })}
                  disabled={!editingProfile}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="location">Locatie</Label>
                <Input
                  id="location"
                  value={profileData.location}
                  onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                  disabled={!editingProfile}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tone of Voice */}
          <Card>
            <CardHeader>
              <CardTitle>Tone of Voice</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="style">Stijl</Label>
                <Input
                  id="style"
                  value={toneOfVoice.style}
                  onChange={(e) => setToneOfVoice({ ...toneOfVoice, style: e.target.value })}
                  disabled={!editingProfile}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="audience">Doelgroep</Label>
                <Input
                  id="audience"
                  value={toneOfVoice.audience}
                  onChange={(e) => setToneOfVoice({ ...toneOfVoice, audience: e.target.value })}
                  disabled={!editingProfile}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="keywords">Keywords</Label>
                <Textarea
                  id="keywords"
                  value={toneOfVoice.keywords}
                  onChange={(e) => setToneOfVoice({ ...toneOfVoice, keywords: e.target.value })}
                  disabled={!editingProfile}
                  className="mt-1"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Support Tab */}
        <TabsContent value="support" className="space-y-6">
          {/* Support Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-2 border-gray-200 hover:border-[#FF9933] transition-colors cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <HelpCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-700 mb-2">Veelgestelde vragen (FAQ)</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Vind snel antwoorden op veel gestelde vragen
                    </p>
                    <Button variant="link" className="p-0 h-auto text-[#FF9933]">
                      Bekijk FAQ <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200 hover:border-[#FF9933] transition-colors cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-700 mb-2">Email Support</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Stuur ons een email en we helpen je verder
                    </p>
                    <Button variant="link" className="p-0 h-auto text-[#FF9933]">
                      Email ons <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200 hover:border-[#FF9933] transition-colors cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-700 mb-2">WhatsApp Support</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Direct contact via WhatsApp
                    </p>
                    <Button variant="link" className="p-0 h-auto text-[#FF9933]">
                      Open WhatsApp <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200 hover:border-[#FF9933] transition-colors cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-700 mb-2">Tutorial Videos</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Bekijk instructievideo's
                    </p>
                    <Button variant="link" className="p-0 h-auto text-[#FF9933]">
                      Bekijk tutorials <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Account Management */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Account Beheer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start border-yellow-300 text-yellow-700 hover:bg-yellow-50">
                ⏸️ Pauzeer abonnement (max 3 maanden)
              </Button>
              <Button variant="outline" className="w-full justify-start border-red-300 text-red-700 hover:bg-red-50">
                ❌ Stop abonnement
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
