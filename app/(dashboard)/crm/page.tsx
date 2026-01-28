import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Users, Target, CheckCircle } from "lucide-react";

import { getCustomers } from "@/lib/actions/crm";
import { CustomersTable } from "@/components/crm/customers-table";
import { AddCustomerDialog } from "@/components/crm/add-customer-dialog";

export const dynamic = 'force-dynamic';

export default async function CRMPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const customers = await getCustomers();

    const leadsCount = customers.filter(c => c.status === 'lead').length;
    const prospectsCount = customers.filter(c => c.status === 'prospect').length;
    const customersCount = customers.filter(c => c.status === 'customer').length;

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">CRM</h1>
                    <p className="text-muted-foreground mt-1">Manage leads, customers, and interactions.</p>
                </div>
                <AddCustomerDialog />
            </div>

            {/* Pipeline Stats */}
            {/* Pipeline Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-4 flex flex-row items-center justify-between bg-blue-50/50 border-blue-200">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                            <Target className="h-6 w-6 text-blue-600" />
                        </div>
                        <p className="text-sm font-medium text-blue-900/80">Leads</p>
                    </div>
                    <p className="text-3xl font-bold text-blue-900">{leadsCount}</p>
                </Card>
                <Card className="p-4 flex flex-row items-center justify-between bg-purple-50/50 border-purple-200">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                            <Users className="h-6 w-6 text-purple-600" />
                        </div>
                        <p className="text-sm font-medium text-purple-900/80">Prospects</p>
                    </div>
                    <p className="text-3xl font-bold text-purple-900">{prospectsCount}</p>
                </Card>
                <Card className="p-4 flex flex-row items-center justify-between bg-emerald-50/50 border-emerald-200">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                            <CheckCircle className="h-6 w-6 text-emerald-600" />
                        </div>
                        <p className="text-sm font-medium text-emerald-900/80">Customers</p>
                    </div>
                    <p className="text-3xl font-bold text-emerald-900">{customersCount}</p>
                </Card>
            </div>

            {/* Main Content */}
            <CustomersTable customers={customers} />
        </div>
    );
}
