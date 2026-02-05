"use client";

import { NewSidebar as SidebarComponent } from "./new-sidebar";
import { useState } from "react";

interface ClientSidebarWrapperProps {
    className?: string;
    isMobile?: boolean;
    onNavigate?: () => void;
}

export function ClientSidebarWrapper({ className, isMobile, onNavigate }: ClientSidebarWrapperProps) {
    const [isOpen, setIsOpen] = useState(false);

    // For mobile, manage open/close state
    if (isMobile) {
        return (
            <SidebarComponent
                className={className}
                isMobile={isMobile}
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                onNavigate={onNavigate}
            />
        );
    }

    // For desktop, no state management needed (hover-based)
    return (
        <SidebarComponent
            className={className}
            isMobile={false}
            onNavigate={onNavigate}
        />
    );
}

// Export hook for parent components to trigger mobile sidebar
export function useMobileSidebar() {
    const [isOpen, setIsOpen] = useState(false);

    return {
        isOpen,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
        toggle: () => setIsOpen(prev => !prev),
    };
}
