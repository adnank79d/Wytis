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
// Rigid dimensions are key to preventing layout shift
const DIMENSIONS = {
    collapsed: "w-[72px]",
    expanded: "w-[270px]",
    iconZone: "w-[72px] min-w-[72px]", // Fixed width container for icons
    itemHeight: "h-11", // Standard item height
};

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
        return <div className={cn("border-r bg-sidebar flex flex-col h-full", DIMENSIONS.collapsed, className)} />;
    }

    return (
        <aside
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={cn(
                "flex flex-col h-full bg-sidebar border-r border-sidebar-border relative z-20 text-sidebar-foreground overflow-hidden",
                "transition-[width] duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)]", // Smooth width only
                effectiveCollapsed ? DIMENSIONS.collapsed : DIMENSIONS.expanded,
                isMobile && "w-full border-none",
                className
            )}
            data-version="new-sidebar-v7"
        >
            {/* Mobile Header */}
            {!isMobile && (
                <div className={cn(
                    "flex items-center h-16 border-b border-sidebar-border lg:hidden",
                    effectiveCollapsed ? "justify-center" : "justify-between px-6"
                )}>
                    <span className={cn("font-semibold tracking-tight")}>Menu</span>
                </div>
            )}

            {/* Scrollable Navigation Area */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                <ScrollArea className="flex-1">
                    <div className={cn("flex flex-col gap-8 py-6", isMobile && "px-0")}>
                        {sidebarGroups.map((group) => (
                            <div key={group.title} className="flex flex-col gap-2">
                                {/* Group Title - Only visible when expanded */}
                                <div className={cn(
                                    "overflow-hidden transition-opacity duration-200",
                                    effectiveCollapsed ? "opacity-0 h-0" : "opacity-100"
                                )}>
                                    <h4 className="py-1 text-xs font-semibold text-muted-foreground/50 uppercase tracking-widest pl-[72px] whitespace-nowrap">
                                        {group.title}
                                    </h4>
                                </div>

                                <div className="flex flex-col gap-1">
                                    {group.items.map((route) => {
                                        const isActive = pathname === route.href || pathname?.startsWith(`${route.href}/`);

                                        return (
                                            <Link
                                                key={route.href}
                                                href={route.href}
                                                onClick={onNavigate}
                                                className={cn(
                                                    "flex items-center text-sm font-medium transition-colors group/item relative",
                                                    DIMENSIONS.itemHeight,
                                                    isActive
                                                        ? "text-sidebar-primary bg-sidebar-accent/50"
                                                        : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/20",
                                                )}
                                                title={effectiveCollapsed ? route.label : undefined}
                                            >
                                                {/* ICON ZONE - Purely Rigid Container */}
                                                <div className={cn(
                                                    "flex items-center justify-center shrink-0",
                                                    DIMENSIONS.iconZone,
                                                    "h-full"
                                                )}>
                                                    <route.icon className={cn(
                                                        "transition-all duration-300",
                                                        isMobile ? "h-6 w-6" : "h-5 w-5",
                                                        isActive ? "text-sidebar-primary" : "text-muted-foreground group-hover/item:text-sidebar-foreground"
                                                    )} />
                                                </div>

                                                {/* Active Border - Pinned to left edge */}
                                                {isActive && (
                                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-[3px] bg-primary rounded-r-full" />
                                                )}

                                                {/* Text Zone */}
                                                <span className={cn(
                                                    "truncate transition-all duration-300 pr-4",
                                                    effectiveCollapsed
                                                        ? "opacity-0 w-0 -translate-x-4"
                                                        : "opacity-100 w-auto translate-x-0"
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
                        "flex items-center text-sm font-medium transition-colors group/item relative h-16",
                        (pathname === "/settings" || pathname?.startsWith("/settings/"))
                            ? "text-sidebar-primary bg-sidebar-accent/50"
                            : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/20"
                    )}
                    title="Settings"
                >
                    {/* ICON ZONE - Matching above */}
                    <div className={cn(
                        "flex items-center justify-center shrink-0",
                        DIMENSIONS.iconZone,
                        "h-full"
                    )}>
                        <Settings className={cn(
                            "transition-all duration-300",
                            isMobile ? "h-6 w-6" : "h-5 w-5",
                            (pathname === "/settings" || pathname?.startsWith("/settings/"))
                                ? "text-sidebar-primary"
                                : "text-muted-foreground group-hover/item:text-sidebar-foreground"
                        )} />
                    </div>

                    {/* Active Border */}
                    {(pathname === "/settings" || pathname?.startsWith("/settings/")) && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-[3px] bg-primary rounded-r-full" />
                    )}

                    <span className={cn(
                        "truncate transition-all duration-300 pr-4",
                        effectiveCollapsed
                            ? "opacity-0 w-0 -translate-x-4"
                            : "opacity-100 w-auto translate-x-0"
                    )}>
                        Settings
                    </span>
                </Link>
            </div>
        </aside>
    );
}
