
// Force Vercel rebuild - Layout check
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
        return <div className={cn("w-[70px] border-r bg-background flex flex-col h-full", className)} />; // Skeleton state (collapsed default)
    }

    return (
        <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{ transition: 'width 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
            className={cn(
                "border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex flex-col h-full relative group z-20 overflow-hidden",
                effectiveCollapsed ? "w-[70px]" : "w-48",
                isMobile && "border-none w-full",
                className
            )}
        >
            {/* Mobile Header - only show if not in sheet */}
            {!isMobile && (
                <div className="p-4 border-b flex items-center justify-between lg:hidden">
                    <span className="font-semibold text-lg tracking-tight">Menu</span>
                </div>
            )}

            {/* Navigation Area */}
            <ScrollArea className="flex-1 bg-transparent">
                <div className="py-4">
                    <div className={cn("flex flex-col", isMobile ? "px-2" : "px-3")}>
                        {sidebarGroups.map((group, groupIndex) => (
                            <div key={group.title} className={cn("mb-1", groupIndex > 0 && "mt-4")}>
                                {groupIndex > 0 && (
                                    <div className="my-3 mx-2 border-t border-border/40" />
                                )}
                                <div className="flex flex-col gap-0">
                                    {group.items.map((route) => {
                                        const isActive = pathname === route.href || pathname?.startsWith(`${route.href}/`);

                                        return (
                                            <Link
                                                key={route.href}
                                                href={route.href}
                                                onClick={onNavigate}
                                                className={cn(
                                                    // Gap logic: Remove gap when collapsed to prevent "phantom" spacing shift
                                                    "flex items-center rounded-md font-medium transition-all duration-200 relative group/link text-sm",
                                                    effectiveCollapsed ? "gap-0 justify-center px-2" : "gap-3 pl-[15px] pr-3",
                                                    // Mobile: larger touch targets
                                                    isMobile ? "px-3 py-3" : "py-1.5",
                                                    isActive
                                                )}
                                                title={effectiveCollapsed ? route.label : undefined}
                                            >
                                                {isActive && <div className={cn("absolute left-0 top-1/2 -translate-y-1/2 bg-primary rounded-r-full", isMobile ? "w-1 h-6" : "w-0.5 h-4 -ml-2")} />}
                                                <route.icon className={cn(
                                                    "shrink-0 transition-transform duration-300",
                                                    isMobile ? "h-5 w-5" : "h-4 w-4",
                                                    isActive && "text-primary"
                                                )} />
                                                <span
                                                    style={{
                                                        transition: effectiveCollapsed
                                                            ? 'opacity 100ms ease-out, transform 100ms ease-out'
                                                            : 'opacity 150ms ease-out 50ms, transform 150ms ease-out 50ms'
                                                    }}
                                                    className={cn(
                                                        "truncate whitespace-nowrap",
                                                        effectiveCollapsed ? "opacity-0 scale-95 w-0 overflow-hidden" : "opacity-100 scale-100"
                                                    )}
                                                >
                                                    {route.label}
                                                </span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </ScrollArea>

            {/* Pinned Bottom Section */}
            <div className="px-3 py-2 mt-auto pb-6">
                <Link
                    href="/settings"
                    onClick={onNavigate}
                    className={cn(
                        "flex items-center rounded-md font-medium transition-all duration-200 relative group/link text-sm",
                        effectiveCollapsed ? "gap-0 justify-center px-2" : "gap-3 pl-[15px] pr-3",
                        isMobile ? "px-3 py-3" : "py-1.5",
                        pathname === "/settings" || pathname?.startsWith("/settings/") ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                    title="Settings"
                >
                    {(pathname === "/settings" || pathname?.startsWith("/settings/")) && <div className={cn("absolute left-0 top-1/2 -translate-y-1/2 bg-primary rounded-r-full", isMobile ? "w-1 h-6" : "w-0.5 h-4 -ml-2")} />}
                    <Settings className={cn(
                        "shrink-0 transition-transform duration-300",
                        isMobile ? "h-5 w-5" : "h-4 w-4",
                        (pathname === "/settings" || pathname?.startsWith("/settings/")) && "text-primary"
                    )} />
                    <span
                        style={{
                            transition: effectiveCollapsed
                                ? 'opacity 100ms ease-out, transform 100ms ease-out'
                                : 'opacity 150ms ease-out 50ms, transform 150ms ease-out 50ms'
                        }}
                        className={cn(
                            "truncate whitespace-nowrap",
                            effectiveCollapsed ? "opacity-0 scale-95 w-0 overflow-hidden" : "opacity-100 scale-100"
                        )}
                    >
                        Settings
                    </span>
                </Link>
            </div>
        </div>
    );
}
