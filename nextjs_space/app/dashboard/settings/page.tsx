'use client';

import { useState } from 'react';
import { Settings as SettingsIcon, Globe, Share2, User, Key, Bell } from 'lucide-react';

type TabType = 'profile' | 'wordpress' | 'social' | 'notifications';

export default function ClientSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  const tabs = [
    { id: 'profile' as TabType, label: 'Profiel', icon: User },
    { id: 'wordpress' as TabType, label: 'WordPress', icon: Globe },
    { id: 'social' as TabType, label: 'Social Media', icon: Share2 },
    { id: 'notifications' as TabType, label: 'Notificaties', icon: Bell }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gray-800 rounded-lg">
            <SettingsIcon className="w-6 h-6 text-[#FF9933]" />
          </div>
          <h1 className="text-3xl font-bold text-white">Instellingen</h1>
        </div>
        <p className="text-gray-400">
          Beheer je account en integraties
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {/* Tab Headers */}
        <div className="border-b border-gray-800">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap
                    transition-colors border-b-2
                    ${isActive 
                      ? 'border-[#FF9933] text-[#FF9933] bg-[#FF9933]/5' 
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'profile' && <ProfileSettings />}
          {activeTab === 'wordpress' && <WordPressSettings />}
          {activeTab === 'social' && <SocialMediaSettings />}
          {activeTab === 'notifications' && <NotificationSettings />}
        </div>
      </div>
    </div>
  );
}

function ProfileSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Profiel Instellingen</h2>
        <p className="text-gray-400 text-sm mb-6">
          Beheer je persoonlijke informatie
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Naam
          </label>
          <input
            type="text"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FF9933] transition-colors"
            placeholder="Je naam"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email
          </label>
          <input
            type="email"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FF9933] transition-colors"
            placeholder="je@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nieuw Wachtwoord
          </label>
          <input
            type="password"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FF9933] transition-colors"
            placeholder="••••••••"
          />
        </div>

        <button className="px-6 py-3 bg-[#FF9933] hover:bg-[#FF8555] text-white rounded-lg font-medium transition-colors">
          Opslaan
        </button>
      </div>
    </div>
  );
}

function WordPressSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-4">WordPress Integratie</h2>
        <p className="text-gray-400 text-sm mb-6">
          Verbind je WordPress website om artikelen automatisch te publiceren
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            WordPress URL
          </label>
          <input
            type="url"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FF9933] transition-colors"
            placeholder="https://jouwwebsite.nl"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            WordPress Gebruikersnaam
          </label>
          <input
            type="text"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FF9933] transition-colors"
            placeholder="admin"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Application Password
          </label>
          <input
            type="password"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FF9933] transition-colors"
            placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
          />
          <p className="text-xs text-gray-500 mt-1">
            Maak een application password in WordPress → Users → Profile
          </p>
        </div>

        <div className="flex gap-3">
          <button className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors">
            Test Verbinding
          </button>
          <button className="px-6 py-3 bg-[#FF9933] hover:bg-[#FF8555] text-white rounded-lg font-medium transition-colors">
            Opslaan
          </button>
        </div>
      </div>
    </div>
  );
}

function SocialMediaSettings() {
  const platforms = [
    { name: 'Twitter / X', connected: false, icon: '𝕏' },
    { name: 'LinkedIn', connected: false, icon: '💼' },
    { name: 'Facebook', connected: false, icon: '👤' },
    { name: 'Instagram', connected: false, icon: '📷' },
    { name: 'TikTok', connected: false, icon: '🎵' },
    { name: 'YouTube', connected: false, icon: '▶️' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Social Media Accounts</h2>
        <p className="text-gray-400 text-sm mb-6">
          Verbind je social media accounts voor automatische publicatie (via Getlate.dev)
        </p>
      </div>

      <div className="space-y-3">
        {platforms.map((platform) => (
          <div
            key={platform.name}
            className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{platform.icon}</span>
              <div>
                <p className="font-medium text-white">{platform.name}</p>
                <p className="text-xs text-gray-500">
                  {platform.connected ? 'Verbonden' : 'Niet verbonden'}
                </p>
              </div>
            </div>
            <button
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                platform.connected
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-[#FF9933] hover:bg-[#FF8555] text-white'
              }`}
            >
              {platform.connected ? 'Verbreken' : 'Verbinden'}
            </button>
          </div>
        ))}
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <p className="text-sm text-blue-400">
          <strong>Let op:</strong> Social media integratie werkt via Getlate.dev. 
          Je hebt een Getlate.dev account nodig om social media accounts te verbinden.
        </p>
      </div>
    </div>
  );
}

function NotificationSettings() {
  const notifications = [
    { id: 'email_digest', label: 'Dagelijkse email samenvatting', enabled: true },
    { id: 'post_published', label: 'Notificatie bij gepubliceerde content', enabled: true },
    { id: 'post_failed', label: 'Notificatie bij mislukte publicatie', enabled: true },
    { id: 'weekly_report', label: 'Wekelijks rapport', enabled: false },
    { id: 'autopilot_updates', label: 'Autopilot status updates', enabled: true }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Notificatie Voorkeuren</h2>
        <p className="text-gray-400 text-sm mb-6">
          Beheer wanneer je notificaties ontvangt
        </p>
      </div>

      <div className="space-y-3">
        {notifications.map((notification) => (
          <label
            key={notification.id}
            className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-800/80 transition-colors"
          >
            <span className="font-medium text-white">{notification.label}</span>
            <input
              type="checkbox"
              defaultChecked={notification.enabled}
              className="w-5 h-5 rounded border-gray-600 text-[#FF9933] focus:ring-[#FF9933] focus:ring-offset-gray-900"
            />
          </label>
        ))}
      </div>

      <button className="px-6 py-3 bg-[#FF9933] hover:bg-[#FF8555] text-white rounded-lg font-medium transition-colors">
        Opslaan
      </button>
    </div>
  );
}
