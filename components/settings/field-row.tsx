"use client"

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface FieldRowProps {
    label: string;
    description?: string;
    children: ReactNode;
    className?: string;
    action?: ReactNode;
}

export function FieldGroup({ children, title }: { children: ReactNode, title?: string }) {
    return (
        <div className="space-y-3">
            {title && (
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">
                    {title}
                </h4>
            )}
            <div className="divide-y divide-border/40 rounded-lg border border-border/40 bg-card overflow-hidden">
                {children}
            </div>
        </div>
    )
}

export function FieldRow({ label, description, children, className, action }: FieldRowProps) {
    return (
        <div className={cn("group flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 hover:bg-muted/30 transition-colors", className)}>
            <div className="space-y-1 flex-1 min-w-[200px]">
                <Label className="text-sm font-medium leading-none text-foreground">
                    {label}
                </Label>
                {description && (
                    <p className="text-[13px] text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            <div className="flex items-center gap-4 flex-1 justify-end">
                {children}
                {action && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {action}
                    </div>
                )}
            </div>
        </div>
    );
}
