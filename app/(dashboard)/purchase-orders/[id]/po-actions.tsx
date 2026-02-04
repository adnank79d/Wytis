"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { issuePO } from "@/lib/actions/purchase-orders";
import { Loader2, Send } from "lucide-react";

export function POActions({ po }: { po: any }) {
    const [isIssuing, setIsIssuing] = useState(false);

    const handleIssue = async () => {
        setIsIssuing(true);
        await issuePO(po.id);
        setIsIssuing(false);
    };

    if (po.status !== 'draft') return null;

    return (
        <Button onClick={handleIssue} disabled={isIssuing} size="sm" className="bg-primary hover:bg-primary/90">
            {isIssuing ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Issuing...
                </>
            ) : (
                <>
                    <Send className="mr-2 h-4 w-4" />
                    Issue PO
                </>
            )}
        </Button>
    );
}
