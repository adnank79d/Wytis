import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BarChart3,
  Users,
  ShieldCheck,
  Play,
  Target,
  Check,
  X,
  Minus,
  FileText,
  CreditCard,
  Receipt,
  TrendingUp,
  Layers,
  Globe,
  Lock as LockIcon,
  Server,
  Database,
  MapPin,
} from "lucide-react";

import {
  AbstractIntegration,
  AbstractQuery,
  AbstractAudit,
  AbstractPulse
} from "@/components/marketing/custom-icons";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";



export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-[100dvh]">

      {/* 1. HERO SECTION */}
      {/* 1. HERO SECTION - REDESIGNED */}
      {/* 1. HERO SECTION - CENTERED */}
      <section className="w-full pt-8 md:pt-12 lg:pt-16 pb-10 md:pb-20 bg-background border-b border-border/40 relative overflow-hidden">
        {/* Hero Content */}
        <div className="w-full max-w-[1280px] mx-auto px-4 md:px-6 relative z-10">
          <div className="flex flex-col items-center text-center gap-6 md:gap-10">

            {/* Top: Text & CTAs */}
            <div className="flex flex-col items-center space-y-4 md:space-y-6 max-w-3xl mx-auto">
              <div className="space-y-3 md:space-y-5 flex flex-col items-center">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 md:px-3 md:py-1 text-[10px] md:text-xs font-medium text-primary shadow-sm animate-hero-entrance opacity-0">
                  <div className="h-1 w-1 md:h-1.5 md:w-1.5 rounded-full bg-primary animate-pulse" />
                  Powered by Wytis AI
                </div>
                <h1 className="text-2xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground leading-[1.15] md:leading-[1.1] animate-hero-entrance-delay-1 opacity-0">
                  Run your entire business <br className="hidden md:block" /> on one intelligent system.
                </h1>
                <p className="text-sm md:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto animate-hero-entrance-delay-2 opacity-0">
                  Wytis unifies finance, compliance, and operations into a single, working system.
                </p>
              </div>

              <div className="flex flex-col gap-4 md:gap-6 items-center w-full animate-hero-entrance-delay-3 opacity-0">
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center w-full sm:w-auto">
                  <Link href="/signup">
                    <Button size="lg" className="h-10 md:h-11 px-6 md:px-8 rounded-lg text-sm md:text-base font-medium w-full sm:w-auto">
                      Start free trial
                    </Button>
                  </Link>
                  <Link href="#demo">
                    <Button variant="outline" size="lg" className="h-10 md:h-11 px-6 md:px-8 rounded-lg text-sm md:text-base font-medium w-full sm:w-auto bg-transparent border-border/60 hover:bg-secondary/20">
                      Learn more
                    </Button>
                  </Link>
                </div>
                <p className="text-[10px] md:text-xs text-muted-foreground font-medium flex items-center justify-center gap-2">
                  No credit card required
                </p>
              </div>
            </div>

            {/* Bottom: Dashboard Screenshot - Boxed & Smaller */}
            <div className="relative w-full max-w-5xl mx-auto mt-8 p-2 rounded-xl border bg-background/50 shadow-xl shadow-primary/5 animate-hero-entrance-delay-4 opacity-0">
              {/* Inner aspect container with its own border/rounding */}
              <div className="aspect-[16/10] relative rounded-xl border bg-muted/20 overflow-hidden">
                <Image
                  src="/hero.png"
                  alt="Wytis Dashboard Interface"
                  fill
                  className="object-cover object-top"
                  priority
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. PROBLEM STATEMENT */}
      <section className="w-full py-10 md:py-20 bg-background">
        <div className="w-full max-w-[1280px] mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row gap-6 md:gap-16 items-start">
            <div className="md:w-1/3">
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
                Too many tools. <br /> Too little clarity.
              </h2>
              <div className="h-1 w-12 md:w-16 bg-primary/20 mt-3 md:mt-4 rounded-full" />
            </div>
            <div className="md:w-2/3 grid gap-4 md:gap-6 text-sm md:text-base text-muted-foreground leading-relaxed">
              <p className="max-w-xl">
                Running a business shouldn't mean switching between five different apps.
                When accounting is separate from inventory, and payroll doesn't talk to billing,
                you lose visibility. Wytis solves this fragmentation.
              </p>
              <div className="grid sm:grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm text-foreground font-medium">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400" /> Accounting & GST disconnected
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400" /> Inventory never matches billing
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400" /> Manual, delayed reporting
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400" /> No real-time cash flow view
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURE SHOWCASE (NEW) */}
      <section className="w-full py-10 md:py-16 bg-background border-b border-border/40">
        <div className="w-full max-w-[1280px] mx-auto px-4 md:px-6">

          <div className="text-center max-w-3xl mx-auto mb-10 md:mb-20">
            <h2 className="text-xl md:text-3xl font-semibold tracking-tight text-foreground sm:text-4xl mb-3 md:mb-4">
              Everything your business needs, working together.
            </h2>
            <p className="text-sm md:text-lg text-muted-foreground">
              Wytis brings finance, compliance, operations, and insights into one unified system.
            </p>
          </div>

          <div className="flex flex-col gap-10 md:gap-24">
            {[
              {
                title: "Create and manage GST-compliant invoices",
                desc: "Generate invoices with automatic GST calculations, customer tracking, and payment status.",
                label: "Sales & Invoicing",
                img: "/features/sales.png"
              },
              {
                title: "Track expenses and vendor bills accurately",
                desc: "Record purchases, manage vendors, and maintain expense categories in real time.",
                label: "Purchases & Expenses",
                img: "/features/purchases.png"
              },
              {
                title: "Know your stock position at all times",
                desc: "Monitor stock, SKUs, and inventory value across locations.",
                label: "Inventory Management",
                img: "/features/inventory.png"
              },
              {
                title: "Always-ready financial statements",
                desc: "View Profit & Loss, Balance Sheet, and Cash Flow clearly.",
                label: "Accounting & Reports",
                img: "/features/reports.png"
              },
              {
                title: "Stay compliant without manual effort",
                desc: "Automatic GST summaries and GSTR-ready data.",
                label: "GST & Compliance",
                img: "/features/gst.png"
              },
              {
                title: "Manage payroll and employee records",
                desc: "Salary structures and payroll aligned with Indian requirements.",
                label: "Payroll & HR",
                img: "/features/payroll.png"
              },
              {
                title: "Keep track of customers and relationships",
                desc: "Customer history and outstanding balances in one place.",
                label: "CRM & Clients",
                img: "/features/crm.png"
              },
              {
                title: "Understand project-level profitability",
                desc: "Track costs, revenue, and margins per project.",
                label: "Projects & Costing",
                img: "/features/projects.png"
              },
              {
                title: "Ask questions. Get business answers.",
                desc: "Interact with your data using natural language.",
                label: "AI Insights",
                img: "/features/ai.png"
              }
            ].map((feature, idx) => (
              <div key={idx} className={`flex flex-col md:flex-row gap-6 md:gap-12 lg:gap-20 items-center ${idx % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>

                {/* Text Side */}
                <div className="flex-1 space-y-2 md:space-y-4 text-center md:text-left">
                  <div className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] md:text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20">
                    {feature.label}
                  </div>
                  <h3 className="text-lg md:text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                    {feature.title}
                  </h3>
                  <p className="text-sm md:text-lg text-muted-foreground leading-relaxed">
                    {feature.desc}
                  </p>
                </div>

                {/* Image Side */}
                <div className="flex-1 w-full">
                  <div className="relative aspect-[16/10] w-full rounded-xl border border-border/40 bg-secondary/5 overflow-hidden shadow-sm">
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20 font-medium">
                      {/* Placeholder Fallback if image missing */}
                      Screenshot: {feature.label}
                    </div>
                    {/* Note: User needs to add these images to public/features/ */}
                    <Image
                      src={feature.img}
                      alt={`${feature.label} Interface`}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 3.5 QUICK WALKTHROUGHS */}
      <section className="w-full py-10 md:py-20 bg-background border-b border-border/40">
        <div className="w-full max-w-[1280px] mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center text-center mb-8 md:mb-12">
            <h2 className="text-xl md:text-3xl font-semibold tracking-tight mb-2 md:mb-3">Quick walkthroughs</h2>
            <p className="text-muted-foreground text-sm md:text-base">See how common workflows happen in seconds.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {[
              {
                title: "Creating an Invoice",
                desc: "Generate a GST-ready invoice in 30 seconds.",
                color: "bg-blue-500"
              },
              {
                title: "Automated GSTR-1",
                desc: "Export your tax reports with one click.",
                color: "bg-green-500"
              },
              {
                title: "Live P&L Tracking",
                desc: "See your profit margins in real-time.",
                color: "bg-orange-500"
              }
            ].map((video, idx) => (
              <div key={idx} className="group rounded-lg border bg-card overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all cursor-pointer">
                <div className="aspect-video bg-secondary/30 relative flex items-center justify-center border-b border-border/50">
                  <div className={`absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity ${video.color}`} />
                  <div className="w-12 h-12 rounded-full bg-background/90 backdrop-blur-sm shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform text-foreground pl-1">
                    <Play className="w-4 h-4 fill-[#6366f1] stroke-none" />
                  </div>
                </div>
                <div className="p-4 md:p-5">
                  <h3 className="font-semibold text-base md:text-lg mb-1.5 md:mb-2 group-hover:text-primary transition-colors">{video.title}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{video.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center mt-12 text-center space-y-3">
            <p className="text-muted-foreground text-sm font-medium">
              Also available: Inventory Audit, Vendor Management, Payroll Setup, and more.
            </p>
            <Link href="#walkthroughs" className="text-primary text-sm font-semibold hover:underline flex items-center gap-1.5 transition-all hover:gap-2">
              View all walkthroughs <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      </section>

      {/* 5. WHY WYTiS VS TRADITIONAL TOOLS */}
      <section className="w-full py-10 md:py-20 bg-background border-t border-border/40">
        <div className="w-full max-w-[1280px] mx-auto px-4 md:px-6">
          <div className="mb-10 md:mb-16 text-center max-w-xl mx-auto">
            <h2 className="text-xl md:text-3xl font-semibold tracking-tight text-foreground mb-2 md:mb-3">
              Why Wytis?
            </h2>
            <p className="text-sm md:text-base text-muted-foreground">
              The structural difference between a patchwork of tools and a unified operating system.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 relative">
            {/* Visual connector line for desktop */}
            <div className="hidden md:block absolute left-1/2 top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-border to-transparent -translate-x-1/2" />

            {/* Traditional Tools */}
            <div className="space-y-6 md:space-y-8 p-5 md:p-8 rounded-2xl bg-secondary/5 border border-transparent">
              <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6 opacity-70">
                <div className="p-1.5 md:p-2 rounded-lg bg-secondary/20">
                  <Minus className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-muted-foreground tracking-wide">Traditional Tools</h3>
              </div>
              <ul className="space-y-4 md:space-y-6">
                {[
                  "Disconnected systems for Billing and Accounting",
                  "Manual data entry & reconciliation required",
                  "Delayed reporting (wait weeks for P&L)",
                  "Complex, accountant-only workflows"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 md:gap-4 text-sm md:text-base text-muted-foreground group">
                    <X className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground/40 mt-0.5 shrink-0 group-hover:text-red-400/60 transition-colors" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Wytis */}
            <div className="space-y-6 md:space-y-8 p-5 md:p-8 rounded-2xl bg-background border border-primary/20 shadow-xl shadow-primary/5 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
              <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                <div className="relative w-7 h-7 md:w-9 md:h-9 rounded-lg overflow-hidden">
                  <Image src="/logo.png" alt="Wytis Logo" fill className="object-contain" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-foreground tracking-wide">Wytis Operating System</h3>
              </div>
              <div className="space-y-4 md:space-y-6">
                {[
                  "One unified system carrying all business context",
                  "Real-time sync across Inventory & Finance",
                  "Instant, decision-ready financial insights",
                  "AI-assisted answers in plain English"
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 md:gap-4 text-sm md:text-base text-foreground font-medium">
                    <div className="w-4 h-4 md:w-5 md:h-5 flex items-center justify-center mt-0.5 shrink-0 text-primary">
                      <Check className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section >

      {/* 5. DATA INTELLIGENCE - REDESIGNED */}
      < section className="w-full py-10 md:py-20 bg-background border-t border-border/40" >
        <div className="w-full max-w-[1280px] mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-16">
            <h2 className="text-xl md:text-3xl font-semibold tracking-tight text-foreground mb-3 md:mb-5">
              From fragmented data to clear decisions.
            </h2>
            <div className="text-sm md:text-lg text-muted-foreground leading-relaxed font-light max-w-xl mx-auto">
              Wytis organizes your business data into one clear system, making it easier to understand and act on.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8 max-w-5xl mx-auto">

            {/* 1. One shared reality - Database */}
            <div className="flex flex-col gap-3 md:gap-4 p-5 md:p-8 rounded-2xl border border-transparent bg-secondary/5 hover:border-border/60 transition-colors">
              <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center mb-1 md:mb-2">
                <AbstractIntegration className="w-8 h-8 md:w-10 md:h-10 text-primary" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-foreground">One shared reality</h3>
              <p className="text-sm md:text-lg text-muted-foreground leading-relaxed">
                Inventory and finance share the same database. Sell a product, and your stock levels and profit margins update instantly. No syncing required.
              </p>
            </div>

            {/* 2. Ask in plain English - Message Square */}
            <div className="flex flex-col gap-3 md:gap-4 p-5 md:p-8 rounded-2xl border border-transparent bg-secondary/5 hover:border-border/60 transition-colors">
              <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-start mb-1 md:mb-2">
                <AbstractQuery className="w-8 h-8 md:w-10 md:h-10 text-primary" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-foreground">Ask in plain English</h3>
              <p className="text-sm md:text-lg text-muted-foreground leading-relaxed">
                Don't dig through menus. Just ask, "How much did we spend on shipping last month?" and get the exact number immediately.
              </p>
            </div>

            {/* 3. Always audit-ready - History */}
            <div className="flex flex-col gap-3 md:gap-4 p-5 md:p-8 rounded-2xl border border-transparent bg-secondary/5 hover:border-border/60 transition-colors">
              <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-start mb-1 md:mb-2">
                <AbstractAudit className="w-8 h-8 md:w-10 md:h-10 text-primary" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-foreground">Always audit-ready</h3>
              <p className="text-sm md:text-lg text-muted-foreground leading-relaxed">
                Every action creates a permanent, traceable record. Your GST liability and tax obligations are calculated in real-time as you work.
              </p>
            </div>

            {/* 4. Live financial health - Activity */}
            <div className="flex flex-col gap-3 md:gap-4 p-5 md:p-8 rounded-2xl border border-transparent bg-secondary/5 hover:border-border/60 transition-colors">
              <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-start pl-0.5 md:pl-1 mb-1 md:mb-2">
                <AbstractPulse className="w-8 h-8 md:w-10 md:h-10 text-primary" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-foreground">Live financial health</h3>
              <p className="text-sm md:text-lg text-muted-foreground leading-relaxed">
                Your Profit & Loss is never a month old. See exactly how much cash you have and what you owe, right this second.
              </p>
            </div>

          </div>
        </div>
      </section >

      {/* 7. PRICING */}
      < section id="pricing" className="w-full py-10 md:py-20 bg-secondary/20 border-t border-border/40" >
        <div className="w-full max-w-[1280px] mx-auto px-4 md:px-6">
          <div className="text-center max-w-xl mx-auto mb-8 md:mb-12">
            <h2 className="text-xl md:text-3xl font-semibold tracking-tight text-foreground mb-2 md:mb-3">
              Fair, transparent pricing.
            </h2>
            <p className="text-sm md:text-base text-muted-foreground">
              Built for growing businesses. No hidden fees.
            </p>
          </div>

          {/* Key Benefits Grid */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 mb-12 md:mb-20">
            {/* 1. No Transaction Fees */}
            <div className="flex flex-col items-start text-left space-y-2 md:space-y-3">
              <div className="p-2 md:p-2.5 rounded-lg bg-background border border-border/60 shadow-sm mb-0.5 md:mb-1">
                <CreditCard className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
              <h3 className="text-sm md:text-base font-semibold text-foreground">No Transaction Fees</h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">We don't charge a percentage of your revenue.</p>
            </div>

            {/* 2. Predictable Scaling */}
            <div className="flex flex-col items-start text-left space-y-2 md:space-y-3">
              <div className="p-2 md:p-2.5 rounded-lg bg-background border border-border/60 shadow-sm mb-0.5 md:mb-1">
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
              <h3 className="text-sm md:text-base font-semibold text-foreground">Predictable Scaling</h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">Flat usage tiers that grow with you.</p>
            </div>

            {/* 3. All Core Features */}
            <div className="flex flex-col items-start text-left space-y-2 md:space-y-3">
              <div className="p-2 md:p-2.5 rounded-lg bg-background border border-border/60 shadow-sm mb-0.5 md:mb-1">
                <Layers className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
              <h3 className="text-sm md:text-base font-semibold text-foreground">All Core Features</h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">Inventory, Billing, and GST included.</p>
            </div>

            {/* 4. India-First Context */}
            <div className="flex flex-col items-start text-left space-y-2 md:space-y-3">
              <div className="p-2 md:p-2.5 rounded-lg bg-background border border-border/60 shadow-sm mb-0.5 md:mb-1">
                <Globe className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
              <h3 className="text-sm md:text-base font-semibold text-foreground">Local Context</h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">Unlimited E-Invoices and GSTR reports.</p>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 max-w-6xl mx-auto">
            {/* STARTER */}
            <div className="flex flex-col p-5 md:p-8 rounded-2xl bg-background border border-border/60 hover:border-primary/20 transition-all shadow-sm">
              <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-1.5 md:mb-2">Starter</h3>
              <p className="text-xs md:text-sm text-muted-foreground mb-5 md:mb-8">For small teams getting started.</p>
              <div className="mb-5 md:mb-8">
                <div className="flex items-baseline">
                  <span className="text-2xl md:text-4xl font-bold text-foreground tracking-tight">₹999</span>
                  <span className="text-muted-foreground ml-1.5 md:ml-2 text-sm md:text-base font-medium">/ month</span>
                </div>
              </div>
              <ul className="space-y-3 md:space-y-4 mb-5 md:mb-8 flex-1">
                {[
                  "Core Accounting & Billing",
                  "GST Reports (GSTR-1, 3B)",
                  "Inventory Tracking (Up to 500 SKUs)",
                  "1 User Seat",
                  "Email Support"
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 md:gap-3 text-xs md:text-sm text-muted-foreground">
                    <Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary mt-0.5 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full h-10 md:h-11 text-sm md:text-base font-medium border-border/60 bg-transparent hover:bg-secondary/20">Select Starter</Button>
            </div>

            {/* GROWTH */}
            <div className="flex flex-col p-5 md:p-8 rounded-2xl bg-background border-2 border-primary/10 shadow-lg relative transform md:-translate-y-4 z-10">
              <div className="absolute top-0 right-0 -mt-2.5 -mr-2.5 md:-mt-3 md:-mr-3">
                <span className="bg-primary text-primary-foreground text-[10px] md:text-xs font-bold px-2 py-0.5 md:px-3 md:py-1 rounded-full shadow-sm">POPULAR</span>
              </div>
              <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-1.5 md:mb-2">Growth</h3>
              <p className="text-xs md:text-sm text-muted-foreground mb-5 md:mb-8">For scaling operations.</p>
              <div className="mb-5 md:mb-8">
                <div className="flex items-baseline">
                  <span className="text-2xl md:text-4xl font-bold text-foreground tracking-tight">₹2,499</span>
                  <span className="text-muted-foreground ml-1.5 md:ml-2 text-sm md:text-base font-medium">/ month</span>
                </div>
              </div>
              <ul className="space-y-3 md:space-y-4 mb-5 md:mb-8 flex-1">
                {[
                  "Everything in Starter",
                  "Unlimited Inventory SKUs",
                  "Multi-user Access (3 Seats)",
                  "Advanced Business Intelligence",
                  "Priority Email Support"
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 md:gap-3 text-xs md:text-sm text-foreground font-medium">
                    <div className="p-0.5 rounded-full bg-primary/10">
                      <Check className="w-3 h-3 md:w-3.5 md:h-3.5 text-primary shrink-0" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
              <Button className="w-full h-10 md:h-11 text-sm md:text-base font-medium shadow-md">Select Growth</Button>
            </div>

            {/* SCALE */}
            <div className="flex flex-col p-5 md:p-8 rounded-2xl bg-background border border-border/60 hover:border-primary/20 transition-all shadow-sm">
              <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-1.5 md:mb-2">Scale</h3>
              <p className="text-xs md:text-sm text-muted-foreground mb-5 md:mb-8">For complex workflows.</p>
              <div className="mb-5 md:mb-8">
                <div className="flex items-baseline">
                  <span className="text-2xl md:text-4xl font-bold text-foreground tracking-tight">₹5,999</span>
                  <span className="text-muted-foreground ml-1.5 md:ml-2 text-sm md:text-base font-medium">/ month</span>
                </div>
              </div>
              <ul className="space-y-3 md:space-y-4 mb-5 md:mb-8 flex-1">
                {[
                  "Everything in Growth",
                  "Custom Workflows & Roles",
                  "Dedicated Account Manager",
                  "API Access",
                  "On-premise Deployment Options"
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 md:gap-3 text-xs md:text-sm text-muted-foreground">
                    <Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary mt-0.5 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full h-10 md:h-11 text-sm md:text-base font-medium border-border/60 bg-transparent hover:bg-secondary/20">Select Scale</Button>
            </div>
          </div>
          <div className="text-center mt-8 md:mt-12 text-xs md:text-sm text-muted-foreground">
            Prices entered are exclusive of GST. Billed monthly.
          </div>
        </div>
      </section>

      {/* 9. PRICING FAQs */}
      <section className="w-full py-12 md:py-24 bg-background border-t border-border/40">
        <div className="w-full max-w-[1280px] mx-auto px-4 md:px-6">
          <div className="max-w-2xl mx-auto space-y-8 md:space-y-12">
            <h2 className="text-xl md:text-3xl font-semibold tracking-tight text-foreground text-center mb-6 md:mb-10">
              Common questions about pricing.
            </h2>
            <Accordion type="single" collapsible className="w-full space-y-3 md:space-y-4">
              {[
                { q: "Are there limits on invoices, transactions, or users?", a: "No. Core workflows are not restricted by transaction count." },
                { q: "Does pricing increase as revenue grows?", a: "Pricing is based on plan level, not on revenue or usage spikes." },
                { q: "Are GST, reports, and compliance features included?", a: "Yes. Core compliance and reporting features are included in all relevant plans." },
                { q: "Can I upgrade or downgrade later?", a: "Yes. Plans can be changed without data loss or migration." },
                { q: "Is long-term commitment required?", a: "No. Monthly billing is available." }
              ].map((item, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border-b border-border/60 px-1">
                  <AccordionTrigger className="text-left text-sm md:text-base font-medium text-foreground py-4 md:py-6 hover:no-underline hover:text-primary transition-colors">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed text-sm md:text-base pb-4 md:pb-6">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* 10. TRUST & SECURITY */}
      <section className="w-full py-10 md:py-20 bg-background border-t border-border/40">
        <div className="w-full max-w-[1280px] mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 text-xs md:text-sm leading-relaxed text-muted-foreground">

            {/* 1. Your Data - Protected Block */}
            <div className="p-4 md:p-5 md:-ml-5 rounded-xl hover:bg-secondary/5 transition-colors duration-300">
              <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-start mb-2 md:mb-3">
                <Database className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              </div>
              <strong className="block text-foreground mb-1 md:mb-1.5 text-sm md:text-base font-medium">Your Data is Yours</strong>
              <p>You own your financial data completely. Export it at any time in standard formats.</p>
            </div>

            {/* 2. Security - Lock Layer */}
            <div className="p-4 md:p-5 md:ml-0 rounded-xl hover:bg-secondary/5 transition-colors duration-300">
              <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-start mb-2 md:mb-3">
                <LockIcon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              </div>
              <strong className="block text-foreground mb-1 md:mb-1.5 text-sm md:text-base font-medium">Bank-Grade Security</strong>
              <p>Data encrypted at rest (AES-256) and in transit (TLS 1.3). Enterprise-grade infrastructure.</p>
            </div>

            {/* 3. Reliability - Steady Stack */}
            <div className="p-4 md:p-5 md:ml-0 rounded-xl hover:bg-secondary/5 transition-colors duration-300">
              <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-start mb-2 md:mb-3">
                <Server className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              </div>
              <strong className="block text-foreground mb-1 md:mb-1.5 text-sm md:text-base font-medium">Reliable & Compliant</strong>
              <p>99.9% uptime SLA. Audit logs track every critical action.</p>
            </div>

          </div>
        </div>
      </section >





      {/* 10.5 MIGRATION / SWITCHING */}
      < section className="w-full py-12 md:py-24 bg-background border-t border-border/40" >
        <div className="w-full max-w-[1280px] mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-12 md:mb-20">
            <h2 className="text-xl md:text-3xl font-semibold tracking-tight text-foreground sm:text-4xl mb-3 md:mb-4">
              Switch to Wytis without missing a beat.
            </h2>
            <p className="text-sm md:text-lg text-muted-foreground">
              We handle the heavy lifting so you don't have to.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {/* 1. Data Import */}
            <div className="group flex flex-col items-start p-4 md:p-6 rounded-xl bg-background border border-border/40 hover:border-primary/20 hover:bg-secondary/5 transition-all duration-300">
              <div className="w-6 h-px md:w-8 bg-primary/30 mb-4 md:mb-6 group-hover:w-8 md:group-hover:w-12 transition-all duration-500" />
              <h3 className="text-base md:text-xl font-semibold text-foreground mb-2 md:mb-3 tracking-tight">One-Click Import</h3>
              <p className="text-xs md:text-base text-muted-foreground leading-relaxed">
                Upload your existing Excel sheets.
              </p>
            </div>

            {/* 2. Structured Templates */}
            <div className="group flex flex-col items-start p-4 md:p-6 rounded-xl bg-background border border-border/40 hover:border-primary/20 hover:bg-secondary/5 transition-all duration-300">
              <div className="w-6 h-px md:w-8 bg-primary/30 mb-4 md:mb-6 group-hover:w-8 md:group-hover:w-12 transition-all duration-500" />
              <h3 className="text-base md:text-xl font-semibold text-foreground mb-2 md:mb-3 tracking-tight">Smart Templates</h3>
              <p className="text-xs md:text-base text-muted-foreground leading-relaxed">
                Pre-built structures for inventory and customers.
              </p>
            </div>

            {/* 3. Validation Checks */}
            <div className="group flex flex-col items-start p-4 md:p-6 rounded-xl bg-background border border-border/40 hover:border-primary/20 hover:bg-secondary/5 transition-all duration-300">
              <div className="w-6 h-px md:w-8 bg-primary/30 mb-4 md:mb-6 group-hover:w-8 md:group-hover:w-12 transition-all duration-500" />
              <h3 className="text-base md:text-xl font-semibold text-foreground mb-2 md:mb-3 tracking-tight">Zero Errors</h3>
              <p className="text-xs md:text-base text-muted-foreground leading-relaxed">
                AI validates your data before it goes live.
              </p>
            </div>

            {/* 4. Zero Disruption */}
            <div className="group flex flex-col items-start p-4 md:p-6 rounded-xl bg-background border border-border/40 hover:border-primary/20 hover:bg-secondary/5 transition-all duration-300">
              <div className="w-6 h-px md:w-8 bg-primary/30 mb-4 md:mb-6 group-hover:w-8 md:group-hover:w-12 transition-all duration-500" />
              <h3 className="text-base md:text-xl font-semibold text-foreground mb-2 md:mb-3 tracking-tight">No Downtime</h3>
              <p className="text-xs md:text-base text-muted-foreground leading-relaxed">
                Keep running while we switch you over.
              </p>
            </div>
          </div>
        </div>
      </section >


      {/* 11. PRE-FOOTER CTA */}
      < section className="w-full py-12 md:py-20 bg-background border-t border-border/40" >
        <div className="w-full max-w-[800px] mx-auto px-4 md:px-6 text-center">
          <h2 className="text-xl md:text-3xl font-semibold tracking-tight text-foreground mb-3 md:mb-4">
            Ready to bring clarity to your business?
          </h2>
          <p className="text-sm md:text-lg text-muted-foreground mb-6 md:mb-8">
            Start using Wytis to manage finance, compliance, and operations on one unified system.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 mb-6 md:mb-8">
            <Link href="/signup">
              <Button className="w-full sm:w-auto h-10 md:h-11 px-6 md:px-8 text-sm md:text-base shadow-sm">Start free trial</Button>
            </Link>
            <Link href="/demo">
              <Button variant="outline" className="w-full sm:w-auto h-10 md:h-11 px-6 md:px-8 text-sm md:text-base bg-transparent border-border/60 hover:bg-secondary/20">Learn more</Button>
            </Link>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground opacity-80">
            No credit card required
          </p>
        </div>
      </section >

    </div >
  );
}
