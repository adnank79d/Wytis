"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const items = [
    {
        title: "General",
        href: "/settings",
    },
    {
        title: "Billing",
        href: "/settings/billing",
    },
    {
        title: "Members",
        href: "/settings/team",
    },
];

export function SettingsTabs({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
    const pathname = usePathname();

    return (
        <nav
            className={cn(
                "flex items-center space-x-1 border-b border-border/40 pb-0",
                className
            )}
            {...props}
        >
            {items.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "relative px-4 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md",
                            isActive
                                ? "text-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        )}
                    >
                        {item.title}
                        {isActive && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-primary"
                            />
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}
