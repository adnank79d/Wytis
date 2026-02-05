"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Receipt,
    LineChart,
    Package,
    CreditCard,
    Users,
    Wallet,
    Briefcase,
    Calculator,
    Contact2,
    Banknote,
    BarChart4,
    Settings,
} from "lucide-react";
import * as React from "react";

const sidebarGroups = [
    {
        title: "Overview",
        items: [
            { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
            { label: "Analytics", icon: BarChart4, href: "/analytics" },
            { label: "Reports", icon: LineChart, href: "/reports" },
        ]
    },
    {
        title: "Business",
        items: [
            { label: "Invoices", icon: Receipt, href: "/invoices" },
            { label: "Payments", icon: CreditCard, href: "/payments" },
            { label: "Inventory", icon: Package, href: "/inventory" },
            { label: "Expenses", icon: Wallet, href: "/expenses" },
            { label: "GST", icon: Calculator, href: "/gst" },
        ]
    },
    {
        title: "Management",
        items: [
            { label: "Customers", icon: Users, href: "/customers" },
            { label: "CRM", icon: Contact2, href: "/crm" },
            { label: "HR", icon: Briefcase, href: "/hr" },
            { label: "Payroll", icon: Banknote, href: "/payroll" },
        ]
    },
];

interface SidebarProps {
    className?: string;
    isMobile?: boolean;
    onNavigate?: () => void;
}

export function NewSidebar({ className, isMobile = false, onNavigate }: SidebarProps) {
    const pathname = usePathname();
    const [isExpanded, setIsExpanded] = React.useState(false);

    // Mobile: Return touch-friendly drawer trigger (handled by parent)
    if (isMobile) {
        return (
            <div className="flex flex-col h-full bg-background p-4">
                {/* Mobile Navigation Items */}
                <nav className="flex-1 flex flex-col gap-6">
                    {sidebarGroups.map((group, groupIdx) => (
                        <div key={groupIdx}>
                            {/* Section Header */}
                            <div className="mb-3">
                                <h4 className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider px-2">
                                    {group.title}
                                </h4>
                            </div>

                            {/* Section Items */}
                            <div className="flex flex-col gap-1">
                                {group.items.map((item) => {
                                    const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={onNavigate}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-3 rounded-md",
                                                "transition-all duration-150",
                                                "active:scale-95", // Touch feedback
                                                isActive
                                                    ? "bg-primary/10 text-primary font-medium"
                                                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                                            )}
                                        >
                                            <item.icon className="h-5 w-5 shrink-0" />
                                            <span className="text-base">{item.label}</span>
                                            {isActive && (
                                                <div className="ml-auto w-1 h-5 bg-primary rounded-l" />
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Settings - Bottom */}
                <div className="border-t border-border/50 pt-4 mt-4">
                    <Link
                        href="/settings"
                        onClick={onNavigate}
                        className={cn(
                            "flex items-center gap-3 px-3 py-3 rounded-md",
                            "transition-all duration-150",
                            "active:scale-95",
                            (pathname === "/settings" || pathname?.startsWith("/settings/"))
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                        )}
                    >
                        <Settings className="h-5 w-5 shrink-0" />
                        <span className="text-base">Settings</span>
                        {(pathname === "/settings" || pathname?.startsWith("/settings/")) && (
                            <div className="ml-auto w-1 h-5 bg-primary rounded-l" />
                        )}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <aside
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
            className={cn(
                "group/sidebar flex flex-col h-full bg-muted/30 border-r border-border/50",
                "transition-all duration-150 ease-out relative",
                isExpanded ? "w-60" : "w-16",
                className
            )}
            data-version="supabase-v10"
        >
            {/* Navigation */}
            <nav className="flex-1 flex flex-col justify-between py-2">
                <div className="flex flex-col gap-6">
                    {sidebarGroups.map((group, groupIdx) => (
                        <div key={groupIdx}>
                            {/* Section Header */}
                            {group.title && (
                                <div className={cn(
                                    "mb-6 mt-1",
                                    isExpanded ? "px-3" : "flex justify-center px-3"
                                )}>
                                    {isExpanded ? (
                                        <h4 className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                                            {group.title}
                                        </h4>
                                    ) : (
                                        <div className="text-[10px] font-bold text-muted-foreground/50 uppercase">
                                            {group.title[0]}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Section Items */}
                            <div className="flex flex-col gap-0.5 px-3">
                                {group.items.map((item) => {
                                    const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={onNavigate}
                                            className={cn(
                                                "relative flex items-center h-8 rounded-md",
                                                "transition-all duration-150",
                                                "group/item",
                                                isActive
                                                    ? "bg-primary/10 text-primary"
                                                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                                            )}
                                        >
                                            {/* Icon - Fixed position */}
                                            <div className="w-10 flex items-center justify-center shrink-0">
                                                <item.icon className={cn(
                                                    "h-[18px] w-[18px] transition-transform",
                                                    isActive && "scale-105"
                                                )} />
                                            </div>

                                            {/* Label - Fades in */}
                                            <span className={cn(
                                                "text-sm font-medium whitespace-nowrap transition-all duration-150",
                                                isExpanded
                                                    ? "opacity-100 translate-x-0"
                                                    : "opacity-0 -translate-x-2 w-0 overflow-hidden"
                                            )}>
                                                {item.label}
                                            </span>

                                            {/* Active indicator */}
                                            {isActive && (
                                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-l" />
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Settings - Bottom */}
                <div className="px-3">
                    <Link
                        href="/settings"
                        onClick={onNavigate}
                        className={cn(
                            "relative flex items-center h-8 rounded-md",
                            "transition-all duration-150",
                            (pathname === "/settings" || pathname?.startsWith("/settings/"))
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                        )}
                    >
                        <div className="w-10 flex items-center justify-center shrink-0">
                            <Settings className="h-[18px] w-[18px]" />
                        </div>
                        <span className={cn(
                            "text-sm font-medium whitespace-nowrap transition-all duration-150",
                            isExpanded
                                ? "opacity-100 translate-x-0"
                                : "opacity-0 -translate-x-2 w-0 overflow-hidden"
                        )}>
                            Settings
                        </span>
                        {(pathname === "/settings" || pathname?.startsWith("/settings/")) && (
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-l" />
                        )}
                    </Link>
                </div>
            </nav>
        </aside>
    );
}
