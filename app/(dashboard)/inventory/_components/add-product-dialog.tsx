"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
    Plus,
    Loader2,
    Package,
    Boxes,
    Briefcase,
    Tag,
    Barcode,
    FolderOpen,
    IndianRupee,
    Layers,
    FileCode,
    Percent
} from "lucide-react";
import { addProduct, ProductFormState, InventoryCategory } from "@/lib/actions/inventory";
import { cn } from "@/lib/utils";
import { CreateCategoryDialog } from "./create-category-dialog";

interface AddProductDialogProps {
    categories: InventoryCategory[];
}

export function AddProductDialog({ categories }: AddProductDialogProps) {
    const [open, setOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [type, setType] = useState<'goods' | 'service'>('goods');
    const [state, setState] = useState<ProductFormState>({ message: null, errors: {} });
    const router = useRouter();

    async function handleSubmit(formData: FormData) {
        setIsPending(true);
        try {
            const result = await addProduct({ message: null, errors: {} }, formData);
            setState(result);

            if (!result.errors && !result.message?.includes("Failed")) {
                setOpen(false);
                router.refresh();
            }
        } catch (error) {
            console.error("Failed to add product", error);
        } finally {
            setIsPending(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="h-9 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow transition-all">
                    <Plus className="mr-1.5 h-4 w-4" /> Add Product
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-0 gap-0">
                <DialogHeader className="p-6 pb-4 border-b border-border/50">
                    <DialogTitle className="text-xl">Add New Product</DialogTitle>
                    <DialogDescription>
                        Details for your inventory item or service.
                    </DialogDescription>
                </DialogHeader>

                <form action={handleSubmit}>
                    <div className="p-6 space-y-6">
                        {/* Product Type Toggle */}
                        <div className="space-y-3">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product Type</Label>
                            <input type="hidden" name="type" value={type} />
                            <div className="grid grid-cols-2 gap-4">
                                <div
                                    onClick={() => setType('goods')}
                                    className={cn(
                                        "flex flex-row items-center gap-3 rounded-lg border-2 bg-white p-3 cursor-pointer transition-all hover:bg-indigo-50/30",
                                        type === 'goods' ? "border-indigo-600 bg-indigo-50/50" : "border-slate-100"
                                    )}
                                >
                                    <div className={cn("p-2 rounded-md", type === 'goods' ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500")}>
                                        <Boxes className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <span className={cn("block font-semibold text-sm", type === 'goods' ? "text-indigo-900" : "text-slate-600")}>Goods</span>
                                        <span className="text-xs text-slate-500">Physical item with stock</span>
                                    </div>
                                </div>
                                <div
                                    onClick={() => setType('service')}
                                    className={cn(
                                        "flex flex-row items-center gap-3 rounded-lg border-2 bg-white p-3 cursor-pointer transition-all hover:bg-indigo-50/30",
                                        type === 'service' ? "border-indigo-600 bg-indigo-50/50" : "border-slate-100"
                                    )}
                                >
                                    <div className={cn("p-2 rounded-md", type === 'service' ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500")}>
                                        <Briefcase className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <span className={cn("block font-semibold text-sm", type === 'service' ? "text-indigo-900" : "text-slate-600")}>Service</span>
                                        <span className="text-xs text-slate-500">Non-stock service item</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Basic Details */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                                <Tag className="h-4 w-4 text-indigo-600" />
                                <h4 className="text-sm font-semibold text-foreground">Basic Information</h4>
                            </div>

                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product Name *</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder={type === 'goods' ? "e.g. Wireless Mouse" : "e.g. Consulting Hour"}
                                        required
                                        className="h-10 border-slate-200"
                                    />
                                    {state.errors?.name && (
                                        <p className="text-xs text-red-500">{state.errors.name[0]}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="sku" className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            <Barcode className="h-3 w-3" /> SKU
                                        </Label>
                                        <Input
                                            id="sku"
                                            name="sku"
                                            placeholder="Auto-generated if empty"
                                            className="h-10 border-slate-200 font-mono uppercase text-xs"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="category_id" className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            <FolderOpen className="h-3 w-3" /> Category
                                        </Label>
                                        <div className="flex gap-2">
                                            <Select name="category_id">
                                                <SelectTrigger className="h-10 border-slate-200">
                                                    <SelectValue placeholder="Select..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categories.map((cat) => (
                                                        <SelectItem key={cat.id} value={cat.id}>
                                                            {cat.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {/* Reusing existing dialog component - might need check if it works nested */}
                                            {/* <CreateCategoryDialog />  - Skipping nested dialog for simplicity in popup form unless requested */}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pricing & Stock */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                                <IndianRupee className="h-4 w-4 text-indigo-600" />
                                <h4 className="text-sm font-semibold text-foreground">Pricing & Stock</h4>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="unit_price" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Selling Price *</Label>
                                    <Input
                                        id="unit_price"
                                        name="unit_price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        required
                                        className="h-10 border-slate-200 font-medium"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="cost_price" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cost Price</Label>
                                    <Input
                                        id="cost_price"
                                        name="cost_price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        className="h-10 border-slate-200"
                                    />
                                </div>
                            </div>

                            {/* Stock Fields - Only for Goods */}
                            {type === 'goods' && (
                                <div className="grid grid-cols-2 gap-4 pt-2 animate-in fade-in slide-in-from-top-1">
                                    <div className="grid gap-2">
                                        <Label htmlFor="quantity" className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            <Layers className="h-3 w-3" /> Initial Stock
                                        </Label>
                                        <Input
                                            id="quantity"
                                            name="quantity"
                                            type="number"
                                            min="0"
                                            defaultValue="0"
                                            className="h-10 border-slate-200"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="reorder_level" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reorder Level</Label>
                                        <Input
                                            id="reorder_level"
                                            name="reorder_level"
                                            type="number"
                                            min="0"
                                            defaultValue="10"
                                            className="h-10 border-slate-200"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Tax Details */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                                <Percent className="h-4 w-4 text-indigo-600" />
                                <h4 className="text-sm font-semibold text-foreground">Tax Details</h4>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="hsn_code" className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        <FileCode className="h-3 w-3" /> HSN/SAC
                                    </Label>
                                    <Input
                                        id="hsn_code"
                                        name="hsn_code"
                                        placeholder="e.g. 8471"
                                        className="h-10 border-slate-200"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="gst_rate" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">GST Rate (%)</Label>
                                    <Select name="gst_rate" defaultValue="18">
                                        <SelectTrigger className="h-10 border-slate-200">
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

                            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
                                <Label htmlFor="prices_include_tax" className="text-sm font-medium">Prices include tax?</Label>
                                <input type="hidden" name="prices_include_tax" value="false" id="prices_include_tax_input" />
                                <Switch
                                    onCheckedChange={(checked) => {
                                        const input = document.getElementById('prices_include_tax_input') as HTMLInputElement;
                                        if (input) input.value = String(checked);
                                    }}
                                />
                            </div>
                        </div>

                        {state.message && (
                            <div className={`p-3 rounded-md text-sm font-medium ${state.message.includes('success') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                {state.message}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="p-6 pt-2 border-t border-border/50 bg-slate-50/50">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-10">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700 h-10 px-8 text-white">
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Add Product"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
