"use client";

import { useState } from "react";
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
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Search,
    MoreHorizontal,
    Filter,
    Phone,
    Mail
} from "lucide-react";
import { CustomerSheet } from "./customer-sheet";
import type { Customer } from "@/lib/actions/crm";
import { cn } from "@/lib/utils";

interface CustomersTableProps {
    customers: Customer[];
}

export function CustomersTable({ customers }: CustomersTableProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);

    // Filter Logic
    const filtered = customers.filter(c => {
        const matchesSearch =
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.company_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (c.email?.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus = statusFilter === "All" || c.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const handleRowClick = (c: Customer) => {
        setSelectedCustomer(c);
        setSheetOpen(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'lead': return 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200';
            case 'prospect': return 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200';
            case 'customer': return 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200';
            case 'inactive': return 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200';
            default: return 'bg-slate-100 text-slate-700 hover:bg-slate-200';
        }
    };

    return (
        <div className="space-y-0">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between px-4 py-4 border-b border-slate-100 bg-slate-50/50">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search customers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-white border-slate-200 focus:border-indigo-300 focus:ring-indigo-100 transition-all text-sm rounded-lg"
                    />
                </div>

                <div className="flex gap-2">
                    {['All', 'lead', 'prospect', 'customer'].map(status => (
                        <Button
                            key={status}
                            variant="ghost"
                            size="sm"
                            onClick={() => setStatusFilter(status)}
                            className={cn(
                                "capitalize rounded-md text-xs font-medium px-3 transition-all",
                                statusFilter === status
                                    ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
                            )}
                        >
                            {status}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div>
                <Table>
                    <TableHeader className="bg-slate-50/80">
                        <TableRow className="border-b border-slate-100 hover:bg-transparent">
                            <TableHead className="w-[50px] font-semibold text-xs uppercase tracking-wider text-slate-500 pl-4">#</TableHead>
                            <TableHead className="font-semibold text-xs uppercase tracking-wider text-slate-500">Name / Company</TableHead>
                            <TableHead className="font-semibold text-xs uppercase tracking-wider text-slate-500">Contact</TableHead>
                            <TableHead className="font-semibold text-xs uppercase tracking-wider text-slate-500">Status</TableHead>
                            <TableHead className="font-semibold text-xs uppercase tracking-wider text-slate-500">Tags</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-slate-400 text-sm">
                                    No customers found matching your criteria.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((customer, index) => (
                                <TableRow
                                    key={customer.id}
                                    className="cursor-pointer hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0 group"
                                    onClick={() => handleRowClick(customer)}
                                >
                                    <TableCell className="text-xs text-slate-400 font-mono pl-4">
                                        {index + 1}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">{customer.name}</span>
                                            {customer.company_name && (
                                                <span className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                                    <Building className="h-3 w-3 opacity-70" /> {customer.company_name}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1.5">
                                            {customer.email && (
                                                <span className="text-xs flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 transition-colors">
                                                    <Mail className="h-3 w-3 opacity-70" /> {customer.email}
                                                </span>
                                            )}
                                            {customer.phone && (
                                                <span className="text-xs flex items-center gap-1.5 text-slate-500">
                                                    <Phone className="h-3 w-3 opacity-70" /> {customer.phone}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={cn("border rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase shadow-none", getStatusColor(customer.status))} variant="secondary">
                                            {customer.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1.5 flex-wrap">
                                            {customer.tags && customer.tags.slice(0, 2).map(tag => (
                                                <span key={tag} className="px-1.5 py-0.5 bg-slate-50 rounded text-[10px] font-medium text-slate-600 border border-slate-200">
                                                    {tag}
                                                </span>
                                            ))}
                                            {customer.tags && customer.tags.length > 2 && (
                                                <span className="text-[10px] text-slate-400 font-medium self-center">+{customer.tags.length - 2}</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 opacity-0 group-hover:opacity-100 transition-all hover:text-slate-700">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <CustomerSheet
                customer={selectedCustomer}
                open={sheetOpen}
                onOpenChange={setSheetOpen}
            />
        </div>
    );
}

// Importing icons here to avoid 'Building' is not defined if it was missed above
import { Building } from "lucide-react";
