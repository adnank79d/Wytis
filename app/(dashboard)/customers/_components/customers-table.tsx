"use client";

import { useState } from "react";
import Link from "next/link";
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
    Search,
    ArrowUpDown,
    Mail,
    Phone,
    Building2,
    MoreHorizontal,
    Edit,
    User
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Customer {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    gst_number: string | null;
    created_at: string;
    stats?: {
        count: number;
        total: number;
    };
}

interface CustomersTableProps {
    customers: Customer[];
    canEdit: boolean;
}

export function CustomersTable({ customers, canEdit }: CustomersTableProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    // Filter Logic
    const filteredCustomers = customers.filter(customer => {
        const matchesSearch =
            customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
            (customer.phone?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
        return matchesSearch;
    });

    // Sort Logic
    const sortedCustomers = [...filteredCustomers].sort((a, b) => {
        if (!sortConfig) return 0;

        let aValue: any = a[sortConfig.key as keyof Customer];
        let bValue: any = b[sortConfig.key as keyof Customer];

        // Handle nested stats access
        if (sortConfig.key === 'total_spent') {
            aValue = a.stats?.total || 0;
            bValue = b.stats?.total || 0;
        }

        if (aValue === bValue) return 0;
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (aValue < bValue) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        } else {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
    });

    const handleSort = (key: string) => {
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

    return (
        <div className="space-y-4 text-left">
            {/* TOOLBAR */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search customers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-white border-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
            </div>

            {/* TABLE */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-slate-50/50 border-b border-slate-100">
                            <TableHead className="w-[300px] cursor-pointer text-slate-500 font-semibold" onClick={() => handleSort('name')}>
                                Customer Name <ArrowUpDown className="inline ml-1 h-3 w-3" />
                            </TableHead>
                            <TableHead className="cursor-pointer text-slate-500 font-semibold" onClick={() => handleSort('email')}>
                                Contact Info
                            </TableHead>
                            <TableHead className="text-right cursor-pointer text-slate-500 font-semibold" onClick={() => handleSort('total_spent')}>
                                Total Billed <ArrowUpDown className="inline ml-1 h-3 w-3" />
                            </TableHead>
                            <TableHead className="text-right text-slate-500 font-semibold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedCustomers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <User className="h-8 w-8 text-slate-300" />
                                        <p>No customers found.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            sortedCustomers.map((customer) => (
                                <TableRow key={customer.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-bold border border-indigo-100">
                                                {customer.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-slate-900">{customer.name}</span>
                                                {customer.gst_number && (
                                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                                        <Building2 className="h-3 w-3" /> {customer.gst_number}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            {customer.email && (
                                                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                                                    {customer.email}
                                                </div>
                                            )}
                                            {customer.phone && (
                                                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                                                    {customer.phone}
                                                </div>
                                            )}
                                            {!customer.email && !customer.phone && (
                                                <span className="text-xs text-slate-400 italic">No contact info</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {customer.stats ? (
                                            <div className="flex flex-col items-end">
                                                <span className="font-bold text-slate-900">{formatCurrency(customer.stats.total)}</span>
                                                <Badge variant="outline" className="text-[10px] px-1.5 h-4 border-slate-200 text-slate-500 font-normal">
                                                    {customer.stats.count} inv
                                                </Badge>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 text-sm">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => router.push(`/customers/${customer.id}`)}>
                                                    <User className="mr-2 h-4 w-4" /> View Details
                                                </DropdownMenuItem>
                                                {canEdit && (
                                                    <DropdownMenuItem onClick={() => router.push(`/customers/${customer.id}/edit`)}>
                                                        <Edit className="mr-2 h-4 w-4" /> Edit Customer
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="text-xs text-muted-foreground text-center">
                Showing {sortedCustomers.length} of {customers.length} customers
            </div>
        </div>
    );
}
