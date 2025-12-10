'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Upload, Save, Loader2, Palette, Mail, Phone, MapPin, Linkedin, Twitter, Facebook, Instagram, Eye } from 'lucide-react';
import Image from 'next/image';

interface BrandSettings {
  companyName: string;
  tagline: string | null;
  logoUrl: string | null;
  logoLightUrl: string | null;
  logoDarkUrl: string | null;
  logoIconUrl: string | null;
  faviconUrl: string | null;
  favicon192Url: string | null;
  favicon512Url: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  defaultMetaTitle: string | null;
  defaultMetaDescription: string | null;
}

export default function BrandingPage() {
  const [settings, setSettings] = useState<BrandSettings>({
    companyName: 'Writgo Media',
    tagline: 'AI-First Omnipresence Content Agency',
    logoUrl: null,
    logoLightUrl: null,
    logoDarkUrl: null,
    logoIconUrl: null,
    faviconUrl: null,
    favicon192Url: null,
    favicon512Url: null,
    primaryColor: '#FF5722',
    secondaryColor: '#2196F3',
    accentColor: '#FF9800',
    email: null,
    phone: null,
    address: null,
    linkedinUrl: null,
    twitterUrl: null,
    facebookUrl: null,
    instagramUrl: null,
    defaultMetaTitle: null,
    defaultMetaDescription: null,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/branding');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        toast.error('Kon branding instellingen niet ophalen');
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast.error('Er is een fout opgetreden');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File, type: string) => {
    try {
      setUploadingFile(type);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch('/api/admin/branding/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      // Update the appropriate field based on type
      setSettings(prev => ({
        ...prev,
        [`${type}Url`]: data.url,
      }));

      toast.success('Bestand succesvol geüpload');
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Upload mislukt');
    } finally {
      setUploadingFile(null);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const response = await fetch('/api/admin/branding', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Save failed');
      }

      toast.success('Branding instellingen opgeslagen');
      
      // Reload the page to apply new branding
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Opslaan mislukt');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF6B35]" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Branding & Huisstijl</h1>
          <p className="text-gray-400 mt-1">Beheer logo's, kleuren en bedrijfsgegevens</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          size="lg"
          className="bg-[#FF6B35] hover:bg-[#FF6B35]/90"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Opslaan...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Opslaan
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Logo Upload */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Logo Upload</CardTitle>
              <CardDescription>Upload uw hoofdlogo (PNG met transparante achtergrond aanbevolen)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="logo" className="text-white">Hoofd Logo</Label>
                <div className="mt-2 flex items-center gap-4">
                  <label className="flex-1">
                    <div className="border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center cursor-pointer hover:border-[#FF6B35] transition-colors">
                      {uploadingFile === 'logo' ? (
                        <Loader2 className="w-8 h-8 mx-auto animate-spin text-[#FF6B35]" />
                      ) : settings.logoUrl ? (
                        <div className="relative w-full h-24">
                          <Image src={settings.logoUrl} alt="Logo" fill className="object-contain" />
                        </div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-400">Klik om te uploaden</p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'logo');
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="logoLight" className="text-white">Logo voor Donkere Achtergrond</Label>
                  <label className="block mt-2">
                    <div className="border border-zinc-700 rounded-lg p-4 text-center cursor-pointer hover:border-[#FF6B35] transition-colors bg-zinc-800">
                      {uploadingFile === 'logoLight' ? (
                        <Loader2 className="w-6 h-6 mx-auto animate-spin text-[#FF6B35]" />
                      ) : settings.logoLightUrl ? (
                        <div className="relative w-full h-16">
                          <Image src={settings.logoLightUrl} alt="Light Logo" fill className="object-contain" />
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">Optioneel</p>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'logoLight');
                      }}
                    />
                  </label>
                </div>

                <div>
                  <Label htmlFor="logoDark" className="text-white">Logo voor Lichte Achtergrond</Label>
                  <label className="block mt-2">
                    <div className="border border-zinc-700 rounded-lg p-4 text-center cursor-pointer hover:border-[#FF6B35] transition-colors bg-white">
                      {uploadingFile === 'logoDark' ? (
                        <Loader2 className="w-6 h-6 mx-auto animate-spin text-[#FF6B35]" />
                      ) : settings.logoDarkUrl ? (
                        <div className="relative w-full h-16">
                          <Image src={settings.logoDarkUrl} alt="Dark Logo" fill className="object-contain" />
                        </div>
                      ) : (
                        <p className="text-xs text-gray-600">Optioneel</p>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'logoDark');
                      }}
                    />
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Colors */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Kleuren
              </CardTitle>
              <CardDescription>Kies de primaire kleuren voor uw huisstijl</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="primaryColor" className="text-white">Primary Color</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="color"
                      id="primaryColor"
                      value={settings.primaryColor}
                      onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                      className="w-12 h-12 rounded border-zinc-700"
                    />
                    <Input
                      value={settings.primaryColor}
                      onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                      className="flex-1 bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="secondaryColor" className="text-white">Secondary Color</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="color"
                      id="secondaryColor"
                      value={settings.secondaryColor}
                      onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                      className="w-12 h-12 rounded border-zinc-700"
                    />
                    <Input
                      value={settings.secondaryColor}
                      onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                      className="flex-1 bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="accentColor" className="text-white">Accent Color</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="color"
                      id="accentColor"
                      value={settings.accentColor || '#FF9933'}
                      onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                      className="w-12 h-12 rounded border-zinc-700"
                    />
                    <Input
                      value={settings.accentColor || '#FF9933'}
                      onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                      className="flex-1 bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Company Info */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Bedrijfsgegevens</CardTitle>
              <CardDescription>Basis informatie over uw bedrijf</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="companyName" className="text-white">Bedrijfsnaam *</Label>
                <Input
                  id="companyName"
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="tagline" className="text-white">Tagline</Label>
                <Input
                  id="tagline"
                  value={settings.tagline || ''}
                  onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                  placeholder="Bijv: Content die scoort"
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email" className="text-white flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email || ''}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    placeholder="info@example.com"
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-white flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Telefoon
                  </Label>
                  <Input
                    id="phone"
                    value={settings.phone || ''}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    placeholder="+31 6 12345678"
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address" className="text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Adres
                </Label>
                <Textarea
                  id="address"
                  value={settings.address || ''}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  placeholder="Straat 123, 1234 AB Amsterdam"
                  className="bg-zinc-800 border-zinc-700 text-white"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Social Media */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Social Media</CardTitle>
              <CardDescription>Uw social media profielen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="linkedinUrl" className="text-white flex items-center gap-2">
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                </Label>
                <Input
                  id="linkedinUrl"
                  value={settings.linkedinUrl || ''}
                  onChange={(e) => setSettings({ ...settings, linkedinUrl: e.target.value })}
                  placeholder="https://linkedin.com/company/..."
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              <div>
                <Label htmlFor="twitterUrl" className="text-white flex items-center gap-2">
                  <Twitter className="w-4 h-4" />
                  Twitter / X
                </Label>
                <Input
                  id="twitterUrl"
                  value={settings.twitterUrl || ''}
                  onChange={(e) => setSettings({ ...settings, twitterUrl: e.target.value })}
                  placeholder="https://twitter.com/..."
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="facebookUrl" className="text-white flex items-center gap-2">
                    <Facebook className="w-4 h-4" />
                    Facebook
                  </Label>
                  <Input
                    id="facebookUrl"
                    value={settings.facebookUrl || ''}
                    onChange={(e) => setSettings({ ...settings, facebookUrl: e.target.value })}
                    placeholder="https://facebook.com/..."
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="instagramUrl" className="text-white flex items-center gap-2">
                    <Instagram className="w-4 h-4" />
                    Instagram
                  </Label>
                  <Input
                    id="instagramUrl"
                    value={settings.instagramUrl || ''}
                    onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
                    placeholder="https://instagram.com/..."
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-1">
          <Card className="bg-zinc-900 border-zinc-800 sticky top-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Live Preview
              </CardTitle>
              <CardDescription>Bekijk hoe het eruitziet</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Header Preview */}
              <div className="border border-zinc-800 rounded-lg p-4 bg-black">
                <p className="text-xs text-gray-400 mb-2">Header Preview</p>
                <div className="flex items-center gap-3">
                  {settings.logoUrl ? (
                    <div className="relative w-32 h-10">
                      <Image src={settings.logoUrl} alt="Logo Preview" fill className="object-contain object-left" />
                    </div>
                  ) : (
                    <span className="font-bold text-white">
                      {settings.companyName.slice(0, -2)}
                      <span style={{ color: settings.primaryColor }}>{settings.companyName.slice(-2)}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Colors Preview */}
              <div className="border border-zinc-800 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-3">Color Palette</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded border border-zinc-700"
                      style={{ backgroundColor: settings.primaryColor }}
                    />
                    <span className="text-xs text-white">Primary</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded border border-zinc-700"
                      style={{ backgroundColor: settings.secondaryColor }}
                    />
                    <span className="text-xs text-white">Secondary</span>
                  </div>
                  {settings.accentColor && (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded border border-zinc-700"
                        style={{ backgroundColor: settings.accentColor }}
                      />
                      <span className="text-xs text-white">Accent</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Button Preview */}
              <div className="border border-zinc-800 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-3">Button Preview</p>
                <button
                  className="w-full px-4 py-2 rounded-lg text-white font-medium transition-opacity hover:opacity-90"
                  style={{ backgroundColor: settings.primaryColor }}
                >
                  Call to Action
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
