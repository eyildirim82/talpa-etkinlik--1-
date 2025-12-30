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
            events: {
                Row: {
                    id: string
                    title: string
                    description: string | null
                    image_url: string | null
                    event_date: string
                    location: string
                    price: number
                    currency: string
                    total_quota: number
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    description?: string | null
                    image_url?: string | null
                    event_date: string
                    location: string
                    price?: number
                    currency?: string
                    total_quota?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    description?: string | null
                    image_url?: string | null
                    event_date?: string
                    location?: string
                    price?: number
                    currency?: string
                    total_quota?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            profiles: {
                Row: {
                    id: string
                    full_name: string
                    talpa_sicil_no: string | null
                    phone: string | null
                    role: 'admin' | 'member'
                    created_at: string
                    updated_at: string
                }
            }
            tickets: {
                Row: {
                    id: string
                    event_id: string
                    user_id: string
                    seat_number: string | null
                    qr_code: string
                    status: 'pending' | 'paid' | 'cancelled'
                    purchase_date: string
                    gate: string | null
                }
            }
        }
        Views: {
            active_event_view: {
                Row: Database['public']['Tables']['events']['Row'] & {
                    remaining_stock: number
                }
            }
        }
    }
}
