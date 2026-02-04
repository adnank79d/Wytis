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
import { ScrollArea } from "@/components/ui/scroll-area";

// --- Configuration ---
const SIDEBAR_ANIMATION = "transition-all duration-300 ease-in-out";

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

export function Sidebar({ className, isMobile = false, onNavigate }: SidebarProps) {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = React.useState(!isMobile);
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
        if (isMobile) {
            setIsCollapsed(false);
        }
    }, [isMobile]);

    const handleMouseEnter = () => {
        if (!isMobile) setIsCollapsed(false);
    };

    const handleMouseLeave = () => {
        if (!isMobile) setIsCollapsed(true);
    };

    const effectiveCollapsed = isMobile ? false : isCollapsed;

    if (!isMounted) {
        return <div className={cn("border-r bg-sidebar flex flex-col h-full w-[70px]", className)} />;
    }

    return (
        <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={cn(
                "flex flex-col h-full bg-sidebar border-r border-sidebar-border relative z-20 text-sidebar-foreground",
                SIDEBAR_ANIMATION,
                effectiveCollapsed ? "w-[70px]" : "w-64",
                isMobile && "w-full border-none",
                className
            )}
            data-version="stabilized-v5"
        >
            {/* Mobile Header */}
            {!isMobile && (
                <div className={cn(
                    "flex items-center h-16 px-6 lg:hidden border-b border-sidebar-border",
                    "justify-between"
                )}>
                    <span className={cn("font-semibold tracking-tight", effectiveCollapsed && "hidden")}>Menu</span>
                </div>
            )}

            {/* Scrollable Navigation Area */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                <ScrollArea className="flex-1">
                    <div className={cn("flex flex-col gap-8 py-6", isMobile ? "px-6" : "px-0")}>
                        {sidebarGroups.map((group, groupIndex) => (
                            <div key={group.title} className="flex flex-col gap-2">
                                {/* Group Title */}
                                {!effectiveCollapsed && (
                                    <h4 className="px-6 py-1 text-xs font-semibold text-muted-foreground/50 uppercase tracking-widest pl-6">
                                        {group.title}
                                    </h4>
                                )}

                                <div className="flex flex-col gap-1">
                                    {group.items.map((route) => {
                                        const isActive = pathname === route.href || pathname?.startsWith(`${route.href}/`);

                                        return (
                                            <Link
                                                key={route.href}
                                                href={route.href}
                                                onClick={onNavigate}
                                                className={cn(
                                                    "flex items-center text-sm font-medium transition-all group/item relative",
                                                    SIDEBAR_ANIMATION,
                                                    // CRITICAL FIX: Consistent horizontal padding (pl-6) ensures icon NEVER moves
                                                    "pl-6 py-3 min-h-[44px]",
                                                    isActive
                                                        ? "text-sidebar-primary bg-sidebar-accent/40 border-r-2 border-primary"
                                                        : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/20",
                                                )}
                                                title={effectiveCollapsed ? route.label : undefined}
                                            >
                                                <route.icon className={cn(
                                                    "shrink-0 transition-colors",
                                                    isMobile ? "h-5 w-5" : "h-5 w-5",
                                                    isActive ? "text-sidebar-primary" : "text-muted-foreground group-hover/item:text-sidebar-foreground"
                                                )} />

                                                <span className={cn(
                                                    "ml-4 truncate transition-all duration-300",
                                                    effectiveCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
                                                )}>
                                                    {route.label}
                                                </span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Pinned Footer (Settings) */}
            <div className={cn(
                "mt-auto border-t border-sidebar-border bg-sidebar",
                isMobile && "pb-8"
            )}>
                <Link
                    href="/settings"
                    onClick={onNavigate}
                    className={cn(
                        "flex items-center text-sm font-medium transition-all group/item relative h-16",
                        SIDEBAR_ANIMATION,
                        // Consistent padding
                        "pl-6",
                        (pathname === "/settings" || pathname?.startsWith("/settings/"))
                            ? "text-sidebar-primary bg-sidebar-accent/40"
                            : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/20"
                    )}
                    title="Settings"
                >
                    <Settings className={cn(
                        "shrink-0 transition-colors",
                        isMobile ? "h-5 w-5" : "h-5 w-5",
                        (pathname === "/settings" || pathname?.startsWith("/settings/"))
                            ? "text-sidebar-primary"
                            : "text-muted-foreground group-hover/item:text-sidebar-foreground"
                    )} />

                    <span className={cn(
                        "ml-4 truncate transition-all duration-300",
                        effectiveCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
                    )}>
                        Settings
                    </span>
                </Link>
            </div>
        </div>
    );
}
