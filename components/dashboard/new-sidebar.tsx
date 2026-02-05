"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
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
    onNavigate?: () => void;
}

export function NewSidebar({ className, isMobile = false, onNavigate }: SidebarProps) {
    const pathname = usePathname();
    const [isExpanded, setIsExpanded] = React.useState(true);

    // Mobile: Touch-friendly slide-over panel
    if (isMobile) {
        return (
            <div className="flex flex-col h-full bg-background">
                {/* Mobile Navigation */}
                <nav className="flex-1 flex flex-col px-4 py-4">
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
                                                onClick={onNavigate}
                                                className={cn(
                                                    "flex items-center gap-3 px-3 py-2.5 rounded-md",
                                                    "transition-all duration-150",
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

                                {/* Divider after each group */}
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
                                        onClick={onNavigate}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2.5 rounded-md",
                                            "transition-all duration-150",
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

    // Desktop/Tablet: Expandable sidebar with NO SCROLL
    return (
        <aside
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
            className={cn(
                "flex flex-col h-full bg-background border-r border-border/50",
                "transition-all duration-200 ease-out",
                isExpanded ? "w-60" : "w-16",
                className
            )}
            data-version="redesign-v2-no-scroll"
        >
            {/* Main Navigation - Takes available space */}
            <nav className="flex-1 min-h-0 flex flex-col gap-4 py-4 overflow-hidden">
                {mainNavigationGroups.map((group, groupIdx) => (
                    <div key={groupIdx}>
                        {/* Group Label */}
                        <div className={cn(
                            "mb-2 px-3",
                            !isExpanded && "flex justify-center"
                        )}>
                            {isExpanded ? (
                                <h4 className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                                    {group.title}
                                </h4>
                            ) : (
                                <div className="w-1 h-3 bg-border/50 rounded-full" />
                            )}
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
                                            "transition-all duration-150",
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

                                        {/* Label */}
                                        <span className={cn(
                                            "text-sm font-medium whitespace-nowrap transition-all duration-200",
                                            isExpanded
                                                ? "opacity-100 translate-x-0"
                                                : "opacity-0 -translate-x-2 w-0 overflow-hidden"
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

                        {/* Divider after each group */}
                        {groupIdx < mainNavigationGroups.length - 1 && (
                            <div className={cn(
                                "h-px bg-border/30 mt-3",
                                !isExpanded && "mx-3"
                            )} />
                        )}
                    </div>
                ))}
            </nav>

            {/* Utilities - Anchored to Bottom */}
            <div className="flex-shrink-0 border-t border-border/30 py-3">
                <div className={cn(
                    "mb-2 px-3",
                    !isExpanded && "flex justify-center"
                )}>
                    {isExpanded ? (
                        <h4 className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                            {utilitiesGroup.title}
                        </h4>
                    ) : (
                        <div className="w-1 h-3 bg-border/50 rounded-full" />
                    )}
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
                                    "transition-all duration-150",
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
                                    "text-sm font-medium whitespace-nowrap transition-all duration-200",
                                    isExpanded
                                        ? "opacity-100 translate-x-0"
                                        : "opacity-0 -translate-x-2 w-0 overflow-hidden"
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
