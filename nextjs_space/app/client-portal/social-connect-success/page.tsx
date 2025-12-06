'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CheckCircle2,
  Instagram,
  Linkedin,
  Facebook,
  Twitter,
  Youtube,
  Loader2,
  type LucideIcon,
} from 'lucide-react';

// Redirect path constant
const SOCIAL_MEDIA_SUITE_PATH = '/client-portal/social-media-suite';

// Platform configuration
const PLATFORM_CONFIG: Record<string, { name: string; icon: LucideIcon; color: string }> = {
  instagram: { 
    name: 'Instagram', 
    icon: Instagram, 
    color: 'text-pink-500' 
  },
  facebook: { 
    name: 'Facebook', 
    icon: Facebook, 
    color: 'text-blue-600' 
  },
  linkedin: { 
    name: 'LinkedIn', 
    icon: Linkedin, 
    color: 'text-blue-700' 
  },
  twitter: { 
    name: 'Twitter', 
    icon: Twitter, 
    color: 'text-blue-400' 
  },
  x: { 
    name: 'X (Twitter)', 
    icon: Twitter, 
    color: 'text-gray-900 dark:text-white' 
  },
  youtube: { 
    name: 'YouTube', 
    icon: Youtube, 
    color: 'text-red-600' 
  },
  tiktok: { 
    name: 'TikTok', 
    icon: Instagram, // Using Instagram as fallback
    color: 'text-pink-600' 
  },
  threads: { 
    name: 'Threads', 
    icon: Instagram, 
    color: 'text-purple-600' 
  },
  pinterest: { 
    name: 'Pinterest', 
    icon: Instagram, 
    color: 'text-red-500' 
  },
  reddit: { 
    name: 'Reddit', 
    icon: Instagram, 
    color: 'text-orange-600' 
  },
  bluesky: { 
    name: 'Bluesky', 
    icon: Twitter, 
    color: 'text-blue-500' 
  },
};

export default function SocialConnectSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const platform = searchParams.get('platform') || 'social media';
  const [countdown, setCountdown] = useState(5);
  const [isPopup, setIsPopup] = useState(false);

  const platformConfig = PLATFORM_CONFIG[platform.toLowerCase()] || {
    name: platform,
    icon: CheckCircle2,
    color: 'text-orange-500'
  };

  const PlatformIcon = platformConfig.icon;

  useEffect(() => {
    // Check if this is a popup window
    const checkIfPopup = () => {
      try {
        return window.opener !== null && window.opener !== window;
      } catch {
        return false;
      }
    };
    const popupStatus = checkIfPopup();
    setIsPopup(popupStatus);
    
    // If this is a popup, send success message to parent window
    if (popupStatus && window.opener) {
      try {
        window.opener.postMessage({
          type: 'SOCIAL_CONNECT_SUCCESS',
          platform: platform || 'unknown',
          timestamp: Date.now()
        }, '*');
        console.log('[Social Connect Success] Sent success message to parent window');
      } catch (error) {
        console.error('[Social Connect Success] Failed to send message to parent:', error);
      }
    }
  }, [platform]);

  useEffect(() => {
    // Auto-redirect or close after 5 seconds
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (isPopup) {
            window.close();
          } else {
            router.push(SOCIAL_MEDIA_SUITE_PATH);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPopup, router]);

  const handleClose = () => {
    if (isPopup) {
      window.close();
    } else {
      router.push(SOCIAL_MEDIA_SUITE_PATH);
    }
  };

  const handleBackToSocialMedia = () => {
    router.push(SOCIAL_MEDIA_SUITE_PATH);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <Card className="w-full max-w-md border-orange-500/20 bg-gray-900/80 backdrop-blur-sm shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-xl animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-orange-500 to-orange-600 rounded-full p-6">
                <CheckCircle2 className="h-16 w-16 text-white" />
              </div>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-white">
            Verbinding Geslaagd! 🎉
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Platform Info */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <PlatformIcon className={`h-8 w-8 ${platformConfig.color}`} />
              <p className="text-xl font-semibold text-white">
                {platformConfig.name}
              </p>
            </div>
            <p className="text-gray-400 text-sm">
              is succesvol verbonden met WritgoAI
            </p>
          </div>

          {/* Next Steps */}
          <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <span className="text-orange-500">✓</span>
              Volgende stappen:
            </h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span>Je account is nu klaar om posts te ontvangen</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span>Ga naar de Social Media Suite om posts te maken</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span>Of stel een Autopilot in voor automatische posts</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleBackToSocialMedia}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold"
              size="lg"
            >
              Terug naar Social Media Suite
            </Button>
            
            {isPopup && (
              <Button
                onClick={handleClose}
                variant="outline"
                className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Venster Sluiten
              </Button>
            )}
          </div>

          {/* Auto-close countdown */}
          <div className="text-center text-sm text-gray-500">
            {countdown > 0 && (
              <p className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {isPopup ? 'Venster sluit' : 'Doorsturen'} automatisch in {countdown} seconden...
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
