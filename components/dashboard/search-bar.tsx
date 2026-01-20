"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { searchGlobal, SearchResult } from "@/lib/actions/search";

export function SearchBar() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isPending, startTransition] = useTransition();

    // Open with Ctrl+K or Cmd+K
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    // Debounced Search Effect
    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(() => {
            startTransition(async () => {
                const data = await searchGlobal(query);
                setResults(data);
            });
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSelect = (url: string) => {
        setOpen(false);
        router.push(url);
    };

    const invoices = results.filter((r) => r.type === "invoice");
    const customers = results.filter((r) => r.type === "customer");

    return (
        <>
            <Button
                variant="outline"
                className="relative h-9 w-full justify-start rounded-[0.5rem] bg-background text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-56 lg:w-72"
                onClick={() => setOpen(true)}
            >
                <Search className="mr-2 h-4 w-4" />
                <span className="hidden lg:inline-flex">Search...</span>
                <span className="inline-flex lg:hidden">Search...</span>
                <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </Button>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput
                    placeholder="Type a command or search..."
                    value={query}
                    onValueChange={setQuery}
                />
                <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>

                    {invoices.length > 0 && (
                        <CommandGroup heading="Invoices">
                            {invoices.map((result) => (
                                <CommandItem
                                    key={result.id}
                                    value={`${result.title} ${result.subtitle}`} // Helps fuzzy filtering if Command filters locally too. Ideally we rely on server results.
                                    onSelect={() => handleSelect(result.url)}
                                >
                                    <Search className="mr-2 h-4 w-4 opacity-50" />
                                    <div className="flex flex-col">
                                        <span>{result.title}</span>
                                        <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {invoices.length > 0 && customers.length > 0 && <CommandSeparator />}

                    {customers.length > 0 && (
                        <CommandGroup heading="Customers">
                            {customers.map((result) => (
                                <CommandItem
                                    key={result.id}
                                    value={`${result.title} ${result.subtitle}`}
                                    onSelect={() => handleSelect(result.url)}
                                >
                                    <Search className="mr-2 h-4 w-4 opacity-50" />
                                    <div className="flex flex-col">
                                        <span>{result.title}</span>
                                        <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {results.length === 0 && !isPending && query.length >= 2 && (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No matching results found
                        </div>
                    )}
                </CommandList>
            </CommandDialog>
        </>
    );
}
