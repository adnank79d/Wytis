"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

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
        title: "Team",
        href: "/settings/team",
    },
];


export function SettingsNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
    const pathname = usePathname();

    return (
        <nav
            className={cn(
                "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1",
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
                            buttonVariants({ variant: "ghost" }),
                            "justify-start relative overflow-hidden",
                            isActive
                                ? "bg-muted hover:bg-muted font-medium text-primary"
                                : "hover:bg-muted/50 text-muted-foreground hover:text-foreground",
                            "transition-all duration-200 ease-in-out"
                        )}
                    >
                        {isActive && (
                            <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                        )}
                        <span className={cn(isActive ? "translate-x-1.5" : "", "transition-transform duration-200")}>
                            {item.title}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}

