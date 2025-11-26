'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail } from 'lucide-react';

export default function SupportInbox() {
  return (
    <Card className="bg-zinc-900/50 border-zinc-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Mail className="h-6 w-6 text-[#FF6B35]" />
          Support Inbox (support@WritgoAI.nl)
        </CardTitle>
        <CardDescription className="text-gray-400">
          Bekijk en beheer support emails
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <Mail className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Support Email Integration</h3>
          <p className="text-gray-400 mb-4">
            Support inbox integration komt binnenkort beschikbaar.
          </p>
          <p className="text-sm text-gray-500">
            Hier kun je straks:
          </p>
          <ul className="text-sm text-gray-500 mt-2 space-y-1">
            <li>• Alle support@WritgoAI.nl emails bekijken</li>
            <li>• Direct reageren op support verzoeken</li>
            <li>• Support tickets categoriseren en prioriteren</li>
            <li>• Support emails automatisch koppelen aan klanten</li>
          </ul>
          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
            <p className="text-sm text-blue-300">
              💡 Tijdelijk: Check je support@WritgoAI.nl inbox direct in je email client.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
