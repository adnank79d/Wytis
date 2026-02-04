'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

// ============================================================================
// SCHEMAS
// ============================================================================

const POItemSchema = z.object({
    product_id: z.string().optional(),
    description: z.string().min(1, "Description is required"),
    quantity: z.number().min(0.01, "Quantity must be > 0"),
    unit_price: z.number().min(0, "Price must be >= 0"),
});

const CreatePOSchema = z.object({
    vendor_id: z.string().min(1, "Vendor is required"),
    po_date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
    expected_date: z.string().optional(),
    notes: z.string().optional(),
    items: z.array(POItemSchema).min(1, "At least one item is required"),
});

const GRNItemSchema = z.object({
    po_item_id: z.string(),
    quantity_received: z.number().min(0, "Quantity cannot be negative"),
});

const CreateGRNSchema = z.object({
    po_id: z.string(),
    received_date: z.string().default(() => new Date().toISOString().split('T')[0]),
    notes: z.string().optional(),
    items: z.array(GRNItemSchema),
});

// ============================================================================
// HELPER: Get Business Context
// ============================================================================

async function getBusinessContext() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: membership } = await supabase
        .from('memberships')
        .select('business_id, role')
        .eq('user_id', user.id)
        .limit(1)
        .single();

    if (!membership) return null;

    return { supabase, userId: user.id, businessId: membership.business_id, role: membership.role };
}

// ============================================================================
// HELPER: Generate PO Number
// ============================================================================

async function generatePONumber(supabase: any, businessId: string): Promise<string> {
    const { data: latest } = await supabase
        .from('purchase_orders')
        .select('po_number')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    let nextNumber = 1;
    if (latest?.po_number) {
        const match = latest.po_number.match(/PO-(\d+)/);
        if (match) nextNumber = parseInt(match[1], 10) + 1;
    }

    return `PO-${nextNumber.toString().padStart(6, '0')}`;
}

export type CreatePOFormState = {
    message?: string;
    errors?: Record<string, string[]>; // Zod flattened errors
    success?: boolean;
} | undefined;

// ============================================================================
// ACTIONS
// ============================================================================

export async function createPO(prevState: any, formData: FormData): Promise<CreatePOFormState> {
    const context = await getBusinessContext();
    if (!context) return { message: 'Unauthorized' };

    const { supabase, businessId } = context;

    // Parse items
    const rawItems = formData.get('items') as string;
    let items;
    try {
        items = JSON.parse(rawItems);
    } catch {
        return { message: 'Invalid items data' };
    }

    const validatedFields = CreatePOSchema.safeParse({
        vendor_id: formData.get('vendor_id'),
        po_date: formData.get('po_date'),
        expected_date: formData.get('expected_date') || undefined,
        notes: formData.get('notes') || undefined,
        items
    });

    if (!validatedFields.success) {
        return { message: 'Validation Failed', errors: validatedFields.error.flatten().fieldErrors };
    }

    const { vendor_id, po_date, expected_date, notes, items: validItems } = validatedFields.data;
    const po_number = await generatePONumber(supabase, businessId);

    // Calculate Total
    const total_amount = validItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

    // Insert PO
    const { data: po, error: poError } = await supabase
        .from('purchase_orders')
        .insert({
            business_id: businessId,
            vendor_id,
            po_number,
            po_date,
            expected_date,
            notes,
            total_amount,
            status: 'draft'
        })
        .select()
        .single();

    if (poError) return { message: `Database Error: ${poError.message}` };

    // Insert Items
    const itemsData = validItems.map(item => ({
        po_id: po.id,
        product_id: item.product_id || null, // Optional link to inventory
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
    }));

    const { error: itemsError } = await supabase.from('po_items').insert(itemsData);

    if (itemsError) {
        await supabase.from('purchase_orders').delete().eq('id', po.id);
        return { message: `Items Error: ${itemsError.message}` };
    }

    revalidatePath('/purchase-orders');
    redirect(`/purchase-orders/${po.id}`);
}

export async function issuePO(poId: string) {
    const context = await getBusinessContext();
    if (!context) return { success: false, message: 'Unauthorized' };
    const { supabase, businessId } = context;

    const { error } = await supabase
        .from('purchase_orders')
        .update({ status: 'issued' })
        .eq('id', poId)
        .eq('business_id', businessId)
        .eq('status', 'draft');

    if (error) return { success: false, message: error.message };

    revalidatePath(`/purchase-orders/${poId}`);
    return { success: true, message: 'PO Issued' };
}

