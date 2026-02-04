import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCustomers } from "@/lib/actions/customers"; // Reusing getCustomers as vendors
import { getInventory } from "@/lib/actions/inventory"; // For product selection
import { CreatePOForm } from "./create-po-form";

export const dynamic = 'force-dynamic';

export default async function NewPOPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Get Business Context
    const { data: membershipData } = await supabase
        .from("memberships")
        .select(`role, business_id, businesses (subscription_status)`)
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

    if (!membershipData) {
        redirect("/onboarding");
    }

    const business = membershipData.businesses as unknown as { subscription_status: string };
    const isTrialExpired = business.subscription_status === 'expired';
    const canCreate = (membershipData.role === 'owner' || membershipData.role === 'accountant') && !isTrialExpired;

    if (!canCreate) {
        redirect("/purchase-orders");
    }

    // Fetch Vendors (Customers) & Inventory Products
    const [customers, inventoryData] = await Promise.all([
        getCustomers(),
        getInventory()
    ]);

    return (
        <div className="max-w-5xl mx-auto py-4 md:py-8 px-3 md:px-6">
            <div className="mb-6 md:mb-8">
                <Link
                    href="/purchase-orders"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to POs
                </Link>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                    Create Purchase Order
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Create a new order for your vendors.
                </p>
            </div>

            <CreatePOForm
                vendors={customers} // Using customers as vendors for now
                products={inventoryData.products}
            />
        </div>
    );
}
