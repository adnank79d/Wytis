'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

// ============================================================================
// TYPES
// ============================================================================

export type Expense = {
    id: string;
    business_id: string;
    description: string;
    amount: number;
    expense_date: string;
    category: string;
    payment_method: string;
    receipt_url: string | null;
    notes: string | null;
    gst_amount: number;
    supplier_gstin: string | null;
    created_at: string;
};

export type ExpenseStats = {
    totalThisMonth: number;
    totalLastMonth: number;
    topCategory: string;
    percentChange: number;
};

// ============================================================================
// SCHEMAS
// ============================================================================

const ExpenseSchema = z.object({
    description: z.string().min(1, "Description is required"),
    amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
    expense_date: z.coerce.date(),
    category: z.string().min(1, "Category is required"),
    payment_method: z.string().min(1, "Payment Method is required"),
    notes: z.string().optional(),
    gst_amount: z.coerce.number().default(0),
    supplier_gstin: z.string().optional(),
});

export type ExpenseFormState = {
    errors?: Record<string, string[]>;
    message?: string | null;
    success?: boolean;
};

// ============================================================================
// ACTIONS
// ============================================================================

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

export async function addExpense(prevState: ExpenseFormState, formData: FormData): Promise<ExpenseFormState> {
    const supabase = await createClient();
    const businessId = await getBusinessId();

    if (!businessId) {
        return { message: "Unauthorized", success: false };
    }

    const validatedFields = ExpenseSchema.safeParse({
        description: formData.get('description'),
        amount: formData.get('amount'),
        expense_date: formData.get('expense_date'),
        category: formData.get('category'),
        payment_method: formData.get('payment_method'),
        notes: formData.get('notes'),
        gst_amount: formData.get('gst_amount'),
        supplier_gstin: formData.get('supplier_gstin'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Validation failed",
            success: false,
        };
    }

    const { data } = validatedFields;

    // Convert date to string YYYY-MM-DD
    const expenseDate = data.expense_date.toISOString().split('T')[0];

    // Note: Trigger will utilize 'amount' and handle ledger entries.
    // If tracking GST separately in ledger is needed, we would update trigger.
    // For now, we assume simple expense debit.

    const { error } = await supabase
        .from('expenses')
        .insert({
            business_id: businessId,
            description: data.description,
            amount: data.amount,
            expense_date: expenseDate,
            category: data.category,
            payment_method: data.payment_method,
            notes: data.notes || null,
            gst_amount: data.gst_amount,
            supplier_gstin: data.supplier_gstin || null,
        });

    if (error) {
        return { message: `Error: ${error.message}`, success: false };
    }

    revalidatePath('/expenses');
    revalidatePath('/dashboard');
    revalidatePath('/reports');
    revalidatePath('/gst');

    return { message: "Expense added successfully", success: true };
}

export async function deleteExpense(id: string) {
    const supabase = await createClient();
    const businessId = await getBusinessId();

    if (!businessId) return { success: false, message: "Unauthorized" };

    const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('business_id', businessId);

    if (error) {
        return { success: false, message: error.message };
    }

    revalidatePath('/expenses');
    revalidatePath('/dashboard');
    revalidatePath('/reports');
    revalidatePath('/gst');

    return { success: true };
}

export async function getExpenses(search?: string, category?: string) {
    const supabase = await createClient();
    const businessId = await getBusinessId();
    if (!businessId) return [];

    let query = supabase
        .from('expenses')
        .select('*')
        .eq('business_id', businessId)
        .order('expense_date', { ascending: false });

    if (search) {
        query = query.ilike('description', `%${search}%`);
    }

    if (category && category !== 'all') {
        query = query.eq('category', category);
    }

    const { data } = await query;
    return (data || []) as Expense[];
}

export async function getExpenseStats(): Promise<ExpenseStats> {
    const supabase = await createClient();
    const businessId = await getBusinessId();
    if (!businessId) return { totalThisMonth: 0, totalLastMonth: 0, topCategory: '-', percentChange: 0 };

    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

    const { data: allExpenses } = await supabase
        .from('expenses')
        .select('amount, expense_date, category')
        .eq('business_id', businessId)
        .gte('expense_date', firstDayLastMonth);

    if (!allExpenses) return { totalThisMonth: 0, totalLastMonth: 0, topCategory: '-', percentChange: 0 };

    let totalThisMonth = 0;
    let totalLastMonth = 0;
    const categoryTotals: Record<string, number> = {};

    allExpenses.forEach(exp => {
        const d = new Date(exp.expense_date).toISOString();
        const amount = Number(exp.amount);

        if (d >= firstDayThisMonth) {
            totalThisMonth += amount;
            categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + amount;
        } else if (d >= firstDayLastMonth && d <= lastDayLastMonth) {
            totalLastMonth += amount;
        }
    });

    // Top Category
    let topCategory = '-';
    let maxVal = 0;
    Object.entries(categoryTotals).forEach(([cat, val]) => {
        if (val > maxVal) {
            maxVal = val;
            topCategory = cat;
        }
    });

    // Percent Change
    let percentChange = 0;
    if (totalLastMonth > 0) {
        percentChange = ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100;
    } else if (totalThisMonth > 0) {
        percentChange = 100;
    }

    return { totalThisMonth, totalLastMonth, topCategory, percentChange };
}
