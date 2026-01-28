import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Target, CheckCircle, TrendingUp, Filter } from "lucide-react";

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

    // Calculate a simple "conversion rate" dummy metric (Customers / Total * 100)
    const total = leadsCount + prospectsCount + customersCount;
    const conversionRate = total > 0 ? Math.round((customersCount / total) * 100) : 0;

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-foreground">CRM Overview</h1>
                    <p className="text-muted-foreground mt-2 text-lg">Manage your sales pipeline and client relationships.</p>
                </div>
                <AddCustomerDialog />
            </div>

            {/* Pipeline Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
                        <Target className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{leadsCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">Potential opportunities</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">In Negotiation</CardTitle>
                        <Users className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{prospectsCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">Proposal stage</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Customers</CardTitle>
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{customersCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">Closed won deals</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm hover:shadow-md transition-shadow bg-muted/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{conversionRate}%</div>
                        <p className="text-xs text-muted-foreground mt-1">Lead to Customer</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold tracking-tight">Customer Database</h2>
                    <div className="flex items-center gap-2">
                        {/* <Button variant="outline" size="sm" className="hidden sm:flex">
                            <Filter className="mr-2 h-4 w-4" /> Filter
                        </Button> 
                        Placeholder for future filters
                        */}
                    </div>
                </div>

                <Card className="border-0 shadow-sm">
                    <CardContent className="p-0">
                        <CustomersTable customers={customers} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
