"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle } from "lucide-react";

const formSchema = z.object({
    firstName: z.string().min(2, { message: "First name is required" }),
    lastName: z.string().min(2, { message: "Last name is required" }),
    businessName: z.string().min(2, { message: "Business name is required" }),
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export default function SignupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            businessName: "",
            email: "",
            password: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true);
        setError(null);

        const supabase = createClient();
        const { error: signUpError } = await supabase.auth.signUp({
            email: values.email,
            password: values.password,
            options: {
                data: {
                    first_name: values.firstName,
                    last_name: values.lastName,
                    business_name: values.businessName,
                },
            },
        });

        if (signUpError) {
            setError(signUpError.message);
            setLoading(false);
            return;
        }

        // Optimistic redirect or check email message
        // For streamlined flows (if email confirm is off), this works. 
        // If on, we should show a "Check your email" screen.
        // Assuming development flow / frictionless for now:
        router.push("/dashboard");
        router.refresh();
    }

    return (
        <div className="w-full flex-1 flex items-start justify-center bg-gray-50 pt-6 md:pt-16 pb-6 md:pb-12 px-4">
            <div className="w-full max-w-[440px] p-6 border border-border/40 bg-white shadow-sm rounded-xl">
                <div className="flex flex-col items-center gap-4 mb-6">
                    <div className="text-center space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
                        <p className="text-sm text-muted-foreground w-full max-w-[280px] mx-auto">
                            Start your 14-day free trial. No credit card required.
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 bg-red-50 text-red-600 text-sm p-3 rounded-md flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        {error}
                    </div>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem className="space-y-1">
                                        <FormLabel>First name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="John" {...field} className="h-9" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }) => (
                                    <FormItem className="space-y-1">
                                        <FormLabel>Last name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Doe" {...field} className="h-9" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="businessName"
                            render={({ field }) => (
                                <FormItem className="space-y-1">
                                    <FormLabel>Business Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Acme Inc." {...field} className="h-9" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem className="space-y-1">
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="m@example.com" {...field} className="h-9" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem className="space-y-1">
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} className="h-9" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full h-9 font-medium mt-2" disabled={loading}>
                            {loading ? "Creating Account..." : "Create Account"}
                        </Button>
                    </form>
                </Form>
                <div className="mt-4 text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/login" className="font-medium text-primary hover:underline">
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}
