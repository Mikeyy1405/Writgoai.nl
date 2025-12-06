'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Calendar, Clock, Loader2, Send } from 'lucide-react';
import { PLATFORM_CONFIG, renderMarkdown, PlatformId } from '@/lib/social-media-utils';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  platform: PlatformId;
  projectId: string;
  onScheduled?: () => void;
}

export default function ScheduleModal({
  isOpen,
  onClose,
  content,
  platform,
  projectId,
  onScheduled,
}: ScheduleModalProps) {
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('10:00');
  const [isScheduling, setIsScheduling] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const platformConfig = PLATFORM_CONFIG[platform];

  const handleSchedule = async () => {
    if (!scheduledDate) {
      toast.error('Selecteer een datum');
      return;
    }

    try {
      setIsScheduling(true);
      
      // Combineer datum en tijd
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);
      
      // Check of datum in het verleden is
      if (scheduledAt < new Date()) {
        toast.error('Datum moet in de toekomst liggen');
        return;
      }

      const response = await fetch('/api/client/social/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          platform,
          scheduledAt: scheduledAt.toISOString(),
          projectId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Fout bij inplannen');
      }

      toast.success('Post succesvol ingepland! 📅');
      onScheduled?.();
      onClose();
    } catch (error: any) {
      console.error('Error scheduling post:', error);
      toast.error(error.message || 'Kon post niet inplannen');
    } finally {
      setIsScheduling(false);
    }
  };

  const handlePublishNow = async () => {
    try {
      setIsPublishing(true);
      
      // Voor nu alleen een toast - later echte API integratie
      toast.info('🚀 Direct publiceren komt binnenkort beschikbaar!');
      
      // TODO: Implementeer echte API integratie met sociale media platforms
      // Dit vereist OAuth tokens per platform en platform-specifieke API calls
      
      onClose();
    } catch (error: any) {
      console.error('Error publishing post:', error);
      toast.error(error.message || 'Kon post niet publiceren');
    } finally {
      setIsPublishing(false);
    }
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Post Inplannen voor {platformConfig.name}
          </DialogTitle>
          <DialogDescription>
            Plan wanneer deze post gepubliceerd moet worden
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Platform Badge */}
          <div className="flex items-center gap-2">
            <span className="text-2xl">{platformConfig.emoji}</span>
            <div>
              <p className="font-medium">{platformConfig.name}</p>
              <p className="text-xs text-muted-foreground">
                Max. {platformConfig.maxLength.toLocaleString()} tekens
              </p>
            </div>
          </div>

          {/* Content Preview */}
          <div>
            <Label>Content Preview</Label>
            <div 
              className="mt-2 p-4 bg-gray-800/50 rounded-lg border border-gray-700 max-h-60 overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {content.length} / {platformConfig.maxLength.toLocaleString()} tekens
            </p>
          </div>

          {/* Datum en Tijd Selectie */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Datum</Label>
              <div className="relative mt-2">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="date"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={minDate}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="time">Tijd</Label>
              <div className="relative mt-2">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleSchedule}
              disabled={isScheduling || !scheduledDate}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
            >
              {isScheduling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Inplannen...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Inplannen
                </>
              )}
            </Button>
            <Button
              onClick={handlePublishNow}
              disabled={isPublishing}
              variant="outline"
              className="flex-1"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publiceren...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Nu Publiceren
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
