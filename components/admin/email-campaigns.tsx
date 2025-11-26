'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Send } from 'lucide-react';

export default function EmailCampaigns() {
  return (
    <Card className="bg-zinc-900/50 border-zinc-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Send className="h-6 w-6 text-[#FF6B35]" />
          Email Campagnes
        </CardTitle>
        <CardDescription className="text-gray-400">
          Stel geautomatiseerde email reeksen in voor nieuwe klanten
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <Send className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Email Marketing Campagnes</h3>
          <p className="text-gray-400 mb-4">
            Email campaign management komt binnenkort beschikbaar.
          </p>
          <p className="text-sm text-gray-500">
            Hier kun je straks email campagnes instellen zoals:
          </p>
          <ul className="text-sm text-gray-500 mt-2 space-y-1">
            <li>• Onboarding reeks voor nieuwe klanten</li>
            <li>• Automatische tips & tricks emails</li>
            <li>• Speciale aanbiedingen en promoties</li>
            <li>• Re-engagement campagnes</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
