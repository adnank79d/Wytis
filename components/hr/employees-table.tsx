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
    DropdownMenuLabel,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
    Search,
    MoreHorizontal,
    Edit,
    UserX,
    Filter,
    ArrowUpDown
} from "lucide-react";
import { format } from "date-fns";
import type { Employee } from "@/lib/actions/hr";
import { EditEmployeeDialog } from "./edit-employee-dialog";

interface EmployeesTableProps {
    employees: Employee[];
}

export function EmployeesTable({ employees }: EmployeesTableProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [deptFilter, setDeptFilter] = useState("All");
    const [sortConfig, setSortConfig] = useState<{ key: keyof Employee; direction: 'asc' | 'desc' } | null>(null);

    // For Edit Dialog
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [editOpen, setEditOpen] = useState(false);

    // Unique departments
    const departments = ["All", ...Array.from(new Set(employees.map(e => e.department).filter(Boolean)))];

    // Filter Logic
    const filtered = employees.filter(e => {
        const matchesSearch =
            e.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.email?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesDept = deptFilter === "All" || e.department === deptFilter;

        return matchesSearch && matchesDept;
    });

    // Sort Logic
    const sorted = [...filtered].sort((a, b) => {
        if (!sortConfig) return 0;
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];

        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        return sortConfig.direction === 'asc' ? 1 : -1;
    });

    const handleSort = (key: keyof Employee) => {
        setSortConfig(current => ({
            key,
            direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleEdit = (employee: Employee) => {
        setEditingEmployee(employee);
        setEditOpen(true);
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
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex items-center gap-2 flex-1">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search employees..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1">
                    {departments.map(dept => (
                        <Button
                            key={String(dept)}
                            variant={deptFilter === dept ? "default" : "outline"}
                            size="sm"
                            onClick={() => setDeptFilter(String(dept))}
                            className="whitespace-nowrap rounded-full text-xs"
                        >
                            {String(dept)}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('first_name')}>
                                Name <ArrowUpDown className="inline ml-1 h-3 w-3" />
                            </TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('designation')}>Designation</TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('department')}>Department</TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>Status</TableHead>
                            <TableHead className="text-right cursor-pointer" onClick={() => handleSort('salary_amount')}>Salary</TableHead>
                            <TableHead className="text-right">Joined</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sorted.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    No employees found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            sorted.map((emp) => (
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
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleEdit(emp)}>
                                                    <Edit className="mr-2 h-4 w-4" /> Edit Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-amber-600 focus:text-amber-600">
                                                    <UserX className="mr-2 h-4 w-4" /> Mark Inactive
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

            <div className="text-xs text-muted-foreground text-center">
                Showing {sorted.length} employees
            </div>

            <EditEmployeeDialog
                employee={editingEmployee}
                open={editOpen}
                onOpenChange={setEditOpen}
            />
        </div>
    );
}
