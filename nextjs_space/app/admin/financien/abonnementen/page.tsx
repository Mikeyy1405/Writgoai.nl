'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Repeat, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AbonnementenPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user?.role !== 'admin') {
      router.push('/admin');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchSubscriptions();
    }
  }, [status, session]);

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch('/api/financien/abonnementen');
      if (!res.ok) throw new Error('Failed to fetch subscriptions');
      const data = await res.json();
      setSubscriptions(data.subscriptions || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast.error('Kon abonnementen niet laden');
    } finally {
      setLoading(false);
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels: { [key: string]: string } = {
      week: 'Wekelijks',
      month: 'Maandelijks',
      '2-months': 'Tweemaandelijks',
      quarter: 'Kwartaal',
      '4-months': 'Vier maanden',
      'half-year': 'Halfjaarlijks',
      year: 'Jaarlijks',
    };
    return labels[frequency] || frequency;
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
              <Repeat className="w-8 h-8 text-[#ff6b35]" />
              Abonnementen
            </h1>
            <p className="text-gray-400 mt-1">
              Beheer terugkerende abonnementen en MRR
            </p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Klant
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Frequentie
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Bedrag
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    MRR
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-white">{sub.contact?.company_name || 'Onbekend'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-300">{getFrequencyLabel(sub.frequency)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white font-semibold">
                        €{parseFloat(sub.total_price_incl_tax || '0').toFixed(2)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-green-400 font-semibold">
                        €{sub.mrr.toFixed(2)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs ${
                          sub.active
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {sub.active ? 'Actief' : 'Inactief'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {subscriptions.length === 0 && (
            <div className="p-12 text-center">
              <Repeat className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Geen abonnementen gevonden</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
