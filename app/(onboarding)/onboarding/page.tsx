"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createBusiness, CreateBusinessState } from "@/lib/actions/business";
import { Loader2 } from "lucide-react";

export default function OnboardingPage() {
    const initialState: CreateBusinessState = { message: null, errors: {} };
    // @ts-expect-error useActionState types issue
    const [state, formAction, isPending] = useActionState(createBusiness, initialState);

    return (
        <>
            <div className="text-center mb-8 space-y-2">
                <h1 className="text-3xl font-semibold tracking-tighter text-foreground">
                    Create Workspace
                </h1>
                <p className="text-muted-foreground text-lg">
                    Give your business a home on Wytis.
                </p>
            </div>

            <Card className="w-full shadow-none border border-border/40 bg-card/50 backdrop-blur-sm">
                <form action={formAction}>
                    <CardContent className="space-y-6 pt-6 px-6">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium text-foreground/80">Business Name</Label>
                            <div className="relative group">
                                <div className="absolute left-3 top-3 text-muted-foreground group-focus-within:text-primary transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-building-2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /><path d="M10 6h4" /><path d="M10 10h4" /><path d="M10 14h4" /><path d="M10 18h4" /></svg>
                                </div>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="e.g. Acme Corp"
                                    required
                                    minLength={2}
                                    className="pl-10 h-12 bg-background border-border/60 focus-visible:ring-primary/20 transition-all font-medium"
                                />
                            </div>
                            {state.errors?.name && (
                                <p className="text-sm text-red-500 flex items-center gap-1.5 mt-1.5">
                                    <span className="w-1 h-1 rounded-full bg-red-500"></span>
                                    {state.errors.name[0]}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="gst_number" className="text-sm font-medium text-foreground/80">GST Number</Label>
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">Optional</span>
                            </div>
                            <div className="relative group">
                                <div className="absolute left-3 top-3 text-muted-foreground group-focus-within:text-primary transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M12 18v-4" /><path d="M8 18v-2" /><path d="M16 18v-6" /></svg>
                                </div>
                                <Input
                                    id="gst_number"
                                    name="gst_number"
                                    placeholder="22AAAAA0000A1Z5"
                                    className="pl-10 h-12 bg-background border-border/60 focus-visible:ring-primary/20 transition-all font-medium uppercase placeholder:normal-case"
                                    maxLength={15}
                                />
                            </div>
                            {state.errors?.gst_number && (
                                <p className="text-sm text-red-500 flex items-center gap-1.5 mt-1.5">
                                    <span className="w-1 h-1 rounded-full bg-red-500"></span>
                                    {state.errors.gst_number[0]}
                                </p>
                            )}
                        </div>

                        {state.message && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm font-medium text-center">
                                {state.message}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4 px-6 pb-6 pt-2">
                        <Button className="w-full h-12 text-base font-semibold shadow-md transition-all hover:shadow-lg hover:translate-y-[-1px]" type="submit" disabled={isPending}>
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Creating Workspace...
                                </>
                            ) : (
                                "Create Business"
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
            <p className="mt-8 text-center text-sm text-muted-foreground px-4 leading-relaxed max-w-[300px] mx-auto">
                By creating a workspace, you agree to our <a href="#" className="font-medium hover:text-primary transition-colors underline-offset-4 decoration-border hover:underline">Terms</a> and <a href="#" className="font-medium hover:text-primary transition-colors underline-offset-4 decoration-border hover:underline">Privacy Policy</a>.
            </p>
        </>
    );
}
