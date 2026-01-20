"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tag } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export function PromoCodeInput() {
    const [code, setCode] = useState("")
    const [applied, setApplied] = useState(false)

    const handleApply = (e: React.FormEvent) => {
        e.preventDefault()
        if (!code) return

        // Mock validation or simply visual feedback
        setApplied(true)
        toast.message("Promo code recognized", {
            description: "Please confirm this code during checkout to apply discount.",
            icon: <Tag className="w-4 h-4 text-green-600" />
        })
    }

    if (applied) {
        return (
            <div className="flex items-center justify-between p-4 border border-green-200 bg-green-50 rounded-lg text-sm">
                <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-900">Code &quot;{code}&quot; applied</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setApplied(false)} className="text-green-700 hover:text-green-900 h-auto p-0">
                    Remove
                </Button>
            </div>
        )
    }

    return (
        <div className="pt-6">
            <div className="flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-sm font-medium">Have a promo code?</h4>
            </div>
            <form onSubmit={handleApply} className="flex gap-2 max-w-sm">
                <Input
                    placeholder="Enter code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="h-9 bg-background"
                />
                <Button type="submit" size="sm" variant="secondary" disabled={!code}>
                    Apply
                </Button>
            </form>
            <p className="text-[10px] text-muted-foreground mt-2 pl-6">
                Discount will be reflected securely during checkout step.
            </p>
        </div>
    )
}
