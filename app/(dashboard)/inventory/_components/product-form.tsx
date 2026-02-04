"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Package, Save, Boxes, Briefcase } from "lucide-react";
import { addProduct, updateProduct, ProductFormState, InventoryCategory, InventoryProduct } from "@/lib/actions/inventory";
import { CreateCategoryDialog } from "./create-category-dialog";
import { cn } from "@/lib/utils";

interface ProductFormProps {
    categories: InventoryCategory[];
    product?: InventoryProduct | null; // If provided, we are in Edit mode
}

export function ProductForm({ categories, product }: ProductFormProps) {
    const isEdit = !!product;
    const [type, setType] = useState<'goods' | 'service'>(product?.type || 'goods');

    // Wrapper around server actions to determine if we are adding or updating
    const action = isEdit
        ? updateProduct.bind(null, product.id)
        : addProduct;

    const initialState: ProductFormState = { message: null, errors: {} };
    const [state, formAction, isPending] = useActionState(action, initialState);

    return (
        <form action={formAction} className="space-y-6 max-w-4xl mx-auto">
            {state.message && (
                <div className={cn("p-4 rounded-xl border text-sm font-medium animate-in fade-in slide-in-from-top-2",
                    state.message.includes("success")
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-red-50 border-red-200 text-red-700"
                )}>
                    {state.message}
                </div>
            )}

            <Card className="rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="pb-4 bg-slate-50/50 border-b border-slate-100">
                    <CardTitle className="text-base md:text-lg font-semibold text-slate-900">
                        {isEdit ? "Edit Product Details" : "Product Details"}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                    {/* Type Selector - Custom Implementation */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium text-slate-700">Product Type</Label>
                        <input type="hidden" name="type" value={type} />
                        <div className="grid grid-cols-2 gap-4">
                            <div
                                onClick={() => setType('goods')}
                                className={cn(
                                    "flex flex-col items-center justify-between rounded-md border-2 bg-white p-4 cursor-pointer transition-all hover:bg-slate-50",
                                    type === 'goods' ? "border-indigo-600 text-indigo-600 ring-1 ring-indigo-600/20" : "border-muted text-slate-600"
                                )}
                            >
                                <Boxes className="mb-2 h-6 w-6" />
                                <span className="font-semibold">Goods</span>
                                <span className="text-xs text-slate-500 font-normal mt-1">Physical items with stock</span>
                            </div>
                            <div
                                onClick={() => setType('service')}
                                className={cn(
                                    "flex flex-col items-center justify-between rounded-md border-2 bg-white p-4 cursor-pointer transition-all hover:bg-slate-50",
                                    type === 'service' ? "border-indigo-600 text-indigo-600 ring-1 ring-indigo-600/20" : "border-muted text-slate-600"
                                )}
                            >
                                <Briefcase className="mb-2 h-6 w-6" />
                                <span className="font-semibold">Service</span>
                                <span className="text-xs text-slate-500 font-normal mt-1">Services or non-stock items</span>
                            </div>
                        </div>
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium text-slate-700">Product Name *</Label>
                        <Input
                            id="name"
                            name="name"
                            defaultValue={product?.name || ""}
                            placeholder="e.g. Widget Pro"
                            required
                            className="h-10 border-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        {state.errors?.name && (
                            <p className="text-xs text-red-600">{state.errors.name[0]}</p>
                        )}
                    </div>

                    {/* SKU & Category */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="sku" className="text-sm font-medium text-slate-700">SKU</Label>
                            <Input
                                id="sku"
                                name="sku"
                                defaultValue={product?.sku || ""}
                                placeholder="e.g. WGT-PRO-001"
                                className="h-10 border-slate-200 uppercase placeholder:normal-case font-mono text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category_id" className="text-sm font-medium text-slate-700">Category</Label>
                            <div className="flex gap-2">
                                <Select name="category_id" defaultValue={product?.category_id || undefined}>
                                    <SelectTrigger className="h-10 border-slate-200 focus:ring-indigo-500 focus:border-indigo-500">
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <CreateCategoryDialog />
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-sm font-medium text-slate-700">Description</Label>
                        <Textarea
                            id="description"
                            name="description"
                            defaultValue={product?.description || ""}
                            placeholder="Product description..."
                            rows={3}
                            className="border-slate-200 resize-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="pb-4 bg-slate-50/50 border-b border-slate-100">
                    <CardTitle className="text-base md:text-lg font-semibold text-slate-900">Pricing & Stock</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                    {/* Prices */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="unit_price" className="text-sm font-medium text-slate-700">Selling Price *</Label>
                            <Input
                                id="unit_price"
                                name="unit_price"
                                type="number"
                                step="0.01"
                                min="0"
                                defaultValue={product?.unit_price || ""}
                                placeholder="0.00"
                                required
                                className="h-10 border-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cost_price" className="text-sm font-medium text-slate-700">Cost Price</Label>
                            <Input
                                id="cost_price"
                                name="cost_price"
                                type="number"
                                step="0.01"
                                min="0"
                                defaultValue={product?.cost_price || ""}
                                placeholder="0.00"
                                className="h-10 border-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="unit" className="text-sm font-medium text-slate-700">Unit</Label>
                            <Select name="unit" defaultValue={product?.unit || "pcs"}>
                                <SelectTrigger className="h-10 border-slate-200 focus:ring-indigo-500 focus:border-indigo-500">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pcs">Pieces</SelectItem>
                                    <SelectItem value="box">Boxes</SelectItem>
                                    <SelectItem value="kg">Kilograms</SelectItem>
                                    <SelectItem value="ltr">Liters</SelectItem>
                                    <SelectItem value="pack">Packs</SelectItem>
                                    <SelectItem value="hr">Hours</SelectItem>
                                    <SelectItem value="day">Days</SelectItem>
                                    <SelectItem value="service">Service</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Stock - Only for Goods */}
                    {type === 'goods' && (
                        <div className="grid grid-cols-2 gap-6 pt-2 animate-in fade-in slide-in-from-top-1">
                            <div className="space-y-2">
                                <Label htmlFor="quantity" className="text-sm font-medium text-slate-700">
                                    {isEdit ? "Current Stock" : "Initial Stock"}
                                </Label>
                                <Input
                                    id="quantity"
                                    name="quantity"
                                    type="number"
                                    min="0"
                                    defaultValue={product?.quantity || "0"}
                                    className="h-10 border-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reorder_level" className="text-sm font-medium text-slate-700">Reorder Level</Label>
                                <Input
                                    id="reorder_level"
                                    name="reorder_level"
                                    type="number"
                                    min="0"
                                    defaultValue={product?.reorder_level || "10"}
                                    className="h-10 border-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="pb-4 bg-slate-50/50 border-b border-slate-100">
                    <CardTitle className="text-base md:text-lg font-semibold text-slate-900">Tax Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="hsn_code" className="text-sm font-medium text-slate-700">HSN/SAC Code</Label>
                            <Input
                                id="hsn_code"
                                name="hsn_code"
                                defaultValue={product?.hsn_code || ""}
                                placeholder="e.g. 8471"
                                className="h-10 border-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gst_rate" className="text-sm font-medium text-slate-700">GST Rate (%)</Label>
                            <Select name="gst_rate" defaultValue={product?.gst_rate.toString() || "18"}>
                                <SelectTrigger className="h-10 border-slate-200 focus:ring-indigo-500 focus:border-indigo-500">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">0% (Exempt)</SelectItem>
                                    <SelectItem value="5">5%</SelectItem>
                                    <SelectItem value="12">12%</SelectItem>
                                    <SelectItem value="18">18% (Standard)</SelectItem>
                                    <SelectItem value="28">28% (Luxury)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 pt-2 p-3 bg-slate-50/50 rounded-lg border border-slate-100">
                        <input type="hidden" name="prices_include_tax" value={String(product?.prices_include_tax || false)} id="prices_include_tax_input" />
                        <Switch
                            defaultChecked={!!product?.prices_include_tax}
                            onCheckedChange={(checked) => {
                                const input = document.getElementById('prices_include_tax_input') as HTMLInputElement;
                                if (input) input.value = String(checked);
                            }}
                        />
                        <Label htmlFor="prices_include_tax" className="text-sm font-medium text-slate-700">Prices are Inclusive of Tax</Label>
                    </div>
                </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-8">
                <Button type="button" variant="outline" asChild className="rounded-lg h-10 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50">
                    <Link href={isEdit ? `/inventory/${product.id}` : "/inventory"}>Cancel</Link>
                </Button>
                <Button
                    type="submit"
                    disabled={isPending}
                    className="rounded-lg h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {isEdit ? "Saving..." : "Adding..."}
                        </>
                    ) : (
                        <>
                            {isEdit ? <Save className="mr-2 h-4 w-4" /> : <Package className="mr-2 h-4 w-4" />}
                            {isEdit ? "Save Changes" : "Add Product"}
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
