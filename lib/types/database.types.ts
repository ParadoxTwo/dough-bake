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
          email: string
          role: 'customer' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'customer' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'customer' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          user_id: string
          name: string
          phone: string | null
          address: string | null
          city: string | null
          state: string | null
          postal_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          postal_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          postal_code?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          image_url: string | null
          category: string | null
          available: boolean
          stock_type: 'unlimited' | 'limited'
          stock_quantity: number | null
          slug: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          image_url?: string | null
          category?: string | null
          available?: boolean
          stock_type?: 'unlimited' | 'limited'
          stock_quantity?: number | null
          slug?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          image_url?: string | null
          category?: string | null
          available?: boolean
          stock_type?: 'unlimited' | 'limited'
          stock_quantity?: number | null
          slug?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          name: string
          slug: string
          description: string | null
          price_adjustment: number
          stock_type: 'unlimited' | 'limited'
          stock_quantity: number | null
          available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          name: string
          slug: string
          description?: string | null
          price_adjustment?: number
          stock_type?: 'unlimited' | 'limited'
          stock_quantity?: number | null
          available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          name?: string
          slug?: string
          description?: string | null
          price_adjustment?: number
          stock_type?: 'unlimited' | 'limited'
          stock_quantity?: number | null
          available?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      product_images: {
        Row: {
          id: string
          product_id: string
          variant_id: string | null
          storage_path: string
          original_url: string
          large_url: string
          medium_url: string
          small_url: string
          og_url: string
          thumbnail_url: string
          alt_text: string | null
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          variant_id?: string | null
          storage_path: string
          original_url: string
          large_url: string
          medium_url: string
          small_url: string
          og_url: string
          thumbnail_url: string
          alt_text?: string | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          variant_id?: string | null
          storage_path?: string
          original_url?: string
          large_url?: string
          medium_url?: string
          small_url?: string
          og_url?: string
          thumbnail_url?: string
          alt_text?: string | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      job_queue: {
        Row: {
          id: string
          job_type: 'create_product' | 'update_product' | 'process_images'
          status: 'pending' | 'processing' | 'completed' | 'failed'
          payload: Json
          result: Json | null
          error_message: string | null
          created_at: string
          started_at: string | null
          completed_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          job_type: 'create_product' | 'update_product' | 'process_images'
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          payload: Json
          result?: Json | null
          error_message?: string | null
          created_at?: string
          started_at?: string | null
          completed_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          job_type?: 'create_product' | 'update_product' | 'process_images'
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          payload?: Json
          result?: Json | null
          error_message?: string | null
          created_at?: string
          started_at?: string | null
          completed_at?: string | null
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          customer_id: string
          total_amount: number
          status: 'pending' | 'processing' | 'completed' | 'cancelled'
          payment_id: string | null
          payment_status: 'pending' | 'completed' | 'failed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          total_amount: number
          status?: 'pending' | 'processing' | 'completed' | 'cancelled'
          payment_id?: string | null
          payment_status?: 'pending' | 'completed' | 'failed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          total_amount?: number
          status?: 'pending' | 'processing' | 'completed' | 'cancelled'
          payment_id?: string | null
          payment_status?: 'pending' | 'completed' | 'failed'
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
          created_at?: string
        }
      }
      site_settings: {
        Row: {
          id: string
          key: string
          value: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: string
          created_at?: string
          updated_at?: string
        }
      }
      content_items: {
        Row: {
          id: string
          key: string
          value: string
          page: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: string
          page?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: string
          page?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

