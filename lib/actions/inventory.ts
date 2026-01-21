'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

// Types
export type InventoryProduct = {
    id: string;
    business_id: string;
    category_id: string | null;
    name: string;
    sku: string | null;
    description: string | null;
    unit: string;
    unit_price: number;
    cost_price: number;
    quantity: number;
    reorder_level: number;
    hsn_code: string | null;
    gst_rate: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    category?: { id: string; name: string } | null;
};

export type InventoryCategory = {
    id: string;
    business_id: string;
    name: string;
    description: string | null;
    created_at: string;
};

// Schemas
const ProductSchema = z.object({
    name: z.string().min(1, "Product name is required"),
    sku: z.string().optional(),
    description: z.string().optional(),
    category_id: z.string().optional(),
    unit: z.string().default("pcs"),
    unit_price: z.coerce.number().min(0, "Price must be positive"),
    cost_price: z.coerce.number().min(0).default(0),
    quantity: z.coerce.number().min(0).default(0),
    reorder_level: z.coerce.number().min(0).default(10),
    hsn_code: z.string().optional(),
    gst_rate: z.coerce.number().min(0).max(100).default(18),
});

const CategorySchema = z.object({
    name: z.string().min(1, "Category name is required"),
    description: z.string().optional(),
});

export type ProductFormState = {
    errors?: Record<string, string[]>;
    message?: string | null;
};

// Get user's business
async function getBusinessId() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: membership } = await supabase
        .from('memberships')
        .select('business_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

    return membership?.business_id || null;
}

// Get all products with optional search/filter
export async function getInventory(search?: string, categoryId?: string) {
    const supabase = await createClient();
    const businessId = await getBusinessId();
    if (!businessId) return { products: [], categories: [] };

    let query = supabase
        .from('inventory_products')
        .select(`
            *,
            category:inventory_categories(id, name)
        `)
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('name');

    if (search) {
        query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
    }

    if (categoryId && categoryId !== 'all') {
        query = query.eq('category_id', categoryId);
    }

    const { data: products, error } = await query;

    const { data: categories } = await supabase
        .from('inventory_categories')
        .select('*')
        .eq('business_id', businessId)
        .order('name');

    return {
        products: (products || []) as InventoryProduct[],
        categories: (categories || []) as InventoryCategory[],
    };
}

// Get inventory stats
export async function getInventoryStats() {
    const supabase = await createClient();
    const businessId = await getBusinessId();
    if (!businessId) return { totalProducts: 0, lowStock: 0, totalValue: 0 };

    const { data: products } = await supabase
        .from('inventory_products')
        .select('quantity, unit_price, cost_price, reorder_level')
        .eq('business_id', businessId)
        .eq('is_active', true);

    if (!products) return { totalProducts: 0, lowStock: 0, totalValue: 0 };

    const totalProducts = products.length;
    const lowStock = products.filter(p => p.quantity <= p.reorder_level).length;
    const totalValue = products.reduce((sum, p) => sum + (p.quantity * p.cost_price), 0);

    return { totalProducts, lowStock, totalValue };
}

// Add new product
export async function addProduct(prevState: ProductFormState, formData: FormData): Promise<ProductFormState> {
    const supabase = await createClient();
    const businessId = await getBusinessId();

    if (!businessId) {
        return { message: 'Unauthorized' };
    }

    const validatedFields = ProductSchema.safeParse({
        name: formData.get('name'),
        sku: formData.get('sku') || undefined,
        description: formData.get('description') || undefined,
        category_id: formData.get('category_id') || undefined,
        unit: formData.get('unit') || 'pcs',
        unit_price: formData.get('unit_price'),
        cost_price: formData.get('cost_price') || 0,
        quantity: formData.get('quantity') || 0,
        reorder_level: formData.get('reorder_level') || 10,
        hsn_code: formData.get('hsn_code') || undefined,
        gst_rate: formData.get('gst_rate') || 18,
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Validation failed. Please check the form.',
        };
    }

    const data = validatedFields.data;

    const { error } = await supabase
        .from('inventory_products')
        .insert({
            business_id: businessId,
            name: data.name,
            sku: data.sku || null,
            description: data.description || null,
            category_id: data.category_id || null,
            unit: data.unit,
            unit_price: data.unit_price,
            cost_price: data.cost_price,
            quantity: data.quantity,
            reorder_level: data.reorder_level,
            hsn_code: data.hsn_code || null,
            gst_rate: data.gst_rate,
        });

    if (error) {
        console.error('Add product error:', error);
        return { message: `Error: ${error.message}` };
    }

    revalidatePath('/inventory');
    redirect('/inventory');
}

