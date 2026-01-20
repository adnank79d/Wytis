import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { InvoiceView } from "@/components/invoices/invoice-view";

interface InvoicePageProps {
    params: Promise<{ id: string }>;
}

export default async function InvoicePage(props: InvoicePageProps) {
    const params = await props.params;
    const supabase = await createClient();

    // 1. Auth Check (Soft, let middleware refresh if needed, but strict here for security)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect("/login");
    }

    // 2. Fetch User Membership (for RLS/Context)
    const { data: membership } = await supabase
        .from("memberships")
        .select("business_id, businesses(name, currency, gst_number)")
        .eq("user_id", user.id)
        .limit(1)
        .single();

    if (!membership || !membership.businesses) {
        return notFound();
    }

    const business = membership.businesses as any; // Cast for simplicity, types are inferred usually
    // We already have business details: name, currency, gst_number

    // 3. Fetch Invoice with Items
    // Using explicit query to ensure we only get invoices for this business
    const { data: invoice } = await supabase
        .from("invoices")
        .select(`
            *,
            invoice_items (
                id,
                description,
                quantity,
                unit_price,
                gst_rate,
                line_total
            )
        `)
        .eq("id", params.id)
        .eq("business_id", membership.business_id) // Security: Ensure ownership
        .single();

    if (!invoice) {
        return notFound();
    }

    // 4. Transform Data for View
    // View expects specific structure. 
    // invoice_items needs to be formatted? Database types are compatible.

    return (
        <InvoiceView
            invoice={invoice}
            business={{
                name: business.name,
                currency: business.currency || 'INR',
                gst_number: business.gst_number
            }}
        />
    );
}
