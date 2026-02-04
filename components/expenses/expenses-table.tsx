"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Search,
    MoreHorizontal,
    Trash2,
    Calendar,
    ArrowUpDown
} from "lucide-react";
import { format } from "date-fns";
import { deleteExpense, type Expense } from "@/lib/actions/expenses";

interface ExpensesTableProps {
    expenses: Expense[];
}

export function ExpensesTable({ expenses }: ExpensesTableProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [sortConfig, setSortConfig] = useState<{ key: keyof Expense; direction: 'asc' | 'desc' }>({ key: 'expense_date', direction: 'desc' });

    // Filter
    const filteredExpenses = expenses.filter(exp =>
        exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort
    const sortedExpenses = [...filteredExpenses].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        if (aValue === bValue) return 0;

        const compare = aValue < bValue ? -1 : 1;
        return sortConfig.direction === 'asc' ? compare : -compare;
    });

    const handleSort = (key: keyof Expense) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this expense?")) {
            await deleteExpense(id);
            router.refresh();
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center gap-2">
                <div className="relative max-w-sm flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search expenses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-white border-slate-200 focus:border-indigo-300 focus:ring-indigo-100 transition-all text-sm rounded-lg"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50/80">
                        <TableRow className="border-b border-slate-100 hover:bg-transparent">
                            <TableHead className="w-[150px] cursor-pointer font-semibold text-xs uppercase tracking-wider text-slate-500 pl-4" onClick={() => handleSort('expense_date')}>
                                Date <ArrowUpDown className="inline ml-1 h-3 w-3" />
                            </TableHead>
                            <TableHead className="cursor-pointer font-semibold text-xs uppercase tracking-wider text-slate-500" onClick={() => handleSort('description')}>Description</TableHead>
                            <TableHead className="cursor-pointer font-semibold text-xs uppercase tracking-wider text-slate-500" onClick={() => handleSort('category')}>Category</TableHead>
                            <TableHead className="cursor-pointer font-semibold text-xs uppercase tracking-wider text-slate-500" onClick={() => handleSort('payment_method')}>Paid By</TableHead>
                            <TableHead className="text-right cursor-pointer font-semibold text-xs uppercase tracking-wider text-slate-500 pr-4" onClick={() => handleSort('amount')}>Amount</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedExpenses.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-slate-400 text-sm">
                                    No expenses recorded.
                                </TableCell>
                            </TableRow>
                        ) : (
                            sortedExpenses.map((expense) => (
                                <TableRow key={expense.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0 group">
                                    <TableCell className="font-medium text-slate-500 text-xs pl-4">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-3 w-3 opacity-70" />
                                            {format(new Date(expense.expense_date), 'MMM dd, yyyy')}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium text-slate-700">{expense.description}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="font-medium bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 transition-colors">
                                            {expense.category}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-slate-500 text-sm">{expense.payment_method}</TableCell>
                                    <TableCell className="text-right font-semibold text-slate-900 pr-4">
                                        {formatCurrency(expense.amount)}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 opacity-0 group-hover:opacity-100 transition-all hover:text-slate-700">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-lg shadow-lg border-slate-200">
                                                <DropdownMenuItem onClick={() => handleDelete(expense.id)} className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 cursor-pointer">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-widest text-center py-2">
                Showing {sortedExpenses.length} entries
            </div>
        </div>
    );
}
