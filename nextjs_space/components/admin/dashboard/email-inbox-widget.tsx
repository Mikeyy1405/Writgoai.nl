'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export function EmailInboxWidget() {
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <span className="flex items-center gap-2">
            📧 Email Inbox
          </span>
          <Link href="/admin/emails">
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
              <ExternalLink className="w-4 h-4" />
            </Button>
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-[#FF6B35]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-[#FF6B35]" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Email Inbox Coming Soon
          </h3>
          <p className="text-sm text-zinc-400 mb-4">
            Binnenkort kun je hier al je emails beheren en beantwoorden vanuit het dashboard.
          </p>
          <Link href="/admin/emails">
            <Button className="bg-zinc-800 hover:bg-zinc-700 text-white">
              Ga naar Email Beheer
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
