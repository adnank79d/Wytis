"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Session, SupabaseClient, AuthChangeEvent } from "@supabase/supabase-js";

type AuthContextType = {
    supabase: SupabaseClient;
    session: Session | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

export function AuthProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [supabase] = useState(() => createClient());
    const [session, setSession] = useState<Session | null>(null);
    const router = useRouter();

    useEffect(() => {
        // 1. Get initial session
        supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
            setSession(session);
        });

        // 2. Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
            // Keep session state in sync
            if (session?.access_token !== session?.access_token) {
                // Token changed?
            }
            setSession(session);

            if (event === "SIGNED_OUT") {
                router.refresh();
            } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
                // Refresh server components to ensure they have fresh cookies
                router.refresh();
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase, router]);

    return (
        <AuthContext.Provider value={{ supabase, session }}>
            {children}
        </AuthContext.Provider>
    );
}
