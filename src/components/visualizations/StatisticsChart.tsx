'use client';

import React from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { ChartTooltipContent } from '@/components/ui/chart';
import type { ComponentConfig } from '@/lib/schemas/component-config';

type ChartData = {
    name: string;
    commits: number;
}

export function StatisticsChart({ data, config }: { data?: ChartData[]; config?: ComponentConfig }) {
    // ⚠️ La donnée vient de `config.data.entries` (IA ou créateur) ; le repli sur la prop préserve l'existant.
    const donnees = (config?.data as { entries?: ChartData[] } | undefined)?.entries ?? data;
    if (!donnees || donnees.length === 0) {
        return (
            <div className="flex h-[250px] w-full items-center justify-center rounded-md border border-dashed">
                <p className="text-sm text-muted-foreground">Aucune donnée d'activité disponible.</p>
            </div>
        )
    }

  return (
        <>
          {/* ⚠️ Titre affiché uniquement s'il est configuré : sans config, le rendu est identique. */}
          {config?.labels?.title ? (
              <h3 className="text-xl font-bold mb-4">{config.labels.title}</h3>
          ) : null}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart accessibilityLayer data={donnees}>
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
            />
            <Tooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                content={<ChartTooltipContent nameKey="name" />}
            />
            <Bar dataKey="commits" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        </>
  );
}
