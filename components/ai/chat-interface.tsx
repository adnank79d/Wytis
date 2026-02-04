"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, TrendingUp, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { AIMessage, processAIQuery } from "@/lib/actions/ai";
import { cn } from "@/lib/utils";
import { Area, AreaChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts";
import Image from "next/image";

const SUGGESTIONS = [
    { label: "Revenue Trend", query: "What is my revenue trend?", icon: TrendingUp },
    { label: "New Customers", query: "How many new customers this month?", icon: Users },
    { label: "Top Expenses", query: "Show me my top expenses", icon: Wallet },
];

export function ChatInterface() {
    const [messages, setMessages] = useState<AIMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Initial welcome message if empty
    useEffect(() => {
        if (messages.length === 0) {
            // We don't auto-add a message, instead show the Empty State UI
        }
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleSend = async (text: string = input) => {
        if (!text.trim() || isLoading) return;

        const userMessage: AIMessage = {
            id: crypto.randomUUID(),
            role: "user",
            content: text,
            timestamp: Date.now(),
            type: "text",
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await processAIQuery(userMessage.content);
            setMessages((prev) => [...prev, response]);
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content: "Sorry, I encountered an error processing your request.",
                    timestamp: Date.now(),
                    type: "text",
                },
            ]);
        } finally {
            setIsLoading(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(value);

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] max-w-5xl mx-auto w-full bg-background/50 rounded-2xl border shadow-sm backdrop-blur-sm relative overflow-hidden">
            {/* Header Gradient Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-80" />

            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between bg-white/50 dark:bg-black/20">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-auto flex items-center justify-center">
                        <Image
                            src="/logo.png"
                            alt="Wytis AI"
                            width={100}
                            height={32}
                            className="h-6 w-auto object-contain"
                        />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">Assistant</h3>
                        <p className="text-xs text-muted-foreground">Business Intelligence</p>
                    </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setMessages([])} className="text-muted-foreground hover:text-foreground text-xs h-7">
                    Clear Chat
                </Button>
            </div>

            {/* Chat Area */}
            <ScrollArea className="flex-1 p-4 md:p-6">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-8 min-h-[400px]">
                        <div className="h-24 w-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-4 p-6">
                            <Image
                                src="/logo.png"
                                alt="Wytis AI"
                                width={120}
                                height={40}
                                className="h-auto w-full object-contain opacity-80"
                            />
                        </div>
                        <div className="max-w-md space-y-2">
                            <h2 className="text-2xl font-bold tracking-tight">How can I help you today?</h2>
                            <p className="text-muted-foreground">
                                I can analyze your financial data, customer trends, and payroll expenses instantly.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl px-4">
                            {SUGGESTIONS.map((suggestion) => (
                                <button
                                    key={suggestion.label}
                                    onClick={() => handleSend(suggestion.query)}
                                    className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl border bg-card hover:bg-accent/50 hover:border-indigo-200 transition-all duration-200 text-sm group"
                                >
                                    <div className="p-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
                                        <suggestion.icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <span className="font-medium">{suggestion.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 max-w-3xl mx-auto pb-4">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
                                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                                )}
                            >
                                <Avatar className={cn("h-8 w-8 mt-1 border", msg.role === "assistant" ? "bg-indigo-50 dark:bg-indigo-950 border-indigo-100" : "bg-zinc-100 dark:bg-zinc-800")}>
                                    {msg.role === "assistant" ? (
                                        <Bot className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                    ) : (
                                        <User className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                                    )}
                                </Avatar>

                                <div className={cn(
                                    "flex flex-col gap-2 max-w-[85%]",
                                    msg.role === "user" ? "items-end" : "items-start"
                                )}>
                                    <div
                                        className={cn(
                                            "px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm",
                                            msg.role === "user"
                                                ? "bg-indigo-600 text-white rounded-br-sm"
                                                : "bg-white dark:bg-zinc-900 border text-foreground rounded-bl-sm"
                                        )}
                                    >
                                        {msg.content}
                                    </div>

                                    {/* Rich Data Rendering */}
                                    {msg.data && (
                                        <Card className="w-full mt-1 overflow-hidden border bg-card/50 shadow-sm animate-in zoom-in-95 duration-300 origin-top-left">
                                            <CardContent className="p-4">
                                                {/* CHART */}
                                                {msg.type === 'chart' && msg.data.history && (
                                                    <div className="h-[200px] w-full mt-2">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <AreaChart data={msg.data.history}>
                                                                <defs>
                                                                    <linearGradient id={`gradient-${msg.id}`} x1="0" y1="0" x2="0" y2="1">
                                                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                                                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                                    </linearGradient>
                                                                </defs>
                                                                <RechartsTooltip
                                                                    contentStyle={{
                                                                        borderRadius: '8px',
                                                                        border: 'none',
                                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                                                    }}
                                                                    formatter={(val: any) => [typeof val === 'number' ? val.toLocaleString() : val, 'Value']}
                                                                />
                                                                <Area
                                                                    type="monotone"
                                                                    dataKey="value"
                                                                    stroke="#6366f1"
                                                                    fill={`url(#gradient-${msg.id})`}
                                                                    strokeWidth={2}
                                                                />
                                                                <XAxis dataKey="date" hide />
                                                                <YAxis hide domain={['auto', 'auto']} />
                                                            </AreaChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                )}

                                                {/* METRIC */}
                                                {msg.type === 'metric' && (
                                                    <div className="flex flex-col items-center justify-center py-4 bg-muted/20 rounded-lg">
                                                        <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium">{msg.data.label}</span>
                                                        <span className="text-3xl font-bold text-foreground mt-1 tracking-tight">
                                                            {formatCurrency(msg.data.value)}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* LIST */}
                                                {msg.type === 'list' && Array.isArray(msg.data) && (
                                                    <div className="rounded-lg border bg-background/50 overflow-hidden">
                                                        <ul className="text-sm divide-y">
                                                            {msg.data.map((item: any, i: number) => (
                                                                <li key={i} className="flex justify-between p-3 hover:bg-muted/50 transition-colors">
                                                                    <span className="text-muted-foreground">{item.category}</span>
                                                                    <span className="font-medium font-mono">{formatCurrency(item.amount)}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-2">
                                <Avatar className="h-8 w-8 mt-1 border bg-indigo-50 dark:bg-indigo-950 border-indigo-100">
                                    <Bot className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                </Avatar>
                                <div className="bg-white dark:bg-zinc-900 border text-foreground px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1.5">
                                    <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>
                )}
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-black/20 border-t">
                <div className="max-w-3xl mx-auto relative flex items-center gap-2">
                    <div className="relative flex-1">
                        <Input
                            ref={inputRef}
                            placeholder="Ask follow-up questions..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isLoading}
                            className="pr-12 py-6 rounded-full border-zinc-200 dark:border-zinc-800 shadow-sm focus-visible:ring-indigo-500 pl-6"
                        />
                        <Button
                            size="icon"
                            className="absolute right-1.5 top-1.5 h-9 w-9 rounded-full bg-indigo-600 hover:bg-indigo-700 transition-all shadow-sm"
                            onClick={() => handleSend()}
                            disabled={isLoading || !input.trim()}
                        >
                            <Send className="h-4 w-4" />
                            <span className="sr-only">Send</span>
                        </Button>
                    </div>
                </div>
                <div className="text-center mt-2">
                    <p className="text-[10px] text-muted-foreground">
                        AI can make mistakes. Verify important financial data.
                    </p>
                </div>
            </div>
        </div>
    );
}
