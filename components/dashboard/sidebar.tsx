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
const SIDEBAR_WIDTH = "w-64";
const SIDEBAR_WIDTH_COLLAPSED = "w-[70px]";
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
    const [isCollapsed, setIsCollapsed] = React.useState(!isMobile); // Default collapsed on desktop
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
        if (isMobile) {
            setIsCollapsed(false);
        }
    }, [isMobile]);

    // Auto-collapse logic
    const handleMouseEnter = () => {
        if (!isMobile) setIsCollapsed(false);
    };

    const handleMouseLeave = () => {
        if (!isMobile) setIsCollapsed(true);
    };

    // For mobile, never collapse (it's in a sheet)
    const effectiveCollapsed = isMobile ? false : isCollapsed;

    if (!isMounted) {
        return <div className={cn("border-r bg-background flex flex-col h-full", SIDEBAR_WIDTH_COLLAPSED, className)} />;
    }

    return (
        <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={cn(
                "flex flex-col h-full bg-background border-r relative z-20",
                SIDEBAR_ANIMATION,
                effectiveCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH,
                isMobile && "w-full border-none",
                className
            )}
            data-version="redesign-v3"
        >
            {/* Mobile Header */}
            {!isMobile && (
                <div className={cn(
                    "flex items-center h-14 px-4 border-b lg:hidden",
                    effectiveCollapsed ? "justify-center" : "justify-between"
                )}>
                    <span className={cn("font-semibold tracking-tight", effectiveCollapsed && "hidden")}>Menu</span>
                </div>
            )}

            {/* Scrollable Navigation Area */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                <ScrollArea className="flex-1">
                    <div className={cn("flex flex-col gap-6 py-6", isMobile ? "px-4" : "px-3")}>
                        {sidebarGroups.map((group, groupIndex) => (
                            <div key={group.title} className="flex flex-col gap-2">
                                {/* Group Title - Hidden when collapsed */}
                                {!effectiveCollapsed && (
                                    <h4 className="px-2 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
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
                                                    "flex items-center rounded-md text-sm font-medium transition-colors",
                                                    SIDEBAR_ANIMATION,
                                                    // Spacing & Sizing
                                                    effectiveCollapsed ? "justify-center px-2 py-2" : "px-3 py-2 gap-3",
                                                    // Colors & States
                                                    isActive
                                                        ? "bg-primary/10 text-primary"
                                                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                                )}
                                                title={effectiveCollapsed ? route.label : undefined}
                                            >
                                                <route.icon className={cn(
                                                    "shrink-0",
                                                    isMobile ? "h-5 w-5" : "h-4 w-4",
                                                )} />

                                                {!effectiveCollapsed && (
                                                    <span className="truncate">
                                                        {route.label}
                                                    </span>
                                                )}

                                                {/* Active Indicator (optional, subtle border instead of dot) */}
                                                {isActive && effectiveCollapsed && (
                                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary rounded-r-md" />
                                                )}
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
                "border-t bg-background p-3 mt-auto",
                // Safe area padding for mobile
                isMobile && "pb-8"
            )}>
                <Link
                    href="/settings"
                    onClick={onNavigate}
                    className={cn(
                        "flex items-center rounded-md text-sm font-medium transition-colors",
                        SIDEBAR_ANIMATION,
                        effectiveCollapsed ? "justify-center px-2 py-2" : "px-3 py-2 gap-3",
                        (pathname === "/settings" || pathname?.startsWith("/settings/"))
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    title="Settings"
                >
                    <Settings className={cn(
                        "shrink-0",
                        isMobile ? "h-5 w-5" : "h-4 w-4",
                    )} />

                    {!effectiveCollapsed && (
                        <span className="truncate">Settings</span>
                    )}
                </Link>
            </div>
        </div>
    );
}
