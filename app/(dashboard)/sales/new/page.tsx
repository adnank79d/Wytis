
import { CreateInvoiceForm } from "@/components/invoices/create-invoice-form";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function NewInvoicePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: membership } = await supabase
        .from("memberships")
        .select("business_id, role")
        .eq("user_id", user.id)
        .limit(1)
        .single();

    if (!membership) {
        redirect("/");
    }

    return (
        <div className="container py-8">
            <CreateInvoiceForm businessId={membership.business_id} />
        </div>
    );
}
