"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { Employee } from "@/lib/actions/hr";

interface EmployeesTableProps {
    employees: Employee[];
}

export function EmployeesTable({ employees }: EmployeesTableProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Designation</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Salary</TableHead>
                        <TableHead className="text-right">Joined</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {employees.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                No employees found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        employees.map((emp) => (
                            <TableRow key={emp.id}>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{emp.first_name} {emp.last_name}</span>
                                        <span className="text-xs text-muted-foreground">{emp.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{emp.designation || '-'}</TableCell>
                                <TableCell>{emp.department || '-'}</TableCell>
                                <TableCell>
                                    <Badge variant={emp.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                                        {emp.status.replace('_', ' ')}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right font-medium">{formatCurrency(emp.salary_amount)}</TableCell>
                                <TableCell className="text-right text-muted-foreground text-sm">
                                    {format(new Date(emp.joined_at), 'MMM yyyy')}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
