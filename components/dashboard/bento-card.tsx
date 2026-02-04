"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Minus, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BentoCardProps {
    title?: string;
    value?: string | number;
    subtext?: string;
    trend?: number;
    trendLabel?: string;
    icon?: React.ElementType;
    children?: React.ReactNode;
    className?: string;
    headerAction?: React.ReactNode;
    variant?: "default" | "glass" | "primary" | "dark" | "gradient-blue" | "gradient-purple" | "gradient-orange";
    noPadding?: boolean;
}

export function BentoCard({
    title,
    value,
    subtext,
    trend,
    trendLabel,
    icon: Icon,
    children,
    className,
    headerAction,
    variant = "default",
    noPadding = false
}: BentoCardProps) {
    const isPositive = trend && trend > 0;

    const variants = {
        default: "bg-background border-border shadow-sm",
        glass: "bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-white/20 shadow-xl",
        primary: "bg-indigo-600 text-white border-indigo-500 shadow-indigo-500/20",
        dark: "bg-slate-900 text-white border-slate-800 shadow-xl",
        "gradient-blue": "bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-none shadow-lg shadow-blue-500/20",
        "gradient-purple": "bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white border-none shadow-lg shadow-violet-500/20",
        "gradient-orange": "bg-gradient-to-br from-amber-400 to-orange-500 text-white border-none shadow-lg shadow-orange-500/20",
    };

    const isDarkVariant = ["primary", "dark", "gradient-blue", "gradient-purple", "gradient-orange"].includes(variant);

    return (
        <Card className={cn(
            "relative overflow-hidden transition-all duration-300 hover:shadow-md",
            variants[variant],
            className
        )}>
            {/* Header Section */}
            {(title || Icon || headerAction) && (
                <div className="flex items-center justify-between p-4 md:p-5 pb-2">
                    <div className="flex items-center gap-2">
                        {Icon && (
                            <div className={cn(
                                "p-2 rounded-lg",
                                isDarkVariant ? "bg-white/10 text-white" : "bg-primary/10 text-primary"
                            )}>
                                <Icon className="w-4 h-4" />
                            </div>
                        )}
                        {title && (
                            <h3 className={cn(
                                "text-sm font-semibold uppercase tracking-wide",
                                isDarkVariant ? "text-white/80" : "text-muted-foreground"
                            )}>
                                {title}
                            </h3>
                        )}
                    </div>
                    {headerAction && <div>{headerAction}</div>}
                </div>
            )}

            {/* Main Content Area */}
            <div className={cn(
                "relative z-10",
                noPadding ? "" : "p-4 md:p-5 pt-0",
                title || Icon ? "" : "pt-5"
            )}>
                {/* Value & Trend Block */}
                {(value || trend !== undefined) && (
                    <div className="mb-4">
                        <div className="flex items-baseline gap-2">
                            {value && (
                                <span className={cn(
                                    "text-3xl font-bold tracking-tight",
                                    isDarkVariant ? "text-white" : "text-foreground"
                                )}>
                                    {value}
                                </span>
                            )}
                            {trend !== undefined && (
                                <span className={cn(
                                    "flex items-center text-xs font-bold px-1.5 py-0.5 rounded",
                                    isDarkVariant
                                        ? "bg-white/20 text-white"
                                        : (isPositive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")
                                )}>
                                    {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                    {Math.abs(trend)}%
                                </span>
                            )}
                        </div>
                        {subtext && (
                            <p className={cn(
                                "text-xs mt-1",
                                isDarkVariant ? "text-white/60" : "text-muted-foreground"
                            )}>
                                {subtext}
                            </p>
                        )}
                    </div>
                )}

                {children}
            </div>

            {/* Decorative Background Elements for Gradients */}
            {variant.startsWith('gradient') && (
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            )}
        </Card>
    );
}
