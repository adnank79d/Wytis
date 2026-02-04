"use client";

import { Sidebar as SidebarComponent } from "./sidebar";
import { useRouter } from "next/navigation";

interface ClientSidebarWrapperProps {
    className?: string;
    isMobile?: boolean;
    onNavigate?: () => void;
}

export function ClientSidebarWrapper({ className, isMobile, onNavigate }: ClientSidebarWrapperProps) {
    const router = useRouter();

    return (
        <SidebarComponent
            className={className}
            isMobile={isMobile}
            onNavigate={onNavigate}
        />
    );
}
