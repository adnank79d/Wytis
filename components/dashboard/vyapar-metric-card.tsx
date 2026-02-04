"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowRight, ChevronRight } from "lucide-react";
import Link from "next/link";
import { formatCompactCurrency } from "@/lib/format-currency";

interface VyaparMetricCardProps {
    label: string;
    value: number;
    type: "receivable" | "payable" | "cash" | "stock";
    href: string;
    subtitle?: string;
}

export function VyaparMetricCard({ label, value, type, href, subtitle }: VyaparMetricCardProps) {
    const styles = {
        receivable: {
            bg: "bg-emerald-50 dark:bg-emerald-950/20",
            border: "border-emerald-200 dark:border-emerald-900/50",
            text: "text-emerald-700 dark:text-emerald-400",
            amount: "text-emerald-700 dark:text-emerald-400",
            hover: "hover:border-emerald-300 dark:hover:border-emerald-800",
            iconBg: "bg-emerald-100 dark:bg-emerald-900/40"
        },
        payable: {
            bg: "bg-rose-50 dark:bg-rose-950/20",
            border: "border-rose-200 dark:border-rose-900/50",
            text: "text-rose-700 dark:text-rose-400",
            amount: "text-rose-700 dark:text-rose-400",
            hover: "hover:border-rose-300 dark:hover:border-rose-800",
            iconBg: "bg-rose-100 dark:bg-rose-900/40"
        },
        cash: {
            bg: "bg-orange-50 dark:bg-orange-950/20",
            border: "border-orange-200 dark:border-orange-900/50",
            text: "text-orange-700 dark:text-orange-400",
            amount: "text-orange-700 dark:text-orange-400",
            hover: "hover:border-orange-300 dark:hover:border-orange-800",
            iconBg: "bg-orange-100 dark:bg-orange-900/40"
        },
        stock: {
            bg: "bg-blue-50 dark:bg-blue-950/20",
            border: "border-blue-200 dark:border-blue-900/50",
            text: "text-blue-700 dark:text-blue-400",
            amount: "text-blue-700 dark:text-blue-400",
            hover: "hover:border-blue-300 dark:hover:border-blue-800",
            iconBg: "bg-blue-100 dark:bg-blue-900/40"
        }
    };

    const style = styles[type];

    return (
        <Link href={href}>
            <Card className={cn(
                "border shadow-sm transition-all duration-200 h-full relative overflow-hidden group",
                style.bg,
                style.border,
                style.hover
            )}>
                {/* Decorative Circle */}
                <div className={cn("absolute -right-6 -top-6 rounded-full w-24 h-24 opacity-10 transition-transform group-hover:scale-110", style.text.replace('text-', 'bg-'))} />

                <CardHeader className="pb-2 relative z-10 flex flex-row items-center justify-between">
                    <CardTitle className={cn("text-xs md:text-sm font-bold uppercase tracking-wide", style.text)}>
                        {label}
                    </CardTitle>
                    <div className={cn("p-1.5 rounded-full", style.iconBg)}>
                        <ChevronRight className={cn("w-4 h-4", style.text)} />
                    </div>
                </CardHeader>
                <CardContent className="pt-0 relative z-10">
                    <div className={cn("text-2xl md:text-3xl font-extrabold tracking-tight tabular-nums", style.amount)}>
                        {formatCompactCurrency(value)}
                    </div>
                    {subtitle && (
                        <p className={cn("text-xs mt-1 font-medium opacity-80", style.text)}>
                            {subtitle}
                        </p>
                    )}
                </CardContent>
            </Card>
        </Link>
    );
}
