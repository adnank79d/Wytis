"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Phone, Mail, MessageSquare, Calendar, PlusCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { updateCustomer, addInteraction, getInteractions, type Customer, type Interaction } from "@/lib/actions/crm";
import { cn } from "@/lib/utils";

interface CustomerSheetProps {
    customer: Customer | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CustomerSheet({ customer, open, onOpenChange }: CustomerSheetProps) {
    const router = useRouter();
    const [interactions, setInteractions] = useState<Interaction[]>([]);
    const [loadingInteractions, setLoadingInteractions] = useState(false);

    // Fetch interactions when sheet opens or customer changes
    useEffect(() => {
        if (open && customer?.id) {
            setLoadingInteractions(true);
            getInteractions(customer.id)
                .then(data => {
                    setInteractions(data);
                })
                .finally(() => {
                    setLoadingInteractions(false);
                });
        }
    }, [open, customer?.id]);

    if (!customer) return null;

    async function handleUpdate(formData: FormData) {
        await updateCustomer(customer!.id, {}, formData);
        onOpenChange(false);
        router.refresh();
    }

    async function handleAddInteraction(formData: FormData) {
        await addInteraction(customer!.id, formData);

        // Refresh interactions list eagerly
        const newData = await getInteractions(customer!.id);
        setInteractions(newData);

        // Refresh parent to update 'last contacted' in table
        router.refresh();

        // Clear form? standard form action doesn't auto-clear controlled inputs easily without reset
        // but natively it might clear if we didn't prevent default. 
        // For now, let's assume user might want to add another or close.
        // To be perfect, we'd ref the form and reset it, but simplistic is fine.
        const form = document.getElementById("interaction-form") as HTMLFormElement;
        if (form) form.reset();
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'call': return Phone;
            case 'email': return Mail;
            case 'meeting': return Calendar;
            case 'note': return MessageSquare;
            default: return MessageSquare;
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-[800px] overflow-y-auto sm:border-l p-0 gap-0">
                <div className="p-6 border-b bg-muted/10 sticky top-0 z-10 backdrop-blur-sm">
                    <SheetHeader>
                        <SheetTitle className="text-xl">Customer Details</SheetTitle>
                        <SheetDescription>View and manage client information and history.</SheetDescription>
                    </SheetHeader>
                </div>

                <div className="p-6">
                    <Tabs defaultValue="details">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="details">Profile</TabsTrigger>
                            <TabsTrigger value="history">Activity Log</TabsTrigger>
                        </TabsList>

                        {/* DETAILS TAB (EDIT FORM) */}
                        <TabsContent value="details">
                            <form key={customer.id} action={handleUpdate} className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Contact Name</Label>
                                        <Input id="name" name="name" defaultValue={customer.name} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="company_name">Company Name</Label>
                                        <Input id="company_name" name="company_name" defaultValue={customer.company_name || ''} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="status">Status</Label>
                                        <Select name="status" defaultValue={customer.status}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="lead">Lead</SelectItem>
                                                <SelectItem value="prospect">Prospect</SelectItem>
                                                <SelectItem value="customer">Customer</SelectItem>
                                                <SelectItem value="inactive">Inactive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="tags">Tags (comma separated)</Label>
                                        <Input id="tags" name="tags" defaultValue={customer.tags ? customer.tags.join(', ') : ''} />
                                    </div>
                                </div>

                                <Separator />

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" name="email" type="email" defaultValue={customer.email || ''} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input id="phone" name="phone" defaultValue={customer.phone || ''} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="address">Address</Label>
                                    <Textarea id="address" name="address" defaultValue={customer.address || ''} rows={2} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="gst_number">GSTIN</Label>
                                    <Input id="gst_number" name="gst_number" defaultValue={customer.gst_number || ''} />
                                </div>

                                <SheetFooter className="mt-4">
                                    <Button type="submit">Save Changes</Button>
                                </SheetFooter>
                            </form>
                        </TabsContent>

                        {/* HISTORY TAB */}
                        <TabsContent value="history" className="space-y-6">
                            {/* Add Interaction Form */}
                            <div className="bg-muted/30 p-4 rounded-lg border space-y-3">
                                <h4 className="text-sm font-medium flex items-center gap-2">
                                    <PlusCircle className="h-4 w-4" /> Log New Activity
                                </h4>
                                <form id="interaction-form" action={handleAddInteraction} className="space-y-3">
                                    <div className="flex gap-2">
                                        <Select name="type" defaultValue="call">
                                            <SelectTrigger className="w-[140px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="call">Call</SelectItem>
                                                <SelectItem value="email">Email</SelectItem>
                                                <SelectItem value="meeting">Meeting</SelectItem>
                                                <SelectItem value="note">Note</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Input type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} className="flex-1" />
                                    </div>
                                    <Textarea name="details" placeholder="What happened?" required rows={2} />
                                    <Button type="submit" size="sm" variant="secondary" className="w-full">Save Log</Button>
                                </form>
                            </div>

                            {/* Timeline */}
                            <div className="space-y-0 relative pl-4 border-l-2 border-muted/50 ml-2">
                                {loadingInteractions ? (
                                    <div className="py-8 text-center text-sm text-muted-foreground">Loading history...</div>
                                ) : interactions.length === 0 ? (
                                    <div className="py-8 text-center text-sm text-muted-foreground">No interactions logged yet.</div>
                                ) : (
                                    interactions.map((interaction) => {
                                        const Icon = getTypeIcon(interaction.type);
                                        return (
                                            <div key={interaction.id} className="relative pb-6 pl-6 last:pb-0">
                                                <div className={cn(
                                                    "absolute -left-[25px] top-0 h-8 w-8 rounded-full border-4 border-background flex items-center justify-center shadow-sm",
                                                    "bg-muted text-muted-foreground"
                                                )}>
                                                    <Icon className="h-3.5 w-3.5" />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-baseline justify-between">
                                                        <span className="text-sm font-semibold capitalize">{interaction.type}</span>
                                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {format(new Date(interaction.interaction_date), 'MMM dd, yyyy')}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-foreground/80 whitespace-pre-wrap">{interaction.details}</p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </SheetContent>
        </Sheet>
    );
}