// Update product
export async function updateProduct(productId: string, prevState: ProductFormState, formData: FormData): Promise<ProductFormState> {
    const supabase = await createClient();
    const businessId = await getBusinessId();

    if (!businessId) {
        return { message: 'Unauthorized' };
    }

    const validatedFields = ProductSchema.safeParse({
        name: formData.get('name'),
        sku: formData.get('sku') || undefined,
        description: formData.get('description') || undefined,
        category_id: formData.get('category_id') || undefined,
        unit: formData.get('unit') || 'pcs',
        unit_price: formData.get('unit_price'),
        cost_price: formData.get('cost_price') || 0,
        quantity: formData.get('quantity') || 0,
        reorder_level: formData.get('reorder_level') || 10,
        hsn_code: formData.get('hsn_code') || undefined,
        gst_rate: formData.get('gst_rate') || 18,
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Validation failed.',
        };
    }

    const data = validatedFields.data;

    const { error } = await supabase
        .from('inventory_products')
        .update({
            name: data.name,
            sku: data.sku || null,
            description: data.description || null,
            category_id: data.category_id || null,
            unit: data.unit,
            unit_price: data.unit_price,
            cost_price: data.cost_price,
            quantity: data.quantity,
            reorder_level: data.reorder_level,
            hsn_code: data.hsn_code || null,
            gst_rate: data.gst_rate,
            updated_at: new Date().toISOString(),
        })
        .eq('id', productId)
        .eq('business_id', businessId);

    if (error) {
        return { message: `Error: ${error.message}` };
    }

    revalidatePath('/inventory');
    revalidatePath(`/inventory/${productId}`);
    return { message: 'Product updated successfully' };
}

// Delete product (soft delete)
export async function deleteProduct(productId: string) {
    const supabase = await createClient();
    const businessId = await getBusinessId();

    if (!businessId) {
        return { success: false, message: 'Unauthorized' };
    }

    const { error } = await supabase
        .from('inventory_products')
        .update({ is_active: false })
        .eq('id', productId)
        .eq('business_id', businessId);

    if (error) {
        return { success: false, message: error.message };
    }

    revalidatePath('/inventory');
    return { success: true };
}

// Adjust stock
export async function adjustStock(
    productId: string,
    quantity: number,
    type: 'in' | 'out' | 'adjustment',
    notes?: string
) {
    const supabase = await createClient();
    const businessId = await getBusinessId();

    if (!businessId) {
        return { success: false, message: 'Unauthorized' };
    }

    // Get current product
    const { data: product, error: fetchError } = await supabase
        .from('inventory_products')
        .select('quantity')
        .eq('id', productId)
        .eq('business_id', businessId)
        .single();

    if (fetchError || !product) {
        return { success: false, message: 'Product not found' };
    }

    // Calculate new quantity
    let newQuantity = product.quantity;
    if (type === 'in') {
        newQuantity += quantity;
    } else if (type === 'out') {
        newQuantity -= quantity;
        if (newQuantity < 0) {
            return { success: false, message: 'Insufficient stock' };
        }
    } else {
        newQuantity = quantity; // Direct adjustment
    }

    // Update product quantity
    const { error: updateError } = await supabase
        .from('inventory_products')
        .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
        .eq('id', productId);

    if (updateError) {
        return { success: false, message: updateError.message };
    }

    // Record movement
    await supabase.from('inventory_movements').insert({
        business_id: businessId,
        product_id: productId,
        movement_type: type,
        quantity: type === 'adjustment' ? newQuantity - product.quantity : quantity,
        notes,
    });

    revalidatePath('/inventory');
    revalidatePath(`/inventory/${productId}`);
    return { success: true };
}

// Add category
export async function addCategory(prevState: ProductFormState, formData: FormData): Promise<ProductFormState> {
    const supabase = await createClient();
    const businessId = await getBusinessId();

    if (!businessId) {
        return { message: 'Unauthorized' };
    }

    const validatedFields = CategorySchema.safeParse({
        name: formData.get('name'),
        description: formData.get('description') || undefined,
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Validation failed.',
        };
    }

    const { error } = await supabase
        .from('inventory_categories')
        .insert({
            business_id: businessId,
            name: validatedFields.data.name,
            description: validatedFields.data.description || null,
        });

    if (error) {
        return { message: `Error: ${error.message}` };
    }

    revalidatePath('/inventory');
    return { message: 'Category added successfully' };
}

// Get categories
export async function getCategories() {
    const supabase = await createClient();
    const businessId = await getBusinessId();
    if (!businessId) return [];

    const { data } = await supabase
        .from('inventory_categories')
        .select('*')
        .eq('business_id', businessId)
        .order('name');

    return (data || []) as InventoryCategory[];
}
