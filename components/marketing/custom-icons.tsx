import React from "react";

export const GSTIcon = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        fill="none"
        className={className}
    >
        {/* Background Shield */}
        <path
            d="M50 88C29 80 14 62 14 40V18l36-8 36 8v22c0 22-15 40-36 48z"
            className="fill-primary/10"
        />

        {/* Document */}
        <rect x="32" y="28" width="36" height="44" rx="4" className="fill-background stroke-primary stroke-2" />
        <path d="M40 40h20" className="stroke-primary/30 stroke-2" />
        <path d="M40 48h20" className="stroke-primary/30 stroke-2" />
        <path d="M40 56h12" className="stroke-primary/30 stroke-2" />

        {/* Checkmark Badge */}
        <circle cx="68" cy="72" r="14" className="fill-primary" />
        <path d="M62 72l4 4 10-10" className="stroke-background stroke-[3] stroke-linecap-round" />
    </svg>
);

export const TDSIcon = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        className={className}
    >
        {/* Decorative Background */}
        <circle cx="12" cy="12" r="10" className="fill-orange-50" />

        {/* Coin Stack */}
        <ellipse cx="12" cy="18" rx="6" ry="2" className="fill-orange-200" />
        <path d="M6 18v-3c0 1.1 2.69 2 6 2s6-.9 6-2v3c0 1.1-2.69 2-6 2s-6-.9-6-2z" className="fill-orange-300" />
        <path d="M6 15v-3c0 1.1 2.69 2 6 2s6-.9 6-2v3c0 1.1-2.69 2-6 2s-6-.9-6-2z" className="fill-orange-200" />

        {/* Funnel */}
        <path
            d="M4 6h16l-6.9 6.9c-.1.1-.1.2-.1.4V16h-2v-2.7c0-.1 0-.3-.1-.4L4 6z"
            className="fill-orange-500 stroke-white stroke-1"
        />
        <path d="M4 6h16" className="stroke-orange-600 stroke-2" />
    </svg>
);

export const HSNIcon = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        className={className}
    >
        {/* 3D Box Background */}
        <path d="M12 21l-8-4.5v-9l8 4.5 8-4.5v9l-8 4.5z" className="fill-blue-50" />
        <path d="M12 21v-9" className="stroke-blue-200" />
        <path d="M4 7.5L12 12l8-4.5" className="stroke-blue-200" />

        {/* Tag Foreground */}
        <path
            d="M20.5 6.5l-2-2a2 2 0 0 0-1.4-.6H13a2 2 0 0 0-1.4.6l-7 7a2 2 0 0 0 0 2.8l4 4a2 2 0 0 0 2.8 0l7-7a2 2 0 0 0 .6-1.4V9a2 2 0 0 0-.6-1.4z"
            className="fill-blue-500 stroke-white stroke-1"
        />
        <circle cx="16.5" cy="8.5" r="1.5" className="fill-white" />
    </svg>
);

export const INRIcon = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        className={className}
    >
        {/* Rising Graph Background */}
        <path d="M3 20h18" className="stroke-indigo-100 stroke-2" />
        <path d="M5 20v-4" className="stroke-indigo-100 stroke-4" />
        <path d="M9 20v-8" className="stroke-indigo-200 stroke-4" />
        <path d="M13 20v-12" className="stroke-indigo-300 stroke-4" />
        <path d="M17 20v-6" className="stroke-indigo-200 stroke-4" />

        {/* Rupee Symbol */}
        <circle cx="16" cy="8" r="6" className="fill-primary" />
        <path d="M13 6h6" className="stroke-white stroke-2 stroke-linecap-round" />
        <path d="M13 9h6" className="stroke-white stroke-2 stroke-linecap-round" />
        <path d="M13 12l4.5 3.5" className="stroke-white stroke-2 stroke-linecap-round" />
        <path d="M13 12h2" className="stroke-white stroke-2 stroke-linecap-round" />
        <path d="M15.5 6a2.5 2.5 0 0 1 0 5H13" className="stroke-white stroke-2 stroke-linecap-round fill-none" />
    </svg>
);

