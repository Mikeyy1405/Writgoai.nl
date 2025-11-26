
/**
 * Google Search Console Performance Trends
 * Toont performance geschiedenis en trends met grafieken
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { TrendingUp, Calendar, Loader2 } from 'lucide-react';

interface TrendData {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  averagePosition: number;
}

interface ProjectGSCTrendsProps {
  projectId: string;
}

export default function ProjectGSCTrends({ projectId }: ProjectGSCTrendsProps) {
  const [loading, setLoading] = useState(true);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadTrends();
  }, [projectId, period]);

  const loadTrends = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      startDate.setDate(endDate.getDate() - days);

      const response = await fetch(
        `/api/client/google-search-console/trends?projectId=${projectId}&startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`
      );

      if (!response.ok) {
        throw new Error('Fout bij laden trend data');
      }

      const data = await response.json();
      setTrends(data.trends || []);
    } catch (error: any) {
      console.error('Error loading GSC trends:', error);
      toast.error('Fout bij laden trend data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('nl-NL', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toFixed(0);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Trends
          </CardTitle>
          <CardDescription>Historische performance data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (trends.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Trends
          </CardTitle>
          <CardDescription>Historische performance data</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Nog geen trend data beschikbaar. Data wordt dagelijks verzameld.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Trends
            </CardTitle>
            <CardDescription>Historische performance data over tijd</CardDescription>
          </div>
          
          {/* Period selector */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={period === '7d' ? 'default' : 'outline'}
              onClick={() => setPeriod('7d')}
            >
              7 dagen
            </Button>
            <Button
              size="sm"
              variant={period === '30d' ? 'default' : 'outline'}
              onClick={() => setPeriod('30d')}
            >
              30 dagen
            </Button>
            <Button
              size="sm"
              variant={period === '90d' ? 'default' : 'outline'}
              onClick={() => setPeriod('90d')}
            >
              90 dagen
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {/* Clicks & Impressions Chart */}
          <div>
            <h4 className="text-sm font-medium mb-4">Clicks & Impressies</h4>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                  tickFormatter={formatNumber}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    color: '#f3f4f6'
                  }}
                  formatter={(value: number) => formatNumber(value)}
                  labelFormatter={formatDate}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="clicks"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                  name="Clicks"
                />
                <Area
                  type="monotone"
                  dataKey="impressions"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.3}
                  name="Impressies"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* CTR Chart */}
          <div>
            <h4 className="text-sm font-medium mb-4">Click-Through Rate (CTR)</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `${value.toFixed(1)}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    color: '#f3f4f6'
                  }}
                  formatter={(value: number) => `${value.toFixed(2)}%`}
                  labelFormatter={formatDate}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="ctr"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 3 }}
                  name="CTR"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Average Position Chart */}
          <div>
            <h4 className="text-sm font-medium mb-4">Gemiddelde Positie (lager = beter)</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                  reversed
                  domain={[1, 'dataMax + 5']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    color: '#f3f4f6'
                  }}
                  formatter={(value: number) => value.toFixed(1)}
                  labelFormatter={formatDate}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="averagePosition"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b', r: 3 }}
                  name="Positie"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
