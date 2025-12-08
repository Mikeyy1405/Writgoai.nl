'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download } from 'lucide-react';

export default function RapportenPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/inloggen');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'admin' && session?.user?.email !== 'info@writgo.nl') {
        router.push('/client-portal');
      } else {
        fetchReports();
      }
    }
  }, [status, session, router]);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/financien/rapporten');
      if (res.ok) {
        const json = await res.json();
        setReports(json);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF6B35]"></div>
      </div>
    );
  }

  const reportTypes = [
    { id: 'profit-loss', name: 'Winst & Verlies', description: 'Overzicht van inkomsten en uitgaven' },
    { id: 'balance-sheet', name: 'Balans', description: 'Activa en passiva overzicht' },
    { id: 'cash-flow', name: 'Cashflow', description: 'Kasstroomoverzicht' },
    { id: 'vat-report', name: 'BTW Rapport', description: 'BTW aangifte overzicht' },
    { id: 'revenue', name: 'Omzet Rapport', description: 'Omzet per periode' },
    { id: 'expenses', name: 'Uitgaven Rapport', description: 'Uitgaven per categorie' },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/financien" className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Rapporten</h1>
            <p className="text-zinc-400 mt-1">Financiële rapportages en analyses</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <p className="text-zinc-400 text-sm">Totale omzet</p>
            <p className="text-2xl font-bold mt-1">€{(reports?.totalRevenue || 0).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</p>
            <p className="text-green-400 text-xs mt-2">+12% t.o.v. vorige maand</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <p className="text-zinc-400 text-sm">Totale uitgaven</p>
            <p className="text-2xl font-bold mt-1">€{(reports?.totalExpenses || 0).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</p>
            <p className="text-red-400 text-xs mt-2">+5% t.o.v. vorige maand</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <p className="text-zinc-400 text-sm">Netto winst</p>
            <p className="text-2xl font-bold mt-1">€{((reports?.totalRevenue || 0) - (reports?.totalExpenses || 0)).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</p>
            <p className="text-green-400 text-xs mt-2">+18% t.o.v. vorige maand</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <p className="text-zinc-400 text-sm">Winstmarge</p>
            <p className="text-2xl font-bold mt-1">
              {reports?.totalRevenue > 0 ? (((reports.totalRevenue - reports.totalExpenses) / reports.totalRevenue) * 100).toFixed(1) : '0'}%
            </p>
            <p className="text-zinc-400 text-xs mt-2">van totale omzet</p>
          </div>
        </div>

        {/* Available Reports */}
        <h2 className="text-xl font-semibold mb-4">Beschikbare rapporten</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {reportTypes.map((report) => (
            <div key={report.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-[#FF6B35]/50 transition-colors">
              <h3 className="font-semibold text-lg mb-2">{report.name}</h3>
              <p className="text-zinc-400 text-sm mb-4">{report.description}</p>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#FF6B35] hover:bg-[#FF6B35]/80 rounded-lg transition-colors text-sm">
                <Download className="w-4 h-4" />
                Download PDF
              </button>
            </div>
          ))}
        </div>

        {/* Monthly Overview */}
        <h2 className="text-xl font-semibold mb-4">Maandelijks overzicht</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-800">
              <tr>
                <th className="text-left p-4 text-zinc-400 font-medium">Maand</th>
                <th className="text-right p-4 text-zinc-400 font-medium">Omzet</th>
                <th className="text-right p-4 text-zinc-400 font-medium">Uitgaven</th>
                <th className="text-right p-4 text-zinc-400 font-medium">Winst</th>
                <th className="text-right p-4 text-zinc-400 font-medium">Marge</th>
              </tr>
            </thead>
            <tbody>
              {reports?.monthlyData && reports.monthlyData.length > 0 ? (
                reports.monthlyData.map((month: any) => (
                  <tr key={month.period} className="border-t border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                    <td className="p-4">{month.period}</td>
                    <td className="p-4 text-right">€{(month.revenue || 0).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</td>
                    <td className="p-4 text-right">€{(month.expenses || 0).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</td>
                    <td className="p-4 text-right font-medium text-green-400">€{((month.revenue || 0) - (month.expenses || 0)).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</td>
                    <td className="p-4 text-right">
                      {month.revenue > 0 ? (((month.revenue - month.expenses) / month.revenue) * 100).toFixed(1) : '0'}%
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500">
                    Geen rapportage gegevens beschikbaar. Sync met Moneybird om gegevens op te halen.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
