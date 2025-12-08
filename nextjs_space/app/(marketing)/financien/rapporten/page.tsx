'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileBarChart, ArrowLeft, Download } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RapportenPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('profit_loss');
  const [reportData, setReportData] = useState<any>(null);
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  const generateReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/financien/rapporten?type=${reportType}&startDate=${startDate}&endDate=${endDate}`
      );
      if (!res.ok) throw new Error('Failed to generate report');
      const data = await res.json();
      setReportData(data);
      toast.success('Rapport gegenereerd');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Kon rapport niet genereren');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-8">
        <div className="animate-pulse space-y-6 max-w-7xl mx-auto">
          <div className="h-12 bg-white/10 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/financien"
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <FileBarChart className="w-8 h-8 text-[#ff6b35]" />
              Financiële Rapporten
            </h1>
            <p className="text-gray-400 mt-1">
              Genereer winst & verlies, balans en cashflow rapporten
            </p>
          </div>
        </div>

        {/* Report Generator */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Rapport Genereren</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Rapport Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b35]"
              >
                <option value="profit_loss">Winst & Verlies</option>
                <option value="balance">Balans</option>
                <option value="cashflow">Cashflow</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">Startdatum</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b35]"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">Einddatum</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b35]"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={generateReport}
                disabled={loading}
                className="w-full px-4 py-2 bg-[#ff6b35] hover:bg-[#ff8555] text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Genereren...' : 'Genereer'}
              </button>
            </div>
          </div>
        </div>

        {/* Report Results */}
        {reportData && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">
                {reportData.type === 'profit_loss' && 'Winst & Verlies Rekening'}
                {reportData.type === 'balance' && 'Balans'}
                {reportData.type === 'cashflow' && 'Cashflow Overzicht'}
              </h2>
              <p className="text-gray-400">
                {new Date(reportData.period.start).toLocaleDateString('nl-NL')} -{' '}
                {new Date(reportData.period.end).toLocaleDateString('nl-NL')}
              </p>
            </div>

            {/* Profit & Loss */}
            {reportData.type === 'profit_loss' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/5 p-4 rounded-lg">
                    <p className="text-gray-400 text-sm mb-1">Totale Omzet</p>
                    <p className="text-2xl font-bold text-green-400">
                      €{reportData.data.revenue.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-lg">
                    <p className="text-gray-400 text-sm mb-1">Totale Kosten</p>
                    <p className="text-2xl font-bold text-red-400">
                      €{reportData.data.expenses.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-lg">
                    <p className="text-gray-400 text-sm mb-1">Nettowinst</p>
                    <p
                      className={`text-2xl font-bold ${
                        reportData.data.netProfit >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      €{reportData.data.netProfit.toFixed(2)}
                    </p>
                  </div>
                </div>

                {reportData.data.expensesByCategory.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Kosten per Categorie
                    </h3>
                    <div className="space-y-2">
                      {reportData.data.expensesByCategory.map((cat: any) => (
                        <div
                          key={cat.category}
                          className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                        >
                          <span className="text-white">{cat.category}</span>
                          <span className="text-red-400 font-semibold">
                            €{cat.amount.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Balance Sheet */}
            {reportData.type === 'balance' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Activa</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-gray-300">Vorderingen</span>
                      <span className="text-white font-semibold">
                        €{reportData.data.assets.receivables.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between p-3 bg-[#ff6b35]/10 rounded-lg border border-[#ff6b35]/30">
                      <span className="text-white font-semibold">Totaal Activa</span>
                      <span className="text-white font-bold">
                        €{reportData.data.assets.totalAssets.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Passiva & Eigen Vermogen
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-gray-300">Eigen Vermogen</span>
                      <span className="text-white font-semibold">
                        €{reportData.data.liabilities.equity.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between p-3 bg-[#ff6b35]/10 rounded-lg border border-[#ff6b35]/30">
                      <span className="text-white font-semibold">Totaal Passiva</span>
                      <span className="text-white font-bold">
                        €{reportData.data.liabilities.totalLiabilities.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cashflow */}
            {reportData.type === 'cashflow' && (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                          Maand
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                          Inkomsten
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                          Uitgaven
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                          Netto
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {reportData.data.months.map((month: any) => (
                        <tr key={month.month} className="hover:bg-white/5">
                          <td className="px-4 py-3 text-white">{month.month}</td>
                          <td className="px-4 py-3 text-green-400">
                            €{month.income.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-red-400">
                            €{month.outgoing.toFixed(2)}
                          </td>
                          <td
                            className={`px-4 py-3 font-semibold ${
                              month.net >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}
                          >
                            €{month.net.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {!reportData && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
            <FileBarChart className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">
              Selecteer een rapport type en klik op "Genereer" om te beginnen
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
