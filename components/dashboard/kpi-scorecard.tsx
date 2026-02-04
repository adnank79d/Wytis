"use client";

import { DashboardPortlet } from "./dashboard-portlet";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCompactCurrency } from "@/lib/format-currency";

interface KpiItem {
    label: string;
    value: number | string;
    previous?: number | string;
    change?: number; // percentage
    trend?: 'up' | 'down' | 'neutral';
    format?: 'currency' | 'number' | 'text';
}

interface KpiScorecardProps {
    title: string;
    items: KpiItem[];
    dateRange?: string; // e.g., "This Month"
}

export function KpiScorecard({ title, items, dateRange = "This Month" }: KpiScorecardProps) {
    return (
        <DashboardPortlet title={title} action={<span className="text-[10px] text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded">{dateRange}</span>} noPadding>
            <div className="w-full text-sm">
                <table className="w-full">
                    <thead className="bg-muted/30 text-xs text-muted-foreground uppercase font-semibold">
                        <tr>
                            <th className="text-left px-4 py-2 font-medium w-[40%]">Metric</th>
                            <th className="text-right px-4 py-2 font-medium">Current</th>
                            <th className="text-right px-4 py-2 font-medium hidden sm:table-cell">Previous</th>
                            <th className="text-right px-4 py-2 font-medium w-[20%]">Change</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                        {items.map((item, i) => {
                            const isPositive = item.change && item.change > 0;
                            const isNegative = item.change && item.change < 0;

                            // Determine color based on trend direction (assuming Up is good for Rev, bad for Cost, but simplified here)
                            // For simplicity: Green = Up, Red = Down (user can override if needed)
                            const trendColor = isPositive ? "text-emerald-600" : isNegative ? "text-rose-600" : "text-muted-foreground";

                            const formattedValue = item.format === 'currency' && typeof item.value === 'number'
                                ? formatCompactCurrency(item.value)
                                : item.value;

                            const formattedPrev = item.format === 'currency' && typeof item.previous === 'number'
                                ? formatCompactCurrency(item.previous)
                                : item.previous;

                            return (
                                <tr key={i} className="group hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3 font-medium text-foreground">{item.label}</td>
                                    <td className="px-4 py-3 text-right font-bold tabular-nums">{formattedValue}</td>
                                    <td className="px-4 py-3 text-right text-muted-foreground tabular-nums hidden sm:table-cell">{formattedPrev || '-'}</td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {item.change !== undefined ? (
                                            <div className={cn("inline-flex items-center gap-1 font-medium", trendColor)}>
                                                {isPositive ? <ArrowUpRight className="w-3 h-3" /> : isNegative ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                                                {Math.abs(item.change)}%
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </DashboardPortlet>
    );
}
