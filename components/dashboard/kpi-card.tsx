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
            "rounded-xl md:rounded-2xl border border-border/40 bg-card relative overflow-hidden group",
            "shadow-sm hover:shadow-md transition-all duration-300 ease-out",
            "hover:border-border/60 hover:translate-y-[-2px]",
            className
        )}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0.5 relative z-10 px-3 md:px-5 pt-3 md:pt-5">
                <CardTitle className="text-[10px] md:text-xs font-medium text-muted-foreground/80 tracking-wide uppercase">
                    {label}
                </CardTitle>
                {Icon && (
                    <div className="h-7 w-7 md:h-9 md:w-9 rounded-lg md:rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <Icon className="h-3.5 w-3.5 md:h-5 md:w-5 text-primary/70 group-hover:text-primary transition-colors" />
                    </div>
                )}
            </CardHeader>
            <CardContent className="relative z-10 px-3 md:px-5 pb-3 md:pb-5 pt-1.5">
                <div className="text-xl md:text-3xl font-bold text-foreground tracking-tight">
                    {value}
                </div>
                {trend !== undefined && (
                    <div className={cn(
                        "flex items-center text-[10px] md:text-sm font-medium mt-1.5",
                        isPositive ? "text-emerald-600" : "text-rose-500"
                    )}>
                        <span className={cn(
                            "inline-flex items-center gap-0.5 px-1 md:px-1.5 py-0.5 rounded text-[10px] font-semibold",
                            isPositive ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-rose-50 dark:bg-rose-950/30"
                        )}>
                            {isPositive ? <ArrowUpRight className="h-2.5 w-2.5 md:h-3 md:w-3" /> : <ArrowDownRight className="h-2.5 w-2.5 md:h-3 md:w-3" />}
                            {Math.abs(trend)}%
                        </span>
                        <span className="text-muted-foreground/60 ml-1.5 text-[10px] font-normal hidden md:inline">
                            vs last month
                        </span>
                    </div>
                )}
                {!trend && caption && (
                    <p className="text-[10px] md:text-xs text-muted-foreground/70 mt-1.5 font-medium">
                        {caption}
                    </p>
                )}
            </CardContent>

            {/* Background Chart with Gradient */}
            {chartData && (
                <div className="absolute bottom-0 left-0 right-0 opacity-30 group-hover:opacity-50 transition-opacity duration-300">
                    <TrendChart data={chartData} color={chartColor} height={60} />
                </div>
            )}
        </Card>
    );
}
