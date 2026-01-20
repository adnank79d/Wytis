"use client"

import { useState, useEffect } from "react"
import { Bell, Check, Info, AlertTriangle, XCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getNotifications, markAsRead, markAllAsRead, type Notification } from "@/lib/actions/notifications"
import { cn } from "@/lib/utils"

export function NotificationsPopover() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [open, setOpen] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(false)

    const fetchNotifications = async () => {
        setLoading(true)
        try {
            const data = await getNotifications()
            setNotifications(data)
            setUnreadCount(data.filter(n => !n.read).length)
        } catch (error) {
            console.error("Failed to fetch notifications", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchNotifications()
        // Optional: Polling every minute
        const interval = setInterval(fetchNotifications, 60000)
        return () => clearInterval(interval)
    }, [])

    const handleMarkAsRead = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))

        await markAsRead(id)
    }

    const handleMarkAllAsRead = async () => {
        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)

        await markAllAsRead()
    }

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />
            case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
            case 'error': return <XCircle className="h-4 w-4 text-red-500" />
            default: return <Info className="h-4 w-4 text-blue-500" />
        }
    }

    return (
        <Popover open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen)
            if (isOpen) fetchNotifications()
        }}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600 ring-2 ring-background" />
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold text-sm">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto px-2 text-xs text-muted-foreground hover:text-foreground"
                            onClick={handleMarkAllAsRead}
                        >
                            Mark all as read
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground">
                            <Bell className="h-8 w-8 mb-2 opacity-20" />
                            <p className="text-sm">No notifications</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "flex gap-3 p-4 transition-colors hover:bg-muted/50",
                                        !notification.read && "bg-muted/20"
                                    )}
                                >
                                    <div className="mt-1 flex-shrink-0">
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className={cn("text-sm font-medium leading-none", !notification.read && "font-semibold")}>
                                            {notification.title}
                                        </p>
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-muted-foreground/60 mt-1">
                                            {new Date(notification.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    {!notification.read && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
                                            onClick={() => handleMarkAsRead(notification.id)}
                                        >
                                            <span className="sr-only">Mark as read</span>
                                            <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}