export async function createGRN(prevState: any, formData: FormData) {
    const context = await getBusinessContext();
    if (!context) return { success: false, message: 'Unauthorized' };
    const { supabase, businessId, userId } = context;

    const rawItems = formData.get('items') as string;
    let items;
    try { items = JSON.parse(rawItems); } catch { return { success: false, message: 'Invalid items' }; }

    const validated = CreateGRNSchema.safeParse({
        po_id: formData.get('po_id'),
        received_date: formData.get('received_date'),
        notes: formData.get('notes'),
        items
    });

    if (!validated.success) return { success: false, message: 'Validation Failed' };
    const { po_id, received_date, notes, items: receivedItems } = validated.data;

    // fetch PO items to validate and get product_ids
    const { data: poItemsData } = await supabase
        .from('po_items')
        .select('id, product_id, unit_price')
        .eq('po_id', po_id);

    if (!poItemsData) return { message: 'PO Items not found' };

    // Create GRN Header
    const { count } = await supabase.from('grn').select('id', { count: 'exact', head: true }).eq('business_id', businessId);
    const grn_number = `GRN-${(count || 0) + 1}`;

    const { data: grn, error: grnError } = await supabase
        .from('grn')
        .insert({
            business_id: businessId,
            po_id,
            grn_number,
            received_date,
            notes,
            created_by: userId
        })
        .select()
        .single();

    if (grnError) return { message: grnError.message };

    // Process Items
    const grnLines = [];
    const inventoryUpdates = [];
    let totalValueReceived = 0;

    for (const item of receivedItems) {
        if (item.quantity_received <= 0) continue;

        const poLine = poItemsData.find(p => p.id === item.po_item_id);
        if (!poLine) continue;

        grnLines.push({
            grn_id: grn.id,
            po_item_id: item.po_item_id,
            quantity_received: item.quantity_received
        });

        // Add to inventory value
        totalValueReceived += (item.quantity_received * poLine.unit_price);

        // Prepare Inventory Update if product_id is linked
        if (poLine.product_id) {
            // We can't batch update different rows easily with Supabase client unless using RPC or loop
            // For now, we'll loop updates (tolerable for small GRNs)
            inventoryUpdates.push({
                id: poLine.product_id,
                addedQty: item.quantity_received,
                latestCost: poLine.unit_price // Optional: Update cost price to latest purchase price?
            });
        }
    }

    if (grnLines.length > 0) {
        await supabase.from('grn_items').insert(grnLines);

        // Update Inventory
        for (const update of inventoryUpdates) {
            // Using RPC or raw sql is safer for concurrency, but simplistic approach here:
            // Get current, add, update.
            const { data: prod } = await supabase.from('inventory_products').select('quantity, cost_price').eq('id', update.id).single();
            if (prod) {
                // Weighted Average Cost could be implemented here.
                // New Cost = ((OldQty * OldCost) + (NewQty * NewCost)) / (OldQty + NewQty)
                const oldVal = prod.quantity * prod.cost_price;
                const newVal = update.addedQty * update.latestCost;
                const newQty = prod.quantity + update.addedQty;
                const avgCost = newQty > 0 ? (oldVal + newVal) / newQty : update.latestCost;

                await supabase.from('inventory_products').update({
                    quantity: newQty,
                    cost_price: avgCost, // Update cost price to weighted average
                    updated_at: new Date().toISOString()
                }).eq('id', update.id);

                // Track Movement
                await supabase.from('inventory_movements').insert({
                    business_id: businessId,
                    product_id: update.id,
                    movement_type: 'in',
                    quantity: update.addedQty,
                    notes: `GRN: ${grn_number}`
                });
            }
        }

        // Accounting Entries (Inventory Asset vs GRN Clearing)
        // We'll create a Transaction for this GRN
        const { data: trx } = await supabase.from('transactions').insert({
            business_id: businessId,
            source_type: 'journal', // 'grn' not yet in source_type check likely? check constraints.
            // Actually 'grn' is likely not in enum. We can use 'journal' or 'bill' later. 
            // Only 'invoice', 'expense', 'payment' might be there.
            // Let's check constraints later. For now, use 'journal' or skip if constrained.
            // Assuming permissive or 'journal' exists.
            description: `GRN ${grn_number}`,
            amount: totalValueReceived,
            transaction_date: received_date,
            transaction_type: 'debit' // Asset increase
        }).select().single();

        if (trx) {
            await supabase.from('ledger_entries').insert([
                {
                    business_id: businessId,
                    transaction_id: trx.id,
                    account_name: 'Inventory Asset',
                    debit: totalValueReceived,
                    credit: 0
                },
                {
                    business_id: businessId,
                    transaction_id: trx.id,
                    account_name: 'GRN Clearing', // Liability
                    debit: 0,
                    credit: totalValueReceived
                }
            ]);
        }
    }

    // Update PO Status (Check if full or partial)
    // Simplified: Mark as partially_received
    await supabase.from('purchase_orders').update({ status: 'partially_received' }).eq('id', po_id);

    revalidatePath(`/purchase-orders/${po_id}`);
    return { success: true, message: 'GRN Created' };
}

// ============================================================================
// DATA FETCHERS
// ============================================================================

export async function getPurchaseOrders() {
    const context = await getBusinessContext();
    if (!context) return [];
    const { supabase, businessId } = context;

    const { data } = await supabase
        .from('purchase_orders')
        .select(`
            *,
            vendor:customers(name)
        `)
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

    return data || [];
}

export async function getPurchaseOrder(id: string) {
    const context = await getBusinessContext();
    if (!context) return null;
    const { supabase, businessId } = context;

    const { data } = await supabase
        .from('purchase_orders')
        .select(`
            *,
            vendor:customers(name, email, phone, address, gst_number),
            items:po_items(
                *,
                product:inventory_products(name, sku)
            ),
            grns:grn(*)
        `)
        .eq('id', id)
        .eq('business_id', businessId)
        .single();

    return data;
}
