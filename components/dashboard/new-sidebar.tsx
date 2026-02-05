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

    // Mobile: Slide-over with backdrop
    if (isMobile) {
        return (
            <>
                {/* Backdrop - Fade only */}
                <div
                    className={cn(
                        "fixed inset-0 bg-black/50 z-40 transition-opacity duration-200",
                        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                    )}
                    onClick={onClose}
                    aria-hidden="true"
                />

                {/* Sidebar Panel - Slide with transform */}
                <aside
                    className={cn(
                        "fixed top-0 left-0 bottom-0 z-50 w-[280px]",
                        "bg-background border-r border-border/50",
                        "transition-transform duration-200 ease-out",
                        "will-change-transform", // GPU acceleration hint
                        isOpen ? "translate-x-0" : "-translate-x-full",
                        className
                    )}
                    data-version="smooth-v2-mobile-header"
                >
                    <div className="flex flex-col h-full">
                        {/* Mobile-Only Header with Logo and Close */}
                        <div className="flex items-center justify-between h-14 px-4 border-b border-border/50 shrink-0">
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-semibold text-foreground">Wytis</span>
                            </div>
                            <button
                                onClick={onClose}
                                className="flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent/50 transition-colors"
                                aria-label="Close sidebar"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-muted-foreground"
                                >
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
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
                </aside>
            </>
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
            data-version="smooth-v1-desktop"
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
