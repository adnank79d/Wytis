"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
    LayoutDashboard,
    Receipt,
    Wallet,
    Users,
    Building2,
    Package,
    ShoppingCart,
    BarChart4,
    Calculator,
    Landmark,
    Settings,
    CreditCard,
    HelpCircle,
    X,
} from "lucide-react";
import * as React from "react";

// Main navigation groups
const mainNavigationGroups = [
    {
        title: "Primary Navigation",
        items: [
            { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
            { label: "Invoices", icon: Receipt, href: "/invoices" },
            { label: "Expenses", icon: Wallet, href: "/expenses" },
            { label: "Customers", icon: Users, href: "/customers" },
            { label: "Vendors", icon: Building2, href: "/vendors" },
            { label: "Inventory", icon: Package, href: "/inventory" },
            { label: "Purchase Orders", icon: ShoppingCart, href: "/purchase-orders" },
            { label: "Reports", icon: BarChart4, href: "/reports" },
        ]
    },
    {
        title: "Compliance & Finance",
        items: [
            { label: "GST & Compliance", icon: Calculator, href: "/gst" },
            { label: "Bank Reconciliation", icon: Landmark, href: "/bank-reconciliation" },
        ]
    },
];

// Utilities - always at bottom
const utilitiesGroup = {
    title: "Utilities",
    items: [
        { label: "Settings", icon: Settings, href: "/settings" },
        { label: "Billing & Plan", icon: CreditCard, href: "/billing" },
        { label: "Help & Documentation", icon: HelpCircle, href: "/help" },
    ]
};

interface SidebarProps {
    className?: string;
    isMobile?: boolean;
    isOpen?: boolean;
    onClose?: () => void;
    onNavigate?: () => void;
}

export function NewSidebar({ className, isMobile = false, isOpen = false, onClose, onNavigate }: SidebarProps) {
    const pathname = usePathname();

    const handleNavigation = () => {
        if (onNavigate) onNavigate();
        if (isMobile && onClose) onClose();
    };

    // Mobile: Simplified for use inside Sheet component
    if (isMobile) {
        return (
            <div className={cn("flex flex-col h-full bg-background", className)}>
                {/* Mobile-Only Header with Logo and Close */}
                <div className="flex items-center justify-between h-14 px-4 border-b border-border/50 shrink-0">
                    <div className="flex items-center gap-2">
                        <Image
                            src="/logo.png"
                            alt="Wytis"
                            width={100}
                            height={32}
                            className="h-7 w-auto object-contain"
                            priority
                            aria-label="Wytis"
                        />
                    </div>
                    <DialogPrimitive.Close
                        className="flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        aria-label="Close sidebar"
                    >
                        <X className="h-5 w-5 text-muted-foreground" />
                    </DialogPrimitive.Close>
                </div>

                {/* Mobile Navigation */}
                <nav className="flex-1 flex flex-col px-4 py-4 overflow-y-auto">
                    {/* Main Navigation */}
                    <div className="flex flex-col gap-3">
                        {mainNavigationGroups.map((group, groupIdx) => (
                            <div key={groupIdx}>
                                {/* Group Label */}
                                <div className="mb-2 px-2">
                                    <h4 className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                                        {group.title}
                                    </h4>
                                </div>

                                {/* Group Items */}
                                <div className="flex flex-col gap-0.5">
                                    {group.items.map((item) => {
                                        const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={handleNavigation}
                                                className={cn(
                                                    "flex items-center gap-3 px-3 py-2.5 rounded-md",
                                                    "transition-colors duration-150",
                                                    "active:scale-[0.98]",
                                                    isActive
                                                        ? "bg-primary/10 text-primary font-medium"
                                                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                                                )}
                                            >
                                                <item.icon className="h-5 w-5 shrink-0" />
                                                <span className="text-sm">{item.label}</span>
                                                {isActive && (
                                                    <div className="ml-auto w-1 h-5 bg-primary rounded-l" />
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>

                                {/* Divider */}
                                {groupIdx < mainNavigationGroups.length - 1 && (
                                    <div className="h-px bg-border/30 my-3" />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Utilities - Bottom */}
                    <div className="mt-auto pt-3 border-t border-border/30">
                        <div className="mb-2 px-2">
                            <h4 className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                                {utilitiesGroup.title}
                            </h4>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            {utilitiesGroup.items.map((item) => {
                                const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={handleNavigation}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2.5 rounded-md",
                                            "transition-colors duration-150",
                                            "active:scale-[0.98]",
                                            isActive
                                                ? "bg-primary/10 text-primary font-medium"
                                                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                                        )}
                                    >
                                        <item.icon className="h-5 w-5 shrink-0" />
                                        <span className="text-sm">{item.label}</span>
                                        {isActive && (
                                            <div className="ml-auto w-1 h-5 bg-primary rounded-l" />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </nav>
            </div>
        );
    }

    // Desktop: Always visible, hover to expand labels
    return (
        <aside
            className={cn(
                "flex flex-col h-full bg-background border-r border-border/50",
                "w-16 group/sidebar hover:w-60",
                "transition-[width] duration-200 ease-out",
                className
            )}
            data-version="smooth-v3-sheet-fixed"
        >
            {/* Main Navigation - Takes available space */}
            <nav className="flex-1 min-h-0 flex flex-col gap-4 py-4 overflow-hidden">
                {mainNavigationGroups.map((group, groupIdx) => (
                    <div key={groupIdx}>
                        {/* Group Label */}
                        <div className="mb-2 px-3 flex justify-start">
                            <div className="group-hover/sidebar:hidden w-1 h-3 bg-border/50 rounded-full" />
                            <h4 className="hidden group-hover/sidebar:block text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                                {group.title}
                            </h4>
                        </div>

                        {/* Group Items */}
                        <div className="flex flex-col gap-0.5 px-3">
                            {group.items.map((item) => {
                                const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={onNavigate}
                                        className={cn(
                                            "relative flex items-center h-9 rounded-md",
                                            "transition-colors duration-150",
                                            "group/item",
                                            isActive
                                                ? "bg-primary/10 text-primary font-medium"
                                                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                                        )}
                                    >
                                        {/* Icon */}
                                        <div className="w-9 flex items-center justify-center shrink-0">
                                            <item.icon className={cn(
                                                "h-[18px] w-[18px]",
                                                isActive && "scale-105"
                                            )} />
                                        </div>

                                        {/* Label - Fades in on hover */}
                                        <span className={cn(
                                            "text-sm font-medium whitespace-nowrap",
                                            "opacity-0 group-hover/sidebar:opacity-100",
                                            "transition-opacity duration-200",
                                            "overflow-hidden"
                                        )}>
                                            {item.label}
                                        </span>

                                        {/* Active indicator */}
                                        {isActive && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r" />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Divider */}
                        {groupIdx < mainNavigationGroups.length - 1 && (
                            <div className="h-px bg-border/30 mt-3 mx-3" />
                        )}
                    </div>
                ))}
            </nav>

            {/* Utilities - Anchored to Bottom */}
            <div className="flex-shrink-0 border-t border-border/30 py-3">
                <div className="mb-2 px-3 flex justify-start">
                    <div className="group-hover/sidebar:hidden w-1 h-3 bg-border/50 rounded-full" />
                    <h4 className="hidden group-hover/sidebar:block text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                        {utilitiesGroup.title}
                    </h4>
                </div>

                <div className="flex flex-col gap-0.5 px-3">
                    {utilitiesGroup.items.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onNavigate}
                                className={cn(
                                    "relative flex items-center h-9 rounded-md",
                                    "transition-colors duration-150",
                                    isActive
                                        ? "bg-primary/10 text-primary font-medium"
                                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                                )}
                            >
                                <div className="w-9 flex items-center justify-center shrink-0">
                                    <item.icon className={cn(
                                        "h-[18px] w-[18px]",
                                        isActive && "scale-105"
                                    )} />
                                </div>

                                <span className={cn(
                                    "text-sm font-medium whitespace-nowrap",
                                    "opacity-0 group-hover/sidebar:opacity-100",
                                    "transition-opacity duration-200",
                                    "overflow-hidden"
                                )}>
                                    {item.label}
                                </span>

                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r" />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </aside>
    );
}
