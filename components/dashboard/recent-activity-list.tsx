"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityItem } from "@/lib/actions/dashboard";
import { formatCompactCurrency } from "@/lib/format-currency";
import { cn } from "@/lib/utils";
import { FileText, ArrowRight, Wallet, CheckCircle2, XCircle, Clock, Activity } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface RecentActivityListProps {
    activities: ActivityItem[];
    className?: string;
}

export function RecentActivityList({ activities, className }: RecentActivityListProps) {
    return (
        <Card className={cn("col-span-2 rounded-none border border-border/60 bg-card shadow-sm h-full flex flex-col overflow-hidden relative group", className)}>
            <CardHeader className="flex flex-row items-center justify-between py-2 px-3 border-b border-border/60 bg-muted/40 min-h-[40px]">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-widest font-mono flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5" />
                    Transaction Log
                </CardTitle>
                <Button variant="ghost" size="sm" asChild className="text-[10px] font-mono font-medium h-6 px-2 hover:bg-primary/5 hover:text-primary">
                    <Link href="/invoices">
                        VIEW_ALL
                        <ArrowRight className="ml-1.5 h-3 w-3" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent className="px-0 pb-0 flex-1 overflow-y-auto relative z-10">
                {activities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[200px] text-center p-6 text-muted-foreground">
                        <div className="h-10 w-10 rounded-md bg-muted/50 border border-border/50 flex items-center justify-center mb-4">
                            <Clock className="h-5 w-5 opacity-50" />
                        </div>
                        <p className="text-xs font-mono text-muted-foreground uppercase tracking-wide">Signal Lost: No Activity</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border/40">
                        {activities.map((item) => (
                            <div key={`${item.type}-${item.id}`} className="flex items-center justify-between py-2 px-4 hover:bg-muted/30 transition-colors group/item text-xs">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "h-6 w-6 rounded-sm flex items-center justify-center border transition-colors",
                                        item.type === 'payment'
                                            ? "bg-emerald-50/50 border-emerald-200/60 text-emerald-600 group-hover/item:bg-emerald-100/50"
                                            : item.status === 'cancelled'
                                                ? "bg-rose-50/50 border-rose-200/60 text-rose-600 group-hover/item:bg-rose-100/50"
                                                : "bg-blue-50/50 border-blue-200/60 text-blue-600 group-hover/item:bg-blue-100/50"
                                    )}>
                                        {item.type === 'payment' ? (
                                            <Wallet className="h-3 w-3" />
                                        ) : item.status === 'cancelled' ? (
                                            <XCircle className="h-3 w-3" />
                                        ) : (
                                            <FileText className="h-3 w-3" />
                                        )}
                                    </div>
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-foreground tracking-tight">{item.title}</p>
                                            {item.status === 'paid' && (
                                                <span className="inline-flex items-center px-1 py-0.5 rounded-[1px] text-[8px] font-mono font-bold bg-emerald-50 text-emerald-700 uppercase tracking-tighter border border-emerald-100">
                                                    Paid
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                                            <span className="truncate max-w-[120px]">{item.entityName}</span>
                                            <span className="text-border/60">|</span>
                                            <span>{new Date(item.date).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit', year: '2-digit' })}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={cn(
                                        "font-bold font-mono tabular-nums tracking-tight",
                                        item.type === 'payment' ? "text-emerald-600 branch-nums" : "text-foreground"
                                    )}>
                                        {item.type === 'payment' ? '+' : ''}{formatCompactCurrency(item.amount)}
                                    </p>
                                    <p className="text-[9px] text-muted-foreground/60 uppercase font-mono tracking-wider">{item.status}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
