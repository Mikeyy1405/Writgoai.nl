'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Euro, TrendingUp, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface MoneybirdData {
  overview: {
    mrr: number;
    arr: number;
    activeSubscriptions: number;
    outstandingInvoices: number;
    outstandingAmount: number;
    lateInvoices: number;
    lateAmount: number;
  };
  recentInvoices: Array<{
    id: string;
    invoiceNumber: string;
    clientName: string;
    total: number;
    status: string;
  }>;
}

export function MoneybirdWidget() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MoneybirdData | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/financien/dashboard');
      
      if (!response.ok) {
        throw new Error('Kon financiële data niet laden');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            💰 Financiën (Moneybird)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#FF6B35]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            💰 Financiën (Moneybird)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm text-zinc-400 mb-4">{error || 'Kon data niet laden'}</p>
            <Button
              onClick={fetchData}
              className="bg-[#FF6B35] hover:bg-[#FF8555]"
              size="sm"
            >
              Opnieuw proberen
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <span className="flex items-center gap-2">
            💰 Financiën (Moneybird)
          </span>
          <Link href="/admin/financien">
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
              <ExternalLink className="w-4 h-4" />
            </Button>
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-xs text-zinc-500">MRR</span>
              </div>
              <p className="text-lg font-bold text-white">
                €{data.overview.mrr.toLocaleString('nl-NL')}
              </p>
              <p className="text-xs text-zinc-600">
                ARR: €{data.overview.arr.toLocaleString('nl-NL')}
              </p>
            </div>

            <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
              <div className="flex items-center gap-2 mb-1">
                <Euro className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-zinc-500">Abonnementen</span>
              </div>
              <p className="text-lg font-bold text-white">
                {data.overview.activeSubscriptions}
              </p>
              <p className="text-xs text-zinc-600">actief</p>
            </div>
          </div>

          {/* Warnings */}
          {data.overview.lateInvoices > 0 && (
            <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/30">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <div className="flex-1">
                  <p className="text-sm text-white">
                    {data.overview.lateInvoices} te late facturen
                  </p>
                  <p className="text-xs text-red-300">
                    €{data.overview.lateAmount.toLocaleString('nl-NL')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Outstanding */}
          {data.overview.outstandingAmount > 0 && (
            <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-400" />
                <div className="flex-1">
                  <p className="text-sm text-white">
                    {data.overview.outstandingInvoices} openstaand
                  </p>
                  <p className="text-xs text-yellow-300">
                    €{data.overview.outstandingAmount.toLocaleString('nl-NL')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Recent invoices */}
          <div>
            <p className="text-xs text-zinc-500 mb-2">Recente facturen</p>
            <div className="space-y-2">
              {data.recentInvoices.slice(0, 3).map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-2 bg-zinc-950 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white truncate">{invoice.clientName}</p>
                    <p className="text-xs text-zinc-600">#{invoice.invoiceNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-white">
                      €{invoice.total.toLocaleString('nl-NL')}
                    </p>
                    <p className={`text-xs ${
                      invoice.status === 'paid' ? 'text-green-400' : 
                      invoice.status === 'late' ? 'text-red-400' : 
                      'text-yellow-400'
                    }`}>
                      {invoice.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link href="/admin/financien">
            <Button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white">
              Bekijk volledige financiën
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
