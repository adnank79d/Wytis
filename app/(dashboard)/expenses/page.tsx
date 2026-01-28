import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { getExpenses, getExpenseStats } from "@/lib/actions/expenses";
import { ExpensesTable } from "@/components/expenses/expenses-table";
import { AddExpenseDialog } from "@/components/expenses/add-expense-dialog";
import { cn } from "@/lib/utils";

export const dynamic = 'force-dynamic';

export default async function ExpensesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Fetch Data
    const [expenses, stats] = await Promise.all([
        getExpenses(),
        getExpenseStats()
    ]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
                    <p className="text-muted-foreground">Track and manage your business spending.</p>
                </div>
                <AddExpenseDialog />
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Spent (This Month)</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats.totalThisMonth)}</div>
                        <p className={cn("text-xs mt-1 flex items-center", stats.percentChange > 0 ? "text-rose-600" : "text-emerald-600")}>
                            {stats.percentChange > 0 ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
                            {Math.abs(stats.percentChange).toFixed(1)}% vs last month
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Spent (Last Month)</CardTitle>
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats.totalLastMonth)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Top Category</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.topCategory}</div>
                        <p className="text-xs text-muted-foreground mt-1">Highest spending area</p>
                    </CardContent>
                </Card>
            </div>

            {/* Table */}
            <ExpensesTable expenses={expenses} />
        </div>
    );
}
