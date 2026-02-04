"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, FilePlus, AlertCircle, TrendingUp } from "lucide-react";
import Link from "next/link";
import { formatCompactCurrency } from "@/lib/format-currency";

interface ActionCenterProps {
    overdueCount: number;
    overdueAmount: number;
    gstPayable: number;
    canCreateInvoice: boolean;
}

export function ActionCenter({ overdueCount, overdueAmount, gstPayable, canCreateInvoice }: ActionCenterProps) {
    return (
        <div className="flex flex-col gap-4 h-full">
            {/* Quick Actions Card */}
            <Card className="rounded-xl border border-border/60 bg-card shadow-sm p-1">
                <CardContent className="p-3 space-y-3">
                    <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-1 font-mono">Execute Command</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            variant="outline"
                            className="h-auto py-3 flex flex-col gap-2 rounded-lg border-dashed border-border/60 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all group"
                            asChild
                            disabled={!canCreateInvoice}
                        >
                            <Link href={canCreateInvoice ? "/invoices/new" : "#"}>
                                <div className="p-2 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                    <FilePlus className="h-4 w-4" />
                                </div>
                                <span className="text-xs font-mono font-semibold">New Invoice</span>
                            </Link>
                        </Button>
                        <Button
                            variant="outline"
                            className="h-auto py-3 flex flex-col gap-2 rounded-lg border-dashed border-border/60 hover:border-emerald-500/50 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/20 dark:hover:text-emerald-400 transition-all group"
                            asChild
                        >
                            <Link href="/customers/new">
                                <div className="p-2 rounded-md bg-emerald-500/10 group-hover:bg-emerald-500/20 text-emerald-600 group-hover:text-emerald-700 dark:text-emerald-400 dark:group-hover:text-emerald-300 transition-colors">
                                    <Users className="h-4 w-4" />
                                </div>
                                <span className="text-xs font-mono font-semibold">Add Client</span>
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Critical Alerts / Stats */}
            <div className="grid grid-rows-2 gap-4 flex-1">
                {/* Overdue Alert */}
                <Card className="rounded-xl border border-border/60 bg-rose-50/30 dark:bg-rose-950/10 shadow-sm relative overflow-hidden group hover:border-rose-200/60 dark:hover:border-rose-900/50 transition-colors">
                    {/* Tactical Overlay */}
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(244,63,94,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] bg-no-repeat transition-[background-position_0s] group-hover:bg-[position:200%_0,0_0] group-hover:duration-[1500ms] pointer-events-none" />

                    <CardContent className="p-4 flex flex-col justify-between h-full relative z-10">
                        <div className="flex items-start justify-between">
                            <div>
                                <h4 className="text-rose-700 dark:text-rose-400 font-mono font-bold text-xs uppercase tracking-wider">Overdue Alert</h4>
                                <p className="text-rose-600/70 dark:text-rose-300/60 text-[10px] uppercase mt-0.5 font-mono">Action Required</p>
                            </div>
                            <div className="h-7 w-7 rounded-sm bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
                                <AlertCircle className="h-3.5 w-3.5" />
                            </div>
                        </div>
                        <div className="mt-2">
                            <p className="text-xl font-bold text-rose-700 dark:text-rose-400 font-mono tabular-nums">{overdueCount}</p>
                            <p className="text-[10px] text-rose-600/70 dark:text-rose-300/60 font-medium font-mono">
                                Vol: {formatCompactCurrency(overdueAmount)}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* GST Status */}
                <Card className="rounded-xl border border-border/60 bg-card shadow-sm relative overflow-hidden group hover:border-primary/40 transition-colors">
                    <div className="absolute top-0 right-0 p-2 opacity-50">
                        <TrendingUp className="h-16 w-16 text-muted-foreground/5 transform translate-x-4 -translate-y-4" />
                    </div>
                    <CardContent className="p-4 flex flex-col justify-between h-full relative z-10">
                        <div className="flex items-start justify-between">
                            <div>
                                <h4 className="text-foreground font-mono font-bold text-xs uppercase tracking-wider">GST Liability</h4>
                                <p className="text-muted-foreground text-[10px] uppercase mt-0.5 font-mono">Current Payable</p>
                            </div>
                            <div className="h-7 w-7 rounded-sm bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100/50">
                                <TrendingUp className="h-3.5 w-3.5" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-end justify-between">
                            <p className="text-xl font-bold text-foreground font-mono tabular-nums">{formatCompactCurrency(gstPayable)}</p>
                            <Button variant="ghost" className="h-6 px-2 text-[10px] text-primary hover:bg-primary/10 font-mono uppercase tracking-wider" asChild>
                                <Link href="/reports">Report &rarr;</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
