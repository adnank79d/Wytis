'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ============================================================================
// TYPES
// ============================================================================

export type PayrollRun = {
    id: string;
    business_id: string;
    month: number;
    year: number;
    status: 'draft' | 'locked' | 'paid';
    total_amount: number;
    created_at: string;
};

export type Payslip = {
    id: string;
    run_id: string;
    employee_id: string;
    employee?: {
        first_name: string;
        last_name: string;
        designation: string;
    };
    basic_salary: number;
    allowances: number;
    deductions: number;
    net_salary: number;
    status: 'pending' | 'paid';
    payment_date: string | null;
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

export async function getPayrollRuns() {
    const supabase = await createClient();
    const businessId = await getBusinessId();
    if (!businessId) return [];

    const { data } = await supabase
        .from('payroll_runs')
        .select('*')
        .eq('business_id', businessId)
        .order('year', { ascending: false })
        .order('month', { ascending: false });

    return (data || []) as PayrollRun[];
}

export async function getPayslips(runId: string) {
    const supabase = await createClient();
    const { data } = await supabase
        .from('payslips')
        .select(`
            *,
            employee:employees(first_name, last_name, designation)
        `)
        .eq('run_id', runId)
        .order('created_at');

    return (data || []) as Payslip[];
}

export async function createPayrollRun(month: number, year: number) {
    const supabase = await createClient();
    const businessId = await getBusinessId();
    if (!businessId) return { success: false, message: "Unauthorized" };

    // 1. Check if run exists
    const { data: existing } = await supabase
        .from('payroll_runs')
        .select('id')
        .eq('business_id', businessId)
        .eq('month', month)
        .eq('year', year)
        .single();

    if (existing) {
        return { success: false, message: "Payroll run for this period already exists." };
    }

    // 2. Fetch active employees
    const { data: employees } = await supabase
        .from('employees')
        .select('*')
        .eq('business_id', businessId)
        .eq('status', 'active');

    if (!employees || employees.length === 0) {
        return { success: false, message: "No active employees found to generate payroll." };
    }

    // 3. Create Run Header
    const { data: run, error: runError } = await supabase
        .from('payroll_runs')
        .insert({
            business_id: businessId,
            month,
            year,
            status: 'draft',
            total_amount: 0 // Will update later
        })
        .select()
        .single();

    if (runError || !run) {
        return { success: false, message: runError?.message || "Failed to create payroll run" };
    }

    // 4. Batch Create Payslips
    // Simple logic: We take `salary_amount` from employee. 
    // We assume it's the "Net" or "Gross" flat for now.
    // Let's do a basic split: 70% Basic, 20% Allowances, 10% Deductions? NO, let's keep it simple.
    // Basic = 100% of salary_amount for now, Allowances=0. Users can edit later if we add edit func.

    let totalRunAmount = 0;
    const payslips = employees.map(emp => {
        const salary = Number(emp.salary_amount) || 0;
        totalRunAmount += salary;

        return {
            business_id: businessId,
            run_id: run.id,
            employee_id: emp.id,
            basic_salary: salary,
            allowances: 0,
            deductions: 0,
            status: 'pending'
        };
    });

    const { error: batchError } = await supabase
        .from('payslips')
        .insert(payslips);

    if (batchError) {
        // Cleanup if possible? Or just return error.
        return { success: false, message: "Created run but failed to generate payslips: " + batchError.message };
    }

    // 5. Update Total Amount in Run
    await supabase
        .from('payroll_runs')
        .update({ total_amount: totalRunAmount })
        .eq('id', run.id);

    revalidatePath('/payroll');
    return { success: true, message: "Payroll generated successfully" };
}

export async function deletePayrollRun(runId: string) {
    const supabase = await createClient();
    const businessId = await getBusinessId();
    if (!businessId) return { success: false, message: "Unauthorized" };

    // Deleting run cascades to payslips due to DB constraint
    const { error } = await supabase
        .from('payroll_runs')
        .delete()
        .eq('id', runId)
        .eq('business_id', businessId);

    if (error) return { success: false, message: error.message };

    revalidatePath('/payroll');
    return { success: true };
}
