'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Star, Loader2, Send, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

interface Feedback {
  id: string;
  category: string;
  title: string;
  description: string;
  status: string;
  creditsAwarded: number;
  adminResponse?: string;
  rating?: number;
  createdAt: string;
}

export default function FeedbackPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [myFeedback, setMyFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/client-login');
    } else if (status === 'authenticated') {
      loadMyFeedback();
    }
  }, [status, router]);

  async function loadMyFeedback() {
    try {
      const response = await fetch('/api/client/feedback');
      if (response.ok) {
        const data = await response.json();
        setMyFeedback(data.feedback || []);
      }
    } catch (error) {
      console.error('Failed to load feedback:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!category || !title.trim() || !description.trim()) {
      toast.error('Vul alle velden in');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/client/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          title,
          description,
          rating: rating || undefined
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Feedback succesvol ingediend!');
        setCategory('');
        setTitle('');
        setDescription('');
        setRating(0);
        loadMyFeedback();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Fout bij indienen feedback');
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast.error('Fout bij indienen feedback');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-900">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Feedback Geven</h1>
          <p className="text-gray-400">
            Help ons WritgoAI te verbeteren. Ontvang 5 credits per feedback item! (max 2 per uur)
          </p>
        </div>

        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-[#FF6B35]" />
              Nieuwe Feedback
            </CardTitle>
            <CardDescription className="text-gray-400">
              Deel je ervaring, suggesties of bugs met ons
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-gray-300">Categorie *</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue placeholder="Kies een categorie" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="bug">🐛 Bug / Fout</SelectItem>
                    <SelectItem value="feature">💡 Feature Verzoek</SelectItem>
                    <SelectItem value="improvement">⚡ Verbetering</SelectItem>
                    <SelectItem value="compliment">❤️ Compliment</SelectItem>
                    <SelectItem value="other">📝 Anders</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className="text-gray-300">Titel *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Korte samenvatting..."
                  required
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-300">Beschrijving *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Beschrijf je feedback in detail..."
                  rows={6}
                  required
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Rating (optioneel)</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
                <p className="text-sm text-green-300">
                  🎁 <strong>Beloning:</strong> Je ontvangt 5 credits zodra je feedback is beoordeeld door ons team!
                </p>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#FF6B35] hover:bg-[#FF6B35]/90"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Feedback Indienen
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white">Mijn Feedback</CardTitle>
            <CardDescription className="text-gray-400">
              Bekijk je ingediende feedback en responses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {myFeedback.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Je hebt nog geen feedback ingediend
              </div>
            ) : (
              <div className="space-y-4">
                {myFeedback.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-zinc-900/50 border border-zinc-700 rounded-lg space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-white">{item.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Badge variant="outline" className="text-xs">
                            {item.category}
                          </Badge>
                          <span>•</span>
                          <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: nl })}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge
                          variant={item.status === 'completed' ? 'default' : 'outline'}
                          className={
                            item.status === 'completed'
                              ? 'bg-green-600'
                              : item.status === 'in_review'
                              ? 'bg-yellow-600'
                              : 'bg-gray-600'
                          }
                        >
                          {item.status === 'completed' ? 'Afgehandeld' : 
                           item.status === 'in_review' ? 'In behandeling' : 'Wachtend'}
                        </Badge>
                        {item.creditsAwarded > 0 && (
                          <Badge className="bg-green-600">
                            +{item.creditsAwarded} credits
                          </Badge>
                        )}
                      </div>
                    </div>

                    <p className="text-gray-300 text-sm whitespace-pre-wrap">{item.description}</p>

                    {item.rating && (
                      <div className="flex items-center gap-1 text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < item.rating! ? 'fill-current' : ''}`}
                          />
                        ))}
                      </div>
                    )}

                    {item.adminResponse && (
                      <div className="mt-3 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
                        <p className="text-sm font-semibold text-blue-300 mb-1">
                          Reactie van WritgoAI:
                        </p>
                        <p className="text-sm text-gray-300 whitespace-pre-wrap">
                          {item.adminResponse}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
