import { createClient } from "@/lib/supabase/server";
import { getCustomers } from "@/lib/actions/invoices";
import { NewInvoiceForm } from "@/components/invoices/new-invoice-form";
import { Role, can, PERMISSIONS } from "@/lib/permissions";
import { ClientGuard } from "@/components/auth/client-guard";

export const dynamic = 'force-dynamic';

export default async function NewInvoicePage() {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    let existingCustomers: { id: string; name: string; tax_id: string | null }[] = [];
    let inventoryProducts: { id: string; name: string; sku: string | null; unit_price: number; gst_rate: number; quantity: number }[] = [];
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

                // Fetch inventory products
                const { data: products } = await supabase
                    .from('inventory_products')
                    .select('id, name, sku, unit_price, gst_rate, quantity')
                    .eq('business_id', membership.business_id)
                    .eq('is_active', true)
                    .order('name');

                inventoryProducts = (products || []) as typeof inventoryProducts;
            }
        }
    }

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

                    <NewInvoiceForm
                        existingCustomers={existingCustomers}
                        inventoryProducts={inventoryProducts}
                    />
                </div>
            )}
        </ClientGuard>
    );
}
