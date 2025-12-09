'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ClientGrowthData {
  month: string;
  total: number;
  new: number;
}

interface ClientGrowthChartProps {
  data: ClientGrowthData[];
}

export function ClientGrowthChart({ data }: ClientGrowthChartProps) {
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          📈 Klanten Groei
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="month"
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181b',
                border: '1px solid #3f3f46',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Legend
              wrapperStyle={{ color: '#fff' }}
              formatter={(value) => {
                if (value === 'total') return 'Totaal';
                if (value === 'new') return 'Nieuw';
                return value;
              }}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              name="total"
            />
            <Line
              type="monotone"
              dataKey="new"
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#10b981', r: 4 }}
              name="new"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
