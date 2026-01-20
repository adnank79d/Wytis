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

export function Sidebar({ className }: { className?: string }) {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = React.useState(false);
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
        const saved = localStorage.getItem("wytis-sidebar-collapsed");
        if (saved) {
            setIsCollapsed(saved === "true");
        }
    }, []);

    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem("wytis-sidebar-collapsed", String(newState));
    };

    if (!isMounted) {
        return <div className={cn("w-64 border-r bg-background flex flex-col h-full", className)} />; // Skeleton state
    }

    return (
        <div
            className={cn(
                "border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex flex-col h-full transition-all duration-300 ease-in-out relative group z-20",
                isCollapsed ? "w-[70px]" : "w-64",
                className
            )}
        >
            <div className="p-4 border-b flex items-center justify-between lg:hidden">
                <span className="font-semibold text-lg tracking-tight">Menu</span>
            </div>

            <ScrollArea className="flex-1 py-4">
                <nav className="flex flex-col gap-1 px-3">
                    {sidebarLinks.map((route) => {
                        const isActive = pathname === route.href || pathname?.startsWith(`${route.href}/`);

                        return (
                            <Link
                                key={route.href}
                                href={route.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative group/link",
                                    isActive
                                        ? "bg-primary/10 text-primary shadow-sm"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                    isCollapsed && "justify-center px-2"
                                )}
                                title={isCollapsed ? route.label : undefined}
                            >
                                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />}
                                <route.icon className={cn("h-4 w-4 shrink-0 transition-transform duration-300", isActive && "scale-110")} />
                                <span
                                    className={cn(
                                        "truncate transition-all duration-300 origin-left",
                                        isCollapsed ? "w-0 opacity-0 overflow-hidden absolute left-10 scale-0" : "w-auto opacity-100 scale-100"
                                    )}
                                >
                                    {route.label}
                                </span>
                            </Link>
                        );
                    })}
                </nav>
            </ScrollArea>

            {/* Floating Toggle Button */}
            <button
                onClick={toggleCollapse}
                className="absolute -right-3 top-20 z-50 h-6 w-6 rounded-full border bg-background shadow-md flex items-center justify-center text-muted-foreground hover:text-primary transition-all hover:scale-110 hover:shadow-lg opacity-0 group-hover:opacity-100 lg:opacity-100"
            >
                {isCollapsed ? <ChevronsRight className="h-3 w-3" /> : <ChevronsLeft className="h-3 w-3" />}
            </button>
        </div>
    );
}
