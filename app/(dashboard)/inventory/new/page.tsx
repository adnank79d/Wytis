import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "../_components/product-form";
import { getCategories } from "@/lib/actions/inventory";

export default async function NewProductPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Get Business Context & Role
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
        redirect("/inventory");
    }

    // Fetch categories
    const { data: categories } = await supabase
        .from('inventory_categories')
        .select('*')
        .eq('business_id', membershipData.business_id)
        .order('name');

    return (
        <div className="max-w-3xl mx-auto py-4 md:py-8 px-3 md:px-6">
            {/* HEADER */}
            <div className="mb-6 md:mb-8">
                <Link
                    href="/inventory"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Inventory
                </Link>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                    Add New Product
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Fill in the details to add a new product to your inventory.
                </p>
            </div>

            <ProductForm categories={categories || []} />
        </div>
    );
}
