"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus } from "lucide-react";
import { addCategory } from "@/lib/actions/inventory";

// Wrapper for the server action to handle success/close
async function addCategoryWrapper(prevState: any, formData: FormData) {
    const res = await addCategory(prevState, formData);
    if (res.message && res.message.includes("success")) {
        return { ...res, success: true };
    }
    return { ...res, success: false };
}

export function CreateCategoryDialog() {
    const [open, setOpen] = useState(false);
    const initialState = { message: null, errors: {} };
    // @ts-ignore - types mismatch for wrapper but safe for runtime
    const [state, formAction, isPending] = useActionState(addCategoryWrapper, initialState);

    if (state.success && open) {
        setOpen(false);
        // Reset state or handle side effects if needed (though component remounts usually clear it, 
        // with useActionState the state persists until action changes. 
        // We'll rely on the parent or just close it. 
        // Ideally we'd trigger a router refresh but the action already has revalidatePath)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button type="button" variant="outline" size="icon" className="h-11 w-11 shrink-0 bg-background border-border/60">
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">Add Category</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form action={formAction}>
                    <DialogHeader>
                        <DialogTitle>New Category</DialogTitle>
                        <DialogDescription>
                            Create a new product category.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="e.g. Raw Materials"
                                required
                            />
                            {state.errors?.name && (
                                <p className="text-xs text-red-500">{state.errors.name[0]}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Input
                                id="description"
                                name="description"
                                placeholder="Category details..."
                            />
                        </div>
                        {state.message && !state.success && (
                            <p className="text-sm text-red-500">{state.message}</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create Category"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
