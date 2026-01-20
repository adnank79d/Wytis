"use client";

import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Mock Data
const invoices = [
    {
        id: "INV-001",
        client: "Acme Corp",
        amount: "$1,200.00",
        date: "2023-10-25",
        status: "Paid",
    },
    {
        id: "INV-002",
        client: "Globex Inc",
        amount: "$850.50",
        date: "2023-10-28",
        status: "Pending",
    },
    {
        id: "INV-003",
        client: "Soylent Corp",
        amount: "$2,300.00",
        date: "2023-11-01",
        status: "Overdue",
    },
    {
        id: "INV-004",
        client: "Initech",
        amount: "$450.00",
        date: "2023-11-05",
        status: "Paid",
    },
];

export default function BillingPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
                    <p className="text-muted-foreground">Manage invoices and payments.</p>
                </div>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Invoice
                </Button>
            </div>

            {/* Billing Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$3,150.50</div>
                        <p className="text-xs text-muted-foreground">
                            2 invoices pending
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Paid this Month</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$12,450.00</div>
                        <p className="text-xs text-muted-foreground">
                            +12% from last month
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$2,300.00</div>
                        <p className="text-xs text-muted-foreground text-red-500">
                            Action required
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Invoice ID</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoices.map((invoice) => (
                            <TableRow key={invoice.id}>
                                <TableCell className="font-medium">{invoice.id}</TableCell>
                                <TableCell>{invoice.client}</TableCell>
                                <TableCell>{invoice.date}</TableCell>
                                <TableCell>{invoice.amount}</TableCell>
                                <TableCell>
                                    <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${invoice.status === "Paid"
                                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                                : invoice.status === "Pending"
                                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                            }`}
                                    >
                                        {invoice.status}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon">
                                        <Download className="h-4 w-4" />
                                        <span className="sr-only">Download</span>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
