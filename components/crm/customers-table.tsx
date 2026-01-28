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
            case 'lead': return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
            case 'prospect': return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
            case 'customer': return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100';
            case 'inactive': return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search customers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <div className="flex gap-2">
                    {['All', 'lead', 'prospect', 'customer'].map(status => (
                        <Button
                            key={status}
                            variant={statusFilter === status ? "default" : "outline"}
                            size="sm"
                            onClick={() => setStatusFilter(status)}
                            className="capitalize rounded-full text-xs"
                        >
                            {status}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name / Company</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Tags</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No customers found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((customer) => (
                                <TableRow
                                    key={customer.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleRowClick(customer)}
                                >
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{customer.name}</span>
                                            {customer.company_name && (
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Building className="h-3 w-3" /> {customer.company_name}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            {customer.email && (
                                                <span className="text-xs flex items-center gap-1 text-muted-foreground">
                                                    <Mail className="h-3 w-3" /> {customer.email}
                                                </span>
                                            )}
                                            {customer.phone && (
                                                <span className="text-xs flex items-center gap-1 text-muted-foreground">
                                                    <Phone className="h-3 w-3" /> {customer.phone}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={getStatusColor(customer.status)} variant="secondary">
                                            {customer.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1 flex-wrap">
                                            {customer.tags && customer.tags.slice(0, 2).map(tag => (
                                                <span key={tag} className="px-1.5 py-0.5 bg-muted rounded text-[10px] text-muted-foreground border">
                                                    {tag}
                                                </span>
                                            ))}
                                            {customer.tags && customer.tags.length > 2 && (
                                                <span className="text-[10px] text-muted-foreground">+{customer.tags.length - 2}</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
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
