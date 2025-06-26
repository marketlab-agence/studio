'use client';

import React from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { ChartTooltipContent } from '@/components/ui/chart';

type ChartData = {
    name: string;
    score: number;
}

export function StatisticsChart({ data }: { data: ChartData[] }) {
    if (!data || data.length === 0) {
        return (
            <div className="flex h-[250px] w-full items-center justify-center rounded-md border border-dashed">
                <p className="text-sm text-muted-foreground">Aucune donnée de quiz disponible.</p>
            </div>
        )
    }

  return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart accessibilityLayer data={data}>
            <XAxis
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              interval={0}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                content={<ChartTooltipContent formatter={(value) => `${value}%`} nameKey="name" />}
            />
            <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
  );
}
