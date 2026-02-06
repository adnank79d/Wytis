"use client";

export function HeroBackgroundAnimation() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10" aria-hidden="true">
            {/* Subtle gradient orbs with very slow movement */}
            <div className="absolute top-0 -left-48 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-ambient-drift-1" />
            <div className="absolute bottom-0 -right-48 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-ambient-drift-2" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/3 rounded-full blur-3xl animate-ambient-pulse" />

            {/* Subtle ambient gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-blue-500/3 animate-gradient-shift" />
        </div>
    );
}
