"use client";

import { useState } from "react";
import Link from "next/link";
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
    Search,
    ArrowUpDown,
    ArrowDownLeft,
    ArrowUpRight,
    Wallet,
    CreditCard,
    Banknote,
    FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Payment {
    id: string;
    payment_type: 'received' | 'made';
    party_name: string;
    amount: number;
    payment_date: string;
    payment_method: string;
    status: string;
    reference: string | null;
    notes: string | null;
    invoice?: {
        invoice_number: string;
    } | null;
}

interface PaymentsTableProps {
    payments: Payment[];
    canEdit: boolean;
}

export function PaymentsTable({ payments, canEdit }: PaymentsTableProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState<'all' | 'received' | 'made'>("all");
    const [sortConfig, setSortConfig] = useState<{ key: keyof Payment; direction: 'asc' | 'desc' } | null>(null);

    // Filter Logic
    const filteredPayments = payments.filter(payment => {
        const matchesSearch =
            payment.party_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (payment.reference?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
            (payment.invoice?.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) || false);

        const matchesType = typeFilter === 'all' || payment.payment_type === typeFilter;

        return matchesSearch && matchesType;
    });

    // Sort Logic
    const sortedPayments = [...filteredPayments].sort((a, b) => {
        // ... sort logic ...
        if (!sortConfig) return 0;

        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === bValue) return 0;
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (aValue < bValue) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        } else {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
    });

    // ... helper functions ...
    const handleSort = (key: keyof Payment) => {
        setSortConfig(current => {
            if (current?.key === key) {
                return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'asc' };
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge variant="default" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-0">Completed</Badge>;
            case 'pending':
                return <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-0">Pending</Badge>;
            case 'failed':
                return <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-200 border-0">Failed</Badge>;
            default:
                return <Badge variant="outline" className="text-slate-600">{status}</Badge>;
        }
    };

    const getMethodIcon = (method: string) => {
        switch (method) {
            case 'upi': return <Wallet className="h-4 w-4" />;
            case 'card': return <CreditCard className="h-4 w-4" />;
            case 'bank': return <Banknote className="h-4 w-4" />;
            default: return <Banknote className="h-4 w-4" />;
        }
    };

    return (
        <div className="space-y-4 text-left">
            {/* TOOLBAR */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search payments..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-white border-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1">
                    <Button
                        variant={typeFilter === 'all' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTypeFilter('all')}
                        className={cn("whitespace-nowrap rounded-full text-xs", typeFilter === 'all' ? "bg-slate-900" : "text-slate-600")}
                    >
                        All
                    </Button>
                    <Button
                        variant={typeFilter === 'received' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTypeFilter('received')}
                        className={cn(
                            "whitespace-nowrap rounded-full text-xs transition-all",
                            typeFilter === 'received' ? "bg-emerald-600 text-white hover:bg-emerald-700" : "hover:text-emerald-600 hover:border-emerald-200 text-slate-600 border-slate-200"
                        )}
                    >
                        Received
                    </Button>
                    <Button
                        variant={typeFilter === 'made' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTypeFilter('made')}
                        className={cn(
                            "whitespace-nowrap rounded-full text-xs transition-all",
                            typeFilter === 'made' ? "bg-rose-600 text-white hover:bg-rose-700" : "hover:text-rose-600 hover:border-rose-200 text-slate-600 border-slate-200"
                        )}
                    >
                        Paid Out
                    </Button>
                </div>
            </div>

            {/* TABLE */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-slate-50/50 border-b border-slate-100">
                            <TableHead className="w-[150px] cursor-pointer text-slate-500 font-semibold" onClick={() => handleSort('payment_date')}>
                                Date <ArrowUpDown className="inline ml-1 h-3 w-3" />
                            </TableHead>
                            <TableHead className="cursor-pointer text-slate-500 font-semibold" onClick={() => handleSort('party_name')}>
                                Party Name <ArrowUpDown className="inline ml-1 h-3 w-3" />
                            </TableHead>
                            <TableHead className="cursor-pointer text-slate-500 font-semibold" onClick={() => handleSort('payment_type')}>
                                Type <ArrowUpDown className="inline ml-1 h-3 w-3" />
                            </TableHead>
                            <TableHead className="cursor-pointer text-slate-500 font-semibold text-center" onClick={() => handleSort('payment_method')}>
                                Method
                            </TableHead>
                            <TableHead className="text-right cursor-pointer text-slate-500 font-semibold" onClick={() => handleSort('amount')}>
                                Amount <ArrowUpDown className="inline ml-1 h-3 w-3" />
                            </TableHead>
                            <TableHead className="text-center cursor-pointer text-slate-500 font-semibold" onClick={() => handleSort('status')}>
                                Status
                            </TableHead>
                            {/* <TableHead className="text-right text-slate-500 font-semibold">Actions</TableHead> */}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedPayments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Wallet className="h-8 w-8 text-slate-300" />
                                        <p>No payments found.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            sortedPayments.map((payment) => (
                                <TableRow key={payment.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
                                    <TableCell className="font-medium text-slate-700">
                                        {formatDate(payment.payment_date)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-slate-900">{payment.party_name}</span>
                                            {payment.invoice && (
                                                <div className="flex items-center gap-1 text-xs text-indigo-600 font-medium">
                                                    <FileText className="h-3 w-3" /> #{payment.invoice.invoice_number}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "p-1.5 rounded-md",
                                                payment.payment_type === 'received' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                                            )}>
                                                {payment.payment_type === 'received' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                                            </div>
                                            <span className={cn(
                                                "text-sm font-medium",
                                                payment.payment_type === 'received' ? "text-emerald-700" : "text-rose-700"
                                            )}>
                                                {payment.payment_type === 'received' ? "Received" : "Paid Out"}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-1.5 text-slate-600 bg-slate-100 px-2 py-1 rounded-md w-fit mx-auto text-xs font-medium capitalize">
                                            {getMethodIcon(payment.payment_method)}
                                            {payment.payment_method}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className={cn(
                                            "font-bold",
                                            payment.payment_type === 'received' ? "text-emerald-600" : "text-slate-900"
                                        )}>
                                            {payment.payment_type === 'received' ? '+' : '-'} {formatCurrency(payment.amount)}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="inline-flex justify-center">
                                            {getStatusBadge(payment.status)}
                                        </div>
                                    </TableCell>
                                    {/* Actions placeholder if needed */}
                                    {/* <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </TableCell> */}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="text-xs text-muted-foreground text-center">
                Showing {sortedPayments.length} of {payments.length} records
            </div>
        </div>
    );
}
