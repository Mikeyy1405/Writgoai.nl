'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface InvoiceStatusData {
  paid: number;
  open: number;
  overdue: number;
  draft: number;
}

interface InvoiceStatusChartProps {
  data: InvoiceStatusData;
}

export function InvoiceStatusChart({ data }: InvoiceStatusChartProps) {
  const chartData = [
    { name: 'Betaald', value: data.paid, color: '#10b981' },
    { name: 'Open', value: data.open, color: '#3b82f6' },
    { name: 'Te laat', value: data.overdue, color: '#ef4444' },
    { name: 'Concept', value: data.draft, color: '#6b7280' },
  ].filter((item) => item.value > 0);

  const total = data.paid + data.open + data.overdue + data.draft;

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          🧾 Factuur Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181b',
                border: '1px solid #3f3f46',
                borderRadius: '8px',
                color: '#fff',
              }}
              formatter={(value: number) => [
                `${value} (${total > 0 ? Math.round((value / total) * 100) : 0}%)`,
                '',
              ]}
            />
            <Legend
              wrapperStyle={{ color: '#fff' }}
              formatter={(value, entry: any) => {
                const percentage = total > 0 ? Math.round((entry.value / total) * 100) : 0;
                return `${value} (${percentage}%)`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