export const EInvoiceIcon = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        className={className}
    >
        {/* Accent Shapes */}
        <rect x="14" y="3" width="8" height="8" rx="1" className="fill-purple-100" />
        <circle cx="6" cy="18" r="4" className="fill-purple-50" />

        {/* Invoice */}
        <path
            d="M16 2H8a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"
            className="fill-white stroke-purple-500 stroke-2"
        />
        <path d="M9 7h6" className="stroke-purple-200 stroke-2" />
        <path d="M9 11h6" className="stroke-purple-200 stroke-2" />

        {/* QR Badge */}
        <rect x="8.5" y="14" width="7" height="5" rx="1" className="fill-purple-500" />
    </svg>
);

export const UPIIcon = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        className={className}
    >
        {/* Phone Body */}
        <rect x="6" y="2" width="12" height="20" rx="3" className="fill-white stroke-green-500 stroke-2" />

        {/* Screen Elements */}
        <rect x="9" y="5" width="6" height="1" rx="0.5" className="fill-green-200" />

        {/* QR/Payment Center */}
        <rect x="8" y="9" width="8" height="8" rx="1" className="fill-green-50" />
        <path d="M10 11h4v4h-4z" className="fill-green-500" />

        {/* Success Tick */}
        <circle cx="16" cy="19" r="4" className="fill-green-500 stroke-white stroke-2" />
        <path d="M14.5 19l1 1 2-2" className="stroke-white stroke-2 stroke-linecap-round" />
    </svg>
);

// --- ABSTRACT VISUALS FOR DATA INTELLIGENCE (LIVE/ANIMATED) ---

export const AbstractIntegration = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="14" cy="20" r="10" className="fill-primary/5 stroke-primary stroke-[1.5] animate-[pulse_3s_ease-in-out_infinite]" />
        <circle cx="26" cy="20" r="10" className="fill-primary/5 stroke-primary stroke-[1.5] animate-[pulse_3s_ease-in-out_infinite] delay-1000" />
        <path d="M20 14V26" className="stroke-primary stroke-[1.5] stroke-linecap-round" />
        <circle cx="20" cy="20" r="3" className="fill-primary animate-pulse" />
    </svg>
);

export const AbstractQuery = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M8 20C8 13.3726 13.3726 8 20 8C26.6274 8 32 13.3726 32 20C32 26.6274 26.6274 32 20 32C17.5 32 15 31.2 13 30L8 32L10 27C8.8 25 8 22.5 8 20Z"
            className="fill-primary/5 stroke-primary stroke-[1.5]"
        />
        <path
            d="M14 18C14 18 16 16 20 16C24 16 26 18 26 18"
            className="stroke-primary stroke-[1.5] stroke-linecap-round animate-[pulse_2s_ease-in-out_infinite]"
        />
        <circle cx="20" cy="24" r="1" className="fill-primary animate-bounce" />
    </svg>
);

export const AbstractAudit = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="24" width="20" height="4" rx="2" className="fill-primary/10 stroke-primary stroke-[1.5] opacity-50 animate-[pulse_4s_ease-in-out_infinite]" />
        <rect x="10" y="16" width="20" height="4" rx="2" className="fill-primary/10 stroke-primary stroke-[1.5] opacity-75 animate-[pulse_4s_ease-in-out_infinite_1s]" />
        <rect x="10" y="8" width="20" height="4" rx="2" className="fill-primary/10 stroke-primary stroke-[1.5] animate-[pulse_4s_ease-in-out_infinite_2s]" />
        <path d="M26 32L32 26" className="stroke-primary stroke-[1.5] stroke-linecap-round" />
        <circle cx="29" cy="29" r="6" className="fill-background stroke-primary stroke-[1.5]" />
        <path d="M27 29L28.5 30.5L31.5 27.5" className="stroke-primary stroke-[1.5] stroke-linecap-round stroke-linejoin-round" />
    </svg>
);

export const AbstractPulse = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M4 28L10 28L14 18L18 32L24 12L28 24L36 24"
            className="stroke-primary stroke-[1.5] stroke-linecap-round stroke-linejoin-round"
        />
        <circle cx="24" cy="12" r="3" className="fill-primary/20 stroke-primary stroke-[1.5]">
            <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="24" cy="12" r="1.5" className="fill-primary animate-ping" />
    </svg>
);
