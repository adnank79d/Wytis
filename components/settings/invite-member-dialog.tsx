"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { useState } from "react"

export function InviteMemberDialog() {
    const [open, setOpen] = useState(false)

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault()
        // Mock invite logic
        setOpen(false)
        toast.success("Invitation sent successfully.")
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Invite Member
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Invite Teammate</DialogTitle>
                    <DialogDescription>
                        Send an email invitation to join your business workspace.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleInvite}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email address</Label>
                            <Input id="email" type="email" placeholder="colleague@company.com" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="role">Role</Label>
                            <Select defaultValue="staff">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="owner">Owner (Full Admin)</SelectItem>
                                    <SelectItem value="accountant">Accountant (Finance)</SelectItem>
                                    <SelectItem value="staff">Staff (Limited)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit">Send Invitation</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
