"use client";

import Link from "next/link"
import Image from "next/image"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

export function Footer() {
    return (
        <footer className="border-t border-border/40 bg-secondary/20 pt-16 pb-8">
            <div className="container max-w-7xl mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 gap-12 lg:gap-32 lg:grid-cols-4 mb-16">
                    {/* Column 1: Brand (Always Visible) */}
                    <div className="space-y-4 pr-4">
                        <Link href="/" className="inline-block">
                            <Image src="/logo.png" alt="Wytis" width={32} height={32} className="w-8 h-8 opacity-90 hover:opacity-100 transition-opacity" />
                        </Link>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            An all-in-one business operating system for businesses.
                        </p>
                    </div>

                    {/* Mobile View: Accordion */}
                    <div className="lg:hidden col-span-1">
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="product">
                                <AccordionTrigger className="text-sm font-semibold text-foreground">Product</AccordionTrigger>
                                <AccordionContent>
                                    <ul className="space-y-3 pt-2 pb-4 text-sm">
                                        <li><Link href="/overview" className="text-muted-foreground hover:text-foreground">Overview</Link></li>
                                        <li><Link href="/features" className="text-muted-foreground hover:text-foreground">Features</Link></li>
                                        <li><Link href="/pricing" className="text-muted-foreground hover:text-foreground">Pricing</Link></li>
                                        <li><Link href="/security" className="text-muted-foreground hover:text-foreground">Security</Link></li>
                                        <li><Link href="/walkthrough" className="text-muted-foreground hover:text-foreground">Product walkthrough</Link></li>
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="resources">
                                <AccordionTrigger className="text-sm font-semibold text-foreground">Resources</AccordionTrigger>
                                <AccordionContent>
                                    <ul className="space-y-3 pt-2 pb-4 text-sm">
                                        <li><Link href="/docs" className="text-muted-foreground hover:text-foreground">Documentation</Link></li>
                                        <li><Link href="/tutorials" className="text-muted-foreground hover:text-foreground">Tutorials</Link></li>
                                        <li><Link href="/help" className="text-muted-foreground hover:text-foreground">Help center</Link></li>
                                        <li><Link href="/migration" className="text-muted-foreground hover:text-foreground">Migration guide</Link></li>
                                        <li><Link href="/status" className="text-muted-foreground hover:text-foreground">Status</Link></li>
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="company">
                                <AccordionTrigger className="text-sm font-semibold text-foreground">Company</AccordionTrigger>
                                <AccordionContent>
                                    <ul className="space-y-3 pt-2 pb-4 text-sm">
                                        <li><Link href="/about" className="text-muted-foreground hover:text-foreground">About</Link></li>
                                        <li><Link href="/contact" className="text-muted-foreground hover:text-foreground">Contact</Link></li>
                                        <li><Link href="/privacy" className="text-muted-foreground hover:text-foreground">Privacy policy</Link></li>
                                        <li><Link href="/terms" className="text-muted-foreground hover:text-foreground">Terms of service</Link></li>
                                        <li><Link href="/data-protection" className="text-muted-foreground hover:text-foreground">Data protection</Link></li>
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>

                    {/* Desktop View: Grid (Hidden on Mobile) */}
                    <div className="hidden lg:block space-y-4">
                        <h4 className="text-sm font-semibold text-foreground tracking-wide">Product</h4>
                        <ul className="space-y-2.5 text-sm">
                            <li><Link href="/overview" className="text-muted-foreground hover:text-foreground transition-colors">Overview</Link></li>
                            <li><Link href="/features" className="text-muted-foreground hover:text-foreground transition-colors">Features</Link></li>
                            <li><Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</Link></li>
                            <li><Link href="/security" className="text-muted-foreground hover:text-foreground transition-colors">Security</Link></li>
                            <li><Link href="/walkthrough" className="text-muted-foreground hover:text-foreground transition-colors">Product walkthrough</Link></li>
                        </ul>
                    </div>
                    <div className="hidden lg:block space-y-4">
                        <h4 className="text-sm font-semibold text-foreground tracking-wide">Resources</h4>
                        <ul className="space-y-2.5 text-sm">
                            <li><Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors">Documentation</Link></li>
                            <li><Link href="/tutorials" className="text-muted-foreground hover:text-foreground transition-colors">Tutorials</Link></li>
                            <li><Link href="/help" className="text-muted-foreground hover:text-foreground transition-colors">Help center</Link></li>
                            <li><Link href="/migration" className="text-muted-foreground hover:text-foreground transition-colors">Migration guide</Link></li>
                            <li><Link href="/status" className="text-muted-foreground hover:text-foreground transition-colors">Status</Link></li>
                        </ul>
                    </div>
                    <div className="hidden lg:block space-y-4">
                        <h4 className="text-sm font-semibold text-foreground tracking-wide">Company</h4>
                        <ul className="space-y-2.5 text-sm">
                            <li><Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">About</Link></li>
                            <li><Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</Link></li>
                            <li><Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy policy</Link></li>
                            <li><Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Terms of service</Link></li>
                            <li><Link href="/data-protection" className="text-muted-foreground hover:text-foreground transition-colors">Data protection</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                    <p>&copy; 2026 Wytis. All rights reserved.</p>

                </div>
            </div>
        </footer>
    )
}
