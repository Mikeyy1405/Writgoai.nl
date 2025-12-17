'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_TIMEOUTS } from '@/lib/api-timeout';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  FileText,
  Users,
  CreditCard,
  Calendar,
  Download,
  RefreshCcw,
  ArrowRight,
  Receipt,
  Repeat,
  ShoppingCart,
  Landmark,
  FileBarChart,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DashboardData {
  overview: {
    mrr: number;
    arr: number;
    activeSubscriptions: number;
    totalRevenue: number;
    outstandingInvoices: number;
    outstandingAmount: number;
    monthlyRevenue: number;
    monthlyExpenses: number;
    netProfit: number;
    lateInvoices: number;
  };
  recentInvoices: any[];
  recentExpenses: any[];
  alerts: any[];
}

export default function FinancienPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user?.role !== 'admin') {
      router.push('/admin');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchDashboardData();
    }
  }, [status, session]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUTS.MONEYBIRD_API);

      const res = await fetch('/api/financien/dashboard', {
        signal: controller.signal,
      }).catch((err) => {
        if (err.name === 'AbortError') {
          throw new Error('De Moneybird API reageert niet. Probeer het later opnieuw.');
        }
        throw err;
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        
        // Check for specific Moneybird configuration errors
        if (errorData.error?.includes('configuration') || 
            errorData.error?.includes('access token') ||
            errorData.error?.includes('administration')) {
          throw new Error('Moneybird is niet correct geconfigureerd. Controleer je API instellingen.');
        }
        
        throw new Error(errorData.error || `Server error: ${res.status}`);
      }

      const data = await res.json();
      setDashboardData(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching financial dashboard data:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Kon dashboard data niet laden';
      
      setError(errorMessage);
      toast.error(errorMessage);

      // Set empty fallback data so the page still renders
      setDashboardData({
        overview: {
          mrr: 0,
          arr: 0,
          activeSubscriptions: 0,
          totalRevenue: 0,
          outstandingInvoices: 0,
          outstandingAmount: 0,
          monthlyRevenue: 0,
          monthlyExpenses: 0,
          netProfit: 0,
          lateInvoices: 0,
        },
        recentInvoices: [],
        recentExpenses: [],
        alerts: [],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-8">
        <div className="animate-pulse space-y-6 max-w-7xl mx-auto">
          <div className="h-12 bg-slate-900/10 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-slate-900/10 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show error state with retry option
  if (error && !loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-slate-900/5 border border-red-500/30 rounded-xl p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Fout bij laden van financiële data
            </h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={fetchDashboardData}
                className="px-6 py-3 bg-[#ff6b35] hover:bg-[#ff8555] text-white rounded-lg flex items-center gap-2 mx-auto transition-colors"
              >
                <RefreshCcw className="w-4 h-4" />
                Opnieuw proberen
              </button>
              <p className="text-gray-500 text-sm">
                Controleer of Moneybird correct is geconfigureerd en probeer het opnieuw.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Geen data beschikbaar</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-[#ff6b35] hover:bg-[#ff8555] text-white rounded-lg"
          >
            Data laden
          </button>
        </div>
      </div>
    );
  }

  const { overview, recentInvoices, recentExpenses, alerts } = dashboardData;

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Warning banner if using fallback data */}
        {dashboardData && 
         dashboardData.overview.mrr === 0 && 
         dashboardData.overview.totalRevenue === 0 && 
         dashboardData.recentInvoices.length === 0 && (
          <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            <div className="flex-1">
              <p className="text-white font-medium">Waarschuwing: Geen financiële data beschikbaar</p>
              <p className="text-gray-400 text-sm">
                De verbinding met Moneybird kon niet worden gemaakt. Controleer je API configuratie.
              </p>
            </div>
            <button
              onClick={fetchDashboardData}
              className="px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded text-sm transition-colors"
            >
              Opnieuw proberen
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-[#ff6b35]" />
              Financieel Dashboard
            </h1>
            <p className="text-gray-400 mt-1">
              Compleet overzicht van je financiën via Moneybird
            </p>
          </div>

          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-slate-900/10 hover:bg-slate-900/20 text-white rounded-lg flex items-center gap-2 transition-colors"
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
                {alert.actionUrl && (
                  <Link
                    href={alert.actionUrl}
                    className="text-[#ff6b35] hover:text-[#ff8555] text-sm flex items-center gap-1"
                  >
                    Bekijk
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="MRR (Maandelijkse Recurring Revenue)"
            value={`€${overview.mrr.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`}
            subtitle={`${overview.activeSubscriptions} actieve abonnementen`}
            icon={<Repeat className="w-6 h-6" />}
            color="green"
          />

          <MetricCard
            title="ARR (Jaarlijkse Recurring Revenue)"
            value={`€${overview.arr.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`}
            subtitle="Geprojecteerde jaaromzet"
            icon={<TrendingUp className="w-6 h-6" />}
            color="blue"
          />

          <MetricCard
            title="Nettowinst (deze maand)"
            value={`€${overview.netProfit.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`}
            subtitle={`Omzet: €${overview.monthlyRevenue.toFixed(0)} - Kosten: €${overview.monthlyExpenses.toFixed(0)}`}
            icon={<TrendingUp className="w-6 h-6" />}
            color={overview.netProfit >= 0 ? 'green' : 'red'}
          />

          <MetricCard
            title="Openstaande Facturen"
            value={`€${overview.outstandingAmount.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`}
            subtitle={`${overview.outstandingInvoices} facturen${overview.lateInvoices > 0 ? ` (${overview.lateInvoices} te laat)` : ''}`}
            icon={<FileText className="w-6 h-6" />}
            color="orange"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <QuickActionCard
            href="/admin/financien/contacten"
            icon={<Users className="w-8 h-8 text-blue-400" />}
            title="Contacten"
            description="Beheer klanten en leveranciers"
          />

          <QuickActionCard
            href="/admin/financien/facturen"
            icon={<Receipt className="w-8 h-8 text-green-400" />}
            title="Verkoopfacturen"
            description="Maak en verstuur facturen"
          />

          <QuickActionCard
            href="/admin/financien/abonnementen"
            icon={<Repeat className="w-8 h-8 text-purple-400" />}
            title="Abonnementen"
            description="Beheer terugkerende omzet"
          />

          <QuickActionCard
            href="/admin/financien/uitgaven"
            icon={<ShoppingCart className="w-8 h-8 text-red-400" />}
            title="Uitgaven"
            description="Registreer en categoriseer kosten"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <QuickActionCard
            href="/admin/financien/bank"
            icon={<Landmark className="w-8 h-8 text-indigo-400" />}
            title="Banktransacties"
            description="Koppel transacties aan facturen"
          />

          <QuickActionCard
            href="/admin/financien/btw"
            icon={<Calendar className="w-8 h-8 text-yellow-400" />}
            title="BTW Overzicht"
            description="Bereken en dien BTW in"
          />

          <QuickActionCard
            href="/admin/financien/rapporten"
            icon={<FileBarChart className="w-8 h-8 text-pink-400" />}
            title="Rapporten"
            description="Winst & verlies, balans, cashflow"
          />
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Invoices */}
          <div className="bg-slate-900/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Recente Facturen</h2>
              <Link
                href="/admin/financien/facturen"
                className="text-sm text-[#ff6b35] hover:text-[#ff8555] flex items-center gap-1"
              >
                Bekijk alle
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {recentInvoices.length > 0 ? (
                recentInvoices.slice(0, 5).map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-3 bg-slate-900/5 rounded-lg"
                  >
                    <div>
                      <p className="text-white font-medium">{invoice.client.name}</p>
                      <p className="text-gray-400 text-sm">{invoice.invoiceNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">
                        €{invoice.total.toFixed(2)}
                      </p>
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
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">Geen recente facturen</p>
              )}
            </div>
          </div>

          {/* Recent Expenses */}
          <div className="bg-slate-900/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Recente Uitgaven</h2>
              <Link
                href="/admin/financien/uitgaven"
                className="text-sm text-[#ff6b35] hover:text-[#ff8555] flex items-center gap-1"
              >
                Bekijk alle
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {recentExpenses.length > 0 ? (
                recentExpenses.slice(0, 5).map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-3 bg-slate-900/5 rounded-lg"
                  >
                    <div>
                      <p className="text-white font-medium">{expense.supplierName}</p>
                      <p className="text-gray-400 text-sm">
                        {expense.category || 'Geen categorie'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">
                        €{expense.total.toFixed(2)}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {new Date(expense.invoiceDate).toLocaleDateString('nl-NL')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">Geen recente uitgaven</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'green' | 'blue' | 'orange' | 'red';
}

function MetricCard({ title, value, subtitle, icon, color }: MetricCardProps) {
  const colorClasses = {
    green: 'text-green-400',
    blue: 'text-blue-400',
    orange: 'text-orange-400',
    red: 'text-red-400',
  };

  return (
    <div className="bg-slate-900/5 border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={colorClasses[color]}>{icon}</div>
      </div>
      <p className="text-gray-400 text-sm mb-1">{title}</p>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      {subtitle && <p className="text-gray-500 text-xs">{subtitle}</p>}
    </div>
  );
}

interface QuickActionCardProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

function QuickActionCard({ href, icon, title, description }: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className="p-4 bg-slate-900/5 hover:bg-slate-900/10 border border-white/10 rounded-xl transition-colors group"
    >
      <div className="mb-2 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-white font-semibold mb-1">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </Link>
  );
}
