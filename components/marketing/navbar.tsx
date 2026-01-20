"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";

import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const closeSheet = () => setIsOpen(false);

  return (
    <nav className="border-b border-border/40 bg-white sticky top-0 z-50">
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between md:grid md:grid-cols-[1fr_auto_1fr] px-4 md:px-6 h-14 md:h-16">
        <Link href="/" className="flex items-center gap-2 md:gap-3 font-bold text-lg md:text-xl text-foreground tracking-tight" onClick={closeSheet}>
          <Image src="/logo.png" alt="Wytis Logo" width={48} height={48} className="w-7 h-7 md:w-9 md:h-9" />
          <span className="font-manrope">Wytis</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center justify-center gap-8 text-sm font-medium text-muted-foreground col-start-2">
          <Link href="#features" className="hover:text-foreground transition-colors">
            Features
          </Link>
          <Link href="/use-cases" className="hover:text-foreground transition-colors">
            Use Cases
          </Link>
          <Link href="/pricing" className="hover:text-foreground transition-colors">
            Pricing
          </Link>
          <Link href="/about" className="hover:text-foreground transition-colors">
            About
          </Link>
          <Link href="/docs" className="hover:text-foreground transition-colors">
            Docs
          </Link>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center justify-end gap-4">
          <Link href="/login">
            <Button variant="ghost" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Log in
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="text-sm font-medium h-9 px-4 rounded-lg">
              Get Started
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Trigger */}
        <div className="md:hidden flex items-center">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden w-10 h-10 -mr-2">
                <Menu className="w-6 h-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[400px] border-l border-border/40 bg-background/95 backdrop-blur-xl p-0">
              <SheetTitle className="sr-only">Mobile Menu</SheetTitle>

              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border/40">
                  <div className="flex items-center gap-3">
                    <Image src="/logo.png" alt="Wytis Logo" width={32} height={32} className="w-8 h-8 opacity-90" />
                    <span className="font-bold text-xl font-manrope tracking-tight">Wytis</span>
                  </div>
                  {/* Close button is handled automatically by SheetContent, but we can style the area if needed */}
                </div>

                {/* Links */}
                <div className="flex flex-col flex-1 px-6 py-8 overflow-y-auto">
                  <nav className="flex flex-col space-y-6">
                    <Link
                      href="#features"
                      className="text-2xl font-medium text-foreground/80 hover:text-primary transition-colors tracking-tight"
                      onClick={closeSheet}
                    >
                      Features
                    </Link>
                    <Link
                      href="/use-cases"
                      className="text-2xl font-medium text-foreground/80 hover:text-primary transition-colors tracking-tight"
                      onClick={closeSheet}
                    >
                      Use Cases
                    </Link>
                    <Link
                      href="/pricing"
                      className="text-2xl font-medium text-foreground/80 hover:text-primary transition-colors tracking-tight"
                      onClick={closeSheet}
                    >
                      Pricing
                    </Link>
                    <Link
                      href="/about"
                      className="text-2xl font-medium text-foreground/80 hover:text-primary transition-colors tracking-tight"
                      onClick={closeSheet}
                    >
                      About
                    </Link>
                    <Link
                      href="/docs"
                      className="text-2xl font-medium text-foreground/80 hover:text-primary transition-colors tracking-tight"
                      onClick={closeSheet}
                    >
                      Docs
                    </Link>
                  </nav>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-border/40 bg-secondary/5 space-y-4">
                  <Link href="/login" className="block w-full" onClick={closeSheet}>
                    <Button variant="outline" className="w-full h-12 text-base font-medium border-border/60 bg-background hover:bg-secondary/20">
                      Log in
                    </Button>
                  </Link>
                  <Link href="/signup" className="block w-full" onClick={closeSheet}>
                    <Button className="w-full h-12 text-base font-medium shadow-sm">
                      Start free trial
                    </Button>
                  </Link>
                  <p className="text-xs text-center text-muted-foreground pt-2">
                    No credit card required
                  </p>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
