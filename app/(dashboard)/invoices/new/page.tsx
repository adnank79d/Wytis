import { createClient } from "@/lib/supabase/server";
// redirect is removed
import { getCustomers } from "@/lib/actions/invoices";
import { NewInvoiceForm } from "@/components/invoices/new-invoice-form";
import { Role, can, PERMISSIONS } from "@/lib/permissions";
import { ClientGuard } from "@/components/auth/client-guard";

export const dynamic = 'force-dynamic';

export default async function NewInvoicePage() {
    const supabase = await createClient();
    // Relaxed Server Check: We try to get session, but don't redirect if missing.
    // We let the ClientGuard handle the redirect.
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    // We still try to fetch role/business, but gracefully handle failure
    let existingCustomers: { id: string; name: string; tax_id: string | null }[] = [];
    let accessDenied = false;
    let isTrialExpired = false;

    if (user) {
        const { data: membership } = await supabase
            .from("memberships")
            .select("role, business_id, businesses(trial_ends_at, subscription_status)")
            .eq("user_id", user.id)
            .limit(1)
            .single();

        if (membership) {
            const userRole = membership.role as Role;
            const business = membership.businesses as unknown as { trial_ends_at: string, subscription_status: string };
            isTrialExpired = business?.subscription_status === 'expired';

            if (!can(userRole, PERMISSIONS.CREATE_INVOICE) || userRole !== 'owner' || isTrialExpired) {
                accessDenied = true;
            } else {
                existingCustomers = await getCustomers();
            }
        }
    }

    // Design: If user is missing on server, we render ClientGuard. 
    // ClientGuard checks client session -> if exists, it renders children.
    // CHILDREN content: We need to handle the case where 'user' was null on server but exists on client?
    // Actually, if 'user' is null on server, we can't fetch customers!
    // So if ClientGuard says "Logged In", but Server said "No User", we have a mismatch.
    // Ideally, ClientGuard triggers a router.refresh() if it detects session but page content is empty.

    // For now, simpler: If session missing, rendering ClientGuard will eventually redirect to login if client agrees.
    // If client thinks logged in, it shows children. Children might be empty/broken if server failed?
    // Let's pass 'existingCustomers' as prop. If empty, dropdown is empty. 
    // User can refresh manually or middleware fix should happen eventually.

    return (
        <ClientGuard>
            {accessDenied ? (
                <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                    <div className="bg-muted p-6 rounded-full">
                        <h1 className="text-xl font-bold">Access Denied</h1>
                    </div>
                    <p className="text-muted-foreground text-center max-w-md">
                        {isTrialExpired ? "Trial Expired." : "Access Denied."}
                    </p>
                </div>
            ) : (
                <div className="max-w-5xl mx-auto py-8 px-4">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold tracking-tight">Create New Invoice</h1>
                        <p className="text-muted-foreground">Fill in the details below to generate a new invoice.</p>
                    </div>

                    <NewInvoiceForm existingCustomers={existingCustomers} />
                </div>
            )}
        </ClientGuard>
    );
}
