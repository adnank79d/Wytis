export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    business_name: string | null
                    plan_tier: 'free' | 'pro' | 'enterprise'
                    created_at: string
                    updated_at: string | null
                }
                Insert: {
                    id: string
                    business_name?: string | null
                    plan_tier?: 'free' | 'pro' | 'enterprise'
                    created_at?: string
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    business_name?: string | null
                    plan_tier?: 'free' | 'pro' | 'enterprise'
                    created_at?: string
                    updated_at?: string | null
                }
            }
            products: {
                Row: {
                    id: string
                    sku: string
                    name: string
                    stock_quantity: number
                    price: number
                    low_stock_threshold: number
                    created_at: string
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    sku: string
                    name: string
                    stock_quantity?: number
                    price: number
                    low_stock_threshold?: number
                    created_at?: string
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    sku?: string
                    name?: string
                    stock_quantity?: number
                    price?: number
                    low_stock_threshold?: number
                    created_at?: string
                    updated_at?: string | null
                }
            }
            invoices: {
                Row: {
                    id: string
                    client_name: string
                    total_amount: number
                    status: 'pending' | 'paid' | 'overdue' | 'cancelled'
                    created_at: string
                    due_date: string | null
                }
                Insert: {
                    id?: string
                    client_name: string
                    total_amount: number
                    status?: 'pending' | 'paid' | 'overdue' | 'cancelled'
                    created_at?: string
                    due_date?: string | null
                }
                Update: {
                    id?: string
                    client_name?: string
                    total_amount?: number
                    status?: 'pending' | 'paid' | 'overdue' | 'cancelled'
                    created_at?: string
                    due_date?: string | null
                }
            }
            daily_logs: {
                Row: {
                    id: string
                    date: string
                    total_cash: number
                    total_online: number
                    expenses: number
                    notes: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    date: string
                    total_cash?: number
                    total_online?: number
                    expenses?: number
                    notes?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    date?: string
                    total_cash?: number
                    total_online?: number
                    expenses?: number
                    notes?: string | null
                    created_at?: string
                }
            }
        }
    }
}
