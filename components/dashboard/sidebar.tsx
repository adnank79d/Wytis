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
    Bot,
    Settings,
    ChevronsLeft,
    ChevronsRight,
} from "lucide-react";
import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

const sidebarLinks = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Invoices", icon: Receipt, href: "/invoices" },
    { label: "Reports", icon: LineChart, href: "/reports" },
    { label: "Inventory", icon: Package, href: "/inventory" },
    { label: "Payments", icon: CreditCard, href: "/payments" },
    { label: "Customers", icon: Users, href: "/customers" },
    { label: "Expenses", icon: Wallet, href: "/expenses" },
    { label: "HR", icon: Briefcase, href: "/hr" },
    { label: "GST", icon: Calculator, href: "/gst" },
    { label: "CRM", icon: Contact2, href: "/crm" },
    { label: "Payroll", icon: Banknote, href: "/payroll" },
    { label: "Analytics", icon: BarChart4, href: "/analytics" },
    { label: "AI", icon: Bot, href: "/ai" },
    { label: "Settings", icon: Settings, href: "/settings" },
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
                "border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex flex-col h-full relative group z-20",
                effectiveCollapsed ? "w-[70px]" : "w-56",
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

            <ScrollArea className="flex-1 py-2 md:py-4">
                <nav className={cn("flex flex-col gap-0.5 md:gap-1", isMobile ? "px-2" : "px-3")}>
                    {sidebarLinks.map((route) => {
                        const isActive = pathname === route.href || pathname?.startsWith(`${route.href}/`);

                        return (
                            <Link
                                key={route.href}
                                href={route.href}
                                onClick={onNavigate}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg font-medium transition-all duration-200 relative group/link",
                                    // Mobile: larger touch targets
                                    isMobile ? "px-3 py-3 text-base" : "px-3 py-2.5 text-sm",
                                    isActive
                                        ? "bg-primary/10 text-primary shadow-sm"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted/80",
                                    effectiveCollapsed && "justify-center px-2"
                                )}
                                title={effectiveCollapsed ? route.label : undefined}
                            >
                                {isActive && <div className={cn("absolute left-0 top-1/2 -translate-y-1/2 bg-primary rounded-r-full", isMobile ? "w-1 h-8" : "w-1 h-6")} />}
                                <route.icon className={cn(
                                    "shrink-0 transition-transform duration-300",
                                    isMobile ? "h-5 w-5" : "h-4 w-4",
                                    isActive && "scale-110"
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
                </nav>
            </ScrollArea>

            {/* No manual toggle button anymore */}
        </div>
    );
}
