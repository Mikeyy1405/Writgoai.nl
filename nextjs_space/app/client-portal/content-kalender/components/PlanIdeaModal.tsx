'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface PlanIdeaModalProps {
  open: boolean;
  onClose: () => void;
  idea: any;
  projectId: string | null;
  onSuccess: () => void;
}

export default function PlanIdeaModal({ open, onClose, idea, projectId, onSuccess }: PlanIdeaModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!selectedDate) {
      toast.error('Selecteer een datum');
      return;
    }

    if (!projectId) {
      toast.error('Geen project geselecteerd');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/client/content-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          title: idea.title,
          focusKeyword: idea.focusKeyword,
          contentType: idea.contentType,
          description: idea.description,
          outline: idea.outline,
          scheduledFor: selectedDate.toISOString(),
          notes,
          status: 'planned',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to plan idea');
      }

      if (data.success) {
        toast.success('Content idee ingepland!');
        onSuccess();
      } else {
        throw new Error('Failed to save');
      }
    } catch (error: any) {
      console.error('Error planning idea:', error);
      toast.error('Kon content idee niet inplannen');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSelectedDate(undefined);
      setNotes('');
      onClose();
    }
  };

  if (!idea) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-orange-500" />
            Plan Content Idee
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Plan wanneer je dit content idee wilt schrijven
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Idea Info */}
          <div className="p-4 bg-zinc-800 rounded-lg border border-zinc-700">
            <h3 className="font-semibold text-white mb-2">{idea.title}</h3>
            <p className="text-sm text-zinc-400">{idea.description}</p>
            <div className="mt-2 text-sm">
              <span className="text-zinc-500">Focus Keyword: </span>
              <span className="text-orange-400">{idea.focusKeyword}</span>
            </div>
          </div>

          {/* Date Picker */}
          <div className="space-y-2">
            <Label className="text-zinc-300">Selecteer Datum</Label>
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                className="rounded-md border border-zinc-700 bg-zinc-800"
                locale={nl}
              />
            </div>
            {selectedDate && (
              <p className="text-sm text-center text-zinc-400">
                Geselecteerd: {format(selectedDate, 'EEEE d MMMM yyyy', { locale: nl })}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-zinc-300">
              Notities (optioneel)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Voeg eventuele notities toe over dit content idee..."
              className="bg-zinc-800 border-zinc-700 text-white min-h-[100px]"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleClose}
              variant="outline"
              disabled={loading}
              className="flex-1 border-zinc-700 hover:bg-zinc-800"
            >
              Annuleren
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || !selectedDate}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Opslaan...
                </>
              ) : (
                'Plan In'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
