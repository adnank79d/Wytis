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
        return <div className={cn("w-16 border-r bg-background flex flex-col h-full", className)} />;
    }

    return (
        <aside
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={cn(
                "flex flex-col h-full bg-background border-r border-border/40",
                "transition-[width] duration-200 ease-out",
                effectiveCollapsed ? "w-16" : "w-56",
                isMobile && "w-full border-none",
                className
            )}
            data-version="perfect-v8"
        >
            {/* Navigation - No ScrollArea, perfect fit */}
            <nav className="flex-1 flex flex-col py-3 px-2">
                {sidebarGroups.map((group, idx) => (
                    <div key={group.title} className={cn("flex flex-col", idx > 0 && "mt-4")}>
                        {group.items.map((route) => {
                            const isActive = pathname === route.href || pathname?.startsWith(`${route.href}/`);

                            return (
                                <Link
                                    key={route.href}
                                    href={route.href}
                                    onClick={onNavigate}
                                    className={cn(
                                        "flex items-center h-9 rounded-md transition-all duration-150 group relative",
                                        effectiveCollapsed ? "justify-center px-0" : "gap-3 px-3",
                                        isActive
                                            ? "bg-primary/10 text-primary font-medium"
                                            : "text-muted-foreground hover:bg-accent hover:text-foreground",
                                    )}
                                    title={effectiveCollapsed ? route.label : undefined}
                                >
                                    <route.icon className="h-4 w-4 shrink-0" />
                                    {!effectiveCollapsed && (
                                        <span className="text-sm truncate">{route.label}</span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* Settings - Pinned Bottom */}
            <div className="p-2 border-t border-border/40">
                <Link
                    href="/settings"
                    onClick={onNavigate}
                    className={cn(
                        "flex items-center h-10 rounded-md transition-all duration-150",
                        effectiveCollapsed ? "justify-center px-0" : "gap-3 px-3",
                        (pathname === "/settings" || pathname?.startsWith("/settings/"))
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                    title="Settings"
                >
                    <Settings className="h-4 w-4 shrink-0" />
                    {!effectiveCollapsed && (
                        <span className="text-sm truncate">Settings</span>
                    )}
                </Link>
            </div>
        </aside>
    );
}
