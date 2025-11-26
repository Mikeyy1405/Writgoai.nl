'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Network, Loader2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface TopicalMap {
  id: string;
  mainTopic: string;
  language: string;
  totalArticles: number;
  statistics: {
    totalTopics: number;
    completedTopics: number;
    completionPercentage: number;
    categoriesCount: number;
  };
}

interface TopicalMapImportProps {
  projectId: string;
  onImportComplete: () => void;
}

export default function TopicalMapImport({ projectId, onImportComplete }: TopicalMapImportProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [topicalMaps, setTopicalMaps] = useState<TopicalMap[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedMapId, setSelectedMapId] = useState<string>('');

  useEffect(() => {
    if (showDialog && projectId) {
      loadTopicalMaps();
    }
  }, [showDialog, projectId]);

  const loadTopicalMaps = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/client/topical-mapping?projectId=${projectId}`);
      
      if (response.ok) {
        const data = await response.json();
        setTopicalMaps(data.topicalMaps || []);
      }
    } catch (error) {
      console.error('Error loading topical maps:', error);
      toast.error('Fout bij laden topical maps');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedMapId) {
      toast.error('Selecteer een topical map');
      return;
    }

    setImporting(true);
    try {
      // Haal volledige map details op
      const response = await fetch(`/api/client/topical-mapping/${selectedMapId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch map details');
      }

      const data = await response.json();
      const topicalMap = data.topicalMap;

      // Converteer alle topics naar content ideas
      const contentIdeas: any[] = [];
      
      for (const category of topicalMap.categories) {
        for (const topic of category.topics) {
          // Skip already completed topics
          if (topic.isCompleted) continue;

          contentIdeas.push({
            title: topic.title,
            keywords: topic.keywords,
            type: topic.type === 'commercial' ? 'commercial' : 'informational',
            category: category.name,
            searchVolume: topic.searchVolume,
            difficulty: topic.difficulty,
            priority: topic.priority,
            topicalMapId: topicalMap.id,
            topicalTopicId: topic.id
          });
        }
      }

      // Importeer content ideas
      const importResponse = await fetch('/api/client/content-plan/add-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          ideas: contentIdeas,
          source: 'topical_map'
        })
      });

      if (importResponse.ok) {
        const result = await importResponse.json();
        toast.success(`${result.addedCount || contentIdeas.length} artikel ideeën geïmporteerd!`);
        setShowDialog(false);
        onImportComplete();
      } else {
        throw new Error('Failed to import ideas');
      }

    } catch (error) {
      console.error('Error importing topical map:', error);
      toast.error('Fout bij importeren topical map');
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        variant="outline"
        className="border-orange-500/30 text-orange-500 hover:bg-orange-500/10"
      >
        <Network className="h-4 w-4 mr-2" />
        Importeer uit Topical Map
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importeer uit Topical Authority Map</DialogTitle>
            <DialogDescription className="text-gray-400">
              Selecteer een topical map om alle nog niet voltooide artikel ideeën te importeren.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              </div>
            ) : topicalMaps.length === 0 ? (
              <Card className="bg-gray-800 border-gray-700 p-8 text-center">
                <Network className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">
                  Geen topical maps gevonden voor dit project.
                </p>
                <Button
                  onClick={() => {
                    setShowDialog(false);
                    window.location.href = '/client-portal/topical-mapping';
                  }}
                  className="mt-4 bg-gradient-to-r from-orange-500 to-pink-500"
                >
                  Maak een Topical Map
                </Button>
              </Card>
            ) : (
              <div className="space-y-3">
                {topicalMaps.map((map) => {
                  const uncompleted = map.statistics.totalTopics - map.statistics.completedTopics;
                  
                  return (
                    <Card
                      key={map.id}
                      className={`bg-gray-800 border-gray-700 p-4 cursor-pointer transition-all ${
                        selectedMapId === map.id
                          ? 'border-orange-500 bg-orange-500/10'
                          : 'hover:border-gray-600'
                      }`}
                      onClick={() => setSelectedMapId(map.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-bold text-white">
                              {map.mainTopic}
                            </h4>
                            {selectedMapId === map.id && (
                              <CheckCircle2 className="h-5 w-5 text-orange-500" />
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                            <span>{map.language}</span>
                            <span>{map.statistics.categoriesCount} categorieën</span>
                            <span>{map.statistics.totalTopics} topics</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-orange-500 to-pink-500 h-2 rounded-full"
                                style={{ width: `${map.statistics.completionPercentage}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-white">
                              {map.statistics.completionPercentage}%
                            </span>
                          </div>
                        </div>

                        <div className="ml-4 text-right">
                          <p className="text-2xl font-bold text-orange-500">
                            {uncompleted}
                          </p>
                          <p className="text-xs text-gray-400">
                            te importeren
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={() => setShowDialog(false)}
              variant="outline"
              className="border-gray-600 text-gray-300"
            >
              Annuleren
            </Button>
            <Button
              onClick={handleImport}
              disabled={!selectedMapId || importing}
              className="bg-gradient-to-r from-orange-500 to-pink-500"
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importeren...
                </>
              ) : (
                <>
                  <Network className="h-4 w-4 mr-2" />
                  Importeer Ideeën
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
