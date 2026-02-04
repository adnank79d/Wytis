"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreVertical, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardPortletProps {
    title: string;
    children: React.ReactNode;
    className?: string;
    action?: React.ReactNode;
    noPadding?: boolean;
}

export function DashboardPortlet({ title, children, className, action, noPadding = false }: DashboardPortletProps) {
    return (
        <Card className={cn("rounded-none border border-border/60 shadow-sm flex flex-col h-full bg-card", className)}>
            {/* NetSuite-style Header: Distinct background, clear title */}
            <CardHeader className="flex flex-row items-center justify-between py-2 px-3 border-b border-border/60 bg-muted/40 min-h-[40px]">
                <CardTitle className="text-sm font-bold text-foreground tracking-tight uppercase font-mono">
                    {title}
                </CardTitle>
                <div className="flex items-center gap-1">
                    {action}
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
                        <RefreshCw className="h-3 w-3" />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
                                <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-xs">
                            <DropdownMenuItem>Minimize</DropdownMenuItem>
                            <DropdownMenuItem>Settings</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent className={cn("flex-1", noPadding ? "p-0" : "p-3")}>
                {children}
            </CardContent>
        </Card>
    );
}
