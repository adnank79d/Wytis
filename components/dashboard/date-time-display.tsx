"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

interface DateTimeDisplayProps {
    className?: string;
}

export function DateTimeDisplay({ className }: DateTimeDisplayProps) {
    const [date, setDate] = useState<Date | null>(null);

    useEffect(() => {
        setDate(new Date());

        const timer = setInterval(() => {
            setDate(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    if (!date) return null;

    return (
        <div className={cn(
            "flex items-center gap-3 px-4 py-2 bg-secondary/30 border border-border/50 rounded-full select-none hover:bg-secondary/50 transition-colors",
            className
        )}>
            <div className="p-1.5 bg-background shadow-sm rounded-lg border border-border/50">
                <Clock className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="flex flex-col gap-0.5">
                <span className="text-sm font-bold tracking-tight leading-none text-foreground tabular-nums">
                    {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground leading-none">
                    {date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
            </div>
        </div>
    );
}
