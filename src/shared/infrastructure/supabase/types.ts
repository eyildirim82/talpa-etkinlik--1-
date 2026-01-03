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
                    id: number
                    title: string
                    description: string | null
                    banner_image: string | null
                    event_date: string
                    location_url: string | null
                    price: number
                    quota_asil: number
                    quota_yedek: number
                    cut_off_date: string
                    status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: number
                    title: string
                    description?: string | null
                    banner_image?: string | null
                    event_date: string
                    location_url?: string | null
                    price?: number
                    quota_asil: number
                    quota_yedek: number
                    cut_off_date: string
                    status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: number
                    title?: string
                    description?: string | null
                    banner_image?: string | null
                    event_date?: string
                    location_url?: string | null
                    price?: number
                    quota_asil?: number
                    quota_yedek?: number
                    cut_off_date?: string
                    status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
                    created_at?: string
                    updated_at?: string
                }
            }
            profiles: {
                Row: {
                    id: string
                    full_name: string
                    tckn: string | null
                    sicil_no: string | null
                    email: string | null
                    is_admin: boolean
                    talpa_sicil_no: string | null
                    phone: string | null
                    role: 'admin' | 'member' | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    full_name: string
                    tckn?: string | null
                    sicil_no?: string | null
                    email?: string | null
                    is_admin?: boolean
                    talpa_sicil_no?: string | null
                    phone?: string | null
                    role?: 'admin' | 'member'
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    full_name?: string
                    tckn?: string | null
                    sicil_no?: string | null
                    email?: string | null
                    is_admin?: boolean
                    talpa_sicil_no?: string | null
                    phone?: string | null
                    role?: 'admin' | 'member'
                    created_at?: string
                    updated_at?: string
                }
            }
            bookings: {
                Row: {
                    id: number
                    event_id: number
                    user_id: string
                    booking_date: string
                    queue_status: 'ASIL' | 'YEDEK' | 'IPTAL'
                    payment_status: 'WAITING' | 'PAID'
                    consent_kvkk: boolean
                    consent_payment: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: number
                    event_id: number
                    user_id: string
                    booking_date?: string
                    queue_status: 'ASIL' | 'YEDEK' | 'IPTAL'
                    payment_status?: 'WAITING' | 'PAID'
                    consent_kvkk?: boolean
                    consent_payment?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: number
                    event_id?: number
                    user_id?: string
                    booking_date?: string
                    queue_status?: 'ASIL' | 'YEDEK' | 'IPTAL'
                    payment_status?: 'WAITING' | 'PAID'
                    consent_kvkk?: boolean
                    consent_payment?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            ticket_pool: {
                Row: {
                    id: number
                    event_id: number
                    file_name: string
                    file_path: string
                    assigned_to: string | null
                    assigned_at: string | null
                    is_assigned: boolean
                    created_at: string
                }
                Insert: {
                    id?: number
                    event_id: number
                    file_name: string
                    file_path: string
                    assigned_to?: string | null
                    assigned_at?: string | null
                    is_assigned?: boolean
                    created_at?: string
                }
                Update: {
                    id?: number
                    event_id?: number
                    file_name?: string
                    file_path?: string
                    assigned_to?: string | null
                    assigned_at?: string | null
                    is_assigned?: boolean
                    created_at?: string
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
                Row: {
                    id: number
                    title: string
                    description: string | null
                    image_url: string | null
                    event_date: string
                    location: string | null
                    price: number
                    currency: string
                    total_quota: number
                    is_active: boolean
                    created_at: string
                    updated_at: string
                    remaining_stock: number
                }
            }
        }
        Functions: {
            join_event: {
                Args: {
                    event_id_param: number
                }
                Returns: {
                    status: 'success' | 'error'
                    queue?: 'ASIL' | 'YEDEK'
                    message: string
                }
            }
            assign_ticket: {
                Args: {
                    booking_id_param: number
                }
                Returns: {
                    status: 'success' | 'error'
                    ticket_id?: number
                    file_path?: string
                    message: string
                }
            }
            promote_from_waitlist: {
                Args: {
                    event_id_param: number
                }
                Returns: {
                    status: 'success' | 'info' | 'error'
                    user_id?: string
                    message: string
                }
            }
            set_active_event: {
                Args: {
                    event_id_param: number
                }
                Returns: {
                    success: boolean
                    error?: string
                    message?: string
                }
            }
        }
    }
}

