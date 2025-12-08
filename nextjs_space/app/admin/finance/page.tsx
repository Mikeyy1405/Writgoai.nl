'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  FileText,
  CreditCard,
  Calendar,
  Download,
  RefreshCcw,
  MessageSquare,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DashboardData {
  overview: {
    mrr: number;
    arr: number;
    activeSubscriptions: number;
    averageRevenuePerClient: number;
    outstandingInvoices: number;
    outstandingAmount: number;
    monthlyRevenue: number;
    monthlyExpenses: number;
    netProfit: number;
  };
  growth: {
    monthOverMonth: number;
    quarterOverQuarter: number;
    yearOverYear: number;
  };
  mrrBreakdown: Record<string, number>;
  recentInvoices: any[];
  recentExpenses: any[];
  alerts: any[];
}

export default function FinanceDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatResponse, setChatResponse] = useState<any>(null);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchDashboardData();
    }
  }, [status, session]);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/finance/dashboard');
      if (!res.ok) throw new Error('Failed to fetch dashboard data');
      const data = await res.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Kon dashboard data niet laden');
    } finally {
      setLoading(false);
    }
  };

  const handleAIChat = async () => {
    if (!chatMessage.trim()) return;

    setChatLoading(true);
    try {
      const res = await fetch('/api/finance/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: chatMessage }),
      });

      if (!res.ok) throw new Error('Failed to get AI response');
      const data = await res.json();
      setChatResponse(data.response);
      setChatMessage('');
    } catch (error) {
      console.error('Error with AI chat:', error);
      toast.error('Kon AI niet raadplegen');
    } finally {
      setChatLoading(false);
    }
  };

  const syncIncome = async () => {
    const toastId = toast.loading('Synchroniseren met Moneybird...');
    try {
      const res = await fetch('/api/finance/income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync' }),
      });

      if (!res.ok) throw new Error('Sync failed');
      const data = await res.json();
      toast.success(`${data.synced} facturen gesynchroniseerd`, { id: toastId });
      fetchDashboardData();
    } catch (error) {
      toast.error('Synchronisatie mislukt', { id: toastId });
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-white/10 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-white/10 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-8 flex items-center justify-center">
        <p className="text-gray-400">Geen data beschikbaar</p>
      </div>
    );
  }

  const { overview, growth, mrrBreakdown, recentInvoices, recentExpenses, alerts } = dashboardData;

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-[#ff6b35]" />
            Financieel Dashboard
          </h1>
          <p className="text-gray-400 mt-1">Realtime overzicht van je financiën</p>
        </div>

        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center gap-2 transition-colors"
        >
          <RefreshCcw className="w-4 h-4" />
          Ververs
        </button>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {alerts.slice(0, 3).map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border flex items-start gap-3 ${
                alert.severity === 'critical'
                  ? 'bg-red-500/10 border-red-500/30'
                  : alert.severity === 'warning'
                  ? 'bg-orange-500/10 border-orange-500/30'
                  : 'bg-blue-500/10 border-blue-500/30'
              }`}
            >
              <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-white font-medium">{alert.title}</p>
                <p className="text-gray-400 text-sm">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="MRR"
          value={`€${overview.mrr.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`}
          change={growth.monthOverMonth}
          icon={<DollarSign className="w-6 h-6" />}
          color="green"
        />

        <MetricCard
          title="ARR"
          value={`€${overview.arr.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`}
          change={growth.yearOverYear}
          icon={<TrendingUp className="w-6 h-6" />}
          color="blue"
        />

        <MetricCard
          title="Nettowinst (maand)"
          value={`€${overview.netProfit.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`}
          subtitle={`Omzet: €${overview.monthlyRevenue.toFixed(0)} - Kosten: €${overview.monthlyExpenses.toFixed(0)}`}
          icon={<TrendingUp className="w-6 h-6" />}
          color={overview.netProfit >= 0 ? 'green' : 'red'}
        />

        <MetricCard
          title="Openstaand"
          value={`€${overview.outstandingAmount.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`}
          subtitle={`${overview.outstandingInvoices} facturen`}
          icon={<FileText className="w-6 h-6" />}
          color="orange"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link
          href="/admin/finance/income"
          className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors group"
        >
          <FileText className="w-8 h-8 text-green-400 mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="text-white font-semibold">Omzet</h3>
          <p className="text-gray-400 text-sm">Facturen & inkomsten</p>
        </Link>

        <Link
          href="/admin/finance/expenses"
          className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors group"
        >
          <CreditCard className="w-8 h-8 text-red-400 mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="text-white font-semibold">Uitgaven</h3>
          <p className="text-gray-400 text-sm">Kosten & inkopen</p>
        </Link>

        <Link
          href="/admin/finance/btw"
          className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors group"
        >
          <Calendar className="w-8 h-8 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="text-white font-semibold">BTW</h3>
          <p className="text-gray-400 text-sm">Aangiftes & rapportage</p>
        </Link>

        <Link
          href="/admin/finance/reports"
          className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors group"
        >
          <Download className="w-8 h-8 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="text-white font-semibold">Rapporten</h3>
          <p className="text-gray-400 text-sm">Financiële overzichten</p>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Invoices */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Recente Facturen</h2>
            <button
              onClick={syncIncome}
              className="text-sm text-[#ff6b35] hover:text-[#ff8555] flex items-center gap-1"
            >
              <RefreshCcw className="w-4 h-4" />
              Sync
            </button>
          </div>
          <div className="space-y-3">
            {recentInvoices.slice(0, 5).map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white font-medium">{invoice.client.name}</p>
                  <p className="text-gray-400 text-sm">{invoice.invoiceNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">€{invoice.total.toFixed(2)}</p>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      invoice.status === 'paid'
                        ? 'bg-green-500/20 text-green-400'
                        : invoice.status === 'overdue'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {invoice.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Recente Uitgaven</h2>
          <div className="space-y-3">
            {recentExpenses.slice(0, 5).map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white font-medium">{expense.supplierName}</p>
                  <p className="text-gray-400 text-sm">{expense.category || 'Uncategorized'}</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">€{expense.total.toFixed(2)}</p>
                  <p className="text-gray-400 text-xs">
                    {new Date(expense.invoiceDate).toLocaleDateString('nl-NL')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Chat Assistant */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-[#ff6b35]" />
          AI Financieel Assistent
        </h2>

        {chatResponse && (
          <div className="mb-4 p-4 bg-[#ff6b35]/10 border border-[#ff6b35]/30 rounded-lg">
            <p className="text-white">{chatResponse.answer}</p>
            {chatResponse.suggestions && chatResponse.suggestions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {chatResponse.suggestions.map((suggestion: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setChatMessage(suggestion)}
                    className="text-xs px-3 py-1 bg-white/10 hover:bg-white/20 text-gray-300 rounded-full transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAIChat()}
            placeholder="Stel een financiële vraag..."
            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ff6b35]"
            disabled={chatLoading}
          />
          <button
            onClick={handleAIChat}
            disabled={chatLoading || !chatMessage.trim()}
            className="px-6 py-3 bg-[#ff6b35] hover:bg-[#ff8555] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {chatLoading ? 'Denken...' : 'Vraag'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  change?: number;
  icon: React.ReactNode;
  color: 'green' | 'blue' | 'orange' | 'red';
}

function MetricCard({ title, value, subtitle, change, icon, color }: MetricCardProps) {
  const colorClasses = {
    green: 'text-green-400',
    blue: 'text-blue-400',
    orange: 'text-orange-400',
    red: 'text-red-400',
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={colorClasses[color]}>{icon}</div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {change >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            <span className="text-sm font-medium">{Math.abs(change).toFixed(1)}%</span>
          </div>
        )}
      </div>
      <p className="text-gray-400 text-sm mb-1">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
    </div>
  );
}
