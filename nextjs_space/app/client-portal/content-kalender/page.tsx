'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useProject } from '@/lib/contexts/ProjectContext';
import { Button } from '@/components/ui/button';
import { Calendar, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import ContentCalendarView from './components/ContentCalendarView';
import AIContentIdeas from './components/AIContentIdeas';
import PlanIdeaModal from './components/PlanIdeaModal';

export default function ContentKalenderPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { currentProject } = useProject();
  
  const [activeTab, setActiveTab] = useState<'calendar' | 'ideas'>('calendar');
  const [plannedItems, setPlannedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdea, setSelectedIdea] = useState<any>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/client-login');
    }
  }, [status, router]);

  useEffect(() => {
    if (currentProject?.id) {
      loadPlannedContent();
    }
  }, [currentProject?.id]);

  const loadPlannedContent = async () => {
    if (!currentProject?.id) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/client/content-plan?projectId=${currentProject.id}`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        setPlannedItems(data.items || []);
      } else {
        console.error('Failed to load planned content:', data.error);
      }
    } catch (error) {
      console.error('Error loading planned content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWriteNow = (idea: any) => {
    // Navigate to blog generator with idea
    const params = new URLSearchParams({
      topic: idea.title,
      focusKeyword: idea.focusKeyword,
      contentType: idea.contentType,
    });
    router.push(`/client-portal/blog-generator?${params.toString()}`);
  };

  const handlePlanIdea = (idea: any) => {
    setSelectedIdea(idea);
    setShowPlanModal(true);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">📅 Content Kalender</h1>
            <p className="text-zinc-400 mt-1">
              Plan en beheer je content met AI-gegenereerde ideeën
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <Button 
            variant={activeTab === 'calendar' ? 'default' : 'outline'}
            onClick={() => setActiveTab('calendar')}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Kalender
          </Button>
          <Button 
            variant={activeTab === 'ideas' ? 'default' : 'outline'}
            onClick={() => setActiveTab('ideas')}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI Ideeën
          </Button>
        </div>

        {/* Content */}
        {activeTab === 'calendar' ? (
          <ContentCalendarView 
            projectId={currentProject?.id || null}
            items={plannedItems}
            onRefresh={loadPlannedContent}
          />
        ) : (
          <AIContentIdeas 
            projectId={currentProject?.id || null}
            project={currentProject}
            onWriteNow={handleWriteNow}
            onPlanIdea={handlePlanIdea}
          />
        )}

        {/* Plan Modal */}
        <PlanIdeaModal
          open={showPlanModal}
          onClose={() => setShowPlanModal(false)}
          idea={selectedIdea}
          projectId={currentProject?.id || null}
          onSuccess={() => {
            setShowPlanModal(false);
            loadPlannedContent();
            toast.success('Content idee ingepland!');
          }}
        />
      </div>
    </div>
  );
}
