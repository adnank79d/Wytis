'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ============================================================================
// TYPES
// ============================================================================

export type Employee = {
    id: string;
    business_id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    designation: string | null;
    department: string | null;
    salary_amount: number;
    status: 'active' | 'on_leave' | 'terminated';
    joined_at: string;
};

export type PayrollRunResult = {
    success: boolean;
    message: string;
    count?: number;
    totalAmount?: number;
};

// ============================================================================
// SCHEMAS
// ============================================================================

const EmployeeSchema = z.object({
    first_name: z.string().min(1, "First Name is required"),
    last_name: z.string().min(1, "Last Name is required"),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    designation: z.string().optional(),
    department: z.string().optional(),
    salary_amount: z.coerce.number().min(0),
    status: z.enum(['active', 'on_leave', 'terminated']).default('active'),
    joined_at: z.coerce.date(),
});

export type EmployeeFormState = {
    errors?: Record<string, string[]>;
    message?: string | null;
    success?: boolean;
};

// ============================================================================
// HELPERS
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

// ============================================================================
// EMPLOYEE ACTIONS
// ============================================================================

export async function getEmployees() {
    const supabase = await createClient();
    const businessId = await getBusinessId();
    if (!businessId) return [];

    const { data } = await supabase
        .from('employees')
        .select('*')
        .eq('business_id', businessId)
        .order('first_name');

    return (data || []) as Employee[];
}

export async function addEmployee(prevState: EmployeeFormState, formData: FormData): Promise<EmployeeFormState> {
    const supabase = await createClient();
    const businessId = await getBusinessId();

    if (!businessId) return { message: "Unauthorized", success: false };

    const validatedFields = EmployeeSchema.safeParse({
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        designation: formData.get('designation'),
        department: formData.get('department'),
        salary_amount: formData.get('salary_amount'),
        status: formData.get('status'),
        joined_at: formData.get('joined_at'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Validation failed",
            success: false,
        };
    }

    const data = validatedFields.data;

    const { error } = await supabase
        .from('employees')
        .insert({
            business_id: businessId,
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email || null,
            phone: data.phone || null,
            designation: data.designation || null,
            department: data.department || null,
            salary_amount: data.salary_amount,
            status: data.status,
            joined_at: data.joined_at.toISOString().split('T')[0],
        });

    if (error) {
        return { message: `Error: ${error.message}`, success: false };
    }

    revalidatePath('/hr');
    return { message: "Employee added successfully", success: true };
}

export async function updateEmployee(id: string, prevState: EmployeeFormState, formData: FormData): Promise<EmployeeFormState> {
    const supabase = await createClient();
    const businessId = await getBusinessId();

    if (!businessId) return { message: "Unauthorized", success: false };

    const validatedFields = EmployeeSchema.safeParse({
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        designation: formData.get('designation'),
        department: formData.get('department'),
        salary_amount: formData.get('salary_amount'),
        status: formData.get('status'),
        joined_at: formData.get('joined_at'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Validation failed",
            success: false,
        };
    }

    const data = validatedFields.data;

    const { error } = await supabase
        .from('employees')
        .update({
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email || null,
            phone: data.phone || null,
            designation: data.designation || null,
            department: data.department || null,
            salary_amount: data.salary_amount,
            status: data.status,
            joined_at: data.joined_at.toISOString().split('T')[0],
        })
        .eq('id', id)
        .eq('business_id', businessId);

    if (error) {
        return { message: `Error: ${error.message}`, success: false };
    }

    revalidatePath('/hr');
    return { message: "Employee updated successfully", success: true };
}

// ============================================================================
// PAYROLL ACTIONS
// ============================================================================

export async function runPayroll(month: number, year: number): Promise<PayrollRunResult> {
    const supabase = await createClient();
    const businessId = await getBusinessId();

    if (!businessId) return { success: false, message: "Unauthorized" };

    // 1. Get all active employees
    const { data: employees } = await supabase
        .from('employees')
        .select('*')
        .eq('business_id', businessId)
        .eq('status', 'active');

    if (!employees || employees.length === 0) {
        return { success: false, message: "No active employees found to pay." };
    }

    // 2. Filter out calculate valid period string for checks (e.g., 2026-06-01)
    // Actually, we'll just check if an expense exists for this user in this month/year for 'Salaries'

    // Create date range for the month
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month

    let processedCount = 0;
    let totalAmount = 0;

    for (const emp of employees) {
        // Double check: Has this employee already been paid this month?
        const { count } = await supabase
            .from('expenses')
            .select('*', { count: 'exact', head: true })
            .eq('business_id', businessId)
            .eq('employee_id', emp.id)
            .eq('category', 'Salaries')
            .gte('expense_date', startDate)
            .lte('expense_date', endDate);

        if (count && count > 0) {
            continue; // Skip, already paid
        }

        if (emp.salary_amount > 0) {
            // Create Expense Record
            // This will automatically trigger accounting (Debit Salaries, Credit Bank) via the DB trigger
            const { error } = await supabase.from('expenses').insert({
                business_id: businessId,
                description: `Salary: ${emp.first_name} ${emp.last_name} (${startDate})`,
                amount: emp.salary_amount,
                expense_date: new Date().toISOString().split('T')[0], // Paid today
                category: 'Salaries',
                payment_method: 'Bank Transfer', // Default for payroll
                employee_id: emp.id,
                notes: `Automated payroll run for ${month}/${year}`
            });

            if (!error) {
                processedCount++;
                totalAmount += Number(emp.salary_amount);
            }
        }
    }

    revalidatePath('/hr');
    revalidatePath('/expenses');
    revalidatePath('/reports');

    if (processedCount === 0) {
        return { success: true, message: "No new payments required. All employees already paid for this period." };
    }

    return {
        success: true,
        message: `Payroll processed successfully. Paid ${processedCount} employees.`,
        count: processedCount,
        totalAmount
    };
}

export async function getPayrollHistory() {
    const supabase = await createClient();
    const businessId = await getBusinessId();
    if (!businessId) return [];

    // Aggregate expenses by month where category = Salaries
    // This is getting complex for a simple query, let's just fetch salary expenses
    const { data } = await supabase
        .from('expenses')
        .select(`
            *,
            employee:employees(first_name, last_name)
        `)
        .eq('business_id', businessId)
        .eq('category', 'Salaries')
        .order('expense_date', { ascending: false })
        .limit(50);

    return data || [];
}
