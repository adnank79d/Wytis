export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          business_id: string | null
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          business_id?: string | null
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          business_id?: string | null
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_reconciliations: {
        Row: {
          bank_transaction_id: string
          business_id: string
          id: string
          ledger_transaction_id: string
          match_score: number | null
          matched_at: string
          matched_by: string | null
        }
        Insert: {
          bank_transaction_id: string
          business_id: string
          id?: string
          ledger_transaction_id: string
          match_score?: number | null
          matched_at?: string
          matched_by?: string | null
        }
        Update: {
          bank_transaction_id?: string
          business_id?: string
          id?: string
          ledger_transaction_id?: string
          match_score?: number | null
          matched_at?: string
          matched_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_reconciliations_bank_transaction_id_fkey"
            columns: ["bank_transaction_id"]
            isOneToOne: true
            referencedRelation: "bank_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_reconciliations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_reconciliations_ledger_transaction_id_fkey"
            columns: ["ledger_transaction_id"]
            isOneToOne: true
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transactions: {
        Row: {
          amount: number
          bank_account_name: string
          business_id: string
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          status: string
          transaction_date: string
        }
        Insert: {
          amount: number
          bank_account_name: string
          business_id: string
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          status?: string
          transaction_date: string
        }
        Update: {
          amount?: number
          bank_account_name?: string
          business_id?: string
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          status?: string
          transaction_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          created_at: string | null
          currency: string | null
          gst_number: string | null
          id: string
          name: string
          pincode: string | null
          state: string | null
          subscription_status: string | null
          trial_ends_at: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string | null
          currency?: string | null
          gst_number?: string | null
          id?: string
          name: string
          pincode?: string | null
          state?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string | null
          currency?: string | null
          gst_number?: string | null
          id?: string
          name?: string
          pincode?: string | null
          state?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
        }
        Relationships: []
      }
      customer_interactions: {
        Row: {
          business_id: string
          created_at: string | null
          created_by: string | null
          customer_id: string
          details: string | null
          id: string
          interaction_date: string | null
          type: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          created_by?: string | null
          customer_id: string
          details?: string | null
          id?: string
          interaction_date?: string | null
          type: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          created_by?: string | null
          customer_id?: string
          details?: string | null
          id?: string
          interaction_date?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_interactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_interactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_interactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          business_id: string
          company_name: string | null
          created_at: string | null
          email: string | null
          gst_number: string | null
          id: string
          last_contacted_at: string | null
          name: string
          phone: string | null
          status: string | null
          tags: string[] | null
          tax_id: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          business_id: string
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          gst_number?: string | null
          id?: string
          last_contacted_at?: string | null
          name: string
          phone?: string | null
          status?: string | null
          tags?: string[] | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          business_id?: string
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          gst_number?: string | null
          id?: string
          last_contacted_at?: string | null
          name?: string
          phone?: string | null
          status?: string | null
          tags?: string[] | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          business_id: string
          created_at: string | null
          department: string | null
          designation: string | null
          email: string | null
          first_name: string
          id: string
          joined_at: string
          last_name: string
          phone: string | null
          salary_amount: number
          status: string
          updated_at: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          department?: string | null
          designation?: string | null
          email?: string | null
          first_name: string
          id?: string
          joined_at?: string
          last_name: string
          phone?: string | null
          salary_amount?: number
          status?: string
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          department?: string | null
          designation?: string | null
          email?: string | null
          first_name?: string
          id?: string
          joined_at?: string
          last_name?: string
          phone?: string | null
          salary_amount?: number
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          business_id: string
          category: string
          created_at: string | null
          description: string
          employee_id: string | null
          expense_date: string
          gst_amount: number | null
          hsn_code: string | null
          id: string
          notes: string | null
          payment_method: string
          receipt_url: string | null
          status: string
          supplier_gstin: string | null
          taxable_value: number | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          business_id: string
          category: string
          created_at?: string | null
          description: string
          employee_id?: string | null
          expense_date?: string
          gst_amount?: number | null
          hsn_code?: string | null
          id?: string
          notes?: string | null
          payment_method: string
          receipt_url?: string | null
          status?: string
          supplier_gstin?: string | null
          taxable_value?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          business_id?: string
          category?: string
          created_at?: string | null
          description?: string
          employee_id?: string | null
          expense_date?: string
          gst_amount?: number | null
          hsn_code?: string | null
          id?: string
          notes?: string | null
          payment_method?: string
          receipt_url?: string | null
          status?: string
          supplier_gstin?: string | null
          taxable_value?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      grn: {
        Row: {
          business_id: string
          created_at: string
          created_by: string | null
          grn_number: string
          id: string
          notes: string | null
          po_id: string
          received_date: string
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by?: string | null
          grn_number: string
          id?: string
          notes?: string | null
          po_id: string
          received_date?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string | null
          grn_number?: string
          id?: string
          notes?: string | null
          po_id?: string
          received_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "grn_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grn_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      grn_items: {
        Row: {
          grn_id: string
          id: string
          po_item_id: string
          quantity_received: number
        }
        Insert: {
          grn_id: string
          id?: string
          po_item_id: string
          quantity_received: number
        }
        Update: {
          grn_id?: string
          id?: string
          po_item_id?: string
          quantity_received?: number
        }
        Relationships: [
          {
            foreignKeyName: "grn_items_grn_id_fkey"
            columns: ["grn_id"]
            isOneToOne: false
            referencedRelation: "grn"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grn_items_po_item_id_fkey"
            columns: ["po_item_id"]
            isOneToOne: false
            referencedRelation: "po_items"
            referencedColumns: ["id"]
          },
        ]
      }
      gst_records: {
        Row: {
          amount: number
          business_id: string
          created_at: string | null
          gst_direction: string
          gst_type: string
          id: string
          source_id: string
          source_type: string
          tax_period: string
        }
        Insert: {
          amount?: number
          business_id: string
          created_at?: string | null
          gst_direction?: string
          gst_type: string
          id?: string
          source_id: string
          source_type: string
          tax_period: string
        }
        Update: {
          amount?: number
          business_id?: string
          created_at?: string | null
          gst_direction?: string
          gst_type?: string
          id?: string
          source_id?: string
          source_type?: string
          tax_period?: string
        }
        Relationships: [
          {
            foreignKeyName: "gst_records_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_categories: {
        Row: {
          business_id: string
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_categories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          movement_type: string
          notes: string | null
          product_id: string
          quantity: number
          reference: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          movement_type: string
          notes?: string | null
          product_id: string
          quantity: number
          reference?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          movement_type?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_products: {
        Row: {
          business_id: string
          category_id: string | null
          cost_price: number | null
          created_at: string | null
          description: string | null
          gst_rate: number | null
          hsn_code: string | null
          id: string
          is_active: boolean | null
          name: string
          prices_include_tax: boolean
          quantity: number
          reorder_level: number | null
          sku: string | null
          unit: string | null
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          business_id: string
          category_id?: string | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          gst_rate?: number | null
          hsn_code?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          prices_include_tax?: boolean
          quantity?: number
          reorder_level?: number | null
          sku?: string | null
          unit?: string | null
          unit_price?: number
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          category_id?: string | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          gst_rate?: number | null
          hsn_code?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          prices_include_tax?: boolean
          quantity?: number
          reorder_level?: number | null
          sku?: string | null
          unit?: string | null
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "inventory_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          cost_price: number | null
          created_at: string | null
          description: string
          gst_rate: number
          id: string
          invoice_id: string
          line_total: number
          product_id: string | null
          quantity: number
          unit_price: number
        }
        Insert: {
          cost_price?: number | null
          created_at?: string | null
          description: string
          gst_rate?: number
          id?: string
          invoice_id: string
          line_total?: number
          product_id?: string | null
          quantity?: number
          unit_price?: number
        }
        Update: {
          cost_price?: number | null
          created_at?: string | null
          description?: string
          gst_rate?: number
          id?: string
          invoice_id?: string
          line_total?: number
          product_id?: string | null
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_receivables_view"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "gstr1_view"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "overdue_invoices_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          business_id: string
          created_at: string | null
          customer_id: string | null
          customer_name: string
          due_date: string | null
          gst_amount: number
          id: string
          invoice_date: string
          invoice_number: string
          notes: string | null
          paid_at: string | null
          status: string
          subtotal: number
          total_amount: number
          updated_at: string | null
          void_reason: string | null
          voided_at: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          customer_id?: string | null
          customer_name: string
          due_date?: string | null
          gst_amount?: number
          id?: string
          invoice_date: string
          invoice_number: string
          notes?: string | null
          paid_at?: string | null
          status?: string
          subtotal?: number
          total_amount?: number
          updated_at?: string | null
          void_reason?: string | null
          voided_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string
          due_date?: string | null
          gst_amount?: number
          id?: string
          invoice_date?: string
          invoice_number?: string
          notes?: string | null
          paid_at?: string | null
          status?: string
          subtotal?: number
          total_amount?: number
          updated_at?: string | null
          void_reason?: string | null
          voided_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          account_name: string
          business_id: string
          created_at: string | null
          credit: number
          debit: number
          id: string
          transaction_id: string
        }
        Insert: {
          account_name: string
          business_id: string
          created_at?: string | null
          credit?: number
          debit?: number
          id?: string
          transaction_id: string
        }
        Update: {
          account_name?: string
          business_id?: string
          created_at?: string | null
          credit?: number
          debit?: number
          id?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          business_id: string | null
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          business_id: string
          created_at: string | null
          id: string
          invoice_id: string | null
          notes: string | null
          party_name: string
          payment_date: string
          payment_method: string
          payment_type: string
          reference_number: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          amount?: number
          business_id: string
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          party_name: string
          payment_date?: string
          payment_method?: string
          payment_type: string
          reference_number?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          business_id?: string
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          party_name?: string
          payment_date?: string
          payment_method?: string
          payment_type?: string
          reference_number?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_receivables_view"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "gstr1_view"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "overdue_invoices_view"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_runs: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          month: number
          status: string
          total_amount: number | null
          updated_at: string | null
          year: number
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          month: number
          status?: string
          total_amount?: number | null
          updated_at?: string | null
          year: number
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          month?: number
          status?: string
          total_amount?: number | null
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "payroll_runs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      payslips: {
        Row: {
          allowances: number
          basic_salary: number
          business_id: string
          created_at: string | null
          deductions: number
          employee_id: string
          id: string
          net_salary: number | null
          payment_date: string | null
          run_id: string
          status: string
        }
        Insert: {
          allowances?: number
          basic_salary?: number
          business_id: string
          created_at?: string | null
          deductions?: number
          employee_id: string
          id?: string
          net_salary?: number | null
          payment_date?: string | null
          run_id: string
          status?: string
        }
        Update: {
          allowances?: number
          basic_salary?: number
          business_id?: string
          created_at?: string | null
          deductions?: number
          employee_id?: string
          id?: string
          net_salary?: number | null
          payment_date?: string | null
          run_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payslips_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payslips_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payslips_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "payroll_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      po_items: {
        Row: {
          description: string
          id: string
          line_total: number | null
          po_id: string
          product_id: string | null
          quantity: number
          unit_price: number
        }
        Insert: {
          description: string
          id?: string
          line_total?: number | null
          po_id: string
          product_id?: string | null
          quantity: number
          unit_price: number
        }
        Update: {
          description?: string
          id?: string
          line_total?: number | null
          po_id?: string
          product_id?: string | null
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "po_items_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      prices: {
        Row: {
          active: boolean | null
          currency: string | null
          description: string | null
          id: string
          interval: Database["public"]["Enums"]["pricing_plan_interval"] | null
          interval_count: number | null
          metadata: Json | null
          product_id: string | null
          trial_period_days: number | null
          type: Database["public"]["Enums"]["pricing_type"] | null
          unit_amount: number | null
        }
        Insert: {
          active?: boolean | null
          currency?: string | null
          description?: string | null
          id: string
          interval?: Database["public"]["Enums"]["pricing_plan_interval"] | null
          interval_count?: number | null
          metadata?: Json | null
          product_id?: string | null
          trial_period_days?: number | null
          type?: Database["public"]["Enums"]["pricing_type"] | null
          unit_amount?: number | null
        }
        Update: {
          active?: boolean | null
          currency?: string | null
          description?: string | null
          id?: string
          interval?: Database["public"]["Enums"]["pricing_plan_interval"] | null
          interval_count?: number | null
          metadata?: Json | null
          product_id?: string | null
          trial_period_days?: number | null
          type?: Database["public"]["Enums"]["pricing_type"] | null
          unit_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean | null
          cost_price: number
          description: string | null
          id: string
          image: string | null
          metadata: Json | null
          name: string | null
        }
        Insert: {
          active?: boolean | null
          cost_price?: number
          description?: string | null
          id: string
          image?: string | null
          metadata?: Json | null
          name?: string | null
        }
        Update: {
          active?: boolean | null
          cost_price?: number
          description?: string | null
          id?: string
          image?: string | null
          metadata?: Json | null
          name?: string | null
        }
        Relationships: []
      }
      purchase_orders: {
        Row: {
          business_id: string
          created_at: string
          expected_date: string | null
          id: string
          notes: string | null
          po_date: string
          po_number: string
          status: string
          total_amount: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          expected_date?: string | null
          id?: string
          notes?: string | null
          po_date?: string
          po_number: string
          status?: string
          total_amount?: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          expected_date?: string | null
          id?: string
          notes?: string | null
          po_date?: string
          po_number?: string
          status?: string
          total_amount?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_files: {
        Row: {
          bucket_id: string
          business_id: string
          content_type: string | null
          created_at: string
          created_by: string | null
          file_path: string
          id: string
          size_bytes: number
        }
        Insert: {
          bucket_id: string
          business_id: string
          content_type?: string | null
          created_at?: string
          created_by?: string | null
          file_path: string
          id?: string
          size_bytes?: number
        }
        Update: {
          bucket_id?: string
          business_id?: string
          content_type?: string | null
          created_at?: string
          created_by?: string | null
          file_path?: string
          id?: string
          size_bytes?: number
        }
        Relationships: [
          {
            foreignKeyName: "storage_files_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_customers: {
        Row: {
          business_id: string
          stripe_customer_id: string | null
        }
        Insert: {
          business_id: string
          stripe_customer_id?: string | null
        }
        Update: {
          business_id?: string
          stripe_customer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stripe_customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          business_id: string
          cancel_at: string | null
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created: string
          current_period_end: string
          current_period_start: string
          ended_at: string | null
          id: string
          metadata: Json | null
          price_id: string | null
          quantity: number | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          trial_end: string | null
          trial_start: string | null
        }
        Insert: {
          business_id: string
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created?: string
          current_period_end?: string
          current_period_start?: string
          ended_at?: string | null
          id: string
          metadata?: Json | null
          price_id?: string | null
          quantity?: number | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          trial_end?: string | null
          trial_start?: string | null
        }
        Update: {
          business_id?: string
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created?: string
          current_period_end?: string
          current_period_start?: string
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          price_id?: string | null
          quantity?: number | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          trial_end?: string | null
          trial_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "prices"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          business_id: string
          created_at: string | null
          description: string | null
          id: string
          source_id: string
          source_type: string
          transaction_date: string
          transaction_type: string
        }
        Insert: {
          amount?: number
          business_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          source_id: string
          source_type: string
          transaction_date?: string
          transaction_type: string
        }
        Update: {
          amount?: number
          business_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          source_id?: string
          source_type?: string
          transaction_date?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      accounts_payable_view: {
        Row: {
          business_id: string | null
          total_payable: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts_receivable_view: {
        Row: {
          business_id: string | null
          total_receivable: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      balance_sheet_view: {
        Row: {
          account_name: string | null
          amount: number | null
          business_id: string | null
          type: string | null
        }
        Relationships: []
      }
      cash_balance_view: {
        Row: {
          bank_balance: number | null
          business_id: string | null
          cash_balance: number | null
          total_cash: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_receivables_view: {
        Row: {
          business_id: string | null
          customer_name: string | null
          invoice_id: string | null
          invoice_number: string | null
          outstanding_amount: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_metrics_view: {
        Row: {
          accounts_payable: number | null
          accounts_receivable: number | null
          bank_balance: number | null
          business_id: string | null
          cash_balance: number | null
          gst_input: number | null
          gst_output: number | null
          gst_payable: number | null
          has_data: boolean | null
          net_profit: number | null
          payables: number | null
          receivables: number | null
          revenue: number | null
          sales: number | null
          total_cash: number | null
          total_expense: number | null
          total_income: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
      expense_view: {
        Row: {
          business_id: string | null
          total_expense: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      gst_payable_view: {
        Row: {
          business_id: string | null
          gst_input: number | null
          gst_output: number | null
          gst_payable: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      gst_summary_view: {
        Row: {
          business_id: string | null
          gst_type: string | null
          tax_period: string | null
          total_payable: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gst_records_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      gstr1_view: {
        Row: {
          business_id: string | null
          customer_gstin: string | null
          customer_name: string | null
          invoice_date: string | null
          invoice_id: string | null
          invoice_number: string | null
          invoice_type: string | null
          invoice_value: number | null
          status: string | null
          taxable_value: number | null
          total_tax: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      gstr2_view: {
        Row: {
          business_id: string | null
          category: string | null
          description: string | null
          expense_date: string | null
          expense_id: string | null
          hsn_code: string | null
          input_tax: number | null
          supplier_gstin: string | null
          taxable_value: number | null
          total_value: number | null
        }
        Insert: {
          business_id?: string | null
          category?: string | null
          description?: string | null
          expense_date?: string | null
          expense_id?: string | null
          hsn_code?: string | null
          input_tax?: number | null
          supplier_gstin?: string | null
          taxable_value?: never
          total_value?: number | null
        }
        Update: {
          business_id?: string | null
          category?: string | null
          description?: string | null
          expense_date?: string | null
          expense_id?: string | null
          hsn_code?: string | null
          input_tax?: number | null
          supplier_gstin?: string | null
          taxable_value?: never
          total_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      net_profit_view: {
        Row: {
          business_id: string | null
          net_profit: number | null
          total_expense: number | null
          total_income: number | null
        }
        Relationships: []
      }
      overdue_invoices_view: {
        Row: {
          business_id: string | null
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          days_overdue: number | null
          due_date: string | null
          due_status: string | null
          gst_amount: number | null
          id: string | null
          invoice_date: string | null
          invoice_number: string | null
          notes: string | null
          paid_at: string | null
          status: string | null
          subtotal: number | null
          total_amount: number | null
          updated_at: string | null
          void_reason: string | null
          voided_at: string | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          days_overdue?: never
          due_date?: string | null
          due_status?: never
          gst_amount?: number | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          notes?: string | null
          paid_at?: string | null
          status?: string | null
          subtotal?: number | null
          total_amount?: number | null
          updated_at?: string | null
          void_reason?: string | null
          voided_at?: string | null
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          days_overdue?: never
          due_date?: string | null
          due_status?: never
          gst_amount?: number | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          notes?: string | null
          paid_at?: string | null
          status?: string | null
          subtotal?: number | null
          total_amount?: number | null
          updated_at?: string | null
          void_reason?: string | null
          voided_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_view: {
        Row: {
          business_id: string | null
          other_income: number | null
          sales: number | null
          service_revenue: number | null
          total_revenue: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      cancel_invoice: {
        Args: {
          p_business_id: string
          p_cancellation_reason?: string
          p_invoice_id: string
        }
        Returns: Json
      }
      check_business_access: { Args: { bid: string }; Returns: boolean }
      create_business_with_owner: {
        Args: {
          address_line1?: string
          address_line2?: string
          city?: string
          gst_number?: string
          name: string
          pincode?: string
          state?: string
        }
        Returns: string
      }
      delete_invoice_with_cleanup: {
        Args: { p_business_id: string; p_invoice_id: string }
        Returns: Json
      }
      expire_trial: { Args: { bid: string }; Returns: undefined }
      get_invoice_stats: {
        Args: { p_business_id: string }
        Returns: {
          collected_amount: number
          draft_count: number
          issued_count: number
          outstanding_amount: number
          overdue_amount: number
          overdue_count: number
          paid_count: number
          total_count: number
          total_revenue: number
          voided_count: number
        }[]
      }
      get_trial_info: {
        Args: { bid: string }
        Returns: {
          days_remaining: number
          is_active: boolean
          is_trial: boolean
          subscription_status: string
          trial_ends_at: string
        }[]
      }
      is_trial_active: { Args: { bid: string }; Returns: boolean }
      upgrade_to_paid: {
        Args: {
          bid: string
          p_price_id: string
          period_end: string
          subscription_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      pricing_plan_interval: "day" | "week" | "month" | "year"
      pricing_type: "one_time" | "recurring"
      subscription_status:
        | "trialing"
        | "active"
        | "canceled"
        | "incomplete"
        | "incomplete_expired"
        | "past_due"
        | "unpaid"
        | "paused"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      pricing_plan_interval: ["day", "week", "month", "year"],
      pricing_type: ["one_time", "recurring"],
      subscription_status: [
        "trialing",
        "active",
        "canceled",
        "incomplete",
        "incomplete_expired",
        "past_due",
        "unpaid",
        "paused",
      ],
    },
  },
} as const
