'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail } from 'lucide-react';

export default function EmailTemplates() {
  return (
    <Card className="bg-zinc-900/50 border-zinc-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Mail className="h-6 w-6 text-[#FF6B35]" />
          Email Templates
        </CardTitle>
        <CardDescription className="text-gray-400">
          Beheer email templates voor automatische berichten
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <Mail className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Email Templates</h3>
          <p className="text-gray-400 mb-4">
            Email template management komt binnenkort beschikbaar.
          </p>
          <p className="text-sm text-gray-500">
            Hier kun je straks email templates maken en bewerken voor:
          </p>
          <ul className="text-sm text-gray-500 mt-2 space-y-1">
            <li>• Welkomst emails voor nieuwe klanten</li>
            <li>• Credit notificaties</li>
            <li>• Abonnement updates</li>
            <li>• Gepersonaliseerde marketing emails</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
