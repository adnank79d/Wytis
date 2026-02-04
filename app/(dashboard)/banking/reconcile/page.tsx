import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
    getBankTransactions,
    importMockStatement,
    reconcile,
    findMatchesFor
} from "@/lib/actions/banking";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, UploadCloud, RefreshCw, X, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReconciliationRow } from "./reconciliation-row";

export const dynamic = 'force-dynamic';

export default async function ReconcilePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    // Fetch unmatched first
    const transactions = await getBankTransactions('unmatched');

    return (
        <div className="max-w-7xl mx-auto py-8 px-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Bank Reconciliation</h1>
                    <p className="text-muted-foreground mt-1">Match your bank statement lines to system records.</p>
                </div>
                <div className="flex gap-2">
                    <form action={async () => {
                        'use server';
                        await importMockStatement();
                    }}>
                        <Button variant="outline">
                            <UploadCloud className="mr-2 h-4 w-4" />
                            Import Statement
                        </Button>
                    </form>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {transactions.length === 0 ? (
                    <Card className="p-8 text-center text-muted-foreground bg-muted/20 border-border/50 border-dashed">
                        <p>No unmatched transactions found.</p>
                        <p className="text-sm mt-2">Import a statement to start reconciling.</p>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {transactions.map((tx) => (
                            <ReconciliationRow key={tx.id} transaction={tx} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
