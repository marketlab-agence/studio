'use client';

import React from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';

type ChartData = {
    name: string;
    score: number;
}

const chartConfig = {
    score: {
      label: 'Score',
      color: 'hsl(var(--primary))',
    },
} satisfies ChartConfig;

export function StatisticsChart({ data }: { data: ChartData[] }) {
    if (!data || data.length === 0) {
        return (
            <div className="flex h-[250px] w-full items-center justify-center rounded-md border border-dashed">
                <p className="text-sm text-muted-foreground">Aucune donnée de quiz disponible.</p>
            </div>
        )
    }

  return (
    <ChartContainer config={chartConfig} className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart accessibilityLayer data={data}>
            <XAxis
              dataKey="name"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              interval={0}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                content={<ChartTooltipContent formatter={(value) => `${value}%`}/>}
            />
            <Bar dataKey="score" fill="var(--color-score)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
    </ChartContainer>
  );
}
