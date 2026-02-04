import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { IndianRupee, TrendingUp, TrendingDown, Wallet, Plus, CreditCard } from "lucide-react";
import { getExpenses, getExpenseStats } from "@/lib/actions/expenses";
import { ExpensesTable } from "./_components/expenses-table";
import { AddExpenseDialog } from "@/components/expenses/add-expense-dialog";
import { cn } from "@/lib/utils";

export const dynamic = 'force-dynamic';

function KpICard({ title, value, subtext, icon: Icon, color = "slate", isAlert = false }: any) {
    const styles: any = {
        indigo: { bg: "bg-indigo-50/50 hover:bg-indigo-50", border: "border-indigo-100 hover:border-indigo-200", iconBg: "bg-indigo-100 text-indigo-600", text: "text-slate-900" },
        emerald: { bg: "bg-emerald-50/50 hover:bg-emerald-50", border: "border-emerald-100 hover:border-emerald-200", iconBg: "bg-emerald-100 text-emerald-600", text: "text-slate-900" },
        rose: { bg: isAlert ? "bg-rose-50 border-rose-200" : "bg-rose-50/50 hover:bg-rose-50 border-rose-100 hover:border-rose-200", iconBg: isAlert ? "bg-rose-100 text-rose-600 animate-pulse" : "bg-rose-100 text-rose-600", text: isAlert ? "text-rose-700" : "text-slate-900" },
        slate: { bg: "bg-slate-50/50 hover:bg-slate-50", border: "border-slate-100 hover:border-slate-200", iconBg: "bg-slate-100 text-slate-600", text: "text-slate-900" },
        amber: { bg: "bg-amber-50/50 hover:bg-amber-50", border: "border-amber-100 hover:border-amber-200", iconBg: "bg-amber-100 text-amber-600", text: "text-slate-900" }
    };
    const s = styles[color] || styles.slate;

    return (
        <div className={cn("rounded-xl border p-4 flex flex-col justify-between min-h-[110px] transition-all duration-200 group cursor-default", s.bg, s.border)}>
            <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500/90">{title}</span>
                {Icon && (<div className={cn("p-1.5 rounded-md transition-colors", s.iconBg)}><Icon className="w-4 h-4" /></div>)}
            </div>
            <div className="space-y-1">
                <div className={cn("text-2xl font-bold tracking-tight", s.text)}>{value}</div>
                {subtext && (<span className="text-xs text-slate-500 font-medium">{subtext}</span>)}
            </div>
        </div>
    );
}

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

    const isSpendingUp = stats.percentChange > 0;

    return (
        <div className="flex flex-col gap-8 max-w-[1600px] mx-auto w-full pb-10 animate-in fade-in duration-500 bg-background p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
                        Business <span className="text-slate-900">Expenses</span>
                    </h1>
                    <p className="text-sm text-slate-500 mt-2 font-medium">
                        Track and manage your business spending.
                    </p>
                </div>
                <AddExpenseDialog />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                <KpICard
                    title="Total Spent (This Month)"
                    value={formatCurrency(stats.totalThisMonth)}
                    subtext={`${Math.abs(stats.percentChange).toFixed(1)}% ${isSpendingUp ? 'more' : 'less'} than last month`}
                    icon={Wallet}
                    color={isSpendingUp ? "rose" : "emerald"}
                />
                <KpICard
                    title="Total Spent (Last Month)"
                    value={formatCurrency(stats.totalLastMonth)}
                    subtext="Previous period reference"
                    icon={IndianRupee}
                    color="slate"
                />
                <KpICard
                    title="Top Spending Category"
                    value={stats.topCategory || "N/A"}
                    subtext="Highest expense area"
                    icon={CreditCard}
                    color="amber"
                />
            </div>

            {/* Table */}
            <ExpensesTable expenses={expenses} />
        </div>
    );
}
