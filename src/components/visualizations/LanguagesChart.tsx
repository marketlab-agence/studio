'use client';

import React from 'react';
import { Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { ChartTooltipContent, ChartLegendContent } from '@/components/ui/chart';
import type { ComponentConfig } from '@/lib/schemas/component-config';

type ChartData = {
    name: string;
    value: number;
    fill: string;
};

export function LanguagesChart({ data, config }: { data?: ChartData[]; config?: ComponentConfig }) {
    // ⚠️ La donnée vient de `config.data.entries` (IA ou créateur) ; le repli sur la prop préserve l'existant.
    const donnees = (config?.data as { entries?: ChartData[] } | undefined)?.entries ?? data;
    if (!donnees || donnees.length === 0) {
        return (
            <div className="flex h-full w-full items-center justify-center rounded-md border border-dashed">
                <p className="text-sm text-muted-foreground">Aucune donnée sur les langages disponible.</p>
            </div>
        );
    }

    return (
        <>
            {/* ⚠️ Titre affiché uniquement s'il est configuré : sans config, le rendu est identique. */}
            {config?.labels?.title ? (
                <h3 className="text-xl font-bold mb-4">{config.labels.title}</h3>
            ) : null}
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Tooltip
                        content={<ChartTooltipContent nameKey="name" />}
                    />
                    <Pie
                        data={donnees}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    labelLine={false}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return (
                            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                                {`${(percent * 100).toFixed(0)}%`}
                            </text>
                        );
                    }}
                />
                <Legend content={<ChartLegendContent />} />
            </PieChart>
        </ResponsiveContainer>
        </>
    );
}
