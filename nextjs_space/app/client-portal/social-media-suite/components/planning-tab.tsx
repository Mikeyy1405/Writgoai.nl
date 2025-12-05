'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Loader2,
  Calendar,
  Sparkles,
  Linkedin,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Music2,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PLATFORMS = [
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin },
  { id: 'facebook', name: 'Facebook', icon: Facebook },
  { id: 'instagram', name: 'Instagram', icon: Instagram },
  { id: 'twitter', name: 'X', icon: Twitter },
  { id: 'youtube', name: 'YouTube', icon: Youtube },
  { id: 'tiktok', name: 'TikTok', icon: Music2 },
];

interface CalendarPost {
  id: string;
  date: string;
  time: string;
  platform: string;
  content: string;
  status: 'scheduled' | 'published' | 'draft';
}

export default function PlanningTab() {
  const [loading, setLoading] = useState(false);
  const [numberOfDays, setNumberOfDays] = useState('7');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['linkedin', 'facebook']);
  const [calendarPosts, setCalendarPosts] = useState<CalendarPost[]>([]);

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId]
    );
  };

  const generateContentPlanning = async () => {
    if (selectedPlatforms.length === 0) {
      toast.error('Selecteer minimaal één platform');
      return;
    }

    try {
      setLoading(true);
      toast.loading('Content planning genereren...', { id: 'planning' });

      // Mock implementation - in production this would call an API
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const days = parseInt(numberOfDays);
      const mockPosts: CalendarPost[] = [];

      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);

        selectedPlatforms.forEach((platform) => {
          mockPosts.push({
            id: `${platform}-${i}`,
            date: date.toISOString().split('T')[0],
            time: '10:00',
            platform,
            content: `📅 Post ${i + 1} voor ${platform} - gegenereerd door AI`,
            status: 'scheduled',
          });
        });
      }

      setCalendarPosts(mockPosts);
      toast.success(`${mockPosts.length} posts gegenereerd voor ${days} dagen!`, {
        id: 'planning',
      });
    } catch (error) {
      console.error('Error generating planning:', error);
      toast.error('Fout bij genereren van planning', { id: 'planning' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Content Planning Genereren</CardTitle>
          <CardDescription>
            Laat AI automatisch een complete content planning voor je maken
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Settings */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="days">Aantal Dagen</Label>
                <Select value={numberOfDays} onValueChange={setNumberOfDays}>
                  <SelectTrigger id="days">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 dagen</SelectItem>
                    <SelectItem value="7">7 dagen (1 week)</SelectItem>
                    <SelectItem value="14">14 dagen (2 weken)</SelectItem>
                    <SelectItem value="30">30 dagen (1 maand)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Platform Selection */}
            <div className="space-y-2">
              <Label>Selecteer Platforms</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {PLATFORMS.map((platform) => {
                  const Icon = platform.icon;
                  const isSelected = selectedPlatforms.includes(platform.id);

                  return (
                    <Button
                      key={platform.id}
                      type="button"
                      variant={isSelected ? 'default' : 'outline'}
                      onClick={() => togglePlatform(platform.id)}
                      className="justify-start"
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {platform.name}
                    </Button>
                  );
                })}
              </div>
            </div>

            <Button
              onClick={generateContentPlanning}
              disabled={loading || selectedPlatforms.length === 0}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Planning Genereren...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Genereer Content Planning
                </>
              )}
            </Button>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex gap-3">
              <div className="text-blue-600 dark:text-blue-400">💡</div>
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-medium mb-1">Wat gebeurt er?</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>AI genereert relevante content voor elk geselecteerd platform</li>
                  <li>Posts worden automatisch verspreid over de gekozen periode</li>
                  <li>Optimale post tijden worden gebruikt per platform</li>
                  <li>Alle posts worden als draft opgeslagen</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar View */}
      {calendarPosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📅 Kalender Weergave</CardTitle>
            <CardDescription>Overzicht van geplande posts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {calendarPosts
                .reduce((acc, post) => {
                  const dateKey = post.date;
                  if (!acc[dateKey]) {
                    acc[dateKey] = [];
                  }
                  acc[dateKey].push(post);
                  return acc;
                }, {} as Record<string, CalendarPost[]>)
                .map(([date, posts]) => (
                  <div key={date} className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">
                      <Calendar className="h-4 w-4 inline mr-2" />
                      {new Date(date).toLocaleDateString('nl-NL', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                    </h3>
                    <div className="space-y-2">
                      {posts.map((post) => {
                        const platform = PLATFORMS.find((p) => p.id === post.platform);
                        const Icon = platform?.icon;

                        return (
                          <div
                            key={post.id}
                            className="flex items-center justify-between p-3 bg-muted rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              {Icon && <Icon className="h-5 w-5" />}
                              <div>
                                <p className="text-sm font-medium">{platform?.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {post.time} - {post.content.substring(0, 50)}...
                                </p>
                              </div>
                            </div>
                            <Badge variant="secondary">{post.status}</Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
