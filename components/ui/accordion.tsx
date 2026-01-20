"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"

const AccordionContext = React.createContext<{
    openItem: string | undefined
    setOpenItem: (value: string | undefined) => void
}>({
    openItem: undefined,
    setOpenItem: () => { },
})

const Accordion = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { type?: "single" | "multiple"; collapsible?: boolean }
>(({ className, type, collapsible, ...props }, ref) => {
    // Simplified to only support "single" collapsible for now
    const [openItem, setOpenItem] = React.useState<string | undefined>(undefined)

    return (
        <AccordionContext.Provider value={{ openItem, setOpenItem }}>
            <div ref={ref} className={cn("w-full", className)} {...props} />
        </AccordionContext.Provider>
    )
})
Accordion.displayName = "Accordion"

const AccordionItem = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, value, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn("border-b", className)}
            data-value={value}
            {...props}
        />
    )
})
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
    const { openItem, setOpenItem } = React.useContext(AccordionContext)
    // @ts-ignore
    const value = props.onClick ? undefined : (ref as any)?.current?.closest("[data-value]")?.getAttribute("data-value")

    // We need to capture the value from the parent Item context or prop. 
    // To avoid complex layout thrashing or context nesting, let's just assume the user passes logic or we infer it.
    // Actually, a simpler way for this custom implementation is to use a context for the Item too.

    const itemValue = React.useContext(AccordionTriggerContext)

    return (
        <button
            ref={ref}
            onClick={() => setOpenItem(openItem === itemValue ? undefined : itemValue)}
            className={cn(
                "flex flex-1 w-full items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-45",
                className
            )}
            data-state={openItem === itemValue ? "open" : "closed"}
            {...props}
        >
            {children}
            <Plus className="h-4 w-4 shrink-0 transition-transform duration-200" />
        </button>
    )
})
AccordionTrigger.displayName = "AccordionTrigger"

const AccordionContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
    const { openItem } = React.useContext(AccordionContext)
    const itemValue = React.useContext(AccordionTriggerContext)
    const isOpen = openItem === itemValue

    if (!isOpen) return null

    return (
        <div
            ref={ref}
            className={cn(
                "overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
                className
            )}
            {...props}
        >
            <div className="pb-4 pt-0">{children}</div>
        </div>
    )
})
AccordionContent.displayName = "AccordionContent"

// Helper context for Item value
const AccordionTriggerContext = React.createContext<string>("")

const AccordionItemWrapper = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, value, ...props }, ref) => (
    <AccordionTriggerContext.Provider value={value}>
        <div ref={ref} className={cn("border-b", className)} {...props} />
    </AccordionTriggerContext.Provider>
))
AccordionItemWrapper.displayName = "AccordionItem"

export { Accordion, AccordionItemWrapper as AccordionItem, AccordionTrigger, AccordionContent }
