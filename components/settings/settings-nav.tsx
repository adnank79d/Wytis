"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    Building,
    FileText,
    Users,
    CreditCard,
    Lock,
    Settings,
    LayoutGrid
} from "lucide-react";
import { Button } from "@/components/ui/button";

const items = [
    {
        title: "Business Profile",
        href: "/settings",
        icon: Building
    },
    {
        title: "GST & Compliance",
        href: "/settings/gst",
        icon: FileText
    },
    {
        title: "Users & Roles",
        href: "/settings/team",
        icon: Users
    },
    {
        title: "Billing & Plan",
        href: "/settings/billing",
        icon: CreditCard
    },
    {
        title: "Security",
        href: "/settings/security",
        icon: Lock
    },
    {
        title: "Preferences",
        href: "/settings/preferences",
        icon: Settings
    },
];

export function SettingsNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
    const pathname = usePathname();

    return (
        <nav
            className={cn("flex flex-col space-y-1", className)}
            {...props}
        >
            {items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="group"
                    >
                        <div
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-200",
                                "border-l-2 -ml-px",
                                isActive
                                    ? "border-indigo-600 text-indigo-600 font-semibold bg-indigo-50/50"
                                    : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium"
                            )}
                        >
                            <Icon className={cn(
                                "h-4 w-4 flex-shrink-0",
                                isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                            )} />
                            <span>{item.title}</span>
                        </div>
                    </Link>
                );
            })}
        </nav>
    );
}
