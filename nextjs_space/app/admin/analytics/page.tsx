'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Activity,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Zap,
  Users,
  FileText,
  Loader2,
  Download,
  Calendar,
  BarChart3,
  PieChart,
} from 'lucide-react';
import Link from 'next/link';

interface AnalyticsData {
  overview: {
    totalApiCalls: number;
    totalTokens: number;
    totalCost: number;
    avgResponseTime: number;
  };
  trends: {
    date: string;
    apiCalls: number;
    tokens: number;
    cost: number;
  }[];
  byClient: {
    clientId: string;
    clientName: string;
    apiCalls: number;
    tokens: number;
    cost: number;
  }[];
  byModel: {
    model: string;
    apiCalls: number;
    tokens: number;
    cost: number;
  }[];
  contentStats: {
    totalContent: number;
    blogsGenerated: number;
    socialGenerated: number;
    videosGenerated: number;
  };
  performanceMetrics: {
    avgGenerationTime: number;
    successRate: number;
    errorRate: number;
  };
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/client-login');
    } else if (status === 'authenticated') {
      loadAnalytics();
    }
  }, [status, router, timeRange]);
  
  async function loadAnalytics() {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics?range=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        toast.error('Fout bij laden van analytics');
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast.error('Fout bij laden van analytics');
    } finally {
      setLoading(false);
    }
  }
  
  function exportAnalytics() {
    if (!analytics) return;
    
    const csvData = analytics.byClient.map(client => ({
      Klant: client.clientName,
      'API Calls': client.apiCalls,
      Tokens: client.tokens,
      'Kosten (€)': client.cost.toFixed(2),
    }));
    
    const headers = Object.keys(csvData[0]).join(',');
    const rows = csvData.map(row => Object.values(row).join(',')).join('\\n');
    const csv = `${headers}\\n${rows}`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    toast.success('Analytics geëxporteerd naar CSV');
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Geen analytics data beschikbaar</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8" />
            Analytics & Statistieken
          </h1>
          <p className="text-muted-foreground mt-1">
            Platform performance en gebruik inzichten
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Laatste 7 dagen</SelectItem>
              <SelectItem value="30d">Laatste 30 dagen</SelectItem>
              <SelectItem value="90d">Laatste 90 dagen</SelectItem>
              <SelectItem value="365d">Laatste jaar</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportAnalytics} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporteer
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/dashboard">Dashboard</Link>
          </Button>
        </div>
      </div>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4" />
              API Calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics.overview.totalApiCalls.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">Totaal aantal requests</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Tokens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{(analytics.overview.totalTokens / 1000000).toFixed(2)}M</p>
            <p className="text-xs text-muted-foreground mt-1">Totaal verbruikt</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Kosten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">€{analytics.overview.totalCost.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">Totale API kosten</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics.overview.avgResponseTime.toFixed(0)}ms</p>
            <p className="text-xs text-muted-foreground mt-1">Gemiddelde snelheid</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Content Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Content Statistieken
            </CardTitle>
            <CardDescription>Gegenereerde content per type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Totaal Content</span>
                <span className="text-2xl font-bold">{analytics.contentStats.totalContent}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Blogs</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ 
                          width: `${(analytics.contentStats.blogsGenerated / analytics.contentStats.totalContent) * 100}%` 
                        }}
                      />
                    </div>
                    <span className="font-medium w-12 text-right">{analytics.contentStats.blogsGenerated}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Social Posts</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ 
                          width: `${(analytics.contentStats.socialGenerated / analytics.contentStats.totalContent) * 100}%` 
                        }}
                      />
                    </div>
                    <span className="font-medium w-12 text-right">{analytics.contentStats.socialGenerated}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Videos</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full" 
                        style={{ 
                          width: `${(analytics.contentStats.videosGenerated / analytics.contentStats.totalContent) * 100}%` 
                        }}
                      />
                    </div>
                    <span className="font-medium w-12 text-right">{analytics.contentStats.videosGenerated}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
            <CardDescription>Kwaliteit en betrouwbaarheid</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Success Rate</span>
                  <span className="font-bold text-green-600">{analytics.performanceMetrics.successRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${analytics.performanceMetrics.successRate}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Error Rate</span>
                  <span className="font-bold text-red-600">{analytics.performanceMetrics.errorRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${analytics.performanceMetrics.errorRate}%` }}
                  />
                </div>
              </div>
              
              <div className="pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg Generation Time</span>
                  <span className="text-2xl font-bold">{(analytics.performanceMetrics.avgGenerationTime / 1000).toFixed(1)}s</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Top Clients by Usage */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top Klanten (Gebruik)
          </CardTitle>
          <CardDescription>Klanten gesorteerd op API gebruik</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.byClient.slice(0, 10).map((client, index) => (
              <div key={client.clientId} className="flex items-center gap-4">
                <span className="text-2xl font-bold text-muted-foreground w-8">#{index + 1}</span>
                <div className="flex-1">
                  <p className="font-medium">{client.clientName}</p>
                  <p className="text-sm text-muted-foreground">
                    {client.apiCalls} calls • {(client.tokens / 1000).toFixed(0)}K tokens
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">€{client.cost.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">kosten</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Model Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Model Gebruik
          </CardTitle>
          <CardDescription>Verdeling per AI model</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.byModel.map((model) => (
              <div key={model.model} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium">{model.model}</p>
                  <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full" 
                      style={{ 
                        width: `${(model.apiCalls / analytics.overview.totalApiCalls) * 100}%` 
                      }}
                    />
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="font-bold">{model.apiCalls}</p>
                  <p className="text-xs text-muted-foreground">€{model.cost.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
