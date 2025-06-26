'use client';

import React from 'react';
import { Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { ChartTooltipContent, ChartLegendContent } from '@/components/ui/chart';

type ChartData = {
    name: string;
    value: number;
    fill: string;
};

export function LanguagesChart({ data }: { data: ChartData[] }) {
    if (!data || data.length === 0) {
        return (
            <div className="flex h-full w-full items-center justify-center rounded-md border border-dashed">
                <p className="text-sm text-muted-foreground">Aucune donnée sur les langages disponible.</p>
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Tooltip
                    content={<ChartTooltipContent nameKey="name" />}
                />
                <Pie
                    data={data}
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
    );
}
