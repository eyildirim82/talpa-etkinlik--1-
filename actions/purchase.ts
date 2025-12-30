// Client-side purchase actions for Vite

import { createClient } from '../utils/supabase/browser'

export async function buyTicket(eventId: string) {
  const supabase = createClient()

  // 1. Auth Check (RPC function also checks, but we check here for better UX)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, message: 'İşlem için giriş yapmalısınız.' }
  }

  try {
    // 2. Call Database RPC - Returns JSON with success, ticket data, or error
    const { data, error } = await supabase.rpc('purchase_ticket', {
      p_event_id: eventId
    })

    // Handle RPC call errors (network, permission, etc.)
    if (error) {
      console.error('Purchase RPC Error:', error)
      return { success: false, message: 'Bağlantı hatası. Lütfen tekrar deneyin.' }
    }

    // Handle business logic errors from function
    if (!data.success) {
      return { success: false, message: data.error || 'Bilet satın alınamadı.' }
    }

    // Success - Return ticket data
    return {
      success: true,
      ticket: data.ticket,
      message: 'Bilet başarıyla satın alındı!'
    }

  } catch (err) {
    console.error('Unexpected Error:', err)
    return { success: false, message: 'Beklenmeyen bir hata oluştu.' }
  }
}