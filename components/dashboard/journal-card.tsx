"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus, MoreVertical, ArrowUpRight, ArrowDownRight, Clock, AlertCircle } from "lucide-react";
import { TrendChart } from "@/components/dashboard/trend-chart";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ActionLink {
    label: string;
    count?: number;
    href: string;
    variant?: "default" | "critical" | "warning";
}

interface JournalCardProps {
    title: string;
    description?: string;
    accentColor: string; // "emerald", "blue", "orange" etc. class prefix
    primaryAction: {
        label: string;
        href: string;
    };
    menuActions?: {
        label: string;
        href: string;
    }[];
    stats: {
        label: string;
        value: string;
        subValue?: string;
    }[];
    links?: ActionLink[];
    chartData?: { date: string; value: number }[];
    chartColor?: string;
    className?: string; // Additional classes
}

export function JournalCard({
    title,
    description,
    accentColor, // e.g., "bg-emerald-500"
    primaryAction,
    menuActions,
    stats,
    links,
    chartData,
    chartColor,
    className
}: JournalCardProps) {

    return (
        <Card className={cn(
            "relative overflow-hidden border border-border/60 shadow-sm hover:shadow-md transition-all duration-200 group bg-card",
            className
        )}>
            {/* Color Stripe (Left) */}
            <div className={cn("absolute left-0 top-0 bottom-0 w-1", accentColor)} />

            <CardHeader className="flex flex-row items-start justify-between pb-2 pl-5 pr-4 pt-4">
                <div className="space-y-1">
                    <CardTitle className="text-base font-semibold text-foreground tracking-tight flex items-center gap-2">
                        {title}
                    </CardTitle>
                    {description && (
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide opacity-80">{description}</p>
                    )}
                </div>

                {/* Header Actions */}
                <div className="flex items-center gap-1">
                    {/* Primary Action Button (Odoo Style: Button in header generally, or strictly inside body. Let's put a primary button here for quick access) */}
                    <Button size="sm" className={cn("h-7 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-none rounded-md px-3")} asChild>
                        <Link href={primaryAction.href}>
                            {primaryAction.label}
                        </Link>
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            {menuActions?.map((action, i) => (
                                <DropdownMenuItem key={i} asChild>
                                    <Link href={action.href}>{action.label}</Link>
                                </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/reports">View Reports</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/settings">Configuration</Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>

            <CardContent className="pl-5 pr-4 pb-4 pt-2">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Left: Action Links & Stats */}
                    <div className="flex-1 space-y-4">
                        {/* Primary Button used to be main usage, but let's focus on Links being the "To Do" list */}

                        {/* Action List (The "To Do" Section) */}
                        {links && links.length > 0 && (
                            <div className="space-y-1.5">
                                {links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.href}
                                        className="flex items-center justify-between group/link hover:bg-muted/50 p-1.5 -mx-1.5 rounded-md transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            {link.variant === 'critical' ? (
                                                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                                            ) : link.variant === 'warning' ? (
                                                <Clock className="w-3.5 h-3.5 text-amber-500" />
                                            ) : (
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover/link:bg-primary transition-colors" />
                                            )}
                                            <span className={cn(
                                                "text-xs font-medium",
                                                link.variant === 'critical' ? "text-rose-600 dark:text-rose-400" :
                                                    link.variant === 'warning' ? "text-amber-600 dark:text-amber-400" :
                                                        "text-muted-foreground group-hover/link:text-foreground"
                                            )}>
                                                {link.label}
                                            </span>
                                        </div>
                                        {link.count !== undefined && (
                                            <span className={cn(
                                                "text-xs font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground group-hover/link:bg-primary/10 group-hover/link:text-primary transition-colors",
                                                link.variant === 'critical' && "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
                                                link.variant === 'warning' && "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                                            )}>
                                                {link.count}
                                            </span>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Key Metric (Big Number) & Chart */}
                    <div className="flex-1 flex flex-col items-end justify-between min-w-[140px]">
                        <div className="text-right mb-2">
                            {stats.map((stat, i) => (
                                <div key={i}>
                                    <div className="text-2xl font-bold text-foreground tracking-tight">{stat.value}</div>
                                    <div className="text-xs text-muted-foreground font-medium">{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        {chartData && (
                            <div className="w-full h-[50px] opacity-70 group-hover:opacity-100 transition-opacity">
                                <TrendChart data={chartData} color={chartColor} height={50} />
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
