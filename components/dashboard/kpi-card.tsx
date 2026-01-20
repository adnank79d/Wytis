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
    trend?: number; // Percentage change (e.g. 15 for +15%, -5 for -5%)
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
            <Card className={cn("glass-card border-none", className)}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-4 w-4 rounded-full" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-[120px] mb-2" />
                    <Skeleton className="h-3 w-[80px]" />
                </CardContent>
            </Card>
        );
    }

    const isPositive = trend && trend >= 0;

    return (
        <Card className={cn("glass-card border-none relative overflow-hidden group", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 relative z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground tracking-wide">
                    {label}
                </CardTitle>
                {Icon && <Icon className="h-4 w-4 text-muted-foreground/50 transition-colors group-hover:text-primary/70" />}
            </CardHeader>
            <CardContent className="relative z-10">
                <div className="flex items-end justify-between">
                    <div>
                        <div className="text-2xl font-bold text-foreground tracking-tight">
                            {value}
                        </div>
                        {trend !== undefined && (
                            <div className={cn(
                                "flex items-center text-xs font-medium mt-1",
                                isPositive ? "text-emerald-600" : "text-rose-600"
                            )}>
                                {isPositive ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                                {Math.abs(trend)}%
                                <span className="text-muted-foreground/70 ml-1 font-normal">
                                    vs last month
                                </span>
                            </div>
                        )}
                        {!trend && caption && (
                            <p className="text-xs text-muted-foreground mt-1 font-medium">
                                {caption}
                            </p>
                        )}
                    </div>
                </div>
            </CardContent>

            {/* Background Chart */}
            {chartData && (
                <div className="absolute bottom-0 left-0 right-0 opacity-40 group-hover:opacity-60 transition-opacity">
                    <TrendChart data={chartData} color={chartColor} height={80} />
                </div>
            )}
        </Card>
    );
}
