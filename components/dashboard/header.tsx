"use client";


import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, Menu, MessageSquare } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Role } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/client";
import { NotificationsPopover } from "@/components/dashboard/notifications-popover";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NewSidebar } from "@/components/dashboard/new-sidebar";
import { SearchBar } from "@/components/dashboard/search-bar";
import { DateTimeDisplay } from "@/components/dashboard/date-time-display";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


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
        <header className="w-full h-14 md:h-16 border-b border-border/40 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 flex items-center justify-between px-4 md:px-5 lg:px-6 sticky top-0 z-30 shrink-0 transition-all duration-300">
            {/* 1. LEFT SECTION: Logo + Feedback + Mobile Toggle */}
            <div className="flex items-center gap-2 md:gap-4 min-w-0 md:min-w-[200px]">
                {/* Logo - visible on both mobile and desktop */}
                <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <Image
                        src="/logo.png"
                        alt="Wytis"
                        width={120}
                        height={40}
                        className="h-7 md:h-8 w-auto object-contain"
                        priority
                    />
                </Link>

                {/* Feedback Button - Hidden on mobile */}
                <Button
                    variant="outline"
                    size="sm"
                    className="hidden md:flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg border-border/60 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all"
                    onClick={() => window.open('https://forms.gle/your-feedback-form-id', '_blank')}
                >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Feedback</span>
                </Button>

                {/* Mobile Sidebar Trigger */}
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="md:hidden">
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Toggle menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-[280px] flex flex-col">
                        <NewSidebar
                            isMobile={true}
                            className="flex-1 border-none"
                        />
                    </SheetContent>
                </Sheet>
            </div>

            {/* 2. CENTER SECTION: Global Search - Hidden on mobile, Absolute Center on Desktop */}
            <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl justify-center px-4 pointer-events-none">
                <div className="pointer-events-auto w-full max-w-sm lg:max-w-md">
                    <SearchBar />
                </div>
            </div>

            {/* 3. RIGHT SECTION: Business & User */}
            <div className="flex items-center justify-end gap-1 md:gap-2 lg:gap-4 min-w-0 md:min-w-[200px]">
                {/* Business Context Indicator (Read-only) */}
                {businessName && (
                    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground select-none bg-muted/50 rounded-full border border-transparent hover:border-border transition-all">
                        <span className="max-w-[200px] truncate">{businessName}</span>
                    </div>
                )}

                {/* Date & Time - Desktop Only */}
                <div className="hidden lg:block">
                    <DateTimeDisplay />
                </div>

                <NotificationsPopover />

                {/* User Menu Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-9 w-9 rounded-full ml-1">
                            <Avatar className="h-9 w-9 border border-border/40 transition-all hover:border-primary/50">
                                <AvatarImage src="" alt={userName || "User"} />
                                <AvatarFallback className="bg-primary/10 text-sm text-primary font-semibold">
                                    {userInitials}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{userName || "My Account"}</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {userEmail}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/settings" className="cursor-pointer">
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Settings</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 cursor-pointer"
                            onClick={handleSignOut}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
