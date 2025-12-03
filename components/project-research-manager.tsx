
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  Loader2, 
  Check,
  Clock,
  AlertCircle,
  RefreshCw,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface ProjectResearchManagerProps {
  projectId: string;
  projectName: string;
  type: 'keyword-research' | 'content-analysis' | 'content-strategy';
  data: any;
  onLoad?: (data: any) => void;
  autoSave?: boolean;
}

const TYPE_LABELS = {
  'keyword-research': 'Keyword Research',
  'content-analysis': 'Content Analyse',
  'content-strategy': 'Content Strategie',
};

const STATUS_LABELS = {
  not_started: 'Niet gestart',
  in_progress: 'Bezig',
  completed: 'Afgerond',
  needs_review: 'Review nodig',
};

const STATUS_COLORS = {
  not_started: 'bg-gray-500',
  in_progress: 'bg-blue-500',
  completed: 'bg-green-500',
  needs_review: 'bg-orange-500',
};

export default function ProjectResearchManager({
  projectId,
  projectName,
  type,
  data,
  onLoad,
  autoSave = false,
}: ProjectResearchManagerProps) {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savedData, setSavedData] = useState<any>(null);
  const [status, setStatus] = useState<string>('not_started');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const endpoint = `/api/client/projects/${projectId}/${type}`;

  // Load saved data on mount
  useEffect(() => {
    loadSavedData();
  }, [projectId, type]);

  // Auto-save when data changes
  useEffect(() => {
    if (autoSave && data && savedData) {
      const timer = setTimeout(() => {
        handleSave('in_progress');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [data, autoSave]);

  const loadSavedData = async () => {
    try {
      setLoading(true);
      const res = await fetch(endpoint);
      if (res.ok) {
        const result = await res.json();
        
        // Get the correct field based on type
        const field = type === 'keyword-research' 
          ? 'keywordResearch'
          : type === 'content-analysis'
          ? 'contentAnalysis'
          : 'contentStrategy';
        
        const statusField = `${field}Status`;
        const dateField = `${field}Date`;
        
        if (result[field]) {
          setSavedData(result[field]);
          setStatus(result[statusField] || 'not_started');
          setLastSaved(result[dateField] ? new Date(result[dateField]) : null);
          
          // Notify parent if callback is provided
          if (onLoad) {
            onLoad(result[field]);
          }
        }
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (newStatus?: string) => {
    if (!data) {
      toast.error('Geen data om op te slaan');
      return;
    }

    try {
      setSaving(true);
      
      const field = type === 'keyword-research' 
        ? 'keywordResearch'
        : type === 'content-analysis'
        ? 'contentAnalysis'
        : 'contentStrategy';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [field]: data,
          status: newStatus || status,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Er ging iets mis');
      }

      const result = await res.json();
      setSavedData(data);
      setLastSaved(new Date());
      if (newStatus) {
        setStatus(newStatus);
      }
      
      toast.success('Opgeslagen', {
        description: `${TYPE_LABELS[type]} is succesvol opgeslagen voor ${projectName}`,
      });
    } catch (error: any) {
      console.error('Error saving data:', error);
      toast.error('Fout bij opslaan', {
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    try {
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error('Fout bij bijwerken status');
      }

      setStatus(newStatus);
      toast.success('Status bijgewerkt');
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error.message);
    }
  };

  return (
    <Card className="p-4 mb-4 bg-[#0a0a0a] border-[#1a1a1a]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="text-orange-500" size={20} />
          <div>
            <h3 className="font-semibold text-white">
              {TYPE_LABELS[type]} - {projectName}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                className={`${STATUS_COLORS[status as keyof typeof STATUS_COLORS]} text-white text-xs`}
              >
                {STATUS_LABELS[status as keyof typeof STATUS_LABELS]}
              </Badge>
              {lastSaved && (
                <span className="text-xs text-gray-400">
                  Laatst opgeslagen: {format(lastSaved, 'dd MMM yyyy HH:mm', { locale: nl })}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {savedData && (
            <Button
              variant="outline"
              size="sm"
              onClick={loadSavedData}
              disabled={loading}
              className="border-gray-700 hover:bg-gray-800 text-white"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <RefreshCw size={16} />
              )}
              <span className="ml-2">Herladen</span>
            </Button>
          )}

          <select
            value={status}
            onChange={(e) => updateStatus(e.target.value)}
            className="px-3 py-1.5 rounded-md bg-gray-800 border border-gray-700 text-white text-sm"
          >
            <option value="not_started">Niet gestart</option>
            <option value="in_progress">Bezig</option>
            <option value="completed">Afgerond</option>
            <option value="needs_review">Review nodig</option>
          </select>

          <Button
            onClick={() => handleSave()}
            disabled={saving || !data}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {saving ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Save size={16} />
            )}
            <span className="ml-2">Opslaan</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}
