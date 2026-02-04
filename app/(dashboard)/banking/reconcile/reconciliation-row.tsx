"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Search, X, Loader2 } from "lucide-react";
import { findMatchesFor, reconcile } from "@/lib/actions/banking";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ReconciliationRowProps {
    transaction: any;
}

export function ReconciliationRow({ transaction }: ReconciliationRowProps) {
    const [matches, setMatches] = useState<any[]>([]);
    const [isLoadingMatches, setIsLoadingMatches] = useState(false);
    const [isReconciling, setIsReconciling] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleFindMatches = async () => {
        setIsLoadingMatches(true);
        const data = await findMatchesFor(transaction.id);
        setMatches(data);
        setIsLoadingMatches(false);
    };

    const handleReconcile = async (ledgerId: string) => {
        setIsReconciling(true);
        const res = await reconcile(transaction.id, ledgerId);
        if (res.success) {
            setIsOpen(false);
            // Parent page revalidates via server action, but local state isn't removed instantly
            // Ideally we'd optimize visually, but revalidatePath works fast enough usually
        }
        setIsReconciling(false);
    };

    return (
        <Card className="overflow-hidden border-l-4 border-l-primary">
            <CardContent className="p-4 flex items-center justify-between gap-4">
                {/* Bank Side */}
                <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm text-muted-foreground">{transaction.date}</span>
                        <Badge variant="outline" className="text-xs">{transaction.reference || 'No Ref'}</Badge>
                    </div>
                    <p className="font-medium truncate">{transaction.description}</p>
                    <p className="font-bold text-lg mt-1">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(transaction.amount)}
                    </p>
                </div>

                {/* Action Area */}
                <div className="flex items-center gap-2">
                    <Dialog open={isOpen} onOpenChange={(v) => {
                        setIsOpen(v);
                        if (v) handleFindMatches();
                    }}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <Search className="h-4 w-4" />
                                Find Match
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Reconcile Transaction</DialogTitle>
                            </DialogHeader>

                            <div className="space-y-4 py-4">
                                <div className="bg-muted p-4 rounded-lg">
                                    <p className="text-sm text-muted-foreground">Bank Line:</p>
                                    <div className="flex justify-between font-medium mt-1">
                                        <span>{transaction.description}</span>
                                        <span>{transaction.amount}</span>
                                    </div>
                                </div>

                                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Suggested Matches</h4>

                                {isLoadingMatches ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : matches.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No exact amount matches found in ledger.
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                        {matches.map(match => (
                                            <div key={match.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                                <div>
                                                    <p className="font-medium">{match.description || 'System Transaction'}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {match.date} • {match.id.slice(0, 8)}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="font-bold">{match.amount}</span>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleReconcile(match.id)}
                                                        disabled={isReconciling}
                                                    >
                                                        {isReconciling ? <Loader2 className="h-3 w-3 animate-spin" /> : "Match"}
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardContent>
        </Card>
    );
}
