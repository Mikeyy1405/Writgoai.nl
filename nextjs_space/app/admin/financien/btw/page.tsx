'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BTWPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3));

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user?.role !== 'admin') {
      router.push('/admin');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchReports();
    }
  }, [status, session]);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/financien/btw');
      if (!res.ok) throw new Error('Failed to fetch VAT reports');
      const data = await res.json();
      setReports(data.reports || []);
    } catch (error) {
      console.error('Error fetching VAT reports:', error);
      toast.error('Kon BTW rapporten niet laden');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    const toastId = toast.loading('BTW rapport genereren...');
    try {
      const res = await fetch(
        `/api/financien/btw?year=${selectedYear}&quarter=${selectedQuarter}`
      );
      if (!res.ok) throw new Error('Failed to generate report');
      const data = await res.json();
      toast.success('Rapport gegenereerd', { id: toastId });
      fetchReports();
    } catch (error) {
      toast.error('Genereren mislukt', { id: toastId });
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-8">
        <div className="animate-pulse space-y-6 max-w-7xl mx-auto">
          <div className="h-12 bg-white/10 rounded w-1/3"></div>
          <div className="h-96 bg-white/10 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/admin/financien"
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Calendar className="w-8 h-8 text-[#ff6b35]" />
              BTW Overzicht
            </h1>
            <p className="text-gray-400 mt-1">
              Bereken en beheer BTW aangiftes per kwartaal
            </p>
          </div>
        </div>

        {/* BTW Calculator */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Nieuw BTW Rapport Genereren
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Jaar</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b35]"
              >
                {[0, 1, 2, 3, 4].map((offset) => {
                  const year = new Date().getFullYear() - offset;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">Kwartaal</label>
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b35]"
              >
                <option value="1">Q1 (Jan-Mrt)</option>
                <option value="2">Q2 (Apr-Jun)</option>
                <option value="3">Q3 (Jul-Sep)</option>
                <option value="4">Q4 (Okt-Dec)</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={generateReport}
                className="w-full px-4 py-2 bg-[#ff6b35] hover:bg-[#ff8555] text-white rounded-lg transition-colors"
              >
                Genereer Rapport
              </button>
            </div>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Periode
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Verkopen (excl. BTW)
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    BTW Verkopen
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Inkopen (excl. BTW)
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    BTW Inkopen
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Te betalen
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-white font-medium">
                        Q{report.quarter} {report.year}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {new Date(report.startDate).toLocaleDateString('nl-NL')} -{' '}
                        {new Date(report.endDate).toLocaleDateString('nl-NL')}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-300">
                        €{report.totalSalesExclVat.toFixed(2)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-green-400 font-semibold">
                        €{report.totalSalesVat.toFixed(2)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-300">
                        €{report.totalPurchasesExclVat.toFixed(2)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-red-400 font-semibold">
                        €{report.totalPurchasesVat.toFixed(2)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p
                        className={`font-bold ${
                          report.vatToPay >= 0 ? 'text-red-400' : 'text-green-400'
                        }`}
                      >
                        €{Math.abs(report.vatToPay).toFixed(2)}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {report.vatToPay >= 0 ? 'Te betalen' : 'Terug te ontvangen'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs ${
                          report.status === 'paid'
                            ? 'bg-green-500/20 text-green-400'
                            : report.status === 'submitted'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {report.status === 'paid'
                          ? 'Betaald'
                          : report.status === 'submitted'
                          ? 'Ingediend'
                          : 'Concept'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {reports.length === 0 && (
            <div className="p-12 text-center">
              <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Geen BTW rapporten gevonden</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
