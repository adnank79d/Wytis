"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    MoreHorizontal,
    Search,
    Filter,
    Edit,
    Trash2,
    ArrowUpDown,
    AlertTriangle,
    Package,
    Plus,
    History
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { InventoryProduct, InventoryCategory } from "@/lib/actions/inventory";
import { deleteProduct } from "@/lib/actions/inventory";

interface InventoryTableProps {
    products: InventoryProduct[];
    categories: InventoryCategory[];
    canEdit: boolean;
}

export function InventoryTable({ products, categories, canEdit }: InventoryTableProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [sortConfig, setSortConfig] = useState<{ key: keyof InventoryProduct; direction: 'asc' | 'desc' } | null>(null);

    // Filter Logic
    const filteredProducts = products.filter(product => {
        const matchesSearch =
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) || false);

        const matchesCategory = categoryFilter === 'all' || product.category_id === categoryFilter;

        return matchesSearch && matchesCategory;
    });

    // Sort Logic
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        if (!sortConfig) return 0;

        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === bValue) return 0;

        // Handle nulls
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (aValue < bValue) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        } else {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
    });

    const handleSort = (key: keyof InventoryProduct) => {
        setSortConfig(current => {
            if (current?.key === key) {
                return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'asc' };
        });
    };

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`Are you sure you want to delete ${name}?`)) {
            await deleteProduct(id);
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
            {/* TOOLBAR */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1">
                    <Button
                        variant={categoryFilter === 'all' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCategoryFilter('all')}
                        className="whitespace-nowrap rounded-full text-xs"
                    >
                        All Items
                    </Button>
                    {categories.map(cat => (
                        <Button
                            key={cat.id}
                            variant={categoryFilter === cat.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCategoryFilter(cat.id)}
                            className={cn(
                                "whitespace-nowrap rounded-full text-xs transition-all",
                                categoryFilter === cat.id ? "bg-indigo-600 text-white hover:bg-indigo-700" : "hover:text-indigo-600 hover:border-indigo-200"
                            )}
                        >
                            {cat.name}
                        </Button>
                    ))}
                </div>
            </div>

            {/* TABLE */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-slate-50/50 border-b border-slate-100">
                            <TableHead className="w-[350px] cursor-pointer text-slate-500 font-semibold" onClick={() => handleSort('name')}>
                                Product Details <ArrowUpDown className="inline ml-1 h-3 w-3" />
                            </TableHead>
                            <TableHead className="cursor-pointer text-slate-500 font-semibold" onClick={() => handleSort('category_id')}>Category</TableHead>
                            <TableHead className="cursor-pointer text-slate-500 font-semibold" onClick={() => handleSort('type')}>Type</TableHead>
                            <TableHead className="text-right cursor-pointer text-slate-500 font-semibold" onClick={() => handleSort('cost_price')}>Cost / Sell</TableHead>
                            <TableHead className="text-center cursor-pointer text-slate-500 font-semibold" onClick={() => handleSort('quantity')}>Stock Status</TableHead>
                            <TableHead className="text-right text-slate-500 font-semibold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedProducts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Package className="h-8 w-8 text-slate-300" />
                                        <p>No products found.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            sortedProducts.map((product) => (
                                <TableRow key={product.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-slate-900">{product.name}</span>
                                            {product.sku && (
                                                <span className="text-xs text-slate-500 font-medium">SKU: {product.sku}</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {product.category ? (
                                            <Badge variant="secondary" className="font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 border-0">
                                                {product.category.name}
                                            </Badge>
                                        ) : (
                                            <span className="text-slate-400 text-xs">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {product.type === 'service' ? (
                                            <Badge variant="outline" className="font-medium border-indigo-200 text-indigo-700 bg-indigo-50">
                                                Service
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="font-medium border-emerald-200 text-emerald-700 bg-emerald-50">
                                                Goods
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex flex-col items-end gap-0.5">
                                            <span className="font-bold text-slate-900">{formatCurrency(product.unit_price)}</span>
                                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                                Cost: {formatCurrency(product.cost_price)}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {product.type === 'service' ? (
                                            <span className="text-xs text-slate-400 font-medium italic">N/A</span>
                                        ) : (
                                            <div className="flex justify-center">
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "font-semibold border-0 px-2.5 py-0.5",
                                                        product.quantity <= product.reorder_level
                                                            ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                                                            : product.quantity === 0
                                                                ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                                                : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                                    )}
                                                >
                                                    {product.quantity <= product.reorder_level && (
                                                        <AlertTriangle className="mr-1.5 h-3 w-3" />
                                                    )}
                                                    {product.quantity} {product.unit}
                                                </Badge>
                                            </div>
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
                                                {canEdit && (
                                                    <>
                                                        <DropdownMenuItem onClick={() => router.push(`/inventory/${product.id}`)}>
                                                            <Edit className="mr-2 h-4 w-4" /> Edit Product
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <History className="mr-2 h-4 w-4" /> Stock History
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-red-600 focus:text-red-600"
                                                            onClick={() => handleDelete(product.id, product.name)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                                {!canEdit && (
                                                    <DropdownMenuItem onClick={() => router.push(`/inventory/${product.id}`)}>
                                                        View Details
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
                Showing {sortedProducts.length} products
            </div>
        </div>
    );
}
