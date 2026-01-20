"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const CustomerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email").optional().or(z.literal('')),
    phone: z.string().optional(),
    tax_id: z.string().optional(),
    address: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof CustomerSchema>;

export default function NewCustomerPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<CustomerFormValues>({
        resolver: zodResolver(CustomerSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            tax_id: "",
            address: "",
        },
    });

    async function onSubmit(data: CustomerFormValues) {
        setIsLoading(true);
        setError(null);

        try {
            // Need business_id. In a client page, we can't get it easily without passing it down or fetching user session again?
            // BETTER ARCHITECTURE: Use server action or fetch session here? 
            // Or simplest: Just fetch /api/customers which extracts business_id from session automatically!
            // WAIT: My /api/customers endpoint expects `business_id` in body. This was a design choice in `backend_spec`.
            // Let's check `route.ts`.
            // Yes: `const { business_id ... } = result.data`.
            // Frontend doesn't readily know business_id unless we fetch it.
            // SOLUTION: I should fetch the business_id from session in the page wrapper (Server Component) and pass it here?
            // OR: Modify API to infer business_id from session if not provided? Spec says "never trust client-sent business_id blindly".
            // Correct Backend approach: The API *validates* the sent ID against membership.
            // Use Server Component wrapper.
            // Converting this component to Client Form and export default wrapper.
            throw new Error("This needs to be wrapped in a server component to get businessID");
        } catch (err: any) {
            // ...
        }
    }

    return <div>Start wrapper...</div>;
}
