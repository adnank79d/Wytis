"use client";


import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, Menu } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Role } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/client";
import { NotificationsPopover } from "@/components/dashboard/notifications-popover";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "@/components/dashboard/sidebar";
import { SearchBar } from "@/components/dashboard/search-bar";


interface HeaderProps {
    userRole?: Role | null;
    businessName?: string;
    userEmail?: string;
    userName?: string;
}

export function Header({ userRole, businessName, userEmail, userName }: HeaderProps) {
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.refresh();
        router.push('/login');
    };

    const userInitials = userName
        ? userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : userEmail?.substring(0, 2).toUpperCase() || "U";

    return (
        <header className="w-full h-12 md:h-14 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-3 md:px-4 lg:px-6 sticky top-0 z-30 shrink-0 transition-all duration-300">
            {/* 1. LEFT SECTION: Logo + Mobile Toggle */}
            <div className="flex items-center gap-2 md:gap-4 min-w-0 md:min-w-[200px]">
                {/* Logo - visible on both mobile and desktop */}
                <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <Image
                        src="/logo.png"
                        alt="Wytis"
                        width={100}
                        height={32}
                        className="h-5 md:h-6 w-auto object-contain"
                        priority
                    />
                </Link>

                {/* Mobile Sidebar Trigger */}
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="md:hidden">
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Toggle menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 border-r w-72">
                        <div className="flex items-center h-12 border-b px-4">
                            <Link href="/dashboard" className="flex items-center gap-2">
                                <Image
                                    src="/logo.png"
                                    alt="Wytis"
                                    width={100}
                                    height={32}
                                    className="h-6 w-auto object-contain"
                                    priority
                                />
                            </Link>
                        </div>
                        <Sidebar isMobile={true} className="border-none" />
                    </SheetContent>
                </Sheet>
            </div>

            {/* 2. CENTER SECTION: Global Search - Hidden on mobile */}
            <div className="hidden md:flex flex-1 justify-center max-w-xl mx-auto px-6">
                <SearchBar />
            </div>

            {/* 3. RIGHT SECTION: Business & User */}
            <div className="flex items-center justify-end gap-1 md:gap-2 lg:gap-4 min-w-0 md:min-w-[200px]">
                {/* Business Context Indicator (Read-only) */}
                {businessName && (
                    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground select-none bg-muted/50 rounded-full border border-transparent hover:border-border transition-all">
                        <span className="max-w-[200px] truncate">{businessName}</span>
                    </div>
                )}

                <NotificationsPopover />

                {/* User Menu Custom Implementation */}
                <div className="relative" ref={menuRef}>
                    <Button
                        variant="ghost"
                        className="relative h-7 w-7 md:h-8 md:w-8 rounded-full ring-2 ring-transparent hover:ring-primary/20 transition-all"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        <Avatar className="h-7 w-7 md:h-8 md:w-8 border">
                            <AvatarImage src="/placeholder-user.jpg" alt="@user" />
                            <AvatarFallback className="bg-primary/5 text-[10px] md:text-xs text-primary font-bold">{userInitials}</AvatarFallback>
                        </Avatar>
                    </Button>

                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-56 rounded-lg border bg-popover/95 backdrop-blur shadow-lg p-1 z-50 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 duration-200">
                            <div className="px-2 py-1.5 text-sm font-semibold">
                                <p className="text-sm font-medium leading-none">{userName || "Account"}</p>
                                <p className="text-xs leading-none text-muted-foreground mt-1 truncate">
                                    {userEmail}
                                </p>
                            </div>
                            <div className="h-px bg-muted my-1" />
                            <Link href="/settings" className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground" onClick={() => setIsMenuOpen(false)}>
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Settings</span>
                            </Link>
                            <div className="h-px bg-muted my-1" />
                            <button
                                onClick={handleSignOut}
                                className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-red-50 text-red-600 hover:text-red-700 font-medium"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
