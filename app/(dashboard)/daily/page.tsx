"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Using strings for form inputs to avoid handling number coercion issues during typing
// We can parse them to numbers on submit
const formSchema = z.object({
    date: z.string(),
    totalCash: z.string().refine((val) => !isNaN(Number(val)), { message: "Must be a valid number" }),
    totalOnline: z.string().refine((val) => !isNaN(Number(val)), { message: "Must be a valid number" }),
    expenses: z.string().refine((val) => !isNaN(Number(val)), { message: "Must be a valid number" }),
    notes: z.string().optional(),
});

export default function DailyLogPage() {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            date: new Date().toISOString().split('T')[0],
            totalCash: "0",
            totalOnline: "0",
            expenses: "0",
            notes: "",
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        const submissionData = {
            ...values,
            totalCash: Number(values.totalCash),
            totalOnline: Number(values.totalOnline),
            expenses: Number(values.expenses),
        };
        console.log("Submitting:", submissionData);
        // Submit to Supabase
    }

    return (
        <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Daily Log</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>End of Day Report</CardTitle>
                    <CardDescription>Submit your daily sales and expenses.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Date</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="totalCash"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Total Cash</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" {...field} />
                                            </FormControl>
                                            <FormDescription>Physical cash collected.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="totalOnline"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Total Online</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" {...field} />
                                            </FormControl>
                                            <FormDescription>Card/Digital payments.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="expenses"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Daily Expenses</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormDescription>Any petty cash spent today.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Notes</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Any issues or comments..." className="min-h-[100px]" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full">
                                Submit Log
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
