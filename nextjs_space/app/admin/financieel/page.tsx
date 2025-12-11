'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, CreditCard, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function FinancieelDashboard() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <DollarSign className="h-8 w-8 text-green-500" />
          Financieel Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Overzicht van omzet, kosten en winst
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR (Monthly Recurring Revenue)</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€0</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+0%</span> t.o.v. vorige maand
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actieve Abonnementen</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              klanten met actief abonnement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kosten Deze Maand</CardTitle>
            <CreditCard className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€0</div>
            <p className="text-xs text-muted-foreground">
              API costs, hosting, etc.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Netto Winst</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€0</div>
            <p className="text-xs text-muted-foreground">
              omzet - kosten
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Coming Soon Notice */}
      <Card>
        <CardHeader>
          <CardTitle>Financiële Analytics - Binnenkort Beschikbaar</CardTitle>
          <CardDescription>
            Uitgebreide financiële rapportages en analyses worden momenteel ontwikkeld
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">Binnenkort beschikbaar:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Real-time MRR tracking en voorspellingen</li>
              <li>Gedetailleerde kostenanalyse per klant</li>
              <li>Winstmarges en ROI berekeningen</li>
              <li>BTW overzichten en belasting rapporten</li>
              <li>Cash flow projecties</li>
              <li>Exporteer functionaliteit voor boekhouding</li>
            </ul>
          </div>
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Tip:</strong> Bekijk de{' '}
              <a href="/admin/invoices" className="text-blue-500 hover:underline">
                Facturen pagina
              </a>{' '}
              voor een overzicht van alle facturatie.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
