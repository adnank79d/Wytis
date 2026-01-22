"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Building2, CreditCard, Users, Receipt } from "lucide-react";

const items = [
    {
        title: "General",
        href: "/settings",
        icon: Building2,
    },
    {
        title: "Billing",
        href: "/settings/billing",
        icon: CreditCard,
    },
    {
        title: "Team",
        href: "/settings/team",
        icon: Users,
    },
    {
        title: "GST",
        href: "/settings/gst",
        icon: Receipt,
    },
];

export function SettingsTabs({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
    const pathname = usePathname();

    return (
        <nav
            className={cn(
                "flex items-center gap-1 overflow-x-auto pb-px border-b border-border/40 -mx-3 px-3 md:mx-0 md:px-0 scrollbar-hide",
                className
            )}
            {...props}
        >
            {items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "relative flex items-center gap-1.5 px-3 md:px-4 py-2.5 text-xs md:text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md whitespace-nowrap shrink-0",
                            isActive
                                ? "text-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        )}
                    >
                        <Icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        {item.title}
                        {isActive && (
                            <motion.div
                                layoutId="activeSettingsTab"
                                className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-primary"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}
