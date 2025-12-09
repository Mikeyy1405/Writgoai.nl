'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown } from 'lucide-react';

interface TopClient {
  name: string;
  email: string;
  totalRevenue: number;
  invoiceCount: number;
}

interface TopClientsProps {
  clients: TopClient[];
}

export function TopClients({ clients }: TopClientsProps) {
  const maxRevenue = clients.length > 0 ? Math.max(...clients.map((c) => c.totalRevenue)) : 1;

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          🏆 Top 5 Klanten
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {clients.length === 0 ? (
            <div className="text-center text-zinc-500 py-8">
              Geen klantgegevens beschikbaar
            </div>
          ) : (
            clients.map((client, index) => {
              const percentage = (client.totalRevenue / maxRevenue) * 100;
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-lg font-bold text-zinc-500">
                        {index + 1}.
                      </span>
                      {index === 0 && <Crown className="w-4 h-4 text-yellow-400" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {client.name}
                        </p>
                        <p className="text-xs text-zinc-500 truncate">{client.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#FF6B35]">
                        €{client.totalRevenue.toLocaleString('nl-NL')}
                      </p>
                      <p className="text-xs text-zinc-500">{client.invoiceCount} facturen</p>
                    </div>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FF8555] rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
