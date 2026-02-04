import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { TrendChart } from "@/components/dashboard/trend-chart";

interface KpiCardProps {
    label: string;
    value: string | number;
    caption?: string;
    icon?: LucideIcon;
    loading?: boolean;
    className?: string;
    trend?: number;
    chartData?: { date: string; value: number }[];
    chartColor?: string;
}

export function KpiCard({
    label,
    value,
    caption,
    icon: Icon,
    loading = false,
    className,
    trend,
    chartData,
    chartColor = "#6366f1"
}: KpiCardProps) {
    if (loading) {
        return (
            <Card className={cn("rounded-2xl border border-border/40 bg-card shadow-sm", className)}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-5 pt-5">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-4 w-4 rounded-full" />
                </CardHeader>
                <CardContent className="px-5 pb-5">
                    <Skeleton className="h-8 w-[120px] mb-2" />
                    <Skeleton className="h-3 w-[80px]" />
                </CardContent>
            </Card>
        );
    }

    const isPositive = trend && trend >= 0;

    return (
        <Card className={cn(
            "rounded-xl border border-border/60 bg-card relative overflow-hidden group",
            "shadow-sm transition-all duration-300",
            "hover:border-primary/40 hover:shadow-md",
            className
        )}>
            {/* Tactical Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_14px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10 px-4 md:px-5 pt-4 md:pt-5">
                <CardTitle className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-widest font-mono">
                    {label}
                </CardTitle>
                {Icon && (
                    <div className="h-7 w-7 md:h-8 md:w-8 rounded-md bg-muted/50 border border-border/50 flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
                        <Icon className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                )}
            </CardHeader>
            <CardContent className="relative z-10 px-4 md:px-5 pb-4 md:pb-5">
                <div className="text-xl md:text-3xl font-bold text-foreground tracking-tight font-mono tabular-nums">
                    {value}
                </div>
                {trend !== undefined && (
                    <div className="flex items-center gap-2 mt-2">
                        <div className={cn(
                            "flex items-center text-[10px] md:text-xs font-mono font-medium px-1.5 py-0.5 rounded-sm border",
                            isPositive
                                ? "text-emerald-600 bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50"
                                : "text-rose-600 bg-rose-50/50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/50"
                        )}>
                            {isPositive ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                            {Math.abs(trend)}%
                        </div>
                        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">vs last month</span>
                    </div>
                )}
                {!trend && caption && (
                    <p className="text-[10px] md:text-xs text-muted-foreground/70 mt-2 font-medium flex items-center gap-1.5">
                        <span className="h-1 w-1 rounded-full bg-primary/50" />
                        {caption}
                    </p>
                )}
            </CardContent>

            {/* Background Chart with Gradient */}
            {chartData && (
                <div className="absolute bottom-0 left-0 right-0 opacity-20 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none">
                    <TrendChart data={chartData} color={chartColor} height={50} />
                </div>
            )}
        </Card>
    );
}
