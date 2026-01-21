"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Package } from "lucide-react";
import { addProduct, ProductFormState, InventoryCategory } from "@/lib/actions/inventory";

interface AddProductFormProps {
    categories: InventoryCategory[];
}

export function AddProductForm({ categories }: AddProductFormProps) {
    const initialState: ProductFormState = { message: null, errors: {} };
    const [state, formAction, isPending] = useActionState(addProduct, initialState);

    return (
        <form action={formAction} className="space-y-6">
            {state.message && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm font-medium">
                    {state.message}
                </div>
            )}

            <Card className="rounded-xl md:rounded-2xl border border-border/40 shadow-sm">
                <CardHeader className="pb-4">
                    <CardTitle className="text-base md:text-lg font-semibold">Product Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium">Product Name *</Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder="e.g. Widget Pro"
                            required
                            className="h-11 bg-background border-border/60 rounded-lg"
                        />
                        {state.errors?.name && (
                            <p className="text-xs text-red-500">{state.errors.name[0]}</p>
                        )}
                    </div>

                    {/* SKU & Category */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="sku" className="text-sm font-medium">SKU</Label>
                            <Input
                                id="sku"
                                name="sku"
                                placeholder="e.g. WGT-PRO-001"
                                className="h-11 bg-background border-border/60 rounded-lg uppercase"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category_id" className="text-sm font-medium">Category</Label>
                            <Select name="category_id">
                                <SelectTrigger className="h-11 bg-background border-border/60 rounded-lg">
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
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                        <Textarea
                            id="description"
                            name="description"
                            placeholder="Product description..."
                            rows={3}
                            className="bg-background border-border/60 rounded-lg resize-none"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-xl md:rounded-2xl border border-border/40 shadow-sm">
                <CardHeader className="pb-4">
                    <CardTitle className="text-base md:text-lg font-semibold">Pricing & Stock</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Prices */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="unit_price" className="text-sm font-medium">Selling Price *</Label>
                            <Input
                                id="unit_price"
                                name="unit_price"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                required
                                className="h-11 bg-background border-border/60 rounded-lg"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cost_price" className="text-sm font-medium">Cost Price</Label>
                            <Input
                                id="cost_price"
                                name="cost_price"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                className="h-11 bg-background border-border/60 rounded-lg"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="unit" className="text-sm font-medium">Unit</Label>
                            <Select name="unit" defaultValue="pcs">
                                <SelectTrigger className="h-11 bg-background border-border/60 rounded-lg">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pcs">Pieces</SelectItem>
                                    <SelectItem value="kg">Kilograms</SelectItem>
                                    <SelectItem value="ltr">Liters</SelectItem>
                                    <SelectItem value="box">Boxes</SelectItem>
                                    <SelectItem value="pack">Packs</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Stock */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="quantity" className="text-sm font-medium">Initial Stock</Label>
                            <Input
                                id="quantity"
                                name="quantity"
                                type="number"
                                min="0"
                                defaultValue="0"
                                className="h-11 bg-background border-border/60 rounded-lg"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reorder_level" className="text-sm font-medium">Reorder Level</Label>
                            <Input
                                id="reorder_level"
                                name="reorder_level"
                                type="number"
                                min="0"
                                defaultValue="10"
                                className="h-11 bg-background border-border/60 rounded-lg"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-xl md:rounded-2xl border border-border/40 shadow-sm">
                <CardHeader className="pb-4">
                    <CardTitle className="text-base md:text-lg font-semibold">Tax Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="hsn_code" className="text-sm font-medium">HSN Code</Label>
                            <Input
                                id="hsn_code"
                                name="hsn_code"
                                placeholder="e.g. 8471"
                                className="h-11 bg-background border-border/60 rounded-lg"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gst_rate" className="text-sm font-medium">GST Rate (%)</Label>
                            <Select name="gst_rate" defaultValue="18">
                                <SelectTrigger className="h-11 bg-background border-border/60 rounded-lg">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">0%</SelectItem>
                                    <SelectItem value="5">5%</SelectItem>
                                    <SelectItem value="12">12%</SelectItem>
                                    <SelectItem value="18">18%</SelectItem>
                                    <SelectItem value="28">28%</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="outline" asChild className="rounded-lg">
                    <Link href="/inventory">Cancel</Link>
                </Button>
                <Button
                    type="submit"
                    disabled={isPending}
                    className="rounded-lg px-6 bg-gradient-to-r from-primary to-primary/90"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adding...
                        </>
                    ) : (
                        <>
                            <Package className="mr-2 h-4 w-4" />
                            Add Product
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
