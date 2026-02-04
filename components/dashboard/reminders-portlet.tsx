"use client";

import { DashboardPortlet } from "./dashboard-portlet";
import { AlertCircle, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ReminderItem {
    label: string;
    count: number;
    href: string;
    variant?: 'critical' | 'warning' | 'info' | 'success';
}

interface RemindersPortletProps {
    items: ReminderItem[];
}

export function RemindersPortlet({ items }: RemindersPortletProps) {
    // Sort: Critical first, then Warning, then by count descending
    const sortedItems = [...items].sort((a, b) => {
        const priority = { critical: 3, warning: 2, info: 1, success: 0 };
        const pA = priority[a.variant || 'info'];
        const pB = priority[b.variant || 'info'];
        if (pA !== pB) return pB - pA;
        return b.count - a.count;
    });

    return (
        <DashboardPortlet title="Reminders" className="border-l-4 border-l-primary">
            <div className="space-y-1">
                {sortedItems.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">No active reminders.</p>
                ) : (
                    sortedItems.map((item, i) => (
                        <Link
                            key={i}
                            href={item.href}
                            className="flex items-center group py-2 px-2 hover:bg-muted/50 rounded-sm transition-colors border-b border-border/40 last:border-0"
                        >
                            <div className="flex-1 flex items-center gap-2">
                                {item.variant === 'critical' && <AlertCircle className="w-3.5 h-3.5 text-rose-600" />}
                                {item.variant === 'warning' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                                {item.variant === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                                <span className={cn(
                                    "text-sm font-medium",
                                    item.variant === 'critical' ? "text-rose-700 font-bold" : "text-foreground"
                                )}>
                                    {item.label}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    "text-lg font-bold font-mono",
                                    item.variant === 'critical' ? "text-rose-600" : "text-foreground"
                                )}>
                                    {item.count}
                                </span>
                                <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </DashboardPortlet>
    );
}
