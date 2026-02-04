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
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search employees..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-9 border-slate-200 bg-white shadow-sm transition-all focus:ring-indigo-500/20"
                        />
                    </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 items-center">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-2 hidden sm:inline-block">Filter:</span>
                    {departments.map(dept => (
                        <Button
                            key={String(dept)}
                            variant={deptFilter === dept ? "default" : "outline"}
                            size="sm"
                            onClick={() => setDeptFilter(String(dept))}
                            className={`whitespace-nowrap rounded-full text-xs h-7 px-3 ${deptFilter === dept
                                    ? "bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
                                    : "text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                        >
                            {String(dept)}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50/80">
                        <TableRow className="border-b border-slate-100 hover:bg-transparent">
                            <TableHead className="w-[50px] font-semibold text-xs uppercase tracking-wider text-slate-500">#</TableHead>
                            <TableHead className="cursor-pointer font-semibold text-xs uppercase tracking-wider text-slate-500" onClick={() => handleSort('first_name')}>
                                Name <ArrowUpDown className="inline ml-1 h-3 w-3 text-slate-400" />
                            </TableHead>
                            <TableHead className="cursor-pointer font-semibold text-xs uppercase tracking-wider text-slate-500" onClick={() => handleSort('designation')}>Designation</TableHead>
                            <TableHead className="cursor-pointer font-semibold text-xs uppercase tracking-wider text-slate-500" onClick={() => handleSort('department')}>Department</TableHead>
                            <TableHead className="cursor-pointer font-semibold text-xs uppercase tracking-wider text-slate-500" onClick={() => handleSort('status')}>Status</TableHead>
                            <TableHead className="text-right cursor-pointer font-semibold text-xs uppercase tracking-wider text-slate-500" onClick={() => handleSort('salary_amount')}>Salary</TableHead>
                            <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-slate-500">Joined</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sorted.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-32 text-center text-slate-400">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <UserX className="h-8 w-8 opacity-20" />
                                        <p>No employees found matching criteria.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            sorted.map((emp, index) => (
                                <TableRow key={emp.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0 group">
                                    <TableCell className="text-slate-400 font-mono text-xs">{index + 1}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">{emp.first_name} {emp.last_name}</span>
                                            <span className="text-xs text-slate-500">{emp.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-600 text-sm font-medium">{emp.designation || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 font-normal">
                                            {emp.department || '-'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={emp.status === 'active' ? 'default' : 'secondary'}
                                            className={`capitalize shadow-none border-0 ${emp.status === 'active'
                                                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                                }`}
                                        >
                                            {emp.status.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-semibold text-slate-700">{formatCurrency(emp.salary_amount)}</TableCell>
                                    <TableCell className="text-right text-slate-500 text-sm">
                                        {format(new Date(emp.joined_at), 'MMM yyyy')}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                <DropdownMenuLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleEdit(emp)} className="cursor-pointer">
                                                    <Edit className="mr-2 h-4 w-4 text-slate-500" /> Edit Details
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-rose-600 focus:text-rose-700 focus:bg-rose-50 cursor-pointer">
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

            <div className="flex justify-between items-center text-xs text-slate-400 px-1">
                <span>Showing {sorted.length} employees</span>
                <span>Pro Tip: Use filters to quickly find by department.</span>
            </div>

            <EditEmployeeDialog
                employee={editingEmployee}
                open={editOpen}
                onOpenChange={setEditOpen}
            />
        </div>
    );
}
