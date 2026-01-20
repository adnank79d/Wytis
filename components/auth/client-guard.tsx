"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export function ClientGuard({ children }: { children: React.ReactNode }) {
    const { session, supabase } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // If no session and we are done loading (we assume AuthProvider handles loading state initially 
        // by returning null session but maybe we need an isLoading flag there)
        // For now, if session is strictly null, we redirect. 
        // Note: AuthProvider initial state is null, so we need to be careful not to redirect too fast.
        // We really need an 'isLoading' from AuthProvider.
        // Using a short timeout or checking if supabase is ready might help, 
        // but let's assume if session is null after mount, we trigger a check.

        async function check() {
            const { data } = await supabase.auth.getSession();
            if (!data.session) {
                router.push("/login");
            }
        }

        if (!session) {
            check();
        }
    }, [session, supabase, router]);

    if (!session) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return <>{children}</>;
}
