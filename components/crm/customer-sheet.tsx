"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
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
import { Badge } from "@/components/ui/badge";
import {
    Phone, Mail, MessageSquare, Calendar, PlusCircle, Clock,
    User, Building, MapPin, Tag, Briefcase, Hash, Send
} from "lucide-react";
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
        const newData = await getInteractions(customer!.id);
        setInteractions(newData);
        router.refresh();
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'lead': return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
            case 'prospect': return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
            case 'customer': return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100';
            case 'inactive': return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
            default: return 'bg-secondary';
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-[850px] overflow-y-auto p-0 gap-0 border-l shadow-2xl">

                {/* HERO HEADER */}
                <div className="bg-muted/10 border-b p-8 sticky top-0 z-20 backdrop-blur-md">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-5 items-center">
                            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-background shadow-sm">
                                <span className="text-2xl font-bold text-primary">
                                    {customer.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <SheetTitle className="text-2xl font-bold tracking-tight">{customer.name}</SheetTitle>
                                    <Badge variant="outline" className={cn("capitalize px-2.5 py-0.5 text-xs font-semibold border-0", getStatusColor(customer.status))}>
                                        {customer.status}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    {customer.company_name && (
                                        <>
                                            <Building className="h-3.5 w-3.5" />
                                            <span>{customer.company_name}</span>
                                            <span className="text-muted-foreground/30">•</span>
                                        </>
                                    )}
                                    <span className="text-xs">Added {format(new Date(customer.created_at), 'MMM yyyy')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    <Tabs defaultValue="details" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/50 p-1 h-11">
                            <TabsTrigger value="details" className="text-sm font-medium">Profile Details</TabsTrigger>
                            <TabsTrigger value="history" className="text-sm font-medium">Activity Timeline</TabsTrigger>
                        </TabsList>

                        {/* --- PROFILE TAB --- */}
                        <TabsContent value="details" className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                            <form key={customer.id} action={handleUpdate} className="space-y-8">

                                {/* Section: Primary Info */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-primary font-semibold border-b pb-2">
                                        <User className="h-4 w-4" /> <h3>Primary Information</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Full Name</Label>
                                            <Input id="name" name="name" defaultValue={customer.name} className="bg-muted/5" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="status">Current Status</Label>
                                            <Select name="status" defaultValue={customer.status}>
                                                <SelectTrigger className="bg-muted/5">
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
                                    </div>
                                </div>

                                {/* Section: Contact Details */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-primary font-semibold border-b pb-2">
                                        <Phone className="h-4 w-4" /> <h3>Contact Details</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email Address</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input id="email" name="email" type="email" defaultValue={customer.email || ''} className="pl-9 bg-muted/5" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone Number</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input id="phone" name="phone" defaultValue={customer.phone || ''} className="pl-9 bg-muted/5" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Business Info */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-primary font-semibold border-b pb-2">
                                        <Briefcase className="h-4 w-4" /> <h3>Business Details</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="company_name">Company</Label>
                                            <Input id="company_name" name="company_name" defaultValue={customer.company_name || ''} className="bg-muted/5" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="gst_number">GSTIN / Tax ID</Label>
                                            <div className="relative">
                                                <Hash className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input id="gst_number" name="gst_number" defaultValue={customer.gst_number || ''} className="pl-9 bg-muted/5" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="address">Billing Address</Label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Textarea id="address" name="address" defaultValue={customer.address || ''} className="pl-9 bg-muted/5 min-h-[80px]" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="tags">Tags</Label>
                                        <div className="relative">
                                            <Tag className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input id="tags" name="tags" placeholder="VIP, Wholesale, etc." defaultValue={customer.tags ? customer.tags.join(', ') : ''} className="pl-9 bg-muted/5" />
                                        </div>
                                        <p className="text-[10px] text-muted-foreground pl-1">Separate multiples with commas.</p>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button type="submit" size="lg" className="px-8">Update Profile</Button>
                                </div>
                            </form>
                        </TabsContent>

                        {/* --- HISTORY TAB --- */}
                        <TabsContent value="history" className="space-y-8 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">

                            {/* Input Area */}
                            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
                                <div className="bg-muted/40 px-4 py-3 border-b flex items-center justify-between">
                                    <h4 className="text-sm font-semibold flex items-center gap-2">
                                        <PlusCircle className="h-4 w-4 text-primary" /> Log Interaction
                                    </h4>
                                    <span className="text-xs text-muted-foreground">Record calls, notes, or meetings</span>
                                </div>
                                <div className="p-4">
                                    <form id="interaction-form" action={handleAddInteraction} className="space-y-4">
                                        <div className="flex gap-3">
                                            <div className="w-[160px] shrink-0">
                                                <Select name="type" defaultValue="call">
                                                    <SelectTrigger className="bg-muted/5">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="call">Call</SelectItem>
                                                        <SelectItem value="email">Email</SelectItem>
                                                        <SelectItem value="meeting">Meeting</SelectItem>
                                                        <SelectItem value="note">Note</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex-1">
                                                <Input type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} className="bg-muted/5" />
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <Textarea name="details" placeholder="Describe the interaction details..." required rows={3} className="bg-muted/5 resize-none pr-10" />
                                            <Button type="submit" size="icon" className="absolute right-2 bottom-2 h-7 w-7 rounded-sm shadow-none" title="Save Log">
                                                <Send className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            </div>

                            {/* Timeline Feed */}
                            <div className="relative pl-6 space-y-8 before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-muted before:to-transparent">
                                {loadingInteractions ? (
                                    <div className="py-10 text-center text-sm text-muted-foreground">Loading timeline...</div>
                                ) : interactions.length === 0 ? (
                                    <div className="py-10 text-center text-sm text-muted-foreground">No history available. Start by logging an interaction.</div>
                                ) : (
                                    interactions.map((interaction) => {
                                        const Icon = getTypeIcon(interaction.type);
                                        return (
                                            <div key={interaction.id} className="relative group">
                                                <div className={cn(
                                                    "absolute -left-[35px] top-1 h-8 w-8 rounded-full border-4 border-background flex items-center justify-center shadow-sm z-10 transition-transform group-hover:scale-110",
                                                    "bg-white text-primary ring-1 ring-muted"
                                                )}>
                                                    <Icon className="h-3.5 w-3.5" />
                                                </div>
                                                <div className="bg-card/50 border rounded-lg p-4 shadow-sm hover:bg-card hover:shadow-md transition-all duration-200">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm font-bold capitalize text-foreground/90 flex items-center gap-2">
                                                            {interaction.type}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground font-medium flex items-center gap-1 bg-muted/40 px-2 py-0.5 rounded-full">
                                                            <Clock className="h-3 w-3" />
                                                            {format(new Date(interaction.interaction_date), 'MMM dd, yyyy')}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                                        {interaction.details}
                                                    </p>
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
