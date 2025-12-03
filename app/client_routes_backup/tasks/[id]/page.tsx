
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TaskUpdates } from '@/components/task-updates';
import { ArrowLeft, Clock, FileText, Calendar, Download, Loader2, Package } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  taskType: string;
  deadline: string;
  desiredWordCount: number;
  actualWordCount: number;
  briefing?: string;
  keyword?: string;
  pageUrl?: string;
  isSubscription: boolean;
  subscriptionType?: string;
  deliverables: Deliverable[];
  createdAt: string;
}

interface Deliverable {
  id: string;
  fileName: string;
  fileSize: number;
  createdAt: string;
  deliveryNotes?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  NOT_STARTED: { label: 'Nog te starten', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  ASSIGNED: { label: 'Toegewezen', color: 'bg-orange-100 text-blue-700 border-orange-200' },
  IN_PROGRESS: { label: 'In behandeling', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  REVIEW: { label: 'In review', color: 'bg-orange-100 text-purple-700 border-purple-200' },
  SHARED_WITH_CLIENT: { label: 'Klaar voor levering', color: 'bg-green-100 text-green-700 border-green-200' },
  COMPLETED: { label: 'Afgerond', color: 'bg-green-100 text-green-700 border-green-200' },
  PUBLISHED: { label: 'Gepubliceerd', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
};

export default function ClientTaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('clientToken');
    if (!token) {
      router.push('/client-login');
      return;
    }
    
    setAuthToken(token);
    loadTask(token);
  }, [taskId]);

  async function loadTask(token: string) {
    try {
      setLoading(true);
      const response = await fetch(`/api/client/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load task');
      }

      const data = await response.json();
      setTask(data.task);
    } catch (error) {
      console.error('Error loading task:', error);
      router.push('/client-portal');
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(deliverableId: string, fileName: string) {
    try {
      const token = localStorage.getItem('clientToken');
      const response = await fetch(`/api/client/deliverables/${deliverableId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-writgo-orange" />
      </div>
    );
  }

  if (!task) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/client-portal')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Terug naar overzicht
          </Button>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
                {task.isSubscription && (
                  <Badge className="bg-orange-100 text-purple-700 border-purple-200">
                    <Package className="w-3 h-3 mr-1" />
                    Abonnement
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={STATUS_CONFIG[task.status]?.color || 'bg-gray-100'}>
                  {STATUS_CONFIG[task.status]?.label || task.status}
                </Badge>
                <Badge variant="outline" className="bg-orange-50 text-blue-700 border-orange-200">
                  <FileText className="w-3 h-3 mr-1" />
                  {task.taskType}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Task Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Description */}
            <Card>
              <CardHeader>
                <CardTitle>Opdracht details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {task.description && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Beschrijving</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{task.description}</p>
                  </div>
                )}
                
                {task.briefing && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Briefing</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{task.briefing}</p>
                  </div>
                )}

                {task.keyword && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Zoekwoord</h4>
                    <p className="text-sm text-gray-600">{task.keyword}</p>
                  </div>
                )}

                {task.pageUrl && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Doel URL</h4>
                    <a 
                      href={task.pageUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-writgo-orange hover:underline"
                    >
                      {task.pageUrl}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Deliverables */}
            {task.deliverables && task.deliverables.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Geleverde bestanden</CardTitle>
                  <CardDescription>Download de voltooide content</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {task.deliverables.map(deliverable => (
                      <div
                        key={deliverable.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-writgo-orange" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm text-gray-900 truncate">
                              {deliverable.fileName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(deliverable.fileSize / 1024).toFixed(1)} KB • 
                              {format(new Date(deliverable.createdAt), ' d MMM yyyy', { locale: nl })}
                            </p>
                            {deliverable.deliveryNotes && (
                              <p className="text-xs text-gray-600 mt-1">{deliverable.deliveryNotes}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleDownload(deliverable.id, deliverable.fileName)}
                          className="ml-3 bg-blue-600 hover:bg-blue-700"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Updates Section */}
            <TaskUpdates 
              taskId={taskId} 
              isClientView={true}
              authToken={authToken || undefined}
            />
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Task Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Opdracht informatie</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">Deadline</span>
                  </div>
                  <p className="text-base font-semibold text-gray-900 ml-6">
                    {format(new Date(task.deadline), 'dd MMMM yyyy', { locale: nl })}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <FileText className="w-4 h-4" />
                    <span className="font-medium">Aantal woorden</span>
                  </div>
                  <p className="text-base font-semibold text-gray-900 ml-6">
                    {task.desiredWordCount || '-'}
                  </p>
                </div>

                {task.actualWordCount > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">Voortgang</span>
                    </div>
                    <p className="text-base font-semibold text-gray-900 ml-6">
                      {task.actualWordCount} / {task.desiredWordCount} woorden
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2 ml-6">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            (task.actualWordCount / task.desiredWordCount) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {task.isSubscription && task.subscriptionType && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <Package className="w-4 h-4" />
                      <span className="font-medium">Abonnement type</span>
                    </div>
                    <p className="text-base font-semibold text-gray-900 ml-6 capitalize">
                      {task.subscriptionType}
                    </p>
                  </div>
                )}

                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-500">
                    Aangemaakt op {format(new Date(task.createdAt), 'dd MMM yyyy', { locale: nl })}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Info Card for Subscriptions */}
            {task.isSubscription && (
              <Card className="bg-orange-50 border-purple-200">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2 text-purple-900">
                    <Package className="w-4 h-4" />
                    Doorlopend abonnement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-writgo-orange">
                    Dit is een doorlopende opdracht. U kunt updates en nieuwe verzoeken toevoegen door hieronder een update te plaatsen.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
