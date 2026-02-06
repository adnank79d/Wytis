"use client";

import React from "react";

export function HeroAnimation() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            {/* Gradient orbs with blur and animation */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float-slow" />
            <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl animate-float-slower" />
            <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-float-medium" />

            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5 animate-gradient" />

            {/* Floating particles */}
            <div className="absolute top-1/3 left-1/2 w-2 h-2 bg-primary/30 rounded-full animate-float-fast" />
            <div className="absolute top-2/3 left-2/3 w-1.5 h-1.5 bg-blue-400/30 rounded-full animate-float-medium" />
            <div className="absolute top-1/2 left-1/4 w-1 h-1 bg-purple-400/30 rounded-full animate-float-slower" />
        </div>
    );
}
