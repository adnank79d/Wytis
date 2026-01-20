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
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true);
        setError(null);

        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({
            email: values.email,
            password: values.password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        router.push("/dashboard");
        router.refresh();
    }

    return (
        <div className="w-full flex-1 flex items-start justify-center bg-gray-50 pt-12 md:pt-24 pb-12 md:pb-24">
            <div className="w-full max-w-[400px] p-8 border border-border/40 bg-white shadow-sm rounded-xl">
                <div className="flex flex-col items-center gap-6 mb-8">
                    <div className="text-center space-y-2">
                        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
                        <p className="text-sm text-muted-foreground">
                            Enter your email to sign in to your account
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
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="m@example.com" {...field} className="h-10" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center">
                                        <FormLabel>Password</FormLabel>
                                        <Link
                                            href="/forgot-password"
                                            className="ml-auto inline-block text-xs font-medium text-primary hover:underline"
                                        >
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <FormControl>
                                        <Input type="password" {...field} className="h-10" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full h-10 font-medium" disabled={loading}>
                            {loading ? "Signing in..." : "Sign in"}
                        </Button>
                    </form>
                </Form>

                <div className="mt-6 text-center text-sm text-muted-foreground">
                    Don&apos;t have an account?{" "}
                    <Link href="/signup" className="font-medium text-primary hover:underline">
                        Sign up
                    </Link>
                </div>
            </div>
        </div>
    );
}
