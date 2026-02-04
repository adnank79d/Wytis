"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Minus, TrendingUp } from "lucide-react";

interface MetricCardProps {
    title: string;
    value: string | number;
    subtext?: string;
    trend?: number | null;
    trendLabel?: string;
    icon?: React.ElementType;
    className?: string;
    action?: React.ReactNode;
    colorScheme?: "blue" | "emerald" | "amber" | "rose" | "violet" | "slate";
    chartData?: { date: string; value: number }[]; // kept for compatibility
}

export function MetricCard({
    title,
    value,
    subtext,
    trend,
    trendLabel,
    icon: Icon,
    className,
    action,
    colorScheme = "slate",
}: MetricCardProps) {
    const isPositive = trend && trend > 0;
    const isNeutral = !trend || trend === 0;

    // Professional, muted enterprise accents
    const colors = {
        blue: "border-blue-500/50 shadow-blue-500/5 hover:border-blue-500",
        emerald: "border-emerald-500/50 shadow-emerald-500/5 hover:border-emerald-500",
        amber: "border-amber-500/50 shadow-amber-500/5 hover:border-amber-500",
        rose: "border-rose-500/50 shadow-rose-500/5 hover:border-rose-500",
        violet: "border-violet-500/50 shadow-violet-500/5 hover:border-violet-500",
        slate: "border-slate-500/50 shadow-slate-500/5 hover:border-slate-500",
    };

    return (
        <Card className={cn(
            "relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border-t-4",
            colors[colorScheme],
            className
        )}>
            <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
                        <h3 className="text-2xl font-bold tracking-tight text-slate-900">{value}</h3>
                    </div>
                    {Icon && (
                        <div className={cn("p-2 rounded-lg bg-slate-50 text-slate-500")}>
                            <Icon className="w-5 h-5" />
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {!isNeutral ? (
                            <div className={cn(
                                "flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded",
                                isPositive
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-rose-50 text-rose-700"
                            )}>
                                {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                <span>{Math.abs(trend!)}%</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                <Minus className="w-3 h-3" /> 0%
                            </div>
                        )}
                        <span className="text-xs text-muted-foreground">{trendLabel || "vs. last month"}</span>
                    </div>
                    {action}
                </div>
                {subtext && <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-slate-100">{subtext}</p>}
            </CardContent>
        </Card>
    );
}
