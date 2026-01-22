import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AddPaymentForm } from "./add-payment-form";

export default async function NewPaymentPage() {
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
    const canEdit = (membershipData.role === 'owner' || membershipData.role === 'accountant') && !isTrialExpired;

    if (!canEdit) {
        redirect("/payments");
    }

    // Fetch invoices for linking
    const { data: invoices } = await supabase
        .from('invoices')
        .select('id, invoice_number, customer_name, total_amount')
        .eq('business_id', membershipData.business_id)
        .order('created_at', { ascending: false })
        .limit(50);

    return (
        <div className="max-w-3xl mx-auto py-4 md:py-8 px-3 md:px-6">
            {/* HEADER */}
            <div className="mb-6 md:mb-8">
                <Link
                    href="/payments"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Payments
                </Link>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                    Record Payment
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Record a payment received or made.
                </p>
            </div>

            <AddPaymentForm invoices={invoices || []} />
        </div>
    );
}
